/**
 * AI Brand Copilot Router — chat with AI about your brand.
 * 
 * The AI has context from buildBrandContext():
 * - User profile (name, company, industry, market)
 * - Latest diagnosis per tool (6 tools) + critical finding titles
 * - Brand Twin: latest snapshot 7 dimensions, summary, active alerts
 *   (CRM client = optional chat `clientId` if allowed, else auto-match email/company; admins any client)
 * - Pending checklist tasks
 * - Conversation history (last 20 messages per session)
 * - listClientsForCopilot: dropdown when user has multiple eligible CRM clients
 * 
 * Cost: 5 credits per message.
 * Rate limit: 1 message per 3 seconds per user.
 */

import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { logger } from "../_core/logger";
import { resilientLLM } from "../_core/llmRouter";
import { getDb, deductCredits, getUserCredits } from "../db";
import { copilotMessages, userChecklists } from "../../drizzle/schema";
import { eq, desc, sql } from "drizzle-orm";
import {
  buildBrandContext,
  buildCopilotSuggestions,
  resolveTwinClientIdForCopilot,
  listClientsForCopilot,
} from "../copilot/brandContext";

// Rate limit: track last message time per user
const lastMessageTime = new Map<number, number>();
const RATE_LIMIT_MS = 3000; // 3 seconds between messages

// Clean old rate-limit entries every 30 minutes
setInterval(() => {
  const cutoff = Date.now() - 30 * 60 * 1000;
  for (const [key, val] of lastMessageTime) {
    if (val < cutoff) lastMessageTime.delete(key);
  }
}, 30 * 60 * 1000);

const COPILOT_SYSTEM = `أنت WZZRD Brand Copilot — مستشار براند شخصي للمؤسسين والشركات الصغيرة في العالم العربي.

بتتكلم بالعامية المصرية. مباشر، عملي، ومحدد. بلا كلام فاضي.

عندك context كامل عن براند المستخدم من تشخيصاته (آخر نتيجة لكل أداة) ومن Brand Twin (أبعاد صحة البراند، تنبيهات، ومهام checklist). استخدم الـ context ده عشان تدي نصايح مخصصة — مش نصايح عامة.

قدراتك:
- كتابة Instagram bio و taglines و positioning statements
- اقتراح استراتيجيات تسعير وهياكل عروض
- تحليل المنافسين
- كتابة copy للإيميل والإعلانات والسوشيال ميديا
- شرح مفاهيم البراند بأسلوب بسيط
- إنشاء خطط عمل وقوائم مهام
- تحليل عناصر البراند (بالوصف النصي)

قواعد:
- دايماً رد بالعامية المصرية
- كن محدداً لبراندهم — اذكر أداة التشخيص أو البُعد أو التنبيه بالاسم لما يكون منطقي
- لو في تنبيهات حرجة في الـ context — ابدأ بالأهم
- ردود مختصرة (أقصى 300 كلمة إلا لو طلبوا تفصيل)
- لو السؤال خارج البراند/التسويق — وجّههم بأدب
- لو المعلومات ناقصة — اسأل سؤال توضيحي واحد`;

export const copilotRouter = router({
  /** Send a message to the copilot */
  chat: protectedProcedure
    .input(z.object({
      message: z.string().min(1).max(2000),
      sessionId: z.string().min(1).max(50),
      /** اختياري: عميل CRM للـ Brand Twin — لازم يكون مربوط بالحساب (أو admin) */
      clientId: z.number().int().positive().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user!.id;
      const userRole = ctx.user!.role;

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

      const twinClientId = await resolveTwinClientIdForCopilot(
        db,
        userId,
        userRole,
        input.clientId,
      );

      // Deduct credits INSIDE try — refund if AI fails
      const deduction = await deductCredits(userId, 'copilot_message');
      if (!deduction.success) {
        throw new Error(deduction.error || 'مفيش كريدت كافي');
      }

      try {
        const contextStr = await buildBrandContext(userId, db, twinClientId);

        // Get conversation history (last 20 messages)
        const history = await db.select()
          .from(copilotMessages)
          .where(eq(copilotMessages.sessionId, input.sessionId))
          .orderBy(desc(copilotMessages.createdAt))
          .limit(20);

        // Build messages array for AI
        const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
          { role: 'system', content: `${COPILOT_SYSTEM}\n\n--- CONTEXT ---\n${contextStr}` },
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
      } catch (err: unknown) {
        // If AI failed — try to refund credits
        try {
          const { addCredits } = await import('../db');
          await addCredits(userId, 5, 'copilot_refund', 'Refund — copilot message failed');
        } catch { /* best effort refund */ }

        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes('كريدت') || msg.includes('استنى')) throw err;
        logger.error({ err, userId }, 'Copilot chat failed');
        throw new Error('حصل مشكلة — حاول تاني. الكريدت اترجعت.');
      }
    }),

  /** Get conversation history for a session */
  getHistory: protectedProcedure
    .input(z.object({
      sessionId: z.string().min(1).max(50),
    }))
    .query(async ({ input, ctx: _ctx }) => {
      const db = await getDb();
      if (!db) return [];

      const messages = await db.select()
        .from(copilotMessages)
        .where(eq(copilotMessages.sessionId, input.sessionId))
        .orderBy(copilotMessages.createdAt)
        .limit(100);

      return messages.map((m: (typeof messages)[number]) => ({
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
        sql`SELECT session_id, MAX(created_at) as last_msg, COUNT(*) as msg_count, 
         SUBSTRING(MIN(CASE WHEN role='user' THEN content END), 1, 100) as first_message
         FROM copilot_messages WHERE user_id = ${ctx.user!.id} 
         GROUP BY session_id ORDER BY last_msg DESC LIMIT 20`
      );

      type SessionAggRow = {
        session_id: string;
        last_msg: Date;
        msg_count: number;
        first_message: string | null;
      };
      const raw = sessions as unknown;
      if (Array.isArray(raw) && raw.length > 0 && Array.isArray(raw[0])) {
        return raw[0] as SessionAggRow[];
      }
      if (Array.isArray(raw)) {
        return raw as SessionAggRow[];
      }
      return [];
    }),

  /** CRM clients for context switcher (multi-client users / admins). */
  listClientsForCopilot: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      return listClientsForCopilot(db, ctx.user!.id, ctx.user!.role);
    }),

  /** Suggested questions — weakest diagnosis dimension, Brand Twin alerts, generic fallbacks */
  suggestions: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return { suggestions: [] };

      const suggestions = await buildCopilotSuggestions(ctx.user!.id, db);
      if (suggestions.length === 0) {
        return {
          suggestions: [
            { text: 'إزاي أبدأ أبني البراند بتاعي؟', icon: '🚀' },
            { text: 'اكتبلي Instagram bio', icon: '📱' },
            { text: 'اقترحلي ٣ taglines', icon: '💡' },
          ],
        };
      }
      return { suggestions };
    }),

  /** Generate a structured 5-step action plan from the user's diagnosis data */
  generatePlan: protectedProcedure
    .input(z.object({
      sessionId: z.string().min(1).max(50),
      clientId: z.number().int().positive().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user!.id;
      const userRole = ctx.user!.role;

      // Rate limit
      const lastTime = lastMessageTime.get(userId) || 0;
      const now = Date.now();
      if (now - lastTime < RATE_LIMIT_MS) {
        throw new Error('استنى شوية قبل ما تبعت تاني — ٣ ثواني بين كل رسالة.');
      }
      lastMessageTime.set(userId, now);

      // Check credits (10 per plan — more expensive than chat)
      const balance = await getUserCredits(userId);
      if (balance < 10) {
        throw new Error(`مفيش كريدت كافي. محتاج ١٠ كريدت — عندك ${balance}. اشتري كريدت من صفحة التسعير.`);
      }

      const db = await getDb();
      if (!db) throw new Error('Database unavailable');

      const twinClientId = await resolveTwinClientIdForCopilot(db, userId, userRole, input.clientId);
      const deduction = await deductCredits(userId, 'copilot_plan');
      if (!deduction.success) {
        throw new Error(deduction.error || 'مفيش كريدت كافي');
      }

      try {
        const contextStr = await buildBrandContext(userId, db, twinClientId);

        const planPrompt = `بناءً على الـ context الكامل بتاع البراند ده، اعملي خطة عمل مهيكلة من ٥ خطوات.

كل خطوة لازم تشمل:
1. **عنوان الخطوة** (جملة واحدة)
2. **ليه مهمة** (جملة واحدة تربطها بنتيجة التشخيص)
3. **إزاي تنفذها** (٢-٣ نقاط عملية)
4. **مستوى الصعوبة** (سهل / متوسط / صعب)
5. **الوقت المتوقع** (مثلاً: ساعة، يوم، أسبوع)

رتّب الخطوات من الأسهل والأسرع تأثيراً للأصعب.
ركّز على الحاجات اللي ممكن يعملها بنفسه بدون إيجنسي.
لو في تنبيهات حرجة في الـ context — الأولوية ليها.

الرد لازم يكون JSON array بالشكل ده:
[
  {
    "task": "عنوان الخطوة",
    "why": "ليه مهمة",
    "howTo": ["خطوة ١", "خطوة ٢", "خطوة ٣"],
    "difficulty": "سهل",
    "timeEstimate": "ساعة"
  }
]

رد بـ JSON فقط — بدون أي كلام قبله أو بعده.`;

        const messages: Array<{ role: 'system' | 'user'; content: string }> = [
          { role: 'system', content: `${COPILOT_SYSTEM}\n\n--- CONTEXT ---\n${contextStr}` },
          { role: 'user', content: planPrompt },
        ];

        const response = await resilientLLM({ messages }, { context: 'copilot_plan' });
        const aiResponse = response.choices[0]?.message?.content as string;

        // Parse the JSON response
        let planSteps: Array<{ task: string; why: string; howTo: string[]; difficulty: string; timeEstimate: string }>;
        try {
          // Strip markdown code fences if present
          const cleaned = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          planSteps = JSON.parse(cleaned);
        } catch {
          logger.warn({ aiResponse }, 'Failed to parse plan JSON — returning raw');
          throw new Error('الـ AI مرجعش خطة مهيكلة. حاول تاني.');
        }

        // Save as checklist items
        const checklistItems = planSteps.map((step, i) => ({
          id: i,
          task: step.task,
          difficulty: step.difficulty,
          howTo: step.howTo,
          why: step.why,
          timeEstimate: step.timeEstimate,
          completed: false,
          completedAt: null,
        }));

        await db.insert(userChecklists).values({
          userId,
          diagnosisId: 0, // plan-generated, not tied to a specific diagnosis
          items: checklistItems,
          completedCount: 0,
          totalCount: checklistItems.length,
        }).catch((err: unknown) => logger.warn({ err }, 'Failed to save plan checklist'));

        // Save to copilot history
        const planSummary = planSteps.map((s, i) => `${i + 1}. ${s.task} (${s.difficulty} — ${s.timeEstimate})`).join('\n');
        await Promise.all([
          db.insert(copilotMessages).values({
            userId,
            sessionId: input.sessionId,
            role: 'user',
            content: '/plan — اعملي خطة عمل',
            tokensUsed: 0,
          }),
          db.insert(copilotMessages).values({
            userId,
            sessionId: input.sessionId,
            role: 'assistant',
            content: `خطة العمل بتاعتك:\n${planSummary}\n\nالخطة اتحفظت في صفحة My Brand. ابدأ من الخطوة الأولى!`,
            tokensUsed: response.usage?.total_tokens || 0,
          }),
        ]).catch(err => logger.warn({ err }, 'Failed to save plan messages'));

        return {
          plan: planSteps,
          creditsUsed: 10,
          creditsRemaining: deduction.newBalance ?? 0,
        };
      } catch (err: unknown) {
        // Refund on failure
        try {
          const { addCredits } = await import('../db');
          await addCredits(userId, 10, 'copilot_plan_refund', 'Refund — plan generation failed');
        } catch { /* best effort */ }
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes('كريدت') || msg.includes('استنى') || msg.includes('مهيكلة')) throw err;
        logger.error({ err, userId }, 'Copilot plan generation failed');
        throw new Error('حصل مشكلة في توليد الخطة — حاول تاني. الكريدت اترجعت.');
      }
    }),
});
