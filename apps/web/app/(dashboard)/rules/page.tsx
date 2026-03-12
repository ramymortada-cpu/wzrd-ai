"use client";

import { useEffect, useState } from "react";
import {
  Sliders,
  Plus,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from "lucide-react";
import TopBar from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getSmartRules,
  createSmartRule,
  updateSmartRule,
  deleteSmartRule,
  type SmartRule,
} from "@/lib/api";

const TRIGGER_LABELS: Record<string, string> = {
  intent: "نية العميل",
  customer_tier: "شريحة العميل",
  time_range: "نطاق زمني",
  stage: "مرحلة المحادثة",
  sentiment: "مزاج العميل",
  keyword: "كلمة مفتاحية",
};

const ACTION_LABELS: Record<string, string> = {
  escalate_owner: "تصعيد للتاجر",
  escalate_team: "تصعيد للفريق",
  use_persona: "استخدام شخصية",
  try_prevention: "محاولة منع الإرجاع",
  send_template: "إرسال رسالة محددة",
  adjust_confidence: "تعديل عتبة الثقة",
  schedule_followup: "جدولة متابعة",
};

const DEFAULT_NEW_RULE: Omit<SmartRule, "id" | "created_at"> = {
  name: "",
  description: "",
  is_active: true,
  priority: 50,
  triggers: [{ type: "intent", value: "" }],
  actions: [{ type: "use_persona", value: "sales" }],
};

export default function RulesPage() {
  const [rules, setRules] = useState<SmartRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [newRule, setNewRule] = useState({ ...DEFAULT_NEW_RULE });
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await getSmartRules();
      setRules(data.items);
    } catch {
      setError("تعذّر تحميل القواعد");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleToggle(rule: SmartRule) {
    try {
      await updateSmartRule(rule.id, { is_active: !rule.is_active });
      setRules((prev) => prev.map((r) => r.id === rule.id ? { ...r, is_active: !r.is_active } : r));
    } catch {
      // silent
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("هل أنت متأكد من حذف هذه القاعدة؟")) return;
    try {
      await deleteSmartRule(id);
      setRules((prev) => prev.filter((r) => r.id !== id));
    } catch {
      setError("تعذّر حذف القاعدة");
    }
  }

  async function handleCreate() {
    if (!newRule.name.trim()) { setError("اسم القاعدة مطلوب"); return; }
    setSaving(true);
    setError("");
    try {
      await createSmartRule(newRule);
      setShowForm(false);
      setNewRule({ ...DEFAULT_NEW_RULE });
      await load();
    } catch {
      setError("تعذّر إنشاء القاعدة");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar
        title="القواعد الذكية"
        subtitle="أتمتة متقدمة بدون كود — trigger & action"
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            قاعدة جديدة
          </button>
          <button
            onClick={load}
            className="p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <span className="ms-auto text-sm text-muted-foreground">{rules.length} قاعدة</span>
        </div>

        {error && (
          <div className="text-sm text-destructive bg-destructive/10 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* New Rule Form */}
        {showForm && (
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-base">قاعدة جديدة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">اسم القاعدة *</label>
                  <input
                    type="text"
                    value={newRule.name}
                    onChange={(e) => setNewRule((r) => ({ ...r, name: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="مثال: عميل VIP + شكوى"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">الأولوية (0-100)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={newRule.priority}
                    onChange={(e) => setNewRule((r) => ({ ...r, priority: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">الوصف (اختياري)</label>
                <input
                  type="text"
                  value={newRule.description ?? ""}
                  onChange={(e) => setNewRule((r) => ({ ...r, description: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="وصف ما تفعله هذه القاعدة"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">نوع الشرط (Trigger)</label>
                  <select
                    value={newRule.triggers[0]?.type ?? "intent"}
                    onChange={(e) => setNewRule((r) => ({
                      ...r,
                      triggers: [{ type: e.target.value, value: r.triggers[0]?.value ?? "" }],
                    }))}
                    className="w-full px-3 py-2 text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    {Object.entries(TRIGGER_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">قيمة الشرط</label>
                  <input
                    type="text"
                    value={newRule.triggers[0]?.value ?? ""}
                    onChange={(e) => setNewRule((r) => ({
                      ...r,
                      triggers: [{ type: r.triggers[0]?.type ?? "intent", value: e.target.value }],
                    }))}
                    className="w-full px-3 py-2 text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="مثال: return_policy"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">نوع الإجراء (Action)</label>
                  <select
                    value={newRule.actions[0]?.type ?? "use_persona"}
                    onChange={(e) => setNewRule((r) => ({
                      ...r,
                      actions: [{ type: e.target.value, value: r.actions[0]?.value ?? "" }],
                    }))}
                    className="w-full px-3 py-2 text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    {Object.entries(ACTION_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">قيمة الإجراء</label>
                  <input
                    type="text"
                    value={newRule.actions[0]?.value ?? ""}
                    onChange={(e) => setNewRule((r) => ({
                      ...r,
                      actions: [{ type: r.actions[0]?.type ?? "use_persona", value: e.target.value }],
                    }))}
                    className="w-full px-3 py-2 text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="مثال: sales"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleCreate}
                  disabled={saving}
                  className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors"
                >
                  {saving ? "جارٍ الحفظ..." : "حفظ القاعدة"}
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 bg-muted text-muted-foreground rounded-lg text-sm hover:bg-muted/80 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : rules.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="p-4 rounded-full bg-muted mb-4">
              <Sliders className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">لا توجد قواعد بعد</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs">
              أنشئ قاعدتك الأولى لأتمتة سلوك رَدّ بناءً على شروط محددة
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {rules.map((rule) => (
              <RuleCard
                key={rule.id}
                rule={rule}
                expanded={expandedId === rule.id}
                onToggleExpand={() => setExpandedId(expandedId === rule.id ? null : rule.id)}
                onToggleActive={() => handleToggle(rule)}
                onDelete={() => handleDelete(rule.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RuleCard({
  rule,
  expanded,
  onToggleExpand,
  onToggleActive,
  onDelete,
}: {
  rule: SmartRule;
  expanded: boolean;
  onToggleExpand: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
}) {
  const trigger = rule.triggers[0];
  const action = rule.actions[0];

  return (
    <Card className={`transition-all ${!rule.is_active ? "opacity-60" : ""}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <button onClick={onToggleActive} className="shrink-0">
            {rule.is_active ? (
              <ToggleRight className="h-6 w-6 text-green-600" />
            ) : (
              <ToggleLeft className="h-6 w-6 text-muted-foreground" />
            )}
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{rule.name}</span>
              <span className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded-full">
                أولوية {rule.priority}
              </span>
            </div>
            {rule.description && (
              <p className="text-xs text-muted-foreground mt-0.5">{rule.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onToggleExpand}
              className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 rounded-lg text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {expanded && (
          <div className="mt-3 pt-3 border-t grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-blue-50">
              <p className="text-xs font-medium text-blue-700 mb-1">إذا (Trigger)</p>
              <p className="text-xs text-blue-600">
                {TRIGGER_LABELS[trigger?.type ?? ""] ?? trigger?.type} = <code>{trigger?.value}</code>
              </p>
            </div>
            <div className="p-3 rounded-lg bg-green-50">
              <p className="text-xs font-medium text-green-700 mb-1">فعل (Action)</p>
              <p className="text-xs text-green-600">
                {ACTION_LABELS[action?.type ?? ""] ?? action?.type} → <code>{action?.value}</code>
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
