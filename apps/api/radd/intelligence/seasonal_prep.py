from __future__ import annotations
"""
RADD AI — Seasonal Auto-Prep
Detects upcoming seasons/holidays and prepares KB suggestions.
"رمضان بعد 3 أسابيع. توقع 3x محادثات. أضف هذه الأسئلة للـ KB."
"""
from dataclasses import dataclass, field
from datetime import date, datetime, timedelta
from typing import Optional
import structlog

logger = structlog.get_logger()


@dataclass
class Season:
    name_ar: str
    name_en: str
    typical_month: int           # Gregorian month (approximate for non-Hijri)
    typical_day: int
    lead_days: int               # How many days before to alert
    traffic_multiplier: float   # Expected traffic increase (e.g. 3.0 = 3x)
    suggested_kb_topics: list[str]
    sector_specific: dict[str, list[str]] = field(default_factory=dict)


# Saudi/GCC commercial seasons
SEASONS = [
    Season(
        name_ar="رمضان الكريم",
        name_en="ramadan",
        typical_month=3,   # Approximate — changes yearly (Hijri)
        typical_day=1,
        lead_days=21,
        traffic_multiplier=3.0,
        suggested_kb_topics=[
            "أوقات عمل المتجر في رمضان",
            "عروض وتخفيضات رمضان",
            "هدايا رمضان والتغليف الخاص",
            "مواعيد التوصيل والتأخر المحتمل",
            "سياسة الإرجاع في رمضان",
        ],
        sector_specific={
            "food": ["موعد انتهاء صلاحية منتجات رمضان", "الكميات المتاحة من التمور والقهوة"],
            "fashion": ["مقاسات العباءات والثياب الرمضانية", "أزياء العيد والتوصيل السريع"],
            "perfumes": ["عطور رمضان الخاصة", "هدايا العطور وتغليف الهدايا"],
        },
    ),
    Season(
        name_ar="عيد الفطر",
        name_en="eid_al_fitr",
        typical_month=4,
        typical_day=1,
        lead_days=14,
        traffic_multiplier=2.5,
        suggested_kb_topics=[
            "هدايا العيد وخيارات التغليف",
            "التوصيل العاجل قبل العيد",
            "تخفيضات ما بعد العيد",
            "استفسارات الهدايا الجماعية",
        ],
        sector_specific={
            "jewelry": ["مجوهرات العيد وعروض الجملة", "التخصيص والنقش"],
            "fashion": ["ملابس العيد للأطفال والكبار", "التوصيل في 24 ساعة"],
        },
    ),
    Season(
        name_ar="اليوم الوطني السعودي",
        name_en="saudi_national_day",
        typical_month=9,
        typical_day=23,
        lead_days=10,
        traffic_multiplier=1.8,
        suggested_kb_topics=[
            "عروض اليوم الوطني",
            "المنتجات ذات الطابع الوطني",
            "التوصيل السريع لمناسبة اليوم الوطني",
        ],
    ),
    Season(
        name_ar="موسم الرياض",
        name_en="riyadh_season",
        typical_month=10,
        typical_day=1,
        lead_days=14,
        traffic_multiplier=2.0,
        suggested_kb_topics=[
            "عروض موسم الرياض الخاصة",
            "التوصيل للفعاليات",
            "هدايا موسم الرياض",
        ],
    ),
    Season(
        name_ar="الجمعة البيضاء (بلاك فرايداي)",
        name_en="white_friday",
        typical_month=11,
        typical_day=24,
        lead_days=7,
        traffic_multiplier=4.0,
        suggested_kb_topics=[
            "كيفية الاستفادة من عروض الجمعة البيضاء",
            "هل الخصومات حقيقية؟",
            "التوصيل خلال فترة ذروة الطلبات",
            "سياسة الإرجاع للمشتريات بالخصم",
            "متى تبدأ العروض وتنتهي؟",
        ],
    ),
    Season(
        name_ar="عيد الأضحى",
        name_en="eid_al_adha",
        typical_month=6,
        typical_day=15,
        lead_days=14,
        traffic_multiplier=2.0,
        suggested_kb_topics=[
            "هدايا عيد الأضحى",
            "توصيل العيد",
            "المنتجات المناسبة للعيد",
        ],
    ),
    Season(
        name_ar="العودة للمدارس",
        name_en="back_to_school",
        typical_month=8,
        typical_day=25,
        lead_days=14,
        traffic_multiplier=1.5,
        suggested_kb_topics=[
            "منتجات المدارس المتاحة",
            "أسعار الجملة للمدارس",
            "التوصيل قبل بدء الدراسة",
        ],
        sector_specific={
            "electronics": ["حاسبات وأجهزة المدارس", "ضمان أجهزة الطلاب"],
            "fashion": ["ملابس المدارس والزي الموحد"],
        },
    ),
]


@dataclass
class SeasonAlert:
    season: Season
    days_until: int
    urgency: str                  # "critical" | "warning" | "info"
    message_ar: str
    kb_topics: list[str]


def get_upcoming_seasons(
    days_ahead: int = 60,
    sector: str = "other",
) -> list[SeasonAlert]:
    """
    Detect upcoming seasons within the next N days.
    Returns sorted list of SeasonAlert (closest first).
    """
    today = date.today()
    alerts = []

    for season in SEASONS:
        # Approximate season date for current year
        try:
            season_date = date(today.year, season.typical_month, season.typical_day)
        except ValueError:
            continue

        # If past → try next year
        if season_date < today:
            try:
                season_date = date(today.year + 1, season.typical_month, season.typical_day)
            except ValueError:
                continue

        days_until = (season_date - today).days

        if 0 <= days_until <= days_ahead:
            # Urgency
            if days_until <= 7:
                urgency = "critical"
            elif days_until <= 14:
                urgency = "warning"
            else:
                urgency = "info"

            # KB topics (general + sector-specific)
            kb_topics = season.suggested_kb_topics.copy()
            if sector in season.sector_specific:
                kb_topics = season.sector_specific[sector] + kb_topics

            # Message
            msg = _build_seasonal_message(season, days_until, sector)

            alerts.append(SeasonAlert(
                season=season,
                days_until=days_until,
                urgency=urgency,
                message_ar=msg,
                kb_topics=kb_topics[:8],
            ))

    alerts.sort(key=lambda a: a.days_until)
    return alerts


def _build_seasonal_message(season: Season, days_until: int, sector: str) -> str:
    multiplier = season.traffic_multiplier
    name = season.name_ar

    if days_until == 0:
        base = f"🎉 {name} اليوم!"
    elif days_until <= 7:
        base = f"⚡ {name} بعد {days_until} أيام فقط!"
    else:
        base = f"📅 {name} بعد {days_until} يوماً."

    base += (
        f" بناءً على بيانات المتاجر المماثلة، توقّع {multiplier:.0f}x محادثات في هذه الفترة. "
        f"أضف الأسئلة الموسمية لقاعدة معرفتك الآن حتى يكون رَدّ جاهزاً."
    )

    return base


async def generate_seasonal_kb_content(
    season_name: str,
    sector: str,
    store_name: str = "متجرنا",
) -> dict:
    """
    Generate ready-to-import KB content for a season.
    Uses GPT to create Arabic Q&A pairs for the season.
    """
    from openai import AsyncOpenAI
    from radd.config import settings

    client = AsyncOpenAI(api_key=settings.openai_api_key)

    sector_ar = {
        "perfumes": "العطور", "fashion": "الأزياء", "electronics": "الإلكترونيات",
        "food": "الأغذية", "jewelry": "المجوهرات", "other": "التجزئة",
    }.get(sector, "التجزئة")

    prompt = f"""أنت خبير خدمة عملاء لمتجر {sector_ar} سعودي اسمه "{store_name}".
اكتب 8 أسئلة وأجوبة شائعة يسألها العملاء خلال موسم "{season_name}".
الأسئلة يجب أن تكون واقعية ومتعلقة بالموسم مباشرة.
الأجوبة تكون قصيرة ومفيدة — جملتين أو ثلاث.

اكتب بتنسيق JSON فقط:
[
  {{"question": "...", "answer": "..."}},
  ...
]"""

    try:
        response = await client.chat.completions.create(
            model="gpt-4.1-mini",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=1000,
            temperature=0.4,
            response_format={"type": "json_object"},
            timeout=20.0,
        )
        import json
        content = response.choices[0].message.content
        data = json.loads(content)
        pairs = data if isinstance(data, list) else data.get("questions", data.get("items", []))

        return {
            "season": season_name,
            "sector": sector,
            "pairs": pairs[:8],
            "kb_title": f"أسئلة موسم {season_name} — {sector_ar}",
            "kb_content": "\n\n".join([f"**{p['question']}**\n{p['answer']}" for p in pairs]),
        }
    except Exception as e:
        logger.error("seasonal_prep.generate_failed", error=str(e))
        return {"season": season_name, "pairs": [], "kb_content": "", "error": str(e)}
