"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import SATopBar from "@/components/superadmin/sa-topbar";
import {
  getSAWorkspaces,
  createSAWorkspace,
  updateSAWorkspace,
  type WorkspaceSummary,
} from "@/lib/api";

const PLAN_LABELS: Record<string, string> = { pilot: "تجريبي", growth: "نمو", scale: "توسع" };
const STATUS_LABELS: Record<string, string> = { active: "نشط", suspended: "موقوف", cancelled: "ملغي" };

function planBadge(plan: string) {
  const m: Record<string, string> = {
    pilot: "bg-slate-700 text-slate-300",
    growth: "bg-blue-900/50 text-blue-300",
    scale: "bg-violet-900/50 text-violet-300",
  };
  return m[plan] || m.pilot;
}

function statusBadge(status: string) {
  const m: Record<string, string> = {
    active: "bg-emerald-900/50 text-emerald-300",
    suspended: "bg-amber-900/50 text-amber-300",
    cancelled: "bg-red-900/50 text-red-300",
  };
  return m[status] || m.active;
}

type CreateModalProps = {
  onClose: () => void;
  onCreated: () => void;
};

function CreateModal({ onClose, onCreated }: CreateModalProps) {
  const [form, setForm] = useState({
    name: "",
    slug: "",
    plan: "pilot",
    owner_name: "",
    owner_email: "",
    owner_password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await createSAWorkspace(form);
      onCreated();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" dir="rtl">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">إنشاء متجر جديد</h2>
        <form onSubmit={submit} className="space-y-3">
          {[
            { key: "name", label: "اسم المتجر", type: "text" },
            { key: "slug", label: "المعرّف (slug)", type: "text" },
            { key: "owner_name", label: "اسم المالك", type: "text" },
            { key: "owner_email", label: "البريد الإلكتروني للمالك", type: "email" },
            { key: "owner_password", label: "كلمة المرور", type: "password" },
          ].map(({ key, label, type }) => (
            <div key={key}>
              <label className="block text-xs text-slate-400 mb-1">{label}</label>
              <input
                type={type}
                required
                value={form[key as keyof typeof form]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-600 rounded-md px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
              />
            </div>
          ))}
          <div>
            <label className="block text-xs text-slate-400 mb-1">الخطة</label>
            <select
              value={form.plan}
              onChange={(e) => setForm((f) => ({ ...f, plan: e.target.value }))}
              className="w-full bg-slate-800 border border-slate-600 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
            >
              <option value="pilot">تجريبي</option>
              <option value="growth">نمو</option>
              <option value="scale">توسع</option>
            </select>
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium py-2 rounded-md transition-colors disabled:opacity-50"
            >
              {loading ? "جاري الإنشاء..." : "إنشاء"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm py-2 rounded-md transition-colors"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SAWorkspacesPage() {
  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await getSAWorkspaces(page, statusFilter || undefined);
      setWorkspaces(data.items);
      setTotal(data.total);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [page, statusFilter]);

  async function toggleStatus(ws: WorkspaceSummary) {
    const newStatus = ws.status === "active" ? "suspended" : "active";
    await updateSAWorkspace(ws.id, { status: newStatus });
    load();
  }

  const filtered = search
    ? workspaces.filter(
        (w) =>
          w.name.includes(search) ||
          w.slug.includes(search)
      )
    : workspaces;

  const totalPages = Math.ceil(total / 50);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <SATopBar title="المتاجر" subtitle={`${total} متجر مسجّل`} />

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-md px-3 py-2 flex-1 min-w-48">
            <Search className="h-4 w-4 text-slate-500 shrink-0" />
            <input
              type="text"
              placeholder="بحث باسم المتجر أو slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none w-full"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100 focus:outline-none"
          >
            <option value="">جميع الحالات</option>
            <option value="active">نشط</option>
            <option value="suspended">موقوف</option>
          </select>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
          >
            <Plus className="h-4 w-4" />
            متجر جديد
          </button>
        </div>

        {/* Table */}
        <Card className="bg-slate-900 border-slate-700">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-5 space-y-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-12 rounded bg-slate-800 animate-pulse" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-slate-500">
                <Building2 className="h-10 w-10 mb-3 opacity-30" />
                <p className="text-sm">لا توجد متاجر</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    {["المتجر", "الخطة", "الحالة", "المستخدمون", "الرسائل اليوم", "تاريخ الإنشاء", ""].map((h) => (
                      <th key={h} className="text-right px-4 py-3 text-slate-400 font-medium text-xs">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((ws) => (
                    <tr
                      key={ws.id}
                      className="border-b border-slate-800 hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-slate-100">{ws.name}</p>
                          <p className="text-xs text-slate-500">{ws.slug}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${planBadge(ws.plan)}`}>
                          {PLAN_LABELS[ws.plan] || ws.plan}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${statusBadge(ws.status)}`}>
                          {STATUS_LABELS[ws.status] || ws.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-300">{ws.user_count}</td>
                      <td className="px-4 py-3 text-slate-300 font-medium">
                        {ws.message_count_today.toLocaleString("ar-SA")}
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs">
                        {new Date(ws.created_at).toLocaleDateString("ar-SA")}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 justify-end">
                          <Link
                            href={`/superadmin/workspaces/${ws.id}`}
                            className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
                          >
                            تفاصيل
                          </Link>
                          <button
                            onClick={() => toggleStatus(ws)}
                            className={`text-xs transition-colors ${
                              ws.status === "active"
                                ? "text-amber-400 hover:text-amber-300"
                                : "text-emerald-400 hover:text-emerald-300"
                            }`}
                          >
                            {ws.status === "active" ? "إيقاف" : "تفعيل"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 text-slate-300 rounded-md disabled:opacity-40 hover:bg-slate-700 transition-colors"
            >
              السابق
            </button>
            <span className="text-xs text-slate-400">{page} / {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 text-slate-300 rounded-md disabled:opacity-40 hover:bg-slate-700 transition-colors"
            >
              التالي
            </button>
          </div>
        )}
      </div>

      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); load(); }}
        />
      )}
    </div>
  );
}
