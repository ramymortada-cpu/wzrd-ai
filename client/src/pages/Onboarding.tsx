import { trpc } from "@/lib/trpc";
import { useI18n } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import {
  Building2, User, Mail, Phone, Globe, MapPin, Factory,
  ArrowRight, ArrowLeft, Sparkles, FileText, CheckCircle2,
  Loader2, Wand2, ClipboardCheck, MessageSquare, Rocket
} from "lucide-react";

const STEPS = [
  { id: "company_info", icon: Building2, labelEn: "Company Info", labelAr: "معلومات الشركة" },
  { id: "needs_assessment", icon: MessageSquare, labelEn: "Needs Assessment", labelAr: "تقييم الاحتياجات" },
  { id: "service_recommendation", icon: Wand2, labelEn: "AI Recommendation", labelAr: "توصية الذكاء" },
  { id: "proposal_review", icon: FileText, labelEn: "Proposal", labelAr: "العرض" },
  { id: "contract", icon: ClipboardCheck, labelEn: "Complete", labelAr: "إتمام" },
];

const ASSESSMENT_QUESTIONS_EN = [
  "What is your company's main product or service?",
  "Who is your target customer? Describe them in detail.",
  "What is your biggest business challenge right now?",
  "Do you have an existing brand identity (logo, colors, messaging)?",
  "What are your revenue goals for the next 12 months?",
  "How do you currently acquire customers?",
  "What differentiates you from competitors?",
  "What is your monthly marketing budget?",
];

const ASSESSMENT_QUESTIONS_AR = [
  "ما هو المنتج أو الخدمة الرئيسية لشركتك؟",
  "من هو عميلك المستهدف؟ صفه بالتفصيل.",
  "ما هو أكبر تحدي تجاري تواجهه الآن؟",
  "هل لديك هوية علامة تجارية حالية (شعار، ألوان، رسائل)؟",
  "ما هي أهداف إيراداتك للـ 12 شهر القادمة؟",
  "كيف تكتسب العملاء حالياً؟",
  "ما الذي يميزك عن المنافسين؟",
  "ما هي ميزانيتك التسويقية الشهرية؟",
];

const SERVICE_INFO: Record<string, { nameEn: string; nameAr: string; descEn: string; descAr: string; icon: string }> = {
  clarity_package: {
    nameEn: "Clarity Package",
    nameAr: "باقة الوضوح",
    descEn: "Business Logic — Engineers the commercial foundation. Structures offers, develops pricing logic, maps customer journeys, and creates growth systems.",
    descAr: "المنطق التجاري — هندسة الأساس التجاري. هيكلة العروض، تطوير منطق التسعير، رسم رحلات العملاء، وإنشاء أنظمة النمو.",
    icon: "🔍",
  },
  brand_foundation: {
    nameEn: "Brand Foundation",
    nameAr: "أساس العلامة التجارية",
    descEn: "Brand Identity — Builds the complete brand system from positioning to visual identity, messaging framework, and brand guidelines.",
    descAr: "هوية العلامة التجارية — بناء نظام العلامة التجارية الكامل من التموضع إلى الهوية البصرية، إطار الرسائل، وإرشادات العلامة.",
    icon: "🎨",
  },
  growth_partnership: {
    nameEn: "Growth Partnership",
    nameAr: "شراكة النمو",
    descEn: "Social Performance — Ongoing strategic partnership for content strategy, social media management, and performance marketing.",
    descAr: "الأداء الاجتماعي — شراكة استراتيجية مستمرة لاستراتيجية المحتوى، إدارة وسائل التواصل الاجتماعي، والتسويق بالأداء.",
    icon: "🚀",
  },
  business_health_check: {
    nameEn: "Business Health Check",
    nameAr: "فحص صحة الأعمال",
    descEn: "Comprehensive diagnostic of your business health across brand, operations, and market positioning.",
    descAr: "تشخيص شامل لصحة أعمالك عبر العلامة التجارية والعمليات والتموضع في السوق.",
    icon: "🏥",
  },
  starting_business_logic: {
    nameEn: "Starting Business Logic",
    nameAr: "تأسيس المنطق التجاري",
    descEn: "For new businesses: build your commercial foundation from scratch with proper business logic and market strategy.",
    descAr: "للأعمال الجديدة: بناء أساسك التجاري من الصفر بمنطق تجاري سليم واستراتيجية سوقية.",
    icon: "💡",
  },
  brand_identity: {
    nameEn: "Brand Identity",
    nameAr: "هوية العلامة التجارية",
    descEn: "Complete brand identity system: positioning, visual identity, messaging, and brand guidelines.",
    descAr: "نظام هوية علامة تجارية كامل: التموضع، الهوية البصرية، الرسائل، وإرشادات العلامة.",
    icon: "✨",
  },
  business_takeoff: {
    nameEn: "Business Takeoff",
    nameAr: "انطلاقة الأعمال",
    descEn: "Full-scale launch package: brand + business logic + social strategy + execution plan.",
    descAr: "باقة إطلاق شاملة: العلامة التجارية + المنطق التجاري + استراتيجية التواصل + خطة التنفيذ.",
    icon: "🛫",
  },
  consultation: {
    nameEn: "Consultation",
    nameAr: "استشارة",
    descEn: "Strategic consultation session for specific business challenges.",
    descAr: "جلسة استشارية استراتيجية لتحديات أعمال محددة.",
    icon: "💬",
  },
};

export default function OnboardingPage() {
  const { t, locale } = useI18n();
  const [, setLocation] = useLocation();
  const isAr = locale === "ar";

  // Session state
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  // Company info form
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [market, setMarket] = useState<string>("ksa");
  const [industry, setIndustry] = useState("");
  const [website, setWebsite] = useState("");

  // Assessment
  const [assessmentAnswers, setAssessmentAnswers] = useState<string[]>(new Array(8).fill(""));
  const [currentQuestion, setCurrentQuestion] = useState(0);

  // Recommendation
  const [recommendedService, setRecommendedService] = useState("");
  const [recommendationReason, setRecommendationReason] = useState("");
  const [selectedService, setSelectedService] = useState("");

  // Proposal
  const [proposalId, setProposalId] = useState<number | null>(null);
  const [proposalLanguage, setProposalLanguage] = useState<"en" | "ar">(isAr ? "ar" : "en");

  // Project result
  const [completedProjectId, setCompletedProjectId] = useState<number | null>(null);
  const [completedClientId, setCompletedClientId] = useState<number | null>(null);

  // Mutations
  const createSession = trpc.onboarding.create.useMutation();
  const updateCompanyInfo = trpc.onboarding.updateCompanyInfo.useMutation();
  const assessNeeds = trpc.onboarding.assessNeeds.useMutation();
  const confirmService = trpc.onboarding.confirmService.useMutation();
  const generateProposal = trpc.onboarding.generateProposal.useMutation();
  const completeOnboarding = trpc.onboarding.complete.useMutation();

  const questions = isAr ? ASSESSMENT_QUESTIONS_AR : ASSESSMENT_QUESTIONS_EN;
  const progress = useMemo(() => ((currentStep + 1) / STEPS.length) * 100, [currentStep]);

  // Step 1: Create session and save company info
  const handleCompanyInfoSubmit = async () => {
    if (!companyName.trim() || !contactName.trim()) {
      toast.error(isAr ? "يرجى ملء الحقول المطلوبة" : "Please fill required fields");
      return;
    }
    try {
      let sid = sessionId;
      if (!sid) {
        const result = await createSession.mutateAsync({});
        sid = (result as { id: number }).id;
        setSessionId(sid);
      }
      await updateCompanyInfo.mutateAsync({
        id: sid,
        companyName: companyName.trim(),
        contactName: contactName.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        market: market as "ksa" | "egypt" | "uae" | "other",
        industry: industry.trim() || undefined,
        website: website.trim() || undefined,
      });
      setCurrentStep(1);
      toast.success(isAr ? "تم حفظ معلومات الشركة" : "Company info saved");
    } catch (err: any) {
      toast.error(err.message || "Error saving company info");
    }
  };

  // Step 2: Submit assessment answers
  const handleAssessmentSubmit = async () => {
    if (!sessionId) return;
    const filledAnswers = assessmentAnswers.filter(a => a.trim());
    if (filledAnswers.length < 3) {
      toast.error(isAr ? "يرجى الإجابة على 3 أسئلة على الأقل" : "Please answer at least 3 questions");
      return;
    }
    try {
      const answers = questions.map((q, i) => ({
        question: q,
        answer: assessmentAnswers[i] || "",
      })).filter(a => a.answer.trim());

      const result = await assessNeeds.mutateAsync({ id: sessionId, answers });
      setRecommendedService(result.service);
      setRecommendationReason(result.reason);
      setSelectedService(result.service);
      setCurrentStep(2);
      toast.success(isAr ? "تم تحليل احتياجاتك" : "Needs analyzed successfully");
    } catch (err: any) {
      toast.error(err.message || "Error analyzing needs");
    }
  };

  // Step 3: Confirm service and create client
  const handleConfirmService = async () => {
    if (!sessionId || !selectedService) return;
    try {
      await confirmService.mutateAsync({ id: sessionId, serviceType: selectedService });
      setCurrentStep(3);
      toast.success(isAr ? "تم تأكيد الخدمة" : "Service confirmed");
    } catch (err: any) {
      toast.error(err.message || "Error confirming service");
    }
  };

  // Step 4: Generate proposal
  const handleGenerateProposal = async () => {
    if (!sessionId) return;
    try {
      const result = await generateProposal.mutateAsync({ id: sessionId, language: proposalLanguage });
      setProposalId(result.proposalId);
      toast.success(isAr ? "تم إنشاء العرض" : "Proposal generated");
    } catch (err: any) {
      toast.error(err.message || "Error generating proposal");
    }
  };

  // Step 5: Complete onboarding
  const handleComplete = async () => {
    if (!sessionId) return;
    try {
      const result = await completeOnboarding.mutateAsync({ id: sessionId });
      setCompletedProjectId(result.projectId || null);
      setCompletedClientId(result.clientId || null);
      setCurrentStep(4);
      toast.success(isAr ? "تم إتمام التسجيل بنجاح!" : "Onboarding completed successfully!");
    } catch (err: any) {
      toast.error(err.message || "Error completing onboarding");
    }
  };

  const isLoading = createSession.isPending || updateCompanyInfo.isPending || assessNeeds.isPending || confirmService.isPending || generateProposal.isPending || completeOnboarding.isPending;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Rocket className="h-6 w-6 text-primary" />
            {isAr ? "معالج تسجيل العميل" : "Client Onboarding Wizard"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isAr ? "سجل عميل جديد خطوة بخطوة — من المعلومات إلى المشروع" : "Register a new client step by step — from info to project"}
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-3">
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between">
          {STEPS.map((step, i) => {
            const StepIcon = step.icon;
            const isActive = i === currentStep;
            const isCompleted = i < currentStep;
            return (
              <div key={step.id} className={`flex flex-col items-center gap-1 transition-all ${isActive ? "scale-110" : ""}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  isCompleted ? "bg-primary text-primary-foreground" :
                  isActive ? "bg-primary/20 text-primary ring-2 ring-primary" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <StepIcon className="h-5 w-5" />}
                </div>
                <span className={`text-xs text-center hidden sm:block ${isActive ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                  {isAr ? step.labelAr : step.labelEn}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step 1: Company Info */}
      {currentStep === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              {isAr ? "معلومات الشركة" : "Company Information"}
            </CardTitle>
            <CardDescription>
              {isAr ? "أدخل المعلومات الأساسية عن العميل وشركته" : "Enter basic information about the client and their company"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" />
                  {isAr ? "اسم الشركة" : "Company Name"} <span className="text-destructive">*</span>
                </Label>
                <Input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder={isAr ? "مثال: شركة النجاح" : "e.g. Success Corp"} />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  {isAr ? "اسم جهة الاتصال" : "Contact Name"} <span className="text-destructive">*</span>
                </Label>
                <Input value={contactName} onChange={e => setContactName(e.target.value)} placeholder={isAr ? "الاسم الكامل" : "Full name"} />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  {isAr ? "البريد الإلكتروني" : "Email"}
                </Label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" />
                  {isAr ? "الهاتف" : "Phone"}
                </Label>
                <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+966 5XX XXX XXXX" />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  {isAr ? "السوق" : "Market"} <span className="text-destructive">*</span>
                </Label>
                <Select value={market} onValueChange={setMarket}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ksa">{isAr ? "السعودية" : "Saudi Arabia"}</SelectItem>
                    <SelectItem value="egypt">{isAr ? "مصر" : "Egypt"}</SelectItem>
                    <SelectItem value="uae">{isAr ? "الإمارات" : "UAE"}</SelectItem>
                    <SelectItem value="other">{isAr ? "أخرى" : "Other"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Factory className="h-3.5 w-3.5" />
                  {isAr ? "القطاع" : "Industry"}
                </Label>
                <Input value={industry} onChange={e => setIndustry(e.target.value)} placeholder={isAr ? "مثال: مطاعم، تقنية، عقارات" : "e.g. F&B, Tech, Real Estate"} />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5" />
                {isAr ? "الموقع الإلكتروني" : "Website"}
              </Label>
              <Input value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://example.com" />
            </div>
            <Separator />
            <div className="flex justify-end">
              <Button onClick={handleCompanyInfoSubmit} disabled={isLoading} className="gap-2">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                {isAr ? "التالي: تقييم الاحتياجات" : "Next: Needs Assessment"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Needs Assessment */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              {isAr ? "تقييم الاحتياجات" : "Needs Assessment"}
            </CardTitle>
            <CardDescription>
              {isAr ? "أجب عن الأسئلة التالية لمساعدة الذكاء الاصطناعي في تحديد الخدمة المناسبة" : "Answer the following questions to help AI determine the right service"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Question navigation */}
            <div className="flex items-center gap-2 flex-wrap">
              {questions.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentQuestion(i)}
                  className={`w-8 h-8 rounded-full text-xs font-medium transition-all ${
                    i === currentQuestion
                      ? "bg-primary text-primary-foreground"
                      : assessmentAnswers[i]?.trim()
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            {/* Current question */}
            <div className="space-y-3 p-4 rounded-lg bg-muted/50 border">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {isAr ? `سؤال ${currentQuestion + 1} من ${questions.length}` : `Question ${currentQuestion + 1} of ${questions.length}`}
                </Badge>
              </div>
              <p className="font-medium text-lg">{questions[currentQuestion]}</p>
              <Textarea
                value={assessmentAnswers[currentQuestion]}
                onChange={e => {
                  const newAnswers = [...assessmentAnswers];
                  newAnswers[currentQuestion] = e.target.value;
                  setAssessmentAnswers(newAnswers);
                }}
                placeholder={isAr ? "اكتب إجابتك هنا..." : "Type your answer here..."}
                rows={4}
                className="resize-none"
              />
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentQuestion === 0}
                  onClick={() => setCurrentQuestion(prev => prev - 1)}
                  className="gap-1"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  {isAr ? "السابق" : "Previous"}
                </Button>
                {currentQuestion < questions.length - 1 ? (
                  <Button
                    size="sm"
                    onClick={() => setCurrentQuestion(prev => prev + 1)}
                    className="gap-1"
                  >
                    {isAr ? "التالي" : "Next"}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                ) : null}
              </div>
            </div>

            <Separator />
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep(0)} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                {isAr ? "رجوع" : "Back"}
              </Button>
              <Button onClick={handleAssessmentSubmit} disabled={isLoading} className="gap-2">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {isAr ? "تحليل بالذكاء الاصطناعي" : "Analyze with AI"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Service Recommendation */}
      {currentStep === 2 && (
        <div className="space-y-4">
          {/* AI Recommendation */}
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="h-5 w-5 text-primary" />
                {isAr ? "توصية الذكاء الاصطناعي" : "AI Recommendation"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recommendedService && SERVICE_INFO[recommendedService] && (
                <div className="flex items-start gap-4 p-4 rounded-lg bg-background border">
                  <span className="text-3xl">{SERVICE_INFO[recommendedService].icon}</span>
                  <div className="flex-1 space-y-2">
                    <h3 className="font-semibold text-lg">
                      {isAr ? SERVICE_INFO[recommendedService].nameAr : SERVICE_INFO[recommendedService].nameEn}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {isAr ? SERVICE_INFO[recommendedService].descAr : SERVICE_INFO[recommendedService].descEn}
                    </p>
                    {recommendationReason && (
                      <div className="mt-3 p-3 rounded-md bg-muted/50 text-sm">
                        <p className="font-medium mb-1">{isAr ? "سبب التوصية:" : "Why this service:"}</p>
                        <p className="text-muted-foreground">{recommendationReason}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* All services to choose from */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {isAr ? "أو اختر خدمة أخرى" : "Or choose a different service"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(SERVICE_INFO).map(([key, info]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedService(key)}
                    className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-all hover:border-primary/50 ${
                      selectedService === key ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border"
                    }`}
                  >
                    <span className="text-xl mt-0.5">{info.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {isAr ? info.nameAr : info.nameEn}
                        {key === recommendedService && (
                          <Badge variant="secondary" className="ms-2 text-[10px]">
                            {isAr ? "موصى به" : "Recommended"}
                          </Badge>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {isAr ? info.descAr : info.descEn}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setCurrentStep(1)} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              {isAr ? "رجوع" : "Back"}
            </Button>
            <Button onClick={handleConfirmService} disabled={isLoading || !selectedService} className="gap-2">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              {isAr ? "تأكيد الخدمة وإنشاء العرض" : "Confirm Service & Create Proposal"}
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Proposal */}
      {currentStep === 3 && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                {isAr ? "إنشاء العرض" : "Generate Proposal"}
              </CardTitle>
              <CardDescription>
                {isAr ? "سيقوم الذكاء الاصطناعي بإنشاء عرض احترافي مخصص لهذا العميل" : "AI will generate a professional proposal customized for this client"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{isAr ? "لغة العرض" : "Proposal Language"}</Label>
                <Select value={proposalLanguage} onValueChange={v => setProposalLanguage(v as "en" | "ar")}>
                  <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="ar">العربية</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {!proposalId ? (
                <Button onClick={handleGenerateProposal} disabled={isLoading} className="gap-2 w-full" size="lg">
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {isAr ? "جاري إنشاء العرض..." : "Generating proposal..."}
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      {isAr ? "إنشاء العرض بالذكاء الاصطناعي" : "Generate Proposal with AI"}
                    </>
                  )}
                </Button>
              ) : (
                <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-medium">{isAr ? "تم إنشاء العرض بنجاح!" : "Proposal generated successfully!"}</span>
                  </div>
                  <Button variant="outline" onClick={() => setLocation(`/proposals/${proposalId}`)} className="gap-2">
                    <FileText className="h-4 w-4" />
                    {isAr ? "عرض العرض" : "View Proposal"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setCurrentStep(2)} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              {isAr ? "رجوع" : "Back"}
            </Button>
            <Button onClick={handleComplete} disabled={isLoading} className="gap-2">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {isAr ? "إتمام التسجيل وإنشاء المشروع" : "Complete & Create Project"}
            </Button>
          </div>
        </div>
      )}

      {/* Step 5: Completed */}
      {currentStep === 4 && (
        <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20">
          <CardContent className="py-12 text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">
                {isAr ? "تم تسجيل العميل بنجاح!" : "Client Onboarded Successfully!"}
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                {isAr
                  ? `تم إنشاء ملف العميل "${companyName}" والمشروع بنجاح. يمكنك الآن البدء في العمل.`
                  : `Client "${companyName}" and project have been created successfully. You can now start working.`}
              </p>
            </div>
            <Separator className="max-w-xs mx-auto" />
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              {completedProjectId && (
                <Button onClick={() => setLocation(`/projects/${completedProjectId}`)} className="gap-2">
                  <Rocket className="h-4 w-4" />
                  {isAr ? "الذهاب للمشروع" : "Go to Project"}
                </Button>
              )}
              {completedClientId && (
                <Button variant="outline" onClick={() => setLocation(`/clients/${completedClientId}`)} className="gap-2">
                  <User className="h-4 w-4" />
                  {isAr ? "عرض العميل" : "View Client"}
                </Button>
              )}
              {proposalId && (
                <Button variant="outline" onClick={() => setLocation(`/proposals/${proposalId}`)} className="gap-2">
                  <FileText className="h-4 w-4" />
                  {isAr ? "عرض العرض" : "View Proposal"}
                </Button>
              )}
              <Button variant="ghost" onClick={() => {
                // Reset wizard
                setSessionId(null);
                setCurrentStep(0);
                setCompanyName("");
                setContactName("");
                setEmail("");
                setPhone("");
                setMarket("ksa");
                setIndustry("");
                setWebsite("");
                setAssessmentAnswers(new Array(8).fill(""));
                setCurrentQuestion(0);
                setRecommendedService("");
                setRecommendationReason("");
                setSelectedService("");
                setProposalId(null);
                setCompletedProjectId(null);
                setCompletedClientId(null);
              }} className="gap-2">
                <Rocket className="h-4 w-4" />
                {isAr ? "تسجيل عميل آخر" : "Onboard Another Client"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
