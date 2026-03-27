/**
 * Leads Router — Growth Engine with Quick-Check lead magnet.
 * 
 * CRITICAL: submitQuickCheck is a PUBLIC endpoint that calls LLM.
 * Must have rate limiting to prevent abuse and credit exhaustion.
 * 
 * FIXED: Pricing now uses SERVICE_PRICES from shared/const.ts (single source of truth).
 */

import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { checkEditor } from "../_core/authorization";
import { z } from "zod";
import { quickCheckInput } from "@shared/validators";
import { SERVICE_PRICES, SERVICE_LABELS, formatPrice } from "@shared/const";
import { sanitizeObject } from "../_core/sanitize";
import { audit } from "../_core/audit";
import { logger } from "../_core/logger";
import { resilientLLM } from "../_core/llmRouter";
import { notifyOwner } from "../_core/notification";
import { notifyLeadSubmitted } from "../_core/notifications";
import { matchMENACaseStudies } from "../menaCaseStudies";
import {
  createLead, getLeadById, listLeads, updateLead, getLeadStats, getLeadFunnelStats,
  createClient,
  getClientById,
} from "../db";

/**
 * Build the pricing reference string from the single source of truth.
 * This ensures quick-check AI always uses correct pricing.
 */
function buildPricingReference(): string {
  return Object.entries(SERVICE_PRICES)
    .map(([key, price]) => `- ${SERVICE_LABELS[key as keyof typeof SERVICE_LABELS] || key}: ${formatPrice(price)}`)
    .join('\n');
}

export const leadsRouter = router({
  /**
   * PUBLIC: Submit quick-check (no auth required).
   * Rate limited to 3 req/min per IP (applied in Express middleware).
   */
  submitQuickCheck: publicProcedure
    .input(quickCheckInput)
    .mutation(async ({ input, ctx: _ctx }) => {
      const sanitized = sanitizeObject(input);
      const answersText = sanitized.answers.map((a) => `Q: ${a.question}\nA: ${a.answer}`).join('\n\n');

      const diagnosisPrompt = `You are Wzrd AI, the brand engineering intelligence of Primo Marca agency.

A potential client just completed a Brand Health Quick-Check. Analyze their answers and provide:

1. A brief teaser diagnosis (2-3 sentences, compelling but not giving everything away)
2. A full diagnosis (detailed analysis of their brand health)
3. A lead score from 0-100 (based on: budget potential, urgency, fit with our services)
4. Score label: "hot" (70-100), "warm" (40-69), or "cold" (0-39)
5. Scoring reason (why this score)
6. Recommended service from: business_health_check, starting_business_logic, brand_identity, business_takeoff, consultation
7. Estimated project value in EGP

Client Info:
- Company: ${sanitized.companyName}
- Industry: ${sanitized.industry || 'Not specified'}
- Market: ${sanitized.market}
- Website: ${sanitized.website || 'None'}

Quick-Check Answers:
${answersText}

Pricing Reference (official Primo Marca prices):
${buildPricingReference()}

Respond in JSON format:
{
  "diagnosisTeaser": "...",
  "fullDiagnosis": "...",
  "score": 75,
  "scoreLabel": "hot",
  "scoringReason": "...",
  "recommendedService": "brand_identity",
  "estimatedValue": 210000
}`;

      let diagnosis = {
        diagnosisTeaser: 'Your brand shows potential but needs strategic alignment. Our analysis reveals key areas for improvement.',
        fullDiagnosis: 'Based on your answers, we recommend a comprehensive brand review.',
        score: 50,
        scoreLabel: 'warm' as const,
        scoringReason: 'Medium potential based on initial assessment.',
        recommendedService: 'business_health_check',
        estimatedValue: SERVICE_PRICES.business_health_check,
      };

      try {
        const llmResponse = await resilientLLM({
          messages: [
            { role: 'system', content: 'You are a brand engineering AI. Respond ONLY with valid JSON.' },
            { role: 'user', content: diagnosisPrompt },
          ],
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: 'lead_diagnosis',
              strict: true,
              schema: {
                type: 'object',
                properties: {
                  diagnosisTeaser: { type: 'string' },
                  fullDiagnosis: { type: 'string' },
                  score: { type: 'integer' },
                  scoreLabel: { type: 'string', enum: ['hot', 'warm', 'cold'] },
                  scoringReason: { type: 'string' },
                  recommendedService: { type: 'string' },
                  estimatedValue: { type: 'number' },
                },
                required: ['diagnosisTeaser', 'fullDiagnosis', 'score', 'scoreLabel', 'scoringReason', 'recommendedService', 'estimatedValue'],
                additionalProperties: false,
              },
            },
          },
        }, { context: 'chat' });
        const parsed = JSON.parse(llmResponse.choices[0].message.content as string);
        diagnosis = parsed;
      } catch (e) {
        logger.warn({ err: e }, 'AI diagnosis failed, using defaults');
      }

      // Create lead in database
      const lead = await createLead({
        companyName: sanitized.companyName,
        contactName: sanitized.contactName,
        email: sanitized.email,
        phone: sanitized.phone,
        industry: sanitized.industry,
        market: sanitized.market,
        website: sanitized.website,
        quickCheckAnswers: sanitized.answers,
        diagnosisTeaser: diagnosis.diagnosisTeaser,
        fullDiagnosis: diagnosis.fullDiagnosis,
        score: diagnosis.score,
        scoreLabel: diagnosis.scoreLabel,
        scoringReason: diagnosis.scoringReason,
        recommendedService: diagnosis.recommendedService,
        estimatedValue: String(diagnosis.estimatedValue),
        status: 'new',
        source: 'quick_check',
      });

      // Notify owner
      try {
        await notifyOwner({
          title: `New Lead: ${sanitized.companyName} (${diagnosis.scoreLabel.toUpperCase()})`,
          content: `Company: ${sanitized.companyName}\nEmail: ${sanitized.email}\nScore: ${diagnosis.score}/100\nRecommended: ${diagnosis.recommendedService}`,
        });
        await notifyLeadSubmitted(sanitized.companyName, diagnosis.score, diagnosis.scoreLabel);
      } catch (e) {
        logger.warn({ err: e }, 'Failed to notify owner about new lead');
      }

      logger.info({ leadId: lead?.id, score: diagnosis.score, scoreLabel: diagnosis.scoreLabel }, 'Quick-check lead submitted');

      // ══ FUNNEL AUTOMATION (fire-and-forget) ══
      const leadId = lead?.id;
      if (leadId) {
        (async () => {
          try {
            if ((diagnosis.scoreLabel as string) === 'hot') {
              // HOT LEAD: Auto-generate a personalized proposal teaser
              logger.info({ leadId, scoreLabel: 'hot' }, 'Funnel: generating proposal for hot lead');
              const proposalResponse = await resilientLLM({
                messages: [
                  { role: 'system', content: 'You are a senior brand consultant. Write a brief, personalized proposal email (200 words max) that references the client\'s specific diagnosis. Be professional, warm, and clear about the recommended service and value. Include pricing.' },
                  { role: 'user', content: `Client: ${sanitized.companyName}\nIndustry: ${sanitized.industry}\nDiagnosis: ${diagnosis.fullDiagnosis}\nRecommended: ${diagnosis.recommendedService} (${formatPrice(diagnosis.estimatedValue)} EGP)\n\nWrite a proposal email.` },
                ],
              }, { context: 'chat' });
              const proposalEmail = proposalResponse.choices[0].message.content as string;
              // Save as note for the lead
              await updateLead(leadId, { notes: `AUTO-PROPOSAL:\n${proposalEmail}`, status: 'contacted' });
              logger.info({ leadId }, 'Funnel: hot lead auto-proposal generated');

            } else if ((diagnosis.scoreLabel as string) === 'warm') {
              // WARM LEAD: Send relevant case study
              const cases = matchMENACaseStudies({
                industry: sanitized.industry || undefined,
                market: sanitized.market || undefined,
                limit: 1,
              });
              if (cases.length > 0) {
                const caseStudy = cases[0];
                const nurture = `Relevant case study for ${sanitized.companyName}:\n\n${caseStudy.brand}: ${caseStudy.situation.substring(0, 200)}\nResult: ${caseStudy.results.substring(0, 200)}`;
                await updateLead(leadId, { notes: `AUTO-NURTURE:\n${nurture}`, status: 'contacted' });
                logger.info({ leadId }, 'Funnel: warm lead case study sent');
              }
            }
            // COLD leads: stay as 'new' — manual nurture later
          } catch (err) {
            logger.debug({ err, leadId }, 'Funnel automation failed (non-blocking)');
          }
        })();
      }

      return {
        id: lead?.id,
        diagnosisTeaser: diagnosis.diagnosisTeaser,
        score: diagnosis.score,
        scoreLabel: diagnosis.scoreLabel,
        recommendedService: diagnosis.recommendedService,
      };
    }),

  /** List all leads (protected) */
  list: protectedProcedure
    .input(z.object({
      status: z.string().max(50).optional(),
      scoreLabel: z.string().max(20).optional(),
    }).optional())
    .query(async ({ input }) => {
      return listLeads(input);
    }),

  /** Get lead by ID */
  getById: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ input }) => {
      return getLeadById(input.id);
    }),

  /** Update lead status */
  updateStatus: protectedProcedure
    .input(z.object({
      id: z.number().int().positive(),
      status: z.enum(["new", "contacted", "qualified", "proposal_sent", "converted", "lost"]),
      notes: z.string().max(5000).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      checkEditor(ctx);
      const data: Record<string, unknown> = { status: input.status };
      if (input.notes) data.notes = input.notes;
      if (input.status === 'contacted') data.lastContactedAt = new Date();

      await audit('leads', input.id, 'update', ctx.user?.id, { status: [null, input.status] });
      return updateLead(input.id, data);
    }),

  /** Convert lead to client */
  convertToClient: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      checkEditor(ctx);
      const lead = await getLeadById(input.id);
      if (!lead) throw new Error('Lead not found');

      const insertResult = await createClient({
        name: lead.contactName || lead.companyName,
        companyName: lead.companyName,
        email: lead.email,
        phone: lead.phone || undefined,
        market: lead.market,
        industry: lead.industry || undefined,
        website: lead.website || undefined,
        status: 'active',
      });

      const clientId = Number(insertResult[0].insertId);
      if (!Number.isFinite(clientId) || clientId <= 0) {
        throw new Error('Failed to create client');
      }

      await updateLead(input.id, { status: 'converted', clientId });
      await audit('leads', input.id, 'update', ctx.user?.id, { status: ['qualified', 'converted'] });
      logger.info({ leadId: input.id, clientId }, 'Lead converted to client');

      return getClientById(clientId);
    }),

  /** Lead statistics */
  stats: protectedProcedure.query(async () => {
    return getLeadStats();
  }),

  /** Funnel statistics */
  funnelStats: protectedProcedure.query(async () => {
    return getLeadFunnelStats();
  }),

  /** Alias — Home.tsx calls leads.funnel */
  funnel: protectedProcedure.query(async () => {
    return getLeadFunnelStats();
  }),
});
