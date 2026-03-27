/**
 * MESSAGING INTEGRATION — WhatsApp & Telegram
 * =============================================
 * 
 * Connects Wzrd AI to messaging platforms so clients can interact
 * via their preferred channel.
 * 
 * SUPPORTED:
 * 1. WhatsApp Business API (via webhook)
 * 2. Telegram Bot API
 * 
 * FLOW:
 * Client sends message on WhatsApp → Webhook receives it →
 * Routes to Agent Orchestrator → Agent responds →
 * Response sent back to client on WhatsApp
 * 
 * SETUP:
 * 1. Create WhatsApp Business account
 * 2. Set webhook URL to: /api/webhooks/whatsapp
 * 3. Set WHATSAPP_TOKEN and WHATSAPP_VERIFY_TOKEN in env
 * 
 * For Telegram:
 * 1. Create bot via BotFather
 * 2. Set webhook URL to: /api/webhooks/telegram
 * 3. Set TELEGRAM_BOT_TOKEN in env
 */

import { Router, Request, Response, type Express } from 'express';
import { logger } from './_core/logger';
import { ENV } from './_core/env';
import { orchestrate } from './agentOrchestrator';
import { createAiConversation, updateAiConversation } from './db';

// ════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════

interface MessageSession {
  conversationId: number;
  clientId?: number;
  messages: Array<{ role: string; content: string; agent?: string }>;
  lastActivity: number;
  platform: 'whatsapp' | 'telegram';
  phoneNumber?: string;
  chatId?: string;
}

// In-memory session store (for MVP — move to Redis in production)
const sessions = new Map<string, MessageSession>();
const SESSION_TTL = 24 * 60 * 60 * 1000; // 24 hours

function getSessionKey(platform: string, id: string): string {
  return `${platform}:${id}`;
}

function cleanStaleSessions() {
  const now = Date.now();
  for (const [key, session] of sessions) {
    if (now - session.lastActivity > SESSION_TTL) {
      sessions.delete(key);
    }
  }
}

// ════════════════════════════════════════════
// WHATSAPP BUSINESS API
// ════════════════════════════════════════════

export function createWhatsAppRouter(): Router {
  const router = Router();

  // Webhook verification (GET)
  router.get('/whatsapp', (req: Request, res: Response) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    const verifyToken = ((ENV as unknown as Record<string, string | undefined>)).whatsappVerifyToken || process.env.WHATSAPP_VERIFY_TOKEN;

    if (mode === 'subscribe' && token === verifyToken) {
      logger.info('WhatsApp webhook verified');
      res.status(200).send(challenge);
    } else {
      res.status(403).send('Forbidden');
    }
  });

  // Incoming messages (POST)
  router.post('/whatsapp', async (req: Request, res: Response) => {
    try {
      // Always respond 200 immediately (WhatsApp requires fast response)
      res.status(200).send('OK');

      const body = req.body;
      if (!body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) return;

      const change = body.entry[0].changes[0].value;
      const message = change.messages[0];
      const from = message.from; // Phone number
      const text = message.text?.body;

      if (!text) return; // Skip non-text messages

      logger.info({ from, textLength: text.length }, 'WhatsApp message received');

      // Get or create session
      const sessionKey = getSessionKey('whatsapp', from);
      let session = sessions.get(sessionKey);

      if (!session) {
        // Create new conversation
        const conv = await createAiConversation({
          context: 'general', messages: [],
          title: `WhatsApp: ${from}`,
        });
        session = {
          conversationId: conv.id,
          messages: [],
          lastActivity: Date.now(),
          platform: 'whatsapp',
          phoneNumber: from,
        };
        sessions.set(sessionKey, session);
      }

      session.lastActivity = Date.now();

      // Route to Agent Orchestrator
      const response = await orchestrate(text, {
        conversationHistory: session.messages,
        serviceType: undefined,
      });

      // Update session
      session.messages.push({ role: 'user', content: text });
      session.messages.push({ role: 'assistant', content: response.message, agent: response.agent });

      // Save to database
      await updateAiConversation(session.conversationId, { messages: session.messages });

      // Send response back via WhatsApp API
      await sendWhatsAppMessage(from, response.message, response.agentLabel);

    } catch (err) {
      logger.error({ err }, 'WhatsApp webhook error');
    }
  });

  return router;
}

async function sendWhatsAppMessage(to: string, text: string, agentLabel?: string) {
  const token = ((ENV as unknown as Record<string, string | undefined>)).whatsappToken || process.env.WHATSAPP_TOKEN;
  const phoneId = ((ENV as unknown as Record<string, string | undefined>)).whatsappPhoneId || process.env.WHATSAPP_PHONE_ID;

  if (!token || !phoneId) {
    logger.warn('WhatsApp credentials not configured');
    return;
  }

  // Prefix with agent label
  const fullText = agentLabel ? `*${agentLabel}*\n\n${text}` : text;

  // WhatsApp has a 4096 char limit — truncate if needed
  const truncated = fullText.length > 4000 ? fullText.substring(0, 3990) + '\n\n...(continued)' : fullText;

  try {
    await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: truncated },
      }),
    });
    logger.info({ to, length: truncated.length }, 'WhatsApp message sent');
  } catch (err) {
    logger.error({ err, to }, 'Failed to send WhatsApp message');
  }
}

// ════════════════════════════════════════════
// TELEGRAM BOT API
// ════════════════════════════════════════════

export function createTelegramRouter(): Router {
  const router = Router();

  router.post('/telegram', async (req: Request, res: Response) => {
    try {
      res.status(200).send('OK');

      const update = req.body;
      if (!update?.message?.text) return;

      const chatId = String(update.message.chat.id);
      const text = update.message.text;
      const userName = update.message.from?.first_name || 'User';

      // Skip commands
      if (text.startsWith('/start')) {
        await sendTelegramMessage(chatId, `مرحباً ${userName}! أنا Wzrd AI — المستشار الذكي لـ Primo Marca. اكتب سؤالك وهجاوبك. 🧠`);
        return;
      }

      logger.info({ chatId, textLength: text.length }, 'Telegram message received');

      // Get or create session
      const sessionKey = getSessionKey('telegram', chatId);
      let session = sessions.get(sessionKey);

      if (!session) {
        const conv = await createAiConversation({
          context: 'general', messages: [],
          title: `Telegram: ${userName}`,
        });
        session = {
          conversationId: conv.id,
          messages: [],
          lastActivity: Date.now(),
          platform: 'telegram',
          chatId,
        };
        sessions.set(sessionKey, session);
      }

      session.lastActivity = Date.now();

      // Route to Agent Orchestrator
      const response = await orchestrate(text, {
        conversationHistory: session.messages,
      });

      session.messages.push({ role: 'user', content: text });
      session.messages.push({ role: 'assistant', content: response.message, agent: response.agent });
      await updateAiConversation(session.conversationId, { messages: session.messages });

      // Send response
      const prefix = `🤖 *${response.agentLabel}*\n\n`;
      await sendTelegramMessage(chatId, prefix + response.message);

    } catch (err) {
      logger.error({ err }, 'Telegram webhook error');
    }
  });

  return router;
}

async function sendTelegramMessage(chatId: string, text: string) {
  const token = ((ENV as unknown as Record<string, string | undefined>)).telegramBotToken || process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    logger.warn('Telegram bot token not configured');
    return;
  }

  // Telegram limit: 4096 chars
  const truncated = text.length > 4000 ? text.substring(0, 3990) + '\n\n...' : text;

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: truncated,
        parse_mode: 'Markdown',
      }),
    });
  } catch (err) {
    logger.error({ err, chatId }, 'Failed to send Telegram message');
  }
}

// ════════════════════════════════════════════
// WIRE INTO EXPRESS
// ════════════════════════════════════════════

/**
 * Mount messaging webhooks on the Express app.
 * Call in server/_core/index.ts:
 *   import { mountMessagingWebhooks } from '../messagingIntegration';
 *   mountMessagingWebhooks(app);
 */
export function mountMessagingWebhooks(app: Express) {
  const whatsappRouter = createWhatsAppRouter();
  const telegramRouter = createTelegramRouter();

  app.use('/api/webhooks', whatsappRouter);
  app.use('/api/webhooks', telegramRouter);

  logger.info('Messaging webhooks mounted: /api/webhooks/whatsapp, /api/webhooks/telegram');

  // Clean stale sessions every hour
  setInterval(cleanStaleSessions, 60 * 60 * 1000);
}
