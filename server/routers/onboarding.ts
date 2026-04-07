/**
 * Onboarding Router — wizard + live company search.
 * 
 * NEW: When user enters company name, system searches web for info
 * and auto-fills industry, market, and provides company context.
 */
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { checkEditor } from "../_core/authorization";
import { z } from "zod";
import { logger } from "../_core/logger";
import {
  createOnboardingSession,
  getOnboardingSessionById,
  getOnboardingSessions,
  updateOnboardingSession,
  createClient,
  createProject,
  createProposal,
  getClientById,
} from "../db";
import { resilientLLM } from "../_core/llmRouter";
import { searchGoogle } from "../researchEngine";
import { buildSystemPrompt } from "../knowledgeBase";
import { SERVICE_LABELS, SERVICE_PRICES } from "@shared/const";

const ONBOARDING_SERVICE_TYPES = [
  "business_health_check",
  "starting_business_logic",
  "brand_identity",
  "business_takeoff",
  "consultation",
] as const;
type OnboardingServiceType = (typeof ONBOARDING_SERVICE_TYPES)[number];

function toOnboardingServiceType(s: string | null | undefined): OnboardingServiceType {
  const v = (s || "consultation").trim();
  return (ONBOARDING_SERVICE_TYPES as readonly string[]).includes(v)
    ? (v as OnboardingServiceType)
    : "consultation";
}

export const onboardingRouter = router({
  create: protectedProcedure.input(z.object({
    companyName: z.string().max(255).optional(), contactName: z.string().max(255).optional(),
    email: z.string().email().max(320).optional(), phone: z.string().max(50).optional(),
    market: z.enum(["ksa", "egypt", "uae", "other"]).optional(), industry: z.string().max(255).optional(),
    website: z.string().max(500).optional(),
  })).mutation(async ({ input, ctx }) => { checkEditor(ctx); return createOnboardingSession(input); }),

  getById: protectedProcedure.input(z.object({ id: z.number().int().positive() })).query(async ({ input }) => getOnboardingSessionById(input.id)),
  list: protectedProcedure.query(async () => getOnboardingSessions()),

  update: protectedProcedure.input(z.object({
    id: z.number(),
    step: z.enum(["company_info", "needs_assessment", "service_recommendation", "proposal_review", "contract"]).optional(),
    status: z.enum(["in_progress", "completed", "abandoned"]).optional(),
    assessmentAnswers: z.any().optional(),
    recommendedService: z.string().max(100).optional(),
    recommendationReason: z.string().max(5000).optional(),
  })).mutation(async ({ input, ctx }) => {
    checkEditor(ctx);
    const { id, ...data } = input;
    await updateOnboardingSession(id, data);
    return { success: true };
  }),

  submit: publicProcedure.input(z.object({
    companyName: z.string().min(1).max(255),
    contactName: z.string().max(255).optional(),
    email: z.string().email().max(320),
    phone: z.string().max(50).optional(),
    market: z.enum(["ksa", "egypt", "uae", "other"]).default("egypt"),
    industry: z.string().max(255).optional(),
    website: z.string().max(500).optional(),
    answers: z.any().optional(),
  })).mutation(async ({ input }) => createOnboardingSession({
    ...input, step: 'needs_assessment', status: 'in_progress', assessmentAnswers: input.answers,
  })),

  /** NEW: Search for a company and auto-fill details */
  lookupCompany: protectedProcedure
    .input(z.object({
      companyName: z.string().min(2).max(255),
      market: z.enum(["ksa", "egypt", "uae", "other"]).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      checkEditor(ctx);
      try {
        // Search for the company
        const query = `${input.companyName} ${input.market === 'ksa' ? 'Saudi Arabia' : input.market === 'egypt' ? 'Egypt' : ''} company`;
        const searchResults = await searchGoogle(query, 5);

        if (searchResults.length === 0) {
          return { found: false, suggestions: null };
        }

        // Use AI to extract structured company info from search results
        const searchContext = searchResults.map(r => `${r.title}: ${r.snippet}`).join('\n');

        const response = await resilientLLM({
          messages: [
            {
              role: 'system',
              content: 'You extract company information from search results. Return ONLY valid JSON. If info is not available, use null.',
            },
            {
              role: 'user',
              content: `Company name: "${input.companyName}"
Market: ${input.market || 'Unknown'}

Search results:
${searchContext}

Extract this JSON:
{
  "companyName": "Official company name",
  "industry": "Main industry (e.g., F&B, Healthcare, Tech, Retail, Education, Beauty, Real Estate)",
  "description": "One sentence description of what they do",
  "website": "Main website URL or null",
  "socialMedia": { "instagram": "handle or null", "linkedin": "URL or null" },
  "competitors": ["competitor1", "competitor2", "competitor3"],
  "estimatedSize": "startup | sme | midmarket | enterprise",
  "confidence": "high | medium | low"
}`,
            },
          ],
        }, { context: 'chat' });

        const parsed = JSON.parse(response.choices[0].message.content as string);
        logger.info({ company: input.companyName, found: true, confidence: parsed.confidence }, 'Company lookup completed');

        return { found: true, ...parsed, searchResults: searchResults.slice(0, 3).map(r => ({ title: r.title, url: r.url })) };
      } catch (err) {
        logger.debug({ err, company: input.companyName }, 'Company lookup failed');
        return { found: false, suggestions: null };
      }
    }),

  /** Seed demo data for first-time users */
  seedDemo: protectedProcedure.mutation(async ({ ctx }) => {
    checkEditor(ctx);
    const { seedDemoData } = await import('../demoData');
    const db = await import('../db');
    const seeded = await seedDemoData(
      (data: unknown) => db.createClient(data as import('../../drizzle/schema').InsertClient),
      (data: unknown) => db.createProject(data as import('../../drizzle/schema').InsertProject),
      (data: unknown) => db.createNote(data as import('../../drizzle/schema').InsertClientNote),
      (data: unknown) => db.createKnowledgeEntry(data as import('../../drizzle/schema').InsertKnowledgeEntry),
      async () => { const r = await db.getClients(); return Array.isArray(r) ? r : (r as { data?: unknown[] }).data ?? []; },
    );
    return { seeded };
  }),

  /** Get onboarding tour steps */
  tourSteps: publicProcedure.query(() => {
    const { ONBOARDING_STEPS } = require('../demoData');
    return ONBOARDING_STEPS;
  }),

  updateCompanyInfo: protectedProcedure
    .input(z.object({
      id: z.number(),
      companyName: z.string().max(255).optional(),
      contactName: z.string().max(255).optional(),
      email: z.string().email().max(320).optional(),
      phone: z.string().max(50).optional(),
      market: z.enum(["ksa", "egypt", "uae", "other"]).optional(),
      industry: z.string().max(255).optional(),
      website: z.string().max(500).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      checkEditor(ctx);
      const { id, ...data } = input;
      await updateOnboardingSession(id, data);
      return { success: true };
    }),

  assessNeeds: protectedProcedure
    .input(z.object({
      id: z.number(),
      answers: z.array(z.object({ question: z.string(), answer: z.string() })),
    }))
    .mutation(async ({ input, ctx }) => {
      checkEditor(ctx);
      const session = await getOnboardingSessionById(input.id);
      if (!session) throw new Error("Session not found");
      const answersText = input.answers.map((a) => `${a.question}: ${a.answer}`).join("\n\n");
      const companyContext = [session.companyName, session.industry, session.market].filter(Boolean).join(", ");
      const systemPrompt = "You are a business consultant. Based on the client's answers, recommend ONE service from: business_health_check, starting_business_logic, brand_identity, business_takeoff, consultation. Return ONLY valid JSON: { \"service\": \"<service_key>\", \"reason\": \"<1-2 sentence rationale>\" }.";
      const response = await resilientLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Company: ${companyContext}\n\nAnswers:\n${answersText}` },
        ],
      });
      const content = (response.choices[0]?.message?.content as string) || "{}";
      let service = "consultation";
      let reason = "Based on your needs.";
      try {
        const parsed = JSON.parse(content.replace(/```json\n?|\n?```/g, ""));
        service = parsed.service || service;
        reason = parsed.reason || reason;
      } catch {
        logger.warn({ content }, 'assessNeeds LLM response was not valid JSON — using default service recommendation');
      }
      await updateOnboardingSession(input.id, {
        assessmentAnswers: input.answers,
        recommendedService: service,
        recommendationReason: reason,
        step: "service_recommendation",
      });
      return { service, reason };
    }),

  confirmService: protectedProcedure
    .input(z.object({ id: z.number(), serviceType: z.string().max(100) }))
    .mutation(async ({ input, ctx }) => {
      checkEditor(ctx);
      const session = await getOnboardingSessionById(input.id);
      if (!session) throw new Error("Session not found");
      const serviceType = toOnboardingServiceType(input.serviceType);
      const clientData = {
        name: session.contactName || session.companyName || "Unknown",
        companyName: session.companyName || undefined,
        email: session.email || undefined,
        phone: session.phone || undefined,
        market: session.market || "ksa",
        industry: session.industry || undefined,
        website: session.website || undefined,
      };
      const clientResult = await createClient(clientData);
      const clientId = Array.isArray(clientResult) ? (clientResult as { insertId?: number }[])?.[0]?.insertId : (clientResult as { id?: number })?.id;
      if (!clientId) throw new Error("Failed to create client");
      await updateOnboardingSession(input.id, {
        recommendedService: serviceType,
        step: "proposal_review",
        clientId,
      });
      return { clientId, success: true };
    }),

  generateProposal: protectedProcedure
    .input(z.object({ id: z.number(), language: z.enum(["en", "ar"]).default("en") }))
    .mutation(async ({ input, ctx }) => {
      checkEditor(ctx);
      const session = await getOnboardingSessionById(input.id);
      if (!session) throw new Error("Session not found");
      const clientId = session.clientId;
      if (!clientId) throw new Error("Confirm service first to create client");
      const serviceType = toOnboardingServiceType(session.recommendedService);
      const client = await getClientById(clientId);
      const systemPrompt = buildSystemPrompt({ mode: "proposal", serviceType, clientContext: session.recommendationReason || undefined });
      const price = SERVICE_PRICES[serviceType];
      const userPrompt = `Generate a professional proposal for:\nClient: ${client?.companyName || client?.name || "Unknown"}\nService: ${SERVICE_LABELS[serviceType]}\nPrice: ${price.toLocaleString()} EGP\nLanguage: ${input.language === "ar" ? "Arabic" : "English"}`;
      const response = await resilientLLM({ messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }] });
      const content = (response.choices[0]?.message?.content as string) || "";
      const proposal = await createProposal({
        clientId,
        serviceType,
        language: input.language,
        title: `${SERVICE_LABELS[serviceType]} — ${client?.companyName || client?.name || "Client"}`,
        executiveSummary: content,
        price: String(price),
        currency: "EGP",
        status: "draft",
      });
      const proposalId = (proposal as { id: number }).id;
      await updateOnboardingSession(input.id, { proposalId, step: "contract" });
      return { proposalId };
    }),

  complete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      checkEditor(ctx);
      const session = await getOnboardingSessionById(input.id);
      if (!session) throw new Error("Session not found");
      const clientId = session.clientId;
      const proposalId = session.proposalId;
      if (!clientId) throw new Error("Client not created yet");
      const projectResult = await createProject({
        clientId,
        name: session.companyName || "Project",
        serviceType: (session.recommendedService as "business_health_check" | "starting_business_logic" | "brand_identity" | "business_takeoff" | "consultation") || "consultation",
      });
      const projectId = (projectResult as { id: number }).id;
      await updateOnboardingSession(input.id, { status: "completed", projectId });
      return { projectId, clientId: clientId, proposalId: proposalId ?? undefined };
    }),
});
