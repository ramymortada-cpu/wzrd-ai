"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  CheckCircle,
  Trash2,
  FileText,
  Clock,
  BookOpen,
  AlertCircle,
  Lightbulb,
  RefreshCw,
} from "lucide-react";
import TopBar from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  getDocuments,
  createDocument,
  approveDocument,
  deleteDocument,
  getKnowledgeGaps,
  type KBDocument,
  type KnowledgeGap,
} from "@/lib/api";
import { formatRelativeTime } from "@/lib/utils";

const STATUS_LABELS: Record<string, string> = {
  draft: "مسودة",
  review: "قيد المراجعة",
  approved: "معتمد",
  archived: "مؤرشف",
};

const STATUS_VARIANTS: Record<string, "muted" | "warning" | "success" | "secondary"> = {
  draft: "muted",
  review: "warning",
  approved: "success",
  archived: "secondary",
};

const INTENT_LABELS: Record<string, string> = {
  greeting: "تحية",
  order_status: "حالة طلب",
  shipping: "شحن",
  return_policy: "إرجاع",
  store_hours: "أوقات عمل",
  general: "عام",
  product_inquiry: "استفسار منتج",
  product_comparison: "مقارنة منتجات",
  purchase_hesitation: "تردد في الشراء",
};

interface NewDocForm {
  title: string;
  content: string;
  content_type: string;
}

type ActiveTab = "documents" | "gaps";

export default function KnowledgePage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("documents");
  const [docs, setDocs] = useState<KBDocument[]>([]);
  const [gaps, setGaps] = useState<KnowledgeGap[]>([]);
  const [loading, setLoading] = useState(true);
  const [gapsLoading, setGapsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [prefillTitle, setPrefillTitle] = useState("");
  const [form, setForm] = useState<NewDocForm>({
    title: "",
    content: "",
    content_type: "text/plain",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDocs();
  }, []);

  useEffect(() => {
    if (activeTab === "gaps" && gaps.length === 0) {
      loadGaps();
    }
  }, [activeTab]);

  async function loadDocs() {
    setLoading(true);
    try {
      const data = await getDocuments();
      setDocs(data.items);
    } catch {
      setError("تعذّر تحميل الوثائق");
    } finally {
      setLoading(false);
    }
  }

  async function loadGaps() {
    setGapsLoading(true);
    try {
      const data = await getKnowledgeGaps();
      setGaps(data);
    } catch {
      setError("تعذّر تحميل فجوات المعرفة");
    } finally {
      setGapsLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createDocument(form);
      setShowForm(false);
      setForm({ title: "", content: "", content_type: "text/plain" });
      setPrefillTitle("");
      await loadDocs();
      setActiveTab("documents");
    } catch {
      setError("تعذّر إنشاء الوثيقة");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleApprove(id: string) {
    try {
      await approveDocument(id);
      await loadDocs();
    } catch {
      setError("تعذّر اعتماد الوثيقة");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("هل تريد حذف هذه الوثيقة؟")) return;
    try {
      await deleteDocument(id);
      setDocs((prev) => prev.filter((d) => d.id !== id));
    } catch {
      setError("تعذّر حذف الوثيقة");
    }
  }

  function handleAddAnswer(gap: KnowledgeGap) {
    setPrefillTitle(gap.question_pattern);
    setForm({ title: gap.question_pattern, content: "", content_type: "text/plain" });
    setShowForm(true);
    setActiveTab("documents");
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar title="قاعدة المعرفة" subtitle={`${docs.length} وثيقة`} />

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {error && (
          <div className="text-sm text-destructive bg-destructive/10 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-border gap-1">
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "documents"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveTab("documents")}
          >
            <FileText className="h-4 w-4 inline-block me-1.5" />
            المستندات
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "gaps"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveTab("gaps")}
          >
            <AlertCircle className="h-4 w-4 inline-block me-1.5" />
            فجوات المعرفة
            {gaps.length > 0 && (
              <span className="ms-1.5 bg-orange-100 text-orange-700 text-xs px-1.5 py-0.5 rounded-full">
                {gaps.length}
              </span>
            )}
          </button>
        </div>

        {/* ── Documents Tab ── */}
        {activeTab === "documents" && (
          <>
            <div className="flex justify-end">
              <Button onClick={() => { setPrefillTitle(""); setShowForm((v) => !v); }}>
                <Plus className="h-4 w-4 me-2" />
                إضافة وثيقة
              </Button>
            </div>

            {showForm && (
              <Card>
                <CardContent className="pt-5">
                  <form onSubmit={handleCreate} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">عنوان الوثيقة</label>
                      <Input
                        required
                        value={form.title}
                        onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                        placeholder="مثال: سياسة الإرجاع"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">المحتوى</label>
                      <Textarea
                        required
                        rows={8}
                        value={form.content}
                        onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                        placeholder="أدخل نص الوثيقة باللغة العربية..."
                        className="arabic-text"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => { setShowForm(false); setPrefillTitle(""); }}
                      >
                        إلغاء
                      </Button>
                      <Button type="submit" disabled={submitting}>
                        {submitting ? "جارٍ الحفظ..." : "حفظ كمسودة"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
                ))}
              </div>
            ) : docs.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p>لا توجد وثائق بعد. أضف أول وثيقة لقاعدة المعرفة.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {docs.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-start gap-4 p-4 rounded-lg bg-white border border-border hover:shadow-sm transition-shadow"
                  >
                    <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{doc.title}</span>
                        <Badge variant={STATUS_VARIANTS[doc.status] || "muted"}>
                          {STATUS_LABELS[doc.status] || doc.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          v{doc.version}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{formatRelativeTime(doc.updated_at)}</span>
                        <span>·</span>
                        <span>{doc.content_type}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {(doc.status === "draft" || doc.status === "review") && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 border-green-200 hover:bg-green-50"
                          onClick={() => handleApprove(doc.id)}
                        >
                          <CheckCircle className="h-4 w-4 me-1" />
                          اعتماد
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(doc.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Knowledge Gaps Tab ── */}
        {activeTab === "gaps" && (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                أسئلة العملاء التي لم يجد رَدّ إجابة لها هذا الأسبوع
              </p>
              <Button variant="outline" size="sm" onClick={loadGaps} disabled={gapsLoading}>
                <RefreshCw className={`h-4 w-4 me-1.5 ${gapsLoading ? "animate-spin" : ""}`} />
                تحديث
              </Button>
            </div>

            {gapsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
                ))}
              </div>
            ) : gaps.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <Lightbulb className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">ما فيه فجوات هالأسبوع. أداؤك ممتاز! 🎉</p>
                <p className="text-xs mt-1">رَدّ تمكن من الإجابة على جميع أسئلة عملائك</p>
              </div>
            ) : (
              <div className="space-y-3">
                {gaps.map((gap, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-4 p-4 rounded-lg bg-white border border-orange-100 hover:shadow-sm transition-shadow"
                  >
                    <div className="p-2 rounded-lg bg-orange-50 shrink-0">
                      <AlertCircle className="h-5 w-5 text-orange-500" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-medium text-sm arabic-text">
                          {gap.sample_question}
                        </span>
                        <Badge variant="warning">
                          {INTENT_LABELS[gap.intent] || gap.intent}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <span className="text-orange-600 font-semibold">
                            {gap.occurrence_count}
                          </span>{" "}
                          مرة
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          آخر مرة: {formatRelativeTime(gap.last_asked)}
                        </span>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0 text-primary border-primary/30 hover:bg-primary/5"
                      onClick={() => handleAddAnswer(gap)}
                    >
                      <Plus className="h-4 w-4 me-1" />
                      أضف الجواب
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
