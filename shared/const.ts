export const COOKIE_NAME = "app_session_id";
export const ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365;
export const AXIOS_TIMEOUT_MS = 30_000;
export const UNAUTHED_ERR_MSG = 'Please login (10001)';
export const NOT_ADMIN_ERR_MSG = 'You do not have required permission (10002)';

// Service types
export const SERVICE_TYPES = [
  'business_health_check',
  'starting_business_logic',
  'brand_identity',
  'business_takeoff',
  'consultation',
] as const;

export type ServiceType = typeof SERVICE_TYPES[number];

// Service labels (display names)
export const SERVICE_LABELS: Record<ServiceType, string> = {
  business_health_check: 'Business Health Check',
  starting_business_logic: 'Clarity Package (Business Logic)',
  brand_identity: 'Brand Foundation (Brand Identity)',
  business_takeoff: 'Business Takeoff',
  consultation: 'Growth Partnership (Consultation)',
};

// Service labels in Arabic
export const SERVICE_LABELS_AR: Record<ServiceType, string> = {
  business_health_check: 'فحص صحة الأعمال',
  starting_business_logic: 'حزمة الوضوح (منطق الأعمال)',
  brand_identity: 'أساس العلامة التجارية (الهوية)',
  business_takeoff: 'انطلاقة الأعمال',
  consultation: 'شراكة النمو (استشارة)',
};

// 4D Framework stages
export const STAGES = ['diagnose', 'design', 'deploy', 'optimize'] as const;
export type Stage = typeof STAGES[number];

// Stage labels
export const STAGE_LABELS: Record<string, string> = {
  diagnose: 'Diagnose',
  design: 'Design',
  deploy: 'Deploy',
  optimize: 'Optimize',
  completed: 'Completed',
};

export const STAGE_LABELS_AR: Record<string, string> = {
  diagnose: 'تشخيص',
  design: 'تصميم',
  deploy: 'تنفيذ',
  optimize: 'تحسين',
  completed: 'مكتمل',
};

// Project statuses
export const PROJECT_STATUSES = ['active', 'paused', 'completed', 'cancelled'] as const;
export type ProjectStatus = typeof PROJECT_STATUSES[number];

// Deliverable statuses
export const DELIVERABLE_STATUSES = ['pending', 'in_progress', 'ai_generated', 'review', 'approved', 'delivered'] as const;
export type DeliverableStatus = typeof DELIVERABLE_STATUSES[number];

// Payment statuses
export const PAYMENT_STATUSES = ['pending', 'paid', 'overdue', 'cancelled'] as const;
export type PaymentStatus = typeof PAYMENT_STATUSES[number];

// Client statuses
export const CLIENT_STATUSES = ['lead', 'active', 'completed', 'paused'] as const;
export type ClientStatus = typeof CLIENT_STATUSES[number];

// Markets
export const MARKETS = ['ksa', 'egypt', 'uae', 'other'] as const;
export type Market = typeof MARKETS[number];

// Lead statuses
export const LEAD_STATUSES = ['new', 'contacted', 'qualified', 'proposal_sent', 'converted', 'lost'] as const;
export type LeadStatus = typeof LEAD_STATUSES[number];

// Lead score labels
export const LEAD_SCORES = ['hot', 'warm', 'cold'] as const;
export type LeadScore = typeof LEAD_SCORES[number];

// Proposal statuses
export const PROPOSAL_STATUSES = ['draft', 'sent', 'accepted', 'rejected'] as const;
export type ProposalStatus = typeof PROPOSAL_STATUSES[number];

/**
 * Service Prices (EGP) — SINGLE SOURCE OF TRUTH
 * 
 * These are the official WZZRD AI pricing.
 * Used in: proposals, quick-check AI scoring, knowledge base.
 * 
 * IMPORTANT: If you change pricing, change ONLY here.
 * All other modules read from this constant.
 */
export const SERVICE_PRICES: Record<ServiceType, number> = {
  business_health_check: 140000,
  starting_business_logic: 160000,
  brand_identity: 210000,
  business_takeoff: 320000,
  consultation: 70000,
};

/** Format price for display */
export function formatPrice(amount: number, currency: string = 'EGP'): string {
  return `${amount.toLocaleString()} ${currency}`;
}

/** Max lengths for input validation */
export const INPUT_LIMITS = {
  SHORT_TEXT: 255,
  MEDIUM_TEXT: 2000,
  LONG_TEXT: 10000,
  EXTRA_LONG_TEXT: 50000,
  EMAIL: 320,
  PHONE: 50,
  URL: 2000,
  CURRENCY: 10,
} as const;
