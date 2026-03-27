import { PageSkeleton } from "@/components/PageSkeleton";
import { trpc } from "@/lib/trpc";
import type { LeadListItem, ProposalListItem } from "@/lib/routerTypes";
import { useI18n } from "@/lib/i18n";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Target, TrendingUp, DollarSign, FileText, Users, ArrowRight,
  Flame, ThermometerSun, Snowflake, CheckCircle2, XCircle, Clock,
} from "lucide-react";
import { paginatedData } from "@/lib/utils";

const SERVICE_LABELS: Record<string, string> = {
  business_health_check: "Business Health Check",
  starting_business_logic: "Clarity Package",
  brand_identity: "Brand Foundation",
  business_takeoff: "Business Takeoff",
  consultation: "Growth Partnership",
};

export default function SalesFunnelPage() {
  const { t } = useI18n();
  const { data: leadStats, isLoading } = trpc.leads.stats.useQuery(undefined, { refetchInterval: 30000 });
  const { data: funnel } = trpc.leads.funnel.useQuery(undefined, { refetchInterval: 30000 });
  const { data: leadsRaw } = trpc.leads.list.useQuery();
  const leads = paginatedData(leadsRaw);
  const { data: proposalsRaw } = trpc.proposals.list.useQuery();
  const proposals = paginatedData(proposalsRaw);
  const { data: dashStats } = trpc.dashboard.stats.useQuery();

  // Calculate funnel metrics
  const totalLeads = leadStats?.total || 0;
  const hotLeads = leadStats?.hot || 0;
  const pipelineValue = leadStats?.totalValue || 0;
  const converted = leadStats?.converted || 0;
  const conversionRate = totalLeads > 0 ? Math.round((converted / totalLeads) * 100) : 0;

  const acceptedProposals = proposals.filter((p: ProposalListItem) => p.status === "accepted");
  const totalProposalValue = proposals.reduce((sum, p) => sum + Number(p.price || 0), 0);
  const acceptedValue = acceptedProposals.reduce((sum, p) => sum + Number(p.price || 0), 0);

  const revenueCollected = Number(dashStats?.totalRevenue || 0);

  // Funnel stages
  const funnelStages = [
    {
      label: "Leads Captured",
      value: totalLeads,
      icon: Target,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-500/10",
      textColor: "text-blue-400",
      width: "100%",
    },
    {
      label: "Contacted",
      value: funnel?.contacted || 0,
      icon: Users,
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-500/10",
      textColor: "text-purple-400",
      width: totalLeads > 0 ? `${Math.max(((funnel?.contacted || 0) / totalLeads) * 100, 15)}%` : "15%",
    },
    {
      label: "Qualified",
      value: funnel?.qualified || 0,
      icon: CheckCircle2,
      color: "from-amber-500 to-amber-600",
      bgColor: "bg-amber-500/10",
      textColor: "text-amber-400",
      width: totalLeads > 0 ? `${Math.max(((funnel?.qualified || 0) / totalLeads) * 100, 15)}%` : "15%",
    },
    {
      label: "Proposal Sent",
      value: funnel?.proposalSent || 0,
      icon: FileText,
      color: "from-orange-500 to-orange-600",
      bgColor: "bg-orange-500/10",
      textColor: "text-orange-400",
      width: totalLeads > 0 ? `${Math.max(((funnel?.proposalSent || 0) / totalLeads) * 100, 15)}%` : "15%",
    },
    {
      label: "Converted",
      value: converted,
      icon: TrendingUp,
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-500/10",
      textColor: "text-green-400",
      width: totalLeads > 0 ? `${Math.max((converted / totalLeads) * 100, 15)}%` : "15%",
    },
  ];

  if (isLoading) return <PageSkeleton />;

  return (
    <>
      <div className="space-y-4 sm:space-y-6 p-3 sm:p-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("funnel.title")}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t("funnel.subtitle")}</p>
        </div>

        {/* Top-level KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: "Total Leads", value: totalLeads, icon: Target, color: "text-blue-400", bg: "bg-blue-500/10" },
            { label: "Hot Leads", value: hotLeads, icon: Flame, color: "text-red-400", bg: "bg-red-500/10" },
            { label: "Pipeline Value", value: `${(pipelineValue / 1000).toFixed(0)}K EGP`, icon: DollarSign, color: "text-green-400", bg: "bg-green-500/10" },
            { label: "Conversion Rate", value: `${conversionRate}%`, icon: TrendingUp, color: "text-amber-400", bg: "bg-amber-500/10" },
            { label: "Revenue Collected", value: `${(revenueCollected / 1000).toFixed(0)}K EGP`, icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10" },
          ].map((kpi, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${kpi.bg} flex items-center justify-center`}>
                    <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                  </div>
                  <div>
                    <p className="text-xl font-bold">{kpi.value}</p>
                    <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Visual Funnel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("funnel.overview")}</CardTitle>
            <CardDescription>Visual representation of your sales pipeline</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {funnelStages.map((stage, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg ${stage.bgColor} flex items-center justify-center shrink-0`}>
                    <stage.icon className={`h-5 w-5 ${stage.textColor}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{stage.label}</span>
                      <span className={`text-sm font-bold ${stage.textColor}`}>{stage.value}</span>
                    </div>
                    <div className="h-8 bg-muted/30 rounded-lg overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${stage.color} rounded-lg transition-all duration-700 flex items-center justify-end pr-3`}
                        style={{ width: stage.width }}
                      >
                        {stage.value > 0 && (
                          <span className="text-xs font-medium text-white/80">
                            {totalLeads > 0 ? `${Math.round((stage.value / totalLeads) * 100)}%` : ""}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {i < funnelStages.length - 1 && (
                    <ArrowRight className="h-4 w-4 text-muted-foreground/30 shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Two-column: Lead Score Distribution + Proposal Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Lead Score Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Lead Quality Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { label: "Hot Leads", value: leadStats?.hot || 0, icon: Flame, color: "text-red-400", bg: "bg-red-500", desc: "High budget, urgent need" },
                  { label: "Warm Leads", value: leadStats?.warm || 0, icon: ThermometerSun, color: "text-amber-400", bg: "bg-amber-500", desc: "Good potential, needs nurturing" },
                  { label: "Cold Leads", value: leadStats?.cold || 0, icon: Snowflake, color: "text-blue-400", bg: "bg-blue-500", desc: "Early stage, low urgency" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg ${item.bg}/10 flex items-center justify-center`}>
                      <item.icon className={`h-5 w-5 ${item.color}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{item.label}</span>
                        <span className={`text-lg font-bold ${item.color}`}>{item.value}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Proposal Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Proposal Pipeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { label: "Draft Proposals", value: proposals.filter((p: ProposalListItem) => p.status === "draft").length, icon: FileText, color: "text-slate-400" },
                  { label: "Sent to Client", value: proposals.filter((p: ProposalListItem) => p.status === "sent").length, icon: Clock, color: "text-amber-400" },
                  { label: "Accepted", value: acceptedProposals.length, icon: CheckCircle2, color: "text-green-400" },
                  { label: "Rejected", value: proposals.filter((p: ProposalListItem) => p.status === "rejected").length, icon: XCircle, color: "text-red-400" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-3">
                      <item.icon className={`h-5 w-5 ${item.color}`} />
                      <span className="text-sm">{item.label}</span>
                    </div>
                    <span className={`text-lg font-bold ${item.color}`}>{item.value}</span>
                  </div>
                ))}
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Proposal Value</span>
                    <span className="font-bold">{totalProposalValue.toLocaleString()} EGP</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-sm text-muted-foreground">Accepted Value</span>
                    <span className="font-bold text-green-400">{acceptedValue.toLocaleString()} EGP</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Hot Leads */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Hot Leads</CardTitle>
            <CardDescription>Leads that need immediate attention</CardDescription>
          </CardHeader>
          <CardContent>
            {leads.filter((l: LeadListItem) => l.scoreLabel === "hot" && l.status !== "converted").length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No hot leads at the moment. Share your Quick-Check link to attract more leads.
              </p>
            ) : (
              <div className="space-y-2">
                {leads
                  .filter((l: LeadListItem) => l.scoreLabel === "hot" && l.status !== "converted")
                  .slice(0, 5)
                  .map((lead: LeadListItem) => (
                    <div key={lead.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-3">
                        <Flame className="h-4 w-4 text-red-400" />
                        <div>
                          <span className="text-sm font-medium">{lead.companyName}</span>
                          <span className="text-xs text-muted-foreground ml-2">{lead.industry}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="text-xs">
                          {SERVICE_LABELS[lead.recommendedService ?? ""] || lead.recommendedService}
                        </Badge>
                        <span className="text-sm font-medium text-green-400">
                          {Number(lead.estimatedValue || 0).toLocaleString()} EGP
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
