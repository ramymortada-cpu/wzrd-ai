"use client";

import { useEffect, useState } from "react";
import { ClipboardList, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import SATopBar from "@/components/superadmin/sa-topbar";
import { getSAAuditLog, getSAWorkspaces, type PlatformAuditEntry } from "@/lib/api";

export default function SAAuditLogPage() {
  const [entries, setEntries] = useState<PlatformAuditEntry[]>([]);
  const [workspaces, setWorkspaces] = useState<{ id: string; name: string }[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState("");
  const [wsFilter, setWsFilter] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSAWorkspaces(1, undefined).then((d) => {
      setWorkspaces(d.items.map((w) => ({ id: w.id, name: w.name })));
    }).catch(console.error);
  }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await getSAAuditLog({
        page,
        workspace_id: wsFilter || undefined,
        action: actionFilter || undefined,
      });
      setEntries(data.items);
      setTotal(data.total);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [page, actionFilter, wsFilter]);

  const totalPages = Math.ceil(total / 50);

  function actionColor(action: string) {
    if (action.includes("delete") || action.includes("suspend")) return "text-red-400";
    if (action.includes("create") || action.includes("approve")) return "text-emerald-400";
    if (action.includes("update") || action.includes("patch")) return "text-amber-400";
    return "text-slate-400";
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <SATopBar title="سجل العمليات" subtitle={`${total.toLocaleString("ar-SA")} عملية مسجّلة`} />

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-md px-3 py-2 flex-1 min-w-48">
            <Search className="h-4 w-4 text-slate-500 shrink-0" />
            <input
              type="text"
              placeholder="فلترة بالعملية..."
              value={actionFilter}
              onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
              className="bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none w-full"
            />
          </div>
          <select
            value={wsFilter}
            onChange={(e) => { setWsFilter(e.target.value); setPage(1); }}
            className="bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100 focus:outline-none"
          >
            <option value="">جميع المتاجر</option>
            {workspaces.map((ws) => (
              <option key={ws.id} value={ws.id}>{ws.name}</option>
            ))}
          </select>
        </div>

        <Card className="bg-slate-900 border-slate-700">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-5 space-y-3">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="h-10 rounded bg-slate-800 animate-pulse" />
                ))}
              </div>
            ) : entries.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-slate-500">
                <ClipboardList className="h-10 w-10 mb-3 opacity-30" />
                <p className="text-sm">لا توجد نتائج</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    {["المتجر", "المستخدم", "العملية", "النوع", "IP", "الوقت"].map((h) => (
                      <th key={h} className="text-right px-4 py-3 text-slate-400 font-medium text-xs">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e) => (
                    <tr key={e.id} className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-slate-300 text-xs">{e.workspace_name}</p>
                      </td>
                      <td className="px-4 py-3">
                        {e.user_email ? (
                          <div>
                            <p className="text-slate-300 text-xs">{e.user_name}</p>
                            <p className="text-slate-500 text-xs">{e.user_email}</p>
                          </div>
                        ) : (
                          <span className="text-slate-600 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-mono text-xs ${actionColor(e.action)}`}>
                          {e.action}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {e.entity_type && (
                          <span className="text-xs bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded">
                            {e.entity_type}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs font-mono">
                        {e.ip_address || "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">
                        {new Date(e.created_at).toLocaleString("ar-SA")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 text-slate-300 rounded-md disabled:opacity-40 hover:bg-slate-700 transition-colors">
              السابق
            </button>
            <span className="text-xs text-slate-400">{page} / {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 text-slate-300 rounded-md disabled:opacity-40 hover:bg-slate-700 transition-colors">
              التالي
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
