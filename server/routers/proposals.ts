/**
 * Proposals Router — generate, send, track proposals.
 */
import { protectedProcedure, router } from "../_core/trpc";
import { checkEditor, requireWorkspaceRole } from "../_core/authorization";
import { z } from "zod";
import { sanitizeObject } from "../_core/sanitize";
import { audit } from "../_core/audit";
import { logger } from "../_core/logger";
import { resilientLLM } from "../_core/llmRouter";
import { createProposalInput } from "@shared/validators";
import { SERVICE_LABELS, SERVICE_PRICES } from "@shared/const";
import { buildSystemPrompt } from "../knowledgeBase";
import { notifyOwner } from "../_core/notification";
import {
  createProposal, getProposals, getProposalById, getProposalsByClient, updateProposal, deleteProposal,
  getClientById, getProposalAcceptances,
} from "../db";

export const proposalsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => getProposals(ctx.workspaceId)),
  getById: protectedProcedure.input(z.object({ id: z.number().int().positive() })).query(async ({ input, ctx }) => getProposalById(input.id, ctx.workspaceId)),
  getByClient: protectedProcedure.input(z.object({ clientId: z.number().int().positive() })).query(async ({ input, ctx }) => getProposalsByClient(input.clientId, ctx.workspaceId)),

  create: protectedProcedure.input(createProposalInput).mutation(async ({ input, ctx }) => {
    checkEditor(ctx);
    requireWorkspaceRole(ctx, "editor");
    const sanitized = sanitizeObject(input);
    const result = await createProposal({ ...sanitized, workspaceId: ctx.workspaceId });
    const id = (result as { id: number }).id;
    if (id) await audit('proposals', id, 'create', ctx.user?.id, undefined, { workspaceId: ctx.workspaceId });
    return result;
  }),

  /** Create proposal from discovery conversation (client compatibility) */
  createFromDiscovery: protectedProcedure
    .input(z.object({
      conversationMessages: z.array(z.object({ role: z.string(), content: z.string() })),
      clientId: z.number().optional(),
      serviceType: z.enum(["business_health_check", "starting_business_logic", "brand_identity", "business_takeoff", "consultation"]).optional(),
      language: z.enum(["en", "ar"]).default("en"),
    }))
    .mutation(async ({ input, ctx }) => {
      checkEditor(ctx);
      requireWorkspaceRole(ctx, "editor");
      const clientContext = input.conversationMessages.map(m => `${m.role}: ${m.content}`).join('\n\n');
      const clientId = input.clientId ?? 0;
      const client = clientId ? await getClientById(clientId, ctx.workspaceId) : null;
      const serviceType = input.serviceType || 'consultation';
      const systemPrompt = buildSystemPrompt({ mode: 'proposal', serviceType, clientContext });
      const price = SERVICE_PRICES[serviceType];
      const userPrompt = `Generate a professional proposal from this discovery conversation:\n\n${clientContext}\n\nClient: ${client?.companyName || client?.name || 'Unknown'}\nService: ${SERVICE_LABELS[serviceType]}\nPrice: ${price.toLocaleString()} EGP\nLanguage: ${input.language === 'ar' ? 'Arabic' : 'English'}`;
      const response = await resilientLLM({ messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }] });
      const content = response.choices[0].message.content as string;
      const proposal = await createProposal({
        workspaceId: ctx.workspaceId,
        clientId: clientId || 0, serviceType, language: input.language,
        title: `${SERVICE_LABELS[serviceType]} — ${client?.companyName || client?.name || 'Client'}`,
        executiveSummary: content, price: String(price), currency: 'EGP', status: 'draft',
      });
      return { id: (proposal as { id: number }).id };
    }),

  generateWithAI: protectedProcedure
    .input(z.object({
      clientId: z.number(), serviceType: z.enum(["business_health_check", "starting_business_logic", "brand_identity", "business_takeoff", "consultation"]),
      language: z.enum(["en", "ar"]).default("en"), clientContext: z.string().max(10000).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      checkEditor(ctx);
      requireWorkspaceRole(ctx, "editor");
      const client = await getClientById(input.clientId, ctx.workspaceId);
      const systemPrompt = buildSystemPrompt({ mode: 'proposal', serviceType: input.serviceType, clientContext: input.clientContext });
      const price = SERVICE_PRICES[input.serviceType];
      const userPrompt = `Generate a professional proposal for:\nClient: ${client?.companyName || client?.name || 'Unknown'}\nService: ${SERVICE_LABELS[input.serviceType]}\nPrice: ${price.toLocaleString()} EGP\nLanguage: ${input.language === 'ar' ? 'Arabic' : 'English'}\n${input.clientContext ? `Context: ${input.clientContext}` : ''}`;
      
      const response = await resilientLLM({ messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }] });
      const content = response.choices[0].message.content as string;
      
      const proposal = await createProposal({
        workspaceId: ctx.workspaceId,
        clientId: input.clientId, serviceType: input.serviceType, language: input.language,
        title: `${SERVICE_LABELS[input.serviceType]} — ${client?.companyName || client?.name || 'Client'}`,
        executiveSummary: content, price: String(price), currency: 'EGP', status: 'draft',
      });
      logger.info({ proposalId: (proposal as { id: number }).id, service: input.serviceType }, 'AI-generated proposal');
      return proposal;
    }),

  update: protectedProcedure
    .input(z.object({ id: z.number(), status: z.enum(["draft", "sent", "accepted", "rejected"]).optional(), title: z.string().max(500).optional(), executiveSummary: z.string().max(50000).optional(), price: z.string().max(20).optional() }))
    .mutation(async ({ input, ctx }) => { checkEditor(ctx); requireWorkspaceRole(ctx, "editor"); const { id, ...data } = input; await updateProposal(id, data); await audit('proposals', id, 'update', ctx.user?.id, undefined, { workspaceId: ctx.workspaceId }); return { success: true }; }),

  regenerateSection: protectedProcedure
    .input(z.object({ proposalId: z.number(), section: z.enum(["executiveSummary", "clientBackground", "serviceDescription", "methodology", "deliverables", "timeline", "investment", "whyPrimoMarca", "terms", "title"]) }) )
    .mutation(async ({ input, ctx }) => {
      checkEditor(ctx);
      requireWorkspaceRole(ctx, "editor");
      const proposal = await getProposalById(input.proposalId, ctx.workspaceId);
      if (!proposal) throw new Error("Proposal not found");
      const client = await getClientById(proposal.clientId, ctx.workspaceId);
      const systemPrompt = buildSystemPrompt({ mode: "proposal", serviceType: proposal.serviceType ?? "consultation" });
      const prop = proposal as Record<string, unknown>;
      const currentVal = String(prop[input.section] ?? "");
      const userPrompt = `Regenerate ONLY the ${input.section} for this proposal. Client: ${client?.companyName || "Unknown"}. Service: ${SERVICE_LABELS[proposal.serviceType as keyof typeof SERVICE_LABELS] || proposal.serviceType}. Current content: ${currentVal}`;
      const response = await resilientLLM({ messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }] });
      const content = response.choices[0].message.content as string;
      await updateProposal(input.proposalId, { [input.section]: content });
      await audit("proposals", input.proposalId, "update", ctx.user?.id, undefined, { workspaceId: ctx.workspaceId });
      return { [input.section]: content };
    }),

  delete: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input, ctx }) => { checkEditor(ctx); requireWorkspaceRole(ctx, "editor"); await deleteProposal(input.id); await audit('proposals', input.id, 'delete', ctx.user?.id, undefined, { workspaceId: ctx.workspaceId }); return { success: true }; }),

  sendProposal: protectedProcedure
    .input(z.object({ proposalId: z.number(), recipientEmail: z.string().email().max(320), message: z.string().max(2000).optional() }))
    .mutation(async ({ input, ctx }) => {
      checkEditor(ctx);
      requireWorkspaceRole(ctx, "editor");
      const proposal = await getProposalById(input.proposalId, ctx.workspaceId);
      if (!proposal) throw new Error('Proposal not found');
      const client = await getClientById(proposal.clientId, ctx.workspaceId);
      await notifyOwner({ title: `Proposal Sent: ${proposal.title}`, content: `Sent to: ${input.recipientEmail}\nClient: ${client?.companyName || 'Unknown'}` });
      await updateProposal(input.proposalId, { status: 'sent' });
      return { success: true };
    }),

  acceptances: protectedProcedure.input(z.object({ proposalId: z.number().int().positive() })).query(async ({ input }) => getProposalAcceptances(input.proposalId)),
});
