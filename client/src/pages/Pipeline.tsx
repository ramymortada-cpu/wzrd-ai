import { EmptyState } from "@/components/EmptyState";
import { PageSkeleton } from "@/components/PageSkeleton";
import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { paginatedData } from "@/lib/utils";
import {
  Zap, Play, Pause, RotateCcw, CheckCircle2, XCircle, Clock,
  Search, Brain, Target, FileText, Send, ArrowRight, Loader2,
  Rocket, Eye, ChevronDown, ChevronUp, Link2, Copy, ExternalLink
} from "lucide-react";

const STEP_CONFIG = [
  { key: "researching", label: "Research", icon: Search, description: "Searching Google, scraping competitors, analyzing market data" },
  { key: "diagnosing", label: "Diagnosis", icon: Brain, description: "Analyzing the brand, identifying issues and opportunities" },
  { key: "strategizing", label: "Strategy", icon: Target, description: "Building brand strategy, positioning, and messaging framework" },
  { key: "generating", label: "Deliverables", icon: FileText, description: "Generating professional deliverables and documents" },
  { key: "reviewing", label: "Proposal", icon: Send, description: "Creating a compelling client proposal" },
];

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-gray-100 text-gray-700",
  researching: "bg-blue-100 text-blue-700",
  diagnosing: "bg-purple-100 text-purple-700",
  strategizing: "bg-amber-100 text-amber-700",
  generating: "bg-green-100 text-green-700",
  reviewing: "bg-indigo-100 text-indigo-700",
  completed: "bg-emerald-100 text-emerald-700",
  failed: "bg-red-100 text-red-700",
  paused: "bg-orange-100 text-orange-700",
};

const SERVICE_LABELS: Record<string, string> = {
  business_health_check: "Business Health Check",
  starting_business_logic: "Starting Business Logic",
  brand_identity: "Brand Identity",
  business_takeoff: "Business Takeoff",
  consultation: "Consultation",
};

export default function PipelinePage() {
  const { t } = useI18n();
  const [showStartDialog, setShowStartDialog] = useState(false);
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [selectedService, setSelectedService] = useState<string>("");
  const [autoApprove, setAutoApprove] = useState(true);
  const [expandedPipeline, setExpandedPipeline] = useState<number | null>(null);
  const [runningPipelineId, setRunningPipelineId] = useState<number | null>(null);

  const clientsQuery = trpc.clients.list.useQuery();
  const projectsQuery = trpc.projects.list.useQuery();
  const pipelinesQuery = trpc.pipeline.list.useQuery();

  const startMutation = trpc.pipeline.start.useMutation({
    onSuccess: (data: { runId: number }) => {
      toast.success("Pipeline started!");
      setShowStartDialog(false);
      setRunningPipelineId(data.runId);
      pipelinesQuery.refetch();
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : String(err)),
  });

  const executeStageMutation = trpc.pipeline.executeStage.useMutation({
    onSuccess: (data: { status?: string }) => {
      toast.success(`Stage completed!`);
      pipelinesQuery.refetch();
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : String(err)),
  });

  const handleStart = () => {
    if (!selectedClient || !selectedService || !selectedProject) return;
    startMutation.mutate({
      clientId: parseInt(selectedClient),
      projectId: parseInt(selectedProject),
      serviceType: selectedService as "business_health_check" | "starting_business_logic" | "brand_identity" | "business_takeoff" | "consultation",
      autoApprove,
      autoExecute: true,
    });
  };

  const handleExecuteStage = (pipelineId: number, stage: string) => {
    const pipeline = pipelines.find((p: { id: number }) => p.id === pipelineId) as { projectId?: number | null } | undefined;
    const projectId = pipeline?.projectId ?? 0;
    if (!projectId) return;
    executeStageMutation.mutate({ projectId, stage: stage as "diagnose" | "design" | "deploy" | "optimize", pipelineRunId: pipelineId });
  };

  const clients = paginatedData(clientsQuery.data);
  const projects = paginatedData(projectsQuery.data);
  const pipelines = pipelinesQuery.data || [];

  const getStepStatus = (pipeline: any, stepIndex: number) => {
    const currentStep = pipeline.currentStep || 0;
    if (stepIndex < currentStep) return "completed";
    if (stepIndex === currentStep && pipeline.status !== "completed" && pipeline.status !== "failed" && pipeline.status !== "pending") return "active";
    return "pending";
  };

  if (clientsQuery.isLoading || pipelinesQuery.isLoading) return <PageSkeleton />;

  return (
    <div className="container max-w-7xl px-3 sm:px-6 py-6 sm:py-8 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl text-white">
              <Zap className="h-7 w-7" />
            </div>
            {t("nav.pipeline") || "Autonomous Pipeline"}
          </h1>
          <p className="text-muted-foreground mt-1">
            AI executes the full consulting workflow — research to proposal — autonomously
          </p>
        </div>
        <Button onClick={() => setShowStartDialog(true)} className="gap-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600">
          <Rocket className="h-4 w-4" /> Launch Pipeline
        </Button>
      </div>

      {/* How it works */}
      <Card className="border-0 bg-gradient-to-r from-orange-50 via-amber-50 to-yellow-50">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">How the Autonomous Pipeline Works</h3>
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {STEP_CONFIG.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={step.key} className="flex items-center gap-2">
                  <div className="flex flex-col items-center min-w-[100px]">
                    <div className="p-2 bg-white rounded-lg shadow-sm mb-1">
                      <Icon className="h-5 w-5 text-orange-600" />
                    </div>
                    <span className="text-xs font-medium">{step.label}</span>
                  </div>
                  {i < STEP_CONFIG.length - 1 && <ArrowRight className="h-4 w-4 text-orange-400 shrink-0" />}
                </div>
              );
            })}
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            Select a client and service type. Wzrd AI will research their market, diagnose their brand, build a strategy, generate deliverables, and create a proposal — all automatically.
          </p>
        </CardContent>
      </Card>

      {/* Pipeline Runs */}
      {pipelines.length === 0 ? (
        <EmptyState
          type="pipeline"
          onAction={() => setShowStartDialog(true)}
          actionLabel="Launch First Pipeline"
        />
      ) : (
        <div className="space-y-4">
          {pipelines.map((pipeline: any) => {
            const isExpanded = expandedPipeline === pipeline.id;
            const isRunning = runningPipelineId === pipeline.id;
            const progress = ((pipeline.currentStep || 0) / 5) * 100;
            const clientName = clients.find((c: any) => c.id === pipeline.clientId)?.name || `Client #${pipeline.clientId}`;

            return (
              <Card key={pipeline.id} className="overflow-hidden">
                <CardContent className="p-0">
                  {/* Pipeline Header */}
                  <div className="p-5 flex items-center justify-between cursor-pointer" onClick={() => setExpandedPipeline(isExpanded ? null : pipeline.id)}>
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${pipeline.status === 'completed' ? 'bg-emerald-100' : pipeline.status === 'failed' ? 'bg-red-100' : 'bg-orange-100'}`}>
                        {pipeline.status === 'completed' ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> :
                         pipeline.status === 'failed' ? <XCircle className="h-5 w-5 text-red-600" /> :
                         isRunning ? <Loader2 className="h-5 w-5 text-orange-600 animate-spin" /> :
                         <Clock className="h-5 w-5 text-orange-600" />}
                      </div>
                      <div>
                        <div className="font-semibold">{clientName}</div>
                        <div className="text-sm text-muted-foreground">{SERVICE_LABELS[pipeline.serviceType] || pipeline.serviceType}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={STATUS_COLORS[pipeline.status] || "bg-gray-100"}>
                        {pipeline.status}
                      </Badge>
                      <div className="w-32">
                        <Progress value={progress} className="h-2" />
                        <div className="text-xs text-muted-foreground text-center mt-1">{pipeline.currentStep || 0}/5 steps</div>
                      </div>
                      <div className="flex gap-2">
                        {pipeline.status !== 'completed' && pipeline.status !== 'failed' && !isRunning && (
                          <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleExecuteStage(pipeline.id, "diagnose"); }} disabled={executeStageMutation.isPending}>
                            Execute Stage
                          </Button>
                        )}
                      </div>
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>

                  {/* Expanded Steps */}
                  {isExpanded && (
                    <div className="border-t px-5 py-4 bg-muted/30">
                      <div className="space-y-3">
                        {STEP_CONFIG.map((step, i) => {
                          const status = getStepStatus(pipeline, i);
                          const Icon = step.icon;
                          return (
                            <div key={step.key} className={`flex items-start gap-3 p-3 rounded-lg ${status === 'completed' ? 'bg-emerald-50' : status === 'active' ? 'bg-orange-50 border border-orange-200' : 'bg-white'}`}>
                              <div className={`p-1.5 rounded-md ${status === 'completed' ? 'bg-emerald-100' : status === 'active' ? 'bg-orange-100' : 'bg-gray-100'}`}>
                                {status === 'completed' ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> :
                                 status === 'active' ? <Loader2 className="h-4 w-4 text-orange-600 animate-spin" /> :
                                 <Icon className="h-4 w-4 text-gray-400" />}
                              </div>
                              <div className="flex-1">
                                <div className="font-medium text-sm">{step.label}</div>
                                <div className="text-xs text-muted-foreground">{step.description}</div>
                              </div>
                              {status === 'completed' && (
                                <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700">Done</Badge>
                              )}
                              {status === 'active' && isRunning && (
                                <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700 animate-pulse">Running...</Badge>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Show outputs if completed */}
                      {pipeline.status === 'completed' && (
                        <div className="mt-4 space-y-3">
                          <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                            <h4 className="font-semibold text-emerald-800 mb-2 flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4" /> Pipeline Complete
                            </h4>
                            <div className="text-sm text-emerald-700 space-y-1">
                              {pipeline.diagnosisOutput && <p>✓ Diagnosis generated ({String(pipeline.diagnosisOutput).length} chars)</p>}
                              {pipeline.strategyOutput && <p>✓ Strategy generated ({String(pipeline.strategyOutput).length} chars)</p>}
                              {pipeline.deliverablesOutput && <p>✓ {(pipeline.deliverablesOutput as any[]).length} deliverables generated</p>}
                              {pipeline.proposalOutput && <p>✓ Proposal generated</p>}
                              {pipeline.projectId && <p>✓ Project auto-created</p>}
                            </div>
                          </div>

                          {/* Auto-Portal Link */}
                          {pipeline.projectId && (
                            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                              <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                                <Link2 className="h-4 w-4" /> Client Portal Auto-Created
                              </h4>
                              <p className="text-sm text-blue-700 mb-3">
                                A client portal was automatically created with all deliverables. The client can view their project status and deliverables through the portal link.
                              </p>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-blue-700 border-blue-300 hover:bg-blue-100"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.location.href = `/portal-management`;
                                  }}
                                >
                                  <ExternalLink className="h-3 w-3 mr-1" /> Manage Portal
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-blue-700 border-blue-300 hover:bg-blue-100"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.location.href = `/projects/${pipeline.projectId}`;
                                  }}
                                >
                                  <Eye className="h-3 w-3 mr-1" /> View Project
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {pipeline.status === 'failed' && pipeline.errorMessage && (
                        <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
                          <h4 className="font-semibold text-red-800 mb-1">Error</h4>
                          <p className="text-sm text-red-700">{pipeline.errorMessage}</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Start Pipeline Dialog */}
      <Dialog open={showStartDialog} onOpenChange={setShowStartDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Rocket className="h-5 w-5 text-orange-500" /> Launch Autonomous Pipeline
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Client</Label>
              <Select value={selectedClient} onValueChange={(v) => { setSelectedClient(v); setSelectedProject(""); }}>
                <SelectTrigger><SelectValue placeholder="Select a client" /></SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={String(client.id)}>
                      {client.name} {client.companyName ? `(${client.companyName})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Project</Label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger><SelectValue placeholder="Select a project" /></SelectTrigger>
                <SelectContent>
                  {(projects as any[]).filter((p: any) => !selectedClient || p.clientId === parseInt(selectedClient)).map((p: any) => (
                    <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Service Type</Label>
              <Select value={selectedService} onValueChange={setSelectedService}>
                <SelectTrigger><SelectValue placeholder="Select service" /></SelectTrigger>
                <SelectContent>
                  {Object.entries(SERVICE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <Label>Auto-run all steps</Label>
                <p className="text-xs text-muted-foreground">Execute all 5 steps without pausing</p>
              </div>
              <Switch checked={autoApprove} onCheckedChange={setAutoApprove} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStartDialog(false)}>Cancel</Button>
            <Button
              onClick={() => {
                handleStart();
                // If auto-approve, also trigger runAll after creation
              }}
              disabled={!selectedClient || !selectedProject || !selectedService || startMutation.isPending}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
            >
              {startMutation.isPending ? "Starting..." : "Launch Pipeline"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
