import { PageSkeleton } from "@/components/PageSkeleton";
import { trpc } from "@/lib/trpc";
import { useI18n } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Target, PieChart, BarChart3, Users, FileText, CheckCircle2, Zap } from "lucide-react";
import { useEffect, useRef } from "react";

// Simple bar chart renderer using canvas
function BarChart({ data, labels, color, height = 200 }: { data: number[]; labels: string[]; color: string; height?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, rect.width, rect.height);

    const maxVal = Math.max(...data, 1);
    const barWidth = (rect.width - 40) / data.length;
    const chartHeight = rect.height - 30;

    // Draw bars
    data.forEach((val, i) => {
      const barH = (val / maxVal) * (chartHeight - 10);
      const x = 30 + i * barWidth + barWidth * 0.15;
      const y = chartHeight - barH;
      const w = barWidth * 0.7;

      // Bar
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.roundRect(x, y, w, barH, [4, 4, 0, 0]);
      ctx.fill();
      ctx.globalAlpha = 1;

      // Label
      ctx.fillStyle = "#888";
      ctx.font = "10px system-ui";
      ctx.textAlign = "center";
      const label = labels[i]?.split("-")[1] || labels[i] || "";
      ctx.fillText(label, x + w / 2, rect.height - 5);

      // Value on top
      if (val > 0) {
        ctx.fillStyle = "#666";
        ctx.font = "10px system-ui";
        ctx.fillText(val.toLocaleString(), x + w / 2, y - 5);
      }
    });
  }, [data, labels, color]);

  return <canvas ref={canvasRef} style={{ width: "100%", height }} />;
}

// Donut chart
function DonutChart({ segments, size = 160 }: { segments: { label: string; value: number; color: string }[]; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, size, size);

    const total = segments.reduce((s, seg) => s + seg.value, 0);
    if (total === 0) {
      ctx.fillStyle = "#e5e7eb";
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2 - 10, 0, Math.PI * 2);
      ctx.arc(size / 2, size / 2, size / 2 - 35, 0, Math.PI * 2, true);
      ctx.fill();
      return;
    }

    let startAngle = -Math.PI / 2;
    segments.forEach((seg) => {
      const sliceAngle = (seg.value / total) * Math.PI * 2;
      ctx.fillStyle = seg.color;
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2 - 10, startAngle, startAngle + sliceAngle);
      ctx.arc(size / 2, size / 2, size / 2 - 35, startAngle + sliceAngle, startAngle, true);
      ctx.fill();
      startAngle += sliceAngle;
    });

    // Center text
    ctx.fillStyle = "#333";
    ctx.font = "bold 20px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(total.toString(), size / 2, size / 2);
  }, [segments, size]);

  return <canvas ref={canvasRef} style={{ width: size, height: size }} />;
}

// Funnel visualization
function FunnelChart({ steps }: { steps: { label: string; value: number; color: string }[] }) {
  const maxVal = Math.max(...steps.map(s => s.value), 1);
  return (
    <div className="space-y-2">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground w-16 text-end shrink-0">{step.label}</span>
          <div className="flex-1 h-8 bg-muted/30 rounded-lg overflow-hidden relative">
            <div
              className="h-full rounded-lg transition-all duration-500 flex items-center justify-end pe-2"
              style={{ width: `${Math.max((step.value / maxVal) * 100, 8)}%`, backgroundColor: step.color }}
            >
              <span className="text-xs font-semibold text-white">{step.value}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Analytics() {
  const { locale } = useI18n();
  const isRtl = locale === "ar";
  const { data, isLoading } = trpc.dashboard.analytics.useQuery();

  if (isLoading) {
    return <PageSkeleton />;
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        {isRtl ? "لا توجد بيانات متاحة" : "No data available"}
      </div>
    );
  }

  const proposalFunnelSteps = [
    { label: isRtl ? "إجمالي" : "Total", value: data.proposalFunnel.total, color: "#6366f1" },
    { label: isRtl ? "مرسلة" : "Sent", value: data.proposalFunnel.sent, color: "#3b82f6" },
    { label: isRtl ? "مقبولة" : "Accepted", value: data.proposalFunnel.accepted, color: "#22c55e" },
    { label: isRtl ? "مرفوضة" : "Rejected", value: data.proposalFunnel.rejected, color: "#ef4444" },
  ];

  const marketSegments = [
    { label: isRtl ? "السعودية" : "KSA", value: data.marketDistribution.ksa, color: "#22c55e" },
    { label: isRtl ? "مصر" : "Egypt", value: data.marketDistribution.egypt, color: "#3b82f6" },
    { label: isRtl ? "الإمارات" : "UAE", value: data.marketDistribution.uae, color: "#f59e0b" },
    { label: isRtl ? "أخرى" : "Other", value: data.marketDistribution.other, color: "#8b5cf6" },
  ];

  const clientStatusSegments = [
    { label: isRtl ? "عميل محتمل" : "Lead", value: data.clientStatusDistribution.lead, color: "#f59e0b" },
    { label: isRtl ? "نشط" : "Active", value: data.clientStatusDistribution.active, color: "#22c55e" },
    { label: isRtl ? "مكتمل" : "Completed", value: data.clientStatusDistribution.completed, color: "#6366f1" },
    { label: isRtl ? "متوقف" : "Paused", value: data.clientStatusDistribution.paused, color: "#94a3b8" },
  ];

  const serviceLabels: Record<string, string> = isRtl ? {
    business_health_check: "فحص صحة البيزنس",
    starting_business_logic: "بناء منطق البيزنس",
    brand_identity: "هوية العلامة التجارية",
    business_takeoff: "انطلاقة البيزنس",
    consultation: "استشارة",
  } : {
    business_health_check: "Health Check",
    starting_business_logic: "Business Logic",
    brand_identity: "Brand Identity",
    business_takeoff: "Takeoff",
    consultation: "Consultation",
  };

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {isRtl ? "التحليلات" : "Analytics"}
        </h1>
        <p className="text-muted-foreground mt-1">
          {isRtl ? "نظرة شاملة على أداء الأعمال والتحويلات" : "Comprehensive view of business performance and conversions"}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="shadow-sm">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{isRtl ? "معدل التحويل" : "Conversion Rate"}</p>
                <p className="text-2xl font-bold mt-1">{data.conversionRate}%</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <Target className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{isRtl ? "قيمة الخط" : "Pipeline Value"}</p>
                <p className="text-2xl font-bold mt-1">
                  {data.pipelineValue.toLocaleString()}
                  <span className="text-xs font-normal text-muted-foreground ms-1">{isRtl ? "ج.م" : "EGP"}</span>
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{isRtl ? "إكمال المخرجات" : "Deliverable Completion"}</p>
                <p className="text-2xl font-bold mt-1">{data.deliverableStats.completionRate}%</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{isRtl ? "مخرجات AI" : "AI Generated"}</p>
                <p className="text-2xl font-bold mt-1">{data.deliverableStats.aiGenerated}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Zap className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Proposal Conversion Funnel */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {isRtl ? "قمع تحويل العروض" : "Proposal Conversion Funnel"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FunnelChart steps={proposalFunnelSteps} />
          </CardContent>
        </Card>

        {/* Revenue Trend */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              {isRtl ? "اتجاه الإيرادات (12 شهر)" : "Revenue Trend (12 months)"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart
              data={data.monthlyRevenue.map((m: { revenue: number; month: string }) => m.revenue)}
              labels={data.monthlyRevenue.map((m: { revenue: number; month: string }) => m.month)}
              color="#6366f1"
              height={200}
            />
          </CardContent>
        </Card>

        {/* Market Distribution */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              {isRtl ? "توزيع الأسواق" : "Market Distribution"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center gap-8">
              <DonutChart segments={marketSegments} />
              <div className="space-y-2">
                {marketSegments.map((seg, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                    <span className="text-sm">{seg.label}</span>
                    <span className="text-sm font-semibold ms-auto">{seg.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Client Status */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              {isRtl ? "حالة العملاء" : "Client Status"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center gap-8">
              <DonutChart segments={clientStatusSegments} />
              <div className="space-y-2">
                {clientStatusSegments.map((seg, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                    <span className="text-sm">{seg.label}</span>
                    <span className="text-sm font-semibold ms-auto">{seg.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Client Acquisition */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              {isRtl ? "اكتساب العملاء (12 شهر)" : "Client Acquisition (12 months)"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart
              data={data.monthlyClients.map((m: { count: number; month: string }) => m.count)}
              labels={data.monthlyClients.map((m: { count: number; month: string }) => m.month)}
              color="#22c55e"
              height={200}
            />
          </CardContent>
        </Card>

        {/* Service Performance Table */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              {isRtl ? "أداء الخدمات" : "Service Performance"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.servicePerformance.map((sp: { serviceType: string; projectCount: number; completedProjects: number; proposalCount?: number; revenue?: number }) => {
                const total = sp.projectCount;
                const completed = sp.completedProjects;
                const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
                return (
                  <div key={sp.serviceType} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{serviceLabels[sp.serviceType] || sp.serviceType}</span>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{sp.projectCount} {isRtl ? "مشروع" : "projects"}</span>
                        <span>{sp.proposalCount} {isRtl ? "عرض" : "proposals"}</span>
                        {(sp.revenue ?? 0) > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {(sp.revenue ?? 0).toLocaleString()} {isRtl ? "ج.م" : "EGP"}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary/70 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(pct, 3)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
