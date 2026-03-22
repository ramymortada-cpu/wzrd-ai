import { EmptyState } from "@/components/EmptyState";
import { PageSkeleton } from "@/components/PageSkeleton";
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { paginatedData } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Activity, AlertTriangle, ArrowDown, ArrowUp, Brain, CheckCircle2,
  ChevronRight, Clock, Eye, Heart, Minus, RefreshCw, Shield, Sparkles,
  Target, TrendingUp, XCircle, Zap, BarChart3, Bell, Loader2
} from "lucide-react";

// ============ TYPES ============

type DimensionKey = "identity" | "positioning" | "messaging" | "visual" | "digitalPresence" | "reputation" | "marketFit";

interface DimensionInfo {
  key: DimensionKey;
  dbKey: string;
  label: string;
  labelAr: string;
  icon: React.ReactNode;
  color: string;
}

const DIMENSIONS: DimensionInfo[] = [
  { key: "identity", dbKey: "identity", label: "Identity", labelAr: "الهوية", icon: <Heart className="w-4 h-4" />, color: "text-rose-500" },
  { key: "positioning", dbKey: "positioning", label: "Positioning", labelAr: "التموضع", icon: <Target className="w-4 h-4" />, color: "text-blue-500" },
  { key: "messaging", dbKey: "messaging", label: "Messaging", labelAr: "الرسائل", icon: <Sparkles className="w-4 h-4" />, color: "text-purple-500" },
  { key: "visual", dbKey: "visual", label: "Visual", labelAr: "البصري", icon: <Eye className="w-4 h-4" />, color: "text-amber-500" },
  { key: "digitalPresence", dbKey: "digital_presence", label: "Digital Presence", labelAr: "الحضور الرقمي", icon: <Activity className="w-4 h-4" />, color: "text-green-500" },
  { key: "reputation", dbKey: "reputation", label: "Reputation", labelAr: "السمعة", icon: <Shield className="w-4 h-4" />, color: "text-cyan-500" },
  { key: "marketFit", dbKey: "market_fit", label: "Market Fit", labelAr: "ملاءمة السوق", icon: <TrendingUp className="w-4 h-4" />, color: "text-orange-500" },
];

// ============ HELPERS ============

function getScoreColor(score: number): string {
  if (score >= 80) return "text-emerald-500";
  if (score >= 60) return "text-blue-500";
  if (score >= 40) return "text-amber-500";
  return "text-red-500";
}

function getScoreBg(score: number): string {
  if (score >= 80) return "bg-emerald-500/10 border-emerald-500/20";
  if (score >= 60) return "bg-blue-500/10 border-blue-500/20";
  if (score >= 40) return "bg-amber-500/10 border-amber-500/20";
  return "bg-red-500/10 border-red-500/20";
}

function getScoreLabel(score: number): string {
  if (score >= 80) return "Strong";
  if (score >= 60) return "Good";
  if (score >= 40) return "Needs Work";
  return "Critical";
}

function getSeverityColor(severity: string): string {
  switch (severity) {
    case "critical": return "bg-red-500/10 text-red-500 border-red-500/20";
    case "warning": return "bg-amber-500/10 text-amber-500 border-amber-500/20";
    case "opportunity": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    default: return "bg-blue-500/10 text-blue-500 border-blue-500/20";
  }
}

function getSeverityIcon(severity: string) {
  switch (severity) {
    case "critical": return <XCircle className="w-4 h-4 text-red-500" />;
    case "warning": return <AlertTriangle className="w-4 h-4 text-amber-500" />;
    case "opportunity": return <Zap className="w-4 h-4 text-emerald-500" />;
    default: return <Bell className="w-4 h-4 text-blue-500" />;
  }
}

// ============ SCORE RING COMPONENT ============

function ScoreRing({ score, size = 120, strokeWidth = 10, label }: { score: number; size?: number; strokeWidth?: number; label?: string }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? "#10b981" : score >= 60 ? "#3b82f6" : score >= 40 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="currentColor" strokeWidth={strokeWidth} fill="none" className="text-muted/20" />
        <circle cx={size / 2} cy={size / 2} r={radius} stroke={color} strokeWidth={strokeWidth} fill="none"
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          className="transition-all duration-1000 ease-out" />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl font-bold" style={{ color }}>{score}</span>
        {label && <span className="text-[10px] text-muted-foreground">{label}</span>}
      </div>
    </div>
  );
}

// ============ DIMENSION BAR ============

function DimensionBar({ dim, score, isRtl }: { dim: DimensionInfo; score: number; isRtl: boolean }) {
  const color = score >= 80 ? "bg-emerald-500" : score >= 60 ? "bg-blue-500" : score >= 40 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-3 py-2">
      <div className={`flex items-center gap-2 w-36 ${isRtl ? "flex-row-reverse" : ""}`}>
        <span className={dim.color}>{dim.icon}</span>
        <span className="text-sm font-medium">{isRtl ? dim.labelAr : dim.label}</span>
      </div>
      <div className="flex-1 h-3 bg-muted/30 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-1000 ease-out ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className={`text-sm font-bold w-10 text-right ${getScoreColor(score)}`}>{score}</span>
    </div>
  );
}

// ============ MAIN PAGE ============

export default function BrandTwin() {
  const { t, locale } = useI18n();
  const isRtl = locale === "ar";

  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [showSnapshotDialog, setShowSnapshotDialog] = useState(false);
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<number | null>(null);

  // Data queries
  const { data: clients, isLoading } = trpc.clients.list.useQuery();
  const { data: dashboard, refetch: refetchDashboard } = trpc.brandTwin.dashboard.useQuery();
  const { data: latestSnapshot, refetch: refetchSnapshot } = trpc.brandTwin.getLatest.useQuery(
    { clientId: selectedClientId! },
    { enabled: !!selectedClientId }
  );
  const { data: history } = trpc.brandTwin.getHistory.useQuery(
    { clientId: selectedClientId! },
    { enabled: !!selectedClientId }
  );
  const { data: alerts, refetch: refetchAlerts } = trpc.brandTwin.getAlerts.useQuery(
    { clientId: selectedClientId! },
    { enabled: !!selectedClientId }
  );
  const { data: allAlerts } = trpc.brandTwin.allAlerts.useQuery({ status: "active" });
  const { data: snapshot } = trpc.brandTwin.getSnapshot.useQuery(
    { id: selectedSnapshotId! },
    { enabled: !!selectedSnapshotId }
  );

  // Mutations
  const runAudit = trpc.brandTwin.runAudit.useMutation({
    onSuccess: () => {
      toast.success(isRtl ? "تم التدقيق بنجاح" : "Brand audit completed!");
      refetchSnapshot();
      refetchDashboard();
      refetchAlerts();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const updateAlert = trpc.brandTwin.updateAlert.useMutation({
    onSuccess: () => {
      refetchAlerts();
      toast.success(isRtl ? "تم التحديث" : "Alert updated");
    },
  });

  const clientList = paginatedData(clients);
  const selectedClient = clientList.find((c: { id: number }) => c.id === selectedClientId);

  if (isLoading) return <PageSkeleton />;

  return (
    <div className={`space-y-6 ${isRtl ? "text-right" : ""}`} dir={isRtl ? "rtl" : "ltr"}>
      {/* Header */}
      <div className={`flex items-center justify-between ${isRtl ? "flex-row-reverse" : ""}`}>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="w-7 h-7 text-primary" />
            {isRtl ? "التوأم الرقمي للعلامة التجارية" : "Brand Digital Twin"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isRtl ? "مراقبة وتقييم صحة العلامة التجارية عبر 7 أبعاد" : "Monitor and evaluate brand health across 7 dimensions"}
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">
            <BarChart3 className="w-4 h-4 mr-1" />
            {isRtl ? "نظرة عامة" : "Overview"}
          </TabsTrigger>
          <TabsTrigger value="client">
            <Target className="w-4 h-4 mr-1" />
            {isRtl ? "تقييم عميل" : "Client Audit"}
          </TabsTrigger>
          <TabsTrigger value="alerts">
            <Bell className="w-4 h-4 mr-1" />
            {isRtl ? "التنبيهات" : "Alerts"}
            {allAlerts && allAlerts.length > 0 && (
              <Badge variant="destructive" className="ml-1 text-[10px] px-1.5">{allAlerts.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ============ OVERVIEW TAB ============ */}
        <TabsContent value="overview" className="space-y-6">
          {dashboard ? (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <Card className="border">
                  <CardContent className="pt-4 pb-3 px-4 text-center">
                    <p className="text-3xl font-bold">{dashboard.totalClients}</p>
                    <p className="text-xs text-muted-foreground mt-1">{isRtl ? "عملاء مُقيَّمين" : "Audited Clients"}</p>
                  </CardContent>
                </Card>
                <Card className="border">
                  <CardContent className="pt-4 pb-3 px-4 text-center">
                    <p className={`text-3xl font-bold ${getScoreColor(dashboard.avgScore)}`}>{dashboard.avgScore}</p>
                    <p className="text-xs text-muted-foreground mt-1">{isRtl ? "متوسط الصحة" : "Avg Health"}</p>
                  </CardContent>
                </Card>
                <Card className="border">
                  <CardContent className="pt-4 pb-3 px-4 text-center">
                    <p className="text-3xl font-bold text-emerald-500">{dashboard.healthy}</p>
                    <p className="text-xs text-muted-foreground mt-1">{isRtl ? "صحي" : "Healthy"}</p>
                  </CardContent>
                </Card>
                <Card className="border">
                  <CardContent className="pt-4 pb-3 px-4 text-center">
                    <p className="text-3xl font-bold text-amber-500">{dashboard.atRisk}</p>
                    <p className="text-xs text-muted-foreground mt-1">{isRtl ? "معرض للخطر" : "At Risk"}</p>
                  </CardContent>
                </Card>
                <Card className="border">
                  <CardContent className="pt-4 pb-3 px-4 text-center">
                    <p className="text-3xl font-bold text-red-500">{dashboard.critical}</p>
                    <p className="text-xs text-muted-foreground mt-1">{isRtl ? "حرج" : "Critical"}</p>
                  </CardContent>
                </Card>
                <Card className="border">
                  <CardContent className="pt-4 pb-3 px-4 text-center">
                    <p className="text-3xl font-bold text-orange-500">{dashboard.activeAlerts}</p>
                    <p className="text-xs text-muted-foreground mt-1">{isRtl ? "تنبيهات نشطة" : "Active Alerts"}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Client Health Grid */}
              {dashboard.clients.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle>{isRtl ? "صحة العملاء" : "Client Health Overview"}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {dashboard.clients.map((client) => {
                        const clientInfo = clientList.find(c => c.id === client.clientId);
                        return (
                          <Card key={client.clientId} className={`border cursor-pointer hover:shadow-md transition-shadow ${getScoreBg(client.overallScore)}`}
                            onClick={() => { setSelectedClientId(client.clientId); setActiveTab("client"); }}>
                            <CardContent className="pt-4 pb-3 px-4">
                              <div className="flex items-center justify-between mb-3">
                                <div>
                                  <p className="font-semibold">{clientInfo?.companyName || clientInfo?.name || `Client #${client.clientId}`}</p>
                                  <p className="text-xs text-muted-foreground">{clientInfo?.industry || "—"}</p>
                                </div>
                                <ScoreRing score={client.overallScore} size={60} strokeWidth={6} />
                              </div>
                              <div className="grid grid-cols-7 gap-1">
                                {DIMENSIONS.map((dim) => {
                                  const score = (client as any)[`${dim.key}Score`] || 0;
                                  const bg = score >= 80 ? "bg-emerald-500" : score >= 60 ? "bg-blue-500" : score >= 40 ? "bg-amber-500" : "bg-red-500";
                                  return (
                                    <div key={dim.key} className="text-center" title={`${dim.label}: ${score}`}>
                                      <div className={`h-1.5 rounded-full ${bg}`} />
                                      <span className="text-[9px] text-muted-foreground">{score}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <EmptyState
                  type="brand"
                  onAction={() => setActiveTab("client")}
                  actionLabel={isRtl ? "ابدأ التقييم" : "Start Audit"}
                />
              )}
            </>
          ) : (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          )}
        </TabsContent>

        {/* ============ CLIENT AUDIT TAB ============ */}
        <TabsContent value="client" className="space-y-6">
          {/* Client Selector */}
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className={`flex items-center gap-4 ${isRtl ? "flex-row-reverse" : ""}`}>
                <Select value={selectedClientId?.toString() || ""} onValueChange={(v) => setSelectedClientId(Number(v))}>
                  <SelectTrigger className="w-72">
                    <SelectValue placeholder={isRtl ? "اختر عميل..." : "Select a client..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {clientList.map(c => (
                      <SelectItem key={c.id} value={c.id.toString()}>
                        {c.companyName || c.name} {c.industry ? `(${c.industry})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedClientId && (
                  <Button onClick={() => runAudit.mutate({ clientId: selectedClientId })} disabled={runAudit.isPending}>
                    {runAudit.isPending ? (
                      <><Loader2 className="w-4 h-4 mr-1 animate-spin" />{isRtl ? "جاري التقييم..." : "Auditing..."}</>
                    ) : (
                      <><RefreshCw className="w-4 h-4 mr-1" />{isRtl ? "تشغيل التقييم" : "Run Audit"}</>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Audit Results */}
          {selectedClientId && latestSnapshot ? (
            <>
              {/* Overall Score + SWOT */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Score Ring */}
                <Card className="lg:col-span-1">
                  <CardContent className="pt-6 flex flex-col items-center">
                    <ScoreRing score={latestSnapshot.overallScore} size={160} strokeWidth={14} label={getScoreLabel(latestSnapshot.overallScore)} />
                    <h3 className="font-bold text-lg mt-4">{selectedClient?.companyName || selectedClient?.name || `Client #${latestSnapshot.clientId}`}</h3>
                    <p className="text-sm text-muted-foreground">{isRtl ? "آخر تقييم" : "Last audit"}: {new Date(latestSnapshot.createdAt).toLocaleDateString()}</p>
                    <Badge className={`mt-2 ${getScoreBg(latestSnapshot.overallScore)}`}>
                      {getScoreLabel(latestSnapshot.overallScore)}
                    </Badge>
                  </CardContent>
                </Card>

                {/* Dimension Bars */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>{isRtl ? "الأبعاد السبعة" : "7 Dimensions"}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {DIMENSIONS.map(dim => {
                      const score = (latestSnapshot as any)[`${dim.key}Score`] || 0;
                      return <DimensionBar key={dim.key} dim={dim} score={score} isRtl={isRtl} />;
                    })}
                  </CardContent>
                </Card>
              </div>

              {/* Summary + SWOT */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{isRtl ? "ملخص التقييم" : "Audit Summary"}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed">{latestSnapshot.summary as string}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>{isRtl ? "تحليل SWOT" : "SWOT Analysis"}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                        <p className="text-xs font-bold text-emerald-600 mb-1">{isRtl ? "نقاط القوة" : "Strengths"}</p>
                        {((latestSnapshot.strengths as string[]) || []).map((s, i) => (
                          <p key={i} className="text-xs text-muted-foreground mb-0.5">• {s}</p>
                        ))}
                      </div>
                      <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                        <p className="text-xs font-bold text-red-600 mb-1">{isRtl ? "نقاط الضعف" : "Weaknesses"}</p>
                        {((latestSnapshot.weaknesses as string[]) || []).map((w, i) => (
                          <p key={i} className="text-xs text-muted-foreground mb-0.5">• {w}</p>
                        ))}
                      </div>
                      <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
                        <p className="text-xs font-bold text-blue-600 mb-1">{isRtl ? "الفرص" : "Opportunities"}</p>
                        {((latestSnapshot.opportunities as string[]) || []).map((o, i) => (
                          <p key={i} className="text-xs text-muted-foreground mb-0.5">• {o}</p>
                        ))}
                      </div>
                      <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
                        <p className="text-xs font-bold text-amber-600 mb-1">{isRtl ? "التهديدات" : "Threats"}</p>
                        {((latestSnapshot.threats as string[]) || []).map((t, i) => (
                          <p key={i} className="text-xs text-muted-foreground mb-0.5">• {t}</p>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Alerts for this client */}
              {alerts && alerts.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="w-5 h-5" />
                      {isRtl ? "التنبيهات" : "Alerts"}
                      <Badge variant="outline">{alerts.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {alerts.slice(0, 10).map((alert: { id: number; severity: string; title: string; description: string; recommendation?: string; status: string }) => (
                        <div key={alert.id} className={`flex items-start gap-3 p-3 rounded-lg border ${getSeverityColor(alert.severity)} ${isRtl ? "flex-row-reverse" : ""}`}>
                          {getSeverityIcon(alert.severity)}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{alert.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{alert.description}</p>
                            {alert.recommendation && (
                              <p className="text-xs mt-1 italic">💡 {alert.recommendation}</p>
                            )}
                          </div>
                          {alert.status === "active" && (
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost" className="h-7 text-xs"
                                onClick={() => updateAlert.mutate({ id: alert.id, status: "acknowledged" })}>
                                <CheckCircle2 className="w-3 h-3" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 text-xs"
                                onClick={() => updateAlert.mutate({ id: alert.id, status: "dismissed" })}>
                                <XCircle className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* History Timeline */}
              {history && history.length > 1 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      {isRtl ? "تاريخ التقييمات" : "Audit History"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {history.map((snap: { id: number; overallScore: number; auditType: string; createdAt: Date | string }, idx: number) => (
                        <div key={snap.id} className={`flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/30 cursor-pointer transition-colors ${isRtl ? "flex-row-reverse" : ""}`}
                          onClick={() => { setSelectedSnapshotId(snap.id); setShowSnapshotDialog(true); }}>
                          <ScoreRing score={snap.overallScore} size={48} strokeWidth={5} />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{isRtl ? "تقييم" : "Audit"} #{history.length - idx}</span>
                              <Badge variant="outline" className="text-[10px]">{snap.auditType}</Badge>
                              {idx === 0 && <Badge className="text-[10px] bg-primary">{isRtl ? "الأحدث" : "Latest"}</Badge>}
                            </div>
                            <p className="text-xs text-muted-foreground">{new Date(snap.createdAt).toLocaleString()}</p>
                          </div>
                          {idx < history.length - 1 && (
                            <div className="flex items-center gap-1">
                              {snap.overallScore > history[idx + 1].overallScore ? (
                                <><ArrowUp className="w-4 h-4 text-emerald-500" /><span className="text-xs text-emerald-500">+{snap.overallScore - history[idx + 1].overallScore}</span></>
                              ) : snap.overallScore < history[idx + 1].overallScore ? (
                                <><ArrowDown className="w-4 h-4 text-red-500" /><span className="text-xs text-red-500">{snap.overallScore - history[idx + 1].overallScore}</span></>
                              ) : (
                                <><Minus className="w-4 h-4 text-muted-foreground" /><span className="text-xs text-muted-foreground">0</span></>
                              )}
                            </div>
                          )}
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : selectedClientId ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Brain className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                <h3 className="font-semibold text-lg mb-2">{isRtl ? "لا يوجد تقييم لهذا العميل" : "No Audit for This Client"}</h3>
                <p className="text-muted-foreground mb-4">
                  {isRtl ? "اضغط 'تشغيل التقييم' لبدء أول تقييم لصحة العلامة التجارية" : "Click 'Run Audit' to start the first brand health assessment"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Target className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                <h3 className="font-semibold text-lg mb-2">{isRtl ? "اختر عميل" : "Select a Client"}</h3>
                <p className="text-muted-foreground">
                  {isRtl ? "اختر عميل من القائمة أعلاه لبدء التقييم" : "Choose a client from the dropdown above to begin"}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ============ ALERTS TAB ============ */}
        <TabsContent value="alerts" className="space-y-4">
          {allAlerts && allAlerts.length > 0 ? (
            <div className="space-y-2">
              {allAlerts.map((alert: any) => (
                <Card key={alert.id} className={`border ${getSeverityColor(alert.severity)}`}>
                  <CardContent className="pt-4 pb-3">
                    <div className={`flex items-start gap-3 ${isRtl ? "flex-row-reverse" : ""}`}>
                      {getSeverityIcon(alert.severity)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm">{alert.clientName}</span>
                          <Badge variant="outline" className="text-[10px]">{alert.dimension}</Badge>
                        </div>
                        <p className="text-sm font-medium">{alert.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{alert.description}</p>
                        {alert.recommendation && (
                          <p className="text-xs mt-1 italic">💡 {alert.recommendation}</p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="h-7 text-xs"
                          onClick={() => updateAlert.mutate({ id: alert.id, status: "resolved" })}>
                          <CheckCircle2 className="w-3 h-3 mr-1" />{isRtl ? "حل" : "Resolve"}
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 text-xs"
                          onClick={() => updateAlert.mutate({ id: alert.id, status: "dismissed" })}>
                          <XCircle className="w-3 h-3 mr-1" />{isRtl ? "تجاهل" : "Dismiss"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500/30 mb-4" />
                <h3 className="font-semibold text-lg mb-2">{isRtl ? "لا توجد تنبيهات نشطة" : "No Active Alerts"}</h3>
                <p className="text-muted-foreground">
                  {isRtl ? "كل العلامات التجارية في حالة جيدة" : "All brands are in good health"}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Snapshot Detail Dialog */}
      <Dialog open={showSnapshotDialog} onOpenChange={setShowSnapshotDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isRtl ? "تفاصيل التقييم" : "Audit Details"}</DialogTitle>
            <DialogDescription>
              {snapshot ? new Date(snapshot.createdAt).toLocaleString() : ""}
            </DialogDescription>
          </DialogHeader>
          {snapshot && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <ScoreRing score={snapshot.overallScore} size={120} strokeWidth={10} label={getScoreLabel(snapshot.overallScore)} />
              </div>
              <div className="space-y-1">
                {DIMENSIONS.map(dim => {
                  const score = (snapshot as any)[`${dim.key}Score`] || 0;
                  return <DimensionBar key={dim.key} dim={dim} score={score} isRtl={isRtl} />;
                })}
              </div>
              {snapshot.summary && (
                <div>
                  <h4 className="font-semibold mb-1">{isRtl ? "الملخص" : "Summary"}</h4>
                  <p className="text-sm text-muted-foreground">{snapshot.summary as string}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
