from __future__ import annotations

"""Action protocol + dispatcher. Detects when pipeline should call external APIs."""
from dataclasses import dataclass


@dataclass
class ActionResult:
    action: str           # "order_status" | "none"
    response_text: str    # Pre-formatted Arabic response
    data: dict            # Raw API response for logging


async def detect_and_run_action(
    intent: str,
    message: str,
    dialect: str,
    workspace_config: dict,
) -> ActionResult | None:
    """
    Check if an intent maps to an external action. If so, run it.
    Returns ActionResult if action was taken, None if no action applies.
    """
    platform = (workspace_config.get("platform") or "salla").lower()
    salla_token = workspace_config.get("salla_access_token", "")
    store_name = workspace_config.get("store_name") or "متجرنا"

    # ── Order Status ──────────────────────────────────────────────────────────
    if intent == "order_status":
        from radd.actions.salla import extract_order_number

        order_number = extract_order_number(message)
        if not order_number:
            return None

        if platform == "shopify":
            from radd.actions.shopify import (
                ShopifyConfig,
                format_order_response_arabic as shopify_format,
                get_order_status as shopify_get_order_status,
            )
            shop_domain = workspace_config.get("shopify_domain", "")
            shop_token = workspace_config.get("shopify_access_token", "")
            if not shop_domain or not shop_token:
                return None
            config = ShopifyConfig(shop_domain=shop_domain, access_token=shop_token)
            result = await shopify_get_order_status(order_number, config)
            response = shopify_format(result, dialect, None, store_name)
            return ActionResult(
                action="order_status",
                response_text=response,
                data={
                    "order_id": result.order_id,
                    "order_number": result.order_number,
                    "status": result.status,
                    "error": result.error,
                },
            )

        if not salla_token:
            return None
        from radd.actions.salla import format_order_status_response, get_order_status
        order_data = await get_order_status(order_number, salla_token)
        response = format_order_status_response(order_data, dialect)
        return ActionResult(action="order_status", response_text=response, data=order_data)

    # ── Shipping Tracking ─────────────────────────────────────────────────────
    if intent == "shipping":
        from radd.actions.salla import extract_order_number
        from radd.actions.salla_advanced import format_tracking_response, track_shipment
        order_number = extract_order_number(message)
        if not order_number or not salla_token:
            return None

        result = await track_shipment(order_number, salla_token)
        if result.get("found") and result.get("tracking_number"):
            response = format_tracking_response(result, dialect)
            return ActionResult(action="track_shipment", response_text=response, data=result)
        return None

    # ── Cancel Order ──────────────────────────────────────────────────────────
    cancel_keywords = ["ألغي", "الغاء", "إلغاء", "ابغى الغي", "ابي الغي", "عايز الغي"]
    if any(kw in message for kw in cancel_keywords):
        from radd.actions.salla import extract_order_number
        from radd.actions.salla_advanced import cancel_order, format_cancel_response
        order_number = extract_order_number(message)
        if order_number and salla_token:
            result = await cancel_order(order_number, salla_token)
            response = format_cancel_response(result, dialect)
            return ActionResult(action="cancel_order", response_text=response, data=result)

    # ── Create Return ─────────────────────────────────────────────────────────
    return_keywords = ["أرجع", "إرجاع", "ارجع", "ابي ارجع", "ابغى ارجع", "عايز ارجع", "طلب إرجاع", "استرجاع"]
    if any(kw in message for kw in return_keywords):
        from radd.actions.salla import extract_order_number
        from radd.actions.salla_advanced import create_return_request, format_return_response
        order_number = extract_order_number(message)
        if order_number and salla_token:
            result = await create_return_request(order_number, salla_token)
            if result.get("success"):
                response = format_return_response(result, dialect)
                return ActionResult(action="create_return", response_text=response, data=result)

    return None
