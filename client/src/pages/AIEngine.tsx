import { ChatSkeleton } from "@/components/PageSkeleton";
import { trpc } from "@/lib/trpc";
import { paginatedData } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Sparkles, Send, Loader2, Bot, User, RotateCcw, Play, ChevronRight,
  ChevronLeft, CheckCircle2, FileText, ArrowRight, Zap, MessageSquare,
  Save, History, Clock, Brain, Target, Lightbulb, AlertCircle
} from "lucide-react";
import { useState, useRef, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { Streamdown } from "streamdown";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type WorkflowStep = {
  title: string;
  description: string;
  deliverable?: string;
  stage: string;
  completed: boolean;
  result?: string;
};

const SERVICE_OPTIONS = [
  { value: "business_health_check", labelKey: "service.business_health_check", icon: "🔍", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
  { value: "starting_business_logic", labelKey: "service.starting_business_logic", icon: "⚙️", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  { value: "brand_identity", labelKey: "service.brand_identity", icon: "🎨", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  { value: "business_takeoff", labelKey: "service.business_takeoff", icon: "🚀", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  { value: "consultation", labelKey: "service.consultation", icon: "💡", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
];

export default function AIEnginePage() {
  const { t, locale } = useI18n();
  const [mode, setMode] = useState<"select" | "guided" | "chat">("select");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [serviceContext, setServiceContext] = useState<string>("general");
  const [clientId, setClientId] = useState<number | undefined>(undefined);

  // Guided workflow state
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepMessages, setStepMessages] = useState<Message[]>([]);
  const [stepPhase, setStepPhase] = useState<"discovery" | "generating" | "review">("discovery");
  const [stepResult, setStepResult] = useState("");
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [viewingResult, setViewingResult] = useState<{ title: string; content: string } | null>(null);

  const [conversationId, setConversationId] = useState<number | undefined>(undefined);
  const [showHistory, setShowHistory] = useState(false);
  const [researchReportId, setResearchReportId] = useState<number | undefined>(undefined);
  const [isResearching, setIsResearching] = useState(false);
  const [researchSummary, setResearchSummary] = useState<string | null>(null);

  const [, navigate] = useLocation();
  const [generatingProposal, setGeneratingProposal] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const guidedScrollRef = useRef<HTMLDivElement>(null);
  const { data: clientsRaw, isLoading: clientsLoading } = trpc.clients.list.useQuery();
  const clients = paginatedData(clientsRaw);
  const { data: playbooksData } = trpc.dashboard.playbooks.useQuery();
  const { data: conversations, refetch: refetchConversations } = trpc.conversations.list.useQuery();
  const utils = trpc.useUtils();

  // Auto-research mutation
  const autoResearchMutation = trpc.research.conductFull.useMutation({
    onSuccess: (result) => {
      setIsResearching(false);
      if (result.id) {
        setResearchReportId(result.id);
        setResearchSummary(result.summary || 'Research completed');
        toast.success(locale === 'ar' ? 'تم البحث تلقائياً عن العميل!' : 'Auto-research completed for client!');
      }
    },
    onError: () => {
      setIsResearching(false);
      // Silently fail — research is optional enhancement
    },
  });

  // Trigger auto-research when client is selected
  useEffect(() => {
    if (clientId && clients) {
      const client = clients.find((c: any) => c.id === clientId);
      if (client && (client.companyName || client.name) && !researchReportId && !isResearching) {
        setIsResearching(true);
        autoResearchMutation.mutate({
          companyName: client.companyName || client.name,
          industry: client.industry || 'General',
          market: client.market || 'Egypt',
          website: client.website || undefined,
        });
      }
    }
  }, [clientId]);

  const createProposalFromDiscovery = trpc.proposals.createFromDiscovery.useMutation({
    onSuccess: (result) => {
      setGeneratingProposal(false);
      toast.success(locale === "ar" ? "تم إنشاء العرض بنجاح!" : "Proposal generated successfully!");
      navigate(`/proposals/${result.id}`);
    },
    onError: (err) => {
      setGeneratingProposal(false);
      toast.error(err.message);
    },
  });

  const handleGenerateProposal = (conversationMsgs: Message[]) => {
    if (conversationMsgs.length < 2) {
      toast.error(locale === "ar" ? "محتاج محادثة أطول عشان أولد عرض" : "Need a longer conversation to generate a proposal");
      return;
    }
    setGeneratingProposal(true);
    createProposalFromDiscovery.mutate({
      conversationMessages: conversationMsgs.map(m => ({ role: m.role, content: m.content })),
      clientId: clientId || undefined,
      serviceType: (selectedService && selectedService !== 'general' ? selectedService : undefined) as any,
      language: locale,
    });
  };

  const saveConversation = trpc.conversations.save.useMutation({
    onSuccess: (result) => {
      setConversationId(result.id);
      refetchConversations();
      toast.success(locale === "ar" ? "تم حفظ المحادثة" : "Conversation saved");
    },
    onError: (err) => toast.error(err.message),
  });

  const chatMutation = trpc.ai.chat.useMutation({
    onSuccess: (result) => {
      if (mode === "chat") {
        setMessages((prev) => [...prev, { role: "assistant", content: result.content }]);
      } else if (mode === "guided") {
        if (stepPhase === "generating") {
          // AI generated the deliverable
          setStepResult(result.content);
          setStepPhase("review");
          setShowResultDialog(true);
        } else {
          // AI responded in discovery conversation
          setStepMessages((prev) => [...prev, { role: "assistant", content: result.content }]);
        }
      }
    },
    onError: (err) => {
      if (mode === "chat") {
        setMessages((prev) => [...prev, { role: "assistant", content: `Error: ${err.message}` }]);
      } else {
        setStepMessages((prev) => [...prev, { role: "assistant", content: `Error: ${err.message}` }]);
        if (stepPhase === "generating") setStepPhase("discovery");
        toast.error(err.message);
      }
    },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, chatMutation.isPending]);

  useEffect(() => {
    if (guidedScrollRef.current) {
      guidedScrollRef.current.scrollTop = guidedScrollRef.current.scrollHeight;
    }
  }, [stepMessages, chatMutation.isPending]);

  // Build workflow steps from playbook
  const startGuidedWorkflow = (serviceKey: string) => {
    if (!playbooksData?.playbooks) return;
    const playbook = (playbooksData.playbooks as any)[serviceKey];
    if (!playbook || !playbook.stages || playbook.stages.length === 0) {
      toast.error(locale === "ar" ? "لا يوجد خطوات لهذه الخدمة" : "No steps found for this service");
      return;
    }

    const steps: WorkflowStep[] = [];
    for (const stageData of playbook.stages) {
      for (const step of stageData.steps) {
        steps.push({
          title: step.title,
          description: step.description,
          deliverable: step.deliverable,
          stage: stageData.stage,
          completed: false,
        });
      }
    }

    setSelectedService(serviceKey);
    setWorkflowSteps(steps);
    setCurrentStepIndex(0);
    setStepMessages([]);
    setStepPhase("discovery");
    setStepResult("");
    setMode("guided");

    // Start with AI introducing the first step
    const firstStep = steps[0];
    const clientInfo = clientId ? clients?.find(c => c.id === clientId) : null;
    let clientContext = "";
    if (clientInfo) {
      clientContext = `\n\nClient context: ${clientInfo.name} (${clientInfo.companyName || 'N/A'}) - ${clientInfo.industry || 'N/A'} - Market: ${clientInfo.market}`;
    }

    setTimeout(() => {
      chatMutation.mutate({
        messages: [{
          role: "user",
          content: `We are starting the "${playbook.name}" service. The current step is: "${firstStep.title}".

Step description: ${firstStep.description}
${firstStep.deliverable ? `Expected deliverable: ${firstStep.deliverable}` : ''}
${clientContext}

Start by introducing this step to me. Then begin the discovery process — ask me the FIRST question you need answered to do this step properly. Remember: ONE question at a time, make it specific and purposeful.`
        }],
        serviceContext: serviceKey as any,
        clientId,
      });
    }, 100);
  };

  // Handle guided workflow chat
  const handleGuidedSend = () => {
    if (!input.trim() || chatMutation.isPending) return;
    const userMessage: Message = { role: "user", content: input.trim() };
    const newMessages = [...stepMessages, userMessage];
    setStepMessages(newMessages);
    setInput("");

    chatMutation.mutate({
      messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
      serviceContext: selectedService as any || "general",
      clientId,
    });
  };

  // Generate deliverable from discovery conversation
  const generateDeliverable = () => {
    const step = workflowSteps[currentStepIndex];
    if (!step) return;

    setStepPhase("generating");

    const clientInfo = clientId ? clients?.find(c => c.id === clientId) : null;
    let clientContext = "";
    if (clientInfo) {
      clientContext = `Client: ${clientInfo.name} (${clientInfo.companyName || 'N/A'}) - ${clientInfo.industry || 'N/A'} - Market: ${clientInfo.market}`;
    }

    // Build the generation prompt with all discovery conversation context
    const discoveryContext = stepMessages.map(m => `${m.role === 'user' ? 'Client/User' : 'Consultant'}: ${m.content}`).join('\n\n');

    chatMutation.mutate({
      messages: [{
        role: "user",
        content: `Based on the discovery conversation below, generate the deliverable for this step.

STEP: ${step.title}
DELIVERABLE: ${step.deliverable || step.title}
DESCRIPTION: ${step.description}
${clientContext ? `CLIENT: ${clientContext}` : ''}

DISCOVERY CONVERSATION:
${discoveryContext}

Now generate the complete, professional deliverable. This must be CLIENT-READY quality — thorough, specific to this client's situation, and grounded in methodology. Use all the information gathered in the discovery conversation. Format with markdown.`
      }],
      serviceContext: selectedService as any || "general",
      clientId,
    });
  };

  const markStepComplete = () => {
    setWorkflowSteps(prev => prev.map((s, i) =>
      i === currentStepIndex ? { ...s, completed: true, result: stepResult } : s
    ));
    setShowResultDialog(false);
    setStepResult("");
    
    if (currentStepIndex < workflowSteps.length - 1) {
      // Move to next step
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      setStepMessages([]);
      setStepPhase("discovery");

      // Start next step with AI introduction
      const nextStep = workflowSteps[nextIndex];
      const clientInfo = clientId ? clients?.find(c => c.id === clientId) : null;
      let clientContext = "";
      if (clientInfo) {
        clientContext = `\n\nClient context: ${clientInfo.name} (${clientInfo.companyName || 'N/A'}) - ${clientInfo.industry || 'N/A'} - Market: ${clientInfo.market}`;
      }

      // Include previous steps context
      const previousStepsContext = workflowSteps
        .filter((s, i) => i <= currentStepIndex && s.completed && s.result)
        .map(s => `Completed: ${s.title} — Key findings available`)
        .join('\n');

      setTimeout(() => {
        chatMutation.mutate({
          messages: [{
            role: "user",
            content: `Moving to the next step: "${nextStep.title}".

Step description: ${nextStep.description}
${nextStep.deliverable ? `Expected deliverable: ${nextStep.deliverable}` : ''}
${clientContext}

Previous completed steps:
${previousStepsContext || 'None yet'}

Introduce this step and begin the discovery. Ask me the FIRST question you need answered. ONE question at a time.`
          }],
          serviceContext: selectedService as any || "general",
          clientId,
        });
      }, 100);
    } else {
      toast.success(locale === "ar" ? "تم إكمال جميع الخطوات!" : "All steps completed!");
    }
  };

  // Check if all guided workflow steps are completed
  const allStepsCompleted = workflowSteps.length > 0 && workflowSteps.every(s => s.completed);
  // Check if enough chat messages for proposal
  const chatUserMessages = messages.filter(m => m.role === 'user').length;
  const canGenerateProposalFromChat = chatUserMessages >= 2;

  const navigateToStep = (idx: number) => {
    setCurrentStepIndex(idx);
    setStepMessages([]);
    setStepPhase("discovery");
    setStepResult("");
    
    const step = workflowSteps[idx];
    if (step.completed && step.result) {
      setViewingResult({ title: step.title, content: step.result });
    }
  };

  const handleChatSend = () => {
    if (!input.trim() || chatMutation.isPending) return;
    const userMessage: Message = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    chatMutation.mutate({
      messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
      serviceContext,
      clientId,
    });
  };

  const handleReset = () => {
    setMode("select");
    setMessages([]);
    setInput("");
    setSelectedService(null);
    setWorkflowSteps([]);
    setCurrentStepIndex(0);
    setStepMessages([]);
    setStepPhase("discovery");
    setStepResult("");
    setConversationId(undefined);
  };

  const handleSaveConversation = () => {
    if (messages.length === 0) return;
    const title = messages[0]?.content.substring(0, 100) || "Untitled";
    saveConversation.mutate({
      title,
      context: serviceContext || "general",
      clientId,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });
  };

  const loadConversation = (convo: any) => {
    try {
      const msgs = typeof convo.messages === 'string' ? JSON.parse(convo.messages) : convo.messages;
      setMessages(msgs);
      setConversationId(convo.id);
      setServiceContext(convo.context || "general");
      setMode("chat");
      setShowHistory(false);
    } catch {
      toast.error("Failed to load conversation");
    }
  };

  const completedSteps = workflowSteps.filter(s => s.completed).length;
  const progressPercent = workflowSteps.length > 0 ? (completedSteps / workflowSteps.length) * 100 : 0;
  const currentStep = workflowSteps[currentStepIndex];

  const stageColors: Record<string, string> = {
    diagnose: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    design: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    deploy: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    optimize: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  };

  // ============ LOADING STATE ============
  if (clientsLoading) return <ChatSkeleton />;

  // ============ SELECT MODE ============
  if (mode === "select") {
    return (
      <div className="space-y-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center space-y-3 pt-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-2">
            <Brain className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">{t("ai.title")}</h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            {locale === "ar"
              ? "مستشار استراتيجي مدرب على منهجية Wzrd AI الكاملة. يسأل قبل ما يجاوب، يشخّص قبل ما يوصف."
              : "A strategic consultant trained on Wzrd AI's complete methodology. Diagnoses before prescribing, asks before answering."}
          </p>
        </div>

        {/* Mode Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Guided Workflow Card */}
          <Card className="shadow-sm hover:shadow-md transition-all cursor-pointer group border-2 border-transparent hover:border-primary/20"
            onClick={() => {}}>
            <CardContent className="pt-6 pb-6">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">{t("ai.guidedMode")}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {locale === "ar"
                      ? "اختر خدمة وسيقودك المستشار خطوة بخطوة — يسألك أسئلة discovery أولاً، يحلل إجاباتك، ثم يولد المخرجات بناءً على فهم حقيقي لوضعك."
                      : "Select a service and the consultant will guide you step-by-step — asking discovery questions first, analyzing your answers, then generating deliverables based on real understanding."}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Free Chat Card */}
          <Card className="shadow-sm hover:shadow-md transition-all cursor-pointer group border-2 border-transparent hover:border-primary/20"
            onClick={() => { setMode("chat"); setServiceContext("general"); }}>
            <CardContent className="pt-6 pb-6">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center shrink-0 group-hover:bg-muted/80 transition-colors">
                  <MessageSquare className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">{t("ai.chatMode")}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {locale === "ar"
                      ? "محادثة حرة مع مستشار استراتيجي خبير. اسأل عن أي تحدي في البراندنج أو البيزنس — هيشخّص قبل ما يوصف."
                      : "Free conversation with an expert strategy consultant. Ask about any branding or business challenge — diagnoses before prescribing."}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Service Selection for Guided */}
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Play className="h-5 w-5 text-primary" />
            {t("ai.startWorkflow")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {SERVICE_OPTIONS.map((service) => (
              <Card
                key={service.value}
                className="shadow-sm hover:shadow-md transition-all cursor-pointer group border-2 border-transparent hover:border-primary/20"
                onClick={() => startGuidedWorkflow(service.value)}
              >
                <CardContent className="py-5">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{service.icon}</span>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{t(service.labelKey)}</p>
                      <p className="text-xs text-muted-foreground">
                        {(() => {
                          const pb = (playbooksData?.playbooks as any)?.[service.value];
                          const totalSteps = pb?.stages?.reduce((sum: number, s: any) => sum + (s.steps?.length || 0), 0) || 0;
                          return `${totalSteps} ${totalSteps === 1 ? (locale === 'ar' ? 'خطوة' : 'Step') : (locale === 'ar' ? 'خطوات' : 'Steps')}`;
                        })()}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground ms-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Client Selector */}
        <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50">
          <Target className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-sm text-muted-foreground whitespace-nowrap">{t("ai.selectClient")}:</span>
          <Select value={clientId ? String(clientId) : "none"} onValueChange={(v) => setClientId(v === "none" ? undefined : Number(v))}>
            <SelectTrigger className="w-64 bg-background"><SelectValue placeholder={t("ai.selectClient")} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{locale === "ar" ? "بدون عميل محدد" : "No specific client"}</SelectItem>
              {clients?.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>{c.companyName || c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Conversation History */}
        {conversations && conversations.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <History className="h-5 w-5 text-muted-foreground" />
              {locale === "ar" ? "المحادثات السابقة" : "Previous Conversations"}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {conversations.slice(0, 6).map((convo: any) => (
                <button
                  key={convo.id}
                  onClick={() => loadConversation(convo)}
                  className="text-start p-3 rounded-xl border hover:border-primary/30 hover:bg-primary/5 transition-colors"
                >
                  <p className="text-sm font-medium truncate">{convo.title || 'Untitled'}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(convo.updatedAt).toLocaleDateString()}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ============ GUIDED WORKFLOW MODE ============
  if (mode === "guided" && currentStep) {
    const serviceOption = SERVICE_OPTIONS.find(s => s.value === selectedService);
    const discoveryMessageCount = stepMessages.filter(m => m.role === "user").length;
    const canGenerate = discoveryMessageCount >= 2; // At least 2 user responses before generating

    return (
      <div className="flex flex-col h-[calc(100vh-6rem)]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={handleReset}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold tracking-tight flex items-center gap-2">
                <span>{serviceOption?.icon}</span>
                {t(serviceOption?.labelKey || "")}
              </h1>
              <p className="text-xs text-muted-foreground">
                {t("ai.step")} {currentStepIndex + 1} {t("ai.of")} {workflowSteps.length} — {currentStep.title}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="h-3.5 w-3.5 me-1.5" />
              {locale === "ar" ? "إعادة" : "Reset"}
            </Button>
          </div>
        </div>

        {/* Progress & Steps */}
        <div className="space-y-2 pb-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{locale === "ar" ? "التقدم" : "Progress"}</span>
            <span className="font-medium">{completedSteps}/{workflowSteps.length}</span>
          </div>
          <Progress value={progressPercent} className="h-1.5" />
          <div className="flex gap-1 overflow-x-auto pb-1">
            {workflowSteps.map((step, idx) => (
              <button
                key={idx}
                onClick={() => navigateToStep(idx)}
                className={`shrink-0 h-7 min-w-7 px-2 rounded-md text-[10px] font-medium flex items-center gap-1 transition-all ${
                  idx === currentStepIndex
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : step.completed
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {step.completed ? <CheckCircle2 className="h-2.5 w-2.5" /> : <span>{idx + 1}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Current Step Info */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border mb-3">
          <Badge className={`${stageColors[currentStep.stage]} border-0 text-[10px]`}>
            {t(`stage.${currentStep.stage}`)}
          </Badge>
          <span className="text-xs font-medium flex-1 truncate">{currentStep.title}</span>
          {currentStep.deliverable && (
            <Badge variant="outline" className="text-[10px] gap-1">
              <FileText className="h-2.5 w-2.5" />
              {currentStep.deliverable}
            </Badge>
          )}
          {stepPhase === "discovery" && (
            <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0 text-[10px] gap-1">
              <Lightbulb className="h-2.5 w-2.5" />
              {locale === "ar" ? "استكشاف" : "Discovery"}
            </Badge>
          )}
          {stepPhase === "generating" && (
            <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-0 text-[10px] gap-1">
              <Loader2 className="h-2.5 w-2.5 animate-spin" />
              {locale === "ar" ? "يولد..." : "Generating..."}
            </Badge>
          )}
        </div>

        {/* Discovery Conversation */}
        <Card className="flex-1 flex flex-col overflow-hidden shadow-sm">
          <ScrollArea className="flex-1 p-4" ref={guidedScrollRef}>
            {stepMessages.length === 0 && !chatMutation.isPending ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
                  <Brain className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground max-w-md">
                  {locale === "ar"
                    ? "المستشار هيبدأ يسألك أسئلة عشان يفهم وضعك. جاوب بصراحة وبالتفصيل — كل ما تديله معلومات أكتر، كل ما المخرجات هتبقى أحسن."
                    : "The consultant will start asking you questions to understand your situation. Answer honestly and in detail — the more information you provide, the better the deliverables."}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {stepMessages.map((msg, idx) => (
                  <div key={idx} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
                    {msg.role === "assistant" && (
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                        <Brain className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <div className={`max-w-[80%] rounded-xl p-3 ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/50 border"
                    }`}>
                      {msg.role === "assistant" ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          <Streamdown>{msg.content}</Streamdown>
                        </div>
                      ) : (
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      )}
                    </div>
                    {msg.role === "user" && (
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                    )}
                  </div>
                ))}
                {chatMutation.isPending && stepPhase !== "generating" && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Brain className="h-4 w-4 text-primary" />
                    </div>
                    <div className="bg-muted/50 border rounded-xl p-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {locale === "ar" ? "يفكر..." : "Thinking..."}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          {/* Input Area */}
          <div className="border-t p-3 bg-background space-y-2">
            {/* Generate Button - shown when enough discovery is done */}
            {stepPhase === "discovery" && canGenerate && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                <Sparkles className="h-4 w-4 text-emerald-600 shrink-0" />
                <span className="text-xs text-emerald-700 dark:text-emerald-400 flex-1">
                  {locale === "ar"
                    ? "جاهز لتوليد المخرج؟ أو كمّل الحوار لمعلومات أعمق."
                    : "Ready to generate deliverable? Or continue the conversation for deeper insights."}
                </span>
                <Button
                  size="sm"
                  onClick={generateDeliverable}
                  disabled={chatMutation.isPending}
                  className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white h-7 text-xs"
                >
                  <Sparkles className="h-3 w-3" />
                  {locale === "ar" ? "ولّد المخرج" : "Generate"}
                </Button>
              </div>
            )}

            {stepPhase === "generating" && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <Loader2 className="h-4 w-4 text-blue-600 animate-spin shrink-0" />
                <span className="text-xs text-blue-700 dark:text-blue-400">
                  {locale === "ar"
                    ? "جاري توليد المخرج بناءً على المحادثة..."
                    : "Generating deliverable based on the conversation..."}
                </span>
              </div>
            )}

            <div className="flex gap-2">
              <Textarea
                  maxLength={10000}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={locale === "ar"
                  ? "جاوب على سؤال المستشار..."
                  : "Answer the consultant's question..."}
                className="min-h-[44px] max-h-[120px] resize-none bg-muted/30"
                rows={1}
                disabled={stepPhase === "generating"}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleGuidedSend();
                  }
                }}
              />
              <Button
                onClick={handleGuidedSend}
                disabled={!input.trim() || chatMutation.isPending || stepPhase === "generating"}
                className="shrink-0 h-11 w-11"
                size="icon"
              >
                {chatMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </Card>

        {/* Generate Proposal from Workflow - shown when all steps are completed */}
        {allStepsCompleted && (
          <div className="mt-3">
            <Card className="border-2 border-primary/30 bg-primary/5 shadow-sm">
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold">
                      {locale === "ar" ? "جميع الخطوات مكتملة!" : "All Steps Completed!"}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {locale === "ar"
                        ? "يمكنك الآن توليد عرض سعر احترافي مبني على كل المعلومات اللي جمعناها."
                        : "You can now generate a professional proposal based on all the information gathered."}
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      // Collect all step messages into one conversation
                      const allMessages: Message[] = [];
                      workflowSteps.forEach(step => {
                        if (step.result) {
                          allMessages.push({ role: "assistant", content: `[${step.title}]: ${step.result.substring(0, 500)}` });
                        }
                      });
                      // Also include current step messages
                      allMessages.push(...stepMessages);
                      handleGenerateProposal(allMessages.length > 0 ? allMessages : stepMessages);
                    }}
                    disabled={generatingProposal}
                    className="gap-2 shrink-0"
                  >
                    {generatingProposal ? (
                      <><Loader2 className="h-4 w-4 animate-spin" />{locale === "ar" ? "جاري التوليد..." : "Generating..."}</>
                    ) : (
                      <><FileText className="h-4 w-4" />{locale === "ar" ? "ولّد عرض سعر" : "Generate Proposal"}</>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Result Dialog */}
        <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
          <DialogContent className="max-w-3xl max-h-[85vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                {currentStep.deliverable || currentStep.title}
              </DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh]">
              <div className="prose prose-sm dark:prose-invert max-w-none p-1">
                <Streamdown>{stepResult}</Streamdown>
              </div>
            </ScrollArea>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => {
                setShowResultDialog(false);
                setStepPhase("discovery");
                setStepResult("");
              }}>
                {locale === "ar" ? "رجوع للحوار" : "Back to Conversation"}
              </Button>
              <Button onClick={markStepComplete} className="gap-2">
                <CheckCircle2 className="h-4 w-4" />
                {locale === "ar" ? "اعتماد والتالي" : "Approve & Next"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Previous Result Dialog */}
        <Dialog open={viewingResult !== null} onOpenChange={(open) => { if (!open) setViewingResult(null); }}>
          <DialogContent className="max-w-3xl max-h-[85vh]">
            <DialogHeader>
              <DialogTitle>{viewingResult?.title}</DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh]">
              <div className="prose prose-sm dark:prose-invert max-w-none p-1">
                <Streamdown>{viewingResult?.content || ""}</Streamdown>
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ============ FREE CHAT MODE ============
  return (
    <div className="flex flex-col h-[calc(100vh-6rem)]">
      {/* Header */}
      <div className="flex items-center justify-between pb-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={handleReset}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              {t("ai.chatMode")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {locale === "ar"
                ? "مستشار استراتيجي خبير — يشخّص قبل ما يوصف"
                : "Expert strategy consultant — diagnoses before prescribing"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowHistory(!showHistory)} className="gap-1.5">
            <History className="h-3.5 w-3.5" />
            {locale === "ar" ? "السجل" : "History"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleSaveConversation} disabled={messages.length === 0 || saveConversation.isPending} className="gap-1.5">
            {saveConversation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {locale === "ar" ? "حفظ" : "Save"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleReset} className="gap-1.5">
            <RotateCcw className="h-3.5 w-3.5" />
            {locale === "ar" ? "جديد" : "New"}
          </Button>
        </div>
      </div>

      {/* Conversation History Panel */}
      {showHistory && conversations && conversations.length > 0 && (
        <Card className="shadow-sm mb-3">
          <CardContent className="py-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                {locale === "ar" ? "المحادثات السابقة" : "Previous Conversations"}
              </h3>
            </div>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {conversations.map((convo: any) => (
                <button
                  key={convo.id}
                  onClick={() => loadConversation(convo)}
                  className={`w-full text-start p-2 rounded-lg text-xs hover:bg-muted/80 transition-colors flex items-center gap-2 ${
                    conversationId === convo.id ? 'bg-primary/10 border border-primary/20' : 'bg-muted/30'
                  }`}
                >
                  <MessageSquare className="h-3 w-3 text-muted-foreground shrink-0" />
                  <span className="truncate flex-1">{convo.title || 'Untitled'}</span>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {new Date(convo.updatedAt).toLocaleDateString()}
                  </span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Context Selectors */}
      <div className="flex flex-wrap gap-3 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{locale === "ar" ? "الخدمة:" : "Service:"}</span>
          <Select value={serviceContext} onValueChange={setServiceContext}>
            <SelectTrigger className="h-8 text-xs w-48 bg-background"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="general">{locale === "ar" ? "استراتيجية عامة" : "General Strategy"}</SelectItem>
              {SERVICE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{t(opt.labelKey)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{t("ai.selectClient")}:</span>
          <Select value={clientId ? String(clientId) : "none"} onValueChange={(v) => setClientId(v === "none" ? undefined : Number(v))}>
            <SelectTrigger className="h-8 text-xs w-48 bg-background"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{locale === "ar" ? "بدون عميل محدد" : "No specific client"}</SelectItem>
              {clients?.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>{c.companyName || c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Auto-Research Indicator */}
      {isResearching && (
        <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-700 dark:text-blue-300 animate-pulse">
          <Loader2 className="h-4 w-4 animate-spin" />
          {locale === 'ar' ? 'جاري البحث التلقائي عن العميل...' : 'Auto-researching client background...'}
        </div>
      )}
      {researchSummary && !isResearching && (
        <div className="flex items-center gap-2 p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-xs text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="h-3.5 w-3.5" />
          {locale === 'ar' ? 'تم البحث — المعلومات متاحة للـ AI' : 'Research data loaded — AI responses are now data-driven'}
        </div>
      )}

      {/* Chat Area */}
      <Card className="flex-1 flex flex-col overflow-hidden shadow-sm">
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Brain className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-lg font-medium mb-2">
                {locale === "ar" ? "مستشار Wzrd AI الاستراتيجي" : "Wzrd AI Strategy Consultant"}
              </h3>
              <p className="text-sm text-muted-foreground max-w-md mb-6">
                {locale === "ar"
                  ? "مش chatbot — مستشار استراتيجي مدرب على منهجية Wzrd AI. هسألك قبل ما أجاوب، وهشخّص قبل ما أوصف."
                  : "Not a chatbot — a strategy consultant trained on Wzrd AI's methodology. I'll ask before I answer, and diagnose before I prescribe."}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-w-lg">
                {(locale === "ar" ? [
                  "عندي مطعم في الرياض ومش عارف أوصل للعملاء الصح",
                  "عايز أبني brand identity لشركة تقنية ناشئة",
                  "البيزنس بتاعي شغال بس مش بيكبر — إيه المشكلة؟",
                  "عايز أفهم ليه العملاء بيختاروا المنافسين مش أنا",
                ] : [
                  "I have a restaurant in Riyadh and can't reach the right customers",
                  "I want to build a brand identity for a tech startup",
                  "My business is running but not growing — what's wrong?",
                  "I want to understand why customers choose competitors over me",
                ]).map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setInput(suggestion)}
                    className="text-start text-xs p-3 rounded-lg border hover:border-primary/30 hover:bg-primary/5 transition-colors text-muted-foreground"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                      <Brain className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div className={`max-w-[80%] rounded-xl p-3 ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/50 border"
                  }`}>
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <Streamdown>{msg.content}</Streamdown>
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>
                  {msg.role === "user" && (
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                  )}
                </div>
              ))}
              {chatMutation.isPending && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Brain className="h-4 w-4 text-primary" />
                  </div>
                  <div className="bg-muted/50 border rounded-xl p-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {locale === "ar" ? "يفكر..." : "Thinking..."}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Input */}
        <div className="border-t p-3 bg-background space-y-2">
          {/* Generate Proposal Banner - shown after enough conversation */}
          {canGenerateProposalFromChat && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/5 border border-primary/20">
              <FileText className="h-4 w-4 text-primary shrink-0" />
              <span className="text-xs text-muted-foreground flex-1">
                {locale === "ar"
                  ? "جاهز لتوليد عرض سعر مبني على المحادثة؟"
                  : "Ready to generate a proposal based on this conversation?"}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleGenerateProposal(messages)}
                disabled={generatingProposal || chatMutation.isPending}
                className="gap-1.5 h-7 text-xs border-primary/30 text-primary hover:bg-primary/10"
              >
                {generatingProposal ? (
                  <><Loader2 className="h-3 w-3 animate-spin" />{locale === "ar" ? "جاري التوليد..." : "Generating..."}</>
                ) : (
                  <><FileText className="h-3 w-3" />{locale === "ar" ? "ولّد عرض سعر" : "Generate Proposal"}</>
                )}
              </Button>
            </div>
          )}

          <div className="flex gap-2">
            <Textarea
                  maxLength={10000}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("ai.typeMessage")}
              className="min-h-[44px] max-h-[120px] resize-none bg-muted/30"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleChatSend();
                }
              }}
            />
            <Button
              onClick={handleChatSend}
              disabled={!input.trim() || chatMutation.isPending}
              className="shrink-0 h-11 w-11"
              size="icon"
            >
              {chatMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
