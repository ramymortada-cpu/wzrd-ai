import { useState, useEffect, useCallback, useMemo, type ChangeEvent } from 'react';
import { useLocation } from 'wouter';
import { Download, Globe, Loader2, Pencil, Sparkles, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/_core/hooks/useAuth';
import { useI18n } from '@/lib/i18n';
import { trpc } from '@/lib/trpc';
import WzrdPublicHeader from '@/components/WzrdPublicHeader';
import { Tooltip as RadixTooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface DiagnosisEntry {
  id: number;
  toolId: string;
  score: number;
  findings: Array<{ title: string; detail: string; severity: string }>;
  actionItems: Array<{ task: string; difficulty: string }>;
  recommendation: string;
  createdAt: string;
}

interface ChecklistItem {
  id: number;
  task: string;
  difficulty: string;
  completed: boolean;
  completedAt: string | null;
}

interface Checklist {
  id: number;
  diagnosisId: number;
  items: ChecklistItem[];
  completedCount: number;
  totalCount: number;
  createdAt: string;
}

interface BrandProfileData {
  companyName?: string | null;
  industry?: string | null;
  market?: string | null;
  website?: string | null;
  socialMedia?: string | null;
  yearsInBusiness?: string | null;
  teamSize?: string | null;
  monthlyRevenue?: string | null;
  currentPositioning?: string | null;
  targetAudience?: string | null;
  biggestChallenge?: string | null;
  brandPersonality?: string | null;
  desiredPerception?: string | null;
  currentGap?: string | null;
  competitors?: string | null;
  tagline?: string | null;
  elevatorPitch?: string | null;
  websiteHeadline?: string | null;
  instagramBio?: string | null;
  linkedinAbout?: string | null;
  toneOfVoice?: string | null;
  keyDifferentiator?: string | null;
  customerQuote?: string | null;
  brandColors?: string | null;
  hasLogo?: string | null;
  hasGuidelines?: string | null;
  currentPackages?: string | null;
  numberOfPackages?: string | null;
  pricingModel?: string | null;
  cheapestPrice?: string | null;
  highestPrice?: string | null;
  commonObjections?: string | null;
  competitorPricing?: string | null;
  instagramHandle?: string | null;
  instagramFollowers?: string | null;
  otherPlatforms?: string | null;
  postingFrequency?: string | null;
  contentType?: string | null;
  inquiryMethod?: string | null;
  avgResponseTime?: string | null;
  googleBusiness?: string | null;
  launchType?: string | null;
  targetLaunchDate?: string | null;
  hasOfferStructure?: string | null;
  hasWebsite?: string | null;
  hasContentPlan?: string | null;
  marketingBudget?: string | null;
  teamCapacity?: string | null;
  biggestConcern?: string | null;
  successMetric?: string | null;
  totalDiagnosesRun?: number;
  lastToolUsed?: string | null;
  updatedAt?: string | Date;
  createdAt?: string | Date;
  displayName?: string | null;
  completeness55?: number;
  filledSlots55?: number;
}

const BRAND_EXPORT_KEYS: (keyof BrandProfileData)[] = [
  'companyName',
  'industry',
  'market',
  'website',
  'socialMedia',
  'yearsInBusiness',
  'teamSize',
  'monthlyRevenue',
  'currentPositioning',
  'targetAudience',
  'biggestChallenge',
  'brandPersonality',
  'desiredPerception',
  'currentGap',
  'competitors',
  'tagline',
  'elevatorPitch',
  'websiteHeadline',
  'instagramBio',
  'linkedinAbout',
  'toneOfVoice',
  'keyDifferentiator',
  'customerQuote',
  'brandColors',
  'hasLogo',
  'hasGuidelines',
  'currentPackages',
  'numberOfPackages',
  'pricingModel',
  'cheapestPrice',
  'highestPrice',
  'commonObjections',
  'competitorPricing',
  'instagramHandle',
  'instagramFollowers',
  'otherPlatforms',
  'postingFrequency',
  'contentType',
  'inquiryMethod',
  'avgResponseTime',
  'googleBusiness',
  'launchType',
  'targetLaunchDate',
  'hasOfferStructure',
  'hasWebsite',
  'hasContentPlan',
  'marketingBudget',
  'teamCapacity',
  'biggestConcern',
  'successMetric',
];

const BRAND_FORM_FIELD_CLASS =
  'w-full rounded-2xl border border-zinc-200/80 bg-white/90 px-4 py-3 text-sm text-zinc-900 outline-none ring-primary/0 transition placeholder:text-zinc-400 focus:border-primary/40 focus:ring-2 focus:ring-primary/20 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-white dark:placeholder:text-zinc-500';

const BRAND_FORM_TEXTAREA_CLASS = `${BRAND_FORM_FIELD_CLASS} min-h-[100px] resize-y`;

function isNonEmptyProfileString(v: string | null | undefined): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

function buildBrandProfileExportObject(profile: BrandProfileData): Record<string, string> {
  const out: Record<string, string> = {};
  if (isNonEmptyProfileString(profile.displayName)) out.name = profile.displayName.trim();
  for (const k of BRAND_EXPORT_KEYS) {
    const v = profile[k];
    if (typeof v === 'string' && v.trim().length > 0) out[k] = v.trim();
  }
  return out;
}

function slugCompanyForExportFilename(company: string | null | undefined): string | null {
  if (!isNonEmptyProfileString(company)) return null;
  const slug = company
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return slug.length > 0 ? slug : null;
}

function downloadBrandProfileJson(profile: BrandProfileData, isAr: boolean) {
  const data = buildBrandProfileExportObject(profile);
  if (Object.keys(data).length === 0) {
    toast.info(
      isAr ? 'مفيش بيانات للتصدير — عبّي الملف الأول.' : 'Nothing to export yet — add some profile fields first.',
    );
    return;
  }
  const slug = slugCompanyForExportFilename(profile.companyName);
  const filename = slug ? `${slug}-brand-profile.json` : 'my-brand-profile.json';
  const blob = new Blob([`${JSON.stringify(data, null, 2)}\n`], {
    type: 'application/json;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function BilingualFieldLabel({
  isAr,
  primary,
  secondary,
}: {
  isAr: boolean;
  primary: string;
  secondary: string;
}) {
  return (
    <div className="mb-1.5">
      <span className="block text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {isAr ? primary : secondary}
      </span>
      <span
        className="mt-0.5 block text-[10px] font-medium leading-tight text-zinc-400 dark:text-zinc-500"
        dir={isAr ? 'ltr' : 'rtl'}
      >
        {isAr ? secondary : primary}
      </span>
    </div>
  );
}

function ScanWebsiteModal({
  open,
  onClose,
  isAr,
  url,
  setUrl,
  error,
  isPending,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  isAr: boolean;
  url: string;
  setUrl: (v: string) => void;
  error: string;
  isPending: boolean;
  onSubmit: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-zinc-950/55 backdrop-blur-md dark:bg-black/60"
        aria-label={isAr ? 'إغلاق' : 'Close'}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="scan-modal-title"
        className="relative z-10 w-full max-w-md rounded-3xl border border-white/15 bg-white/80 p-6 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/75"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id="scan-modal-title" className="text-lg font-bold text-zinc-900 dark:text-white">
              {isAr ? 'استخراج بيانات البراند تلقائياً' : 'Auto-Extract Brand Data'}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              {isAr
                ? 'دخل رابط موقعك والذكاء الاصطناعي هيقرأه ويملأ ملف البراند بتاعك تلقائياً.'
                : 'Enter your website URL. Our AI will scan it and automatically fill your brand profile.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-zinc-500 transition hover:bg-zinc-200/80 dark:hover:bg-zinc-800"
            aria-label={isAr ? 'إغلاق' : 'Close'}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
        >
          <div>
            <label htmlFor="brand-scan-url" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              URL
            </label>
            <input
              id="brand-scan-url"
              type="url"
              inputMode="url"
              autoComplete="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isPending}
              className={BRAND_FORM_FIELD_CLASS}
            />
          </div>
          {error ? (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={isPending || !url.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary to-violet-600 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition hover:brightness-110 disabled:opacity-50"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
                {isAr ? 'جاري الفحص...' : 'WZZRING...'}
              </>
            ) : isAr ? (
              'ابدأ الفحص'
            ) : (
              'Start Scan'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

function emptyProfileForm() {
  return {
    companyName: '',
    industry: '',
    market: '',
    website: '',
    tagline: '',
    elevatorPitch: '',
    toneOfVoice: '',
    targetAudience: '',
    brandPersonality: '',
    brandColors: '',
  };
}

type EditProfileFormValues = ReturnType<typeof emptyProfileForm>;

function EditProfileModal({
  open,
  onClose,
  isAr,
  profile,
  editError,
  isPending,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  isAr: boolean;
  profile: BrandProfileData | null;
  editError: string;
  isPending: boolean;
  onSubmit: (values: EditProfileFormValues) => void;
}) {
  const [form, setForm] = useState<EditProfileFormValues>(emptyProfileForm);

  useEffect(() => {
    if (!open || !profile) return;
    setForm({
      companyName: profile.companyName ?? '',
      industry: profile.industry ?? '',
      market: profile.market ?? '',
      website: profile.website ?? '',
      tagline: profile.tagline ?? '',
      elevatorPitch: profile.elevatorPitch ?? '',
      toneOfVoice: profile.toneOfVoice ?? '',
      targetAudience: profile.targetAudience ?? '',
      brandPersonality: profile.brandPersonality ?? '',
      brandColors: profile.brandColors ?? '',
    });
  }, [open, profile]);

  if (!open) return null;

  const set =
    (key: keyof EditProfileFormValues) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((f) => ({ ...f, [key]: e.target.value }));
    };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-zinc-950/55 backdrop-blur-md dark:bg-black/60"
        aria-label={isAr ? 'إغلاق' : 'Close'}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-profile-modal-title"
        className="relative z-10 flex max-h-[min(92vh,100dvh)] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-white/15 bg-white/85 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/80"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-zinc-200/60 px-5 py-4 dark:border-zinc-800/80">
          <div className="min-w-0">
            <h2 id="edit-profile-modal-title" className="text-lg font-bold text-zinc-900 dark:text-white">
              {isAr ? 'تعديل ملف البراند' : 'Edit brand profile'}
            </h2>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {isAr
                ? 'حدّث بياناتك الأساسية — الحقول بالعربي والإنجليزي تحت كل عنوان.'
                : 'Update your core brand fields — each label shows Arabic and English.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="rounded-full p-1.5 text-zinc-500 transition hover:bg-zinc-200/80 disabled:opacity-50 dark:hover:bg-zinc-800"
            aria-label={isAr ? 'إغلاق' : 'Close'}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <form
          className="min-h-0 flex-1 overflow-y-auto px-5 py-4"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(form);
          }}
        >
          <div className="space-y-4 pb-2">
            <div>
              <BilingualFieldLabel isAr={isAr} primary="اسم الشركة" secondary="Company name" />
              <input
                type="text"
                autoComplete="organization"
                value={form.companyName}
                onChange={set('companyName')}
                disabled={isPending}
                className={BRAND_FORM_FIELD_CLASS}
              />
            </div>
            <div>
              <BilingualFieldLabel isAr={isAr} primary="المجال / الصناعة" secondary="Industry" />
              <input type="text" value={form.industry} onChange={set('industry')} disabled={isPending} className={BRAND_FORM_FIELD_CLASS} />
            </div>
            <div>
              <BilingualFieldLabel isAr={isAr} primary="السوق" secondary="Market" />
              <input type="text" value={form.market} onChange={set('market')} disabled={isPending} className={BRAND_FORM_FIELD_CLASS} />
            </div>
            <div>
              <BilingualFieldLabel isAr={isAr} primary="الموقع الإلكتروني" secondary="Website" />
              <input
                type="url"
                inputMode="url"
                autoComplete="url"
                placeholder="https://"
                value={form.website}
                onChange={set('website')}
                disabled={isPending}
                className={BRAND_FORM_FIELD_CLASS}
              />
            </div>
            <div>
              <BilingualFieldLabel isAr={isAr} primary="الشعار النصي" secondary="Tagline" />
              <input type="text" value={form.tagline} onChange={set('tagline')} disabled={isPending} className={BRAND_FORM_FIELD_CLASS} />
            </div>
            <div>
              <BilingualFieldLabel isAr={isAr} primary="العرض المختصر (مصعد)" secondary="Elevator pitch" />
              <textarea value={form.elevatorPitch} onChange={set('elevatorPitch')} disabled={isPending} rows={4} className={BRAND_FORM_TEXTAREA_CLASS} />
            </div>
            <div>
              <BilingualFieldLabel isAr={isAr} primary="نبرة الصوت" secondary="Tone of voice" />
              <input type="text" value={form.toneOfVoice} onChange={set('toneOfVoice')} disabled={isPending} className={BRAND_FORM_FIELD_CLASS} />
            </div>
            <div>
              <BilingualFieldLabel isAr={isAr} primary="الجمهور المستهدف" secondary="Target audience" />
              <textarea value={form.targetAudience} onChange={set('targetAudience')} disabled={isPending} rows={3} className={BRAND_FORM_TEXTAREA_CLASS} />
            </div>
            <div>
              <BilingualFieldLabel isAr={isAr} primary="شخصية البراند" secondary="Brand personality" />
              <textarea value={form.brandPersonality} onChange={set('brandPersonality')} disabled={isPending} rows={3} className={BRAND_FORM_TEXTAREA_CLASS} />
            </div>
            <div>
              <BilingualFieldLabel isAr={isAr} primary="ألوان البراند" secondary="Brand colors" />
              <input
                type="text"
                placeholder={isAr ? 'مثال: #0F172A، ترابي، ذهبي' : 'e.g. #0F172A, terracotta, gold'}
                value={form.brandColors}
                onChange={set('brandColors')}
                disabled={isPending}
                className={BRAND_FORM_FIELD_CLASS}
              />
            </div>
          </div>
          {editError ? (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {editError}
            </p>
          ) : null}
          <div className="sticky bottom-0 -mx-5 -mb-px mt-4 border-t border-zinc-200/60 bg-white/90 px-5 py-4 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/90">
            <button
              type="submit"
              disabled={isPending}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary to-violet-600 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition hover:brightness-110 disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
                  {isAr ? 'جاري الحفظ...' : 'Saving...'}
                </>
              ) : isAr ? (
                'حفظ التغييرات'
              ) : (
                'Save changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function BrandHealthEmptyIllustration({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <defs>
        <linearGradient id="wmb-e1" x1="20" y1="20" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop stopColor="oklch(0.55 0.18 290)" stopOpacity="0.55" />
          <stop offset="1" stopColor="oklch(0.72 0.12 200)" stopOpacity="0.35" />
        </linearGradient>
        <linearGradient id="wmb-e2" x1="0" y1="60" x2="120" y2="60" gradientUnits="userSpaceOnUse">
          <stop stopColor="oklch(0.62 0.14 290)" stopOpacity="0.25" />
          <stop offset="1" stopColor="oklch(0.75 0.1 200)" stopOpacity="0.15" />
        </linearGradient>
      </defs>
      <circle cx="60" cy="60" r="52" stroke="url(#wmb-e2)" strokeWidth="0.75" />
      <path d="M30 78 Q48 42 60 52 T90 38" stroke="url(#wmb-e1)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M28 85 Q55 58 72 68 T94 72" stroke="oklch(0.55 0.15 290 / 0.35)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <circle cx="60" cy="48" r="8" fill="oklch(0.55 0.18 290 / 0.4)" />
      <circle cx="60" cy="48" r="4" fill="oklch(0.95 0.02 80)" className="dark:fill-white/90" />
    </svg>
  );
}

/* ─── Brand Profile Section ─── */

interface ProfileSectionProps {
  title: string;
  icon: string;
  fields: Array<{ label: string; value: string | null | undefined }>;
  isAr: boolean;
}

function ProfileSection({ title, icon, fields, isAr }: ProfileSectionProps) {
  const [open, setOpen] = useState(false);
  const populated = fields.filter((f) => f.value && f.value.trim());
  if (populated.length === 0) return null;

  return (
    <div className="border-b border-zinc-200/50 last:border-b-0 dark:border-zinc-700/50">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30"
      >
        <span className="text-lg">{icon}</span>
        <span className="flex-1 text-sm font-semibold text-zinc-800 dark:text-zinc-200">{title}</span>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
          {populated.length}/{fields.length}
        </span>
        <svg
          className={`h-4 w-4 text-zinc-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="space-y-2 px-4 pb-4" dir={isAr ? 'rtl' : 'ltr'}>
          {populated.map((f, i) => (
            <div key={i} className="flex gap-2 text-sm">
              <span className="min-w-[100px] flex-shrink-0 font-medium text-zinc-500 dark:text-zinc-400">
                {f.label}
              </span>
              <span className="text-zinc-800 dark:text-zinc-200">{f.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BrandProfileCard({
  profile,
  isAr,
  onScanClick,
  onEditClick,
}: {
  profile: BrandProfileData;
  isAr: boolean;
  onScanClick: () => void;
  onEditClick: () => void;
}) {
  const sections = useMemo(() => {
    const s = [
      {
        title: isAr ? 'الهوية الأساسية' : 'Core Identity',
        icon: '🏢',
        fields: [
          { label: isAr ? 'الاسم' : 'Name', value: profile.displayName },
          { label: isAr ? 'الشركة' : 'Company', value: profile.companyName },
          { label: isAr ? 'الصناعة' : 'Industry', value: profile.industry },
          { label: isAr ? 'السوق' : 'Market', value: profile.market },
          { label: isAr ? 'الموقع' : 'Website', value: profile.website },
          { label: isAr ? 'السوشيال' : 'Social', value: profile.socialMedia },
          { label: isAr ? 'سنوات' : 'Years', value: profile.yearsInBusiness },
          { label: isAr ? 'الفريق' : 'Team', value: profile.teamSize },
          { label: isAr ? 'الإيراد' : 'Revenue', value: profile.monthlyRevenue },
        ],
      },
      {
        title: isAr ? 'التموضع والجمهور' : 'Positioning & Audience',
        icon: '🎯',
        fields: [
          { label: isAr ? 'التموضع' : 'Positioning', value: profile.currentPositioning },
          { label: isAr ? 'الجمهور' : 'Audience', value: profile.targetAudience },
          { label: isAr ? 'التحدي' : 'Challenge', value: profile.biggestChallenge },
          { label: isAr ? 'الشخصية' : 'Personality', value: profile.brandPersonality },
          { label: isAr ? 'الصورة المرغوبة' : 'Desired Image', value: profile.desiredPerception },
          { label: isAr ? 'الفجوة' : 'Gap', value: profile.currentGap },
          { label: isAr ? 'المنافسين' : 'Competitors', value: profile.competitors },
        ],
      },
      {
        title: isAr ? 'الرسائل والمحتوى' : 'Messaging & Content',
        icon: '💬',
        fields: [
          { label: isAr ? 'التاجلاين' : 'Tagline', value: profile.tagline },
          { label: 'Elevator Pitch', value: profile.elevatorPitch },
          { label: isAr ? 'عنوان الموقع' : 'Headline', value: profile.websiteHeadline },
          { label: isAr ? 'بايو إنستجرام' : 'IG Bio', value: profile.instagramBio },
          { label: 'LinkedIn About', value: profile.linkedinAbout },
          { label: isAr ? 'نبرة الصوت' : 'Tone', value: profile.toneOfVoice },
          { label: isAr ? 'الميزة التنافسية' : 'Differentiator', value: profile.keyDifferentiator },
          { label: isAr ? 'اقتباس عميل' : 'Testimonial', value: profile.customerQuote },
        ],
      },
      {
        title: isAr ? 'الهوية البصرية' : 'Visual Identity',
        icon: '🎨',
        fields: [
          { label: isAr ? 'الألوان' : 'Colors', value: profile.brandColors },
          { label: isAr ? 'لوجو' : 'Logo', value: profile.hasLogo },
          { label: isAr ? 'دليل بصري' : 'Guidelines', value: profile.hasGuidelines },
        ],
      },
      {
        title: isAr ? 'العرض والتسعير' : 'Offer & Pricing',
        icon: '💰',
        fields: [
          { label: isAr ? 'الباقات' : 'Packages', value: profile.currentPackages },
          { label: isAr ? 'عدد الباقات' : '# Packages', value: profile.numberOfPackages },
          { label: isAr ? 'نموذج التسعير' : 'Pricing Model', value: profile.pricingModel },
          { label: isAr ? 'أقل سعر' : 'Lowest', value: profile.cheapestPrice },
          { label: isAr ? 'أعلى سعر' : 'Highest', value: profile.highestPrice },
          { label: isAr ? 'الاعتراضات' : 'Objections', value: profile.commonObjections },
          { label: isAr ? 'أسعار المنافسين' : 'Competitor $', value: profile.competitorPricing },
        ],
      },
      {
        title: isAr ? 'الحضور الرقمي' : 'Digital Presence',
        icon: '📱',
        fields: [
          { label: 'Instagram', value: profile.instagramHandle },
          { label: isAr ? 'المتابعين' : 'Followers', value: profile.instagramFollowers },
          { label: isAr ? 'منصات أخرى' : 'Platforms', value: profile.otherPlatforms },
          { label: isAr ? 'تكرار النشر' : 'Frequency', value: profile.postingFrequency },
          { label: isAr ? 'نوع المحتوى' : 'Content', value: profile.contentType },
          { label: isAr ? 'الاستفسارات' : 'Inquiries', value: profile.inquiryMethod },
          { label: isAr ? 'وقت الرد' : 'Response', value: profile.avgResponseTime },
          { label: 'Google Business', value: profile.googleBusiness },
        ],
      },
      {
        title: isAr ? 'جاهزية الإطلاق' : 'Launch Readiness',
        icon: '🚀',
        fields: [
          { label: isAr ? 'نوع الإطلاق' : 'Type', value: profile.launchType },
          { label: isAr ? 'التاريخ' : 'Date', value: profile.targetLaunchDate },
          { label: isAr ? 'هيكل عرض' : 'Offer Ready', value: profile.hasOfferStructure },
          { label: isAr ? 'موقع جاهز' : 'Website Ready', value: profile.hasWebsite },
          { label: isAr ? 'خطة محتوى' : 'Content Plan', value: profile.hasContentPlan },
          { label: isAr ? 'الميزانية' : 'Budget', value: profile.marketingBudget },
          { label: isAr ? 'الفريق' : 'Team', value: profile.teamCapacity },
          { label: isAr ? 'أكبر قلق' : 'Concern', value: profile.biggestConcern },
          { label: isAr ? 'مقياس النجاح' : 'Success', value: profile.successMetric },
        ],
      },
    ];
    return s;
  }, [profile, isAr]);

  // Calculate completeness
  const allFields = sections.flatMap((s) => s.fields);
  const filledCount = allFields.filter((f) => f.value && f.value.trim()).length;
  const totalFields = allFields.length;
  const completeness = Math.round((filledCount / totalFields) * 100);

  const sectionsWithData = sections.filter(
    (s) => s.fields.some((f) => f.value && f.value.trim()),
  );

  return (
    <div className="wzrd-glass mb-4 overflow-hidden rounded-3xl">
      {/* Header */}
      <div className="border-b border-zinc-200/50 p-5 dark:border-zinc-700/50">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 flex-1 items-start gap-4">
            <div className="relative h-10 w-10 shrink-0">
              <svg className="h-10 w-10 -rotate-90" viewBox="0 0 36 36">
                <circle
                  cx="18"
                  cy="18"
                  r="15.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-zinc-200 dark:text-zinc-700"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="15.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray={`${completeness} ${100 - completeness}`}
                  strokeLinecap="round"
                  className="text-primary"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-zinc-700 dark:text-zinc-300">
                {completeness}%
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                {isAr ? 'ملف البراند' : 'Brand Profile'}
              </h3>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                {isAr
                  ? `بيانات متراكمة من ${profile.totalDiagnosesRun ?? 0} تشخيص`
                  : `Accumulated from ${profile.totalDiagnosesRun ?? 0} diagnoses`}
              </p>
              {filledCount === 0 ? (
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                  {isAr ? 'لسه مفيش بيانات — جرّب تعديل الملف أو فحص الموقع.' : 'No fields yet — edit your profile or scan a website.'}
                </p>
              ) : null}
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            <RadixTooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => downloadBrandProfileJson(profile, isAr)}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-zinc-300/80 bg-white/40 text-zinc-800 shadow-sm transition hover:bg-white/70 dark:border-zinc-600 dark:bg-zinc-900/40 dark:text-zinc-100 dark:hover:bg-zinc-800/60"
                  aria-label={isAr ? 'تصدير ملف JSON' : 'Export profile as JSON'}
                >
                  <Download className="h-3.5 w-3.5 opacity-90" aria-hidden />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[14rem] text-balance">
                {isAr
                  ? 'حمل الملف عشان تشاركه مع الديزاينر أو الإيجنسي'
                  : 'Export for your designer or agency'}
              </TooltipContent>
            </RadixTooltip>
            <button
              type="button"
              onClick={onEditClick}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-zinc-300/80 bg-white/40 px-4 py-2 text-xs font-semibold text-zinc-800 shadow-sm transition hover:bg-white/70 dark:border-zinc-600 dark:bg-zinc-900/40 dark:text-zinc-100 dark:hover:bg-zinc-800/60"
            >
              <Pencil className="h-3.5 w-3.5 opacity-90" aria-hidden />
              <span>{isAr ? 'تعديل الملف' : 'Edit Profile'}</span>
            </button>
            <button
              type="button"
              onClick={onScanClick}
              className="group inline-flex items-center justify-center gap-2 rounded-full border border-transparent bg-gradient-to-r from-violet-500/20 via-cyan-500/15 to-violet-500/20 px-4 py-2 text-xs font-semibold text-zinc-800 shadow-sm transition hover:from-violet-500/30 hover:via-cyan-500/25 hover:to-violet-500/30 dark:text-zinc-100 dark:from-violet-500/25 dark:via-cyan-500/20 dark:to-violet-500/25"
              style={{
                boxShadow: '0 0 0 1px rgba(139, 92, 246, 0.35), inset 0 1px 0 rgba(255,255,255,0.06)',
              }}
            >
              <Sparkles className="h-3.5 w-3.5 text-violet-500 transition group-hover:text-cyan-400" aria-hidden />
              <Globe className="h-3.5 w-3.5 opacity-80" aria-hidden />
              <span>{isAr ? 'فحص الموقع' : 'Scan Website'}</span>
            </button>
          </div>
        </div>
        {/* Completeness bar */}
        <div className="mt-3 flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-200/80 dark:bg-zinc-700/80">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-cyan-500 transition-all duration-700"
              style={{ width: `${completeness}%` }}
            />
          </div>
          <span className="text-xs tabular-nums text-zinc-500">
            {filledCount}/{totalFields}
          </span>
        </div>
      </div>

      {/* Sections */}
      {sectionsWithData.length > 0 ? (
        <div className="divide-y divide-zinc-200/50 dark:divide-zinc-700/50">
          {sectionsWithData.map((section) => (
            <ProfileSection
              key={section.title}
              title={section.title}
              icon={section.icon}
              fields={section.fields}
              isAr={isAr}
            />
          ))}
        </div>
      ) : null}

      {/* Footer hint */}
      {completeness < 80 && (
        <div className="border-t border-zinc-200/50 px-4 py-3 text-center dark:border-zinc-700/50">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {isAr
              ? 'شغّل أدوات تشخيص أكتر عشان تملا الملف — كل أداة بتضيف بيانات جديدة.'
              : 'Run more diagnosis tools to fill your profile — each tool adds new data.'}
          </p>
        </div>
      )}
    </div>
  );
}

export default function MyBrand() {
  const [, navigate] = useLocation();
  const { locale } = useI18n();
  const isAr = locale === 'ar';
  const { user, loading: authLoading } = useAuth();
  const utils = trpc.useUtils();
  const [scanOpen, setScanOpen] = useState(false);
  const [scanUrl, setScanUrl] = useState('');
  const [scanError, setScanError] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [editError, setEditError] = useState('');

  const profileQuery = trpc.brandProfile.getMyProfile.useQuery(undefined, {
    enabled: Boolean(user) && !authLoading,
    retry: 1,
  });

  const updateProfileMutation = trpc.brandProfile.updateProfile.useMutation({
    onSuccess: () => {
      toast.success(isAr ? 'تم حفظ ملف البراند.' : 'Brand profile saved.');
      setEditOpen(false);
      setEditError('');
      void utils.brandProfile.getMyProfile.invalidate();
    },
    onError: (err) => {
      setEditError(err.message || (isAr ? 'فشل الحفظ' : 'Save failed'));
    },
  });

  const extractMutation = trpc.brandProfile.autoExtract.useMutation({
    onSuccess: (data) => {
      if (!data.success) {
        toast.info(data.error || (isAr ? 'مفيش بيانات جديدة للاستخراج.' : 'No new data extracted.'));
        return;
      }
      const n = data.fieldsExtracted;
      if (n <= 0) {
        toast.info(isAr ? 'تم الفحص — مفيش حقول جديدة للتحديث.' : 'Scan complete — no new fields to update.');
      } else {
        toast.success(
          isAr ? `تم استخراج ${n} حقول بنجاح` : `Extracted ${n} field${n === 1 ? '' : 's'} successfully`,
        );
      }
      setScanOpen(false);
      setScanUrl('');
      setScanError('');
      void utils.brandProfile.getMyProfile.invalidate();
    },
    onError: (err) => {
      setScanError(err.message || (isAr ? 'فشل الفحص' : 'Scan failed'));
    },
  });

  const [history, setHistory] = useState<DiagnosisEntry[]>([]);
  const [trend, setTrend] = useState<string>('new');
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDiagnosis, setSelectedDiagnosis] = useState<DiagnosisEntry | null>(null);

  // Fetch history + checklists (brand profile via tRPC above)
  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch('/api/trpc/tools.myHistory').then(r => r.json()).then(d => {
        const data = d.result?.data?.json ?? d.result?.data ?? {};
        setHistory(data.history || []);
        setTrend(data.trend || 'new');
      }),
      fetch('/api/trpc/tools.myChecklists').then(r => r.json()).then(d => {
        const data = d.result?.data?.json ?? d.result?.data ?? [];
        setChecklists(Array.isArray(data) ? data : []);
      }),
    ])
      .catch(() => setError(isAr ? 'حصل مشكلة في التحميل — حاول تاني.' : 'Failed to load — please try again.'))
      .finally(() => setLoading(false));
  }, [isAr]);

  // Toggle checklist item
  const toggleItem = useCallback(async (checklistId: number, itemIndex: number) => {
    try {
      const res = await fetch('/api/trpc/tools.toggleChecklistItem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ json: { checklistId, itemIndex } }),
      });
      const d = await res.json();
      const result = d.result?.data?.json ?? d.result?.data;
      if (result) {
        setChecklists(prev => prev.map(cl =>
          cl.id === checklistId ? { ...cl, items: result.items, completedCount: result.completedCount, totalCount: result.totalCount } : cl
        ));
      }
    } catch {
      // silent fail — UI already toggled optimistically
    }
  }, []);

  const latest = history[0] || null;
  const prevScore = history[1]?.score ?? null;
  const scoreDiff = latest && prevScore !== null ? latest.score - prevScore : null;

  const trendIcon = trend === 'improving' ? '↑' : trend === 'declining' ? '↓' : trend === 'stable' ? '→' : '';
  const trendColor = trend === 'improving' ? 'text-green-600' : trend === 'declining' ? 'text-red-600' : 'text-gray-500';
  const trendLabel = isAr
    ? (trend === 'improving' ? 'بيتحسّن' : trend === 'declining' ? 'بيتراجع' : trend === 'stable' ? 'ثابت' : 'جديد')
    : (trend === 'improving' ? 'Improving' : trend === 'declining' ? 'Declining' : trend === 'stable' ? 'Stable' : 'New');

  const difficultyBadge = (d: string) => {
    const colors = { easy: 'bg-green-100 text-green-700', medium: 'bg-yellow-100 text-yellow-700', hard: 'bg-red-100 text-red-700' };
    const labels = isAr ? { easy: 'سهل', medium: 'متوسط', hard: 'صعب' } : { easy: 'Easy', medium: 'Medium', hard: 'Hard' };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[d as keyof typeof colors] || colors.medium}`}>
        {labels[d as keyof typeof labels] || d}
      </span>
    );
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric' });
  };

  const toolName = useCallback((id: string) => {
    const names: Record<string, string> = isAr
      ? { brand_diagnosis: 'تشخيص البراند', offer_check: 'فحص العرض', message_check: 'فحص الرسالة', presence_audit: 'فحص الحضور', identity_snapshot: 'لقطة الهوية', launch_readiness: 'جاهزية الإطلاق' }
      : { brand_diagnosis: 'Brand Diagnosis', offer_check: 'Offer Check', message_check: 'Message Check', presence_audit: 'Presence Audit', identity_snapshot: 'Identity Snapshot', launch_readiness: 'Launch Readiness' };
    return names[id] || id;
  }, [isAr]);

  const chartData = useMemo(() => {
    return [...history]
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .map((e) => ({
        label: new Date(e.createdAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric' }),
        score: e.score,
        tool: toolName(e.toolId),
      }));
  }, [history, isAr, toolName]);

  const firstScore = chartData[0]?.score ?? null;
  const lastScore = chartData.length ? chartData[chartData.length - 1].score : null;
  const totalDelta =
    firstScore !== null && lastScore !== null && chartData.length >= 2 ? lastScore - firstScore : null;

  if (loading) {
    return (
      <div className="wzrd-page-radial min-h-screen text-zinc-900 dark:text-white" dir={isAr ? 'rtl' : 'ltr'}>
        <WzrdPublicHeader />
        <div className="wzrd-public-pt mx-auto max-w-2xl px-4 py-12">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-1/2 rounded-lg bg-zinc-200/80 dark:bg-zinc-700/80" />
            <div className="h-40 rounded-3xl bg-zinc-200/80 dark:bg-zinc-700/80" />
            <div className="h-32 rounded-3xl bg-zinc-200/80 dark:bg-zinc-700/80" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="wzrd-page-radial min-h-screen text-zinc-900 dark:text-white" dir={isAr ? 'rtl' : 'ltr'}>
      <WzrdPublicHeader />
      <div className="wzrd-public-pt mx-auto max-w-2xl px-4 pb-24 pt-2">

        {/* Page Title */}
        <h1 className="mb-6 text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-zinc-900 via-primary to-cyan-600 dark:from-white dark:via-violet-200 dark:to-cyan-300">
          {isAr ? 'صحة البراند بتاعك' : 'Your Brand Health'}
        </h1>

        {user && (
          <>
            {profileQuery.isLoading && (
              <div className="wzrd-glass mb-6 h-32 animate-pulse rounded-3xl border border-white/10" />
            )}
            {profileQuery.isError && (
              <div className="mb-4 rounded-2xl border border-amber-200/60 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/30 dark:text-amber-100">
                {profileQuery.error.message}
              </div>
            )}
            {profileQuery.data && (
              <BrandProfileCard
                profile={profileQuery.data as unknown as BrandProfileData}
                isAr={isAr}
                onEditClick={() => {
                  setEditError('');
                  setEditOpen(true);
                }}
                onScanClick={() => {
                  setScanError('');
                  setScanUrl(profileQuery.data?.website?.trim() || '');
                  setScanOpen(true);
                }}
              />
            )}
            <EditProfileModal
              open={editOpen}
              onClose={() => {
                if (!updateProfileMutation.isPending) {
                  setEditOpen(false);
                  setEditError('');
                }
              }}
              isAr={isAr}
              profile={(profileQuery.data as unknown as BrandProfileData) ?? null}
              editError={editError}
              isPending={updateProfileMutation.isPending}
              onSubmit={(values) => {
                setEditError('');
                updateProfileMutation.mutate({
                  companyName: values.companyName,
                  industry: values.industry,
                  market: values.market,
                  website: values.website,
                  tagline: values.tagline,
                  elevatorPitch: values.elevatorPitch,
                  toneOfVoice: values.toneOfVoice,
                  targetAudience: values.targetAudience,
                  brandPersonality: values.brandPersonality,
                  brandColors: values.brandColors,
                });
              }}
            />
            <ScanWebsiteModal
              open={scanOpen}
              onClose={() => {
                if (!extractMutation.isPending) {
                  setScanOpen(false);
                  setScanError('');
                }
              }}
              isAr={isAr}
              url={scanUrl}
              setUrl={setScanUrl}
              error={scanError}
              isPending={extractMutation.isPending}
              onSubmit={() => {
                setScanError('');
                const trimmed = scanUrl.trim();
                if (!trimmed) return;
                extractMutation.mutate({ url: trimmed });
              }}
            />
          </>
        )}

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-2xl border border-red-200/60 bg-red-500/10 p-4 text-sm text-red-700 dark:border-red-500/30 dark:text-red-300">
            {error}
            <button onClick={() => window.location.reload()} className="ml-2 underline">
              {isAr ? 'حاول تاني' : 'Retry'}
            </button>
          </div>
        )}

        {/* Empty State */}
        {history.length === 0 ? (
          <div className="wzrd-glass rounded-3xl p-10 text-center sm:p-12">
            <div className="mx-auto mb-6 flex h-28 w-28 items-center justify-center rounded-3xl border border-primary/15 bg-gradient-to-br from-primary/10 to-cyan-500/10 shadow-inner">
              <BrandHealthEmptyIllustration className="h-20 w-20" />
            </div>
            <h2 className="mb-2 text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
              {isAr ? 'مفيش تشخيصات لسه' : 'No diagnoses yet'}
            </h2>
            <p className="mx-auto mb-8 max-w-sm text-sm leading-loose text-zinc-600 dark:text-zinc-400">
              {isAr ? 'ابدأ أول تشخيص عشان تشوف صحة البراند بتاعك.' : 'Run your first diagnosis to see your brand health.'}
            </p>
            <button
              onClick={() => navigate('/tools/brand-diagnosis')}
              className="wzrd-shimmer-btn rounded-full bg-gradient-to-r from-primary to-violet-600 px-8 py-3.5 text-base font-bold text-primary-foreground shadow-lg shadow-primary/25 transition hover:-translate-y-0.5 hover:brightness-110"
            >
              {isAr ? 'شغّل أول تشخيص ←' : '→ Run First Diagnosis'}
            </button>
          </div>
        ) : (
          <>
            {/* Score Card */}
            <div className="wzrd-glass mb-4 rounded-3xl p-6">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm text-zinc-500 dark:text-zinc-400">{isAr ? 'آخر نتيجة' : 'Latest Score'}</span>
                <span className={`text-sm font-medium ${trendColor}`}>
                  {trendIcon} {trendLabel}
                </span>
              </div>
              <div className="flex items-end gap-3">
                <span className="text-5xl font-bold tabular-nums">{latest!.score}</span>
                <span className="mb-1 text-xl text-zinc-400">/100</span>
                {scoreDiff !== null && (
                  <span className={`text-lg font-semibold mb-1 ${scoreDiff > 0 ? 'text-green-600' : scoreDiff < 0 ? 'text-red-600' : 'text-gray-400'}`}>
                    {scoreDiff > 0 ? '+' : ''}{scoreDiff}
                  </span>
                )}
              </div>
              {/* Score Bar */}
              <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-zinc-200/80 dark:bg-zinc-700/80">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${latest!.score}%`,
                    backgroundColor: latest!.score >= 70 ? '#22c55e' : latest!.score >= 45 ? '#f59e0b' : '#ef4444',
                  }}
                />
              </div>
              <div className="mt-1 flex justify-between text-xs text-zinc-400">
                <span>{isAr ? 'حرج' : 'Critical'}</span>
                <span>{isAr ? 'ضعيف' : 'Weak'}</span>
                <span>{isAr ? 'محتاج شغل' : 'Needs Work'}</span>
                <span>{isAr ? 'قوي' : 'Strong'}</span>
              </div>
            </div>

            {/* Stats + score trend chart */}
            {chartData.length > 0 && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                  <div className="wzrd-glass rounded-3xl p-4 text-center">
                    <div className="mb-1 text-xs text-zinc-500 dark:text-zinc-400">{isAr ? 'عدد التشخيصات' : 'Diagnoses'}</div>
                    <div className="text-2xl font-bold tabular-nums">{history.length}</div>
                  </div>
                  <div className="wzrd-glass rounded-3xl p-4 text-center">
                    <div className="mb-1 text-xs text-zinc-500 dark:text-zinc-400">{isAr ? 'من أول لآخر نتيجة' : 'First → latest'}</div>
                    <div
                      className={`text-2xl font-bold tabular-nums ${
                        totalDelta === null ? 'text-zinc-400' : totalDelta > 0 ? 'text-green-600' : totalDelta < 0 ? 'text-red-600' : 'text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      {totalDelta === null ? '—' : `${totalDelta > 0 ? '+' : ''}${totalDelta}`}
                    </div>
                  </div>
                  <div className="wzrd-glass rounded-3xl p-4 text-center">
                    <div className="mb-1 text-xs text-zinc-500 dark:text-zinc-400">{isAr ? 'الحالة' : 'Status'}</div>
                    <div className={`text-lg font-semibold ${trendColor}`}>
                      {trendIcon} {trendLabel}
                    </div>
                  </div>
                </div>

                <div className="wzrd-glass mb-4 rounded-3xl p-4">
                  <h3 className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                    {isAr ? 'تطور النتيجة' : 'Score trend'}
                  </h3>
                  <div className="w-full" style={{ height: 220 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                        <defs>
                          <linearGradient id="wzrdScoreFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#00F0FF" stopOpacity={0.25} />
                            <stop offset="60%" stopColor="#7000FF" stopOpacity={0.08} />
                            <stop offset="100%" stopColor="#7000FF" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="wzrdScoreStroke" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#00F0FF" />
                            <stop offset="100%" stopColor="#A855F7" />
                          </linearGradient>
                          <filter id="wzrdLineGlow">
                            <feGaussianBlur stdDeviation="2" result="blur" />
                            <feMerge>
                              <feMergeNode in="blur" />
                              <feMergeNode in="SourceGraphic" />
                            </feMerge>
                          </filter>
                        </defs>

                        <CartesianGrid
                          strokeDasharray="0"
                          stroke="rgba(255,255,255,0.04)"
                          horizontal={true}
                          vertical={false}
                        />

                        <XAxis
                          dataKey="label"
                          tick={{ fontSize: 11, fill: '#52525B', fontFamily: 'Inter, sans-serif' }}
                          stroke="transparent"
                          tickLine={false}
                          axisLine={false}
                        />

                        <YAxis
                          domain={[0, 100]}
                          tick={{ fontSize: 11, fill: '#52525B', fontFamily: 'Inter, sans-serif' }}
                          stroke="transparent"
                          tickLine={false}
                          axisLine={false}
                          width={32}
                        />

                        <ReferenceLine
                          y={70}
                          stroke="rgba(34,197,94,0.3)"
                          strokeDasharray="4 4"
                          label={{ value: '70', fill: 'rgba(34,197,94,0.5)', fontSize: 10 }}
                        />
                        <ReferenceLine
                          y={40}
                          stroke="rgba(239,68,68,0.3)"
                          strokeDasharray="4 4"
                          label={{ value: '40', fill: 'rgba(239,68,68,0.5)', fontSize: 10 }}
                        />

                        <RechartsTooltip
                          contentStyle={{
                            borderRadius: '12px',
                            border: '1px solid rgba(255,255,255,0.08)',
                            background: 'rgba(10,10,10,0.95)',
                            backdropFilter: 'blur(16px)',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                            color: '#E4E4E7',
                            fontSize: '12px',
                          }}
                          itemStyle={{ color: '#00F0FF' }}
                          labelStyle={{ color: '#71717A', marginBottom: '4px' }}
                          formatter={(value: number) => [`${value}/100`, isAr ? 'النتيجة' : 'Score']}
                          labelFormatter={(_: unknown, payload: { payload?: { tool?: string } }[] | undefined) =>
                            payload?.[0]?.payload?.tool ?? ''
                          }
                          cursor={{ stroke: 'rgba(255,255,255,0.06)', strokeWidth: 1 }}
                        />

                        <Area
                          type="monotone"
                          dataKey="score"
                          stroke="url(#wzrdScoreStroke)"
                          strokeWidth={2}
                          fill="url(#wzrdScoreFill)"
                          filter="url(#wzrdLineGlow)"
                          dot={{
                            r: 4,
                            strokeWidth: 2,
                            stroke: '#00F0FF',
                            fill: '#050505',
                          }}
                          activeDot={{
                            r: 6,
                            stroke: '#00F0FF',
                            strokeWidth: 2,
                            fill: '#050505',
                            style: { filter: 'drop-shadow(0 0 6px #00F0FF)' },
                          }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            )}

            {/* Timeline */}
            {history.length > 1 && (
              <div className="wzrd-glass mb-4 rounded-3xl p-6">
                <h3 className="mb-4 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  {isAr ? 'السجل' : 'History'}
                </h3>
                <div className="space-y-3">
                  {history.slice(0, 6).map((entry, i) => (
                    <button
                      key={entry.id}
                      onClick={() => setSelectedDiagnosis(selectedDiagnosis?.id === entry.id ? null : entry)}
                      className="flex w-full items-center gap-3 rounded-2xl p-3 text-left transition hover:bg-zinc-100/70 dark:hover:bg-zinc-800/50"
                    >
                      <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                        style={{
                          backgroundColor: entry.score >= 70 ? '#dcfce7' : entry.score >= 45 ? '#fef3c7' : '#fee2e2',
                          color: entry.score >= 70 ? '#166534' : entry.score >= 45 ? '#92400e' : '#991b1b',
                        }}>
                        {entry.score}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="truncate text-sm font-medium">{toolName(entry.toolId)}</div>
                        <div className="text-xs text-zinc-400">{formatDate(entry.createdAt)}</div>
                      </div>
                      {i === 0 && (
                        <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded-full font-medium">
                          {isAr ? 'الأحدث' : 'Latest'}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Selected Diagnosis Details */}
            {selectedDiagnosis && (
              <div className="wzrd-glass mb-4 rounded-3xl border border-indigo-200/50 p-5 dark:border-indigo-500/25">
                <h3 className="mb-3 text-sm font-semibold text-indigo-800 dark:text-indigo-200">
                  {toolName(selectedDiagnosis.toolId)} — {formatDate(selectedDiagnosis.createdAt)}
                </h3>
                {(selectedDiagnosis.findings || []).map((f, i: number) => (
                  <div key={i} className="mb-2 text-sm">
                    <span className={`inline-block w-2 h-2 rounded-full mr-2 ${f.severity === 'high' ? 'bg-red-500' : f.severity === 'low' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                    <span className="font-medium">{f.title}</span>
                    {f.detail && <span className="ml-1 text-zinc-500">— {f.detail.substring(0, 100)}</span>}
                  </div>
                ))}
              </div>
            )}

            {/* Action Checklist */}
            {checklists.length > 0 && (
              <div className="wzrd-glass mb-4 rounded-3xl p-6">
                <h3 className="mb-1 text-base font-semibold">
                  {isAr ? 'خطواتك العملية' : 'Your Action Items'}
                </h3>
                {checklists.slice(0, 3).map(cl => {
                  const items = cl.items || [];
                  const pct = cl.totalCount > 0 ? Math.round((cl.completedCount / cl.totalCount) * 100) : 0;
                  return (
                    <div key={cl.id} className="mt-4">
                      {/* Progress */}
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                        <span>{cl.completedCount}/{cl.totalCount} {isAr ? 'مهمة' : 'tasks'}</span>
                        <span className="font-semibold text-indigo-600">{pct}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
                        <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                      {/* Items */}
                      <div className="space-y-2">
                        {items.map((item, idx: number) => (
                          <button
                            key={idx}
                            onClick={() => toggleItem(cl.id, idx)}
                            className={`flex w-full items-start gap-3 rounded-xl p-3 text-left transition ${item.completed ? 'bg-emerald-500/10' : 'bg-zinc-100/60 hover:bg-zinc-200/50 dark:bg-zinc-800/40 dark:hover:bg-zinc-700/50'}`}
                            style={{ minHeight: '48px' }}
                          >
                            <div
                              className={`mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md border-2 transition ${item.completed ? 'border-green-500 bg-green-500 text-white' : 'border-zinc-300 dark:border-zinc-600'}`}
                              style={{ minWidth: '24px', minHeight: '24px' }}
                            >
                              {item.completed && <span className="text-xs">✓</span>}
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className={`text-sm ${item.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                                {item.task}
                              </span>
                            </div>
                            {difficultyBadge(item.difficulty)}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {/* CTA after high completion */}
                {checklists[0] && checklists[0].completedCount >= checklists[0].totalCount * 0.7 && (
                  <div className="mt-6 rounded-2xl border border-indigo-200/50 bg-indigo-500/10 p-4 text-center dark:border-indigo-500/25">
                    <p className="mb-3 text-sm font-medium text-indigo-800 dark:text-indigo-200">
                      {isAr ? 'خلّصت أغلب المهام! شغّل تشخيص جديد وشوف التحسّن.' : 'Almost done! Run a new diagnosis to see improvement.'}
                    </p>
                    <button
                      onClick={() => navigate('/tools/brand-diagnosis')}
                      className="rounded-full bg-gradient-to-r from-primary to-violet-600 px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition hover:brightness-110"
                    >
                      {isAr ? 'شغّل تشخيص جديد ←' : '→ Run New Diagnosis'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ═══ FEATURE CARDS ═══ */}
            <div className="mb-4 grid grid-cols-2 gap-3">
              {/* Copilot Card */}
              <button
                onClick={() => navigate('/copilot')}
                className="wzrd-glass rounded-3xl p-4 text-center transition hover:ring-2 hover:ring-primary/15"
              >
                <div className="mb-2 text-2xl">🧙‍♂️</div>
                <h4 className="text-sm font-bold">{isAr ? 'المستشار الذكي' : 'AI Copilot'}</h4>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{isAr ? 'اسأل أي سؤال' : 'Ask anything'}</p>
              </button>

              {/* Benchmark Card */}
              <button
                onClick={() => navigate('/tools/benchmark')}
                className="wzrd-glass rounded-3xl p-4 text-center transition hover:ring-2 hover:ring-primary/15"
              >
                <div className="mb-2 text-2xl">📊</div>
                <h4 className="text-sm font-bold">{isAr ? 'قارن بالمنافسين' : 'Benchmark'}</h4>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{isAr ? '٤٠ كريدت' : '40 credits'}</p>
              </button>

              {/* Quick Diagnosis Card */}
              <button
                onClick={() => navigate('/tools/quick')}
                className="wzrd-glass rounded-3xl p-4 text-center transition hover:ring-2 hover:ring-primary/15"
              >
                <div className="mb-2 text-2xl">⚡</div>
                <h4 className="text-sm font-bold">{isAr ? 'تشخيص سريع' : 'Quick Check'}</h4>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{isAr ? '٥ أسئلة بس' : '5 questions'}</p>
              </button>

              {/* Referral Card */}
              <button
                onClick={async () => {
                  try {
                    const res = await fetch('/api/trpc/referral.myCode');
                    const d = await res.json();
                    const data = d.result?.data?.json ?? d.result?.data ?? {};
                    if (data.shareUrl) {
                      await navigator.clipboard.writeText(data.shareUrl);
                      alert(isAr ? 'تم نسخ رابط الإحالة! ✅\nابعته لصاحبك — كل واحد فيكم هياخد ٥٠ كريدت.' : 'Referral link copied! ✅\nShare it — you both get 50 credits.');
                    }
                  } catch {
                    alert(isAr ? 'سجّل دخول الأول' : 'Please login first');
                  }
                }}
                className="wzrd-glass rounded-3xl p-4 text-center transition hover:ring-2 hover:ring-primary/15"
              >
                <div className="mb-2 text-2xl">🎁</div>
                <h4 className="text-sm font-bold">{isAr ? 'ادعي صاحبك' : 'Invite Friends'}</h4>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{isAr ? '٥٠ كريدت لكل واحد' : '50 credits each'}</p>
              </button>
            </div>

            {/* Re-diagnose CTA */}
            <div className="mt-4">
              <button
                onClick={() => navigate('/tools/brand-diagnosis')}
                className="w-full rounded-3xl bg-gradient-to-r from-primary via-violet-600 to-cyan-600 py-4 text-base font-semibold text-white shadow-lg shadow-primary/25 transition hover:brightness-110"
              >
                {isAr ? 'شغّل تشخيص جديد وقارن' : 'Run New Diagnosis & Compare'}
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
