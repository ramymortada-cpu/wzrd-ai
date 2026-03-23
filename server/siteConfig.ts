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

export interface CreditPlan {
  id: string;
  credits: number;
  priceEGP: number;
  name: string;
  nameAr: string;
  description?: string;
  descriptionAr?: string;
  popular?: boolean;
  enabled: boolean;
  sortOrder: number;
}

export interface SiteConfig {
  homepage: HomepageConfig;
  services: { services: ServiceItem[] };
  site: SiteSettings;
  prompts: ToolPrompt[];
  creditPlans: CreditPlan[];
}

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
    companyName: 'Primo Marca', whatsapp: '201XXXXXXXXX', email: 'hello@primomarca.com',
    instagram: '@primomarca', linkedin: 'primomarca', website: 'https://primomarca.com',
    taglineEn: 'Marks Fade, MARCAS Don\'t.', taglineAr: 'العلامات بتختفي، الـ MARCAS لا.',
  },
  creditPlans: [
    { id: 'starter', credits: 500, priceEGP: 499, name: 'Starter', nameAr: 'ستارتر', description: '~20 tool runs', descriptionAr: '~20 تشغيل', popular: false, enabled: true, sortOrder: 1 },
    { id: 'pro', credits: 1500, priceEGP: 999, name: 'Pro', nameAr: 'برو', description: '~60 tool runs — best value', descriptionAr: '~60 تشغيل — أفضل قيمة', popular: true, enabled: true, sortOrder: 2 },
    { id: 'agency', credits: 5000, priceEGP: 2499, name: 'Agency', nameAr: 'وكالة', description: '~200 tool runs', descriptionAr: '~200 تشغيل', popular: false, enabled: true, sortOrder: 3 },
  ],
  prompts: [
    { toolId: 'brand_diagnosis', toolName: 'Brand Diagnosis', enabled: true,
      systemPrompt: 'You are WZRD AI — a brand diagnosis engine trained on Keller\'s CBBE, Kapferer\'s Identity Prism, Sharp\'s How Brands Grow, and real MENA market data.' },
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
};

// ════════════════════════════════════════════
// IN-MEMORY STORE (loaded from DB on startup)
// ════════════════════════════════════════════

let config: SiteConfig = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
let dbReady = false;

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
      const keys = new Set(rows.map((r: any) => r.key));
      for (const row of rows) {
        try {
          const val = JSON.parse(row.value);
          if (row.key === 'homepage') config.homepage = val;
          else if (row.key === 'services') config.services = val;
          else if (row.key === 'site') config.site = val;
          else if (row.key === 'creditPlans') config.creditPlans = Array.isArray(val) ? val : config.creditPlans;
          else if (row.key === 'prompts') config.prompts = val;
        } catch { /* skip bad rows */ }
      }
      if (!keys.has('creditPlans')) saveSectionToDb('creditPlans', config.creditPlans);
      logger.info('[SiteConfig] Loaded from DB (%d keys)', rows.length);
    }
    dbReady = true;
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
    const { sql } = await import('drizzle-orm');

    const sections: Array<{ key: string; value: string }> = [
      { key: 'homepage', value: JSON.stringify(config.homepage) },
      { key: 'services', value: JSON.stringify(config.services) },
      { key: 'site', value: JSON.stringify(config.site) },
      { key: 'creditPlans', value: JSON.stringify(config.creditPlans) },
      { key: 'prompts', value: JSON.stringify(config.prompts) },
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

export function getSiteConfig(): SiteConfig { return config; }

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

/** Get enabled credit plans (for Paymob + Pricing page) */
export function getCreditPlans(): CreditPlan[] {
  return config.creditPlans
    .filter(p => p.enabled)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

/** Update or add a credit plan */
export function updateCreditPlan(planId: string, updates: Partial<CreditPlan>): boolean {
  const plan = config.creditPlans.find(p => p.id === planId);
  if (plan) {
    Object.assign(plan, updates);
  } else {
    const maxOrder = Math.max(0, ...config.creditPlans.map(p => p.sortOrder));
    config.creditPlans.push({
      id: planId,
      credits: updates.credits ?? 0,
      priceEGP: updates.priceEGP ?? 0,
      name: updates.name ?? planId,
      nameAr: updates.nameAr ?? planId,
      enabled: updates.enabled ?? true,
      sortOrder: maxOrder + 1,
      ...updates,
    } as CreditPlan);
  }
  saveSectionToDb('creditPlans', config.creditPlans);
  logger.info({ planId }, '[SiteConfig] Credit plan updated + saved to DB');
  return true;
}

/** Add new credit plan */
export function addCreditPlan(plan: Omit<CreditPlan, 'sortOrder'> & { sortOrder?: number }): boolean {
  const maxOrder = Math.max(0, ...config.creditPlans.map(p => p.sortOrder));
  config.creditPlans.push({
    ...plan,
    sortOrder: plan.sortOrder ?? maxOrder + 1,
  } as CreditPlan);
  saveSectionToDb('creditPlans', config.creditPlans);
  logger.info({ planId: plan.id }, '[SiteConfig] Credit plan added + saved to DB');
  return true;
}

/** Remove credit plan (soft disable or delete) */
export function removeCreditPlan(planId: string): boolean {
  const idx = config.creditPlans.findIndex(p => p.id === planId);
  if (idx < 0) return false;
  config.creditPlans.splice(idx, 1);
  saveSectionToDb('creditPlans', config.creditPlans);
  logger.info({ planId }, '[SiteConfig] Credit plan removed + saved to DB');
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
