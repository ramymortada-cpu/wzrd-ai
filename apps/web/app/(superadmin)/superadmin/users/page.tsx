"use client";

import { useEffect, useState } from "react";
import { Users, Search, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import SATopBar from "@/components/superadmin/sa-topbar";
import {
  getSAUsers,
  suspendSAUser,
  activateSAUser,
  resetSAUserPassword,
  promoteSASuperadmin,
  type PlatformUser,
} from "@/lib/api";

const ROLE_LABELS: Record<string, string> = {
  owner: "مالك",
  admin: "مدير",
  agent: "وكيل",
  reviewer: "مراقب",
};

function roleBadge(role: string) {
  const m: Record<string, string> = {
    owner: "bg-violet-900/50 text-violet-300",
    admin: "bg-blue-900/50 text-blue-300",
    agent: "bg-sky-900/50 text-sky-300",
    reviewer: "bg-slate-700 text-slate-300",
  };
  return m[role] || m.reviewer;
}

type ResetModalProps = {
  user: PlatformUser;
  onClose: () => void;
};

function ResetPasswordModal({ user, onClose }: ResetModalProps) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) { setError("8 أحرف على الأقل"); return; }
    setLoading(true);
    try {
      await resetSAUserPassword(user.id, password);
      setDone(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" dir="rtl">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-sm p-6 space-y-4">
        <h2 className="text-base font-semibold text-white">إعادة تعيين كلمة المرور</h2>
        <p className="text-sm text-slate-400">{user.name} — {user.email}</p>
        {done ? (
          <div className="space-y-3">
            <p className="text-sm text-emerald-400">تم إعادة تعيين كلمة المرور بنجاح ✓</p>
            <button onClick={onClose} className="w-full bg-slate-700 text-slate-200 text-sm py-2 rounded-md">إغلاق</button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <input
              type="password"
              placeholder="كلمة المرور الجديدة"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
            />
            {error && <p className="text-xs text-red-400">{error}</p>}
            <div className="flex gap-2">
              <button type="submit" disabled={loading} className="flex-1 bg-violet-600 hover:bg-violet-700 text-white text-sm py-2 rounded-md disabled:opacity-50">
                {loading ? "..." : "حفظ"}
              </button>
              <button type="button" onClick={onClose} className="flex-1 bg-slate-700 text-slate-200 text-sm py-2 rounded-md">
                إلغاء
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function SAUsersPage() {
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "true" | "false">("");
  const [loading, setLoading] = useState(true);
  const [resetTarget, setResetTarget] = useState<PlatformUser | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await getSAUsers({
        page,
        role: roleFilter || undefined,
        is_active: statusFilter === "" ? undefined : statusFilter === "true",
      });
      setUsers(data.items);
      setTotal(data.total);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [page, roleFilter, statusFilter]);

  async function toggleStatus(user: PlatformUser) {
    if (user.is_active) await suspendSAUser(user.id);
    else await activateSAUser(user.id);
    load();
  }

  async function promote(user: PlatformUser) {
    try {
      await promoteSASuperadmin(user.id);
      load();
    } catch (e) {
      console.error(e);
    }
  }

  const filtered = search
    ? users.filter(
        (u) =>
          u.name.includes(search) ||
          u.email.includes(search) ||
          u.workspace_name.includes(search)
      )
    : users;

  const totalPages = Math.ceil(total / 50);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <SATopBar title="المستخدمون" subtitle={`${total} مستخدم عبر جميع المتاجر`} />

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-md px-3 py-2 flex-1 min-w-48">
            <Search className="h-4 w-4 text-slate-500 shrink-0" />
            <input
              type="text"
              placeholder="بحث بالاسم أو البريد أو المتجر..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none w-full"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            className="bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100 focus:outline-none"
          >
            <option value="">جميع الأدوار</option>
            <option value="owner">مالك</option>
            <option value="admin">مدير</option>
            <option value="agent">وكيل</option>
            <option value="reviewer">مراقب</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as "" | "true" | "false"); setPage(1); }}
            className="bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100 focus:outline-none"
          >
            <option value="">جميع الحالات</option>
            <option value="true">نشط</option>
            <option value="false">موقوف</option>
          </select>
        </div>

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
                <Users className="h-10 w-10 mb-3 opacity-30" />
                <p className="text-sm">لا توجد نتائج</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    {["الاسم", "المتجر", "الدور", "الحالة", "آخر دخول", ""].map((h) => (
                      <th key={h} className="text-right px-4 py-3 text-slate-400 font-medium text-xs">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => (
                    <tr key={u.id} className="border-b border-slate-800 hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div>
                            <p className="font-medium text-slate-100 flex items-center gap-1">
                              {u.name}
                              {u.is_superadmin && (
                                <ShieldCheck className="h-3.5 w-3.5 text-violet-400" />
                              )}
                            </p>
                            <p className="text-xs text-slate-500">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-slate-300">{u.workspace_name}</p>
                        <p className="text-xs text-slate-500">{u.workspace_slug}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${roleBadge(u.role)}`}>
                          {ROLE_LABELS[u.role] || u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded ${u.is_active ? "bg-emerald-900/40 text-emerald-300" : "bg-red-900/40 text-red-300"}`}>
                          {u.is_active ? "نشط" : "موقوف"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">
                        {u.last_login_at ? new Date(u.last_login_at).toLocaleDateString("ar-SA") : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 justify-end">
                          {!u.is_superadmin && (
                            <button
                              onClick={() => promote(u)}
                              className="text-xs text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1"
                            >
                              <ShieldCheck className="h-3 w-3" />
                              ترقية لـ superadmin
                            </button>
                          )}
                          <button
                            onClick={() => setResetTarget(u)}
                            className="text-xs text-slate-400 hover:text-violet-400 transition-colors"
                          >
                            تغيير الباسورد
                          </button>
                          <button
                            onClick={() => toggleStatus(u)}
                            className={`text-xs transition-colors ${u.is_active ? "text-amber-400 hover:text-amber-300" : "text-emerald-400 hover:text-emerald-300"}`}
                          >
                            {u.is_active ? "إيقاف" : "تفعيل"}
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

      {resetTarget && (
        <ResetPasswordModal
          user={resetTarget}
          onClose={() => { setResetTarget(null); load(); }}
        />
      )}
    </div>
  );
}
