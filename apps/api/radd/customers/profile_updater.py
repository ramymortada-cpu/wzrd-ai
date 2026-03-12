"""RADD AI — Customer Profile Updater + Context Builder"""
from datetime import datetime, timezone

POSITIVE = {"شكرا","شكراً","ممتاز","حلو","الله يعطيك العافية","تسلم","رائع","ممنون","جميل","احسنت","مشكور","تمام"}
NEGATIVE = {"زعلان","خربان","سيء","اسوأ","ما يشتغل","مشكلة","شكوى","بشتكي","بنشر تقييم","غش","نصب","كذب","متاخر","تاخير","ما وصل","مكسور","غلط"}


def compute_sentiment(text: str) -> float:
    if not text:
        return 0.5
    words = set(text.split())
    p, n = len(words & POSITIVE), len(words & NEGATIVE)
    if p > n:
        return min(1.0, 0.6 + p * 0.1)
    if n > p:
        return max(0.0, 0.4 - n * 0.1)
    return 0.5


def compute_tier(customer) -> str:
    total_conv = customer.total_conversations or 0
    total_esc = customer.total_escalations or 0
    if total_esc >= 3 and customer.last_complaint_at:
        days_since = (datetime.now(timezone.utc) - customer.last_complaint_at).days
        if days_since <= 30:
            return "at_risk"
    if total_conv > 10:
        return "vip"
    revenue = float(customer.salla_total_revenue or 0)
    if revenue > 5000:
        return "vip"
    if total_conv >= 4:
        return "returning"
    if total_conv >= 1:
        return "standard"
    return "new"


async def update_profile(db, customer, resolution_type: str, message_text: str = "") -> None:
    """Update customer counters, tier, and sentiment after a conversation turn."""
    customer.total_conversations = (customer.total_conversations or 0) + 1
    customer.last_seen_at = datetime.now(timezone.utc)
    if resolution_type in ("escalated_hard", "escalated_soft"):
        customer.total_escalations = (customer.total_escalations or 0) + 1
        customer.last_complaint_at = datetime.now(timezone.utc)
    s = compute_sentiment(message_text)
    customer.avg_sentiment = round(float(customer.avg_sentiment or 0.5) * 0.7 + s * 0.3, 2)
    customer.customer_tier = compute_tier(customer)
    await db.flush()

def build_customer_context(customer) -> str:
    if not customer or not customer.total_conversations: return "هذا عميل جديد. رحّب به بودّ."
    parts = [f"العميل تواصل {customer.total_conversations} مرة سابقاً."]
    if customer.display_name: parts[0] += f" اسمه: {customer.display_name}"
    tier_msg = {"vip":"⭐ عميل VIP — عامله بتقدير.","at_risk":"⚠️ عميل غير راضٍ — كن حذراً وودوداً.","returning":"عميل متكرر — كن مباشراً.","new":"عميل جديد — رحّب به."}
    t = customer.customer_tier or "standard"
    if t in tier_msg: parts.append(tier_msg[t])
    if customer.last_complaint_at:
        d = (datetime.utcnow() - customer.last_complaint_at).days
        if d <= 7: parts.append(f"اشتكى قبل {d} أيام.")
    if customer.salla_total_orders and customer.salla_total_orders > 0:
        parts.append(f"إجمالي طلباته: {customer.salla_total_orders}")
    return "\n".join(parts)
