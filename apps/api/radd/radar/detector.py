"""
RADD AI — Operational Radar
Killer Feature #5: "رَدّ يكتشف المشكلة قبلك"

3 أنواع تنبيهات:
1. انهيار شركة شحن (ارتفاع مفاجئ في شكاوى الشحن)
2. مشكلة منتج (ارتفاع مفاجئ في إرجاعات منتج معين)
3. فرصة ضائعة (عملاء يسألون عن منتج غير موجود)

يعمل عبر: entity extraction → aggregation → anomaly detection → alert
"""
import logging
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Optional
from enum import Enum

logger = logging.getLogger("radd.radar")


class AlertType(Enum):
    SHIPPING_ANOMALY = "shipping_anomaly"
    PRODUCT_ISSUE = "product_issue"
    DEMAND_OPPORTUNITY = "demand_opportunity"


class AlertSeverity(Enum):
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"


@dataclass
class RadarAlert:
    alert_type: AlertType
    severity: AlertSeverity
    title_ar: str
    description_ar: str
    affected_entity: str  # اسم شركة الشحن أو المنتج
    current_count: int
    normal_count: int  # المعدل الطبيعي
    anomaly_ratio: float  # current/normal
    suggested_actions: list[str] = field(default_factory=list)
    affected_customers: int = 0
    estimated_impact_sar: float = 0.0
    created_at: datetime = None

    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.utcnow()


# ──────────────────────────────────────────────
# Anomaly Detection
# ──────────────────────────────────────────────

async def scan_for_anomalies(
    db_session,
    workspace_id: str,
    lookback_hours: int = 6,
    baseline_days: int = 14,
) -> list[RadarAlert]:
    """
    Scan conversations for operational anomalies.
    Compares last N hours against 14-day baseline.
    """
    alerts = []

    # 1. Shipping anomalies
    shipping_alerts = await _detect_shipping_anomalies(
        db_session, workspace_id, lookback_hours, baseline_days
    )
    alerts.extend(shipping_alerts)

    # 2. Product issues (return/complaint spikes)
    product_alerts = await _detect_product_issues(
        db_session, workspace_id, lookback_hours, baseline_days
    )
    alerts.extend(product_alerts)

    # 3. Demand opportunities (products people ask about but don't exist)
    demand_alerts = await _detect_demand_opportunities(
        db_session, workspace_id, days=7
    )
    alerts.extend(demand_alerts)

    return alerts


async def _detect_shipping_anomalies(
    db_session,
    workspace_id: str,
    lookback_hours: int,
    baseline_days: int,
) -> list[RadarAlert]:
    """Detect spikes in shipping complaints per carrier."""
    from sqlalchemy import text

    # Get shipping mentions in recent hours vs baseline
    result = await db_session.execute(
        text("""
            WITH recent AS (
                SELECT
                    m.metadata->'entities'->>'shipping_companies' as carrier,
                    COUNT(*) as recent_count
                FROM messages m
                JOIN conversations c ON m.conversation_id = c.id
                WHERE c.workspace_id = :wid
                AND m.sender_type = 'customer'
                AND c.intent IN ('shipping', 'order_status')
                AND m.metadata->'entities'->'shipping_companies' IS NOT NULL
                AND m.created_at > NOW() - INTERVAL :lookback
                GROUP BY carrier
            ),
            baseline AS (
                SELECT
                    m.metadata->'entities'->>'shipping_companies' as carrier,
                    COUNT(*) * 1.0 / :baseline_days as daily_avg
                FROM messages m
                JOIN conversations c ON m.conversation_id = c.id
                WHERE c.workspace_id = :wid
                AND m.sender_type = 'customer'
                AND c.intent IN ('shipping', 'order_status')
                AND m.metadata->'entities'->'shipping_companies' IS NOT NULL
                AND m.created_at > NOW() - INTERVAL :baseline
                AND m.created_at <= NOW() - INTERVAL :lookback
                GROUP BY carrier
            )
            SELECT
                r.carrier,
                r.recent_count,
                COALESCE(b.daily_avg, 1) as daily_avg
            FROM recent r
            LEFT JOIN baseline b ON r.carrier = b.carrier
            WHERE r.recent_count > COALESCE(b.daily_avg, 1) * 2
        """),
        {
            "wid": workspace_id,
            "lookback": f"{lookback_hours} hours",
            "baseline": f"{baseline_days} days",
            "baseline_days": baseline_days,
        },
    )

    alerts = []
    for row in result.fetchall():
        carrier = row.carrier or "غير محدد"
        ratio = round(row.recent_count / max(row.daily_avg, 0.1), 1)

        severity = AlertSeverity.CRITICAL if ratio >= 5 else (
            AlertSeverity.WARNING if ratio >= 3 else AlertSeverity.INFO
        )

        alerts.append(RadarAlert(
            alert_type=AlertType.SHIPPING_ANOMALY,
            severity=severity,
            title_ar=f"🚨 ارتفاع غير طبيعي في شكاوى الشحن مع {carrier}",
            description_ar=(
                f"{row.recent_count} شكوى في آخر {lookback_hours} ساعات. "
                f"المعدل الطبيعي: {row.daily_avg:.0f}/يوم. "
                f"الارتفاع: {ratio}x"
            ),
            affected_entity=carrier,
            current_count=row.recent_count,
            normal_count=round(row.daily_avg),
            anomaly_ratio=ratio,
            suggested_actions=[
                f"تواصل مع {carrier} للتحقق من وجود مشكلة",
                "أرسل رسالة استباقية للعملاء المتأثرين",
                "راقب الوضع خلال الساعات القادمة",
            ],
        ))

    return alerts


async def _detect_product_issues(
    db_session,
    workspace_id: str,
    lookback_hours: int,
    baseline_days: int,
) -> list[RadarAlert]:
    """Detect spikes in returns/complaints for specific products."""
    from sqlalchemy import text

    result = await db_session.execute(
        text("""
            WITH recent_returns AS (
                SELECT
                    m.metadata->'entities'->>'product_mentions' as product,
                    COUNT(*) as recent_count
                FROM messages m
                JOIN conversations c ON m.conversation_id = c.id
                WHERE c.workspace_id = :wid
                AND m.sender_type = 'customer'
                AND c.intent = 'return_policy'
                AND m.metadata->'entities'->'product_mentions' IS NOT NULL
                AND m.created_at > NOW() - INTERVAL '7 days'
                GROUP BY product
                HAVING COUNT(*) >= 3
            ),
            baseline_returns AS (
                SELECT
                    m.metadata->'entities'->>'product_mentions' as product,
                    COUNT(*) * 1.0 / :baseline_days as daily_avg
                FROM messages m
                JOIN conversations c ON m.conversation_id = c.id
                WHERE c.workspace_id = :wid
                AND m.sender_type = 'customer'
                AND c.intent = 'return_policy'
                AND m.metadata->'entities'->'product_mentions' IS NOT NULL
                AND m.created_at > NOW() - INTERVAL :baseline
                AND m.created_at <= NOW() - INTERVAL '7 days'
                GROUP BY product
            )
            SELECT
                r.product,
                r.recent_count,
                COALESCE(b.daily_avg, 0.5) as daily_avg
            FROM recent_returns r
            LEFT JOIN baseline_returns b ON r.product = b.product
            WHERE r.recent_count > COALESCE(b.daily_avg, 0.5) * 7 * 2
        """),
        {
            "wid": workspace_id,
            "baseline": f"{baseline_days} days",
            "baseline_days": baseline_days,
        },
    )

    alerts = []
    for row in result.fetchall():
        product = row.product or "منتج غير محدد"
        weekly_normal = round(row.daily_avg * 7)
        ratio = round(row.recent_count / max(weekly_normal, 1), 1)

        alerts.append(RadarAlert(
            alert_type=AlertType.PRODUCT_ISSUE,
            severity=AlertSeverity.WARNING,
            title_ar=f"⚠️ ارتفاع إرجاعات لمنتج: {product}",
            description_ar=(
                f"{row.recent_count} طلب إرجاع هذا الأسبوع. "
                f"المعدل الطبيعي: {weekly_normal}/أسبوع. "
                f"الارتفاع: {ratio}x"
            ),
            affected_entity=product,
            current_count=row.recent_count,
            normal_count=weekly_normal,
            anomaly_ratio=ratio,
            suggested_actions=[
                "راجع وصف المنتج — هل يعكس المنتج الحقيقي؟",
                "تحقق من جودة آخر دفعة من المورد",
                "راجع أسباب الإرجاع المذكورة",
            ],
        ))

    return alerts


async def _detect_demand_opportunities(
    db_session,
    workspace_id: str,
    days: int = 7,
) -> list[RadarAlert]:
    """Detect products customers ask about that don't exist in KB."""
    from sqlalchemy import text

    result = await db_session.execute(
        text("""
            SELECT
                m.metadata->'entities'->>'product_mentions' as product,
                COUNT(*) as ask_count
            FROM messages m
            JOIN conversations c ON m.conversation_id = c.id
            WHERE c.workspace_id = :wid
            AND m.sender_type = 'customer'
            AND c.intent = 'product_inquiry'
            AND c.resolution_type IN ('escalated_hard', 'escalated_soft')
            AND m.metadata->'entities'->'product_mentions' IS NOT NULL
            AND m.created_at > NOW() - INTERVAL :days
            GROUP BY product
            HAVING COUNT(*) >= 5
            ORDER BY ask_count DESC
            LIMIT 5
        """),
        {"wid": workspace_id, "days": f"{days} days"},
    )

    alerts = []
    for row in result.fetchall():
        product = row.product or "منتج غير محدد"

        alerts.append(RadarAlert(
            alert_type=AlertType.DEMAND_OPPORTUNITY,
            severity=AlertSeverity.INFO,
            title_ar=f"💡 فرصة: عملاء يسألون عن {product}",
            description_ar=(
                f"{row.ask_count} عميل سألوا عن \"{product}\" هذا الأسبوع "
                f"ولم نتمكن من الإجابة. هل هذا المنتج متوفر؟"
            ),
            affected_entity=product,
            current_count=row.ask_count,
            normal_count=0,
            anomaly_ratio=0,
            suggested_actions=[
                f"أضف \"{product}\" لكاتالوج المنتجات إذا كان متوفراً",
                "أضف معلومات عنه لقاعدة المعرفة",
                f"فرصة إيراد مقدرة: ~ر.س {row.ask_count * 150}",
            ],
        ))

    return alerts


# ──────────────────────────────────────────────
# Alert Formatting — for Dashboard and WhatsApp
# ──────────────────────────────────────────────

def format_alerts_for_whatsapp(alerts: list[RadarAlert]) -> Optional[str]:
    """Format radar alerts for WhatsApp notification."""
    if not alerts:
        return None

    critical = [a for a in alerts if a.severity == AlertSeverity.CRITICAL]
    warnings = [a for a in alerts if a.severity == AlertSeverity.WARNING]
    info = [a for a in alerts if a.severity == AlertSeverity.INFO]

    lines = ["🔍 تنبيهات الرادار التشغيلي:", ""]

    for alert in critical:
        lines.append(f"🔴 {alert.title_ar}")
        lines.append(f"   {alert.description_ar}")
        lines.append("")

    for alert in warnings:
        lines.append(f"🟡 {alert.title_ar}")
        lines.append(f"   {alert.description_ar}")
        lines.append("")

    for alert in info[:2]:  # أهم 2 فرص فقط
        lines.append(f"💡 {alert.title_ar}")
        lines.append(f"   {alert.description_ar}")
        lines.append("")

    return "\n".join(lines)


def format_alert_for_dashboard(alert: RadarAlert) -> dict:
    """Format a single alert for the dashboard API."""
    return {
        "type": alert.alert_type.value,
        "severity": alert.severity.value,
        "title": alert.title_ar,
        "description": alert.description_ar,
        "entity": alert.affected_entity,
        "current": alert.current_count,
        "normal": alert.normal_count,
        "ratio": alert.anomaly_ratio,
        "actions": alert.suggested_actions,
        "impact_sar": alert.estimated_impact_sar,
        "created_at": alert.created_at.isoformat(),
    }
