"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowRight, Building2, Plus, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SATopBar from "@/components/superadmin/sa-topbar";
import { RuleFormModal, IntegrationModal, KBDocCreateModal } from "@/components/superadmin/sa-modals";
import {
  getSAWorkspace,
  updateSAWorkspace,
  getSAWorkspaceRules,
  getSAWorkspaceRevenue,
  getSAWorkspaceEscalations,
  getSAWorkspaceCODShield,
  getSAWorkspaceAPIKeys,
  getSAWorkspaceConversations,
  getSAWorkspaceCustomers,
  getSAWorkspaceKB,
  getSAWorkspaceChannels,
  triggerSASallaSync,
  triggerSAStarterPack,
  triggerSAZidSync,
  createSAWorkspaceRule,
  updateSAWorkspaceRule,
  deleteSAWorkspaceRule,
  updateSAWorkspaceChannel,
  deleteSAWorkspaceChannel,
  createSAWorkspaceKBDoc,
  deleteSAWorkspaceKBDoc,
  acceptSAEscalation,
  resolveSAEscalation,
  type WorkspaceDetail,
} from "@/lib/api";

type Tab = "overview" | "users" | "channels" | "rules" | "revenue" | "escalations" | "cod-shield" | "api-keys" | "conversations" | "customers" | "kb" | "integrations" | "settings";

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
  const [tabData, setTabData] = useState<Record<string, unknown> | null>(null);
  const [integrationLoading, setIntegrationLoading] = useState<string | null>(null);
  const [tableSearch, setTableSearch] = useState("");
  const [ruleModal, setRuleModal] = useState<"create" | { edit: { id: string; name: string; description: string; is_active: boolean; priority: number } } | null>(null);
  const [integrationModal, setIntegrationModal] = useState<"salla" | "zid" | "starter" | null>(null);
  const [kbModal, setKbModal] = useState(false);
  const [ruleSaving, setRuleSaving] = useState(false);
  const [kbSaving, setKbSaving] = useState(false);
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

  useEffect(() => {
    if (!id || !ws) return;
    setTabData(null);
    const loadTab = async () => {
      try {
        if (tab === "rules") setTabData(await getSAWorkspaceRules(id));
        else if (tab === "channels") setTabData(await getSAWorkspaceChannels(id));
        else if (tab === "revenue") setTabData(await getSAWorkspaceRevenue(id));
        else if (tab === "escalations") setTabData(await getSAWorkspaceEscalations(id));
        else if (tab === "cod-shield") setTabData(await getSAWorkspaceCODShield(id));
        else if (tab === "api-keys") setTabData(await getSAWorkspaceAPIKeys(id));
        else if (tab === "conversations") setTabData(await getSAWorkspaceConversations(id));
        else if (tab === "customers") setTabData(await getSAWorkspaceCustomers(id));
        else if (tab === "kb") setTabData(await getSAWorkspaceKB(id));
      } catch (e) {
        console.error(e);
      }
    };
    if (["rules", "revenue", "escalations", "cod-shield", "api-keys", "conversations", "customers", "kb", "channels"].includes(tab)) {
      loadTab();
    }
  }, [id, tab, ws]);

  async function reloadTab() {
    if (!id || !ws) return;
    setTabData(null);
    try {
      if (tab === "channels") {
        setTabData(await getSAWorkspaceChannels(id));
        await load();
      }
      else if (tab === "rules") setTabData(await getSAWorkspaceRules(id));
      else if (tab === "escalations") setTabData(await getSAWorkspaceEscalations(id));
      else if (tab === "kb") setTabData(await getSAWorkspaceKB(id));
      else if (tab === "revenue") setTabData(await getSAWorkspaceRevenue(id));
      else if (tab === "cod-shield") setTabData(await getSAWorkspaceCODShield(id));
      else if (tab === "api-keys") setTabData(await getSAWorkspaceAPIKeys(id));
      else if (tab === "conversations") setTabData(await getSAWorkspaceConversations(id));
      else if (tab === "customers") setTabData(await getSAWorkspaceCustomers(id));
      else await load();
    } catch (e) {
      console.error(e);
    }
  }

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
    { key: "rules", label: "القواعد" },
    { key: "kb", label: "قاعدة المعرفة" },
    { key: "revenue", label: "الإيرادات" },
    { key: "escalations", label: "التصعيدات" },
    { key: "cod-shield", label: "COD Shield" },
    { key: "api-keys", label: "مفاتيح API" },
    { key: "conversations", label: "المحادثات" },
    { key: "customers", label: "العملاء" },
    { key: "integrations", label: "التكاملات" },
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
                <CardHeader className="px-5 py-4 border-b border-slate-700 flex flex-row items-center justify-between gap-4">
                  <CardTitle className="text-sm text-slate-100">القنوات</CardTitle>
                  <div className="flex items-center gap-2 bg-slate-800 rounded-md px-2 py-1.5 flex-1 max-w-xs">
                    <Search className="h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder="بحث..."
                      value={tableSearch}
                      onChange={(e) => setTableSearch(e.target.value)}
                      className="bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none w-full"
                    />
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {!tabData ? (
                    <p className="text-center text-slate-500 text-sm py-8">جاري التحميل...</p>
                  ) : ((tabData as { channels?: Array<{ id: string; name: string; type: string; is_active: boolean; created_at: string }> }).channels?.length ?? 0) === 0 ? (
                    <p className="text-center text-slate-500 text-sm py-8">لا توجد قنوات</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-700">
                          {["الاسم", "النوع", "الحالة", "تاريخ الإنشاء", ""].map((h) => (
                            <th key={h} className="text-right px-4 py-3 text-slate-400 font-medium text-xs">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {((tabData as { channels?: Array<{ id: string; name: string; type: string; is_active: boolean; created_at: string }> }).channels ?? [])
                          .filter((c) => !tableSearch || c.name?.toLowerCase().includes(tableSearch.toLowerCase()) || c.type?.toLowerCase().includes(tableSearch.toLowerCase()))
                          .map((c) => (
                          <tr key={c.id} className="border-b border-slate-800">
                            <td className="px-4 py-3 text-slate-100">{c.name || "—"}</td>
                            <td className="px-4 py-3 text-slate-400 text-xs">{c.type}</td>
                            <td className="px-4 py-3">
                              <span className={`text-xs px-2 py-0.5 rounded ${c.is_active ? "bg-emerald-900/40 text-emerald-300" : "bg-red-900/40 text-red-300"}`}>
                                {c.is_active ? "نشط" : "موقوف"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-500 text-xs">{new Date(c.created_at).toLocaleDateString("ar-SA")}</td>
                            <td className="px-4 py-3">
                              <div className="flex gap-2 justify-end">
                                <button
                                  onClick={async () => {
                                    try {
                                      await updateSAWorkspaceChannel(id, c.id, { is_active: !c.is_active });
                                      reloadTab();
                                    } catch (e) { console.error(e); }
                                  }}
                                  className="text-xs text-slate-400 hover:text-violet-400"
                                >
                                  {c.is_active ? "إيقاف" : "تفعيل"}
                                </button>
                                <button
                                  onClick={async () => {
                                    if (confirm("حذف هذه القناة؟")) {
                                      try {
                                        await deleteSAWorkspaceChannel(id, c.id);
                                        reloadTab();
                                      } catch (e) { console.error(e); }
                                    }
                                  }}
                                  className="text-xs text-red-400 hover:text-red-300"
                                >
                                  حذف
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
            )}

            {/* Tab: Rules */}
            {tab === "rules" && (
              <Card className="bg-slate-900 border-slate-700">
                <CardHeader className="px-5 py-4 border-b border-slate-700 flex flex-row items-center justify-between gap-4">
                  <CardTitle className="text-sm text-slate-100">القواعد</CardTitle>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 bg-slate-800 rounded-md px-2 py-1.5">
                      <Search className="h-4 w-4 text-slate-500" />
                      <input
                        type="text"
                        placeholder="بحث..."
                        value={tableSearch}
                        onChange={(e) => setTableSearch(e.target.value)}
                        className="bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none w-32"
                      />
                    </div>
                    <button onClick={() => setRuleModal("create")} className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white text-sm px-3 py-1.5 rounded-md">
                      <Plus className="h-4 w-4" /> إضافة
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {!tabData ? (
                    <p className="text-center text-slate-500 text-sm py-8">جاري التحميل...</p>
                  ) : (tabData as { items?: Array<{ id: string; name: string; description: string; is_active: boolean; priority: number }> }).items?.length === 0 ? (
                    <p className="text-center text-slate-500 text-sm py-8">لا توجد قواعد. <button onClick={() => setRuleModal("create")} className="text-violet-400 hover:underline">أضف قاعدة</button></p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-700">
                          {["الاسم", "الأولوية", "الحالة", ""].map((h) => (
                            <th key={h} className="text-right px-4 py-3 text-slate-400 font-medium text-xs">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {((tabData as { items?: Array<{ id: string; name: string; description: string; is_active: boolean; priority: number }> }).items ?? [])
                          .filter((r) => !tableSearch || r.name?.toLowerCase().includes(tableSearch.toLowerCase()))
                          .map((r) => (
                          <tr key={r.id} className="border-b border-slate-800">
                            <td className="px-4 py-3 text-slate-100">{r.name}</td>
                            <td className="px-4 py-3 text-slate-400">{r.priority}</td>
                            <td className="px-4 py-3">
                              <span className={`text-xs px-2 py-0.5 rounded ${r.is_active ? "bg-emerald-900/40 text-emerald-300" : "bg-red-900/40 text-red-300"}`}>
                                {r.is_active ? "نشط" : "موقوف"}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-2 justify-end">
                                <button onClick={() => setRuleModal({ edit: { id: r.id, name: r.name, description: r.description || "", is_active: r.is_active, priority: r.priority } })} className="text-xs text-slate-400 hover:text-violet-400">تعديل</button>
                                <button onClick={async () => { if (confirm("حذف؟")) { try { await deleteSAWorkspaceRule(id, r.id); reloadTab(); } catch (e) { console.error(e); } } }} className="text-xs text-red-400 hover:text-red-300">حذف</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Tab: KB */}
            {tab === "kb" && (
              <Card className="bg-slate-900 border-slate-700">
                <CardHeader className="px-5 py-4 border-b border-slate-700 flex flex-row items-center justify-between gap-4">
                  <CardTitle className="text-sm text-slate-100">قاعدة المعرفة</CardTitle>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 bg-slate-800 rounded-md px-2 py-1.5">
                      <Search className="h-4 w-4 text-slate-500" />
                      <input type="text" placeholder="بحث..." value={tableSearch} onChange={(e) => setTableSearch(e.target.value)} className="bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none w-32" />
                    </div>
                    <button onClick={() => setKbModal(true)} className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white text-sm px-3 py-1.5 rounded-md">
                      <Plus className="h-4 w-4" /> إضافة وثيقة
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {!tabData ? (
                    <p className="text-center text-slate-500 text-sm py-8">جاري التحميل...</p>
                  ) : (tabData as { items?: unknown[] }).items?.length === 0 ? (
                    <p className="text-center text-slate-500 text-sm py-8">لا توجد وثائق. <button onClick={() => setKbModal(true)} className="text-violet-400 hover:underline">أضف وثيقة</button></p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-700">
                          {["العنوان", "النوع", "الحالة", ""].map((h) => (
                            <th key={h} className="text-right px-4 py-3 text-slate-400 font-medium text-xs">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {((tabData as { items?: Array<{ id: string; title: string; content_type: string; status: string }> }).items ?? [])
                          .filter((d) => !tableSearch || d.title?.toLowerCase().includes(tableSearch.toLowerCase()))
                          .map((d) => (
                          <tr key={d.id} className="border-b border-slate-800">
                            <td className="px-4 py-3 text-slate-100">{d.title}</td>
                            <td className="px-4 py-3 text-slate-400 text-xs">{d.content_type}</td>
                            <td className="px-4 py-3 text-slate-400 text-xs">{d.status}</td>
                            <td className="px-4 py-3">
                              <button onClick={async () => { if (confirm("حذف هذه الوثيقة؟")) { try { await deleteSAWorkspaceKBDoc(id, d.id); reloadTab(); } catch (e) { console.error(e); } } }} className="text-xs text-red-400 hover:text-red-300">حذف</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Tab: Revenue */}
            {tab === "revenue" && (
              <Card className="bg-slate-900 border-slate-700">
                <CardContent className="p-5">
                  {!tabData ? (
                    <p className="text-center text-slate-500 text-sm py-8">جاري التحميل...</p>
                  ) : (
                    <>
                      <p className="text-2xl font-bold text-emerald-400">
                        {(tabData as { total_attributed_sar?: number }).total_attributed_sar?.toLocaleString("ar-SA") ?? 0} ر.س
                      </p>
                      <p className="text-xs text-slate-400 mt-1">إجمالي الإيرادات المنسوبة (آخر 30 يوم)</p>
                      <p className="text-sm text-slate-500 mt-2">{(tabData as { events_count?: number }).events_count ?? 0} حدث</p>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Tab: Escalations */}
            {tab === "escalations" && (
              <Card className="bg-slate-900 border-slate-700">
                <CardHeader className="px-5 py-4 border-b border-slate-700 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm text-slate-100">التصعيدات</CardTitle>
                  <div className="flex items-center gap-2 bg-slate-800 rounded-md px-2 py-1.5">
                    <Search className="h-4 w-4 text-slate-500" />
                    <input type="text" placeholder="بحث بالسبب..." value={tableSearch} onChange={(e) => setTableSearch(e.target.value)} className="bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none w-32" />
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {!tabData ? (
                    <p className="text-center text-slate-500 text-sm py-8">جاري التحميل...</p>
                  ) : (tabData as { items?: unknown[] }).items?.length === 0 ? (
                    <p className="text-center text-slate-500 text-sm py-8">لا توجد تصعيدات</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-700">
                          {["المحادثة", "السبب", "الحالة", "التاريخ", ""].map((h) => (
                            <th key={h} className="text-right px-4 py-3 text-slate-400 font-medium text-xs">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {((tabData as { items?: Array<{ id: string; conversation_id: string; reason: string; status: string; created_at: string }> }).items ?? [])
                          .filter((e) => !tableSearch || (e.reason || "").toLowerCase().includes(tableSearch.toLowerCase()))
                          .map((e) => (
                          <tr key={e.id} className="border-b border-slate-800">
                            <td className="px-4 py-3 text-slate-400 text-xs">{e.conversation_id?.slice(0, 8)}...</td>
                            <td className="px-4 py-3 text-slate-100">{e.reason || "—"}</td>
                            <td className="px-4 py-3 text-amber-400 text-xs">{e.status}</td>
                            <td className="px-4 py-3 text-slate-500 text-xs">{new Date(e.created_at).toLocaleDateString("ar-SA")}</td>
                            <td className="px-4 py-3">
                              {(e.status === "pending" || e.status === "accepted") && (
                                <div className="flex gap-2 justify-end">
                                  {e.status === "pending" && (
                                    <button onClick={async () => { try { await acceptSAEscalation(id, e.id); reloadTab(); } catch (err) { console.error(err); } }} className="text-xs text-emerald-400 hover:text-emerald-300">قبول</button>
                                  )}
                                  <button onClick={async () => { try { await resolveSAEscalation(id, e.id); reloadTab(); } catch (err) { console.error(err); } }} className="text-xs text-violet-400 hover:text-violet-300">حل</button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Tab: COD Shield */}
            {tab === "cod-shield" && (
              <Card className="bg-slate-900 border-slate-700">
                <CardContent className="p-5">
                  {!tabData ? (
                    <p className="text-center text-slate-500 text-sm py-8">جاري التحميل...</p>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        {Object.entries((tabData as { stats?: Record<string, number> }).stats ?? {}).map(([k, v]) => (
                          <div key={k} className="bg-slate-800 rounded p-3">
                            <p className="text-xs text-slate-400">{k}</p>
                            <p className="text-lg font-bold text-white">{v}</p>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-slate-500">آخر 7 أيام</p>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Tab: API Keys */}
            {tab === "api-keys" && (
              <Card className="bg-slate-900 border-slate-700">
                <CardContent className="p-0">
                  {!tabData ? (
                    <p className="text-center text-slate-500 text-sm py-8">جاري التحميل...</p>
                  ) : (tabData as { keys?: unknown[] }).keys?.length === 0 ? (
                    <p className="text-center text-slate-500 text-sm py-8">لا توجد مفاتيح</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-700">
                          {["الاسم", "البادئة", "الصلاحيات"].map((h) => (
                            <th key={h} className="text-right px-4 py-3 text-slate-400 font-medium text-xs">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {((tabData as { keys?: Array<{ name: string; key_prefix: string; scopes: string[] }> }).keys ?? []).map((k, i) => (
                          <tr key={i} className="border-b border-slate-800">
                            <td className="px-4 py-3 text-slate-100">{k.name}</td>
                            <td className="px-4 py-3 text-slate-400 font-mono text-xs">{k.key_prefix}...</td>
                            <td className="px-4 py-3 text-slate-500 text-xs">{(k.scopes ?? []).join(", ")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Tab: Conversations */}
            {tab === "conversations" && (
              <Card className="bg-slate-900 border-slate-700">
                <CardHeader className="px-5 py-4 border-b border-slate-700 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm text-slate-100">المحادثات</CardTitle>
                  <div className="flex items-center gap-2 bg-slate-800 rounded-md px-2 py-1.5">
                    <Search className="h-4 w-4 text-slate-500" />
                    <input type="text" placeholder="بحث بالنية..." value={tableSearch} onChange={(e) => setTableSearch(e.target.value)} className="bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none w-32" />
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {!tabData ? (
                    <p className="text-center text-slate-500 text-sm py-8">جاري التحميل...</p>
                  ) : (tabData as { items?: unknown[] }).items?.length === 0 ? (
                    <p className="text-center text-slate-500 text-sm py-8">لا توجد محادثات</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-700">
                          {["النية", "الحالة", "نوع الحل", "آخر رسالة"].map((h) => (
                            <th key={h} className="text-right px-4 py-3 text-slate-400 font-medium text-xs">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {((tabData as { items?: Array<{ intent: string; status: string; resolution_type: string; last_message_at: string }> }).items ?? [])
                          .filter((c) => !tableSearch || (c.intent || "").toLowerCase().includes(tableSearch.toLowerCase()))
                          .map((c, i) => (
                          <tr key={i} className="border-b border-slate-800">
                            <td className="px-4 py-3 text-slate-100">{c.intent || "—"}</td>
                            <td className="px-4 py-3 text-slate-400 text-xs">{c.status}</td>
                            <td className="px-4 py-3 text-slate-400 text-xs">{c.resolution_type || "—"}</td>
                            <td className="px-4 py-3 text-slate-500 text-xs">{c.last_message_at ? new Date(c.last_message_at).toLocaleDateString("ar-SA") : "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Tab: Customers */}
            {tab === "customers" && (
              <Card className="bg-slate-900 border-slate-700">
                <CardHeader className="px-5 py-4 border-b border-slate-700 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm text-slate-100">العملاء</CardTitle>
                  <div className="flex items-center gap-2 bg-slate-800 rounded-md px-2 py-1.5">
                    <Search className="h-4 w-4 text-slate-500" />
                    <input type="text" placeholder="بحث بالمستوى..." value={tableSearch} onChange={(e) => setTableSearch(e.target.value)} className="bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none w-32" />
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {!tabData ? (
                    <p className="text-center text-slate-500 text-sm py-8">جاري التحميل...</p>
                  ) : (tabData as { items?: unknown[] }).items?.length === 0 ? (
                    <p className="text-center text-slate-500 text-sm py-8">لا يوجد عملاء</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-700">
                          {["المستوى", "المحادثات", "التصعيدات", "طلبات سلة", "آخر ظهور"].map((h) => (
                            <th key={h} className="text-right px-4 py-3 text-slate-400 font-medium text-xs">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {((tabData as { items?: Array<{ customer_tier: string; total_conversations: number; total_escalations: number; salla_total_orders: number; last_seen_at: string }> }).items ?? [])
                          .filter((c) => !tableSearch || (c.customer_tier || "").toLowerCase().includes(tableSearch.toLowerCase()))
                          .map((c, i) => (
                          <tr key={i} className="border-b border-slate-800">
                            <td className="px-4 py-3 text-slate-100">{c.customer_tier}</td>
                            <td className="px-4 py-3 text-slate-400">{c.total_conversations}</td>
                            <td className="px-4 py-3 text-slate-400">{c.total_escalations}</td>
                            <td className="px-4 py-3 text-slate-400">{c.salla_total_orders ?? 0}</td>
                            <td className="px-4 py-3 text-slate-500 text-xs">{c.last_seen_at ? new Date(c.last_seen_at).toLocaleDateString("ar-SA") : "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Tab: Integrations */}
            {tab === "integrations" && (
              <Card className="bg-slate-900 border-slate-700">
                <CardHeader className="px-5 py-4 border-b border-slate-700">
                  <CardTitle className="text-sm text-slate-100">التكاملات — Salla, Zid, Starter Pack</CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  <p className="text-xs text-slate-500">تشغيل مزامنة أو تطبيق حزمة أولية على هذا المتجر. التوكنات تُدخل عبر نموذج آمن ولا تُخزّن.</p>
                  <div className="flex flex-wrap gap-3">
                    <button onClick={() => setIntegrationModal("salla")} disabled={!!integrationLoading} className="bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm px-4 py-2 rounded-md disabled:opacity-50">
                      مزامنة Salla
                    </button>
                    <button onClick={() => setIntegrationModal("starter")} disabled={!!integrationLoading} className="bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm px-4 py-2 rounded-md disabled:opacity-50">
                      Starter Pack
                    </button>
                    <button onClick={() => setIntegrationModal("zid")} disabled={!!integrationLoading} className="bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm px-4 py-2 rounded-md disabled:opacity-50">
                      مزامنة Zid
                    </button>
                  </div>
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

      {/* Modals */}
      {ruleModal && (
        <RuleFormModal
          onClose={() => setRuleModal(null)}
          loading={ruleSaving}
          onSubmit={async (data) => {
            setRuleSaving(true);
            try {
              if (ruleModal === "create") {
                await createSAWorkspaceRule(id, { ...data, triggers: [], actions: [] });
              } else {
                await updateSAWorkspaceRule(id, ruleModal.edit.id, data);
              }
              setRuleModal(null);
              reloadTab();
            } catch (e) {
              console.error(e);
            } finally {
              setRuleSaving(false);
            }
          }}
          initial={ruleModal !== "create" && "edit" in ruleModal ? ruleModal.edit : undefined}
        />
      )}
      {integrationModal && (
        <IntegrationModal
          type={integrationModal}
          onClose={() => setIntegrationModal(null)}
          loading={!!integrationLoading}
          onSubmit={async (data) => {
            setIntegrationLoading(integrationModal);
            try {
              if (integrationModal === "salla") await triggerSASallaSync(id, { salla_token: data.salla_token! });
              else if (integrationModal === "zid") await triggerSAZidSync(id, { zid_token: data.zid_token!, store_id: data.store_id });
              else if (integrationModal === "starter") await triggerSAStarterPack(id, data.sector!);
              setIntegrationModal(null);
            } catch (e) {
              console.error(e);
            } finally {
              setIntegrationLoading(null);
            }
          }}
        />
      )}
      {kbModal && (
        <KBDocCreateModal
          onClose={() => setKbModal(false)}
          loading={kbSaving}
          onSubmit={async (data) => {
            setKbSaving(true);
            try {
              await createSAWorkspaceKBDoc(id, data);
              setKbModal(false);
              reloadTab();
            } catch (e) {
              console.error(e);
            } finally {
              setKbSaving(false);
            }
          }}
        />
      )}
    </div>
  );
}
