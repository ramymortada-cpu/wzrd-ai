"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowRight, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SATopBar from "@/components/superadmin/sa-topbar";
import {
  getSAWorkspace,
  updateSAWorkspace,
  type WorkspaceDetail,
} from "@/lib/api";

type Tab = "overview" | "users" | "channels" | "settings";

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
  };
  return m[status] || m.active;
}

const ROLE_LABELS: Record<string, string> = {
  owner: "مالك",
  admin: "مدير",
  agent: "وكيل",
  reviewer: "مراقب",
};

export default function WorkspaceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [ws, setWs] = useState<WorkspaceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("overview");
  const [saving, setSaving] = useState(false);
  const [settingsForm, setSettingsForm] = useState({
    name: "",
    plan: "pilot",
    status: "active",
    confidence_auto_threshold: 0.85,
    confidence_soft_escalation_threshold: 0.6,
    store_name: "",
  });

  async function load() {
    setLoading(true);
    try {
      const data = await getSAWorkspace(id);
      setWs(data);
      setSettingsForm({
        name: data.name,
        plan: data.plan,
        status: data.status,
        confidence_auto_threshold:
          (data.settings.confidence_auto_threshold as number) ?? 0.85,
        confidence_soft_escalation_threshold:
          (data.settings.confidence_soft_escalation_threshold as number) ?? 0.6,
        store_name: (data.settings.store_name as string) ?? "",
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  async function saveSettings() {
    setSaving(true);
    try {
      await updateSAWorkspace(id, {
        name: settingsForm.name,
        plan: settingsForm.plan,
        status: settingsForm.status,
        settings: {
          confidence_auto_threshold: settingsForm.confidence_auto_threshold,
          confidence_soft_escalation_threshold:
            settingsForm.confidence_soft_escalation_threshold,
          store_name: settingsForm.store_name,
        },
      });
      await load();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: "overview", label: "نظرة عامة" },
    { key: "users", label: "المستخدمون" },
    { key: "channels", label: "القنوات" },
    { key: "settings", label: "الإعدادات" },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <SATopBar
        title={ws?.name || "تفاصيل المتجر"}
        subtitle={ws?.slug}
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {/* Back */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-100 transition-colors"
        >
          <ArrowRight className="h-4 w-4" />
          العودة للقائمة
        </button>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 rounded-lg bg-slate-800 animate-pulse" />
            ))}
          </div>
        ) : !ws ? (
          <p className="text-slate-400 text-sm">لم يتم العثور على المتجر</p>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-600/20">
                <Building2 className="h-5 w-5 text-violet-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">{ws.name}</h2>
                <p className="text-xs text-slate-400">{ws.slug}</p>
              </div>
              <div className="flex items-center gap-2 ms-auto">
                <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${planBadge(ws.plan)}`}>
                  {ws.plan}
                </span>
                <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${statusBadge(ws.status)}`}>
                  {ws.status === "active" ? "نشط" : "موقوف"}
                </span>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-slate-700">
              {TABS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                    tab === key
                      ? "border-violet-500 text-violet-400"
                      : "border-transparent text-slate-400 hover:text-slate-100"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Tab: Overview */}
            {tab === "overview" && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "إجمالي الرسائل", value: ws.message_count_total.toLocaleString("ar-SA") },
                  { label: "المحادثات", value: ws.conversation_count.toLocaleString("ar-SA") },
                  { label: "وثائق KB", value: ws.kb_document_count },
                  { label: "تصعيدات معلقة", value: ws.pending_escalations },
                  { label: "المستخدمون", value: ws.user_count },
                  { label: "القنوات", value: ws.channel_count },
                  { label: "تاريخ الإنشاء", value: new Date(ws.created_at).toLocaleDateString("ar-SA") },
                  { label: "آخر تحديث", value: new Date(ws.updated_at).toLocaleDateString("ar-SA") },
                ].map(({ label, value }) => (
                  <Card key={label} className="bg-slate-900 border-slate-700">
                    <CardContent className="p-4">
                      <p className="text-xs text-slate-400">{label}</p>
                      <p className="text-xl font-bold text-white mt-1">{value}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Tab: Users */}
            {tab === "users" && (
              <Card className="bg-slate-900 border-slate-700">
                <CardContent className="p-0">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-700">
                        {["الاسم", "البريد", "الدور", "الحالة", "آخر دخول"].map((h) => (
                          <th key={h} className="text-right px-4 py-3 text-slate-400 font-medium text-xs">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {ws.users.map((u) => (
                        <tr key={u.id} className="border-b border-slate-800">
                          <td className="px-4 py-3 text-slate-100">{u.name}</td>
                          <td className="px-4 py-3 text-slate-400 text-xs">{u.email}</td>
                          <td className="px-4 py-3">
                            <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded">
                              {ROLE_LABELS[u.role] || u.role}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded ${u.is_active ? "bg-emerald-900/40 text-emerald-300" : "bg-red-900/40 text-red-300"}`}>
                              {u.is_active ? "نشط" : "موقوف"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-500 text-xs">
                            {u.last_login_at
                              ? new Date(u.last_login_at).toLocaleDateString("ar-SA")
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            )}

            {/* Tab: Channels */}
            {tab === "channels" && (
              <Card className="bg-slate-900 border-slate-700">
                <CardContent className="p-0">
                  {ws.channels.length === 0 ? (
                    <p className="text-center text-slate-500 text-sm py-8">لا توجد قنوات</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-700">
                          {["الاسم", "النوع", "الحالة", "تاريخ الإنشاء"].map((h) => (
                            <th key={h} className="text-right px-4 py-3 text-slate-400 font-medium text-xs">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {ws.channels.map((c) => (
                          <tr key={c.id} className="border-b border-slate-800">
                            <td className="px-4 py-3 text-slate-100">{c.name || "—"}</td>
                            <td className="px-4 py-3 text-slate-400 text-xs">{c.type}</td>
                            <td className="px-4 py-3">
                              <span className={`text-xs px-2 py-0.5 rounded ${c.is_active ? "bg-emerald-900/40 text-emerald-300" : "bg-red-900/40 text-red-300"}`}>
                                {c.is_active ? "نشط" : "موقوف"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-500 text-xs">
                              {new Date(c.created_at).toLocaleDateString("ar-SA")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Tab: Settings */}
            {tab === "settings" && (
              <Card className="bg-slate-900 border-slate-700">
                <CardHeader className="px-5 py-4 border-b border-slate-700">
                  <CardTitle className="text-sm text-slate-100">إعدادات المتجر</CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  {[
                    { key: "name", label: "اسم المتجر", type: "text" },
                    { key: "store_name", label: "اسم المتجر في الردود", type: "text" },
                  ].map(({ key, label, type }) => (
                    <div key={key}>
                      <label className="block text-xs text-slate-400 mb-1">{label}</label>
                      <input
                        type={type}
                        value={settingsForm[key as keyof typeof settingsForm] as string}
                        onChange={(e) => setSettingsForm((f) => ({ ...f, [key]: e.target.value }))}
                        className="w-full bg-slate-800 border border-slate-600 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
                      />
                    </div>
                  ))}

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">الخطة</label>
                    <select
                      value={settingsForm.plan}
                      onChange={(e) => setSettingsForm((f) => ({ ...f, plan: e.target.value }))}
                      className="w-full bg-slate-800 border border-slate-600 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
                    >
                      <option value="pilot">تجريبي</option>
                      <option value="growth">نمو</option>
                      <option value="scale">توسع</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">الحالة</label>
                    <select
                      value={settingsForm.status}
                      onChange={(e) => setSettingsForm((f) => ({ ...f, status: e.target.value }))}
                      className="w-full bg-slate-800 border border-slate-600 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
                    >
                      <option value="active">نشط</option>
                      <option value="suspended">موقوف</option>
                      <option value="cancelled">ملغي</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">
                      حد الأتمتة التلقائية ({settingsForm.confidence_auto_threshold})
                    </label>
                    <input
                      type="range" min={0.5} max={1} step={0.05}
                      value={settingsForm.confidence_auto_threshold}
                      onChange={(e) => setSettingsForm((f) => ({ ...f, confidence_auto_threshold: parseFloat(e.target.value) }))}
                      className="w-full accent-violet-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">
                      حد التصعيد الناعم ({settingsForm.confidence_soft_escalation_threshold})
                    </label>
                    <input
                      type="range" min={0.3} max={0.9} step={0.05}
                      value={settingsForm.confidence_soft_escalation_threshold}
                      onChange={(e) => setSettingsForm((f) => ({ ...f, confidence_soft_escalation_threshold: parseFloat(e.target.value) }))}
                      className="w-full accent-violet-500"
                    />
                  </div>

                  <button
                    onClick={saveSettings}
                    disabled={saving}
                    className="bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-5 py-2.5 rounded-md transition-colors disabled:opacity-50"
                  >
                    {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
                  </button>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
