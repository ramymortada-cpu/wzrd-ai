"use client";

import { useEffect, useState } from "react";
import {
  TrendingUp,
  ShoppingCart,
  RotateCcw,
  PackageCheck,
  ArrowUpRight,
  RefreshCw,
  DollarSign,
} from "lucide-react";
import TopBar from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRevenueSummary, getRevenueEvents, type RevenueSummary, type RevenueEvent } from "@/lib/api";

const PERIOD_LABELS: Record<string, string> = {
  this_month: "هذا الشهر",
  last_month: "الشهر الماضي",
  all_time: "كل الأوقات",
};

const EVENT_LABELS: Record<string, { label: string; color: string }> = {
  assisted_sale: { label: "مبيعة مُساعَدة", color: "text-green-600 bg-green-50" },
  return_prevented: { label: "إرجاع تم منعه", color: "text-blue-600 bg-blue-50" },
  cart_recovered: { label: "سلة مُسترجَعة", color: "text-purple-600 bg-purple-50" },
  upsell: { label: "بيع إضافي", color: "text-amber-600 bg-amber-50" },
};

export default function RevenuePage() {
  const [period, setPeriod] = useState("this_month");
  const [summary, setSummary] = useState<RevenueSummary | null>(null);
  const [events, setEvents] = useState<RevenueEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load(p: string) {
    setLoading(true);
    setError("");
    try {
      const [s, e] = await Promise.all([
        getRevenueSummary(p),
        getRevenueEvents(1),
      ]);
      setSummary(s);
      setEvents(e.items);
    } catch {
      setError("تعذّر تحميل بيانات العائد");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(period); }, [period]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar
        title="العائد المالي المنسوب لرَدّ"
        subtitle="كل ريال ساهم فيه الذكاء الاصطناعي"
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Period selector */}
        <div className="flex gap-2">
          {Object.entries(PERIOD_LABELS).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setPeriod(val)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                period === val
                  ? "bg-primary text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {label}
            </button>
          ))}
          <button
            onClick={() => load(period)}
            className="ms-auto p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="text-sm text-destructive bg-destructive/10 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-32 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : summary ? (
          <>
            {/* ROI Hero */}
            <div className="rounded-xl bg-gradient-to-l from-green-50 to-emerald-100 border border-green-200 p-6 flex items-center gap-6">
              <div className="p-4 rounded-xl bg-green-500/20">
                <TrendingUp className="h-8 w-8 text-green-700" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-green-700 font-medium">إجمالي العائد المنسوب</p>
                <p className="text-4xl font-bold text-green-800">
                  {summary.total_attributed_sar.toLocaleString("ar-SA", { minimumFractionDigits: 0 })} ر.س
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">معامل العائد على الاستثمار</p>
                <p className="text-3xl font-bold text-green-700">
                  {summary.roi_multiplier.toFixed(1)}x
                </p>
                <p className="text-xs text-muted-foreground">
                  مقابل {summary.subscription_cost_sar.toLocaleString("ar-SA")} ر.س اشتراك
                </p>
              </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <RevenueCard
                icon={<ShoppingCart className="h-5 w-5 text-green-600" />}
                label="مبيعات مُساعَدة"
                value={summary.assisted_sales_sar}
                bg="bg-green-50"
              />
              <RevenueCard
                icon={<RotateCcw className="h-5 w-5 text-blue-600" />}
                label="إرجاعات تم منعها"
                value={summary.returns_prevented_sar}
                bg="bg-blue-50"
              />
              <RevenueCard
                icon={<PackageCheck className="h-5 w-5 text-purple-600" />}
                label="سلات مُسترجَعة"
                value={summary.carts_recovered_sar}
                bg="bg-purple-50"
              />
              <RevenueCard
                icon={<ArrowUpRight className="h-5 w-5 text-amber-600" />}
                label="مبيعات إضافية"
                value={summary.upsells_sar}
                bg="bg-amber-50"
              />
            </div>

            {/* Events table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  آخر أحداث العائد ({summary.event_count})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {events.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground text-sm">
                    لا توجد أحداث عائد بعد — ستظهر هنا عند تفعيل المبيعات
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="px-4 py-3 text-start text-xs font-medium text-muted-foreground">النوع</th>
                        <th className="px-4 py-3 text-start text-xs font-medium text-muted-foreground">المنتج</th>
                        <th className="px-4 py-3 text-start text-xs font-medium text-muted-foreground">المبلغ</th>
                        <th className="px-4 py-3 text-start text-xs font-medium text-muted-foreground">التاريخ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {events.map((ev) => {
                        const meta = EVENT_LABELS[ev.event_type] ?? { label: ev.event_type, color: "text-muted-foreground bg-muted" };
                        return (
                          <tr key={ev.id} className="border-b last:border-0 hover:bg-muted/20">
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-md text-xs font-medium ${meta.color}`}>
                                {meta.label}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">{ev.product_name ?? "—"}</td>
                            <td className="px-4 py-3 font-medium text-green-700">
                              {ev.amount_sar.toLocaleString("ar-SA", { minimumFractionDigits: 2 })} ر.س
                            </td>
                            <td className="px-4 py-3 text-muted-foreground text-xs">
                              {new Date(ev.created_at).toLocaleDateString("ar-SA")}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>
    </div>
  );
}

function RevenueCard({ icon, label, value, bg }: {
  icon: React.ReactNode;
  label: string;
  value: number;
  bg: string;
}) {
  return (
    <Card>
      <CardContent className="p-4 flex items-start gap-3">
        <div className={`p-2 rounded-lg ${bg} shrink-0 mt-1`}>{icon}</div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-bold mt-0.5">
            {value.toLocaleString("ar-SA", { minimumFractionDigits: 0 })}
            <span className="text-xs font-normal text-muted-foreground ms-1">ر.س</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
