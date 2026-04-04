/**
 * MESSAGING INTEGRATION — WhatsApp & Telegram
 * Phase 3: WhatsApp → linked users use Copilot (credits + Brand Twin); unlinked → orchestrator + nudge.
 * Sessions: Redis when configured; in-memory fallback per process.
 */
import { Router, Request, Response, type Express } from "express";
import { logger } from "./_core/logger";
import { ENV } from "./_core/env";
import { getRedis } from "./_core/redis";
import { orchestrate } from "./agentOrchestrator";
import { getUserByWhatsAppPhone } from "./db/users";
import { getUserCredits, deductCredits, addCredits } from "./db/credits";
import {
  buildBrandContext,
  resolveTwinClientIdForCopilot,
} from "./copilot/brandContext";
import { resilientLLM } from "./_core/llmRouter";
import { getDb } from "./db";
import { copilotMessages } from "../drizzle/schema";
import { createAiConversation, updateAiConversation } from "./db";

const SESSION_TTL_SECONDS = 24 * 60 * 60;
const COPILOT_CREDITS_PER_MSG = 5;
const RATE_LIMIT_MS = 3_000;
const MAX_HISTORY_MESSAGES = 20;

const lastMessageTime = new Map<string, number>();

interface WhatsAppSession {
  conversationId: number;
  userId?: number;
  messages: Array<{ role: string; content: string; agent?: string }>;
  lastActivity: number;
  platform: "whatsapp";
  phoneNumber: string;
  onboardingStep?: "initial" | "prompted";
}

interface WhatsAppWebhookBody {
  entry?: Array<{
    changes?: Array<{
      value?: {
        messages?: Array<{
          from: string;
          text?: { body?: string };
          type?: string;
        }>;
      };
    }>;
  }>;
}

const waMemoryStore = new Map<string, WhatsAppSession>();

function sessionKeyWa(phone: string): string {
  return `wa:session:${phone}`;
}

async function getWaSession(phone: string): Promise<WhatsAppSession | null> {
  const redis = getRedis();
  if (redis) {
    try {
      const raw = await redis.get(sessionKeyWa(phone));
      if (raw) return JSON.parse(raw) as WhatsAppSession;
    } catch {
      /* fallback */
    }
  }
  const s = waMemoryStore.get(phone);
  if (!s) return null;
  if (Date.now() - s.lastActivity > SESSION_TTL_SECONDS * 1000) {
    waMemoryStore.delete(phone);
    return null;
  }
  return s;
}

async function saveWaSession(phone: string, session: WhatsAppSession): Promise<void> {
  session.lastActivity = Date.now();
  const redis = getRedis();
  if (redis) {
    try {
      await redis.set(sessionKeyWa(phone), JSON.stringify(session), "EX", SESSION_TTL_SECONDS);
      return;
    } catch (err) {
      logger.warn({ err }, "Failed to save WhatsApp session to Redis");
    }
  }
  waMemoryStore.set(phone, session);
}

const WA_COPILOT_SYSTEM = `أنت Wzrd AI — مستشار البراند الذكي. بتساعد أصحاب الأعمال في منطقة الشرق الأوسط وشمال أفريقيا يطوروا براندهم ويحلوا تحدياتهم التسويقية.

**قواعد مهمة:**
- رد دايماً بالعربية ما لم يكتب المستخدم بالإنجليزي
- اجوبة مختصرة ومفيدة — واتساب مش مكان للمقالات الطويلة
- لو محتاج تشرح تفصيلي، قول "ادخل على التطبيق لتفاصيل أكتر"
- استخدم الـ context بتاع البراند لو موجود
- متحكيش عن كريدت أو أسعار إلا لو سألك المستخدم مباشرة`;

async function runCopilotForLinkedUser(
  userId: number,
  userRole: string,
  phone: string,
  userMessage: string,
  session: WhatsAppSession,
): Promise<{ reply: string; creditsUsed: number; creditsRemaining: number }> {
  const now = Date.now();
  const lastTime = lastMessageTime.get(phone) || 0;
  if (now - lastTime < RATE_LIMIT_MS) {
    return {
      reply: "استنى ٣ ثواني بين كل رسالة 🙏",
      creditsUsed: 0,
      creditsRemaining: await getUserCredits(userId),
    };
  }
  lastMessageTime.set(phone, now);

  const balance = await getUserCredits(userId);
  if (balance < COPILOT_CREDITS_PER_MSG) {
    return {
      reply: `مفيش كريدت كافي ⚡\nعندك ${balance} كريدت — محتاج ${COPILOT_CREDITS_PER_MSG}.\nاشتري كريدت من التطبيق: https://wzrd.ai/pricing`,
      creditsUsed: 0,
      creditsRemaining: balance,
    };
  }

  const deduction = await deductCredits(userId, "copilot_message");
  if (!deduction.success) {
    return {
      reply: `مفيش كريدت كافي — ${deduction.error || "حاول تاني"}`,
      creditsUsed: 0,
      creditsRemaining: balance,
    };
  }

  const db = await getDb();
  if (!db) {
    await addCredits(userId, COPILOT_CREDITS_PER_MSG, "copilot_refund", "Refund — DB unavailable (WA)").catch(() => {});
    return {
      reply: "النظام مش متاح دلوقتي — حاول تاني.",
      creditsUsed: 0,
      creditsRemaining: await getUserCredits(userId),
    };
  }

  try {
    const twinClientId = await resolveTwinClientIdForCopilot(db, userId, userRole, null);
    const brandCtx = await buildBrandContext(userId, db, twinClientId);

    const systemContent = `${WA_COPILOT_SYSTEM}\n\n--- CONTEXT ---\n${brandCtx}`;

    const aiMessages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      { role: "system", content: systemContent },
    ];

    const recentHistory = session.messages.slice(-MAX_HISTORY_MESSAGES);
    for (const msg of recentHistory) {
      aiMessages.push({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      });
    }
    aiMessages.push({ role: "user", content: userMessage });

    const response = await resilientLLM({ messages: aiMessages }, { context: "copilot" });
    const aiReply =
      (response.choices[0]?.message?.content as string | undefined)?.trim() || "حصل خطأ — حاول تاني";
    const tokensUsed = response.usage?.total_tokens || 0;

    const sessionId = `wa:${phone}`;
    await Promise.all([
      db.insert(copilotMessages).values({
        userId,
        sessionId,
        role: "user",
        content: userMessage,
        tokensUsed: 0,
      }),
      db.insert(copilotMessages).values({
        userId,
        sessionId,
        role: "assistant",
        content: aiReply,
        tokensUsed,
      }),
    ]).catch((err) => logger.warn({ err }, "Failed to save WA copilot messages"));

    return {
      reply: aiReply,
      creditsUsed: COPILOT_CREDITS_PER_MSG,
      creditsRemaining: deduction.newBalance ?? 0,
    };
  } catch (err) {
    await addCredits(userId, COPILOT_CREDITS_PER_MSG, "copilot_refund", "Refund — WA copilot failed").catch(() => {});
    logger.error({ err, userId, phone }, "WA Copilot AI failed");
    return {
      reply: "حصل خطأ في الذكاء الاصطناعي — الكريدت اترجعت. حاول تاني 🙏",
      creditsUsed: 0,
      creditsRemaining: await getUserCredits(userId).catch(() => 0),
    };
  }
}

const ONBOARDING_INITIAL = `مرحباً بك في *Wzrd AI* 🧠✨

أنا المستشار الذكي لتطوير البراند في منطقة MENA.

عشان تستخدم الكوبايلوت الذكي عبر واتساب، محتاج تربط رقمك بحسابك على التطبيق:

👉 *wzrd.ai/settings/whatsapp*

بعد الربط، هتقدر:
✅ تتكلم مع الكوبايلوت مباشرة من واتساب
✅ تاخد تحليل البراند بتاعك
✅ تحصل على توصيات مخصصة

لو عندك حساب بالفعل، ادخل على الإعدادات واربط رقمك. 🔗`;

// ── WhatsApp router ──────────────────────────────────────────

export function createWhatsAppRouter(): Router {
  const router = Router();

  router.get("/whatsapp", (req: Request, res: Response) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];
    const verifyToken =
      (ENV as unknown as Record<string, string | undefined>).whatsappVerifyToken ||
      process.env.WHATSAPP_VERIFY_TOKEN;

    if (mode === "subscribe" && token === verifyToken) {
      logger.info("WhatsApp webhook verified");
      res.status(200).send(challenge);
    } else {
      res.status(403).send("Forbidden");
    }
  });

  router.post("/whatsapp", async (req: Request, res: Response) => {
    res.status(200).send("OK");

    try {
      const body = req.body as WhatsAppWebhookBody;
      const message = body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
      if (!message) return;

      const from = message.from;
      const text = message.text?.body;
      if (!text) return;

      logger.info({ from, textLength: text.length }, "WhatsApp message received");

      const trimmed = text.trim();
      if (trimmed === "/start" || trimmed === "/help") {
        await sendWhatsAppMessage(from, ONBOARDING_INITIAL);
        return;
      }

      if (trimmed === "/unlink") {
        await sendWhatsAppMessage(
          from,
          'عشان تفك ربط رقمك، ادخل على *wzrd.ai/settings/whatsapp* واضغط "فك الربط".',
        );
        return;
      }

      if (trimmed === "/credits") {
        const linkedUser = await getUserByWhatsAppPhone(from);
        if (linkedUser) {
          const bal = await getUserCredits(linkedUser.id);
          await sendWhatsAppMessage(
            from,
            `💳 رصيدك الحالي: *${bal} كريدت*\n\nلشراء كريدت: wzrd.ai/pricing`,
          );
        } else {
          await sendWhatsAppMessage(
            from,
            "ربط حسابك الأول عشان تشوف رصيدك: wzrd.ai/settings/whatsapp",
          );
        }
        return;
      }

      let session = await getWaSession(from);

      if (!session) {
        const conv = await createAiConversation({
          context: "general",
          messages: [],
          title: `WhatsApp: ${from}`,
        });
        session = {
          conversationId: conv.id,
          messages: [],
          lastActivity: Date.now(),
          platform: "whatsapp",
          phoneNumber: from,
          onboardingStep: "initial",
        };
      }

      session.lastActivity = Date.now();

      const linkedUser = await getUserByWhatsAppPhone(from);

      if (linkedUser) {
        session.userId = linkedUser.id;

        const { reply, creditsUsed, creditsRemaining } = await runCopilotForLinkedUser(
          linkedUser.id,
          linkedUser.role,
          from,
          text,
          session,
        );

        session.messages.push({ role: "user", content: text });
        session.messages.push({ role: "assistant", content: reply });

        if (session.messages.length > MAX_HISTORY_MESSAGES * 2) {
          session.messages = session.messages.slice(-MAX_HISTORY_MESSAGES * 2);
        }

        await saveWaSession(from, session);
        await updateAiConversation(session.conversationId, { messages: session.messages });

        let finalReply = reply;
        if (creditsUsed > 0) {
          finalReply += `\n\n_💳 ${creditsUsed} كريدت | رصيدك: ${creditsRemaining}_`;
        }
        await sendWhatsAppMessage(from, finalReply);
      } else {
        const response = await orchestrate(text, {
          conversationHistory: session.messages,
          serviceType: undefined,
        });

        session.messages.push({ role: "user", content: text });
        session.messages.push({
          role: "assistant",
          content: response.message,
          agent: response.agent,
        });

        await saveWaSession(from, session);
        await updateAiConversation(session.conversationId, { messages: session.messages });

        await sendWhatsAppMessage(from, response.message, response.agentLabel);

        const userMsgCount = session.messages.filter((m) => m.role === "user").length;
        if (userMsgCount === 2 && session.onboardingStep === "initial") {
          session.onboardingStep = "prompted";
          await saveWaSession(from, session);
          await new Promise((r) => setTimeout(r, 1500));
          await sendWhatsAppMessage(
            from,
            "💡 *نصيحة:* ربط حسابك على wzrd.ai/settings/whatsapp هيخليك تستخدم الكوبايلوت الكامل مع سياق البراند بتاعك وتتابع كريدتك.",
          );
        }
      }
    } catch (err) {
      logger.error({ err }, "WhatsApp webhook error");
    }
  });

  return router;
}

async function sendWhatsAppMessage(to: string, text: string, agentLabel?: string) {
  const token =
    (ENV as unknown as Record<string, string | undefined>).whatsappToken ||
    process.env.WHATSAPP_TOKEN;
  const phoneId =
    (ENV as unknown as Record<string, string | undefined>).whatsappPhoneId ||
    process.env.WHATSAPP_PHONE_ID;

  if (!token || !phoneId) {
    logger.warn("WhatsApp credentials not configured");
    return;
  }

  const fullText = agentLabel ? `*${agentLabel}*\n\n${text}` : text;
  const truncated =
    fullText.length > 4000 ? fullText.substring(0, 3990) + "\n\n...(continued)" : fullText;

  try {
    const res = await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: truncated },
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      logger.error({ to, status: res.status, body: errBody }, "WhatsApp API error");
    } else {
      logger.info({ to, length: truncated.length }, "WhatsApp message sent");
    }
  } catch (err) {
    logger.error({ err, to }, "Failed to send WhatsApp message");
  }
}

// ── Telegram ─────────────────────────────────────────────────

interface TelegramSessionPayload {
  conversationId: number;
  messages: Array<{ role: string; content: string; agent?: string }>;
  lastActivity: number;
}

const tgMemoryStore = new Map<string, TelegramSessionPayload>();

function sessionKeyTg(chatId: string): string {
  return `tg:session:${chatId}`;
}

async function getTgSession(chatId: string): Promise<TelegramSessionPayload | null> {
  const redis = getRedis();
  if (redis) {
    try {
      const raw = await redis.get(sessionKeyTg(chatId));
      if (raw) return JSON.parse(raw) as TelegramSessionPayload;
    } catch {
      /* fallback */
    }
  }
  const s = tgMemoryStore.get(chatId);
  if (!s) return null;
  if (Date.now() - s.lastActivity > SESSION_TTL_SECONDS * 1000) {
    tgMemoryStore.delete(chatId);
    return null;
  }
  return s;
}

async function saveTgSession(chatId: string, payload: TelegramSessionPayload): Promise<void> {
  payload.lastActivity = Date.now();
  const redis = getRedis();
  if (redis) {
    try {
      await redis.set(sessionKeyTg(chatId), JSON.stringify(payload), "EX", SESSION_TTL_SECONDS);
      return;
    } catch {
      /* fallback */
    }
  }
  tgMemoryStore.set(chatId, payload);
}

export function createTelegramRouter(): Router {
  const router = Router();

  router.post("/telegram", async (req: Request, res: Response) => {
    try {
      res.status(200).send("OK");
      const update = req.body as {
        message?: { text?: string; chat?: { id?: number }; from?: { first_name?: string } };
      };
      if (!update?.message?.text) return;

      const chatId = String(update.message.chat?.id ?? "");
      const telegramText = update.message.text;
      const userName = update.message.from?.first_name || "User";

      if (telegramText.startsWith("/start")) {
        await sendTelegramMessage(
          chatId,
          `مرحباً ${userName}! أنا Wzrd AI — المستشار الذكي لـ WZZRD AI. اكتب سؤالك وهجاوبك. 🧠`,
        );
        return;
      }

      logger.info({ chatId, textLength: telegramText.length }, "Telegram message received");

      let tgSession = await getTgSession(chatId);

      if (!tgSession) {
        const conv = await createAiConversation({
          context: "general",
          messages: [],
          title: `Telegram: ${userName}`,
        });
        tgSession = { conversationId: conv.id, messages: [], lastActivity: Date.now() };
      }

      const response = await orchestrate(telegramText, {
        conversationHistory: tgSession.messages,
      });

      tgSession.messages.push({ role: "user", content: telegramText });
      tgSession.messages.push({
        role: "assistant",
        content: response.message,
        agent: response.agent,
      });

      await saveTgSession(chatId, tgSession);
      await updateAiConversation(tgSession.conversationId, { messages: tgSession.messages });

      const prefix = `🤖 *${response.agentLabel}*\n\n`;
      await sendTelegramMessage(chatId, prefix + response.message);
    } catch (err) {
      logger.error({ err }, "Telegram webhook error");
    }
  });

  return router;
}

async function sendTelegramMessage(chatId: string, text: string) {
  const token =
    (ENV as unknown as Record<string, string | undefined>).telegramBotToken ||
    process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    logger.warn("Telegram bot token not configured");
    return;
  }

  const truncated = text.length > 4000 ? text.substring(0, 3990) + "\n\n..." : text;

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: truncated,
        parse_mode: "Markdown",
      }),
    });
  } catch (err) {
    logger.error({ err, chatId }, "Failed to send Telegram message");
  }
}

export function mountMessagingWebhooks(app: Express) {
  const whatsappRouter = createWhatsAppRouter();
  const telegramRouter = createTelegramRouter();
  app.use("/api/webhooks", whatsappRouter);
  app.use("/api/webhooks", telegramRouter);
  logger.info("Messaging webhooks mounted: /api/webhooks/whatsapp, /api/webhooks/telegram");
}
