"""
RADD AI — Return Prevention Engine
Killer Feature #6: قبل ما يرجع — رَدّ يحاول ينقذ البيعة

المنطق:
1. العميل يطلب إرجاع
2. رَدّ يسأل عن السبب
3. بناءً على السبب، يعرض بديل:
   - مقاس غلط → تبديل مقاس
   - المنتج مختلف → منتج بديل
   - غالي → خصم جزئي
   - ما عجبني → تبديل لمنتج ثاني
4. إذا العميل قبل البديل = إرجاع مُنع = إيراد محفوظ
5. إذا رفض = إرجاع عادي بدون ضغط
"""
from dataclasses import dataclass
from typing import Optional
from enum import Enum


class ReturnReason(Enum):
    WRONG_SIZE = "wrong_size"
    WRONG_COLOR = "wrong_color"
    DEFECTIVE = "defective"
    NOT_AS_DESCRIBED = "not_as_described"
    CHANGED_MIND = "changed_mind"
    TOO_EXPENSIVE = "too_expensive"
    LATE_DELIVERY = "late_delivery"
    OTHER = "other"


class PreventionStrategy(Enum):
    EXCHANGE_SIZE = "exchange_size"
    EXCHANGE_COLOR = "exchange_color"
    EXCHANGE_PRODUCT = "exchange_product"
    PARTIAL_REFUND = "partial_refund"
    DISCOUNT_NEXT = "discount_next"
    NONE = "none"  # لا يمكن منع الإرجاع (منتج معيب مثلاً)


@dataclass
class ReturnPreventionResult:
    can_prevent: bool
    strategy: PreventionStrategy
    response_text: str
    estimated_saved_amount: float = 0.0
    reason: ReturnReason = ReturnReason.OTHER


# ──────────────────────────────────────────────
# Reason Detection — فهم سبب الإرجاع من الرسالة
# ──────────────────────────────────────────────

REASON_KEYWORDS = {
    ReturnReason.WRONG_SIZE: [
        "مقاس", "حجم", "كبير", "صغير", "واسع", "ضيق",
        "مقاسه غلط", "ما يناسبني", "size", "مقاسي",
    ],
    ReturnReason.WRONG_COLOR: [
        "لون", "اللون غلط", "لون مختلف", "مو نفس اللون",
        "اللون ما يناسب", "color",
    ],
    ReturnReason.DEFECTIVE: [
        "خربان", "مكسور", "معيب", "تالف", "ما يشتغل",
        "فيه عيب", "damaged", "broken", "defective",
    ],
    ReturnReason.NOT_AS_DESCRIBED: [
        "مختلف", "مو نفس", "الصورة مختلفة", "ما يشبه",
        "مو زي", "غير اللي طلبته", "الريحة مختلفة",
    ],
    ReturnReason.CHANGED_MIND: [
        "غيرت رأيي", "ما ابيه", "بفكر", "مو محتاجه",
        "ما عجبني", "ما يعجبني",
    ],
    ReturnReason.TOO_EXPENSIVE: [
        "غالي", "ما يستاهل", "السعر", "فلوسي",
    ],
    ReturnReason.LATE_DELIVERY: [
        "تأخر", "متأخر", "ما وصل بالوقت", "تاخير",
    ],
}


def detect_return_reason(message: str) -> ReturnReason:
    """Detect return reason from customer message."""
    message_lower = message.lower()
    words = set(message_lower.split())

    best_reason = ReturnReason.OTHER
    best_score = 0

    for reason, keywords in REASON_KEYWORDS.items():
        score = 0
        for kw in keywords:
            if " " in kw:
                if kw in message_lower:
                    score += 2
            elif kw in words:
                score += 1

        if score > best_score:
            best_score = score
            best_reason = reason

    return best_reason


# ──────────────────────────────────────────────
# Prevention Strategy Selection
# ──────────────────────────────────────────────

REASON_TO_STRATEGY = {
    ReturnReason.WRONG_SIZE: PreventionStrategy.EXCHANGE_SIZE,
    ReturnReason.WRONG_COLOR: PreventionStrategy.EXCHANGE_COLOR,
    ReturnReason.NOT_AS_DESCRIBED: PreventionStrategy.EXCHANGE_PRODUCT,
    ReturnReason.CHANGED_MIND: PreventionStrategy.EXCHANGE_PRODUCT,
    ReturnReason.TOO_EXPENSIVE: PreventionStrategy.PARTIAL_REFUND,
    ReturnReason.DEFECTIVE: PreventionStrategy.NONE,  # عيب = لازم إرجاع
    ReturnReason.LATE_DELIVERY: PreventionStrategy.DISCOUNT_NEXT,
    ReturnReason.OTHER: PreventionStrategy.EXCHANGE_PRODUCT,
}


def generate_prevention_response(
    reason: ReturnReason,
    dialect: str,
    product_name: str = "",
    order_amount: float = 0,
) -> ReturnPreventionResult:
    """
    Generate the prevention response based on reason and dialect.
    """
    strategy = REASON_TO_STRATEGY.get(reason, PreventionStrategy.NONE)

    # لا يمكن المنع — منتج معيب
    if strategy == PreventionStrategy.NONE:
        return ReturnPreventionResult(
            can_prevent=False,
            strategy=strategy,
            response_text=_defective_response(dialect, product_name),
            reason=reason,
        )

    # Exchange size
    if strategy == PreventionStrategy.EXCHANGE_SIZE:
        return ReturnPreventionResult(
            can_prevent=True,
            strategy=strategy,
            response_text=_exchange_size_response(dialect, product_name),
            estimated_saved_amount=order_amount,
            reason=reason,
        )

    # Exchange color
    if strategy == PreventionStrategy.EXCHANGE_COLOR:
        return ReturnPreventionResult(
            can_prevent=True,
            strategy=strategy,
            response_text=_exchange_color_response(dialect, product_name),
            estimated_saved_amount=order_amount,
            reason=reason,
        )

    # Exchange product
    if strategy == PreventionStrategy.EXCHANGE_PRODUCT:
        return ReturnPreventionResult(
            can_prevent=True,
            strategy=strategy,
            response_text=_exchange_product_response(dialect),
            estimated_saved_amount=order_amount,
            reason=reason,
        )

    # Partial refund
    if strategy == PreventionStrategy.PARTIAL_REFUND:
        discount = round(order_amount * 0.15, 2)  # 15% خصم
        return ReturnPreventionResult(
            can_prevent=True,
            strategy=strategy,
            response_text=_partial_refund_response(dialect, discount),
            estimated_saved_amount=order_amount - discount,
            reason=reason,
        )

    # Discount next order
    if strategy == PreventionStrategy.DISCOUNT_NEXT:
        return ReturnPreventionResult(
            can_prevent=True,
            strategy=strategy,
            response_text=_discount_next_response(dialect),
            estimated_saved_amount=order_amount * 0.5,  # تقدير متحفظ
            reason=reason,
        )

    return ReturnPreventionResult(
        can_prevent=False,
        strategy=PreventionStrategy.NONE,
        response_text=_generic_return_response(dialect),
        reason=reason,
    )


# ──────────────────────────────────────────────
# Response Templates — بالـ 3 لهجات
# ──────────────────────────────────────────────

def _exchange_size_response(dialect: str, product: str) -> str:
    responses = {
        "gulf": f"فهمتك! المقاس مو مناسب. عندنا خيارين:\n\n1️⃣ نبدل لك بمقاس ثاني — نرسله فوراً وبدون رسوم شحن إضافية\n2️⃣ نرجع لك المبلغ كامل\n\nوش تفضل؟",
        "egyptian": f"فهمتك! المقاس مش مناسب. عندنا خيارين:\n\n1️⃣ نبدلهولك بمقاس تاني — نبعته فوراً ومن غير شحن إضافي\n2️⃣ نرجعلك الفلوس كلها\n\nإيه اللي تحبه؟",
        "msa": f"أفهمك تماماً. المقاس غير مناسب. لديك خياران:\n\n1️⃣ استبدال بمقاس آخر — إرسال فوري بدون رسوم شحن إضافية\n2️⃣ استرداد المبلغ كاملاً\n\nماذا تفضل؟",
    }
    return responses.get(dialect, responses["gulf"])


def _exchange_color_response(dialect: str, product: str) -> str:
    responses = {
        "gulf": f"فهمتك! اللون مو اللي تبيه. ممكن نبدله بلون ثاني متوفر — بدون أي رسوم إضافية. وش اللون اللي تفضله؟",
        "egyptian": f"فهمتك! اللون مش اللي انت عايزه. ممكن نبدلهولك بلون تاني متاح — من غير أي رسوم إضافية. إيه اللون اللي تحبه؟",
        "msa": f"أفهمك. اللون غير مناسب. يمكننا استبداله بلون آخر متوفر بدون رسوم إضافية. أي لون تفضل؟",
    }
    return responses.get(dialect, responses["gulf"])


def _exchange_product_response(dialect: str) -> str:
    responses = {
        "gulf": "فهمتك! قبل الإرجاع — تبي تشوف منتجات ثانية ممكن تعجبك؟ نقدر نبدل لك بأي منتج ثاني بنفس القيمة بدون رسوم إضافية. أو لو تبي ترجعه، بنبدأ الإرجاع الحين.",
        "egyptian": "فهمتك! قبل الإرجاع — تحب تشوف منتجات تانية ممكن تعجبك؟ نقدر نبدلهولك بأي منتج تاني بنفس القيمة من غير رسوم. أو لو عايز ترجعه هنبدأ الإرجاع دلوقتي.",
        "msa": "أفهمك. قبل الإرجاع — هل تودّ الاطلاع على منتجات بديلة؟ يمكننا الاستبدال بأي منتج بنفس القيمة بدون رسوم. أو نبدأ عملية الإرجاع فوراً.",
    }
    return responses.get(dialect, responses["gulf"])


def _partial_refund_response(dialect: str, discount: float) -> str:
    responses = {
        "gulf": f"فهمتك تحس إنه غالي. عندي حل — نقدر نعطيك خصم ر.س {discount:.0f} على هالطلب وتحتفظ بالمنتج. أو لو تبي ترجعه، بنبدأ الحين. وش رأيك؟",
        "egyptian": f"فهمتك إنه غالي شوية. عندي حل — نقدر نديك خصم ر.س {discount:.0f} على الأوردر ده وتفضل المنتج معاك. أو لو عايز ترجعه هنبدأ دلوقتي. إيه رأيك؟",
        "msa": f"أفهم أن السعر مرتفع. يمكننا تقديم خصم ر.س {discount:.0f} على هذا الطلب مع الاحتفاظ بالمنتج. أو نبدأ عملية الإرجاع. ما رأيك؟",
    }
    return responses.get(dialect, responses["gulf"])


def _discount_next_response(dialect: str) -> str:
    responses = {
        "gulf": "آسفين على التأخير! كتعويض، نعطيك كود خصم 20% على طلبك الجاي. وإذا تبي ترجع المنتج بعد كذا، حقك طبعاً. وش تفضل؟",
        "egyptian": "آسفين على التأخير! كتعويض هنديك كود خصم 20% على أوردرك الجاي. ولو عايز ترجع المنتج بعد كده، حقك طبعاً. إيه تحب؟",
        "msa": "نعتذر عن التأخير. كتعويض، نقدم لك خصم 20% على طلبك القادم. وإذا رغبت بإرجاع المنتج، فهذا حقك. ماذا تفضل؟",
    }
    return responses.get(dialect, responses["gulf"])


def _defective_response(dialect: str, product: str) -> str:
    responses = {
        "gulf": "آسفين جداً إن المنتج وصلك بهالحالة! هذا مو مقبول عندنا. بنبدأ الإرجاع الحين فوراً — شركة الشحن بتتواصل معك لاستلام المنتج وبنرجع لك المبلغ كامل.",
        "egyptian": "آسفين جداً إن المنتج وصلك كده! ده مش مقبول عندنا خالص. هنبدأ الإرجاع دلوقتي فوراً — شركة الشحن هتتواصل معاك لاستلام المنتج وهنرجعلك الفلوس كلها.",
        "msa": "نعتذر بشدة عن وصول المنتج بهذه الحالة. سنبدأ عملية الإرجاع فوراً — ستتواصل شركة الشحن لاستلام المنتج وسيُعاد المبلغ كاملاً.",
    }
    return responses.get(dialect, responses["gulf"])


def _generic_return_response(dialect: str) -> str:
    responses = {
        "gulf": "تقدر ترجع المنتج خلال 14 يوم من الاستلام. تبي أبدأ لك عملية الإرجاع الحين؟",
        "egyptian": "تقدر ترجع المنتج خلال 14 يوم من الاستلام. تحب أبدألك عملية الإرجاع دلوقتي؟",
        "msa": "يمكنك إرجاع المنتج خلال 14 يوماً من الاستلام. هل تودّ البدء بعملية الإرجاع؟",
    }
    return responses.get(dialect, responses["gulf"])
