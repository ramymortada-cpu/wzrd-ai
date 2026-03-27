import { useState, useEffect, useRef, useCallback } from 'react';
import { useI18n } from '@/lib/i18n';
import WzrdPublicHeader from '@/components/WzrdPublicHeader';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  createdAt?: string;
}

interface Suggestion {
  text: string;
  icon: string;
}

interface CopilotClientOption {
  id: number;
  name: string;
  companyName: string | null;
}

export default function Copilot() {
  const { locale } = useI18n();
  const isAr = locale === 'ar';

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [error, setError] = useState('');
  const [sessionId] = useState(() => 'sess_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6));
  const [clientList, setClientList] = useState<CopilotClientOption[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<number | undefined>(undefined);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const userScrolled = useRef(false);

  useEffect(() => {
    fetch('/api/trpc/credits.balance')
      .then(r => r.json())
      .then(d => setCredits(d.result?.data?.json?.credits ?? d.result?.data?.credits ?? 0))
      .catch(() => {});

    fetch('/api/trpc/copilot.suggestions')
      .then(r => r.json())
      .then(d => {
        const data = d.result?.data?.json ?? d.result?.data ?? {};
        setSuggestions(data.suggestions || []);
      })
      .catch(() => {});

    fetch('/api/trpc/copilot.listClientsForCopilot')
      .then(r => r.json())
      .then(d => {
        const data = d.result?.data?.json ?? d.result?.data;
        if (Array.isArray(data)) setClientList(data as CopilotClientOption[]);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!userScrolled.current && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const sendMessage = useCallback(async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;

    setInput('');
    setError('');
    setLoading(true);

    const userMsg: Message = { id: Date.now(), role: 'user', content: msg };
    setMessages(prev => [...prev, userMsg]);

    try {
      const payload: { message: string; sessionId: string; clientId?: number } = { message: msg, sessionId };
      if (selectedClientId != null) payload.clientId = selectedClientId;

      const res = await fetch('/api/trpc/copilot.chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ json: payload }),
      });

      const d = await res.json();
      const result = d.result?.data?.json ?? d.result?.data;

      if (result?.response) {
        const aiMsg: Message = { id: Date.now() + 1, role: 'assistant', content: result.response };
        setMessages(prev => [...prev, aiMsg]);
        setCredits(result.creditsRemaining ?? credits);
      } else {
        const errMsg = d.error?.json?.message || d.error?.message || 'حصل مشكلة — حاول تاني.';
        setError(errMsg);
      }
    } catch {
      setError(isAr ? 'مشكلة في الاتصال — حاول تاني.' : 'Connection error — please try again.');
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }, [input, loading, sessionId, credits, isAr, selectedClientId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const userBubbleSide = isAr ? 'justify-start' : 'justify-end';
  const aiBubbleSide = isAr ? 'justify-end' : 'justify-start';

  return (
    <div className="flex min-h-screen flex-col wzrd-page-radial text-zinc-900 dark:text-white" dir={isAr ? 'rtl' : 'ltr'}>
      <WzrdPublicHeader credits={credits} />

      <div className="wzrd-public-pt flex flex-1 flex-col px-3 pb-28 sm:px-6">
        <div className="mx-auto mb-4 flex w-full max-w-3xl items-center justify-between rounded-3xl border-[0.5px] border-white/40 bg-white/50 px-4 py-3 backdrop-blur-xl dark:border-zinc-700/50 dark:bg-zinc-950/40">
          <div className="flex items-center gap-3 min-w-0">
            <a href="/my-brand" className="shrink-0 rounded-full border border-zinc-200/80 p-2 text-zinc-500 transition hover:border-primary hover:text-primary dark:border-zinc-600 dark:text-zinc-400">
              ←
            </a>
            <div className="min-w-0">
              <h1 className="truncate text-base font-extrabold tracking-tight text-zinc-900 dark:text-white">
                {isAr ? 'مستشار البراند' : 'Brand Copilot'}
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {isAr ? 'اسأل أي سؤال عن البراند بتاعك' : 'Ask anything about your brand'}
              </p>
            </div>
          </div>
          {credits !== null && (
            <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-primary/25 bg-gradient-to-r from-primary/12 to-cyan-500/10 px-3 py-1 text-xs font-bold text-primary">
              {credits} {isAr ? 'كريدت' : 'CR'}
            </div>
          )}
        </div>

        <div
          className="mx-auto flex w-full max-w-3xl flex-1 flex-col overflow-y-auto rounded-3xl border-[0.5px] border-white/30 bg-white/25 px-3 py-4 backdrop-blur-xl dark:border-zinc-700/40 dark:bg-zinc-950/35 sm:px-5"
          onScroll={(e) => {
            const el = e.currentTarget;
            userScrolled.current = el.scrollTop < el.scrollHeight - el.clientHeight - 100;
          }}
        >
          {messages.length === 0 && (
            <div className="flex flex-1 flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-cyan-500/20 text-3xl shadow-inner">🧙‍♂️</div>
              <h2 className="mb-2 text-lg font-extrabold tracking-tight text-zinc-900 dark:text-white">
                {isAr ? 'أهلاً! أنا مستشار البراند بتاعك.' : "Hi! I'm your Brand Copilot."}
              </h2>
              <p className="mb-6 max-w-sm text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                {isAr
                  ? 'اسألني أي سؤال عن البراند بتاعك — عندي context من كل التشخيصات اللي عملتها.'
                  : 'Ask me anything about your brand — I have context from all your diagnoses.'}
              </p>
              {suggestions.length > 0 && (
                <div className="flex max-w-md flex-wrap justify-center gap-2">
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => sendMessage(s.text)}
                      className="rounded-full border-[0.5px] border-zinc-200/80 bg-white/60 px-4 py-2 text-sm text-zinc-700 backdrop-blur-sm transition hover:border-primary/40 hover:bg-primary/10 dark:border-zinc-600 dark:bg-zinc-900/50 dark:text-zinc-200"
                    >
                      {s.icon} {s.text}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-end gap-2 ${msg.role === 'user' ? userBubbleSide : aiBubbleSide}`}
              >
                {msg.role === 'assistant' && !isAr && (
                  <span className="mt-1 hidden h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-cyan-500 text-xs font-bold text-white sm:flex">
                    W
                  </span>
                )}
                <div
                  className={`max-w-[88%] rounded-3xl px-4 py-3 sm:max-w-[80%] ${
                    msg.role === 'user'
                      ? 'wzrd-chat-bubble-user text-white'
                      : 'wzrd-chat-bubble-ai text-zinc-900 dark:text-zinc-100'
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                </div>
                {msg.role === 'assistant' && isAr && (
                  <span className="mt-1 hidden h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-cyan-500 text-xs font-bold text-white sm:flex">
                    W
                  </span>
                )}
              </div>
            ))}
          </div>

          {loading && (
            <div className={`mt-4 flex ${aiBubbleSide}`}>
              <div className="wzrd-chat-bubble-ai rounded-3xl px-4 py-3 dark:text-zinc-100">
                <div className="flex gap-1.5">
                  <div className="h-2 w-2 animate-bounce rounded-full bg-primary" style={{ animationDelay: '0ms' }} />
                  <div className="h-2 w-2 animate-bounce rounded-full bg-primary" style={{ animationDelay: '150ms' }} />
                  <div className="h-2 w-2 animate-bounce rounded-full bg-primary" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 text-center">
              <p className="inline-block rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-2 text-sm text-red-600 dark:text-red-300">{error}</p>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="pointer-events-none fixed bottom-0 left-0 right-0 z-40 px-3 pb-4 pt-2 sm:px-6 sm:pb-6">
        <div className="pointer-events-auto mx-auto max-w-3xl rounded-3xl p-3 sm:p-4 wzrd-floating-composer">
          {clientList.length > 1 && (
            <div className="mb-2 flex flex-wrap items-center gap-2 rounded-2xl border-[0.5px] border-zinc-200/50 bg-white/40 px-3 py-2 text-xs dark:border-zinc-600/50 dark:bg-zinc-900/40">
              <span className="shrink-0 font-semibold text-zinc-500 dark:text-zinc-400">
                {isAr ? 'سياق البراند (CRM):' : 'Brand context (CRM):'}
              </span>
              <select
                value={selectedClientId ?? ''}
                onChange={(e) => {
                  const v = e.target.value;
                  setSelectedClientId(v === '' ? undefined : Number(v));
                }}
                className="min-w-0 flex-1 rounded-xl border border-zinc-200/80 bg-white/80 py-1.5 pl-2 pr-8 text-zinc-800 outline-none focus:border-primary/40 dark:border-zinc-600 dark:bg-zinc-900/80 dark:text-zinc-100 sm:max-w-xs"
              >
                <option value="">{isAr ? 'تلقائي (حسب حسابك)' : 'Auto (from your profile)'}</option>
                {clientList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName || c.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          {messages.length > 0 && messages.length < 6 && (
            <div className="mb-2 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {[
                isAr ? 'اكتبلي bio' : 'Write a bio',
                isAr ? 'اقترحلي tagline' : 'Suggest tagline',
                isAr ? 'إزاي أسعّر؟' : 'Pricing help',
              ].map((q, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => sendMessage(q)}
                  disabled={loading}
                  className="flex-shrink-0 rounded-full border border-zinc-200/80 bg-white/70 px-3 py-1.5 text-xs text-zinc-600 transition hover:border-primary/30 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-300 disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 rounded-full border-[0.5px] border-zinc-200/60 bg-white/50 py-1.5 pl-4 pr-1.5 dark:border-zinc-600/50 dark:bg-zinc-950/40">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isAr ? 'اكتب سؤالك...' : 'Type your question...'}
              disabled={loading}
              className="min-h-[48px] flex-1 bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-white"
            />
            <button
              type="button"
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-cyan-500 text-white shadow-lg shadow-primary/35 transition hover:scale-105 disabled:opacity-30 disabled:hover:scale-100"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
          <p className="mt-2 text-center text-xs text-zinc-500 dark:text-zinc-400">
            {isAr ? '٥ كريدت لكل رسالة' : '5 credits per message'}
          </p>
        </div>
      </div>
    </div>
  );
}
