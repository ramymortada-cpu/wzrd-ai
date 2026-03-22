import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useI18n } from "@/lib/i18n";
import { EmptyState } from "@/components/EmptyState";
import { PageSkeleton } from "@/components/PageSkeleton";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Target, TrendingUp, Users, DollarSign, Flame, ThermometerSun, Snowflake,
  Mail, Phone, Globe, Building2, MapPin, ExternalLink, ArrowUpRight, Copy, Eye,
} from "lucide-react";
import { paginatedData } from "@/lib/utils";

const SERVICE_LABELS: Record<string, string> = {
  business_health_check: "Business Health Check",
  starting_business_logic: "Clarity Package",
  brand_identity: "Brand Foundation",
  business_takeoff: "Business Takeoff",
  consultation: "Growth Partnership",
};

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  contacted: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  qualified: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  proposal_sent: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  converted: "bg-green-500/10 text-green-400 border-green-500/20",
  lost: "bg-red-500/10 text-red-400 border-red-500/20",
};

const SCORE_ICONS: Record<string, any> = {
  hot: Flame,
  warm: ThermometerSun,
  cold: Snowflake,
};

const SCORE_COLORS: Record<string, string> = {
  hot: "text-red-400",
  warm: "text-amber-400",
  cold: "text-blue-400",
};

export default function LeadsPage() {
  const { t, locale } = useI18n();

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [scoreFilter, setScoreFilter] = useState<string>("all");
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [showDiagnosis, setShowDiagnosis] = useState(false);

  const { data: leadsRaw, refetch, isLoading } = trpc.leads.list.useQuery(
    {
      ...(statusFilter !== "all" ? { status: statusFilter } : {}),
      ...(scoreFilter !== "all" ? { scoreLabel: scoreFilter } : {}),
    },
    { refetchInterval: 30000 }
  );
  const leads = paginatedData(leadsRaw);
  const { data: stats } = trpc.leads.stats.useQuery(undefined, { refetchInterval: 30000 });
  const { data: funnel } = trpc.leads.funnel.useQuery(undefined, { refetchInterval: 30000 });

  const updateStatusMutation = trpc.leads.updateStatus.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Status updated");
    },
  });

  const convertMutation = trpc.leads.convertToClient.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Lead converted to client!");
    },
  });

  const quickCheckUrl = `${window.location.origin}/quick-check`;

  const copyLink = () => {
    navigator.clipboard.writeText(quickCheckUrl);
    toast.success("Link copied! Share this link to capture leads.");
  };

  return (
    <>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{t("leads.title")}</h1>
            <p className="text-muted-foreground text-sm mt-1">{t("leads.subtitle")}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={copyLink} className="gap-2">
              <Copy className="h-4 w-4" />
              Copy Quick-Check Link
            </Button>
            <Button
              size="sm"
              onClick={() => window.open(quickCheckUrl, "_blank")}
              className="gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
            >
              <ExternalLink className="h-4 w-4" />
              Open Quick-Check
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Target className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.total || 0}</p>
                  <p className="text-xs text-muted-foreground">{t("leads.totalLeads")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <Flame className="h-5 w-5 text-red-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.hot || 0}</p>
                  <p className="text-xs text-muted-foreground">{t("leads.hotLeads")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{((stats?.totalValue || 0) / 1000).toFixed(0)}K</p>
                  <p className="text-xs text-muted-foreground">{t("leads.pipelineValue")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {stats?.total ? Math.round((stats.converted / stats.total) * 100) : 0}%
                  </p>
                  <p className="text-xs text-muted-foreground">{t("leads.conversionRate")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Funnel Visualization */}
        {funnel && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">{t("funnel.overview")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2 h-32">
                {[
                  { label: t("leads.new"), value: funnel.new, color: "bg-blue-500" },
                  { label: t("leads.contacted"), value: funnel.contacted, color: "bg-purple-500" },
                  { label: t("leads.qualified"), value: funnel.qualified, color: "bg-amber-500" },
                  { label: t("leads.proposalSent"), value: funnel.proposalSent, color: "bg-orange-500" },
                  { label: t("leads.converted"), value: funnel.converted, color: "bg-green-500" },
                  { label: t("leads.lost"), value: funnel.lost, color: "bg-red-500/50" },
                ].map((stage, i) => {
                  const maxVal = Math.max(funnel.new, funnel.contacted, funnel.qualified, funnel.proposalSent, funnel.converted, funnel.lost, 1);
                  const height = Math.max((stage.value / maxVal) * 100, 8);
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-xs font-medium">{stage.value}</span>
                      <div
                        className={`w-full rounded-t-md ${stage.color} transition-all`}
                        style={{ height: `${height}%` }}
                      />
                      <span className="text-[10px] text-muted-foreground text-center leading-tight">{stage.label}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="new">{t("leads.new")}</SelectItem>
              <SelectItem value="contacted">{t("leads.contacted")}</SelectItem>
              <SelectItem value="qualified">{t("leads.qualified")}</SelectItem>
              <SelectItem value="proposal_sent">{t("leads.proposalSent")}</SelectItem>
              <SelectItem value="converted">{t("leads.converted")}</SelectItem>
              <SelectItem value="lost">{t("leads.lost")}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={scoreFilter} onValueChange={setScoreFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Score" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Scores</SelectItem>
              <SelectItem value="hot">{t("leads.hot")}</SelectItem>
              <SelectItem value="warm">{t("leads.warm")}</SelectItem>
              <SelectItem value="cold">{t("leads.cold")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Leads List */}
        {isLoading ? (
          <PageSkeleton />
        ) : leads.length === 0 ? (
          <EmptyState
            type="leads"
            onAction={copyLink}
            actionLabel="Copy Quick-Check Link"
          />
        ) : (
          <div className="space-y-3">
            {leads.map((lead: any) => {
              const ScoreIcon = SCORE_ICONS[lead.scoreLabel] || Target;
              return (
                <Card key={lead.id} className="hover:border-primary/20 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      {/* Left: Lead info */}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span className="font-semibold">{lead.companyName}</span>
                          </div>
                          <Badge variant="outline" className={STATUS_COLORS[lead.status] || ""}>
                            {t(`leads.${lead.status === "proposal_sent" ? "proposalSent" : lead.status}`)}
                          </Badge>
                          <div className={`flex items-center gap-1 ${SCORE_COLORS[lead.scoreLabel]}`}>
                            <ScoreIcon className="h-4 w-4" />
                            <span className="text-sm font-medium">{lead.score}/100</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {lead.contactName && <span>{lead.contactName}</span>}
                          {lead.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" /> {lead.email}
                            </span>
                          )}
                          {lead.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" /> {lead.phone}
                            </span>
                          )}
                          {lead.industry && (
                            <span className="flex items-center gap-1">
                              <Building2 className="h-3 w-3" /> {lead.industry}
                            </span>
                          )}
                          {lead.market && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> {lead.market.toUpperCase()}
                            </span>
                          )}
                        </div>
                        {lead.recommendedService && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">{t("leads.recommended")}:</span>
                            <Badge variant="secondary" className="text-xs">
                              {SERVICE_LABELS[lead.recommendedService] || lead.recommendedService}
                            </Badge>
                            {lead.estimatedValue && (
                              <span className="text-green-500 font-medium">
                                {Number(lead.estimatedValue).toLocaleString()} EGP
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedLead(lead);
                            setShowDiagnosis(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          {t("leads.viewDiagnosis")}
                        </Button>
                        {lead.status !== "converted" && lead.status !== "lost" && (
                          <Select
                            value={lead.status}
                            onValueChange={(v) =>
                              updateStatusMutation.mutate({ id: lead.id, status: v as any })
                            }
                          >
                            <SelectTrigger className="w-[130px] h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="new">{t("leads.new")}</SelectItem>
                              <SelectItem value="contacted">{t("leads.contacted")}</SelectItem>
                              <SelectItem value="qualified">{t("leads.qualified")}</SelectItem>
                              <SelectItem value="proposal_sent">{t("leads.proposalSent")}</SelectItem>
                              <SelectItem value="lost">{t("leads.lost")}</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                        {lead.status === "qualified" && (
                          <Button
                            size="sm"
                            onClick={() => convertMutation.mutate({ id: lead.id })}
                            className="gap-1 bg-green-600 hover:bg-green-700 text-white"
                          >
                            <ArrowUpRight className="h-4 w-4" />
                            {t("leads.convertToClient")}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Diagnosis Dialog */}
        <Dialog open={showDiagnosis} onOpenChange={setShowDiagnosis}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedLead?.companyName} — Brand Diagnosis
              </DialogTitle>
              <DialogDescription>
                AI-generated brand health assessment from Quick-Check
              </DialogDescription>
            </DialogHeader>
            {selectedLead && (
              <div className="space-y-4">
                {/* Score */}
                <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                  <div className={`text-4xl font-bold ${SCORE_COLORS[selectedLead.scoreLabel]}`}>
                    {selectedLead.score}
                  </div>
                  <div>
                    <Badge className={STATUS_COLORS[selectedLead.status] || ""}>
                      {selectedLead.scoreLabel?.toUpperCase()}
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-1">{selectedLead.scoringReason}</p>
                  </div>
                </div>

                {/* Teaser */}
                <div>
                  <h4 className="font-medium mb-2">Teaser (shown to client)</h4>
                  <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
                    {selectedLead.diagnosisTeaser}
                  </p>
                </div>

                {/* Full Diagnosis */}
                <div>
                  <h4 className="font-medium mb-2">Full Diagnosis (internal)</h4>
                  <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg whitespace-pre-wrap">
                    {selectedLead.fullDiagnosis}
                  </p>
                </div>

                {/* Quick-Check Answers */}
                {selectedLead.quickCheckAnswers && (
                  <div>
                    <h4 className="font-medium mb-2">Quick-Check Answers</h4>
                    <div className="space-y-2">
                      {(selectedLead.quickCheckAnswers as any[]).map((qa: any, i: number) => (
                        <div key={i} className="p-3 rounded-lg bg-muted/30">
                          <p className="text-xs font-medium text-muted-foreground">{qa.question}</p>
                          <p className="text-sm mt-1">{qa.answer}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
