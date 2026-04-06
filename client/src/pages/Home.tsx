import { PageSkeleton } from "@/components/PageSkeleton";
import { OnboardingTour } from "@/components/OnboardingTour";
import { trpc } from "@/lib/trpc";
import type { DashboardPipelineRecentRun, ProjectListItem } from "@/lib/routerTypes";
import { useI18n } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { paginatedData } from "@/lib/utils";
import {
  Users, FolderKanban, DollarSign,
  ArrowRight, Plus, Sparkles, BookOpen,
  TrendingUp, Zap, CheckCircle2, XCircle, Clock, Activity,
  Brain, Database, Target, Flame, ExternalLink
} from "lucide-react";

const stageColors: Record<string, string> = {
  diagnose: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  design: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  deploy: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  optimize: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  completed: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
};

const statusIcons: Record<string, { icon: typeof CheckCircle2; color: string }> = {
  completed: { icon: CheckCircle2, color: "text-emerald-500" },
  running: { icon: Activity, color: "text-blue-500 animate-pulse" },
  failed: { icon: XCircle, color: "text-red-500" },
  paused: { icon: Clock, color: "text-amber-500" },
  pending: { icon: Clock, color: "text-gray-400" },
};

export default function Home() {
  const { t, locale } = useI18n();
  const [, setLocation] = useLocation();
  const { data: stats, isLoading } = trpc.dashboard.stats.useQuery();
  const { data: projects } = trpc.projects.list.useQuery();
  const { data: clients } = trpc.clients.list.useQuery();
  const { data: pipelineStats } = trpc.dashboard.pipelineAnalytics.useQuery();
  const { data: leadStats } = trpc.leads.stats.useQuery();
  const { data: funnelStats } = trpc.leads.funnel.useQuery();

  if (isLoading) {
    return <PageSkeleton />;
  }

  const recentProjects = projects?.slice(0, 5) || [];
  const clientsList = paginatedData(clients);

  // Pipeline counts
  const pipeline = {
    diagnose: projects?.filter((p) => p.stage === "diagnose" && p.status === "active").length || 0,
    design: projects?.filter((p) => p.stage === "design" && p.status === "active").length || 0,
    deploy: projects?.filter((p) => p.stage === "deploy" && p.status === "active").length || 0,
    optimize: projects?.filter((p) => p.stage === "optimize" && p.status === "active").length || 0,
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h ${Math.round((seconds % 3600) / 60)}m`;
  };

  return (
    <div className="space-y-6">
      {/* Guided Tour for first-time users */}
      <OnboardingTour isAr={locale === 'ar'} />

      <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl border border-border/80 bg-muted/30 shadow-sm">
        <Badge variant="secondary" className="font-medium px-2.5 py-0.5 border border-border/60">
          {locale === "ar" ? "WZZRD · Command Center" : "WZZRD · Command Center"}
        </Badge>
        <span className="hidden sm:inline text-muted-foreground/50">|</span>
        <a
          href="/wzrd-admin"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 rounded-lg px-2 py-1 hover:bg-indigo-500/10 transition-colors"
        >
          {locale === "ar" ? "WZZRD — لوحة المنتج العام" : "WZZRD — public product admin"}
          <ExternalLink className="h-3 w-3 opacity-70" />
        </a>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("dashboard.title")}</h1>
        <p className="text-muted-foreground mt-1">{t("dashboard.welcome")}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t("dashboard.totalClients")}</p>
                <p className="text-2xl font-semibold mt-1">{stats?.totalClients || 0}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t("dashboard.activeProjects")}</p>
                <p className="text-2xl font-semibold mt-1">{stats?.activeProjects || 0}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <FolderKanban className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t("dashboard.totalRevenue")}</p>
                <p className="text-2xl font-semibold mt-1">
                  {(stats?.totalRevenue || 0).toLocaleString()}
                  <span className="text-sm font-normal text-muted-foreground ms-1">{t("common.egp")}</span>
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t("dashboard.pendingRevenue")}</p>
                <p className="text-2xl font-semibold mt-1">
                  {(stats?.pendingRevenue || 0).toLocaleString()}
                  <span className="text-sm font-normal text-muted-foreground ms-1">{t("common.egp")}</span>
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Growth Engine Strip */}
      {leadStats && (leadStats.total > 0 || true) && (
        <Card className="shadow-sm border-amber-200/50 dark:border-amber-800/30 bg-gradient-to-r from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                <CardTitle className="text-base font-medium">Growth Engine</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setLocation("/leads")} className="text-xs">
                  Leads <ArrowRight className="h-3 w-3 ms-1" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setLocation("/sales-funnel")} className="text-xs">
                  Funnel <ArrowRight className="h-3 w-3 ms-1" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              <div className="rounded-lg bg-white/60 dark:bg-white/5 p-3 text-center">
                <p className="text-2xl font-semibold">{leadStats?.total || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Total Leads</p>
              </div>
              <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-3 text-center">
                <div className="flex items-center justify-center gap-1">
                  <Flame className="h-4 w-4 text-red-500" />
                  <p className="text-2xl font-semibold text-red-600 dark:text-red-400">{leadStats?.hot || 0}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Hot Leads</p>
              </div>
              <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 p-3 text-center">
                <p className="text-2xl font-semibold text-amber-600 dark:text-amber-400">{leadStats?.warm || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Warm Leads</p>
              </div>
              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 p-3 text-center">
                <p className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400">{leadStats?.converted || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Converted</p>
              </div>
              <div className="rounded-lg bg-primary/5 p-3 text-center">
                <p className="text-2xl font-semibold text-primary">{(leadStats?.totalValue || 0).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">Pipeline (EGP)</p>
              </div>
            </div>
            {/* Mini Funnel */}
            {funnelStats && (
              <div className="mt-4 flex items-center gap-1 overflow-x-auto">
                {[
                  { key: 'new', label: 'New', count: funnelStats.new, color: 'bg-blue-500' },
                  { key: 'contacted', label: 'Contacted', count: funnelStats.contacted, color: 'bg-cyan-500' },
                  { key: 'qualified', label: 'Qualified', count: funnelStats.qualified, color: 'bg-amber-500' },
                  { key: 'proposalSent', label: 'Proposal', count: funnelStats.proposalSent, color: 'bg-purple-500' },
                  { key: 'converted', label: 'Won', count: funnelStats.converted, color: 'bg-emerald-500' },
                ].map((stage, _i) => (
                  <div key={stage.key} className="flex items-center gap-1 flex-1 min-w-0">
                    <div className={`h-2 rounded-full ${stage.color} flex-1`} style={{ opacity: Math.max(0.2, stage.count / Math.max(1, leadStats?.total || 1)) }} />
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">{stage.count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 4D Pipeline */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">Client Health Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {clientsList.slice(0, 8).map((c) => {
            const activeForClient = (projects ?? []).filter((p) => p.clientId === c.id && p.status === "active").length;
            return (
              <div key={c.id} className="flex items-center justify-between rounded-md border p-2">
                <div className="text-sm font-medium">{c.companyName || c.name}</div>
                <Badge variant={activeForClient > 0 ? "default" : "secondary"}>
                  {activeForClient > 0 ? `${activeForClient} Active` : "No Active Projects"}
                </Badge>
              </div>
            );
          })}
          {clientsList.length === 0 && <p className="text-sm text-muted-foreground">No clients in this workspace.</p>}
        </CardContent>
      </Card>

      {/* 4D Pipeline */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">{t("dashboard.pipeline")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-3">
            {(["diagnose", "design", "deploy", "optimize"] as const).map((stage) => (
              <div key={stage} className="text-center">
                <div className={`rounded-xl py-4 px-3 ${stageColors[stage]}`}>
                  <p className="text-2xl font-semibold">{pipeline[stage]}</p>
                </div>
                <p className="text-xs font-medium mt-2 text-muted-foreground uppercase tracking-wider">
                  {t(`stage.${stage}`)}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Pipeline Analytics */}
      {pipelineStats && pipelineStats.total > 0 && (
        <Card className="shadow-sm border-primary/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                <CardTitle className="text-base font-medium">Wzrd AI Pipeline Analytics</CardTitle>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setLocation("/pipeline")} className="text-xs">
                View All <ArrowRight className="h-3 w-3 ms-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Pipeline Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
              <div className="rounded-lg bg-muted/50 p-3 text-center">
                <p className="text-2xl font-semibold">{pipelineStats.total}</p>
                <p className="text-xs text-muted-foreground mt-1">Total Runs</p>
              </div>
              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 p-3 text-center">
                <p className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400">{pipelineStats.completed}</p>
                <p className="text-xs text-muted-foreground mt-1">Completed</p>
              </div>
              <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-3 text-center">
                <p className="text-2xl font-semibold text-blue-600 dark:text-blue-400">{pipelineStats.running || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Running</p>
              </div>
              <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-3 text-center">
                <p className="text-2xl font-semibold text-red-600 dark:text-red-400">{pipelineStats.failed}</p>
                <p className="text-xs text-muted-foreground mt-1">Failed</p>
              </div>
              <div className="rounded-lg bg-primary/5 p-3 text-center">
                <p className="text-2xl font-semibold text-primary">{pipelineStats.successRate || 0}%</p>
                <p className="text-xs text-muted-foreground mt-1">Success Rate</p>
              </div>
            </div>

            {/* Avg Duration */}
            {pipelineStats.avgDuration > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <Clock className="h-4 w-4" />
                <span>Average pipeline duration: <strong className="text-foreground">{formatDuration(pipelineStats.avgDuration)}</strong></span>
              </div>
            )}

            {/* Recent Pipeline Runs */}
            {pipelineStats.recentRuns && pipelineStats.recentRuns.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Recent Runs</p>
                {pipelineStats.recentRuns.slice(0, 5).map((run: DashboardPipelineRecentRun) => {
                  const statusInfo = statusIcons[run.status] || statusIcons.pending;
                  const StatusIcon = statusInfo.icon;
                  return (
                    <div
                      key={run.id}
                      className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => setLocation("/pipeline")}
                    >
                      <div className="flex items-center gap-3">
                        <StatusIcon className={`h-4 w-4 ${statusInfo.color}`} />
                        <div>
                          <p className="text-sm font-medium">{run.name || `Project #${run.id}`}</p>
                          <p className="text-xs text-muted-foreground">
                            {t(`stage.${run.stage}`)} · {run.status}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs capitalize">
                        {run.status}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Projects */}
        <div className="lg:col-span-2">
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium">{t("dashboard.recentProjects")}</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setLocation("/projects")} className="text-xs">
                  {t("common.viewAll")} <ArrowRight className="h-3 w-3 ms-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {recentProjects.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground text-sm">
                  <FolderKanban className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  {t("dashboard.noProjects")}
                </div>
              ) : (
                <div className="space-y-2">
                  {recentProjects.map((project: ProjectListItem) => (
                    <div
                      key={project.id}
                      className="flex items-center justify-between gap-4 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => setLocation(`/projects/${project.id}`)}
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{project.name}</p>
                        <p className="text-xs text-muted-foreground">{t(`service.${project.serviceType}`)}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge className={`${stageColors[project.stage]} border-0 text-xs`}>
                          {t(`stage.${project.stage}`)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">{t("dashboard.quickActions")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start h-11 text-sm"
              onClick={() => setLocation("/clients")}
            >
              <Plus className="h-4 w-4 me-2 shrink-0 text-primary" />
              <span>{t("dashboard.newClient")}</span>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start h-11 text-sm border-amber-200 dark:border-amber-800/30 hover:bg-amber-50 dark:hover:bg-amber-950/20"
              onClick={() => {
                const url = `${window.location.origin}/quick-check`;
                navigator.clipboard.writeText(url);
                import('sonner').then(m => m.toast.success('Quick-Check link copied!'));
              }}
            >
              <ExternalLink className="h-4 w-4 me-2 shrink-0 text-amber-600" />
              <span>Copy Quick-Check Link</span>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start h-11 text-sm"
              onClick={() => setLocation("/pipeline")}
            >
              <Zap className="h-4 w-4 me-2 shrink-0 text-primary" />
              <span>Launch AI Pipeline</span>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start h-11 text-sm"
              onClick={() => setLocation("/ai")}
            >
              <Sparkles className="h-4 w-4 me-2 shrink-0 text-primary" />
              <span>{t("dashboard.aiAssistant")}</span>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start h-11 text-sm"
              onClick={() => setLocation("/research")}
            >
              <Brain className="h-4 w-4 me-2 shrink-0 text-primary" />
              <span>Research Engine</span>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start h-11 text-sm"
              onClick={() => setLocation("/knowledge")}
            >
              <Database className="h-4 w-4 me-2 shrink-0 text-primary" />
              <span>Knowledge Base</span>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start h-11 text-sm"
              onClick={() => setLocation("/playbooks")}
            >
              <BookOpen className="h-4 w-4 me-2 shrink-0 text-primary" />
              <span>{t("dashboard.viewPlaybooks")}</span>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
