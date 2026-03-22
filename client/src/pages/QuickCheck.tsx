import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ArrowRight, ArrowLeft, Sparkles, Loader2, Target, TrendingUp, Shield, Zap } from "lucide-react";

const QUICK_CHECK_QUESTIONS = [
  {
    id: "brand_clarity",
    question: "How would you describe your brand's identity in one sentence?",
    questionAr: "كيف تصف هوية علامتك التجارية في جملة واحدة؟",
    placeholder: "e.g., We are a premium coffee brand targeting young professionals...",
    placeholderAr: "مثال: نحن علامة تجارية للقهوة الفاخرة تستهدف المهنيين الشباب...",
  },
  {
    id: "biggest_challenge",
    question: "What is your biggest brand challenge right now?",
    questionAr: "ما هو أكبر تحدي تواجهه علامتك التجارية الآن؟",
    placeholder: "e.g., We're not standing out from competitors, our messaging is inconsistent...",
    placeholderAr: "مثال: لا نتميز عن المنافسين، رسائلنا غير متسقة...",
  },
  {
    id: "growth_goal",
    question: "What would success look like for your brand in the next 6 months?",
    questionAr: "كيف يبدو النجاح لعلامتك التجارية خلال الـ 6 أشهر القادمة؟",
    placeholder: "e.g., Double our social media following, launch in a new market, rebrand completely...",
    placeholderAr: "مثال: مضاعفة متابعينا على السوشيال ميديا، إطلاق في سوق جديد، إعادة بناء البراند بالكامل...",
  },
];

type Step = "info" | "questions" | "loading" | "results";

export default function QuickCheckPage() {
  const [step, setStep] = useState<Step>("info");
  const [formData, setFormData] = useState({
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
    industry: "",
    market: "egypt" as "ksa" | "egypt" | "uae" | "other",
    website: "",
  });
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [result, setResult] = useState<any>(null);

  const submitMutation = trpc.leads.submitQuickCheck.useMutation({
    onSuccess: (data) => {
      setResult(data);
      setStep("results");
    },
    onError: () => {
      setStep("questions");
    },
  });

  const handleInfoSubmit = () => {
    if (!formData.companyName || !formData.email) return;
    setStep("questions");
  };

  const handleAnswerSubmit = () => {
    if (currentQuestion < QUICK_CHECK_QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      return;
    }
    // All questions answered, submit
    setStep("loading");
    const formattedAnswers = QUICK_CHECK_QUESTIONS.map((q) => ({
      question: q.question,
      answer: answers[q.id] || "",
    }));
    submitMutation.mutate({
      ...formData,
      answers: formattedAnswers,
    });
  };

  const scoreColor = (label: string) => {
    if (label === "hot") return "text-red-500";
    if (label === "warm") return "text-amber-500";
    return "text-blue-500";
  };

  const scoreBg = (label: string) => {
    if (label === "hot") return "bg-red-500/10 border-red-500/20";
    if (label === "warm") return "bg-amber-500/10 border-amber-500/20";
    return "bg-blue-500/10 border-blue-500/20";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-white/5 backdrop-blur-xl bg-white/[0.02]">
        <div className="max-w-5xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="https://d2xsxph8kpxj0f.cloudfront.net/310519663371561184/TgSL8MhgJ4oMR4dsotVnRS/wzrd-ai-logo_a6bceffd.png"
              alt="Wzrd AI"
              className="w-10 h-10 rounded-lg"
            />
            <div>
              <h1 className="text-lg font-bold tracking-tight">Wzrd AI</h1>
              <p className="text-xs text-white/50">by Primo Marca</p>
            </div>
          </div>
          <Badge variant="outline" className="border-white/10 text-white/60 text-xs">
            Free Brand Check
          </Badge>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-3 sm:px-4 py-6 sm:py-8" role="main" aria-label="Brand Health Quick Check">
        {/* Step: Company Info */}
        {step === "info" && (
          <div className="space-y-6 sm:space-y-8">
            {/* Hero */}
            <div className="text-center space-y-4 py-4 sm:py-8">
              <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs sm:text-sm text-white/70">
                <Sparkles className="h-4 w-4 text-amber-400" />
                AI-Powered Brand Diagnosis
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
                Is Your Brand{" "}
                <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                  Healthy?
                </span>
              </h2>
              <p className="text-base sm:text-lg text-white/60 max-w-2xl mx-auto px-2">
                Get a free AI-powered brand health assessment in under 2 minutes.
                Discover what's working, what's not, and what to do next.
              </p>
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
              {[
                { icon: Target, label: "Brand Clarity Score", desc: "How clear is your positioning" },
                { icon: TrendingUp, label: "Growth Potential", desc: "Where your opportunities lie" },
                { icon: Shield, label: "Competitive Edge", desc: "How you stack up vs others" },
                { icon: Zap, label: "Action Plan", desc: "What to do next" },
              ].map((f, i) => (
                <div key={i} role="article" className="p-3 sm:p-4 rounded-xl bg-white/[0.03] border border-white/5 text-center space-y-2">
                  <f.icon className="h-6 w-6 mx-auto text-amber-400/80" />
                  <p className="text-sm font-medium">{f.label}</p>
                  <p className="text-xs text-white/40">{f.desc}</p>
                </div>
              ))}
            </div>

            {/* Form */}
            <Card className="bg-white/[0.03] border-white/10 text-white max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle className="text-xl">Tell us about your business</CardTitle>
                <CardDescription className="text-white/50">
                  We need a few details to personalize your brand health check.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white/70">Company Name *</Label>
                    <Input aria-label="Company Name"
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      placeholder="Your company name"
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/70">Your Name</Label>
                    <Input aria-label="Company Name"
                      value={formData.contactName}
                      onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                      placeholder="Your full name"
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/70">Email *</Label>
                    <Input aria-label="Company Name"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="you@company.com"
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/70">Phone</Label>
                    <Input aria-label="Company Name"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+20 xxx xxx xxxx"
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/70">Industry</Label>
                    <Input aria-label="Company Name"
                      value={formData.industry}
                      onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                      placeholder="e.g., F&B, Healthcare, Tech..."
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/70">Market</Label>
                    <Select
                      value={formData.market}
                      onValueChange={(v) => setFormData({ ...formData, market: v as any })}
                    >
                      <SelectTrigger className="bg-white/5 border-white/10 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="egypt">Egypt</SelectItem>
                        <SelectItem value="ksa">Saudi Arabia</SelectItem>
                        <SelectItem value="uae">UAE</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-white/70">Website</Label>
                  <Input aria-label="Company Name"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://www.yourcompany.com"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                  />
                </div>
                <Button
                  onClick={handleInfoSubmit}
                  disabled={!formData.companyName || !formData.email}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold h-12 text-base"
                >
                  Start Brand Health Check
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <p className="text-xs text-white/30 text-center">
                  Your information is secure. We'll only use it to deliver your brand health report.
                </p>
              </CardContent>
            </Card>

            {/* Social proof */}
            <div className="text-center space-y-2 py-8">
              <p className="text-sm text-white/40">Powered by Primo Marca's 4D Framework</p>
              <p className="text-xs text-white/25">
                Diagnose · Design · Deploy · Optimize
              </p>
            </div>
          </div>
        )}

        {/* Step: Questions */}
        {step === "questions" && (
          <div className="max-w-2xl mx-auto space-y-8 py-8">
            {/* Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-white/50">
                <span>Question {currentQuestion + 1} of {QUICK_CHECK_QUESTIONS.length}</span>
                <span>{Math.round(((currentQuestion + 1) / QUICK_CHECK_QUESTIONS.length) * 100)}%</span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
                  style={{ width: `${((currentQuestion + 1) / QUICK_CHECK_QUESTIONS.length) * 100}%` }}
                />
              </div>
            </div>

            <Card className="bg-white/[0.03] border-white/10 text-white">
              <CardHeader>
                <CardTitle className="text-xl leading-relaxed">
                  {QUICK_CHECK_QUESTIONS[currentQuestion].question}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={answers[QUICK_CHECK_QUESTIONS[currentQuestion].id] || ""}
                  onChange={(e) =>
                    setAnswers({
                      ...answers,
                      [QUICK_CHECK_QUESTIONS[currentQuestion].id]: e.target.value,
                    })
                  }
                  placeholder={QUICK_CHECK_QUESTIONS[currentQuestion].placeholder}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 min-h-[120px]"
                />
                <div className="flex items-center gap-3">
                  {currentQuestion > 0 && (
                    <Button
                      variant="outline"
                      onClick={() => setCurrentQuestion(currentQuestion - 1)}
                      className="border-white/10 text-white hover:bg-white/5"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                  )}
                  <Button
                    onClick={handleAnswerSubmit}
                    disabled={!answers[QUICK_CHECK_QUESTIONS[currentQuestion].id]}
                    className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold h-12"
                  >
                    {currentQuestion < QUICK_CHECK_QUESTIONS.length - 1 ? (
                      <>
                        Next Question
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-5 w-5" />
                        Get My Brand Health Report
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step: Loading */}
        {step === "loading" && (
          <div className="max-w-lg mx-auto text-center space-y-8 py-20">
            <div className="relative">
              <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                <Loader2 className="h-12 w-12 text-amber-400 animate-spin" />
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="text-2xl font-bold">Analyzing Your Brand...</h3>
              <p className="text-white/50">
                Our AI is running a comprehensive brand health assessment using Primo Marca's 4D Framework.
                This usually takes 10-20 seconds.
              </p>
            </div>
            <div className="space-y-2 text-sm text-white/40">
              <p>✓ Evaluating brand clarity</p>
              <p>✓ Assessing market positioning</p>
              <p>✓ Analyzing growth potential</p>
            </div>
          </div>
        )}

        {/* Step: Results */}
        {step === "results" && result && (
          <div className="max-w-2xl mx-auto space-y-8 py-8">
            {/* Score Card */}
            <Card className={`border ${scoreBg(result.scoreLabel)} text-white`}>
              <CardContent className="p-8 text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                  Assessment Complete
                </div>
                <div className="space-y-2">
                  <div className={`text-6xl font-bold ${scoreColor(result.scoreLabel)}`}>
                    {result.score}
                    <span className="text-2xl text-white/40">/100</span>
                  </div>
                  <Badge
                    className={`text-sm px-3 py-1 ${
                      result.scoreLabel === "hot"
                        ? "bg-red-500/20 text-red-400 border-red-500/30"
                        : result.scoreLabel === "warm"
                        ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                        : "bg-blue-500/20 text-blue-400 border-blue-500/30"
                    }`}
                  >
                    {result.scoreLabel === "hot" ? "High Potential" : result.scoreLabel === "warm" ? "Growth Opportunity" : "Needs Foundation"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Teaser Diagnosis */}
            <Card className="bg-white/[0.03] border-white/10 text-white">
              <CardHeader>
                <CardTitle className="text-lg">Your Brand Health Snapshot</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-white/80 leading-relaxed">{result.diagnosisTeaser}</p>
                <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/10">
                  <p className="text-sm text-amber-400/80">
                    <Sparkles className="inline h-4 w-4 mr-1" />
                    Want the full detailed analysis with actionable recommendations?
                    Our brand engineering team will reach out within 24 hours.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Recommended Service */}
            <Card className="bg-white/[0.03] border-white/10 text-white">
              <CardHeader>
                <CardTitle className="text-lg">Recommended Next Step</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 p-4 rounded-lg bg-white/[0.03] border border-white/5">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                    <Zap className="h-5 w-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {result.recommendedService === "business_health_check" && "Business Health Check"}
                      {result.recommendedService === "starting_business_logic" && "Clarity Package — Business Logic"}
                      {result.recommendedService === "brand_identity" && "Brand Foundation — Full Brand Identity"}
                      {result.recommendedService === "business_takeoff" && "Business Takeoff — Complete Launch"}
                      {result.recommendedService === "consultation" && "Growth Partnership — Strategic Consultation"}
                    </p>
                    <p className="text-sm text-white/50">
                      Based on your answers, this service best addresses your current needs.
                    </p>
                  </div>
                </div>
                <p className="text-xs text-white/30 text-center">
                  A Primo Marca brand engineer will contact you with a personalized proposal.
                </p>
              </CardContent>
            </Card>

            {/* CTA */}
            <div className="text-center space-y-4 py-4">
              <p className="text-sm text-white/40">
                Thank you for taking the Brand Health Quick-Check!
              </p>
              <p className="text-xs text-white/25">
                Powered by Wzrd AI — Primo Marca's Brand Engineering Intelligence
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
