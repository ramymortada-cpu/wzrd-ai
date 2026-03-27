/**
 * AI Engine Router — Multi-Agent Wzrd AI system.
 * 
 * FLOW:
 * 1. User sends message
 * 2. Orchestrator routes to the right agent (diagnostician/strategist/executor/researcher/pm)
 * 3. Agent builds context-specific system prompt
 * 4. Agent responds with specialized knowledge
 * 5. Response tagged with which agent answered
 * 6. Auto-extract knowledge from meaningful conversations
 */
import { protectedProcedure, router } from "../_core/trpc";
import { checkEditor } from "../_core/authorization";
import { z } from "zod";
import { logger } from "../_core/logger";
import { resilientLLM } from "../_core/llmRouter";
import { stripHtml } from "../_core/sanitize";
import { buildSystemPrompt } from "../knowledgeBase";
import {
  createAiConversation, getAiConversationById, updateAiConversation,
  getClientById, getProjectById, getNotesByClient,
} from "../db";
import { getRelevantKnowledge, extractKnowledgeFromConversation } from "../knowledgeAmplifier";
import { orchestrate, getAgentInfo, type AgentId } from "../agentOrchestrator";
import type { ClientNote } from "../../drizzle/schema";

export const aiRouter = router({
  /** Main chat — uses Multi-Agent orchestration */
  chat: protectedProcedure
    .input(z.object({
      projectId: z.number().optional(),
      clientId: z.number().optional(),
      conversationId: z.number().optional(),
      message: z.string().min(1).max(10000).optional(),
      messages: z.array(z.object({ role: z.string(), content: z.string() })).optional(),
      context: z.enum(["business_health_check", "starting_business_logic", "brand_identity", "business_takeoff", "consultation", "general"]).optional(),
      serviceContext: z.string().optional(),
      /** Force a specific agent instead of auto-routing */
      forceAgent: z.enum(["diagnostician", "strategist", "executor", "researcher", "pm"]).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      checkEditor(ctx);
      const context = input.context ?? input.serviceContext ?? 'general';
      let messages: unknown[] = [];
      let conversationId = input.conversationId;
      const currentMessage = input.messages?.length ? input.messages[input.messages.length - 1]?.content : input.message;
      if (!currentMessage) throw new Error('message or messages required');

      // Load existing conversation or use provided messages
      if (input.messages && input.messages.length > 0) {
        messages = input.messages;
      } else if (conversationId) {
        const existing = await getAiConversationById(conversationId);
        if (existing?.messages) messages = existing.messages as string[];
      }

      // Build client context
      let clientContext = '';
      let industry: string | undefined;
      let market: string | undefined;
      let projectStage: string | undefined;

      if (input.clientId) {
        const client = await getClientById(input.clientId);
        if (client) {
          clientContext += `Client: ${client.companyName || client.name}, Industry: ${client.industry || 'Unknown'}, Market: ${client.market}`;
          industry = client.industry || undefined;
          market = client.market;
        }
      }
      if (input.projectId) {
        const project = await getProjectById(input.projectId);
        if (project) {
          clientContext += `\nProject: ${project.name}, Service: ${project.serviceType}, Stage: ${project.stage}`;
          projectStage = project.stage || undefined;
        }
      }
      if (input.clientId) {
        const notes = await getNotesByClient(input.clientId);
        if (notes?.length > 0) {
          clientContext += '\n\nRecent Notes:\n' + notes.slice(0, 5).map((n: ClientNote) =>
            `[${n.category}] ${n.title}: ${(n.content ?? '').substring(0, 200)}`
          ).join('\n');
        }
      }

      // Enrich context with DB-stored knowledge entries via Smart Context Manager
      try {
        const dbKnowledge = await getRelevantKnowledge({
          mode: input.context === 'general' ? 'chat' : 'diagnosis',
          industry, market, serviceType: input.context !== 'general' ? input.context : undefined,
        });
        if (dbKnowledge && dbKnowledge.length > 0) {
          clientContext += '\n\n--- Relevant Knowledge ---\n' + dbKnowledge;
        }
      } catch (err) {
        logger.warn({ err }, 'Smart context enrichment failed, continuing without it');
      }

      // Sanitize user message against prompt injection
      const sanitizedMessage = stripHtml(currentMessage)
        .replace(/```system[\s\S]*?```/gi, '[code block removed]')
        .replace(/\[INST\][\s\S]*?\[\/INST\]/gi, '[removed]')
        .replace(/<\|system\|>[\s\S]*?<\|end\|>/gi, '[removed]')
        .trim();

      // Call the Multi-Agent Orchestrator
      const agentResponse = await orchestrate(sanitizedMessage, {
        clientContext: clientContext || undefined,
        industry,
        market,
        serviceType: context,
        projectStage,
        conversationHistory: messages as { role: string; content: string; agent?: string }[],
      });

      // Store messages with agent tag
      messages.push({ role: 'user', content: currentMessage });
      messages.push({
        role: 'assistant',
        content: agentResponse.message,
        agent: agentResponse.agent,
      });

      // Save conversation
      if (conversationId) {
        await updateAiConversation(conversationId, { messages });
      } else {
        const result = await createAiConversation({
          projectId: input.projectId, clientId: input.clientId,
          context: context as 'general' | 'business_health_check' | 'starting_business_logic' | 'brand_identity' | 'business_takeoff' | 'consultation', messages,
          title: currentMessage.substring(0, 100),
        });
        conversationId = result.id;
      }

      // Auto-extract knowledge (every 3 messages after 4 — learn faster)
      if (messages.length >= 4 && messages.length % 3 === 0) {
        try {
          const extracted = await extractKnowledgeFromConversation(messages as { role: string; content: string }[], {
            industry, market, serviceType: context,
          });
          if (extracted.length > 0) {
            logger.info({ conversationId, extracted: extracted.length }, 'Auto-extracted knowledge');
          }
        } catch (err) { logger.debug({ err }, 'Knowledge auto-extraction skipped'); }
      }

      return {
        message: agentResponse.message,
        content: agentResponse.message, // alias for client compatibility
        conversationId,
        agent: agentResponse.agent,
        agentLabel: agentResponse.agentLabel,
        agentLabelAr: agentResponse.agentLabelAr,
        sources: agentResponse.sources,
        handoff: agentResponse.handoff,
      };
    }),

  /** Get available agents info */
  agents: protectedProcedure.query(() => {
    return (['diagnostician', 'strategist', 'executor', 'researcher', 'pm'] as AgentId[])
      .map(id => getAgentInfo(id));
  }),

  /** Analyze notes — uses diagnostician agent */
  analyzeNotes: protectedProcedure
    .input(z.object({
      clientId: z.number().optional(),
      projectId: z.number().optional(),
      notes: z.string().max(50000),
      industry: z.string().max(255).optional(),
      market: z.string().max(100).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      checkEditor(ctx);
      const systemPrompt = buildSystemPrompt({
        mode: 'diagnosis',
        clientContext: input.industry ? `Industry: ${input.industry}` : undefined,
      });
      const dynamicKnowledge = await getRelevantKnowledge({
        mode: 'diagnosis', industry: input.industry, market: input.market, tokenBudget: 2000,
      });
      const response = await resilientLLM({
        messages: [
          { role: 'system', content: systemPrompt + '\n\n' + dynamicKnowledge },
          { role: 'user', content: `Analyze these client notes:\n\n${input.notes}` },
        ],
      }, { context: 'diagnosis' });
      return { analysis: response.choices[0].message.content };
    }),
});
