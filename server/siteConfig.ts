/**
 * Site Config Store — DB-backed. Controls everything from Admin Panel.
 * 
 * - On server start: loads from DB into memory
 * - On update: saves to both memory AND DB
 * - If DB empty: seeds with defaults
 */

import { logger } from './_core/logger';

// ════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════

export interface HomepageConfig {
  heroTitle: string; heroTitleAr: string;
  heroSubtitle: string; heroSubtitleAr: string;
  ctaText: string; ctaTextAr: string;
  ctaUrl: string; showSignupForm: boolean;
  // Hero 50/50 split image (optional — if empty, centered layout is used)
  heroImageUrl?: string;
  // Mid-page ad banner (image / GIF / video)
  adBannerEnabled?: boolean;
  adBannerUrl?: string;
  adBannerType?: 'image' | 'gif' | 'video';
  adBannerLink?: string;
  // Founder quote section
  founderName?: string;
  founderTitleEn?: string;
  founderTitleAr?: string;
  founderQuoteEn?: string;
  founderQuoteAr?: string;
  founderImageUrl?: string;
  founderLinkedin?: string;
}

export interface ServiceItem {
  id: string; nameEn: string; nameAr: string;
  descEn: string; descAr: string;
  tier: 'audit' | 'build' | 'takeoff'; enabled: boolean;
}

export interface SiteSettings {
  companyName: string; whatsapp: string; email: string;
  instagram: string; linkedin: string; website: string;
  taglineEn: string; taglineAr: string;
}

export interface ToolPrompt {
  toolId: string; toolName: string;
  systemPrompt: string; enabled: boolean;
}

/** Credit purchase plans — editable from admin; drives Paymob + pricing page. */
export interface CreditPlanDef {
  id: string;
  credits: number;
  priceEGP: number;
  name: string;
  nameAr: string;
  descEn?: string;
  descAr?: string;
  popular?: boolean;
  /** Legacy Paymob plans (starter/pro/agency): keep purchasable but hide from marketing grid. */
  hideFromPricing?: boolean;
  sortOrder?: number;
}

export interface CreditPlansConfig {
  plans: CreditPlanDef[];
}

export interface SiteConfig {
  homepage: HomepageConfig;
  services: { services: ServiceItem[] };
  site: SiteSettings;
  prompts: ToolPrompt[];
  creditPlans: CreditPlansConfig;
}

/** Stripped config for /api/public/site-config — never expose systemPrompt. */
export type PublicToolPromptMeta = Pick<ToolPrompt, 'toolId' | 'toolName' | 'enabled'>;

export type PublicSiteConfig = Omit<SiteConfig, 'prompts'> & { prompts: PublicToolPromptMeta[] };

// ════════════════════════════════════════════
// DEFAULT CONFIG
// ════════════════════════════════════════════

const DEFAULT_CONFIG: SiteConfig = {
  homepage: {
    heroTitle: 'Diagnose. Design. Deploy.',
    heroTitleAr: 'شخّص. صمّم. أطلق.',
    heroSubtitle: 'AI-powered brand tools for entrepreneurs who want clarity, not guesswork.',
    heroSubtitleAr: 'أدوات AI للبراند لرواد الأعمال اللي عايزين وضوح، مش تخمين.',
    ctaText: 'Get 100 Free Credits', ctaTextAr: 'احصل على 100 كريدت مجاناً',
    ctaUrl: '/signup', showSignupForm: true,
  },
  services: {
    services: [
      { id: 'brand_audit', nameEn: 'Brand Audit', nameAr: 'فحص البراند', descEn: 'Complete brand health assessment', descAr: 'تقييم شامل لصحة البراند', tier: 'audit', enabled: true },
      { id: 'offer_architecture', nameEn: 'Offer Architecture', nameAr: 'هندسة العرض', descEn: 'Restructure packages and pricing', descAr: 'إعادة هيكلة الباكدجات والتسعير', tier: 'build', enabled: true },
      { id: 'brand_identity', nameEn: 'Brand Identity System', nameAr: 'نظام هوية البراند', descEn: 'Logo, visual system, brand guidelines', descAr: 'لوجو، نظام بصري، ودليل البراند', tier: 'build', enabled: true },
      { id: 'messaging_framework', nameEn: 'Messaging Framework', nameAr: 'إطار الرسائل', descEn: 'Unified messaging across touchpoints', descAr: 'رسائل موحدة عبر كل نقاط التماس', tier: 'build', enabled: true },
      { id: 'launch_system', nameEn: 'Launch System', nameAr: 'نظام الإطلاق', descEn: 'Full go-to-market system', descAr: 'نظام دخول السوق الكامل', tier: 'takeoff', enabled: true },
      { id: 'growth_engine', nameEn: 'Growth Engine', nameAr: 'محرك النمو', descEn: 'Ongoing brand optimization', descAr: 'تحسين البراند المستمر', tier: 'takeoff', enabled: true },
    ],
  },
  site: {
    companyName: 'Primo Marca', whatsapp: '201107107012', email: 'hello@primomarca.com',
    instagram: '@primomarca', linkedin: 'primomarca', website: 'https://wzzrdai.com',
    taglineEn: 'Marks Fade, MARCAS Don\'t.', taglineAr: 'العلامات بتختفي، الـ MARCAS لا.',
  },
  prompts: [
    { toolId: 'brand_diagnosis', toolName: 'Brand Diagnosis', enabled: true,
      systemPrompt: 'You are WZZRD AI — a brand diagnosis engine trained on Keller\'s CBBE, Kapferer\'s Identity Prism, Sharp\'s How Brands Grow, and real MENA market data.' },
    { toolId: 'offer_check', toolName: 'Offer Logic Check', enabled: true,
      systemPrompt: 'You are a pricing and offer strategist. Analyze offer structure using the jam study principle, anchoring effects, and decoy pricing.' },
    { toolId: 'message_check', toolName: 'Message Check', enabled: true,
      systemPrompt: 'You are a messaging consistency expert. Compare messaging across touchpoints.' },
    { toolId: 'presence_audit', toolName: 'Presence Audit', enabled: true,
      systemPrompt: 'You are a digital presence auditor. Evaluate the brand\'s online footprint.' },
    { toolId: 'identity_snapshot', toolName: 'Identity Snapshot', enabled: true,
      systemPrompt: 'You are a brand identity analyst using Kapferer\'s Prism.' },
    { toolId: 'launch_readiness', toolName: 'Launch Readiness', enabled: true,
      systemPrompt: 'You are a go-to-market readiness assessor. Score readiness across 5 dimensions.' },
  ],
  creditPlans: {
    plans: [
      { id: 'single_report', credits: 100, priceEGP: 99, name: 'Single Report', nameAr: 'تقرير واحد', descEn: '1 Premium AI report', descAr: 'تقرير مفصّل واحد', popular: false, sortOrder: 10 },
      { id: 'single_report_pro', credits: 200, priceEGP: 199, name: 'Full Report Pro', nameAr: 'تقرير مفصّل Pro', descEn: 'Extended premium analysis', descAr: 'تحليل بريميوم موسّع', popular: false, hideFromPricing: true, sortOrder: 12 },
      { id: 'bundle_6', credits: 800, priceEGP: 499, name: '6-Report Bundle', nameAr: 'باقة ٦ تقارير', descEn: 'Save 45% — comprehensive', descAr: 'وفّر ٤٥% — أشمل تحليل', popular: true, sortOrder: 20 },
      { id: 'credits_500', credits: 500, priceEGP: 499, name: '500 Credits', nameAr: '٥٠٠ كريدت', descEn: '~25 tool runs', descAr: '~٢٥ أداة تشخيص', popular: false, sortOrder: 30 },
      { id: 'credits_1500', credits: 1500, priceEGP: 999, name: '1500 Credits', nameAr: '١٥٠٠ كريدت', descEn: 'Best value — ~75 tools', descAr: 'الأوفر — ~٧٥ أداة', popular: false, sortOrder: 40 },
      { id: 'starter', credits: 500, priceEGP: 499, name: 'Starter — 500 Credits', nameAr: 'ستارتر — 500 نقطة', descEn: '', descAr: '', popular: false, hideFromPricing: true, sortOrder: 100 },
      { id: 'pro', credits: 1500, priceEGP: 999, name: 'Pro — 1,500 Credits', nameAr: 'برو — 1,500 نقطة', popular: false, hideFromPricing: true, sortOrder: 101 },
      { id: 'agency', credits: 5000, priceEGP: 2499, name: 'Agency — 5,000 Credits', nameAr: 'وكالة — 5,000 نقطة', popular: false, hideFromPricing: true, sortOrder: 102 },
    ],
  },
};

// ════════════════════════════════════════════
// IN-MEMORY STORE (loaded from DB on startup)
// ════════════════════════════════════════════

let config: SiteConfig = JSON.parse(JSON.stringify(DEFAULT_CONFIG));

const PLACEHOLDER_WHATSAPP = '201XXXXXXXXX';

function normalizeSiteWhatsApp(): void {
  const w = (config.site?.whatsapp || '').trim();
  if (!w || w === PLACEHOLDER_WHATSAPP) {
    config.site = { ...config.site, whatsapp: DEFAULT_CONFIG.site.whatsapp };
  }
}

/** After DB load: ensure new default plan IDs exist (e.g. `single_report_pro`) without removing admin edits. */
function mergeMissingCreditPlansFromDefaults(): void {
  let added = false;
  for (const d of DEFAULT_CONFIG.creditPlans.plans) {
    if (!config.creditPlans.plans.some((p) => p.id === d.id)) {
      config.creditPlans.plans.push(JSON.parse(JSON.stringify(d)));
      added = true;
    }
  }
  if (added) {
    void saveSectionToDb('creditPlans', config.creditPlans);
    logger.info('[SiteConfig] Merged missing default credit plans into stored config');
  }
}

// ════════════════════════════════════════════
// DB OPERATIONS
// ════════════════════════════════════════════

async function getDb() {
  try {
    const { getDb: gdb } = await import('./db');
    return await gdb();
  } catch { return null; }
}

/** Load config from DB on startup */
export async function loadConfigFromDb(): Promise<void> {
  try {
    const db = await getDb();
    if (!db) { logger.warn('[SiteConfig] No DB — using defaults'); return; }

    const { siteConfigTable } = await import('../drizzle/schema');
    const rows = await db.select().from(siteConfigTable);

    if (rows.length === 0) {
      // Seed DB with defaults
      logger.info('[SiteConfig] No DB config found — seeding defaults');
      await saveConfigToDb();
    } else {
      // Load from DB
      for (const row of rows) {
        try {
          const val = JSON.parse(row.value);
          if (row.key === 'homepage') config.homepage = val;
          else if (row.key === 'services') config.services = val;
          else if (row.key === 'site') config.site = { ...DEFAULT_CONFIG.site, ...val };
          else if (row.key === 'prompts') config.prompts = val;
          else if (row.key === 'creditPlans') config.creditPlans = { plans: Array.isArray(val?.plans) ? val.plans : [] };
        } catch { /* skip bad rows */ }
      }
      if (!config.creditPlans?.plans?.length) {
        config.creditPlans = JSON.parse(JSON.stringify(DEFAULT_CONFIG.creditPlans));
      } else {
        mergeMissingCreditPlansFromDefaults();
      }
      normalizeSiteWhatsApp();
      logger.info({ keysLoaded: rows.length }, '[SiteConfig] Loaded from DB');
    }
  } catch (err) {
    logger.warn({ err }, '[SiteConfig] DB load failed — using defaults');
  }
}

/** Save all config sections to DB */
async function saveConfigToDb(): Promise<void> {
  try {
    const db = await getDb();
    if (!db) return;

    const { siteConfigTable } = await import('../drizzle/schema');

    const sections: Array<{ key: string; value: string }> = [
      { key: 'homepage', value: JSON.stringify(config.homepage) },
      { key: 'services', value: JSON.stringify(config.services) },
      { key: 'site', value: JSON.stringify(config.site) },
      { key: 'prompts', value: JSON.stringify(config.prompts) },
      { key: 'creditPlans', value: JSON.stringify(config.creditPlans) },
    ];

    for (const s of sections) {
      await db.insert(siteConfigTable)
        .values({ key: s.key, value: s.value })
        .onDuplicateKeyUpdate({ set: { value: s.value } });
    }
  } catch (err) {
    logger.error({ err }, '[SiteConfig] DB save failed');
  }
}

/** Save a specific section to DB */
async function saveSectionToDb(key: string, value: unknown): Promise<void> {
  try {
    const db = await getDb();
    if (!db) return;
    const { siteConfigTable } = await import('../drizzle/schema');
    await db.insert(siteConfigTable)
      .values({ key, value: JSON.stringify(value) })
      .onDuplicateKeyUpdate({ set: { value: JSON.stringify(value) } });
  } catch (err) {
    logger.error({ err, key }, '[SiteConfig] Section save failed');
  }
}

// ════════════════════════════════════════════
// PUBLIC API
// ════════════════════════════════════════════

export function getSiteConfig(): SiteConfig {
  return config;
}

export function getPublicSiteConfig(): PublicSiteConfig {
  normalizeSiteWhatsApp();
  return {
    homepage: config.homepage,
    services: config.services,
    site: config.site,
    creditPlans: { plans: getCreditPlansList().filter((p) => !p.hideFromPricing) },
    prompts: config.prompts.map((p) => ({
      toolId: p.toolId,
      toolName: p.toolName,
      enabled: p.enabled,
    })),
  };
}

/** Paymob-compatible map (all plans including hidden-from-pricing). */
export function getPaymobPlansMap(): Record<
  string,
  { credits: number; amountEGP: number; amountCents: number; name: string; nameAr: string }
> {
  const map: Record<string, { credits: number; amountEGP: number; amountCents: number; name: string; nameAr: string }> = {};
  for (const p of getCreditPlansList()) {
    map[p.id] = {
      credits: p.credits,
      amountEGP: p.priceEGP,
      amountCents: Math.round(p.priceEGP * 100),
      name: p.name,
      nameAr: p.nameAr,
    };
  }
  return map;
}

export function getCreditPlansList(): CreditPlanDef[] {
  const plans = [...(config.creditPlans?.plans || [])];
  return plans.sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999) || a.id.localeCompare(b.id));
}

/** Premium tool pricing (API + UI) — synced to credit plan IDs editable in admin. */
export interface PremiumPriceEntry {
  credits: number;
  egp: number;
  label: string;
  labelEn: string;
}

export type PremiumPricesMap = {
  single_report: PremiumPriceEntry;
  single_report_pro: PremiumPriceEntry;
  bundle_6: PremiumPriceEntry;
  credits_500: PremiumPriceEntry;
  credits_1500: PremiumPriceEntry;
};

const PREMIUM_PRICES_FALLBACK: PremiumPricesMap = {
  single_report: { credits: 100, egp: 99, label: 'تقرير مفصّل', labelEn: 'Full Report' },
  single_report_pro: { credits: 200, egp: 199, label: 'تقرير مفصّل Pro', labelEn: 'Full Report Pro' },
  bundle_6: { credits: 800, egp: 499, label: 'باقة ٦ تقارير', labelEn: '6-Report Bundle (Save 45%)' },
  credits_500: { credits: 500, egp: 499, label: '٥٠٠ كريدت', labelEn: '500 Credits' },
  credits_1500: { credits: 1500, egp: 999, label: '١٥٠٠ كريدت (الأوفر)', labelEn: '1500 Credits (Best Value)' },
};

function premiumEntryFromPlan(planId: string, fallback: PremiumPriceEntry): PremiumPriceEntry {
  const p = config.creditPlans.plans.find((x) => x.id === planId);
  if (!p) return fallback;
  return {
    credits: p.credits,
    egp: p.priceEGP,
    label: p.nameAr || fallback.label,
    labelEn: p.name || fallback.labelEn,
  };
}

export function getPremiumPrices(): PremiumPricesMap {
  return {
    single_report: premiumEntryFromPlan('single_report', PREMIUM_PRICES_FALLBACK.single_report),
    single_report_pro: premiumEntryFromPlan('single_report_pro', PREMIUM_PRICES_FALLBACK.single_report_pro),
    bundle_6: premiumEntryFromPlan('bundle_6', PREMIUM_PRICES_FALLBACK.bundle_6),
    credits_500: premiumEntryFromPlan('credits_500', PREMIUM_PRICES_FALLBACK.credits_500),
    credits_1500: premiumEntryFromPlan('credits_1500', PREMIUM_PRICES_FALLBACK.credits_1500),
  };
}

/** Credits deducted for in-app «full premium report» (Claude) — uses `single_report` plan. */
export function getPremiumReportCreditCost(): number {
  return getPremiumPrices().single_report.credits;
}

export function upsertCreditPlan(
  planId: string,
  updates: Partial<Omit<CreditPlanDef, 'id'>>
): void {
  if (!planId.trim()) return;
  const id = planId.trim();
  const list = config.creditPlans.plans;
  const idx = list.findIndex((p) => p.id === id);
  const existing = idx >= 0 ? list[idx] : null;
  const merged: CreditPlanDef = {
    id,
    credits: updates.credits ?? existing?.credits ?? 100,
    priceEGP: updates.priceEGP ?? existing?.priceEGP ?? 99,
    name: updates.name ?? existing?.name ?? id,
    nameAr: updates.nameAr ?? existing?.nameAr ?? id,
    descEn: updates.descEn ?? existing?.descEn ?? '',
    descAr: updates.descAr ?? existing?.descAr ?? '',
    popular: updates.popular ?? existing?.popular ?? false,
    hideFromPricing: updates.hideFromPricing ?? existing?.hideFromPricing ?? false,
    sortOrder: updates.sortOrder ?? existing?.sortOrder ?? (list.length ? Math.max(...list.map((p) => p.sortOrder ?? 0)) + 1 : 0),
  };
  if (updates.popular === true) {
    for (const p of list) {
      if (p.id !== id) p.popular = false;
    }
  }
  if (idx >= 0) list[idx] = merged;
  else list.push(merged);
  saveSectionToDb('creditPlans', config.creditPlans);
  logger.info({ planId: id }, '[SiteConfig] Credit plan upserted + saved to DB');
}

export function removeCreditPlan(planId: string): boolean {
  const before = config.creditPlans.plans.length;
  config.creditPlans.plans = config.creditPlans.plans.filter((p) => p.id !== planId);
  if (config.creditPlans.plans.length === before) return false;
  saveSectionToDb('creditPlans', config.creditPlans);
  return true;
}

export function updateHomepage(updates: Partial<HomepageConfig>): HomepageConfig {
  config.homepage = { ...config.homepage, ...updates };
  saveSectionToDb('homepage', config.homepage);
  logger.info({ updates: Object.keys(updates) }, '[SiteConfig] Homepage updated + saved to DB');
  return config.homepage;
}

export function updateSiteSettings(updates: Partial<SiteSettings>): SiteSettings {
  config.site = { ...config.site, ...updates };
  saveSectionToDb('site', config.site);
  logger.info({ updates: Object.keys(updates) }, '[SiteConfig] Site settings updated + saved to DB');
  return config.site;
}

export function updateService(serviceId: string, updates: Partial<ServiceItem>): boolean {
  const svc = config.services.services.find(s => s.id === serviceId);
  if (!svc) return false;
  Object.assign(svc, updates);
  saveSectionToDb('services', config.services);
  logger.info({ serviceId }, '[SiteConfig] Service updated + saved to DB');
  return true;
}

export function updateToolPrompt(toolId: string, updates: Partial<ToolPrompt>): boolean {
  const prompt = config.prompts.find(p => p.toolId === toolId);
  if (!prompt) return false;
  Object.assign(prompt, updates);
  saveSectionToDb('prompts', config.prompts);
  logger.info({ toolId }, '[SiteConfig] Prompt updated + saved to DB');
  return true;
}

/** Get system prompt for a specific tool — used by tools.ts */
export function getToolSystemPrompt(toolId: string): string | null {
  const prompt = config.prompts.find(p => p.toolId === toolId);
  if (!prompt || !prompt.enabled) return null;
  return prompt.systemPrompt;
}

/** Check if a tool is enabled */
export function isToolEnabled(toolId: string): boolean {
  const prompt = config.prompts.find(p => p.toolId === toolId);
  return prompt?.enabled ?? true;
}

export function resetConfig(): SiteConfig {
  config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
  saveConfigToDb();
  logger.info('[SiteConfig] Reset to defaults + saved to DB');
  return config;
}
