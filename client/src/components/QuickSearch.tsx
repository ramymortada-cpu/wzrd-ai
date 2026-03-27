/**
 * QuickSearch — Cmd+K global search overlay.
 * Searches clients, projects, and notes via tRPC.
 */
import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';

interface SearchResult {
  type: 'client' | 'project' | 'note' | 'tool';
  id: number | string;
  title: string;
  subtitle: string;
  path: string;
}

/** Minimal row shapes from batched tRPC list JSON (fetch path). */
type QuickSearchClientRow = {
  id: number;
  name?: string | null;
  email?: string | null;
  company?: string | null;
  industry?: string | null;
};
type QuickSearchProjectRow = {
  id: number;
  name?: string | null;
  description?: string | null;
  status?: string | null;
};

/** Unwrap tRPC JSON — supports plain arrays or `{ data: T[] }` paginated payloads. */
function parseTrpcListJson<T>(res: unknown): T[] {
  const r = res as { result?: { data?: unknown } };
  const raw = r?.result?.data;
  const inner =
    raw && typeof raw === "object" && raw !== null && "json" in raw
      ? (raw as { json: unknown }).json
      : raw;
  if (inner && typeof inner === "object" && inner !== null && "data" in inner) {
    const d = (inner as { data: unknown }).data;
    return Array.isArray(d) ? (d as T[]) : [];
  }
  return Array.isArray(inner) ? (inner as T[]) : [];
}

const ICON_MAP: Record<string, string> = {
  client: '👤',
  project: '📁',
  note: '📝',
  tool: '🔬',
};

export default function QuickSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(0);
  const [, navigate] = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);

  // Cmd+K listener
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(prev => !prev);
      }
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setResults([]);
      setSelected(0);
    }
  }, [open]);

  // Search as user types (debounced)
  useEffect(() => {
    if (!query || query.length < 2) { setResults([]); return; }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        // Search clients
        const clientsRes = await fetch(`/api/trpc/clients.list`).then((r) => r.json());
        const clients = parseTrpcListJson<QuickSearchClientRow>(clientsRes);

        // Search projects
        const projectsRes = await fetch(`/api/trpc/projects.list`).then((r) => r.json());
        const projects = parseTrpcListJson<QuickSearchProjectRow>(projectsRes);

        const q = query.toLowerCase();
        const matched: SearchResult[] = [];

        // Filter clients
        for (const c of clients) {
          if (c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || c.company?.toLowerCase().includes(q)) {
            matched.push({
              type: 'client',
              id: c.id,
              title: c.name || c.company || 'Client',
              subtitle: c.email || c.industry || '',
              path: `/clients/${c.id}`,
            });
          }
          if (matched.length >= 8) break;
        }

        // Filter projects
        for (const p of projects) {
          if (p.name?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q)) {
            matched.push({
              type: 'project',
              id: p.id,
              title: p.name || 'Project',
              subtitle: p.status || '',
              path: `/projects/${p.id}`,
            });
          }
          if (matched.length >= 12) break;
        }

        // Static tool results
        const tools = [
          { id: 'brand-diagnosis', title: 'Brand Diagnosis', subtitle: 'Health score + top issues' },
          { id: 'offer-check', title: 'Offer Logic Check', subtitle: 'Package & pricing analysis' },
          { id: 'message-check', title: 'Message Check', subtitle: 'Consistency audit' },
          { id: 'presence-audit', title: 'Presence Audit', subtitle: 'Digital presence check' },
          { id: 'identity-snapshot', title: 'Identity Snapshot', subtitle: 'Personality match' },
          { id: 'launch-readiness', title: 'Launch Readiness', subtitle: 'Go-to-market score' },
        ];
        for (const t of tools) {
          if (t.title.toLowerCase().includes(q)) {
            matched.push({ type: 'tool', id: t.id, title: t.title, subtitle: t.subtitle, path: `/tools/${t.id}` });
          }
        }

        setResults(matched.slice(0, 10));
        setSelected(0);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, results.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
    if (e.key === 'Enter' && results[selected]) {
      navigate(results[selected].path);
      setOpen(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-start justify-center pt-[15vh]" onClick={() => setOpen(false)}>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800">
          <span className="text-zinc-500 text-sm">🔍</span>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search clients, projects, tools..."
            className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-zinc-600"
          />
          <kbd className="text-[10px] text-zinc-600 border border-zinc-700 rounded px-1.5 py-0.5">ESC</kbd>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="max-h-64 overflow-y-auto py-2">
            {results.map((r, i) => (
              <button
                key={`${r.type}-${r.id}`}
                onClick={() => { navigate(r.path); setOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition ${
                  i === selected ? 'bg-indigo-500/10 text-white' : 'text-zinc-400 hover:bg-zinc-800/50'
                }`}
              >
                <span className="text-lg">{ICON_MAP[r.type]}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{r.title}</p>
                  <p className="text-[10px] text-zinc-600 truncate">{r.subtitle}</p>
                </div>
                <span className="ml-auto text-[10px] text-zinc-700 capitalize">{r.type}</span>
              </button>
            ))}
          </div>
        )}

        {query.length >= 2 && results.length === 0 && !loading && (
          <p className="px-4 py-6 text-center text-sm text-zinc-600">No results found</p>
        )}

        {loading && (
          <p className="px-4 py-4 text-center text-xs text-zinc-600">Searching...</p>
        )}

        {/* Hint */}
        <div className="px-4 py-2 border-t border-zinc-800 flex items-center justify-between">
          <span className="text-[10px] text-zinc-600">↑↓ Navigate · Enter to select · Esc to close</span>
          <span className="text-[10px] text-zinc-700">⌘K</span>
        </div>
      </div>
    </div>
  );
}
