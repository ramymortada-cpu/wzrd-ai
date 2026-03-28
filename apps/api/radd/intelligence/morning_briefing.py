"""RADD AI — Morning Briefing Engine"""
from dataclasses import dataclass
from datetime import datetime, timedelta

INTENT_AR = {
    "greeting": "تحية", "order_status": "حالة الطلب", "shipping": "الشحن",
    "return_policy": "الإرجاع", "store_hours": "مواعيد العمل",
    "product_inquiry": "استفسار عن منتج", "product_comparison": "مقارنة منتجات",
    "purchase_hesitation": "تردد في الشراء", "general": "استفسار عام",
}


@dataclass
class Briefing:
    workspace_name: str
    total: int
    auto: int
    escalated: int
    rate: float
    blocks: int
    top_intent: str
    top_count: int
    gaps: int
    hours_saved: float
    # Revenue data (V2 addition)
    revenue_attributed_sar: float = 0.0
    revenue_event_count: int = 0
    returns_prevented_sar: float = 0.0
    carts_recovered_sar: float = 0.0


async def generate_briefing(db_session, wid: str, name: str) -> Briefing | None:
    from sqlalchemy import text

    ys = datetime.utcnow().replace(hour=0, minute=0, second=0) - timedelta(days=1)
    ye = ys + timedelta(days=1)

    # Conversations stats
    r = await db_session.execute(
        text("""
            SELECT COUNT(*) t,
                   COUNT(*) FILTER(WHERE resolution_type IN ('auto_template','auto_rag')) a,
                   COUNT(*) FILTER(WHERE resolution_type IN ('escalated_hard','escalated_soft')) e
            FROM conversations
            WHERE workspace_id=:w AND created_at>=:s AND created_at<:e
        """),
        {"w": wid, "s": ys, "e": ye},
    )
    row = r.fetchone()
    if not row or row.t == 0:
        return None

    # Escalation blocks
    bl = (
        await db_session.execute(
            text("SELECT COUNT(*) b FROM escalation_events WHERE workspace_id=:w AND created_at>=:s AND created_at<:e"),
            {"w": wid, "s": ys, "e": ye},
        )
    ).fetchone().b or 0

    # Top intent
    ir = (
        await db_session.execute(
            text("""
                SELECT intent, COUNT(*) c FROM conversations
                WHERE workspace_id=:w AND created_at>=:s AND created_at<:e AND intent IS NOT NULL
                GROUP BY intent ORDER BY c DESC LIMIT 1
            """),
            {"w": wid, "s": ys, "e": ye},
        )
    ).fetchone()

    # Knowledge gaps
    gr = (
        await db_session.execute(
            text("""
                SELECT COUNT(DISTINCT m.content_normalized) g
                FROM messages m JOIN conversations c ON m.conversation_id=c.id
                WHERE c.workspace_id=:w
                  AND c.resolution_type IN ('escalated_hard','escalated_soft')
                  AND m.sender_type='customer'
                  AND m.created_at>=NOW()-INTERVAL '7 days'
            """),
            {"w": wid},
        )
    ).fetchone().g or 0

    # ── Revenue Attribution (V2 — Morning Briefing line) ──────────────────────
    rev_row = (
        await db_session.execute(
            text("""
                SELECT
                    COALESCE(SUM(amount_sar), 0) total_sar,
                    COUNT(*) event_count,
                    COALESCE(SUM(amount_sar) FILTER(WHERE event_type='return_prevented'), 0) returns_sar,
                    COALESCE(SUM(amount_sar) FILTER(WHERE event_type='cart_recovered'), 0) carts_sar
                FROM revenue_events
                WHERE workspace_id=:w AND created_at>=:s AND created_at<:e
            """),
            {"w": wid, "s": ys, "e": ye},
        )
    ).fetchone()

    return Briefing(
        workspace_name=name,
        total=row.t,
        auto=row.a,
        escalated=row.e,
        rate=round(row.a / row.t * 100, 1),
        blocks=bl,
        top_intent=ir.intent if ir else "general",
        top_count=ir.c if ir else 0,
        gaps=gr,
        hours_saved=round(row.a * 2 / 60, 1),
        revenue_attributed_sar=float(rev_row.total_sar or 0),
        revenue_event_count=int(rev_row.event_count or 0),
        returns_prevented_sar=float(rev_row.returns_sar or 0),
        carts_recovered_sar=float(rev_row.carts_sar or 0),
    )


def format_briefing(b: Briefing) -> str:
    i = INTENT_AR.get(b.top_intent, b.top_intent)

    msg = (
        f"صباح الخير يا {b.workspace_name} ☀️\n\n"
        f"أمس تعاملت مع {b.total} محادثة:\n"
        f"✅ {b.auto} حليتها لحالي ({b.rate}%)\n"
        f"👤 {b.escalated} حولتها لفريقك\n"
        f"🛡️ منعت {b.blocks} رد غير دقيق\n\n"
        f'أكثر سؤال: "{i}" ({b.top_count} مرة)'
    )

    # Revenue section (shown only if there's data)
    if b.revenue_event_count > 0 or b.revenue_attributed_sar > 0:
        msg += "\n\n💰 أثر رَدّ أمس على إيراداتك:"
        if b.revenue_attributed_sar > 0:
            msg += f"\n   مبيعات مُنسبة: ر.س {b.revenue_attributed_sar:,.0f}"
        if b.returns_prevented_sar > 0:
            msg += f"\n   إرجاعات مُنعت: ر.س {b.returns_prevented_sar:,.0f}"
        if b.carts_recovered_sar > 0:
            msg += f"\n   سلات مُسترجعة: ر.س {b.carts_recovered_sar:,.0f}"
        total_val = b.revenue_attributed_sar + b.returns_prevented_sar + b.carts_recovered_sar
        if total_val > 0:
            msg += "\n   ─────────────────────"
            msg += f"\n   إجمالي القيمة: ر.س {total_val:,.0f}"

    if b.gaps > 0:
        msg += f"\n\n⚠️ {b.gaps} فجوات معرفة جديدة — سدها في لوحة التحكم"
    if b.hours_saved > 0:
        msg += f"\n\n⏱️ وفرت عليك تقريباً {b.hours_saved} ساعات عمل"

    return msg + "\n\n— رَدّ"


async def generate_morning_briefing(db_session, workspace_id: str, workspace_name: str) -> str | None:
    """Convenience wrapper used by scheduler — returns formatted string or None."""
    briefing = await generate_briefing(db_session, workspace_id, workspace_name)
    if not briefing:
        return None
    return format_briefing(briefing)
