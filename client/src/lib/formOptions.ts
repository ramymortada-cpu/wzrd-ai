/**
 * Shared form select options for WZZRD AI tools.
 * Use labelAr when locale is Arabic, label when English.
 */
export const MARKET_OPTIONS = [
  { value: 'egypt', label: 'Egypt', labelAr: 'مصر' },
  { value: 'ksa', label: 'Saudi Arabia', labelAr: 'السعودية' },
  { value: 'uae', label: 'UAE', labelAr: 'الإمارات' },
  { value: 'other', label: 'Other', labelAr: 'آخر' },
] as const;

export const YEARS_IN_BUSINESS = [
  { value: 'under1', label: 'Less than 1 year', labelAr: 'أقل من سنة' },
  { value: '1_3', label: '1–3 years', labelAr: '١-٣ سنين' },
  { value: '3_5', label: '3–5 years', labelAr: '٣-٥ سنين' },
  { value: 'over5', label: 'More than 5 years', labelAr: 'أكتر من ٥ سنين' },
] as const;

export const TEAM_SIZE = [
  { value: '1', label: 'Just me', labelAr: 'شخص واحد' },
  { value: '2_5', label: '2–5 people', labelAr: '٢-٥' },
  { value: '6_20', label: '6–20 people', labelAr: '٦-٢٠' },
  { value: 'over20', label: 'More than 20', labelAr: 'أكتر من ٢٠' },
] as const;

export const MONTHLY_REVENUE = [
  { value: 'under10k', label: 'Under 10K', labelAr: 'أقل من ١٠ آلاف' },
  { value: '10_50k', label: '10–50K', labelAr: '١٠-٥٠ ألف' },
  { value: '50_200k', label: '50–200K', labelAr: '٥٠-٢٠٠ ألف' },
  { value: 'over200k', label: 'Over 200K', labelAr: 'أكتر من ٢٠٠ ألف' },
] as const;

export const PREVIOUS_BRANDING = [
  { value: 'never', label: 'Never', labelAr: 'لا أبداً' },
  { value: 'yes_needs_update', label: 'Yes but needs update', labelAr: 'أيوه بس محتاج تحديث' },
  { value: 'yes_happy', label: 'Yes and happy with it', labelAr: 'أيوه وراضي عنه' },
] as const;

export const NUMBER_OF_PACKAGES = [
  { value: '1', label: '1', labelAr: '١' },
  { value: '2_3', label: '2–3', labelAr: '٢-٣' },
  { value: '4_6', label: '4–6', labelAr: '٤-٦' },
  { value: 'over6', label: 'More than 6', labelAr: 'أكتر من ٦' },
] as const;

export const PRICING_MODEL = [
  { value: 'fixed', label: 'Fixed price', labelAr: 'سعر ثابت' },
  { value: 'hourly', label: 'Per hour', labelAr: 'بالساعة' },
  { value: 'subscription', label: 'Monthly subscription', labelAr: 'اشتراك شهري' },
  { value: 'per_project', label: 'Per project', labelAr: 'حسب المشروع' },
  { value: 'undecided', label: 'Not decided', labelAr: 'مش محدد' },
] as const;

export const TONE_OF_VOICE = [
  { value: 'formal', label: 'Formal & professional', labelAr: 'رسمي ومهني' },
  { value: 'friendly', label: 'Friendly & approachable', labelAr: 'ودود وقريب' },
  { value: 'bold', label: 'Bold & attention-grabbing', labelAr: 'جريء وملفت' },
  { value: 'undecided', label: 'Not defined', labelAr: 'مش محدد' },
] as const;

export const INSTAGRAM_FOLLOWERS = [
  { value: 'under1k', label: 'Under 1,000', labelAr: 'أقل من ١٠٠٠' },
  { value: '1k_5k', label: '1,000–5,000', labelAr: '١٠٠٠-٥٠٠٠' },
  { value: '5k_20k', label: '5,000–20,000', labelAr: '٥٠٠٠-٢٠,٠٠٠' },
  { value: 'over20k', label: 'Over 20,000', labelAr: 'أكتر من ٢٠,٠٠٠' },
] as const;

export const POSTING_FREQUENCY = [
  { value: 'daily', label: 'Daily', labelAr: 'يومي' },
  { value: '3_5_week', label: '3–5 times/week', labelAr: '٣-٥ مرات في الأسبوع' },
  { value: 'weekly', label: 'Once a week', labelAr: 'مرة في الأسبوع' },
  { value: 'less', label: 'Less often', labelAr: 'أقل من كده' },
  { value: 'none', label: 'Not posting', labelAr: 'مش بننشر' },
] as const;

export const AVG_RESPONSE_TIME = [
  { value: 'under1h', label: 'Under 1 hour', labelAr: 'أقل من ساعة' },
  { value: '1_6h', label: '1–6 hours', labelAr: '١-٦ ساعات' },
  { value: 'same_day', label: 'Same day', labelAr: 'نفس اليوم' },
  { value: 'over_day', label: 'Over a day', labelAr: 'أكتر من يوم' },
] as const;

export const GOOGLE_BUSINESS = [
  { value: 'yes_updated', label: 'Yes, up to date', labelAr: 'أيوه ومحدث' },
  { value: 'yes_outdated', label: 'Yes but not updated', labelAr: 'أيوه بس مش محدث' },
  { value: 'no', label: 'No', labelAr: 'لا' },
] as const;

export const HAS_LOGO = [
  { value: 'yes_pro', label: 'Yes, professional', labelAr: 'أيوه احترافي' },
  { value: 'yes_needs_update', label: 'Yes but needs update', labelAr: 'أيوه بس محتاج تحديث' },
  { value: 'no', label: 'No', labelAr: 'لا' },
] as const;

export const HAS_GUIDELINES_SIMPLE = [
  { value: 'yes', label: 'Yes', labelAr: 'أيوه' },
  { value: 'no', label: 'No', labelAr: 'لا' },
  { value: 'in_progress', label: 'Working on it', labelAr: 'جاري العمل عليها' },
] as const;

export const HAS_OFFER_STRUCTURE = [
  { value: 'yes', label: 'Yes', labelAr: 'أيوه' },
  { value: 'no', label: 'No', labelAr: 'لا' },
  { value: 'in_progress', label: 'Working on it', labelAr: 'جاري العمل عليها' },
] as const;

export const HAS_GUIDELINES_FULL = [
  { value: 'yes_full', label: 'Yes, complete', labelAr: 'أيوه كاملة' },
  { value: 'partial', label: 'Partial', labelAr: 'جزئية' },
  { value: 'no', label: 'No', labelAr: 'لا' },
] as const;

export const HAS_WEBSITE = [
  { value: 'yes_live', label: 'Yes, live', labelAr: 'أيوه وشغال' },
  { value: 'in_progress', label: 'In progress', labelAr: 'قيد الإنشاء' },
  { value: 'no', label: 'No', labelAr: 'لا' },
] as const;

export const HAS_CONTENT_PLAN = [
  { value: 'yes', label: 'Yes', labelAr: 'أيوه' },
  { value: 'no', label: 'No', labelAr: 'لا' },
  { value: 'ideas', label: 'Have ideas but not organized', labelAr: 'عندي أفكار بس مش منظمة' },
] as const;

export const LAUNCH_TYPE = [
  { value: 'new_brand', label: 'Completely new brand', labelAr: 'براند جديد تماماً' },
  { value: 'relaunch', label: 'Relaunch', labelAr: 'إعادة إطلاق' },
  { value: 'new_product', label: 'New product', labelAr: 'منتج جديد' },
  { value: 'new_market', label: 'Expansion to new market', labelAr: 'توسع لسوق جديد' },
] as const;

export const TARGET_LAUNCH_DATE = [
  { value: '1month', label: 'Within 1 month', labelAr: 'خلال شهر' },
  { value: '1_3months', label: '1–3 months', labelAr: '١-٣ شهور' },
  { value: '3_6months', label: '3–6 months', labelAr: '٣-٦ شهور' },
  { value: 'undecided', label: 'Not set', labelAr: 'مش محدد' },
] as const;

export const MARKETING_BUDGET = [
  { value: 'under5k', label: 'Under 5K', labelAr: 'أقل من ٥ آلاف' },
  { value: '5_15k', label: '5–15K', labelAr: '٥-١٥ ألف' },
  { value: '15_50k', label: '15–50K', labelAr: '١٥-٥٠ ألف' },
  { value: 'over50k', label: 'Over 50K', labelAr: 'أكتر من ٥٠ ألف' },
  { value: 'undecided', label: 'Not set', labelAr: 'مش محدد' },
] as const;
