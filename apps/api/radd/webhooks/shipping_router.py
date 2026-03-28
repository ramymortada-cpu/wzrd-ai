"""
Shipping Webhooks — COD Shield

Receives shipping status updates from carriers or e-commerce platforms.
When a delivery fails, queues a verification call via COD Shield.

Supported events:
- delivery_failed: Carrier reports delivery failure
- customer_not_available: Customer didn't answer the door
- address_incorrect: Wrong delivery address
- returned_to_sender: Package returned

Endpoints:
- POST /api/v1/webhooks/shipping/generic    — generic format (any carrier)
- POST /api/v1/webhooks/shipping/salla      — Salla-specific format
- POST /api/v1/webhooks/shipping/shopify    — Shopify-specific format
"""

import json
import logging
from datetime import datetime, timezone

import redis.asyncio as aioredis
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

from radd.config import settings
from radd.webhooks.verify import (
    verify_salla_signature,
    verify_shopify_signature,
    verify_webhook_api_key,
)

logger = logging.getLogger("radd.webhooks.shipping")

router = APIRouter(prefix="/api/v1/webhooks/shipping", tags=["shipping-webhooks"])


# ─── Schemas ───

class ShippingEvent(BaseModel):
    """Unified shipping event — all carrier-specific formats convert to this."""

    order_id: str
    status_code: str  # delivery_failed | customer_not_available | address_incorrect | returned_to_sender | delivered
    carrier: str = "unknown"
    tracking_number: str = ""
    customer_phone: str | None = None
    customer_name: str | None = None
    store_name: str | None = None
    workspace_id: str | None = None
    raw_payload: dict | None = None


# Statuses that trigger a verification call
VERIFICATION_TRIGGERS = {
    "delivery_failed",
    "customer_not_available",
    "address_incorrect",
}

QUEUE_NAME = "cod_shield_calls"


# ─── Queue Helper ───

async def _enqueue_verification_call(event: ShippingEvent, redis_url: str) -> bool:
    """Add a verification call task to the COD Shield queue."""
    try:
        r = aioredis.from_url(redis_url, decode_responses=True)

        task = {
            "workspace_id": event.workspace_id or "",
            "order_id": event.order_id,
            "customer_phone": event.customer_phone or "",
            "customer_name": event.customer_name or "العميل",
            "store_name": event.store_name or "المتجر",
            "call_type": "shipping_verification",
            "metadata": {
                "carrier": event.carrier,
                "tracking_number": event.tracking_number,
                "shipping_status": event.status_code,
                "triggered_at": datetime.now(timezone.utc).isoformat(),
            },
        }

        await r.lpush(QUEUE_NAME, json.dumps(task, ensure_ascii=False))
        await r.aclose()

        logger.info(
            "Verification call queued: order=%s, status=%s, carrier=%s",
            event.order_id,
            event.status_code,
            event.carrier,
        )
        return True

    except Exception as e:
        logger.error("Failed to queue verification call for order %s: %s", event.order_id, e)
        return False


# ─── Generic Endpoint ───

class GenericShippingPayload(BaseModel):
    order_id: str
    status: str  # Will be mapped to status_code
    carrier: str = "unknown"
    tracking_number: str = ""
    customer_phone: str | None = None
    customer_name: str | None = None
    store_name: str | None = None
    workspace_id: str | None = None


def _require_webhook_auth(request: Request) -> None:
    """Verify X-Webhook-Secret when webhook_api_key is configured."""
    if not verify_webhook_api_key(
        request.headers.get("X-Webhook-Secret"),
        settings.webhook_api_key,
    ):
        raise HTTPException(status_code=401, detail="Invalid or missing webhook secret")


@router.post("/generic")
async def generic_shipping_webhook(payload: GenericShippingPayload, request: Request):
    """
    Generic shipping webhook — accepts a standardized format.
    Use this when integrating with any carrier that doesn't have a specific endpoint.

    When WEBHOOK_API_KEY is set, requests must include X-Webhook-Secret header.
    """
    _require_webhook_auth(request)

    # Map common status strings to our standard codes
    status_mapping = {
        "delivery_failed": "delivery_failed",
        "failed": "delivery_failed",
        "not_delivered": "delivery_failed",
        "customer_not_available": "customer_not_available",
        "no_answer": "customer_not_available",
        "customer_unavailable": "customer_not_available",
        "address_incorrect": "address_incorrect",
        "wrong_address": "address_incorrect",
        "returned_to_sender": "returned_to_sender",
        "returned": "returned_to_sender",
        "rts": "returned_to_sender",
        "delivered": "delivered",
        "completed": "delivered",
    }

    status_code = status_mapping.get(payload.status.lower(), payload.status.lower())

    event = ShippingEvent(
        order_id=payload.order_id,
        status_code=status_code,
        carrier=payload.carrier,
        tracking_number=payload.tracking_number,
        customer_phone=payload.customer_phone,
        customer_name=payload.customer_name,
        store_name=payload.store_name,
        workspace_id=payload.workspace_id,
        raw_payload=payload.model_dump(),
    )

    # Only queue verification for failure statuses
    if event.status_code in VERIFICATION_TRIGGERS:
        if not event.customer_phone:
            logger.warning("No phone for order %s — cannot verify", event.order_id)
            return {"status": "skipped", "reason": "no_customer_phone"}

        queued = await _enqueue_verification_call(event, settings.redis_url)
        return {"status": "queued" if queued else "queue_failed", "order_id": event.order_id}

    logger.info("Shipping event received but not a trigger: order=%s, status=%s", event.order_id, status_code)
    return {"status": "received", "action": "none", "order_id": event.order_id}


# ─── Salla-specific Endpoint ───

@router.post("/salla")
async def salla_shipping_webhook(request: Request):
    """
    Salla shipping webhook — receives Salla's order/shipment events.

    Salla sends events like:
    - order.shipping.update
    - order.status.updated

    When SALLA_WEBHOOK_SECRET is set, verifies X-Salla-Signature HMAC-SHA256.
    """
    from radd.config import settings

    body_bytes = await request.body()
    try:
        body = json.loads(body_bytes)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON")

    if settings.salla_webhook_secret:
        if not verify_salla_signature(
            body_bytes,
            request.headers.get("X-Salla-Signature"),
            settings.salla_webhook_secret,
        ):
            raise HTTPException(status_code=401, detail="Invalid Salla signature")

    logger.info("Salla shipping webhook received: %s", json.dumps(body, ensure_ascii=False)[:500])

    # Extract fields from Salla's format
    # NOTE: This is a best-guess mapping — adjust based on actual Salla webhook docs
    data = body.get("data", {})

    order_id = str(data.get("order_id", data.get("id", "")))
    shipping_data = data.get("shipping", {})
    shipping_status = shipping_data.get("status", "")
    customer = data.get("customer", {})

    # Map Salla statuses to our standard codes
    salla_status_map = {
        "failed": "delivery_failed",
        "returned": "returned_to_sender",
        "customer_not_available": "customer_not_available",
    }

    status_code = salla_status_map.get(shipping_status, shipping_status)

    # Carrier might be dict with "name" key
    carrier_raw = shipping_data.get("company", "unknown")
    carrier = carrier_raw.get("name", carrier_raw) if isinstance(carrier_raw, dict) else str(carrier_raw)

    event = ShippingEvent(
        order_id=order_id,
        status_code=status_code,
        carrier=carrier,
        tracking_number=shipping_data.get("tracking_number", ""),
        customer_phone=customer.get("mobile", customer.get("phone", "")),
        customer_name=customer.get("first_name", ""),
        store_name=body.get("merchant", {}).get("name", ""),
        workspace_id=None,  # TODO: resolve workspace from Salla merchant ID
        raw_payload=body,
    )

    if event.status_code in VERIFICATION_TRIGGERS and event.customer_phone:
        queued = await _enqueue_verification_call(event, settings.redis_url)
        return {"status": "queued" if queued else "queue_failed"}

    return {"status": "received", "action": "none"}


# ─── Shopify-specific Endpoint ───

@router.post("/shopify")
async def shopify_shipping_webhook(request: Request):
    """
    Shopify shipping webhook — receives Shopify fulfillment events.

    Shopify sends events via webhook topics like:
    - fulfillments/update
    - orders/fulfilled

    When SHOPIFY_WEBHOOK_SECRET is set, verifies X-Shopify-Hmac-SHA256.
    """
    from radd.config import settings

    body_bytes = await request.body()
    try:
        body = json.loads(body_bytes)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON")

    if settings.shopify_webhook_secret:
        if not verify_shopify_signature(
            body_bytes,
            request.headers.get("X-Shopify-Hmac-SHA256"),
            settings.shopify_webhook_secret,
        ):
            raise HTTPException(status_code=401, detail="Invalid Shopify signature")

    # Extract from Shopify format
    order_id = str(body.get("order_number", body.get("id", "")))

    # Shopify fulfillment statuses
    fulfillment_status = body.get("fulfillment_status", body.get("status", ""))

    shopify_status_map = {
        "failure": "delivery_failed",
        "cancelled": "returned_to_sender",
    }

    status_code = shopify_status_map.get(fulfillment_status, fulfillment_status)

    # Customer info
    shipping_address = body.get("shipping_address", body.get("destination", {}))
    customer_data = body.get("customer", {})

    event = ShippingEvent(
        order_id=order_id,
        status_code=status_code,
        carrier=body.get("tracking_company", "unknown"),
        tracking_number=body.get("tracking_number", ""),
        customer_phone=shipping_address.get("phone", customer_data.get("phone", "")),
        customer_name=shipping_address.get("first_name", customer_data.get("first_name", "")),
        store_name=None,
        workspace_id=None,  # TODO: resolve workspace from Shopify shop domain
        raw_payload=body,
    )

    if event.status_code in VERIFICATION_TRIGGERS and event.customer_phone:
        queued = await _enqueue_verification_call(event, settings.redis_url)
        return {"status": "queued" if queued else "queue_failed"}

    return {"status": "received", "action": "none"}
