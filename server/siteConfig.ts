/**
 * Site Config Store — central config for everything editable from Admin Panel.
 * 
 * Sections:
 * - homepage: hero text, subtitle, CTA
 * - services: service names, descriptions
 * - site: WhatsApp, social links, company info
 * - prompts: AI tool system prompts
 * - tools: enable/disable individual tools
 * 
 * NOTE: Stored in-memory. Resets on server restart.
 * For persistence, move to DB (siteConfig table) later.
 */

import { logger } from './_core/logger';

// ════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════

export interface HomepageConfig {
  heroTitle: string;
  heroTitleAr: string;
  heroSubtitle: string;
  heroSubtitleAr: string;
  ctaText: string;
  ctaTextAr: string;
  ctaUrl: string;
  showSignupForm: boolean;
}

export interface ServicesConfig {
  services: Array<{
    id: string;
    nameEn: string;
    nameAr: string;
    descEn: string;
    descAr: string;
    tier: 'audit' | 'build' | 'takeoff';
    enabled: boolean;
  }>;
}

export interface SiteSettings {
  companyName: string;
  whatsapp: string;
  email: string;
  instagram: string;
  linkedin: string;
  website: string;
  taglineEn: string;
  taglineAr: string;
}

export interface ToolPrompt {
  toolId: string;
  toolName: string;
  systemPrompt: string;
  enabled: boolean;
}

export interface SiteConfig {
  homepage: HomepageConfig;
  services: ServicesConfig;
  site: SiteSettings;
  prompts: ToolPrompt[];
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
    ctaText: 'Get 100 Free Credits',
    ctaTextAr: 'احصل على 100 كريدت مجاناً',
    ctaUrl: '/signup',
    showSignupForm: true,
  },
  services: {
    services: [
      { id: 'brand_audit', nameEn: 'Brand Audit', nameAr: 'فحص البراند', descEn: 'Complete brand health assessment with actionable findings', descAr: 'تقييم شامل لصحة البراند مع نتائج قابلة للتنفيذ', tier: 'audit', enabled: true },
      { id: 'offer_architecture', nameEn: 'Offer Architecture', nameAr: 'هندسة العرض', descEn: 'Restructure your packages and pricing for maximum conversion', descAr: 'إعادة هيكلة باكدجاتك وتسعيرك لأقصى تحويل', tier: 'build', enabled: true },
      { id: 'brand_identity', nameEn: 'Brand Identity System', nameAr: 'نظام هوية البراند', descEn: 'Logo, visual system, verbal tone, and brand guidelines', descAr: 'لوجو، نظام بصري، نبرة صوت، ودليل البراند', tier: 'build', enabled: true },
      { id: 'messaging_framework', nameEn: 'Messaging Framework', nameAr: 'إطار الرسائل', descEn: 'Unified messaging across all touchpoints', descAr: 'رسائل موحدة عبر كل نقاط التماس', tier: 'build', enabled: true },
      { id: 'launch_system', nameEn: 'Launch System', nameAr: 'نظام الإطلاق', descEn: 'Full go-to-market system: content, channels, campaigns', descAr: 'نظام دخول السوق الكامل: محتوى، قنوات، حملات', tier: 'takeoff', enabled: true },
      { id: 'growth_engine', nameEn: 'Growth Engine', nameAr: 'محرك النمو', descEn: 'Ongoing brand management and optimization', descAr: 'إدارة وتحسين البراند المستمر', tier: 'takeoff', enabled: true },
    ],
  },
  site: {
    companyName: 'Primo Marca',
    whatsapp: '201XXXXXXXXX',
    email: 'hello@primomarca.com',
    instagram: '@primomarca',
    linkedin: 'primomarca',
    website: 'https://primomarca.com',
    taglineEn: 'Marks Fade, MARCAS Don\'t.',
    taglineAr: 'العلامات بتختفي، الـ MARCAS لا.',
  },
  prompts: [
    { toolId: 'brand_diagnosis', toolName: 'Brand Diagnosis', enabled: true,
      systemPrompt: 'You are a brand strategist using Keller\'s CBBE and Kapferer\'s Prism frameworks. Analyze the brand and return a JSON object with: score (0-100), findings (array of {area, issue, severity, recommendation}), and serviceRecommendation (if score < 70).' },
    { toolId: 'offer_check', toolName: 'Offer Logic Check', enabled: true,
      systemPrompt: 'You are a pricing and offer strategist. Analyze the offer structure using the jam study principle, anchoring effects, and decoy pricing. Return JSON with: score (0-100), findings (array), and serviceRecommendation.' },
    { toolId: 'message_check', toolName: 'Message Check', enabled: true,
      systemPrompt: 'You are a messaging consistency expert. Compare messaging across touchpoints (tagline, bio, website, key message). Return JSON with: score (0-100), findings (array), and serviceRecommendation.' },
    { toolId: 'presence_audit', toolName: 'Presence Audit', enabled: true,
      systemPrompt: 'You are a digital presence auditor. Evaluate the brand\'s online footprint across channels. Return JSON with: score (0-100), findings (array), and serviceRecommendation.' },
    { toolId: 'identity_snapshot', toolName: 'Identity Snapshot', enabled: true,
      systemPrompt: 'You are a brand identity analyst using Kapferer\'s Prism. Evaluate if the brand personality matches the target audience. Return JSON with: score (0-100), findings (array), and serviceRecommendation.' },
    { toolId: 'launch_readiness', toolName: 'Launch Readiness', enabled: true,
      systemPrompt: 'You are a go-to-market readiness assessor. Score readiness across 5 dimensions: guidelines, offer, content, web, strategy. Return JSON with: score (0-100), findings (array), and serviceRecommendation.' },
  ],
};

// ════════════════════════════════════════════
// STORE (in-memory, mutable)
// ════════════════════════════════════════════

let config: SiteConfig = JSON.parse(JSON.stringify(DEFAULT_CONFIG));

/** Get full config */
export function getSiteConfig(): SiteConfig {
  return config;
}

/** Update homepage config */
export function updateHomepage(updates: Partial<HomepageConfig>): HomepageConfig {
  config.homepage = { ...config.homepage, ...updates };
  logger.info({ updates: Object.keys(updates) }, '[SiteConfig] Homepage updated');
  return config.homepage;
}

/** Update site settings */
export function updateSiteSettings(updates: Partial<SiteSettings>): SiteSettings {
  config.site = { ...config.site, ...updates };
  logger.info({ updates: Object.keys(updates) }, '[SiteConfig] Site settings updated');
  return config.site;
}

/** Update a service */
export function updateService(serviceId: string, updates: Partial<ServicesConfig['services'][0]>): boolean {
  const svc = config.services.services.find(s => s.id === serviceId);
  if (!svc) return false;
  Object.assign(svc, updates);
  logger.info({ serviceId, updates: Object.keys(updates) }, '[SiteConfig] Service updated');
  return true;
}

/** Update a tool prompt */
export function updateToolPrompt(toolId: string, updates: Partial<ToolPrompt>): boolean {
  const prompt = config.prompts.find(p => p.toolId === toolId);
  if (!prompt) return false;
  Object.assign(prompt, updates);
  logger.info({ toolId, updates: Object.keys(updates) }, '[SiteConfig] Tool prompt updated');
  return true;
}

/** Reset to defaults */
export function resetConfig(): SiteConfig {
  config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
  logger.info('[SiteConfig] Reset to defaults');
  return config;
}
