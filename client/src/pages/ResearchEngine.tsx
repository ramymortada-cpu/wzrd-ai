import { EmptyState } from "@/components/EmptyState";
import { PageSkeleton } from "@/components/PageSkeleton";
import { trpc } from "@/lib/trpc";
import { useI18n } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Search, Globe, GraduationCap, Building2, TrendingUp, Loader2,
  FileText, ExternalLink, Brain, Lightbulb, Target, Shield,
  Zap, Clock, Database, ChevronRight,
  Sparkles, AlertTriangle, CheckCircle2
} from "lucide-react";
import { useState } from "react";
import { Streamdown } from "streamdown";
import { paginatedData } from "@/lib/utils";
import type { ResearchConductFull } from "@/lib/routerTypes";

type ResearchTab = "new" | "reports" | "quick";

type QuickSearchHit = { title?: string; url?: string; snippet?: string };
type QuickResearchUi = {
  summary?: string;
  results?: QuickSearchHit[];
  fromCache: boolean;
};
type CompetitorRow = NonNullable<ResearchConductFull["competitors"]>[number];
type AcademicRow = NonNullable<ResearchConductFull["academicResults"]>[number];

// Research progress steps
const RESEARCH_STEPS = [
  { label: "Searching the web...", icon: Globe },
  { label: "Analyzing competitors...", icon: Building2 },
  { label: "Scraping websites...", icon: FileText },
  { label: "Searching academic research...", icon: GraduationCap },
  { label: "Analyzing market data...", icon: TrendingUp },
  { label: "Synthesizing insights...", icon: Brain },
];

export default function ResearchEnginePage() {
  const { locale } = useI18n();
  const isRTL = locale === "ar";

  // State
  const [activeTab, setActiveTab] = useState<ResearchTab>("new");
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [market, setMarket] = useState("ksa");
  const [website, setWebsite] = useState("");
  const [additionalContext, setAdditionalContext] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<number | undefined>();
  const [isResearching, setIsResearching] = useState(false);
  const [researchProgress, setResearchProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [currentReport, setCurrentReport] = useState<ResearchConductFull | null>(null);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [quickQuery, setQuickQuery] = useState("");
  const [quickResults, setQuickResults] = useState<QuickResearchUi | null>(null);
  const [isQuickSearching, setIsQuickSearching] = useState(false);

  // Data
  const { data: clientsRaw } = trpc.clients.list.useQuery();
  const clients = paginatedData(clientsRaw);
  const { data: reports, refetch: refetchReports } = trpc.research.list.useQuery();
  const { data: stats } = trpc.research.stats.useQuery();

  // Mutations
  const conductResearch = trpc.research.conductFull.useMutation({
    onSuccess: (data) => {
      setIsResearching(false);
      setResearchProgress(100);
      setCurrentReport(data);
      setShowReportDialog(true);
      refetchReports();
      toast.success(isRTL ? "تم إنجاز البحث بنجاح!" : "Research completed successfully!");
    },
    onError: (err) => {
      setIsResearching(false);
      setResearchProgress(0);
      toast.error(err.message);
    },
  });

  const quickResearch = trpc.research.quick.useMutation({
    onSuccess: (data) => {
      setIsQuickSearching(false);
      const resultsRaw = data.results;
      const results = Array.isArray(resultsRaw)
        ? resultsRaw.map((r): QuickSearchHit => {
            const o = typeof r === "object" && r !== null && !Array.isArray(r) ? (r as Record<string, unknown>) : {};
            return {
              title: typeof o.title === "string" ? o.title : String(o.title ?? ""),
              url: typeof o.url === "string" ? o.url : String(o.url ?? ""),
              snippet: typeof o.snippet === "string" ? o.snippet : String(o.snippet ?? ""),
            };
          })
        : undefined;
      const d = data as Record<string, unknown>;
      setQuickResults({
        fromCache: Boolean(data.fromCache),
        summary: typeof d.summary === "string" ? d.summary : undefined,
        results,
      });
    },
    onError: (err) => {
      setIsQuickSearching(false);
      toast.error(err.message);
    },
  });

  // Simulate progress
  const startResearch = () => {
    if (!companyName || !industry) {
      toast.error(isRTL ? "أدخل اسم الشركة والصناعة" : "Enter company name and industry");
      return;
    }

    setIsResearching(true);
    setResearchProgress(0);
    setCurrentStep(0);

    // Simulate progress steps
    const interval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= RESEARCH_STEPS.length - 1) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
      setResearchProgress(prev => Math.min(prev + 15, 90));
    }, 3000);

    conductResearch.mutate({
      companyName,
      industry,
      market,
      website: website || undefined,
    });
  };

  const startQuickSearch = () => {
    if (!quickQuery) return;
    setIsQuickSearching(true);
    setQuickResults(null);
    quickResearch.mutate({ query: quickQuery });
  };

  // Market options
  const marketOptions = [
    { value: "ksa", label: isRTL ? "السعودية" : "Saudi Arabia", flag: "🇸🇦" },
    { value: "egypt", label: isRTL ? "مصر" : "Egypt", flag: "🇪🇬" },
    { value: "uae", label: isRTL ? "الإمارات" : "UAE", flag: "🇦🇪" },
    { value: "other", label: isRTL ? "أخرى" : "Other", flag: "🌍" },
  ];

  const isPageLoading = !clients && !reports;
  if (isPageLoading) return <PageSkeleton />;

  return (
    <div className="space-y-4 sm:space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20">
              <Brain className="h-7 w-7 text-violet-600 dark:text-violet-400" />
            </div>
            {isRTL ? "محرك البحث" : "Research Engine"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isRTL
              ? "بحث ذكي يجمع بيانات السوق والمنافسين والأبحاث الأكاديمية تلقائياً"
              : "AI-powered research that gathers market data, competitor intel, and academic research automatically"}
          </p>
        </div>

        {/* Stats badges */}
        {stats && (
          <div className="flex gap-3">
            <Badge variant="outline" className="px-3 py-1.5 text-sm gap-1.5">
              <Database className="h-3.5 w-3.5" />
              {stats.totalReports} {isRTL ? "تقرير" : "reports"}
            </Badge>
            <Badge variant="outline" className="px-3 py-1.5 text-sm gap-1.5">
              <Globe className="h-3.5 w-3.5" />
              {stats.totalSources} {isRTL ? "مصدر" : "sources"}
            </Badge>
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ResearchTab)}>
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="new" className="gap-2">
            <Search className="h-4 w-4" />
            {isRTL ? "بحث جديد" : "New Research"}
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-2">
            <FileText className="h-4 w-4" />
            {isRTL ? "التقارير" : "Reports"}
          </TabsTrigger>
          <TabsTrigger value="quick" className="gap-2">
            <Zap className="h-4 w-4" />
            {isRTL ? "بحث سريع" : "Quick Search"}
          </TabsTrigger>
        </TabsList>

        {/* ═══════ NEW RESEARCH TAB ═══════ */}
        <TabsContent value="new" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Research Form */}
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-violet-500" />
                    {isRTL ? "بحث شامل عن شركة" : "Full Company Research"}
                  </CardTitle>
                  <CardDescription>
                    {isRTL
                      ? "أدخل بيانات الشركة وسيقوم المحرك بالبحث في الإنترنت، تحليل المنافسين، ومراجعة الأبحاث الأكاديمية"
                      : "Enter company details and the engine will search the web, analyze competitors, and review academic research"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">{isRTL ? "اسم الشركة" : "Company Name"} *</label>
                      <Input
                        maxLength={500}
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder={isRTL ? "مثال: مطعم سوشي ماستر" : "e.g., Sushi Master Restaurant"}
                        disabled={isResearching}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">{isRTL ? "الصناعة" : "Industry"} *</label>
                      <Input
                        maxLength={500}
                        value={industry}
                        onChange={(e) => setIndustry(e.target.value)}
                        placeholder={isRTL ? "مثال: مطاعم، تقنية، عقارات" : "e.g., Restaurants, Tech, Real Estate"}
                        disabled={isResearching}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">{isRTL ? "السوق" : "Market"} *</label>
                      <Select value={market} onValueChange={setMarket} disabled={isResearching}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {marketOptions.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.flag} {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">{isRTL ? "الموقع الإلكتروني" : "Website"}</label>
                      <Input
                        maxLength={500}
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        placeholder="https://example.com"
                        disabled={isResearching}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">{isRTL ? "ربط بعميل" : "Link to Client"}</label>
                      <Select
                        value={selectedClientId?.toString() || "none"}
                        onValueChange={(v) => setSelectedClientId(v === "none" ? undefined : Number(v))}
                        disabled={isResearching}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={isRTL ? "اختياري" : "Optional"} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">{isRTL ? "بدون ربط" : "No link"}</SelectItem>
                          {clients.map((c) => (
                            <SelectItem key={c.id} value={c.id.toString()}>
                              {c.companyName || c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">{isRTL ? "سياق إضافي" : "Additional Context"}</label>
                    <Textarea
                      value={additionalContext}
                      onChange={(e) => setAdditionalContext(e.target.value)}
                      placeholder={isRTL
                        ? "أي معلومات إضافية عن الشركة أو التحديات التي تواجهها..."
                        : "Any additional info about the company or challenges they face..."}
                      rows={3}
                      disabled={isResearching}
                    />
                  </div>

                  {/* Research Progress */}
                  {isResearching && (
                    <div className="space-y-4 p-4 rounded-lg bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800">
                      <div className="flex items-center gap-2 text-violet-700 dark:text-violet-300">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="font-medium">
                          {isRTL ? "جاري البحث..." : "Researching..."}
                        </span>
                      </div>
                      <Progress value={researchProgress} className="h-2" />
                      <div className="space-y-2">
                        {RESEARCH_STEPS.map((step, idx) => {
                          const StepIcon = step.icon;
                          const isActive = idx === currentStep;
                          const isComplete = idx < currentStep;
                          return (
                            <div
                              key={idx}
                              className={`flex items-center gap-2 text-sm transition-all ${
                                isActive
                                  ? "text-violet-700 dark:text-violet-300 font-medium"
                                  : isComplete
                                  ? "text-green-600 dark:text-green-400"
                                  : "text-muted-foreground opacity-50"
                              }`}
                            >
                              {isComplete ? (
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                              ) : isActive ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <StepIcon className="h-4 w-4" />
                              )}
                              {step.label}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={startResearch}
                    disabled={isResearching || !companyName || !industry}
                    className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white"
                    size="lg"
                  >
                    {isResearching ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {isRTL ? "جاري البحث..." : "Researching..."}
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4" />
                        {isRTL ? "ابدأ البحث الشامل" : "Start Full Research"}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Research Info Sidebar */}
            <div className="space-y-4">
              <Card className="border-violet-200 dark:border-violet-800 bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/20 dark:to-indigo-950/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Brain className="h-4 w-4 text-violet-500" />
                    {isRTL ? "ماذا يفعل المحرك؟" : "What does the engine do?"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <Globe className="h-4 w-4 mt-0.5 text-blue-500 shrink-0" />
                    <span>{isRTL ? "يبحث في الإنترنت عن الشركة والمنافسين" : "Searches the web for the company & competitors"}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <FileText className="h-4 w-4 mt-0.5 text-green-500 shrink-0" />
                    <span>{isRTL ? "يستخرج البيانات من مواقع المنافسين" : "Scrapes data from competitor websites"}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <GraduationCap className="h-4 w-4 mt-0.5 text-purple-500 shrink-0" />
                    <span>{isRTL ? "يبحث في الأبحاث الأكاديمية والدراسات" : "Searches academic papers & studies"}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Building2 className="h-4 w-4 mt-0.5 text-orange-500 shrink-0" />
                    <span>{isRTL ? "يحلل المنافسين ونقاط القوة والضعف" : "Analyzes competitors — strengths & weaknesses"}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <TrendingUp className="h-4 w-4 mt-0.5 text-emerald-500 shrink-0" />
                    <span>{isRTL ? "يحلل اتجاهات السوق والفرص" : "Analyzes market trends & opportunities"}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Lightbulb className="h-4 w-4 mt-0.5 text-amber-500 shrink-0" />
                    <span>{isRTL ? "يولد رؤى استراتيجية وتوصيات" : "Generates strategic insights & recommendations"}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="h-4 w-4 text-green-500" />
                    {isRTL ? "التكلفة" : "Cost"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-2">
                    <span className="text-2xl sm:text-3xl font-bold text-green-600">$0</span>
                    <p className="text-sm text-muted-foreground mt-1">
                      {isRTL ? "يستخدم الذكاء المدمج مجاناً" : "Uses built-in AI — completely free"}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Database className="h-4 w-4 text-blue-500" />
                    {isRTL ? "التراكم المعرفي" : "Knowledge Accumulation"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {isRTL
                    ? "كل بحث يُخزَّن تلقائياً. كل عميل جديد يخلي النظام أذكى. البيانات تتراكم مع الوقت."
                    : "Every research is cached automatically. Each new client makes the system smarter. Knowledge accumulates over time."}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ═══════ REPORTS TAB ═══════ */}
        <TabsContent value="reports" className="mt-6">
          <div className="space-y-4">
            {!reports || reports.length === 0 ? (
              <EmptyState
                type="research"
                onAction={() => setActiveTab("new")}
                actionLabel={isRTL ? "بحث جديد" : "New Research"}
              />
            ) : (
              <div className="grid gap-4">
                {reports.map((report) => (
                  <Card
                    key={report.id}
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => {
                      const raw = report.reportData;
                      setCurrentReport(
                        raw != null && typeof raw === "object"
                          ? (raw as ResearchConductFull)
                          : null
                      );
                      setShowReportDialog(true);
                    }}
                  >
                    <CardContent className="flex items-center justify-between py-4">
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/30">
                          <Building2 className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                        </div>
                        <div>
                          <h3 className="font-medium">{report.companyName}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{report.industry}</span>
                            <span>•</span>
                            <span>{report.market === 'ksa' ? '🇸🇦' : report.market === 'egypt' ? '🇪🇬' : report.market === 'uae' ? '🇦🇪' : '🌍'} {report.market}</span>
                            <span>•</span>
                            <Clock className="h-3 w-3" />
                            <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={report.status === 'completed' ? 'default' : 'secondary'}>
                          {report.status === 'completed' ? (
                            <><CheckCircle2 className="h-3 w-3" /> {isRTL ? 'مكتمل' : 'Completed'}</>
                          ) : (
                            <><Loader2 className="h-3 w-3 animate-spin" /> {isRTL ? 'جاري' : 'Pending'}</>
                          )}
                        </Badge>
                        <Badge variant="outline">
                          {report.totalSources || 0} {isRTL ? "مصدر" : "sources"}
                        </Badge>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* ═══════ QUICK SEARCH TAB ═══════ */}
        <TabsContent value="quick" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-amber-500" />
                  {isRTL ? "بحث سريع" : "Quick Search"}
                </CardTitle>
                <CardDescription>
                  {isRTL
                    ? "بحث سريع عن أي موضوع — مثالي أثناء المحادثات مع العملاء"
                    : "Quick search on any topic — ideal during client conversations"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                        maxLength={500}
                    value={quickQuery}
                    onChange={(e) => setQuickQuery(e.target.value)}
                    placeholder={isRTL ? "ابحث عن أي شيء..." : "Search anything..."}
                    onKeyDown={(e) => e.key === "Enter" && startQuickSearch()}
                    disabled={isQuickSearching}
                  />
                  <Button
                    onClick={startQuickSearch}
                    disabled={isQuickSearching || !quickQuery}
                    className="shrink-0"
                  >
                    {isQuickSearching ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {/* Quick search suggestions */}
                <div className="flex flex-wrap gap-2">
                  {[
                    isRTL ? "سوق المطاعم في الرياض" : "Restaurant market in Riyadh",
                    isRTL ? "اتجاهات التجارة الإلكترونية مصر" : "E-commerce trends Egypt",
                    isRTL ? "استراتيجيات البراندينج 2026" : "Branding strategies 2026",
                  ].map((suggestion) => (
                    <Button
                      key={suggestion}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => {
                        setQuickQuery(suggestion);
                        setIsQuickSearching(true);
                        setQuickResults(null);
                        quickResearch.mutate({ query: suggestion });
                      }}
                      disabled={isQuickSearching}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Results */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {isRTL ? "النتائج" : "Results"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isQuickSearching ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
                  </div>
                ) : quickResults ? (
                  <div className="space-y-4">
                    {quickResults.summary ? (
                      <div className="p-3 rounded-lg bg-violet-50 dark:bg-violet-950/20 text-sm">
                        <Streamdown>{quickResults.summary}</Streamdown>
                      </div>
                    ) : null}
                    {(quickResults.results ?? []).map((r, idx: number) => (
                      <div key={idx} className="border-b last:border-0 pb-3 last:pb-0">
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                        >
                          {r.title}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                        <p className="text-xs text-muted-foreground mt-1">{r.snippet}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Search className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">{isRTL ? "ابحث عن أي شيء" : "Search for anything"}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* ═══════ REPORT DIALOG ═══════ */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="max-w-4xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-violet-500" />
              {isRTL ? "تقرير البحث" : "Research Report"}
              {currentReport?.companyName && ` — ${currentReport.companyName}`}
            </DialogTitle>
            <DialogDescription>
              {currentReport?.totalSources
                ? `${isRTL ? 'مبني على' : 'Based on'} ${currentReport.totalSources} ${isRTL ? 'مصدر' : 'sources'}`
                : ''}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] pr-4">
            {currentReport && (
              <div className="space-y-4 sm:space-y-6">
                {/* Search API warning */}
                {(currentReport as Record<string, unknown>).searchDisabled && (
                  <div className="flex items-start gap-3 p-4 rounded-lg border border-yellow-500/30 bg-yellow-500/10 text-sm">
                    <span className="text-yellow-500 text-lg mt-0.5">⚠️</span>
                    <div>
                      <p className="font-medium text-yellow-600 dark:text-yellow-400">
                        {isRTL ? "تنبيه: البحث مبني على المعرفة العامة فقط" : "Note: Research used AI general knowledge only"}
                      </p>
                      <p className="text-muted-foreground mt-1">
                        {isRTL
                          ? "محرك البحث الخارجي غير مفعّل حالياً. النتائج مبنية على معرفة الـ AI العامة وبيانات الموقع المسحوبة (إن وُجدت)."
                          : "External search API is not configured. Results are based on AI general knowledge and any scraped website data."}
                      </p>
                    </div>
                  </div>
                )}
                {/* Summary */}
                {currentReport.summary && (
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-500" />
                      {isRTL ? "ملخص البحث" : "Research Summary"}
                    </h3>
                    <div className="p-4 rounded-lg bg-muted/50 text-sm leading-relaxed">
                      <Streamdown>{currentReport.summary}</Streamdown>
                    </div>
                  </div>
                )}

                {/* Key Insights */}
                {currentReport.keyInsights?.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-amber-500" />
                      {isRTL ? "رؤى رئيسية" : "Key Insights"}
                    </h3>
                    <div className="space-y-2">
                      {currentReport.keyInsights.map((insight: string, idx: number) => (
                        <div key={idx} className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-sm">
                          <span className="font-bold text-amber-600 shrink-0">{idx + 1}.</span>
                          <span>{insight}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Competitors */}
                {currentReport.competitors?.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-orange-500" />
                      {isRTL ? "تحليل المنافسين" : "Competitor Analysis"}
                    </h3>
                    <div className="grid gap-3">
                      {currentReport.competitors.map((comp: CompetitorRow, idx: number) => (
                        <Card key={idx} className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-medium">{comp.name}</h4>
                              {comp.website && (
                                <a href={comp.website} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline flex items-center gap-1">
                                  {comp.website} <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{comp.positioning}</p>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="font-medium text-green-600">{isRTL ? "نقاط القوة:" : "Strengths:"}</span>
                              <ul className="mt-1 space-y-0.5">
                                {comp.strengths?.map((s: string, i: number) => (
                                  <li key={i} className="flex items-start gap-1">
                                    <CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5 shrink-0" />
                                    {s}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <span className="font-medium text-red-600">{isRTL ? "نقاط الضعف:" : "Weaknesses:"}</span>
                              <ul className="mt-1 space-y-0.5">
                                {comp.weaknesses?.map((w: string, i: number) => (
                                  <li key={i} className="flex items-start gap-1">
                                    <AlertTriangle className="h-3 w-3 text-red-500 mt-0.5 shrink-0" />
                                    {w}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Market Data */}
                {currentReport.marketData && (
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-emerald-500" />
                      {isRTL ? "تحليل السوق" : "Market Analysis"}
                    </h3>
                    <Card className="p-4 space-y-3">
                      <p className="text-sm">{currentReport.marketData.overview}</p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                        <div className="p-2 rounded bg-blue-50 dark:bg-blue-950/20">
                          <span className="font-medium text-blue-600">{isRTL ? "الاتجاهات" : "Trends"}</span>
                          <ul className="mt-1 space-y-0.5">
                            {currentReport.marketData.trends?.map((t: string, i: number) => (
                              <li key={i}>• {t}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="p-2 rounded bg-red-50 dark:bg-red-950/20">
                          <span className="font-medium text-red-600">{isRTL ? "التحديات" : "Challenges"}</span>
                          <ul className="mt-1 space-y-0.5">
                            {currentReport.marketData.challenges?.map((c: string, i: number) => (
                              <li key={i}>• {c}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="p-2 rounded bg-green-50 dark:bg-green-950/20">
                          <span className="font-medium text-green-600">{isRTL ? "الفرص" : "Opportunities"}</span>
                          <ul className="mt-1 space-y-0.5">
                            {currentReport.marketData.opportunities?.map((o: string, i: number) => (
                              <li key={i}>• {o}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </Card>
                  </div>
                )}

                {/* Academic Research */}
                {currentReport.academicResults?.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-purple-500" />
                      {isRTL ? "الأبحاث الأكاديمية" : "Academic Research"}
                    </h3>
                    <div className="space-y-2">
                      {currentReport.academicResults.map((paper: AcademicRow, idx: number) => (
                        <div key={idx} className="p-3 rounded-lg border text-sm">
                          <div className="flex items-start justify-between">
                            <div>
                              <a href={paper.url} target="_blank" rel="noopener noreferrer" className="font-medium text-purple-600 dark:text-purple-400 hover:underline">
                                {paper.title}
                              </a>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {paper.authors} ({paper.year}) — {paper.source}
                              </p>
                            </div>
                          </div>
                          <p className="text-xs mt-1 text-muted-foreground">{paper.snippet}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {currentReport.recommendations?.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Target className="h-4 w-4 text-red-500" />
                      {isRTL ? "التوصيات الاستراتيجية" : "Strategic Recommendations"}
                    </h3>
                    <div className="space-y-2">
                      {currentReport.recommendations.map((rec: string, idx: number) => (
                        <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-950/20 dark:to-indigo-950/20 text-sm">
                          <div className="w-6 h-6 rounded-full bg-violet-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                            {idx + 1}
                          </div>
                          <span>{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
