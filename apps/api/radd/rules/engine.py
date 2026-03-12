"""
RADD AI — Smart Rules Engine
بدلاً من Flow Builder المعقد — قواعد بسيطة بـ toggle

أمثلة:
- "لما عميل VIP يشتكي → حوّل للتاجر شخصياً"
- "لما الموضوع إرجاع → جرّب Return Prevention أولاً"
- "بعد الساعة 10 مساءً → Night Guard mode"
- "لما عميل يسأل عن منتج → استخدم Sales Persona"
"""
from dataclasses import dataclass
from typing import Optional
from enum import Enum
from datetime import datetime


class TriggerType(Enum):
    INTENT = "intent"             # عندما يكون الـ intent محدد
    CUSTOMER_TIER = "customer_tier"  # عندما يكون العميل من tier معين
    TIME_RANGE = "time_range"     # خلال وقت محدد
    STAGE = "stage"               # عندما تكون المحادثة في stage معين
    SENTIMENT = "sentiment"       # عندما يكون مزاج العميل معين
    KEYWORD = "keyword"           # عندما تحتوي الرسالة على كلمة معينة


class ActionType(Enum):
    ESCALATE_OWNER = "escalate_owner"     # حوّل للتاجر شخصياً
    ESCALATE_TEAM = "escalate_team"       # حوّل لفريق الدعم
    USE_PERSONA = "use_persona"           # استخدم شخصية معينة
    TRY_PREVENTION = "try_prevention"     # جرّب Return Prevention
    SEND_TEMPLATE = "send_template"       # أرسل رسالة محددة
    ADJUST_CONFIDENCE = "adjust_confidence"  # غيّر threshold مؤقتاً
    SCHEDULE_FOLLOWUP = "schedule_followup"  # جدول متابعة


@dataclass
class SmartRule:
    id: str
    name: str
    description: str
    trigger_type: TriggerType
    trigger_value: str
    action_type: ActionType
    action_value: str
    is_active: bool = True
    priority: int = 0  # أعلى = يُنفذ أولاً


@dataclass
class RuleMatchResult:
    matched: bool
    rule: Optional[SmartRule] = None
    action_type: Optional[ActionType] = None
    action_value: Optional[str] = None


# ──────────────────────────────────────────────
# Default Rules — تأتي مع كل workspace جديد
# ──────────────────────────────────────────────

DEFAULT_RULES = [
    SmartRule(
        id="default_vip_escalate",
        name="عميل VIP غاضب → التاجر شخصياً",
        description="عندما يشتكي عميل VIP، حوّل مباشرة للتاجر وليس للفريق",
        trigger_type=TriggerType.CUSTOMER_TIER,
        trigger_value="vip+complaint",
        action_type=ActionType.ESCALATE_OWNER,
        action_value="owner",
        priority=100,
    ),
    SmartRule(
        id="default_return_prevention",
        name="طلب إرجاع → جرّب الإنقاذ أولاً",
        description="قبل ما يرجع، رَدّ يعرض بدائل (تبديل، خصم)",
        trigger_type=TriggerType.INTENT,
        trigger_value="return_policy",
        action_type=ActionType.TRY_PREVENTION,
        action_value="return_prevention",
        priority=90,
    ),
    SmartRule(
        id="default_night_guard",
        name="بعد الساعة 10 → وضع الحراسة الليلية",
        description="رفع threshold الأتمتة ليلاً — فقط الردود عالية الثقة",
        trigger_type=TriggerType.TIME_RANGE,
        trigger_value="22:00-08:00",
        action_type=ActionType.ADJUST_CONFIDENCE,
        action_value="0.90",
        priority=80,
    ),
    SmartRule(
        id="default_sales_persona",
        name="استفسار منتج → شخصية المبيعات",
        description="استخدم مستشار المبيعات لأسئلة ما قبل الشراء",
        trigger_type=TriggerType.INTENT,
        trigger_value="product_inquiry,product_comparison,purchase_hesitation",
        action_type=ActionType.USE_PERSONA,
        action_value="sales",
        priority=70,
    ),
    SmartRule(
        id="default_threat_escalate",
        name="تهديد بتقييم سلبي → تصعيد فوري",
        description="لما عميل يقول 'بنشر تقييم' أو 'بشتكي' → حوّل فوراً",
        trigger_type=TriggerType.KEYWORD,
        trigger_value="بنشر تقييم,بشتكي,أسوأ متجر,نصابين,حرامية",
        action_type=ActionType.ESCALATE_OWNER,
        action_value="owner",
        priority=95,
    ),
    SmartRule(
        id="default_abandoned_followup",
        name="محادثة مبيعات منقطعة → متابعة بعد ساعتين",
        description="إذا عميل سأل عن منتج ولم يشترِ، تابع بعد ساعتين",
        trigger_type=TriggerType.STAGE,
        trigger_value="objection,consideration",
        action_type=ActionType.SCHEDULE_FOLLOWUP,
        action_value="120",  # دقائق
        priority=60,
    ),
]


# ──────────────────────────────────────────────
# Rule Evaluation Engine
# ──────────────────────────────────────────────

def evaluate_rules(
    rules: list[SmartRule],
    intent: str,
    customer_tier: str,
    conversation_stage: str,
    message_text: str,
    current_hour: int,
    sentiment: float = 0.5,
) -> RuleMatchResult:
    """
    Evaluate all active rules against current context.
    Returns the highest priority matching rule.
    """
    # Sort by priority descending
    active_rules = sorted(
        [r for r in rules if r.is_active],
        key=lambda r: r.priority,
        reverse=True,
    )

    for rule in active_rules:
        if _rule_matches(rule, intent, customer_tier, conversation_stage, message_text, current_hour, sentiment):
            return RuleMatchResult(
                matched=True,
                rule=rule,
                action_type=rule.action_type,
                action_value=rule.action_value,
            )

    return RuleMatchResult(matched=False)


def _rule_matches(
    rule: SmartRule,
    intent: str,
    customer_tier: str,
    stage: str,
    message: str,
    hour: int,
    sentiment: float,
) -> bool:
    """Check if a single rule matches the current context."""

    if rule.trigger_type == TriggerType.INTENT:
        intents = [i.strip() for i in rule.trigger_value.split(",")]
        return intent in intents

    if rule.trigger_type == TriggerType.CUSTOMER_TIER:
        # Supports compound: "vip+complaint" means VIP AND complaint stage
        if "+" in rule.trigger_value:
            parts = rule.trigger_value.split("+")
            return customer_tier == parts[0] and stage == parts[1]
        return customer_tier == rule.trigger_value

    if rule.trigger_type == TriggerType.TIME_RANGE:
        start, end = rule.trigger_value.split("-")
        start_h = int(start.split(":")[0])
        end_h = int(end.split(":")[0])
        if start_h > end_h:  # overnight range (e.g., 22:00-08:00)
            return hour >= start_h or hour < end_h
        return start_h <= hour < end_h

    if rule.trigger_type == TriggerType.STAGE:
        stages = [s.strip() for s in rule.trigger_value.split(",")]
        return stage in stages

    if rule.trigger_type == TriggerType.KEYWORD:
        keywords = [k.strip() for k in rule.trigger_value.split(",")]
        return any(kw in message for kw in keywords)

    if rule.trigger_type == TriggerType.SENTIMENT:
        threshold = float(rule.trigger_value)
        return sentiment < threshold  # trigger on low sentiment

    return False


def apply_rule_action(match: RuleMatchResult) -> dict:
    """
    Translate a rule match into orchestrator instructions.
    Returns a dict that the orchestrator uses to modify behavior.
    """
    if not match.matched:
        return {}

    action = match.action_type
    value = match.action_value

    if action == ActionType.ESCALATE_OWNER:
        return {"force_escalation": True, "escalation_target": "owner", "rule_name": match.rule.name}

    if action == ActionType.ESCALATE_TEAM:
        return {"force_escalation": True, "escalation_target": "team", "rule_name": match.rule.name}

    if action == ActionType.USE_PERSONA:
        return {"force_persona": value, "rule_name": match.rule.name}

    if action == ActionType.TRY_PREVENTION:
        return {"try_return_prevention": True, "rule_name": match.rule.name}

    if action == ActionType.ADJUST_CONFIDENCE:
        return {"override_auto_threshold": float(value), "rule_name": match.rule.name}

    if action == ActionType.SCHEDULE_FOLLOWUP:
        return {"schedule_followup_minutes": int(value), "rule_name": match.rule.name}

    if action == ActionType.SEND_TEMPLATE:
        return {"force_template": value, "rule_name": match.rule.name}

    return {}
