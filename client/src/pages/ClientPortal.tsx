import { trpc } from "@/lib/trpc";
import type { PortalProjectDeliverable, PortalRevisionRow, PortalCommentRow } from "@/lib/routerTypes";
import { useI18n } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  Loader2, CheckCircle2, Clock, AlertCircle, FolderKanban, FileText, Shield, Sparkles,
  Star, MessageSquare, ThumbsUp, Download, History, Send, Reply, ChevronDown, ChevronUp,
  GitCommit, ArrowLeftRight, Check, RotateCcw, XCircle, Eye
} from "lucide-react";
import { useRoute } from "wouter";
import { useMemo, useState, useCallback } from "react";
import { toast } from "sonner";

const stageOrder = ["diagnose", "design", "deploy", "optimize"];

const stageColors: Record<string, string> = {
  diagnose: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  design: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  deploy: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  optimize: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
};

const statusIcons: Record<string, React.ReactNode> = {
  pending: <Clock className="h-4 w-4 text-muted-foreground" />,
  in_progress: <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />,
  ai_generated: <Sparkles className="h-4 w-4 text-amber-500" />,
  review: <AlertCircle className="h-4 w-4 text-yellow-500" />,
  approved: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
  delivered: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
};

const statusLabelsEn: Record<string, string> = {
  pending: "Pending", in_progress: "In Progress", ai_generated: "Generated",
  review: "In Review", approved: "Approved", delivered: "Delivered",
};
const statusLabelsAr: Record<string, string> = {
  pending: "قيد الانتظار", in_progress: "قيد التنفيذ", ai_generated: "تم التوليد",
  review: "قيد المراجعة", approved: "معتمد", delivered: "تم التسليم",
};
const stageLabelsEn: Record<string, string> = { diagnose: "Diagnose", design: "Design", deploy: "Deploy", optimize: "Optimize" };
const stageLabelsAr: Record<string, string> = { diagnose: "التشخيص", design: "التصميم", deploy: "النشر", optimize: "التحسين" };

const changeTypeLabelsEn: Record<string, string> = {
  initial: "Initial Version", ai_regenerated: "AI Regenerated", manual_edit: "Manual Edit",
  client_revision: "Client Revision", quality_update: "Quality Update",
};
const changeTypeLabelsAr: Record<string, string> = {
  initial: "النسخة الأولى", ai_regenerated: "إعادة توليد بالذكاء", manual_edit: "تعديل يدوي",
  client_revision: "مراجعة العميل", quality_update: "تحديث الجودة",
};

const authorTypeColors: Record<string, string> = {
  owner: "bg-primary/10 text-primary",
  team: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  client: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  ai: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
};

// ============ DIFF VIEWER COMPONENT ============
function DiffViewer({ contentA, contentB, labelA, labelB, isAr }: {
  contentA: string | null;
  contentB: string | null;
  labelA: string;
  labelB: string;
  isAr: boolean;
}) {
  const linesA = (contentA || "").split("\n");
  const linesB = (contentB || "").split("\n");

  // Simple line-by-line diff
  const maxLines = Math.max(linesA.length, linesB.length);
  const diffLines: { lineNum: number; a: string; b: string; type: "same" | "changed" | "added" | "removed" }[] = [];

  for (let i = 0; i < maxLines; i++) {
    const a = linesA[i] ?? "";
    const b = linesB[i] ?? "";
    if (a === b) {
      diffLines.push({ lineNum: i + 1, a, b, type: "same" });
    } else if (!a && b) {
      diffLines.push({ lineNum: i + 1, a, b, type: "added" });
    } else if (a && !b) {
      diffLines.push({ lineNum: i + 1, a, b, type: "removed" });
    } else {
      diffLines.push({ lineNum: i + 1, a, b, type: "changed" });
    }
  }

  const changedCount = diffLines.filter(l => l.type !== "same").length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{changedCount} {isAr ? "سطر متغير" : "lines changed"}</span>
      </div>
      {/* Side by side headers */}
      <div className="grid grid-cols-2 gap-2">
        <div className="text-xs font-medium text-center p-1.5 rounded bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {labelA}
        </div>
        <div className="text-xs font-medium text-center p-1.5 rounded bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">
          {labelB}
        </div>
      </div>
      {/* Diff content */}
      <div className="max-h-96 overflow-y-auto rounded border text-xs font-mono">
        {diffLines.map((line, idx) => (
          <div key={idx} className={`grid grid-cols-2 border-b last:border-b-0 ${
            line.type === "same" ? "" :
            line.type === "added" ? "bg-green-50/50 dark:bg-green-900/10" :
            line.type === "removed" ? "bg-red-50/50 dark:bg-red-900/10" :
            "bg-amber-50/50 dark:bg-amber-900/10"
          }`}>
            <div className={`p-1 border-r ${
              line.type === "removed" || line.type === "changed" ? "bg-red-100/60 dark:bg-red-900/20 line-through text-red-700 dark:text-red-400" : ""
            }`}>
              <span className="text-muted-foreground mr-2 select-none">{line.lineNum}</span>
              {line.a}
            </div>
            <div className={`p-1 ${
              line.type === "added" || line.type === "changed" ? "bg-green-100/60 dark:bg-green-900/20 text-green-700 dark:text-green-400" : ""
            }`}>
              <span className="text-muted-foreground mr-2 select-none">{line.lineNum}</span>
              {line.b}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============ APPROVAL WIDGET COMPONENT ============
function ApprovalWidget({ deliverableId, deliverableTitle: _deliverableTitle, token, clientName, isAr, status }: {
  deliverableId: number;
  deliverableTitle: string;
  token: string;
  clientName: string;
  isAr: boolean;
  status: string;
}) {
  const [showApproval, setShowApproval] = useState(false);
  const [decision, setDecision] = useState<"approved" | "changes_requested" | null>(null);
  const [reason, setReason] = useState("");

  const detailsQuery = trpc.portal.getDeliverableDetails.useQuery(
    { token, deliverableId },
    { enabled: !!token && !!deliverableId }
  );

  const approvalMutation = trpc.portal.submitApproval.useMutation({
    onSuccess: (data: { decision?: string } | null) => {
      toast.success(
        data && data.decision === "approved"
          ? (isAr ? "تم اعتماد المخرج بنجاح!" : "Deliverable approved successfully!")
          : (isAr ? "تم إرسال طلب التعديلات" : "Change request submitted!")
      );
      setShowApproval(false);
      setDecision(null);
      setReason("");
      detailsQuery.refetch();
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : String(err)),
  });

  const canApprove = ["delivered", "review"].includes(status);
  const approvals = detailsQuery.data?.approvals ?? [];
  const latestApproval = detailsQuery.data?.latestApproval ?? approvals[0];

  return (
    <div className="space-y-3">
      {/* Latest approval status */}
      {latestApproval && (
        <div className={`p-3 rounded-lg border ${
          latestApproval.decision === "approved"
            ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800"
            : "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800"
        }`}>
          <div className="flex items-center gap-2">
            {latestApproval.decision === "approved" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            ) : (
              <RotateCcw className="h-4 w-4 text-amber-600" />
            )}
            <span className="text-sm font-medium">
              {latestApproval.decision === "approved"
                ? (isAr ? "معتمد" : "Approved")
                : (isAr ? "تعديلات مطلوبة" : "Changes Requested")}
            </span>
            <span className="text-xs text-muted-foreground ml-auto">
              {latestApproval.clientName} · {latestApproval.createdAt ? new Date(latestApproval.createdAt).toLocaleString() : ""}
            </span>
          </div>
          {latestApproval.reason && (
            <p className="text-sm mt-2 text-muted-foreground">{latestApproval.reason}</p>
          )}
        </div>
      )}

      {/* Approval history */}
      {approvals.length > 1 && (
        <details className="text-xs">
          <summary className="text-primary cursor-pointer">
            {isAr ? `عرض سجل الاعتماد (${approvals.length})` : `View approval history (${approvals.length})`}
          </summary>
          <div className="mt-2 space-y-2">
            {approvals.slice(1).map((a: { id: number; decision: string; clientName: string; createdAt?: Date | string }) => (
              <div key={a.id} className="flex items-center gap-2 p-2 rounded bg-muted/30">
                {a.decision === "approved" ? (
                  <Check className="h-3 w-3 text-emerald-500" />
                ) : (
                  <XCircle className="h-3 w-3 text-amber-500" />
                )}
                <span className="font-medium">{a.clientName}</span>
                <Badge variant="outline" className="text-[10px]">
                  {a.decision === "approved" ? (isAr ? "معتمد" : "Approved") : (isAr ? "تعديلات" : "Changes")}
                </Badge>
                <span className="text-muted-foreground ml-auto">
                  {a.createdAt ? new Date(a.createdAt).toLocaleString() : ""}
                </span>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* Approval action buttons */}
      {canApprove && !showApproval && (
        <div className="flex gap-2">
          <Button
            size="sm"
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => { setShowApproval(true); setDecision("approved"); }}
          >
            <Check className="h-3.5 w-3.5 mr-1.5" />
            {isAr ? "اعتماد" : "Approve"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-900/20"
            onClick={() => { setShowApproval(true); setDecision("changes_requested"); }}
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            {isAr ? "طلب تعديلات" : "Request Changes"}
          </Button>
        </div>
      )}

      {/* Approval form */}
      {showApproval && decision && (
        <div className={`p-3 rounded-lg border space-y-3 ${
          decision === "approved" ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-900/10" : "border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-900/10"
        }`}>
          <div className="flex items-center gap-2">
            {decision === "approved" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            ) : (
              <RotateCcw className="h-4 w-4 text-amber-600" />
            )}
            <span className="text-sm font-medium">
              {decision === "approved"
                ? (isAr ? "تأكيد الاعتماد" : "Confirm Approval")
                : (isAr ? "طلب تعديلات" : "Request Changes")}
            </span>
          </div>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={
              decision === "approved"
                ? (isAr ? "ملاحظات إضافية (اختياري)..." : "Additional notes (optional)...")
                : (isAr ? "وضح التعديلات المطلوبة (مطلوب)..." : "Describe the changes needed (required)...")
            }
            rows={3}
            className="text-sm"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              className={decision === "approved" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-amber-600 hover:bg-amber-700 text-white"}
              disabled={approvalMutation.isPending || (decision === "changes_requested" && !reason.trim())}
              onClick={() => {
                if (!clientName.trim()) {
                  toast.error(isAr ? "يرجى إدخال اسمك أولاً" : "Please enter your name first");
                  return;
                }
                approvalMutation.mutate({
                  token,
                  deliverableId,
                  decision,
                  reason: reason || undefined,
                  clientName,
                });
              }}
            >
              {approvalMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
              {isAr ? "تأكيد" : "Submit"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => { setShowApproval(false); setDecision(null); setReason(""); }}
            >
              {isAr ? "إلغاء" : "Cancel"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ MAIN CLIENT PORTAL PAGE ============
export default function ClientPortalPage() {
  const { locale } = useI18n();
  const isAr = locale === "ar";
  const [, params] = useRoute("/portal/:token");
  const token = params?.token || "";
  const [feedbackDialog, setFeedbackDialog] = useState<{ deliverableId: number; title: string } | null>(null);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [expandedDeliverable, setExpandedDeliverable] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"content" | "revisions" | "comments" | "approval">("content");
  const [commentText, setCommentText] = useState("");
  const [commentAuthor, setCommentAuthor] = useState("");
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  // Diff viewer state
  const [diffVersions, setDiffVersions] = useState<{ a: number; b: number } | null>(null);

  const { data, isLoading, error } = trpc.portal.viewProject.useQuery(
    { token },
    { enabled: !!token, retry: false }
  );

  const detailsQuery = trpc.portal.getDeliverableDetails.useQuery(
    { token, deliverableId: expandedDeliverable! },
    { enabled: !!token && !!expandedDeliverable && (activeTab === "revisions" || activeTab === "comments" || activeTab === "approval") }
  );

  const feedbackMutation = trpc.portal.addFeedback.useMutation({
    onSuccess: () => {
      toast.success(isAr ? "تم إرسال ملاحظاتك بنجاح" : "Feedback submitted successfully!");
      setFeedbackDialog(null);
      setFeedbackComment("");
      setFeedbackRating(0);
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : String(err)),
  });

  // Diff query (feedback.compare is public, no token needed)
  const diffQuery = trpc.feedback.compare.useQuery(
    { deliverableId: expandedDeliverable!, versionA: diffVersions?.a || 0, versionB: diffVersions?.b || 0 },
    { enabled: !!expandedDeliverable && !!diffVersions && diffVersions.a > 0 && diffVersions.b > 0 }
  );

  const commentMutation = trpc.portal.addComment.useMutation({
    onSuccess: () => {
      toast.success(isAr ? "تم إرسال التعليق" : "Comment posted!");
      setCommentText("");
      setReplyText("");
      setReplyTo(null);
      detailsQuery.refetch();
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : String(err)),
  });

  const stageProgress = useMemo(() => {
    if (!data?.project?.stage) return 0;
    const idx = stageOrder.indexOf(data.project.stage);
    return idx >= 0 ? ((idx + 1) / stageOrder.length) * 100 : 25;
  }, [data?.project?.stage]);

  const deliverablesByStage = useMemo(() => {
    if (!data?.deliverables) return {};
    const grouped: Record<string, typeof data.deliverables> = {};
    for (const d of data.deliverables) {
      const stage = d.stage || "other";
      if (!grouped[stage]) grouped[stage] = [];
      grouped[stage].push(d);
    }
    return grouped;
  }, [data?.deliverables]);

  const completedCount = useMemo(() => {
    if (!data?.deliverables) return 0;
    return data.deliverables.filter((d) => d.status === "approved" || d.status === "delivered").length;
  }, [data?.deliverables]);

  const handleToggleDeliverable = useCallback((id: number) => {
    if (expandedDeliverable === id) {
      setExpandedDeliverable(null);
      setActiveTab("content");
      setDiffVersions(null);
    } else {
      setExpandedDeliverable(id);
      setActiveTab("content");
      setDiffVersions(null);
    }
  }, [expandedDeliverable]);

  const handlePostComment = useCallback((parentId?: number) => {
    const text = parentId ? replyText : commentText;
    if (!text.trim() || !commentAuthor.trim() || !expandedDeliverable) return;
    commentMutation.mutate({
      token,
      deliverableId: expandedDeliverable,
      parentId: parentId || undefined,
      comment: text,
      authorName: commentAuthor,
    });
  }, [replyText, commentText, commentAuthor, expandedDeliverable, token, commentMutation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">{isAr ? "جاري التحميل..." : "Loading..."}</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full mx-4 sm:mx-0">
          <CardContent className="py-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <Shield className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="text-xl font-bold">{isAr ? "رابط غير صالح" : "Invalid Portal Link"}</h2>
            <p className="text-muted-foreground">
              {isAr ? "هذا الرابط غير صالح أو منتهي الصلاحية." : "This link is invalid or has expired."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { project, client, deliverables } = data;

  return (
    <div className="max-w-4xl mx-auto space-y-6 px-4 sm:px-6 py-4 sm:py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <img
            src="https://d2xsxph8kpxj0f.cloudfront.net/310519663371561184/TgSL8MhgJ4oMR4dsotVnRS/wzrd-ai-logo_a6bceffd.png"
            alt="Wzrd AI"
            className="w-10 h-10 rounded-lg"
          />
          <div>
            <h1 className="text-xl font-bold tracking-tight">{isAr ? "بوابة العميل" : "Client Portal"}</h1>
            <p className="text-xs text-muted-foreground">{isAr ? "مدعوم بواسطة Wzrd AI" : "Powered by Wzrd AI"}</p>
          </div>
        </div>
        {client && (
          <div className="text-right">
            <p className="font-medium">{client.companyName || client.name}</p>
          </div>
        )}
      </div>

      {/* Project Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FolderKanban className="h-5 w-5 text-primary" />
              {project.name}
            </CardTitle>
            <Badge className={stageColors[project.stage || "diagnose"]}>
              {isAr ? (stageLabelsAr[project.stage || ""] || project.stage) : (stageLabelsEn[project.stage || ""] || project.stage)}
            </Badge>
          </div>
          <CardDescription>{data.serviceLabel}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{isAr ? "تقدم المشروع" : "Project Progress"}</span>
              <span className="font-medium">{Math.round(stageProgress)}%</span>
            </div>
            <Progress value={stageProgress} className="h-3" />
            <div className="flex justify-between overflow-x-auto gap-2 sm:gap-0 pb-1">
              {stageOrder.map((stage) => {
                const isCurrent = project.stage === stage;
                const isPast = stageOrder.indexOf(project.stage || "") > stageOrder.indexOf(stage);
                return (
                  <div key={stage} className="flex flex-col items-center gap-1 min-w-[60px]">
                    <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                      isPast ? "bg-primary text-primary-foreground" :
                      isCurrent ? "bg-primary/20 text-primary ring-2 ring-primary" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {isPast ? <CheckCircle2 className="h-4 w-4" /> : stageOrder.indexOf(stage) + 1}
                    </div>
                    <span className={`text-xs ${isCurrent ? "font-semibold" : "text-muted-foreground"}`}>
                      {isAr ? stageLabelsAr[stage] : stageLabelsEn[stage]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-2">
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold">{deliverables.length}</p>
              <p className="text-xs text-muted-foreground">{isAr ? "إجمالي المخرجات" : "Total Deliverables"}</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold text-blue-600">{deliverables.filter((d) => d.status === "in_progress").length}</p>
              <p className="text-xs text-muted-foreground">{isAr ? "قيد التنفيذ" : "In Progress"}</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold text-emerald-600">{completedCount}</p>
              <p className="text-xs text-muted-foreground">{isAr ? "مكتمل" : "Completed"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deliverables by Stage */}
      {stageOrder.map((stage) => {
        const stageDeliverables = deliverablesByStage[stage];
        if (!stageDeliverables || stageDeliverables.length === 0) return null;
        return (
          <Card key={stage}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Badge className={stageColors[stage]}>
                  {isAr ? stageLabelsAr[stage] : stageLabelsEn[stage]}
                </Badge>
                <span className="text-muted-foreground text-sm font-normal">
                  ({stageDeliverables.length} {isAr ? "مخرجات" : "deliverables"})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stageDeliverables.map((d: PortalProjectDeliverable) => {
                  const isExpanded = expandedDeliverable === d.id;
                  const isAccessible = d.status === "delivered" || d.status === "approved" || d.status === "review";
                  return (
                    <div key={d.id} className="rounded-lg border hover:bg-muted/30 transition-colors">
                      {/* Deliverable Header */}
                      <div
                        className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 cursor-pointer"
                        onClick={() => isAccessible && handleToggleDeliverable(d.id)}
                      >
                        <div className="mt-0.5">
                          {statusIcons[d.status] || <Clock className="h-4 w-4 text-muted-foreground" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">{d.title}</p>
                            <Badge variant="outline" className="text-[10px]">
                              {isAr ? statusLabelsAr[d.status] : statusLabelsEn[d.status]}
                            </Badge>
                          </div>
                          {d.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{d.description}</p>
                          )}
                        </div>
                        {isAccessible && (
                          <div className="flex items-center gap-1">
                            {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                          </div>
                        )}
                      </div>

                      {/* Expanded Content */}
                      {isExpanded && isAccessible && (
                        <div className="border-t">
                          {/* Tabs */}
                          <div className="flex border-b">
                            {[
                              { key: "content" as const, icon: FileText, labelEn: "Content", labelAr: "المحتوى" },
                              { key: "revisions" as const, icon: History, labelEn: "History", labelAr: "السجل" },
                              { key: "comments" as const, icon: MessageSquare, labelEn: "Comments", labelAr: "التعليقات" },
                              { key: "approval" as const, icon: CheckCircle2, labelEn: "Approval", labelAr: "الاعتماد" },
                            ].map(tab => (
                              <button
                                key={tab.key}
                                className={`flex-1 py-2 text-xs font-medium transition-colors ${activeTab === tab.key ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"}`}
                                onClick={() => { setActiveTab(tab.key); setDiffVersions(null); }}
                              >
                                <tab.icon className="h-3 w-3 inline mr-1" />
                                {isAr ? tab.labelAr : tab.labelEn}
                              </button>
                            ))}
                          </div>

                          {/* Content Tab */}
                          {activeTab === "content" && (
                            <div className="p-4 space-y-3">
                              {d.fileUrl ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs h-7 gap-1.5"
                                  onClick={() => window.open(d.fileUrl!, "_blank")}
                                >
                                  <Download className="h-3 w-3" />
                                  {isAr ? "تحميل PDF" : "Download PDF"}
                                </Button>
                              ) : null}
                              {Array.isArray(d.imageUrls) && d.imageUrls.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                  {d.imageUrls.map((url: string, imgIdx: number) => (
                                    <a key={imgIdx} href={url} target="_blank" rel="noopener noreferrer">
                                      <img src={url} alt={`Asset ${imgIdx + 1}`} className="rounded border hover:ring-2 ring-primary transition-all w-full" />
                                    </a>
                                  ))}
                                </div>
                              ) : null}
                              {d.content && (
                                <div className="p-2 sm:p-3 rounded-md bg-muted/50 text-sm whitespace-pre-wrap max-h-60 sm:max-h-80 overflow-y-auto">
                                  {d.content}
                                </div>
                              )}
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-xs h-7 gap-1"
                                  onClick={() => setFeedbackDialog({ deliverableId: d.id, title: d.title })}
                                >
                                  <ThumbsUp className="h-3 w-3" />
                                  {isAr ? "إرسال تقييم" : "Rate & Review"}
                                </Button>
                              </div>
                            </div>
                          )}

                          {/* Revisions Tab */}
                          {activeTab === "revisions" && (
                            <div className="p-4">
                              {detailsQuery.isLoading ? (
                                <div className="flex items-center justify-center py-8">
                                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                </div>
                              ) : !detailsQuery.data?.revisions || detailsQuery.data.revisions.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground text-sm">
                                  {isAr ? "لا توجد تعديلات مسجلة بعد" : "No revision history yet"}
                                </div>
                              ) : (
                                <div className="space-y-4">
                                  {/* Diff compare selector */}
                                  {detailsQuery.data?.revisions && detailsQuery.data.revisions.length >= 2 && (
                                    <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                                      <div className="flex items-center gap-2 text-xs font-medium">
                                        <ArrowLeftRight className="h-3.5 w-3.5 text-primary" />
                                        {isAr ? "مقارنة النسخ" : "Compare Versions"}
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <select
                                          className="text-xs border rounded px-2 py-1 bg-background flex-1"
                                          value={diffVersions?.a || ""}
                                          onChange={(e) => {
                                            const v = parseInt(e.target.value);
                                            if (v && diffVersions?.b) setDiffVersions({ a: v, b: diffVersions.b });
                                            else if (v) setDiffVersions({ a: v, b: 0 });
                                          }}
                                        >
                                          <option value="">{isAr ? "النسخة القديمة..." : "Older version..."}</option>
                                          {(detailsQuery.data?.revisions ?? []).map((r: { id: number; version: number; changeType?: string }) => (
                                          <option key={r.id} value={r.version}>v{r.version} — {isAr ? changeTypeLabelsAr[r.changeType || "initial"] : changeTypeLabelsEn[r.changeType || "initial"]}</option>
                                          ))}
                                        </select>
                                        <ArrowLeftRight className="h-3 w-3 text-muted-foreground shrink-0" />
                                        <select
                                          className="text-xs border rounded px-2 py-1 bg-background flex-1"
                                          value={diffVersions?.b || ""}
                                          onChange={(e) => {
                                            const v = parseInt(e.target.value);
                                            if (v && diffVersions?.a) setDiffVersions({ a: diffVersions.a, b: v });
                                            else if (v) setDiffVersions({ a: 0, b: v });
                                          }}
                                        >
                                          <option value="">{isAr ? "النسخة الأحدث..." : "Newer version..."}</option>
                                          {(detailsQuery.data?.revisions ?? []).map((r: { id: number; version: number; changeType?: string }) => (
                                            <option key={r.id} value={r.version}>v{r.version} — {isAr ? changeTypeLabelsAr[r.changeType || "initial"] : changeTypeLabelsEn[r.changeType || "initial"]}</option>
                                          ))}
                                        </select>
                                      </div>
                                      {/* Diff result */}
                                      {diffVersions && diffVersions.a > 0 && diffVersions.b > 0 && (
                                        <div className="mt-3">
                                          {diffQuery.isLoading ? (
                                            <div className="flex items-center justify-center py-4">
                                              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                            </div>
                                          ) : diffQuery.data ? (
                                            <DiffViewer
                                              contentA={diffQuery.data.revA?.content || null}
                                              contentB={diffQuery.data.revB?.content || null}
                                              labelA={`v${diffVersions.a}`}
                                              labelB={`v${diffVersions.b}`}
                                              isAr={isAr}
                                            />
                                          ) : (
                                            <p className="text-xs text-muted-foreground text-center py-2">
                                              {isAr ? "لا يوجد محتوى للمقارنة" : "No content to compare"}
                                            </p>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* Timeline */}
                                  <div className="relative">
                                    <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
                                    <div className="space-y-4">
                                      {(detailsQuery.data?.revisions ?? []).map((rev: PortalRevisionRow, idx: number) => (
                                        <div key={rev.id} className="relative flex gap-4">
                                          <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                                            idx === 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                          }`}>
                                            <GitCommit className="h-4 w-4" />
                                          </div>
                                          <div className="flex-1 pb-2">
                                            <div className="flex items-center gap-2 flex-wrap">
                                              <Badge variant="outline" className="text-[10px]">
                                                v{rev.version}
                                              </Badge>
                                              <Badge variant="secondary" className="text-[10px]">
                                                {isAr ? changeTypeLabelsAr[rev.changeType || "initial"] : changeTypeLabelsEn[rev.changeType || "initial"]}
                                              </Badge>
                                              {rev.qualityScore !== null && rev.qualityScore !== undefined && (
                                                <Badge variant="outline" className="text-[10px]">
                                                  {isAr ? "جودة" : "Quality"}: {rev.qualityScore}%
                                                </Badge>
                                              )}
                                            </div>
                                            {rev.changeSummary && (
                                              <p className="text-sm mt-1">{rev.changeSummary}</p>
                                            )}
                                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                              <span>{rev.changedBy || "System"}</span>
                                              <span>·</span>
                                              <span>{rev.createdAt ? new Date(rev.createdAt).toLocaleString() : ""}</span>
                                            </div>
                                            {rev.content && (
                                              <details className="mt-2">
                                                <summary className="text-xs text-primary cursor-pointer flex items-center gap-1">
                                                  <Eye className="h-3 w-3" />
                                                  {isAr ? "عرض محتوى هذه النسخة" : "View this version's content"}
                                                </summary>
                                                <div className="mt-1 p-2 rounded bg-muted/50 text-xs whitespace-pre-wrap max-h-40 overflow-y-auto">
                                                  {rev.content}
                                                </div>
                                              </details>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Comments Tab */}
                          {activeTab === "comments" && (
                            <div className="p-4 space-y-4">
                              {/* Author name input */}
                              {!commentAuthor && (
                                <div className="space-y-2">
                                  <p className="text-sm font-medium">{isAr ? "اسمك" : "Your Name"}</p>
                                  <div className="flex gap-2">
                                    <Input
                                      placeholder={isAr ? "أدخل اسمك للتعليق..." : "Enter your name to comment..."}
                                      value={commentAuthor}
                                      onChange={(e) => setCommentAuthor(e.target.value)}
                                      className="text-sm"
                                    />
                                    <Button size="sm" onClick={() => { if (!commentAuthor.trim()) toast.error(isAr ? "يرجى إدخال اسمك" : "Please enter your name"); }}>
                                      {isAr ? "تأكيد" : "Set"}
                                    </Button>
                                  </div>
                                </div>
                              )}

                              {/* Comment list */}
                              {detailsQuery.isLoading ? (
                                <div className="flex items-center justify-center py-8">
                                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                </div>
                              ) : !detailsQuery.data?.comments || detailsQuery.data.comments.length === 0 ? (
                                <div className="text-center py-6 text-muted-foreground text-sm">
                                  {isAr ? "لا توجد تعليقات بعد. كن أول من يعلق!" : "No comments yet. Be the first to comment!"}
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  {(detailsQuery.data.comments.filter((c: PortalCommentRow) => !c.parentId)).map((thread: PortalCommentRow) => (
                                    <div key={thread.id} className="space-y-2">
                                      {/* Top-level comment */}
                                      <div className={`p-3 rounded-lg border ${(thread as unknown as { isResolved?: number | boolean }).isResolved ? "opacity-60" : ""}`}>
                                        <div className="flex items-center gap-2 mb-1">
                                          <Badge className={`text-[10px] ${authorTypeColors[thread.authorType as string] || ""}`}>
                                            {thread.authorType === "client" ? (isAr ? "عميل" : "Client") :
                                             thread.authorType === "owner" ? (isAr ? "فريق" : "Team") :
                                             thread.authorType === "ai" ? "AI" : (thread.authorType as string)}
                                          </Badge>
                                          <span className="text-xs font-medium">{thread.authorName}</span>
                                          {thread.version && (
                                            <Badge variant="outline" className="text-[10px]">v{thread.version}</Badge>
                                          )}
                                          <span className="text-xs text-muted-foreground ml-auto">
                                            {thread.createdAt ? new Date(thread.createdAt).toLocaleString() : ""}
                                          </span>
                                        </div>
                                        <p className="text-sm">{thread.comment}</p>
                                        {(thread as unknown as { isResolved?: number | boolean }).isResolved ? (
                                          <Badge variant="secondary" className="text-[10px] mt-2">
                                            <CheckCircle2 className="h-3 w-3 mr-1" />
                                            {isAr ? "تم الحل" : "Resolved"}
                                          </Badge>
                                        ) : (
                                          <button
                                            className="text-xs text-primary mt-2 flex items-center gap-1 hover:underline"
                                            onClick={() => setReplyTo(replyTo === thread.id ? null : thread.id)}
                                          >
                                            <Reply className="h-3 w-3" />
                                            {isAr ? "رد" : "Reply"}
                                          </button>
                                        )}
                                      </div>

                                      {/* Replies */}
                                      {(() => {
                                        const replies = (detailsQuery.data?.comments ?? []).filter((c: { parentId?: number | null }) => c.parentId === thread.id);
                                        return replies.length > 0 ? (
                                        <div className="ml-6 space-y-2">
                                          {replies.map((reply: { id: number; authorType?: string; authorName?: string; createdAt?: Date | string; comment?: string }) => (
                                            <div key={reply.id} className="p-2 rounded-lg border bg-muted/30">
                                              <div className="flex items-center gap-2 mb-1">
                                                <Badge className={`text-[10px] ${authorTypeColors[reply.authorType as string] || ""}`}>
                                                  {reply.authorType === "client" ? (isAr ? "عميل" : "Client") :
                                                   reply.authorType === "owner" ? (isAr ? "فريق" : "Team") :
                                                   reply.authorType === "ai" ? "AI" : reply.authorType}
                                                </Badge>
                                                <span className="text-xs font-medium">{reply.authorName}</span>
                                                <span className="text-xs text-muted-foreground ml-auto">
                                                  {reply.createdAt ? new Date(reply.createdAt).toLocaleString() : ""}
                                                </span>
                                              </div>
                                              <p className="text-xs">{reply.comment}</p>
                                            </div>
                                          ))}
                                        </div>
                                        ) : null;
                                      })()}

                                      {/* Reply input */}
                                      {replyTo === thread.id && commentAuthor && (
                                        <div className="ml-6 flex gap-2">
                                          <Textarea
                                            value={replyText}
                                            onChange={(e) => setReplyText(e.target.value)}
                                            placeholder={isAr ? "اكتب ردك..." : "Write your reply..."}
                                            rows={2}
                                            className="text-sm"
                                          />
                                          <Button
                                            size="sm"
                                            className="shrink-0"
                                            disabled={!replyText.trim() || commentMutation.isPending}
                                            onClick={() => handlePostComment(thread.id)}
                                          >
                                            {commentMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* New comment input */}
                              {commentAuthor && (
                                <div className="pt-2 border-t">
                                  <p className="text-xs text-muted-foreground mb-2">
                                    {isAr ? `التعليق بصفتك: ${commentAuthor}` : `Commenting as: ${commentAuthor}`}
                                    <button className="text-primary ml-2 hover:underline" onClick={() => setCommentAuthor("")}>
                                      {isAr ? "(تغيير)" : "(change)"}
                                    </button>
                                  </p>
                                  <div className="flex gap-2">
                                    <Textarea
                                      value={commentText}
                                      onChange={(e) => setCommentText(e.target.value)}
                                      placeholder={isAr ? "اكتب تعليقك..." : "Write a comment..."}
                                      rows={2}
                                      className="text-sm"
                                    />
                                    <Button
                                      size="sm"
                                      className="shrink-0"
                                      disabled={!commentText.trim() || commentMutation.isPending}
                                      onClick={() => handlePostComment()}
                                    >
                                      {commentMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Approval Tab */}
                          {activeTab === "approval" && (
                            <div className="p-4 space-y-4">
                              {/* Name input for approval */}
                              {!commentAuthor && (
                                <div className="space-y-2">
                                  <p className="text-sm font-medium">{isAr ? "اسمك (مطلوب للاعتماد)" : "Your Name (required for approval)"}</p>
                                  <div className="flex gap-2">
                                    <Input
                                      placeholder={isAr ? "أدخل اسمك..." : "Enter your name..."}
                                      value={commentAuthor}
                                      onChange={(e) => setCommentAuthor(e.target.value)}
                                      className="text-sm"
                                    />
                                    <Button size="sm" onClick={() => { if (!commentAuthor.trim()) toast.error(isAr ? "يرجى إدخال اسمك" : "Please enter your name"); }}>
                                      {isAr ? "تأكيد" : "Set"}
                                    </Button>
                                  </div>
                                </div>
                              )}

                              {commentAuthor && (
                                <>
                                  <div className="p-3 rounded-lg bg-muted/30 text-sm">
                                    <p className="font-medium mb-1">{isAr ? "مراجعة المخرج" : "Review Deliverable"}</p>
                                    <p className="text-muted-foreground text-xs">
                                      {isAr
                                        ? "راجع المحتوى في تاب 'المحتوى' ثم اعتمد أو اطلب تعديلات."
                                        : "Review the content in the 'Content' tab, then approve or request changes."}
                                    </p>
                                  </div>
                                  <ApprovalWidget
                                    deliverableId={d.id}
                                    deliverableTitle={d.title}
                                    token={token}
                                    clientName={commentAuthor}
                                    isAr={isAr}
                                    status={d.status}
                                  />
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Feedback Dialog */}
      <Dialog open={!!feedbackDialog} onOpenChange={(open) => { if (!open) setFeedbackDialog(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isAr ? "إرسال ملاحظات" : "Send Feedback"}</DialogTitle>
            <DialogDescription>{feedbackDialog?.title}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">{isAr ? "التقييم" : "Rating"}</p>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className="p-0.5 transition-transform hover:scale-110"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setFeedbackRating(star)}
                  >
                    <Star className={`h-6 w-6 transition-colors ${star <= (hoverRating || feedbackRating) ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30"}`} />
                  </button>
                ))}
                {feedbackRating > 0 && <span className="text-sm text-muted-foreground ms-2">{feedbackRating}/5</span>}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">{isAr ? "ملاحظاتك" : "Your Feedback"}</p>
              <Textarea
                value={feedbackComment}
                onChange={(e) => setFeedbackComment(e.target.value)}
                placeholder={isAr ? "شاركنا رأيك..." : "Share your thoughts..."}
                rows={4}
              />
            </div>
            <Button
              onClick={() => {
                if (!feedbackDialog || !feedbackComment.trim()) return;
                feedbackMutation.mutate({
                  token,
                  deliverableId: feedbackDialog.deliverableId,
                  comment: feedbackComment,
                  rating: feedbackRating || undefined,
                });
              }}
              disabled={!feedbackComment.trim() || feedbackMutation.isPending}
              className="w-full"
            >
              {feedbackMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ThumbsUp className="h-4 w-4 mr-2" />}
              {isAr ? "إرسال" : "Submit Feedback"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <div className="text-center py-6 space-y-2">
        <Separator />
        <div className="flex items-center justify-center gap-2 pt-4">
          <img
            src="https://d2xsxph8kpxj0f.cloudfront.net/310519663371561184/TgSL8MhgJ4oMR4dsotVnRS/wzrd-ai-logo_a6bceffd.png"
            alt="Wzrd AI"
            className="w-6 h-6 rounded"
          />
          <span className="text-sm text-muted-foreground">
            {isAr ? "مدعوم بواسطة Wzrd AI — هندسة العلامات التجارية بالذكاء الاصطناعي" : "Powered by Wzrd AI — AI-Powered Brand Engineering"}
          </span>
        </div>
      </div>
    </div>
  );
}
