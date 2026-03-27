import { trpc } from "@/lib/trpc";
import type {
  ClientDiagnosisRow,
  NoteByClientItem,
  NoteCreateCategory,
  PaymentByClientItem,
  ProjectByClientItem,
} from "@/lib/routerTypes";
import { useI18n } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useLocation, useParams } from "wouter";
import { useState } from "react";
import {
  ArrowLeft, Building2, Mail, Phone, Globe, MapPin, Calendar,
  FolderKanban, DollarSign, Sparkles, Plus, Loader2, ExternalLink, Stethoscope,
} from "lucide-react";
import { Streamdown } from "streamdown";

const statusColors: Record<string, string> = {
  lead: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  completed: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
  paused: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
};

const stageColors: Record<string, string> = {
  diagnose: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  design: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  deploy: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  optimize: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  completed: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
};

const paymentStatusColors: Record<string, string> = {
  paid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  overdue: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  cancelled: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
};

export default function ClientDetailPage() {
  const { t } = useI18n();
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const clientId = Number(params.id);

  const { data: client, isLoading: clientLoading } = trpc.clients.getById.useQuery({ id: clientId });
  const { data: projects } = trpc.projects.getByClient.useQuery({ clientId });
  const { data: notes } = trpc.notes.getByClient.useQuery({ clientId });
  const { data: payments } = trpc.payments.getByClient.useQuery({ clientId });
  const { data: toolDiagnoses, isLoading: diagLoading } = trpc.clients.diagnosisForClient.useQuery(
    { clientId },
    { enabled: Boolean(clientId) && Boolean(client?.email) }
  );

  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [noteCategory, setNoteCategory] = useState<NoteCreateCategory>("general");
  const [showAiAnalysis, setShowAiAnalysis] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState("");

  const utils = trpc.useUtils();
  const createNote = trpc.notes.create.useMutation({
    onSuccess: () => {
      utils.notes.getByClient.invalidate({ clientId });
      setShowNoteDialog(false);
      setNoteTitle("");
      setNoteContent("");
      toast.success(t("common.success"));
    },
  });

  const analyzeNotes = trpc.ai.analyzeNotes.useMutation({
    onSuccess: (data) => {
      const text = typeof data.analysis === "string" ? data.analysis : Array.isArray(data.analysis) ? (data.analysis as { type: string; text?: string }[]).map(c => c.text || "").join("") : "";
      setAiAnalysis(text);
      setShowAiAnalysis(true);
    },
  });

  if (clientLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground">Client not found</p>
        <Button variant="outline" onClick={() => setLocation("/clients")}>
          <ArrowLeft className="h-4 w-4 me-2" />
          {t("common.back")}
        </Button>
      </div>
    );
  }

  const totalPaid = payments?.filter((p: PaymentByClientItem) => p.status === "paid").reduce((s, p) => s + Number(p.amount), 0) || 0;
  const totalPending = payments?.filter((p: PaymentByClientItem) => p.status === "pending").reduce((s, p) => s + Number(p.amount), 0) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/clients")} className="mt-1 shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">{client.name}</h1>
              <Badge className={`${statusColors[client.status]} border-0 font-medium`}>
                {t(`status.${client.status}`)}
              </Badge>
            </div>
            {client.companyName && (
              <p className="text-muted-foreground flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" />
                {client.companyName}
              </p>
            )}
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            const notesArr = Array.isArray(notes) ? notes : (notes as unknown as { data?: unknown[] })?.data ?? [];
            const notesText = (notesArr as { title?: string; content?: string }[]).map((n) => `[${n.title ?? ""}] ${n.content ?? ""}`).join("\n\n");
            if (!notesText.trim()) return;
            analyzeNotes.mutate({ notes: notesText, clientId });
          }}
          disabled={analyzeNotes.isPending || !(Array.isArray(notes) ? notes : (notes as unknown as { data?: unknown[] })?.data ?? []).length}
        >
          {analyzeNotes.isPending ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : <Sparkles className="h-4 w-4 me-2" />}
          {t("clientDetail.aiAnalysis")}
        </Button>
      </div>

      {/* AI Analysis Panel */}
      {showAiAnalysis && aiAnalysis && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                {t("clientDetail.aiAnalysis")}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowAiAnalysis(false)}>
                {t("common.close")}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <Streamdown>{aiAnalysis}</Streamdown>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Client Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <MapPin className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{t("clients.market")}</p>
                <p className="font-medium truncate">{t(`market.${client.market}`)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <FolderKanban className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{t("clientDetail.projects")}</p>
                <p className="font-medium">{projects?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                <DollarSign className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{t("financials.totalCollected")}</p>
                <p className="font-medium">{totalPaid.toLocaleString()} {t("common.egp")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                <DollarSign className="h-4 w-4 text-amber-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{t("financials.totalPending")}</p>
                <p className="font-medium">{totalPending.toLocaleString()} {t("common.egp")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="info" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="info">{t("clientDetail.info")}</TabsTrigger>
          <TabsTrigger value="projects">{t("clientDetail.projects")} ({projects?.length || 0})</TabsTrigger>
          <TabsTrigger value="notes">{t("clientDetail.notes")} ({notes?.length || 0})</TabsTrigger>
          <TabsTrigger value="payments">{t("clientDetail.payments")} ({payments?.length || 0})</TabsTrigger>
          <TabsTrigger value="diagnosis" className="gap-1.5">
            <Stethoscope className="h-3.5 w-3.5 opacity-70" />
            {t("clientDetail.diagnosis")} ({toolDiagnoses?.length ?? 0})
          </TabsTrigger>
        </TabsList>

        {/* Info Tab */}
        <TabsContent value="info">
          <Card className="shadow-sm">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {client.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">{t("clients.email")}</p>
                      <p className="font-medium">{client.email}</p>
                    </div>
                  </div>
                )}
                {client.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">{t("clients.phone")}</p>
                      <p className="font-medium">{client.phone}</p>
                    </div>
                  </div>
                )}
                {client.industry && (
                  <div className="flex items-center gap-3">
                    <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">{t("clients.industry")}</p>
                      <p className="font-medium">{client.industry}</p>
                    </div>
                  </div>
                )}
                {client.website && (
                  <div className="flex items-center gap-3">
                    <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">{t("clients.website")}</p>
                      <a href={client.website} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline flex items-center gap-1">
                        {client.website} <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Created</p>
                    <p className="font-medium">{new Date(client.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
              {client.notes && (
                <>
                  <Separator className="my-6" />
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">{t("clients.notes")}</p>
                    <p className="text-sm leading-relaxed">{client.notes}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects">
          <div className="space-y-3">
            {!projects?.length ? (
              <Card className="shadow-sm">
                <CardContent className="py-12 text-center text-muted-foreground">
                  {t("clientDetail.noProjects")}
                </CardContent>
              </Card>
            ) : (
              projects.map((project: ProjectByClientItem) => (
                <Card key={project.id} className="shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => setLocation(`/projects/${project.id}`)}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{project.name}</p>
                        <p className="text-sm text-muted-foreground">{t(`service.${project.serviceType}`)}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge className={`${stageColors[project.stage]} border-0 text-xs`}>
                          {t(`stage.${project.stage}`)}
                        </Badge>
                        <Badge className={`${statusColors[project.status]} border-0 text-xs`}>
                          {t(`status.${project.status}`)}
                        </Badge>
                        {project.price && (
                          <span className="text-sm font-medium text-muted-foreground">
                            {Number(project.price).toLocaleString()} {t("common.egp")}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes">
          <div className="space-y-3">
            <div className="flex justify-end">
              <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 me-1.5" />
                    {t("clientDetail.addNote")}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t("clientDetail.addNote")}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-2">
                    <Input
                      placeholder={t("notes.noteTitle")}
                      value={noteTitle}
                      onChange={(e) => setNoteTitle(e.target.value)}
                    />
                    <Select value={noteCategory} onValueChange={(v) => setNoteCategory(v as NoteCreateCategory)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["diagnostic", "strategic", "meeting", "insight", "general"].map((cat) => (
                          <SelectItem key={cat} value={cat}>{t(`category.${cat}`)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Textarea
                      placeholder={t("notes.content")}
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      rows={5}
                    />
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowNoteDialog(false)}>
                        {t("common.cancel")}
                      </Button>
                      <Button
                        onClick={() => createNote.mutate({ clientId, title: noteTitle, content: noteContent, category: noteCategory })}
                        disabled={!noteTitle || !noteContent || createNote.isPending}
                      >
                        {createNote.isPending ? <Loader2 className="h-4 w-4 animate-spin me-1.5" /> : null}
                        {t("common.save")}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            {!notes?.length ? (
              <Card className="shadow-sm">
                <CardContent className="py-12 text-center text-muted-foreground">
                  {t("clientDetail.noNotes")}
                </CardContent>
              </Card>
            ) : (
              notes.map((note: NoteByClientItem) => (
                <Card key={note.id} className="shadow-sm">
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="min-w-0">
                        <p className="font-medium">{note.title}</p>
                        <p className="text-xs text-muted-foreground">{new Date(note.createdAt).toLocaleDateString()}</p>
                      </div>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {t(`category.${note.category}`)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{note.content}</p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments">
          <div className="space-y-3">
            {!payments?.length ? (
              <Card className="shadow-sm">
                <CardContent className="py-12 text-center text-muted-foreground">
                  {t("clientDetail.noPayments")}
                </CardContent>
              </Card>
            ) : (
              payments.map((payment: PaymentByClientItem) => (
                <Card key={payment.id} className="shadow-sm">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-medium">{payment.description || `Payment #${payment.id}`}</p>
                        <p className="text-xs text-muted-foreground">
                          {payment.dueDate ? new Date(payment.dueDate).toLocaleDateString() : "No due date"}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <Badge className={`${paymentStatusColors[payment.status]} border-0 text-xs`}>
                          {t(`status.${payment.status}`)}
                        </Badge>
                        <span className="font-semibold">
                          {Number(payment.amount).toLocaleString()} {t("common.egp")}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="diagnosis">
          {!client.email ? (
            <Card className="shadow-sm">
              <CardContent className="py-12 text-center text-muted-foreground">
                {t("clientDetail.noDiagnosisEmail")}
              </CardContent>
            </Card>
          ) : diagLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !toolDiagnoses?.length ? (
            <Card className="shadow-sm">
              <CardContent className="py-12 text-center text-muted-foreground">
                {t("clientDetail.noDiagnosis")}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {toolDiagnoses.map((row: ClientDiagnosisRow) => (
                <Card key={row.id} className="shadow-sm border-primary/10">
                  <CardContent className="py-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-xs">
                          {row.toolId}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {row.createdAt ? new Date(row.createdAt).toLocaleString() : ""}
                        </span>
                      </div>
                      <Badge className="bg-primary/15 text-primary border-0">
                        {row.score}/100
                      </Badge>
                    </div>
                    {row.recommendation && (
                      <p className="text-sm text-muted-foreground leading-relaxed">{row.recommendation}</p>
                    )}
                    {Array.isArray(row.findings) && row.findings.length > 0 && (
                      <ul className="text-sm space-y-1.5 list-disc ps-4">
                        {row.findings.slice(0, 5).map((raw, i: number) => {
                          const f = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
                          const title = typeof f.title === "string" ? f.title : "";
                          const detail = typeof f.detail === "string" ? f.detail : "";
                          return (
                          <li key={i}>
                            <span className="font-medium">{title}</span>
                            {detail ? <span className="text-muted-foreground"> — {detail}</span> : null}
                          </li>
                          );
                        })}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
