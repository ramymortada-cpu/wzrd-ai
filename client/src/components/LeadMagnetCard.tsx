import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import { AlertCircle, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const INDUSTRY_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "ecommerce", label: "E-commerce / تجارة إلكترونية" },
  { value: "saas", label: "SaaS / برمجيات" },
  { value: "healthcare", label: "Healthcare / صحة" },
  { value: "education", label: "Education / تعليم" },
  { value: "real_estate", label: "Real Estate / عقارات" },
  { value: "fnb", label: "F&B / مطاعم" },
  { value: "beauty", label: "Beauty / تجميل" },
  { value: "services", label: "Services / خدمات" },
  { value: "other", label: "أخرى" },
];

type UiState =
  | { kind: "default" }
  | { kind: "loading" }
  | { kind: "rate_limited" }
  | { kind: "error"; message: string }
  | { kind: "success"; content: string };

export default function LeadMagnetCard() {
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [industry, setIndustry] = useState("");
  const [ui, setUi] = useState<UiState>({ kind: "default" });
  const [open, setOpen] = useState(false);

  const industryLabel = useMemo(() => {
    return INDUSTRY_OPTIONS.find((x) => x.value === industry)?.label ?? "";
  }, [industry]);

  const isLoading = ui.kind === "loading";
  const disabled = isLoading;

  const canSubmit =
    companyName.trim().length >= 2 &&
    email.trim().length >= 5 &&
    industry.trim().length > 0 &&
    !isLoading;

  const generateMutation = trpc.leads.generateFreeReport.useMutation({
    onSuccess: (data) => {
      setUi({ kind: "success", content: data.content || "" });
      setOpen(true);
    },
    onError: (err) => {
      const httpStatus = (err as { data?: { httpStatus?: number } } | undefined)?.data?.httpStatus;
      if (httpStatus === 429) {
        setUi({ kind: "rate_limited" });
        return;
      }
      setUi({ kind: "error", message: "حدث خطأ أثناء توليد التقرير. حاول مرة أخرى." });
    },
  });

  return (
    <>
      <Card className="my-10 rounded-2xl border-zinc-800/60 bg-zinc-950/40 backdrop-blur-sm">
        <CardHeader className="space-y-2">
          <CardTitle className="text-zinc-50">تقرير مجاني: Industry Brand Benchmark</CardTitle>
          <CardDescription className="text-zinc-400">
            اكتب بيانات بسيطة وخد تقرير سريع (Markdown) يوضح واقع السوق، المخاطر، وخطة 14 يوم.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="leadmagnet-company">Company</Label>
              <Input
                id="leadmagnet-company"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Company / Brand name"
                className="bg-zinc-950/30 border-zinc-800/60"
                disabled={disabled}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="leadmagnet-email">Email</Label>
              <Input
                id="leadmagnet-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="bg-zinc-950/30 border-zinc-800/60"
                disabled={disabled}
              />
            </div>

            <div className="space-y-2">
              <Label>Industry</Label>
              <Select value={industry} onValueChange={setIndustry} disabled={disabled}>
                <SelectTrigger className="w-full bg-zinc-950/30 border-zinc-800/60">
                  <SelectValue placeholder="اختر الصناعة" />
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {ui.kind === "rate_limited" ? (
            <div className="rounded-xl border border-red-500/25 bg-red-500/5 px-4 py-3 text-sm text-red-200">
              لقد طلبت تقريراً مؤخراً، حاول بعد ساعة
            </div>
          ) : null}

          {ui.kind === "error" ? (
            <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-200">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>{ui.message}</div>
            </div>
          ) : null}

          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <Button
              onClick={() => {
                setUi({ kind: "loading" });
                generateMutation.mutate({
                  email: email.trim(),
                  companyName: companyName.trim(),
                  industry: industryLabel || industry,
                });
              }}
              disabled={!canSubmit}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  جاري التحليل...
                </>
              ) : (
                "احصل على التقرير الآن"
              )}
            </Button>

            <a
              href="/tools"
              className="text-sm text-zinc-400 hover:text-zinc-200 transition underline underline-offset-4"
            >
              أو جرّب أدوات التشخيص المجانية
            </a>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl rounded-2xl border-zinc-800/60 bg-zinc-950">
          <DialogHeader>
            <DialogTitle className="text-zinc-50">تقريرك جاهز</DialogTitle>
            <DialogDescription className="text-zinc-400">
              لو تحب نحوله لخطة تنفيذ + KPIs، احجز Clarity Call.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-xl border border-zinc-800/60 bg-zinc-950/40 p-4 max-h-[55vh] overflow-auto">
            <article className="prose prose-invert max-w-none">
              <ReactMarkdown>{ui.kind === "success" ? ui.content : ""}</ReactMarkdown>
            </article>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
            <Button variant="outline" onClick={() => setOpen(false)} className="border-zinc-800/60">
              إغلاق
            </Button>
            <Button asChild className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white">
              <a href="/tools">احجز Clarity Call</a>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

