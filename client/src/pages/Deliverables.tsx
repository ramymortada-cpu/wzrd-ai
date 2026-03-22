import { EmptyState } from "@/components/EmptyState";
import { PageSkeleton } from "@/components/PageSkeleton";
import { trpc } from "@/lib/trpc";
import { useI18n } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  CheckCircle2, Clock, Sparkles, Eye, FileText, Filter, Loader2, ArrowRight,
  Download, FileDown, Image, ShieldCheck, MessageSquare, AlertTriangle, Star,
  Wand2, Zap, LayoutTemplate, Palette
} from "lucide-react";
import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { Streamdown } from "streamdown";
import { paginatedData } from "@/lib/utils";

const statusColors: Record<string, string> = {
  pending: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
  in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  ai_generated: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  review: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  delivered: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

const stageColors: Record<string, string> = {
  diagnose: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  design: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  deploy: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  optimize: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
};

const STATUS_KEYS = ["pending", "in_progress", "ai_generated", "review", "approved", "delivered"] as const;

type QualityItem = { label: string; checked: boolean };
function toQualityItems(raw: unknown): QualityItem[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.map((x: unknown) =>
      typeof x === "string" ? { label: x, checked: false } : { label: (x as { item?: string; label?: string }).item ?? (x as { item?: string; label?: string }).label ?? "", checked: (x as { checked?: boolean }).checked ?? false }
    );
  }
  return [];
}

export default function DeliverablesPage() {
  const { t } = useI18n();
  const [, setLocation] = useLocation();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewContent, setViewContent] = useState<{ title: string; content: string; fileUrl?: string | null; imageUrls?: string[] | null } | null>(null);
  const [qualityDialog, setQualityDialog] = useState<{ id: number; title: string; checklist: QualityItem[]; score: number } | null>(null);
  const [reviewDialog, setReviewDialog] = useState<{ id: number; title: string; notes: string } | null>(null);
  const [imageDialog, setImageDialog] = useState<{ id: number; projectId: number; title: string } | null>(null);
  const [imagePrompts, setImagePrompts] = useState<string[]>(["Mood board with color palette and visual direction"]);
  const [generateAllDialog, setGenerateAllDialog] = useState<{ id: number; projectId: number; title: string } | null>(null);
  const [additionalContext, setAdditionalContext] = useState("");
  const utils = trpc.useUtils();

  const { data: allDeliverables, isLoading } = trpc.deliverables.list.useQuery();
  const { data: allProjects } = trpc.projects.list.useQuery();
  const { data: clients } = trpc.clients.list.useQuery();

  const clientsList = paginatedData(clients);
  const projectsList = paginatedData(allProjects);

  // Enrich deliverables with project/client info
  const allDels = useMemo(() => {
    if (!allDeliverables) return [];
    return (allDeliverables as { projectId: number; status?: string; qualityScore?: number; fileUrl?: string }[]).map((d: any) => {
      const proj = (projectsList as { id: number; name?: string; clientId?: number }[]).find((p: any) => p.id === d.projectId);
      return { ...d, projectName: proj?.name, clientId: proj?.clientId, proj };
    });
  }, [allDeliverables, projectsList]);

  const filtered = statusFilter === "all" ? allDels : allDels.filter((d: any) => d.status === statusFilter);

  const updateMutation = trpc.deliverables.update.useMutation({
    onSuccess: () => {
      utils.deliverables.list.invalidate();
      toast.success(t("common.success"));
    },
  });

  const generatePDFMutation = trpc.deliverables.generatePDF.useMutation({
    onSuccess: (data) => {
      utils.deliverables.list.invalidate();
      toast.success(`PDF generated (${data.pageCount} pages)`);
      window.open(data.url, "_blank");
    },
    onError: (err) => toast.error(err.message),
  });

  const generateImagesMutation = trpc.deliverables.generateImages.useMutation({
    onSuccess: (data: { imageUrls: string[] }) => {
      utils.deliverables.list.invalidate();
      toast.success(`${data.imageUrls.length} image(s) generated`);
      setImageDialog(null);
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : String(err)),
  });

  const generateSmartImagesMutation = trpc.deliverables.generateImages.useMutation({
    onSuccess: (data: { imageUrls: string[] }) => {
      utils.deliverables.list.invalidate();
      toast.success(`${data.imageUrls.length} smart image(s) generated`);
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : String(err)),
  });

  const generateFromTemplateMutation = trpc.deliverables.generateWithAI.useMutation({
    onSuccess: () => {
      utils.deliverables.list.invalidate();
      toast.success("Generated from template");
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : String(err)),
  });

  const generateAllMutation = trpc.deliverables.generateWithAI.useMutation({
    onSuccess: () => {
      utils.deliverables.list.invalidate();
      toast.success("Generation complete");
      setGenerateAllDialog(null);
      setAdditionalContext("");
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : String(err)),
  });

  const initQualityMutation = trpc.deliverables.initQualityGate.useMutation({
    onSuccess: () => {
      utils.deliverables.list.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateQualityMutation = trpc.deliverables.updateQualityGate.useMutation({
    onSuccess: (data: { score: number }) => {
      utils.deliverables.list.invalidate();
      if (data.score >= 70) {
        toast.success("Quality gate passed! Deliverable approved.");
      } else {
        toast.info(`Quality score: ${data.score}%`);
      }
      setQualityDialog(null);
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : String(err)),
  });

  const addReviewMutation = trpc.deliverables.addReviewNotes.useMutation({
    onSuccess: () => {
      utils.deliverables.list.invalidate();
      toast.success("Review notes saved");
      setReviewDialog(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const pendingCount = allDels.filter((d: any) => d.status === "pending").length;
  const inProgressCount = allDels.filter((d: any) => d.status === "in_progress" || d.status === "ai_generated").length;
  const completedCount = allDels.filter((d: any) => d.status === "approved" || d.status === "delivered").length;
  const withPDF = allDels.filter((d: any) => d.fileUrl).length;
  const avgQuality = allDels.filter((d: any) => d.qualityScore).reduce((sum: number, d: any) => sum + (d.qualityScore || 0), 0) / (allDels.filter((d: any) => d.qualityScore).length || 1);

  const isAnyGenerating = generateAllMutation.isPending || generateFromTemplateMutation.isPending || generateSmartImagesMutation.isPending;

  if (isLoading) {
    return <PageSkeleton />;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">{t("deliverables.title")}</h1>
        <p className="text-muted-foreground text-sm mt-0.5">{t("deliverables.subtitle")}</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 sm:gap-3">
        <Card className="shadow-sm">
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-semibold">{pendingCount}</p>
            <p className="text-xs text-muted-foreground mt-1">{t("deliverable.pending")}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-semibold text-blue-600 dark:text-blue-400">{inProgressCount}</p>
            <p className="text-xs text-muted-foreground mt-1">In Progress</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400">{completedCount}</p>
            <p className="text-xs text-muted-foreground mt-1">{t("deliverable.approved")}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-semibold text-primary">{withPDF}</p>
            <p className="text-xs text-muted-foreground mt-1">PDF Ready</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-semibold text-amber-600">{Math.round(avgQuality)}%</p>
            <p className="text-xs text-muted-foreground mt-1">Avg Quality</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("common.all")}</SelectItem>
            {STATUS_KEYS.map(k => (
              <SelectItem key={k} value={k}>{t(`deliverable.${k}`)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Deliverables List */}
      {filtered.length === 0 ? (
        <EmptyState type="deliverables" onAction={() => setLocation('/projects')} />
      ) : (
        <div className="space-y-3">
          {filtered.map((del: any) => {
            const client = (clientsList as any[]).find((c: any) => c.id === del.clientId);
            const hasContent = !!del.content;
            const hasPDF = !!del.fileUrl;
            const hasImages = Array.isArray(del.imageUrls) && (del.imageUrls as string[]).length > 0;
            const hasQuality = !!del.qualityChecklist;
            const qualityScore = del.qualityScore || 0;

            return (
              <Card key={del.id} className="shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    {/* Left: Info */}
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      {del.status === "delivered" || del.status === "approved" ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      ) : del.status === "ai_generated" ? (
                        <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                      ) : del.status === "review" ? (
                        <ShieldCheck className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      ) : (
                        <Clock className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{del.title}</p>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          <Badge variant="outline" className={`text-[10px] ${statusColors[del.status] || ""}`}>
                            {t(`deliverable.${del.status}`)}
                          </Badge>
                          <Badge variant="outline" className={`text-[10px] ${stageColors[del.stage] || ""}`}>
                            {del.stage}
                          </Badge>
                          {del.aiGenerated ? (
                            <Badge variant="outline" className="text-[10px] bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400">
                              <Sparkles className="h-2.5 w-2.5 mr-0.5" /> AI
                            </Badge>
                          ) : null}
                          {hasPDF && (
                            <Badge variant="outline" className="text-[10px] bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400">
                              <FileDown className="h-2.5 w-2.5 mr-0.5" /> PDF
                            </Badge>
                          )}
                          {hasImages && (
                            <Badge variant="outline" className="text-[10px] bg-sky-50 text-sky-600 dark:bg-sky-900/20 dark:text-sky-400">
                              <Image className="h-2.5 w-2.5 mr-0.5" /> {(del.imageUrls as string[]).length} Images
                            </Badge>
                          )}
                          {hasQuality && (
                            <Badge variant="outline" className={`text-[10px] ${qualityScore >= 80 ? "bg-emerald-50 text-emerald-600" : qualityScore >= 50 ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-600"}`}>
                              <ShieldCheck className="h-2.5 w-2.5 mr-0.5" /> {qualityScore}%
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          {del.projectName} {client ? `· ${(client as { companyName?: string; name?: string }).companyName || (client as { companyName?: string; name?: string }).name}` : ""}
                        </p>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-1 shrink-0 flex-wrap justify-end">
                      {/* ONE-CLICK GENERATE ALL — the star feature */}
                      {!hasContent && (
                        <Button
                          size="sm"
                          className="h-7 text-xs bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                          disabled={isAnyGenerating}
                          onClick={() => setGenerateAllDialog({ id: del.id, projectId: del.projectId, title: del.title })}
                        >
                          <Zap className="h-3 w-3 mr-1" /> Generate All
                        </Button>
                      )}
                      {/* Generate from Template (if no content yet) */}
                      {!hasContent && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          disabled={isAnyGenerating}
                          onClick={() => {
                            const proj = del.proj as { stage?: string; serviceType?: string } | undefined;
                            generateFromTemplateMutation.mutate({
                              deliverableId: del.id,
                              projectId: del.projectId,
                              title: del.title,
                              stage: proj?.stage ?? "diagnose",
                              serviceType: proj?.serviceType ?? "consultation",
                              clientId: del.clientId,
                            });
                          }}
                        >
                          {generateFromTemplateMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <LayoutTemplate className="h-3 w-3 mr-1" />}
                          Template
                        </Button>
                      )}
                      {/* View Content */}
                      {hasContent && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewContent({ title: del.title, content: del.content || "", fileUrl: del.fileUrl, imageUrls: del.imageUrls as string[] | null })}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      {/* Download PDF */}
                      {hasPDF && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => window.open(del.fileUrl!, "_blank")}>
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                      {/* Generate PDF */}
                      {hasContent && !hasPDF && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-primary"
                          disabled={generatePDFMutation.isPending}
                          onClick={() => {
                            generatePDFMutation.mutate({
                              deliverableId: del.id,
                              content: del.content || "",
                              title: del.title,
                            });
                          }}
                        >
                          {generatePDFMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
                        </Button>
                      )}
                      {/* Smart Image Generation */}
                      {hasContent && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-pink-600"
                          disabled={generateSmartImagesMutation.isPending}
                          onClick={() => {
                            generateSmartImagesMutation.mutate({
                              deliverableId: del.id,
                              prompts: ["Professional brand mood board with color palette and visual direction"],
                            });
                          }}
                          title="Smart Image Generation (auto-prompts)"
                        >
                          {generateSmartImagesMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Palette className="h-4 w-4" />}
                        </Button>
                      )}
                      {/* Manual Image Generation */}
                      {hasContent && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-sky-600"
                          onClick={() => setImageDialog({ id: del.id, projectId: del.projectId, title: del.title })}
                          title="Custom Image Generation"
                        >
                          <Image className="h-4 w-4" />
                        </Button>
                      )}
                      {/* Quality Gate */}
                      {hasContent && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 ${hasQuality ? (qualityScore >= 80 ? "text-emerald-600" : "text-amber-600") : "text-muted-foreground"}`}
                          onClick={() => {
                            if (hasQuality) {
                              setQualityDialog({ id: del.id, title: del.title, checklist: toQualityItems(del.qualityChecklist), score: qualityScore });
                            } else {
                              initQualityMutation.mutate({ deliverableId: del.id, title: del.title });
                            }
                          }}
                        >
                          <ShieldCheck className="h-4 w-4" />
                        </Button>
                      )}
                      {/* Review Notes */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setReviewDialog({ id: del.id, title: del.title, notes: del.reviewNotes || "" })}
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Generate All Dialog */}
      <Dialog open={!!generateAllDialog} onOpenChange={() => { setGenerateAllDialog(null); setAdditionalContext(""); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-purple-600" /> One-Click Generate All
            </DialogTitle>
            <DialogDescription>{generateAllDialog?.title}</DialogDescription>
          </DialogHeader>
          {generateAllDialog && (
            <div className="space-y-4">
              <div className="rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 p-4 space-y-2">
                <p className="text-sm font-medium">This will automatically:</p>
                <div className="space-y-1.5 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <LayoutTemplate className="h-3.5 w-3.5 text-purple-600" />
                    <span><strong>Step 1:</strong> Match & populate the right template with AI</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileDown className="h-3.5 w-3.5 text-red-600" />
                    <span><strong>Step 2:</strong> Generate branded PDF document</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Palette className="h-3.5 w-3.5 text-pink-600" />
                    <span><strong>Step 3:</strong> Generate smart visual assets</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                    <span><strong>Step 4:</strong> Initialize quality gate checklist</span>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Additional Context (optional)</label>
                <Textarea
                  maxLength={50000}
                  value={additionalContext}
                  onChange={(e) => setAdditionalContext(e.target.value)}
                  placeholder="Any specific requirements, preferences, or notes for this deliverable..."
                  rows={3}
                />
              </div>
              <Button
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                disabled={generateAllMutation.isPending}
                onClick={() => {
                  const proj = (projectsList as any[]).find((p: any) => p.id === generateAllDialog.projectId) as { stage?: string; serviceType?: string } | undefined;
                  generateAllMutation.mutate({
                    deliverableId: generateAllDialog.id,
                    projectId: generateAllDialog.projectId,
                    title: generateAllDialog.title,
                    stage: proj?.stage ?? "diagnose",
                    serviceType: proj?.serviceType ?? "consultation",
                    clientContext: additionalContext || undefined,
                  });
                }}
              >
                {generateAllMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Generating (this may take 30-60s)...</>
                ) : (
                  <><Zap className="h-4 w-4 mr-1.5" /> Generate Everything</>
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Content Dialog */}
      <Dialog open={!!viewContent} onOpenChange={() => setViewContent(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{viewContent?.title}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="prose dark:prose-invert max-w-none text-sm">
              <Streamdown>{viewContent?.content || ""}</Streamdown>
            </div>
            {/* Images */}
            {viewContent?.imageUrls && (viewContent.imageUrls as string[]).length > 0 && (
              <div className="mt-4 border-t pt-4">
                <p className="text-sm font-medium mb-2 flex items-center gap-1.5">
                  <Image className="h-4 w-4" /> Generated Images
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {(viewContent.imageUrls as string[]).map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                      <img src={url} alt={`Asset ${i + 1}`} className="rounded-lg border hover:ring-2 ring-primary transition-all" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </ScrollArea>
          <DialogFooter>
            {viewContent?.fileUrl && (
              <Button variant="outline" onClick={() => window.open(viewContent.fileUrl!, "_blank")}>
                <Download className="h-4 w-4 mr-1.5" /> Download PDF
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quality Gate Dialog */}
      <Dialog open={!!qualityDialog} onOpenChange={() => setQualityDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" /> Quality Gate
            </DialogTitle>
            <DialogDescription>{qualityDialog?.title}</DialogDescription>
          </DialogHeader>
          {qualityDialog && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Progress value={qualityDialog.score} className="flex-1" />
                <span className={`text-sm font-semibold ${qualityDialog.score >= 80 ? "text-emerald-600" : qualityDialog.score >= 50 ? "text-amber-600" : "text-red-600"}`}>
                  {qualityDialog.score}%
                </span>
              </div>
              <div className="space-y-2">
                {qualityDialog.checklist.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2 p-2 rounded hover:bg-muted/50 transition-colors">
                    <Checkbox
                      checked={item.checked}
                      onCheckedChange={(checked) => {
                        const newChecklist = [...qualityDialog.checklist];
                        newChecklist[idx] = { ...item, checked: !!checked };
                        const score = Math.round((newChecklist.filter(i => i.checked).length / newChecklist.length) * 100);
                        setQualityDialog({ ...qualityDialog, checklist: newChecklist, score });
                      }}
                    />
                    <span className={`text-sm ${item.checked ? "line-through text-muted-foreground" : ""}`}>{item.label}</span>
                  </div>
                ))}
              </div>
              <Button
                className="w-full"
                disabled={updateQualityMutation.isPending}
                onClick={() => {
                  updateQualityMutation.mutate({
                    deliverableId: qualityDialog.id,
                    checklist: qualityDialog.checklist.map((q: QualityItem) => ({ item: q.label, checked: q.checked })),
                  });
                }}
              >
                {updateQualityMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <ShieldCheck className="h-4 w-4 mr-1.5" />}
                Save Quality Check
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Review Notes Dialog */}
      <Dialog open={!!reviewDialog} onOpenChange={() => setReviewDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" /> Internal Review Notes
            </DialogTitle>
            <DialogDescription>{reviewDialog?.title}</DialogDescription>
          </DialogHeader>
          {reviewDialog && (
            <div className="space-y-4">
              <Textarea
                  maxLength={50000}
                value={reviewDialog.notes}
                onChange={(e) => setReviewDialog({ ...reviewDialog, notes: e.target.value })}
                placeholder="Add internal review notes, feedback, or observations..."
                rows={6}
              />
              <Button
                className="w-full"
                disabled={addReviewMutation.isPending}
                onClick={() => {
                  addReviewMutation.mutate({
                    deliverableId: reviewDialog.id,
                    notes: reviewDialog.notes,
                  });
                }}
              >
                {addReviewMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
                Save Notes
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Image Generation Dialog */}
      <Dialog open={!!imageDialog} onOpenChange={() => setImageDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Image className="h-5 w-5" /> Custom Image Generation
            </DialogTitle>
            <DialogDescription>{imageDialog?.title}</DialogDescription>
          </DialogHeader>
          {imageDialog && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Enter custom prompts for images. For auto-generated smart prompts, use the <Palette className="h-3 w-3 inline text-pink-600" /> button instead.</p>
              {imagePrompts.map((prompt, idx) => (
                <div key={idx} className="flex gap-2">
                  <Textarea
                  maxLength={50000}
                    value={prompt}
                    onChange={(e) => {
                      const newPrompts = [...imagePrompts];
                      newPrompts[idx] = e.target.value;
                      setImagePrompts(newPrompts);
                    }}
                    placeholder="Describe the image to generate..."
                    rows={2}
                    className="flex-1"
                  />
                  {imagePrompts.length > 1 && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 mt-1" onClick={() => setImagePrompts(imagePrompts.filter((_, i) => i !== idx))}>
                      <AlertTriangle className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => setImagePrompts([...imagePrompts, ""])}>
                + Add Another Prompt
              </Button>
              <Button
                className="w-full"
                disabled={generateImagesMutation.isPending}
                onClick={() => {
                  const validPrompts = imagePrompts.filter(p => p.trim());
                  if (validPrompts.length === 0) {
                    toast.error("Please enter at least one prompt");
                    return;
                  }
                  generateImagesMutation.mutate({
                    deliverableId: imageDialog.id,
                    prompts: validPrompts,
                  });
                }}
              >
                {generateImagesMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Generating...</>
                ) : (
                  <><Image className="h-4 w-4 mr-1.5" /> Generate {imagePrompts.filter(p => p.trim()).length} Image(s)</>
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
