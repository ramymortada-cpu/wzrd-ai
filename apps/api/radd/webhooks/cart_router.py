"""
Cart Webhooks — Abandoned cart events from Salla/Shopify.
"""

from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

from radd.config import settings
from radd.webhooks.verify import verify_webhook_api_key

logger = logging.getLogger("radd.webhooks.cart")

router = APIRouter(prefix="/webhooks/cart", tags=["cart-webhooks"])


class AbandonedCartPayload(BaseModel):
    order_id: Optional[str] = ""
    customer_phone: str
    customer_name: str = ""
    cart_items: list = []  # [{"name": "...", "price": 0, "quantity": 1}]
    cart_total: float = 0
    cart_url: str = ""
    store_name: str = ""
    workspace_id: str = ""
    dialect: str = "gulf"


def _require_webhook_auth(request: Request) -> None:
    """Verify X-Webhook-Secret when webhook_api_key is configured."""
    if not verify_webhook_api_key(
        request.headers.get("X-Webhook-Secret"),
        settings.webhook_api_key,
    ):
        raise HTTPException(status_code=401, detail="Invalid or missing webhook secret")


@router.post("/abandoned")
async def abandoned_cart_webhook(request: Request, payload: AbandonedCartPayload):
    """
    Trigger cart recovery funnel when a cart is abandoned.

    Can be called by:
    - Salla webhook (cart.abandoned event)
    - Shopify webhook (carts/update with checkout_token)
    - Manual trigger from dashboard

    When WEBHOOK_API_KEY is set, requests must include X-Webhook-Secret header.
    """
    _require_webhook_auth(request)

    from radd.sales.cart_recovery import CartRecoveryFunnel

    if not payload.customer_phone:
        raise HTTPException(status_code=400, detail="customer_phone required")

    funnel = CartRecoveryFunnel()
    result = await funnel.trigger(
        workspace_id=payload.workspace_id,
        customer_phone=payload.customer_phone,
        customer_name=payload.customer_name,
        cart_items=payload.cart_items,
        cart_total=payload.cart_total,
        store_name=payload.store_name,
        dialect=payload.dialect,
        cart_url=payload.cart_url,
    )

    return result


@router.post("/purchased")
async def cart_purchased_webhook(request: Request):
    """
    Cancel active funnels when customer completes purchase.

    Called by Salla/Shopify order.completed webhook.

    When WEBHOOK_API_KEY is set, requests must include X-Webhook-Secret header.
    """
    _require_webhook_auth(request)

    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON")

    customer_phone = body.get("customer", {}).get("phone", body.get("customer_phone", ""))
    order_id = body.get("order_id", body.get("id", ""))
    order_total = body.get("total", body.get("total_price", 0))
    workspace_id = body.get("workspace_id", "")

    logger.info("Purchase completed: order=%s, phone=%s", order_id, customer_phone)

    # Record revenue attribution
    if workspace_id and order_total:
        try:
            from radd.revenue.attribution import record_revenue_event

            await record_revenue_event(
                event_type="cart_recovered",
                order_id=str(order_id),
                order_value=float(order_total),
                workspace_id=workspace_id,
                source="cart_recovery_funnel",
            )
        except Exception as e:
            logger.warning("Revenue attribution failed: %s", e)

    # TODO: Cancel active funnel for this customer
    # Need to look up funnel_id by customer_phone

    return {"status": "received", "order_id": order_id}
