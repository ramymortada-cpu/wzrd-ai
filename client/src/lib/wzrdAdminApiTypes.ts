/**
 * Shapes returned by WZZRD admin REST helpers (`api` / `apiMutation`) — not tRPC RouterOutputs.
 */

export type WzrdTopToolEntry = { tool?: string; uses?: number; creditsSpent?: number };

export type WzrdDashboardData = {
  users?: { total?: number; today?: number; thisWeek?: number };
  tools?: {
    totalRuns?: number;
    avgScore?: string | number;
    topTools?: WzrdTopToolEntry[];
  };
  newsletter?: { subscribers?: number };
  credits?: { totalIssued?: number; totalUsed?: number };
  revenue?: { totalCreditsRevenue?: number };
};

export type WzrdToolRunRow = { id: number; userId: number; toolName?: string; createdAt: string };
export type WzrdToolRunHistory = { runs: WzrdToolRunRow[] };

export type WzrdPublicUser = {
  id: number;
  name?: string | null;
  email: string;
  company?: string | null;
  industry?: string | null;
  credits?: number;
  newsletterOptIn?: boolean;
  createdAt: string;
};
export type WzrdUsersPage = { users: WzrdPublicUser[]; total: number };

export type WzrdCreditTx = {
  id: number;
  userId: number;
  amount: number;
  balance: number;
  type: string;
  toolName?: string | null;
  reason?: string | null;
  createdAt: string;
};
export type WzrdCreditsPage = { transactions: WzrdCreditTx[]; total: number };

export type WzrdToolStat = { name: string; runs: number; creditsSpent: number };
export type WzrdDailyUsage = { date: string; runs: number; credits: number };
export type WzrdToolStatsPage = { tools: WzrdToolStat[]; dailyUsage: WzrdDailyUsage[] };

export type WzrdPaymentRow = {
  id: number;
  userId: number;
  amount: number;
  reason?: string;
  metadata?: string | Record<string, unknown> | null;
  createdAt: string;
};
export type WzrdPaymentsPage = { payments: WzrdPaymentRow[]; total: number };

export type WzrdWebhookEvent = {
  status: string;
  credits?: number;
  userId?: number;
  planId?: string;
  error?: string;
  transactionId?: string;
  amountCents?: number;
  timestamp: string;
};
export type WzrdWebhooksPage = { events: WzrdWebhookEvent[] };

export type EmailTemplateStats = { sent: number; failed: number };
export type WzrdEmailStats = {
  totalSent: number;
  totalFailed: number;
  totalSkipped: number;
  byTemplate: Record<string, EmailTemplateStats>;
  recentEmails: Array<{ status: string; to: string; timestamp: string }>;
};

export type WzrdSiteService = {
  id: string;
  nameEn: string;
  nameAr: string;
  tier: string;
  enabled: boolean;
};

export type WzrdPromptRow = {
  toolId: string;
  toolName: string;
  enabled: boolean;
  systemPrompt: string;
};

export type WzrdSiteConfigPayload = {
  homepage: Record<string, string>;
  site: Record<string, string>;
  services: { services: WzrdSiteService[] };
  prompts?: WzrdPromptRow[];
};

export type WzrdCreditPlan = {
  id: string;
  credits: number;
  priceEGP: number;
  name: string;
  nameAr: string;
  popular?: boolean;
  descEn?: string;
  descAr?: string;
  enabled?: number;
};

export type WzrdSystemConfig = Record<string, unknown> & {
  groqConfigured?: boolean;
  claudeConfigured?: boolean;
  paymobConfigured?: boolean;
  emailProvider?: string;
  toolCosts?: Record<string, number>;
  signupBonus?: number;
  dailyCreditCap?: number;
  creditPlans?: { plans?: WzrdCreditPlan[] };
};

export type WzrdPromoCode = {
  id: number;
  code: string;
  discountType: string;
  discountValue: number;
  usedCount: number;
  maxUses: number | null;
  enabled: boolean;
};

export type WzrdTeamMember = {
  id: number;
  name?: string | null;
  email: string;
  role: string;
  createdAt: string;
};
export type WzrdTeamPage = { team: WzrdTeamMember[] };

export type WzrdAgencyClient = {
  id: number;
  name: string;
  company?: string;
  email?: string;
  industry?: string;
  status: string;
};
export type WzrdAgencyProject = { id: number; name: string; clientId: number; stage: string; status: string };
export type WzrdAgencyClientsRes = { clients: WzrdAgencyClient[]; total: number; byStatus?: Record<string, number> };
export type WzrdAgencyProjectsRes = {
  projects: WzrdAgencyProject[];
  total: number;
  byStatus?: Record<string, number>;
};

export type WzrdServiceRequest = {
  id: number;
  requestNumber?: string;
  status: string;
  userId?: number;
  createdAt: string;
  description?: string;
  serviceType?: string;
  serviceTypeAr?: string;
  statusLabel?: { ar?: string; en?: string; color?: string; icon?: string };
};

/** Local state for “new promo” form in Pricing tab */
export type WzrdPromoFormDraft = {
  code?: string;
  discountType?: string;
  discountValue?: string;
  minAmountEGP?: string;
  maxUses?: string;
  validUntil?: string;
};

export type WzrdRequestTimelineUpdate = {
  id: number;
  title: string;
  titleAr?: string;
  detail?: string;
  detailAr?: string;
  fileUrl?: string;
  fileName?: string;
  meetingLink?: string;
  createdAt: string;
  isClientVisible?: boolean;
};
