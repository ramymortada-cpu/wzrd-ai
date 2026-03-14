"""
Customer Context Builder — generates an Arabic context string
to inject into the AI system prompt before every response.

Usage:
    from radd.customers.context_builder import build_customer_context
    ctx = build_customer_context(customer)
    # inject ctx into orchestrator system prompt
"""
from datetime import UTC, datetime


def build_customer_context(customer) -> str:
    """
    Build a short Arabic context string describing this customer.
    Returns empty string if no useful info is available.

    Examples:
        "هذا عميل جديد. رحّب به بودّ."
        "العميل تواصل 18 مرة سابقاً. ⭐ عميل VIP — عامله بتقدير."
        "العميل تواصل 5 مرات. ⚠️ عميل غير راضٍ — كن حذراً وودوداً. اشتكى قبل 3 أيام."
    """
    if not customer:
        return ""

    total = customer.total_conversations or 0

    if total == 0:
        return "هذا عميل جديد. رحّب به بودّ."

    parts = []

    # Conversation count + optional name
    name_part = f" ({customer.display_name})" if customer.display_name else ""
    parts.append(f"العميل{name_part} تواصل {total} مرة سابقاً.")

    # Tier-specific message
    tier = customer.customer_tier or "standard"
    tier_messages = {
        "vip":      "⭐ عميل VIP — عامله بتقدير واهتمام خاص.",
        "at_risk":  "⚠️ عميل غير راضٍ — كن حذراً وودوداً ومتفهماً.",
        "returning": "عميل متكرر — كن مباشراً ومفيداً.",
        "new":      "عميل جديد — رحّب به بحرارة.",
    }
    if tier in tier_messages:
        parts.append(tier_messages[tier])

    # Recent complaint
    if customer.last_complaint_at:
        try:
            days = (datetime.now(UTC) - customer.last_complaint_at).days
            if days <= 7:
                parts.append(f"اشتكى قبل {days} {'يوم' if days == 1 else 'أيام'} — كن متفهماً.")
            elif days <= 30:
                parts.append(f"كان غير راضٍ قبل {days} يوماً.")
        except Exception:
            pass

    # Salla order history
    orders = customer.salla_total_orders or 0
    if orders > 0:
        parts.append(f"إجمالي طلباته من المتجر: {orders} طلب.")

    return "\n".join(parts)
