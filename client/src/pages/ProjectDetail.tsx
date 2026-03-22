import { trpc } from "@/lib/trpc";
import { useI18n } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  ArrowLeft, Sparkles, CheckCircle2, Clock, Eye, FileText, Loader2,
  ChevronRight, AlertCircle, Edit3
} from "lucide-react";
import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { Streamdown } from "streamdown";
import { paginatedData } from "@/lib/utils";

const STAGE_COLORS: Record<string, string> = {
  diagnose: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  design: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  deploy: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  optimize: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  completed: "bg-primary/10 text-primary",
};

const STATUS_ICON_COLORS: Record<string, string> = {
  pending: "text-muted-foreground",
  in_progress: "text-blue-500",
  ai_generated: "text-purple-500",
  review: "text-amber-500",
  approved: "text-emerald-500",
  delivered: "text-primary",
};

const STAGES = ["diagnose", "design", "deploy", "optimize", "completed"] as const;

export default function ProjectDetailPage() {
  const { t, locale } = useI18n();
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const projectId = Number(params.id);
  const [viewContent, setViewContent] = useState<{ title: string; content: string } | null>(null);
  const [editContent, setEditContent] = useState<{ id: number; title: string; content: string } | null>(null);
  const [genContext, setGenContext] = useState("");
  const [genDialogId, setGenDialogId] = useState<number | null>(null);

  const utils = trpc.useUtils();
  const { data: project, isLoading } = trpc.projects.getById.useQuery({ id: projectId });
  const { data: deliverablesList, isLoading: delLoading } = trpc.deliverables.getByProject.useQuery({ projectId });
  const { data: clients } = trpc.clients.list.useQuery();

  const updateProjectMutation = trpc.projects.update.useMutation({
    onSuccess: () => {
      utils.projects.getById.invalidate({ id: projectId });
      utils.projects.list.invalidate();
      utils.dashboard.stats.invalidate();
      toast.success(t("common.success"));
    },
  });

  const updateDeliverableMutation = trpc.deliverables.update.useMutation({
    onSuccess: () => {
      utils.deliverables.getByProject.invalidate({ projectId });
      toast.success(t("common.success"));
    },
  });

  const generateMutation = trpc.deliverables.generateWithAI.useMutation({
    onSuccess: () => {
      utils.deliverables.getByProject.invalidate({ projectId });
      setGenDialogId(null);
      setGenContext("");
      toast.success(t("ai.savedToProject"));
    },
    onError: (err) => toast.error(err.message),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <AlertCircle className="h-8 w-8 text-muted-foreground" />
        <p className="text-muted-foreground">{locale === "ar" ? "المشروع غير موجود" : "Project not found"}</p>
        <Button variant="outline" onClick={() => setLocation("/projects")}>{t("common.back")}</Button>
      </div>
    );
  }

  const clientsList = paginatedData(clients);
  const client = (clientsList as any[]).find((c: any) => c.id === project.clientId);
  const currentStageIndex = STAGES.indexOf(project.stage as any);
  const completedDels = deliverablesList?.filter((d: any) => d.status === "delivered" || d.status === "approved").length || 0;
  const totalDels = deliverablesList?.length || 0;

  // Group deliverables by stage
  const delsByStage = deliverablesList?.reduce((acc: any, del: any) => {
    if (!acc[del.stage]) acc[del.stage] = [];
    acc[del.stage].push(del);
    return acc;
  }, {} as Record<string, typeof deliverablesList>) || {};

  return (
    <div className="space-y-4 sm:space-y-6 max-w-4xl mx-auto px-2 sm:px-0">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/projects")} className="shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight truncate">{project.name}</h1>
          <p className="text-sm text-muted-foreground">
            {client?.companyName || client?.name} · {t(`service.${project.serviceType}`)}
          </p>
        </div>
        <Badge className={`${STAGE_COLORS[project.stage]} border-0`}>
          {t(`stage.${project.stage}`)}
        </Badge>
      </div>

      {/* 4D Framework Progress */}
      <Card className="shadow-sm">
        <CardContent className="pt-6">
          <div className="flex items-center gap-1 mb-4">
            {STAGES.filter(s => s !== "completed").map((stage, idx) => {
              const isActive = stage === project.stage;
              const isCompleted = idx < currentStageIndex;
              return (
                <div key={stage} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex items-center gap-1">
                    <div
                      className={`flex-1 h-2 rounded-full transition-all ${
                        isCompleted ? "bg-primary" : isActive ? "bg-primary/50" : "bg-muted"
                      }`}
                    />
                    {idx < 3 && <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />}
                  </div>
                  <span className={`text-xs font-medium ${
                    isActive ? "text-primary" : isCompleted ? "text-foreground" : "text-muted-foreground"
                  }`}>
                    {t(`stage.${stage}`)}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-2">
            <Select
              value={project.stage}
              onValueChange={(v: any) => updateProjectMutation.mutate({ id: projectId, stage: v })}
            >
              <SelectTrigger className="w-44 h-9 text-sm bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STAGES.map((s) => (
                  <SelectItem key={s} value={s}>{t(`stage.${s}`)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={project.status}
              onValueChange={(v: any) => updateProjectMutation.mutate({ id: projectId, status: v })}
            >
              <SelectTrigger className="w-36 h-9 text-sm bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["active", "paused", "completed", "cancelled"].map((s) => (
                  <SelectItem key={s} value={s}>{t(`status.${s}`)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {project.price && (
              <div className="ms-auto flex items-center gap-1 text-sm font-medium text-primary">
                {Number(project.price).toLocaleString()} {t("common.egp")}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Deliverables */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <CardTitle className="text-base font-medium">{t("projectDetail.deliverables")}</CardTitle>
            <span className="text-xs text-muted-foreground">
              {completedDels}/{totalDels} {t("status.completed").toLowerCase()}
            </span>
          </div>
          {totalDels > 0 && (
            <div className="w-full h-1.5 rounded-full bg-muted mt-2">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${(completedDels / totalDels) * 100}%` }}
              />
            </div>
          )}
        </CardHeader>
        <CardContent>
          {delLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : !deliverablesList?.length ? (
            <p className="text-sm text-muted-foreground text-center py-8">{t("projectDetail.noDeliverables")}</p>
          ) : (
            <div className="space-y-6">
              {STAGES.filter(s => s !== "completed").map((stage) => {
                const stageDels = delsByStage[stage];
                if (!stageDels?.length) return null;
                return (
                  <div key={stage}>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge className={`${STAGE_COLORS[stage]} border-0 text-xs`}>
                        {t(`stage.${stage}`)}
                      </Badge>
                      <div className="flex-1 h-px bg-border" />
                    </div>
                    <div className="space-y-2">
                      {stageDels.map((del: any) => (
                        <div key={del.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 transition-colors">
                          <div className="flex items-center gap-3 min-w-0">
                            {del.status === "delivered" || del.status === "approved" ? (
                              <CheckCircle2 className={`h-4 w-4 ${STATUS_ICON_COLORS[del.status]} shrink-0`} />
                            ) : del.status === "ai_generated" ? (
                              <Sparkles className={`h-4 w-4 ${STATUS_ICON_COLORS[del.status]} shrink-0`} />
                            ) : (
                              <Clock className={`h-4 w-4 ${STATUS_ICON_COLORS[del.status]} shrink-0`} />
                            )}
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{del.title}</p>
                              {del.description && (
                                <p className="text-xs text-muted-foreground truncate">{del.description}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <Select
                              value={del.status}
                              onValueChange={(v: any) => updateDeliverableMutation.mutate({ id: del.id, status: v })}
                            >
                              <SelectTrigger className="h-7 text-[11px] w-28 bg-background">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {["pending", "in_progress", "ai_generated", "review", "approved", "delivered"].map((s) => (
                                  <SelectItem key={s} value={s}>{t(`status.${s}`)}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {del.content && (
                              <>
                                <Button variant="ghost" size="icon" className="h-7 w-7"
                                  onClick={() => setViewContent({ title: del.title, content: del.content! })}>
                                  <Eye className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7"
                                  onClick={() => setEditContent({ id: del.id, title: del.title, content: del.content! })}>
                                  <Edit3 className="h-3.5 w-3.5" />
                                </Button>
                              </>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-[11px] gap-1"
                              onClick={() => setGenDialogId(del.id)}
                              disabled={generateMutation.isPending && genDialogId === del.id}
                            >
                              <Sparkles className="h-3 w-3" />
                              {generateMutation.isPending && genDialogId === del.id
                                ? t("ai.thinking")
                                : locale === "ar" ? "توليد" : "Generate"}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Generate Dialog */}
      <Dialog open={genDialogId !== null} onOpenChange={(open) => { if (!open) { setGenDialogId(null); setGenContext(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              {t("projectDetail.generateOne")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {locale === "ar"
                ? "سيقوم الذكاء الاصطناعي بتوليد هذا المخرج باستخدام منهجية Wzrd AI وسياق العميل وجميع الملاحظات المتاحة."
                : "The AI will generate this deliverable using Wzrd AI's methodology, the client's context, and all available notes."}
            </p>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t("projectDetail.addContext")}</label>
              <Textarea
                value={genContext}
                onChange={(e) => setGenContext(e.target.value)}
                placeholder={locale === "ar"
                  ? "أضف أي تعليمات أو سياق إضافي للذكاء الاصطناعي..."
                  : "Add any specific instructions or context for the AI..."}
                rows={4}
                className="bg-background"
              />
            </div>
            <Button
              className="w-full gap-2"
              onClick={() => {
                if (genDialogId) {
                  const del = deliverablesList?.find((d: { id: number; title?: string }) => d.id === genDialogId);
                  generateMutation.mutate({
                    deliverableId: genDialogId,
                    projectId,
                    title: del?.title ?? "Deliverable",
                    stage: project.stage ?? "diagnose",
                    serviceType: project.serviceType ?? "consultation",
                    clientId: project.clientId,
                    clientContext: genContext || undefined,
                  });
                }
              }}
              disabled={generateMutation.isPending}
            >
              {generateMutation.isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> {t("ai.thinking")}</>
              ) : (
                <><Sparkles className="h-4 w-4" /> {t("ai.generateDeliverable")}</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Content Dialog */}
      <Dialog open={viewContent !== null} onOpenChange={(open) => { if (!open) setViewContent(null); }}>
        <DialogContent className="max-w-3xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4" /> {viewContent?.title}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="prose prose-sm dark:prose-invert max-w-none p-1">
              <Streamdown>{viewContent?.content || ""}</Streamdown>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Edit Content Dialog */}
      <Dialog open={editContent !== null} onOpenChange={(open) => { if (!open) setEditContent(null); }}>
        <DialogContent className="max-w-3xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="h-4 w-4" /> {t("projectDetail.editContent")} — {editContent?.title}
            </DialogTitle>
          </DialogHeader>
          <Textarea
            value={editContent?.content || ""}
            onChange={(e) => setEditContent(prev => prev ? { ...prev, content: e.target.value } : null)}
            rows={20}
            className="font-mono text-sm bg-background"
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditContent(null)}>{t("common.cancel")}</Button>
            <Button onClick={() => {
              if (editContent) {
                updateDeliverableMutation.mutate({ id: editContent.id, content: editContent.content });
                setEditContent(null);
              }
            }}>{t("common.save")}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
