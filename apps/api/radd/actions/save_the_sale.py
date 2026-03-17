"""
RADD AI — Save The Sale

عند طلب العميل إلغاء الطلب: نستعلم عن الحالة، نعرض خيارات إنقاذ البيع،
ولا نلغي فعلياً إلا بتأكيد صريح من العميل.
"""
from __future__ import annotations

from dataclasses import dataclass


@dataclass
class CancellationCheckResult:
    """نتيجة فحص إمكانية الإلغاء — لا يلغي الطلب."""
    cancellable: bool
    response_text: str
    order_reference: str
    status: str
    options: list[str]  # خصم، تأجيل، استبدال — عند cancellable=True


# حالات Salla/Shopify التي لا يمكن إلغاؤها
NON_CANCELLABLE_STATUSES = frozenset({"delivered", "canceled", "refunded", "cancelled", "closed"})


def _format_save_options(dialect: str) -> list[str]:
    """خيارات إنقاذ البيع بالعربية."""
    if dialect == "gulf":
        return ["خصم على طلبك القادم", "تأجيل الطلب لأسبوع", "استبدال بمنتج آخر"]
    if dialect == "egyptian":
        return ["خصم على طلبك الجاي", "تأجيل الطلب لأسبوع", "استبدال بمنتج تاني"]
    return ["خصم على طلبك القادم", "تأجيل الطلب لأسبوع", "استبدال بمنتج آخر"]


def _format_not_cancellable(ref: str, status_ar: str, dialect: str) -> str:
    """رسالة عندما لا يمكن الإلغاء."""
    if dialect == "gulf":
        return f"للأسف ما نقدر نلغي طلبك رقم {ref} لأن حالته: {status_ar}. لو تحتاج مساعدة، كلمنا."
    if dialect == "egyptian":
        return f"للأسف مش نقدر نلغي طلبك رقم {ref} لأن حالته: {status_ar}. لو محتاج مساعدة، كلمنا."
    return f"للأسف لا يمكن إلغاء طلبك رقم {ref} لأن حالته: {status_ar}. إن احتجت مساعدة، تواصل معنا."


def _format_save_the_sale(ref: str, options: list[str], dialect: str) -> str:
    """رسالة عرض خيارات إنقاذ البيع — لا إلغاء فعلي."""
    opts_text = " أو ".join([f"• {o}" for o in options])
    if dialect == "gulf":
        return f"فهمنا إنك تبي تلغي طلبك رقم {ref}. قبل الإلغاء، نقدر نقدم لك: {opts_text}. أي خيار يناسبك؟ أو أكد الإلغاء لو مصمم."
    if dialect == "egyptian":
        return f"فهمنا إنك عايز تلغي طلبك رقم {ref}. قبل الإلغاء، نقدر نقدملك: {opts_text}. أي خيار يناسبك؟ أو أكد الإلغاء لو مصمم."
    return f"فهمنا رغبتك في إلغاء طلبك رقم {ref}. قبل الإلغاء، يمكننا تقديم: {opts_text}. أي خيار يناسبك؟ أو أكّد الإلغاء إن كنت مصمماً."


def _format_not_found(ref: str, dialect: str) -> str:
    """رسالة عند عدم العثور على الطلب."""
    if dialect == "gulf":
        return f"ما قدرت أجد طلب برقم {ref}. تأكد من الرقم أو كلمنا."
    if dialect == "egyptian":
        return f"مش لاقي طلب برقم {ref}. تأكد من الرقم أو كلمنا."
    return f"لم أجد طلباً برقم {ref}. تأكد من الرقم أو تواصل معنا."


async def handle_cancellation_request(
    message: str,
    dialect: str,
    workspace_config: dict,
) -> CancellationCheckResult:
    """
    يستقبل نية إلغاء، يستعلم عن الطلب، يعرض خيارات إنقاذ البيع.
    لا يلغي الطلب فعلياً — يتطلب تأكيد صريح من العميل.
    """
    from radd.actions.salla import extract_order_number, get_order_status

    platform = (workspace_config.get("platform") or "salla").lower()
    order_number = extract_order_number(message)

    if not order_number:
        # لا رقم طلب — نطلب منه الرقم
        if dialect == "gulf":
            msg = "عشان نساعدك بالإلغاء، أرسل رقم الطلب."
        elif dialect == "egyptian":
            msg = "عشان نساعدك بالإلغاء، ابعت رقم الطلب."
        else:
            msg = "لمساعدتك بالإلغاء، يرجى إرسال رقم الطلب."
        return CancellationCheckResult(
            cancellable=False,
            response_text=msg,
            order_reference="",
            status="",
            options=[],
        )

    # ── Salla ────────────────────────────────────────────────────────────────
    if platform == "salla":
        salla_token = workspace_config.get("salla_access_token", "")
        if not salla_token:
            if dialect == "gulf":
                msg = "ما نقدر نستعلم عن الطلب حالياً. كلمنا ونساعدك."
            else:
                msg = "لا يمكننا الاستعلام عن الطلب حالياً. تواصل معنا."
            return CancellationCheckResult(
                cancellable=False,
                response_text=msg,
                order_reference=order_number,
                status="",
                options=[],
            )

        order_data = await get_order_status(order_number, salla_token)
        if not order_data.get("found"):
            return CancellationCheckResult(
                cancellable=False,
                response_text=_format_not_found(order_number, dialect),
                order_reference=order_number,
                status="",
                options=[],
            )

        status = order_data.get("status", "")
        status_ar = order_data.get("status_ar", status)

        if status in NON_CANCELLABLE_STATUSES:
            return CancellationCheckResult(
                cancellable=False,
                response_text=_format_not_cancellable(order_number, status_ar, dialect),
                order_reference=order_number,
                status=status,
                options=[],
            )

        options = _format_save_options(dialect)
        return CancellationCheckResult(
            cancellable=True,
            response_text=_format_save_the_sale(order_number, options, dialect),
            order_reference=order_number,
            status=status,
            options=options,
        )

    # ── Shopify ──────────────────────────────────────────────────────────────
    if platform == "shopify":
        from radd.actions.shopify import ShopifyConfig, get_order_status as shopify_get

        shop_domain = workspace_config.get("shopify_domain", "")
        shop_token = workspace_config.get("shopify_access_token", "")
        if not shop_domain or not shop_token:
            if dialect == "gulf":
                msg = "ما نقدر نستعلم عن الطلب حالياً. كلمنا ونساعدك."
            else:
                msg = "لا يمكننا الاستعلام عن الطلب حالياً. تواصل معنا."
            return CancellationCheckResult(
                cancellable=False,
                response_text=msg,
                order_reference=order_number,
                status="",
                options=[],
            )

        config = ShopifyConfig(shop_domain=shop_domain, access_token=shop_token)
        result = await shopify_get(order_number, config)

        if result.error == "order_not_found":
            return CancellationCheckResult(
                cancellable=False,
                response_text=_format_not_found(order_number, dialect),
                order_reference=order_number,
                status="",
                options=[],
            )

        status = (result.status or "").lower()
        status_ar_map = {"open": "مفتوح", "closed": "مغلق", "cancelled": "ملغي"}
        status_ar = status_ar_map.get(status, status)

        if status in NON_CANCELLABLE_STATUSES or result.fulfillment_status:
            return CancellationCheckResult(
                cancellable=False,
                response_text=_format_not_cancellable(order_number, status_ar, dialect),
                order_reference=order_number,
                status=status,
                options=[],
            )

        options = _format_save_options(dialect)
        return CancellationCheckResult(
            cancellable=True,
            response_text=_format_save_the_sale(order_number, options, dialect),
            order_reference=order_number,
            status=status,
            options=options,
        )

    # منصة غير معروفة
    if dialect == "gulf":
        msg = "ما نقدر نستعلم عن الطلب. كلمنا ونساعدك."
    else:
        msg = "لا يمكننا الاستعلام عن الطلب. تواصل معنا."
    return CancellationCheckResult(
        cancellable=False,
        response_text=msg,
        order_reference=order_number,
        status="",
        options=[],
    )
