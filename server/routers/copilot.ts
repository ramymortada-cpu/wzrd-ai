/**
 * AI Brand Copilot Router — chat with AI about your brand.
 * 
 * The AI has context from:
 * - User's diagnosis history (scores, findings, action items)
 * - Company info from signup
 * - Conversation history (last 20 messages per session)
 * 
 * Cost: 5 credits per message.
 * Rate limit: 1 message per 3 seconds per user.
 */

import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { logger } from "../_core/logger";
import { resilientLLM } from "../_core/llmRouter";
import { getDb, deductCredits, getUserCredits } from "../db";
import { copilotMessages, diagnosisHistory, users } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";

type CopilotMessageRow = typeof copilotMessages.$inferSelect;

// Rate limit: track last message time per user
const lastMessageTime = new Map<number, number>();
const RATE_LIMIT_MS = 3000; // 3 seconds between messages

const COPILOT_SYSTEM = `You are WZRD AI Brand Copilot — a personal brand advisor for Arabic-speaking entrepreneurs.

You speak in Egyptian Arabic dialect. You're direct, practical, and specific. No fluff.

You have context about the user's brand from their diagnosis history. Use this context to give PERSONALIZED advice — not generic tips.

Your capabilities:
- Write Instagram bios, taglines, and positioning statements
- Suggest pricing strategies and offer structures  
- Analyze competitors
- Write email copy, ad copy, social media captions
- Explain branding concepts in simple Arabic
- Create action plans and to-do lists
- Review brand elements (with text descriptions)

Rules:
- Always respond in Egyptian Arabic (العامية المصرية)
- Be specific to THEIR brand — reference their diagnosis results
- Keep responses concise (max 300 words unless they ask for detail)
- If asked something outside branding/marketing — politely redirect
- If you don't have enough context — ask a clarifying question`;

export const copilotRouter = router({
  /** Send a message to the copilot */
  chat: protectedProcedure
    .input(z.object({
      message: z.string().min(1).max(2000),
      sessionId: z.string().min(1).max(50),
    }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user!.id;

      // Rate limit check
      const lastTime = lastMessageTime.get(userId) || 0;
      const now = Date.now();
      if (now - lastTime < RATE_LIMIT_MS) {
        throw new Error('استنى شوية قبل ما تبعت تاني — ٣ ثواني بين كل رسالة.');
      }
      lastMessageTime.set(userId, now);

      // Check credits (5 per message)
      const balance = await getUserCredits(userId);
      if (balance < 5) {
        throw new Error(`مفيش كريدت كافي. محتاج ٥ كريدت — عندك ${balance}. اشتري كريدت من صفحة التسعير.`);
      }

      const db = await getDb();
      if (!db) throw new Error('Database unavailable');

      // Deduct credits INSIDE try — refund if AI fails
      const deduction = await deductCredits(userId, 'copilot_message');
      if (!deduction.success) {
        throw new Error(deduction.error || 'مفيش كريدت كافي');
      }

      try {
        // Build context from diagnosis history
        const recentDiagnoses = await db.select()
          .from(diagnosisHistory)
          .where(eq(diagnosisHistory.userId, userId))
          .orderBy(desc(diagnosisHistory.createdAt))
          .limit(3);

        // Get user info
        const [user] = await db.select()
          .from(users)
          .where(eq(users.id, userId));

        // Get conversation history (last 20 messages)
        const history = await db.select()
          .from(copilotMessages)
          .where(eq(copilotMessages.sessionId, input.sessionId))
          .orderBy(desc(copilotMessages.createdAt))
          .limit(20);

        // Build context string
        let contextStr = '';
        if (user) {
          contextStr += `\nUser info: Name: ${user.name || 'Unknown'}, Company: ${(user as any).company || 'Unknown'}, Industry: ${(user as any).industry || 'Unknown'}`;
        }
        if (recentDiagnoses.length > 0) {
          contextStr += '\n\nRecent diagnosis results:';
          for (const d of recentDiagnoses) {
            contextStr += `\n- ${d.toolId}: Score ${d.score}/100`;
            if (d.findings && Array.isArray(d.findings)) {
              contextStr += ` | Findings: ${(d.findings as any[]).map((f: any) => f.title).join(', ')}`;
            }
            if (d.actionItems && Array.isArray(d.actionItems)) {
              contextStr += ` | Action items: ${(d.actionItems as any[]).map((a: any) => a.task).slice(0, 3).join(', ')}`;
            }
          }
        }

        // Build messages array for AI
        const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
          { role: 'system', content: COPILOT_SYSTEM + '\n\n--- CONTEXT ---' + contextStr },
        ];

        // Add conversation history (reversed to chronological order)
        const sortedHistory = [...history].reverse();
        for (const msg of sortedHistory) {
          messages.push({
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
          });
        }

        // Add current message
        messages.push({ role: 'user', content: input.message });

        // Call AI
        const response = await resilientLLM({
          messages,
        }, { context: 'copilot' });

        const aiResponse = response.choices[0]?.message?.content as string;
        const tokensUsed = (response.usage?.total_tokens) || 0;

        // Save both messages to DB (non-blocking)
        await Promise.all([
          db.insert(copilotMessages).values({
            userId,
            sessionId: input.sessionId,
            role: 'user',
            content: input.message,
            tokensUsed: 0,
          }),
          db.insert(copilotMessages).values({
            userId,
            sessionId: input.sessionId,
            role: 'assistant',
            content: aiResponse,
            tokensUsed,
          }),
        ]).catch(err => logger.warn({ err }, 'Failed to save copilot messages'));

        return {
          response: aiResponse,
          creditsUsed: 5,
          creditsRemaining: deduction.newBalance ?? 0,
          tokensUsed,
        };
      } catch (err: any) {
        // If AI failed — try to refund credits
        try {
          const { addCredits } = await import('../db');
          await addCredits(userId, 5, 'copilot_refund', 'Refund — copilot message failed');
        } catch { /* best effort refund */ }

        if (err.message?.includes('كريدت') || err.message?.includes('استنى')) throw err;
        logger.error({ err, userId }, 'Copilot chat failed');
        throw new Error('حصل مشكلة — حاول تاني. الكريدت اترجعت.');
      }
    }),

  /** Get conversation history for a session */
  getHistory: protectedProcedure
    .input(z.object({
      sessionId: z.string().min(1).max(50),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return [];

      const messages = await db.select()
        .from(copilotMessages)
        .where(eq(copilotMessages.sessionId, input.sessionId))
        .orderBy(copilotMessages.createdAt)
        .limit(100);

      return messages.map((m: CopilotMessageRow) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        createdAt: m.createdAt,
      }));
    }),

  /** List user's recent sessions */
  mySessions: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];

      // Get distinct sessions with last message
      const sessions = await db.execute(
        `SELECT session_id, MAX(created_at) as last_msg, COUNT(*) as msg_count, 
         SUBSTRING(MIN(CASE WHEN role='user' THEN content END), 1, 100) as first_message
         FROM copilot_messages WHERE user_id = ? 
         GROUP BY session_id ORDER BY last_msg DESC LIMIT 20`,
        [ctx.user!.id]
      );

      return (sessions as any)?.[0] || [];
    }),

  /** Suggested questions based on diagnosis history */
  suggestions: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return { suggestions: [] };

      const latest = await db.select()
        .from(diagnosisHistory)
        .where(eq(diagnosisHistory.userId, ctx.user!.id))
        .orderBy(desc(diagnosisHistory.createdAt))
        .limit(1);

      if (!latest.length) {
        return {
          suggestions: [
            { text: 'إزاي أبدأ أبني البراند بتاعي؟', icon: '🚀' },
            { text: 'اكتبلي Instagram bio', icon: '📱' },
            { text: 'اقترحلي ٣ taglines', icon: '💡' },
          ],
        };
      }

      const score = latest[0].score;
      const suggestions = [];

      if (score < 50) {
        suggestions.push({ text: 'إيه أول ٣ حاجات أعملها عشان أحسّن البراند؟', icon: '🔧' });
        suggestions.push({ text: 'اكتبلي positioning statement', icon: '🎯' });
      } else {
        suggestions.push({ text: 'إزاي أطوّر البراند للمرحلة الجاية؟', icon: '📈' });
        suggestions.push({ text: 'اقترحلي campaign idea', icon: '💡' });
      }
      suggestions.push({ text: 'اكتبلي Instagram bio جديد', icon: '📱' });
      suggestions.push({ text: 'إزاي أسعّر الباكدج بتاعي صح؟', icon: '💰' });

      return { suggestions };
    }),
});
