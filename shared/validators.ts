/**
 * Shared Input Validation Schemas — centralized Zod validators with proper max lengths.
 * 
 * Every string input MUST have a .max() constraint to prevent DoS attacks.
 * Import these in routers instead of defining inline.
 */

import { z } from 'zod';

// ============ FIELD VALIDATORS ============

/** Short text fields (names, titles, labels) */
export const shortText = z.string().min(1).max(255);
export const optionalShortText = z.string().max(255).optional();

/** Medium text fields (descriptions, summaries) */
export const mediumText = z.string().max(2000);
export const optionalMediumText = z.string().max(2000).optional();

/** Long text fields (content, notes, analysis) */
export const longText = z.string().max(10000);
export const optionalLongText = z.string().max(10000).optional();

/** Extra long text (AI-generated content, full reports) */
export const extraLongText = z.string().max(50000);
export const optionalExtraLongText = z.string().max(50000).optional();

/** Email field */
export const emailField = z.string().email().max(320);
export const optionalEmail = z.string().email().max(320).optional();

/** Phone field */
export const phoneField = z.string().max(50);
export const optionalPhone = z.string().max(50).optional();

/** URL field */
export const urlField = z.string().url().max(2000);
export const optionalUrl = z.string().max(2000).optional();

/** Currency code */
export const currencyField = z.string().max(10).default('EGP');

/** Positive integer ID */
export const idField = z.number().int().positive();

// ============ ENUM VALIDATORS ============

export const marketEnum = z.enum(['ksa', 'egypt', 'uae', 'other']);

export const serviceTypeEnum = z.enum([
  'business_health_check',
  'starting_business_logic',
  'brand_identity',
  'business_takeoff',
  'consultation',
]);

export const projectStageEnum = z.enum(['diagnose', 'design', 'deploy', 'optimize', 'completed']);

export const projectStatusEnum = z.enum(['active', 'paused', 'completed', 'cancelled']);

export const clientStatusEnum = z.enum(['lead', 'active', 'completed', 'paused']);

export const deliverableStatusEnum = z.enum([
  'pending', 'in_progress', 'ai_generated', 'review', 'approved', 'delivered',
]);

export const paymentStatusEnum = z.enum(['pending', 'paid', 'overdue', 'cancelled']);

export const proposalStatusEnum = z.enum(['draft', 'sent', 'accepted', 'rejected']);

export const languageEnum = z.enum(['en', 'ar']);

export const leadScoreEnum = z.enum(['hot', 'warm', 'cold']);

export const leadStatusEnum = z.enum([
  'new', 'contacted', 'qualified', 'proposal_sent', 'converted', 'lost',
]);

export const leadSourceEnum = z.enum(['quick_check', 'referral', 'manual', 'website']);

// ============ COMPOSITE INPUT SCHEMAS ============

/** Client creation input */
export const createClientInput = z.object({
  name: shortText,
  companyName: optionalShortText,
  email: optionalEmail,
  phone: optionalPhone,
  market: marketEnum.default('ksa'),
  industry: optionalShortText,
  website: optionalUrl,
  notes: optionalLongText,
  status: clientStatusEnum.default('lead'),
});

/** Client update input */
export const updateClientInput = z.object({
  id: idField,
  name: z.string().min(1).max(255).optional(),
  companyName: optionalShortText,
  email: optionalEmail,
  phone: optionalPhone,
  market: marketEnum.optional(),
  industry: optionalShortText,
  website: optionalUrl,
  notes: optionalLongText,
  status: clientStatusEnum.optional(),
});

/** Project creation input */
export const createProjectInput = z.object({
  clientId: idField,
  name: shortText,
  serviceType: serviceTypeEnum,
  stage: projectStageEnum.default('diagnose'),
  status: projectStatusEnum.default('active'),
  price: z.string().max(20).optional(),
  currency: currencyField,
  startDate: z.date().optional(),
  description: optionalMediumText,
});

/** Project update input */
export const updateProjectInput = z.object({
  id: idField,
  name: z.string().min(1).max(255).optional(),
  stage: projectStageEnum.optional(),
  status: projectStatusEnum.optional(),
  price: z.string().max(20).optional(),
  description: optionalMediumText,
});

/** Deliverable update input */
export const updateDeliverableInput = z.object({
  id: idField,
  title: optionalShortText,
  description: optionalMediumText,
  stage: z.enum(['diagnose', 'design', 'deploy', 'optimize']).optional(),
  status: deliverableStatusEnum.optional(),
  content: optionalExtraLongText,
  sortOrder: z.number().int().min(0).max(999).optional(),
  fileUrl: optionalUrl,
  fileKey: optionalShortText,
  fileType: z.string().max(50).optional(),
  qualityScore: z.number().int().min(0).max(100).optional(),
  qualityChecklist: z.any().optional(),
  reviewNotes: optionalLongText,
  imageUrls: z.any().optional(),
});

/** Payment creation input */
export const createPaymentInput = z.object({
  projectId: idField,
  clientId: idField,
  amount: z.string().max(20),
  currency: currencyField,
  status: paymentStatusEnum.default('pending'),
  dueDate: z.date().optional(),
  description: optionalShortText,
});

/** Lead quick-check input */
export const quickCheckInput = z.object({
  companyName: shortText,
  contactName: optionalShortText,
  email: emailField,
  phone: optionalPhone,
  industry: optionalShortText,
  market: marketEnum.default('egypt'),
  website: optionalUrl,
  answers: z.array(z.object({
    question: z.string().max(500),
    answer: z.string().max(2000),
  })).min(1).max(20),
});

/** AI chat input */
export const aiChatInput = z.object({
  projectId: z.number().optional(),
  clientId: z.number().optional(),
  conversationId: z.number().optional(),
  message: z.string().min(1).max(10000),
  context: z.enum([
    'business_health_check', 'starting_business_logic',
    'brand_identity', 'business_takeoff', 'consultation', 'general',
  ]).default('general'),
});

/** Comment input */
export const commentInput = z.object({
  deliverableId: idField,
  parentId: z.number().int().positive().optional(),
  authorType: z.enum(['owner', 'team', 'client', 'ai']).default('owner'),
  authorName: shortText,
  comment: z.string().min(1).max(5000),
  version: z.number().int().positive().optional(),
});

/** Proposal creation input */
export const createProposalInput = z.object({
  clientId: idField,
  serviceType: serviceTypeEnum,
  title: shortText,
  language: languageEnum.default('en'),
  executiveSummary: optionalExtraLongText,
  clientBackground: optionalExtraLongText,
  serviceDescription: optionalExtraLongText,
  methodology: optionalExtraLongText,
  deliverables: optionalExtraLongText,
  timeline: optionalExtraLongText,
  investment: optionalExtraLongText,
  whyPrimoMarca: optionalExtraLongText,
  terms: optionalExtraLongText,
  customNotes: optionalLongText,
  price: z.string().max(20).optional(),
  currency: currencyField,
});

/** Knowledge entry input */
export const createKnowledgeInput = z.object({
  title: shortText,
  content: longText,
  category: z.enum([
    'case_study', 'framework', 'lesson_learned',
    'market_insight', 'competitor_intel', 'client_pattern',
    'methodology', 'template', 'general',
  ]).default('general'),
  industry: optionalShortText,
  market: z.string().max(100).optional(),
  clientId: z.number().optional(),
  projectId: z.number().optional(),
  source: z.enum(['manual', 'research_import', 'ai_generated', 'conversation_extract']).default('manual'),
  tags: z.array(z.string().max(100)).max(20).optional(),
});
