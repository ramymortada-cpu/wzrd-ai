# apps/api/radd/actions/shopify.py
"""
RADD AI — Shopify Integration
نفس نمط radd/actions/salla.py بالضبط
"""

import httpx
import logging
from dataclasses import dataclass
from typing import Optional

logger = logging.getLogger(__name__)

# ── Data Models ───────────────────────────────────────────────

@dataclass
class ShopifyOrderResult:
    order_id: str
    order_number: str
    status: str                        # open | closed | cancelled
    fulfillment_status: Optional[str]  # fulfilled | partial | null
    tracking_number: Optional[str]
    tracking_url: Optional[str]
    estimated_delivery: Optional[str]
    items_summary: str                 # "2 منتجات"
    total_price: str                   # "250.00 SAR"
    error: Optional[str] = None

@dataclass
class ShopifyConfig:
    shop_domain: str    # mystore.myshopify.com
    access_token: str   # Admin API access token (offline token)

# ── Order Status ──────────────────────────────────────────────

async def get_order_status(
    order_identifier: str,
    config: ShopifyConfig,
) -> ShopifyOrderResult:
    """
    استعلام حالة الطلب من Shopify Admin API.
    order_identifier: رقم الطلب (#1001) أو order ID الداخلي
    """
    headers = {
        "X-Shopify-Access-Token": config.access_token,
        "Content-Type": "application/json",
    }

    # نظّف رقم الطلب — أزل # إن وُجد
    clean_id = order_identifier.lstrip("#").strip()

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:

            # جرّب أولاً بـ order_number (الأكثر شيوعاً في رسائل العملاء)
            url = (
                f"https://{config.shop_domain}/admin/api/2024-01/orders.json"
                f"?name=%23{clean_id}&status=any&fields="
                "id,order_number,financial_status,fulfillment_status,"
                "fulfillments,line_items,total_price,currency"
            )
            resp = await client.get(url, headers=headers)
            resp.raise_for_status()
            data = resp.json()

            orders = data.get("orders", [])

            # إذا مفيش نتائج بالـ name، جرب بالـ ID مباشرة
            if not orders and clean_id.isdigit():
                url2 = (
                    f"https://{config.shop_domain}/admin/api/2024-01/orders/{clean_id}.json"
                    f"?fields=id,order_number,financial_status,fulfillment_status,"
                    "fulfillments,line_items,total_price,currency"
                )
                resp2 = await client.get(url2, headers=headers)
                if resp2.status_code == 200:
                    orders = [resp2.json().get("order", {})]

            if not orders:
                return ShopifyOrderResult(
                    order_id=clean_id,
                    order_number=clean_id,
                    status="not_found",
                    fulfillment_status=None,
                    tracking_number=None,
                    tracking_url=None,
                    estimated_delivery=None,
                    items_summary="",
                    total_price="",
                    error="order_not_found",
                )

            order = orders[0]
            fulfillments = order.get("fulfillments", [])
            tracking_number = None
            tracking_url = None

            if fulfillments:
                latest = fulfillments[-1]
                tracking_number = latest.get("tracking_number")
                tracking_url = latest.get("tracking_url")

            items = order.get("line_items", [])
            items_count = len(items)
            items_summary = f"{items_count} {'منتج' if items_count == 1 else 'منتجات'}"

            currency = order.get("currency", "SAR")
            total = order.get("total_price", "0.00")

            return ShopifyOrderResult(
                order_id=str(order.get("id", clean_id)),
                order_number=str(order.get("order_number", clean_id)),
                status=order.get("financial_status", "unknown"),
                fulfillment_status=order.get("fulfillment_status"),
                tracking_number=tracking_number,
                tracking_url=tracking_url,
                estimated_delivery=None,  # Shopify لا يوفر هذا مباشرة
                items_summary=items_summary,
                total_price=f"{total} {currency}",
            )

    except httpx.HTTPStatusError as e:
        logger.warning(
            "shopify.api_error",
            status=e.response.status_code,
            order=clean_id,
            shop=config.shop_domain,
        )
        return ShopifyOrderResult(
            order_id=clean_id,
            order_number=clean_id,
            status="error",
            fulfillment_status=None,
            tracking_number=None,
            tracking_url=None,
            estimated_delivery=None,
            items_summary="",
            total_price="",
            error=f"shopify_api_{e.response.status_code}",
        )
    except Exception as e:
        logger.error("shopify.unexpected_error", error=str(e), order=clean_id)
        return ShopifyOrderResult(
            order_id=clean_id,
            order_number=clean_id,
            status="error",
            fulfillment_status=None,
            tracking_number=None,
            tracking_url=None,
            estimated_delivery=None,
            items_summary="",
            total_price="",
            error="unexpected_error",
        )


# ── Arabic Response Formatter ─────────────────────────────────

def format_order_response_arabic(
    result: ShopifyOrderResult,
    dialect: str = "gulf",
    customer_name: Optional[str] = None,
    store_name: Optional[str] = None,
) -> str:
    """
    نفس نمط salla.py — يولّد رد عربي dialect-aware.
    dialect: gulf | egyptian | msa
    """
    if result.error == "order_not_found":
        msgs = {
            "gulf": f"ما لقينا طلب برقم {result.order_number}. تأكد من الرقم وأعد المحاولة.",
            "egyptian": f"مش لاقيين طلب برقم {result.order_number}. تأكد من الرقم وحاول تاني.",
            "msa": f"لم نتمكن من إيجاد الطلب رقم {result.order_number}. يُرجى التأكد من الرقم.",
        }
        return msgs.get(dialect, msgs["msa"])

    if result.error:
        msgs = {
            "gulf": "ما قدرنا نجيب تفاصيل الطلب الحين. سنحيلك لأحد فريقنا.",
            "egyptian": "مش قادرين نجيب تفاصيل الأوردر دلوقتي. هنحولك لحد من الفريق.",
            "msa": "تعذّر استرجاع تفاصيل الطلب. سيتولى أحد ممثلينا مساعدتك.",
        }
        return msgs.get(dialect, msgs["msa"])

    # ترجمة حالات الطلب
    status_map = {
        "paid":       {"gulf": "مدفوع",       "egyptian": "مدفوع",          "msa": "مدفوع"},
        "pending":    {"gulf": "قيد المعالجة", "egyptian": "بيتعالج",        "msa": "قيد المعالجة"},
        "refunded":   {"gulf": "مسترجع",       "egyptian": "اترجعله فلوسه",  "msa": "تمّ الاسترداد"},
        "cancelled":  {"gulf": "ملغي",         "egyptian": "اتلغى",          "msa": "ملغى"},
        "voided":     {"gulf": "ملغي",         "egyptian": "اتلغى",          "msa": "ملغى"},
    }

    fulfillment_map = {
        "fulfilled":  {"gulf": "تم الشحن ✅",  "egyptian": "اتشحن ✅",       "msa": "تمّ الشحن ✅"},
        "partial":    {"gulf": "شُحن جزئياً",  "egyptian": "اتشحن جزء منه", "msa": "شُحن جزئياً"},
        None:         {"gulf": "قيد التجهيز",  "egyptian": "بيتجهز",         "msa": "قيد التجهيز"},
    }

    status_label = (
        status_map.get(result.status, {}).get(dialect)
        or status_map.get(result.status, {}).get("msa")
        or result.status
    )

    fulfillment_label = (
        fulfillment_map.get(result.fulfillment_status, fulfillment_map[None]).get(dialect)
        or fulfillment_map[None]["msa"]
    )

    # بناء الرد حسب اللهجة
    if dialect == "gulf":
        msg = (
            f"طلبك رقم #{result.order_number} — "
            f"الحالة: {status_label} | الشحن: {fulfillment_label}\n"
            f"المحتوى: {result.items_summary} | القيمة: {result.total_price}"
        )
        if result.tracking_number:
            msg += f"\nرقم التتبع: {result.tracking_number}"
        if result.tracking_url:
            msg += f"\nرابط التتبع: {result.tracking_url}"

    elif dialect == "egyptian":
        msg = (
            f"الأوردر رقم #{result.order_number} — "
            f"الحالة: {status_label} | الشحن: {fulfillment_label}\n"
            f"المحتوى: {result.items_summary} | القيمة: {result.total_price}"
        )
        if result.tracking_number:
            msg += f"\nرقم التتبع: {result.tracking_number}"

    else:  # msa
        msg = (
            f"طلبكم رقم #{result.order_number}\n"
            f"الحالة المالية: {status_label}\n"
            f"حالة الشحن: {fulfillment_label}\n"
            f"المحتوى: {result.items_summary} | الإجمالي: {result.total_price}"
        )
        if result.tracking_number:
            msg += f"\nرقم التتبع: {result.tracking_number}"
        if result.tracking_url:
            msg += f"\nرابط متابعة الشحنة: {result.tracking_url}"

    return msg
