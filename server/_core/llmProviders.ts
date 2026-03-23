/**
 * DUAL LLM PROVIDERS
 * ==================
 * 
 * Two providers, one interface:
 * 
 * 1. GROQ (Primary — free/cheap)
 *    - OpenAI-compatible API
 *    - Llama 3.3 70B at 394 tokens/sec
 *    - Used for: chat, research, knowledge, quality review
 *    - Cost: $0 (free tier) or $0.59/M tokens
 * 
 * 2. CLAUDE (Premium — smart)
 *    - Anthropic Messages API
 *    - Claude Sonnet 4
 *    - Used for: deliverables, proposals, brand audits
 *    - Cost: $3/M input, $15/M output
 * 
 * Both return the same InvokeResult format so the rest of
 * the codebase doesn't need to know which provider answered.
 */

import { ENV } from './env';
import { logger } from './logger';
import type { InvokeParams, InvokeResult, Message, Role } from './llm';

// Re-export types
export type { InvokeParams, InvokeResult };

export type LLMProvider = 'groq' | 'claude';

// ════════════════════════════════════════════
// GROQ PROVIDER (OpenAI-compatible)
// ════════════════════════════════════════════

export async function invokeGroq(params: InvokeParams): Promise<InvokeResult> {
  const apiKey = ENV.groqApiKey;
  if (!apiKey) throw new Error('GROQ_API_KEY not configured');

  const contentToString = (c: import('./llm').MessageContent): string =>
    typeof c === 'string' ? c : (c && typeof c === 'object' && 'text' in c ? (c as { text?: string }).text ?? '' : '');
  const messages = params.messages.map(m => ({
    role: m.role,
    content: typeof m.content === 'string' ? m.content
      : Array.isArray(m.content) ? m.content.map(contentToString).join('\n')
      : contentToString(m.content),
  }));

  const payload: Record<string, unknown> = {
    model: ENV.groqModel,
    messages,
    max_tokens: 8192,
    temperature: 0.7,
  };

  const response = await fetch(`${ENV.groqApiUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Groq API failed: ${response.status} — ${err}`);
  }

  return (await response.json()) as InvokeResult;
}

// ════════════════════════════════════════════
// CLAUDE PROVIDER (Anthropic Messages API)
// ════════════════════════════════════════════

export async function invokeClaude(params: InvokeParams): Promise<InvokeResult> {
  const apiKey = ENV.claudeApiKey;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');

  // Split system message from user/assistant messages (Anthropic requirement)
  let system = '';
  const filtered: Array<{ role: string; content: string }> = [];

  const contentToString = (c: import('./llm').MessageContent): string =>
    typeof c === 'string' ? c : (c && typeof c === 'object' && 'text' in c ? (c as { text?: string }).text ?? '' : '');
  for (const msg of params.messages) {
    const content = typeof msg.content === 'string' ? msg.content
      : Array.isArray(msg.content) ? msg.content.map(contentToString).join('\n')
      : contentToString(msg.content);

    if (msg.role === 'system') {
      system += (system ? '\n\n' : '') + content;
    } else {
      filtered.push({ role: msg.role === 'assistant' ? 'assistant' : 'user', content });
    }
  }

  // Ensure alternating user/assistant (Anthropic requirement)
  if (filtered.length === 0) filtered.push({ role: 'user', content: '(start)' });
  if (filtered[0].role === 'assistant') filtered.unshift({ role: 'user', content: '(continue)' });

  // Merge consecutive same-role messages
  const merged: Array<{ role: string; content: string }> = [];
  for (const msg of filtered) {
    if (merged.length > 0 && merged[merged.length - 1].role === msg.role) {
      merged[merged.length - 1].content += '\n\n' + msg.content;
    } else {
      merged.push({ ...msg });
    }
  }

  const payload: Record<string, unknown> = {
    model: ENV.claudeModel,
    max_tokens: 8192,
    messages: merged,
  };
  if (system) payload.system = system;

  const response = await fetch(`${ENV.claudeApiUrl}/v1/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Claude API failed: ${response.status} — ${err}`);
  }

  // Convert Anthropic response → OpenAI format
  const result = await response.json() as {
    id: string;
    model: string;
    content: Array<{ type: string; text?: string }>;
    stop_reason: string;
    usage: { input_tokens: number; output_tokens: number };
  };

  const text = result.content.filter((c: { type: string }) => c.type === 'text').map((c: { text?: string }) => c.text || '').join('');

  return {
    id: result.id,
    created: Math.floor(Date.now() / 1000),
    model: result.model,
    choices: [{
      index: 0,
      message: { role: 'assistant' as Role, content: text },
      finish_reason: result.stop_reason === 'end_turn' ? 'stop' : result.stop_reason,
    }],
    usage: {
      prompt_tokens: result.usage.input_tokens,
      completion_tokens: result.usage.output_tokens,
      total_tokens: result.usage.input_tokens + result.usage.output_tokens,
    },
  };
}

// ════════════════════════════════════════════
// SMART ROUTING — which provider for which task
// ════════════════════════════════════════════

/**
 * Context → Provider routing map.
 * 
 * Groq (free): chat, research, knowledge, quality review
 * Claude (premium): deliverables, proposals, diagnosis reports
 */
const PROVIDER_ROUTING: Record<string, LLMProvider> = {
  // Groq — fast, free, good enough
  chat: 'groq',
  research: 'groq',
  knowledge: 'groq',
  quality: 'groq',
  default: 'groq',

  // All use Groq when Claude key not set
  proposal: 'groq',
  diagnosis: 'groq',
  deliverable: 'groq',
};

/**
 * Pick the right provider based on context.
 */
export function routeToProvider(context: string): LLMProvider {
  if (!ENV.claudeApiKey) return 'groq';
  // If only one provider is configured, use that one
  if (ENV.groqApiKey && !ENV.claudeApiKey) return 'groq';
  if (ENV.claudeApiKey && !ENV.groqApiKey) return 'claude';
  if (!ENV.groqApiKey && !ENV.claudeApiKey) {
    logger.error('No LLM API keys configured! Set GROQ_API_KEY and/or ANTHROPIC_API_KEY');
    return 'groq'; // Will fail, but at least logs the error
  }

  return PROVIDER_ROUTING[context] || PROVIDER_ROUTING.default;
}

/**
 * Invoke the right provider based on context.
 * Falls back to the other provider if primary fails.
 */
export async function invokeWithProvider(
  params: InvokeParams,
  context: string
): Promise<{ result: InvokeResult; provider: LLMProvider }> {
  const primary = routeToProvider(context);
  const fallback: LLMProvider = primary === 'groq' ? 'claude' : 'groq';

  // Try primary
  try {
    const result = primary === 'groq'
      ? await invokeGroq(params)
      : await invokeClaude(params);

    return { result, provider: primary };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    logger.warn({ provider: primary, context, err: errMsg }, `Primary LLM (${primary}) failed — trying fallback (${fallback})`);
  }

  // Try fallback
  try {
    const fallbackKey = fallback === 'groq' ? ENV.groqApiKey : ENV.claudeApiKey;
    if (!fallbackKey) throw new Error(`Fallback provider ${fallback} not configured`);

    const result = fallback === 'groq'
      ? await invokeGroq(params)
      : await invokeClaude(params);

    logger.info({ provider: fallback, context }, `Fallback LLM (${fallback}) succeeded`);
    return { result, provider: fallback };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    throw new Error(`Both LLM providers failed. Primary (${primary}): failed. Fallback (${fallback}): ${errMsg}`);
  }
}

// ════════════════════════════════════════════
// PROVIDER HEALTH CHECK
// ════════════════════════════════════════════

export function getProviderStatus(): {
  groq: { configured: boolean; available: boolean };
  claude: { configured: boolean; available: boolean };
  activeProvider: string;
} {
  return {
    groq: { configured: !!ENV.groqApiKey, available: !!ENV.groqApiKey },
    claude: { configured: !!ENV.claudeApiKey, available: !!ENV.claudeApiKey },
    activeProvider: ENV.groqApiKey ? 'groq (primary)' : ENV.claudeApiKey ? 'claude (primary)' : 'none',
  };
}
