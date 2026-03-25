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

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const userScrolled = useRef(false);

  // Load credits + suggestions
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
  }, []);

  // Auto-scroll to bottom
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

    // Optimistic UI — add user message immediately
    const userMsg: Message = { id: Date.now(), role: 'user', content: msg };
    setMessages(prev => [...prev, userMsg]);

    try {
      const res = await fetch('/api/trpc/copilot.chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ json: { message: msg, sessionId } }),
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
  }, [input, loading, sessionId, credits, isAr]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex-shrink-0 border-b border-gray-200 bg-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <a href="/my-brand" className="text-gray-400 hover:text-gray-600 transition">←</a>
          <div>
            <h1 className="text-base font-bold text-gray-900">
              {isAr ? 'مستشار البراند' : 'Brand Copilot'}
            </h1>
            <p className="text-xs text-gray-400">
              {isAr ? 'اسأل أي سؤال عن البراند بتاعك' : 'Ask anything about your brand'}
            </p>
          </div>
        </div>
        {credits !== null && (
          <div className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold">
            {credits} {isAr ? 'كريدت' : 'CR'}
          </div>
        )}
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
        onScroll={(e) => {
          const el = e.currentTarget;
          userScrolled.current = el.scrollTop < el.scrollHeight - el.clientHeight - 100;
        }}
      >
        {/* Welcome message */}
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">🧙‍♂️</div>
            <h2 className="text-lg font-bold text-gray-800 mb-2">
              {isAr ? 'أهلاً! أنا مستشار البراند بتاعك.' : "Hi! I'm your Brand Copilot."}
            </h2>
            <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
              {isAr
                ? 'اسألني أي سؤال عن البراند بتاعك — عندي context من كل التشخيصات اللي عملتها.'
                : 'Ask me anything about your brand — I have context from all your diagnoses.'}
            </p>

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center max-w-md mx-auto">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(s.text)}
                    className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-700 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 transition"
                  >
                    {s.icon} {s.text}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Messages list */}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? (isAr ? 'justify-start' : 'justify-end') : (isAr ? 'justify-end' : 'justify-start')}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-800'
              }`}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {loading && (
          <div className={`flex ${isAr ? 'justify-end' : 'justify-start'}`}>
            <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-center">
            <p className="text-sm text-red-500 bg-red-50 inline-block px-4 py-2 rounded-xl">{error}</p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area — sticky bottom */}
      <div className="flex-shrink-0 border-t border-gray-200 bg-white px-4 py-3 safe-area-bottom">
        {/* Quick suggestions (show after messages exist) */}
        {messages.length > 0 && messages.length < 6 && (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-2 scrollbar-hide">
            {[
              isAr ? 'اكتبلي bio' : 'Write a bio',
              isAr ? 'اقترحلي tagline' : 'Suggest tagline',
              isAr ? 'إزاي أسعّر؟' : 'Pricing help',
            ].map((q, i) => (
              <button
                key={i}
                onClick={() => sendMessage(q)}
                disabled={loading}
                className="flex-shrink-0 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full text-xs hover:bg-indigo-50 hover:text-indigo-600 transition disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isAr ? 'اكتب سؤالك...' : 'Type your question...'}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-gray-100 rounded-2xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:opacity-50"
            style={{ minHeight: '48px' }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="flex-shrink-0 w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center hover:bg-indigo-500 transition disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>

        <p className="text-xs text-gray-400 mt-2 text-center">
          {isAr ? '٥ كريدت لكل رسالة' : '5 credits per message'}
        </p>
      </div>
    </div>
  );
}
