"use client";

import { useEffect, useState } from "react";
import TopBar from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getChurnRadar } from "@/lib/api";
import { AlertTriangle, Clock, RefreshCw } from "lucide-react";

function formatRelativeTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return "منذ لحظات";
  if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
  if (diffHours < 24) return `منذ ${diffHours} ساعة`;
  if (diffDays < 30) return `منذ ${diffDays} يوم`;
  return d.toLocaleDateString("ar-SA");
}

const RISK_LABELS: Record<string, { label: string; variant: "destructive" | "warning" | "secondary" }> = {
  critical: { label: "خطر حرج", variant: "destructive" },
  high: { label: "خطر مرتفع", variant: "destructive" },
  medium: { label: "خطر متوسط", variant: "warning" },
  low: { label: "خطر منخفض", variant: "secondary" },
};

export default function ChurnPage() {
  const [data, setData] = useState<Awaited<ReturnType<typeof getChurnRadar>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "critical" | "high" | "medium" | "low">("all");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await getChurnRadar(45, false);
      setData(res);
    } catch {
      setError("تعذّر تحميل بيانات رادار التسرب");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered =
    data && filter !== "all"
      ? data.alerts.filter((a) => a.risk_level === filter)
      : data?.alerts ?? [];

  const counts = data
    ? {
        critical: data.alerts.filter((a) => a.risk_level === "critical").length,
        high: data.alerts.filter((a) => a.risk_level === "high").length,
        medium: data.alerts.filter((a) => a.risk_level === "medium").length,
        low: data.alerts.filter((a) => a.risk_level === "low").length,
      }
    : { critical: 0, high: 0, medium: 0, low: 0 };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar
        title="رادار التسرب"
        subtitle="العملاء المعرضون لخطر التوقف عن الشراء"
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {error && (
          <div className="text-sm text-destructive bg-destructive/10 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Summary Cards */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : data ? (
          <div className="flex flex-wrap items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={load}
              className="shrink-0"
            >
              <RefreshCw className="h-4 w-4 me-2" />
              تحديث
            </Button>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 flex-1">
              <Card
                className="cursor-pointer border-red-500/30 hover:border-red-500 transition-colors"
                onClick={() => setFilter(filter === "critical" ? "all" : "critical")}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <AlertTriangle className="w-8 h-8 text-red-600 shrink-0" />
                  <div>
                    <p className="text-2xl font-bold text-red-600">{counts.critical}</p>
                    <p className="text-xs text-muted-foreground arabic-text">خطر حرج</p>
                  </div>
                </CardContent>
              </Card>
              <Card
                className="cursor-pointer border-destructive/30 hover:border-destructive transition-colors"
                onClick={() => setFilter(filter === "high" ? "all" : "high")}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <AlertTriangle className="w-8 h-8 text-destructive shrink-0" />
                  <div>
                    <p className="text-2xl font-bold text-destructive">{counts.high}</p>
                    <p className="text-xs text-muted-foreground arabic-text">خطر مرتفع</p>
                  </div>
                </CardContent>
              </Card>
              <Card
                className="cursor-pointer border-yellow-500/30 hover:border-yellow-500 transition-colors"
                onClick={() => setFilter(filter === "medium" ? "all" : "medium")}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <AlertTriangle className="w-8 h-8 text-yellow-500 shrink-0" />
                  <div>
                    <p className="text-2xl font-bold text-yellow-500">{counts.medium}</p>
                    <p className="text-xs text-muted-foreground arabic-text">خطر متوسط</p>
                  </div>
                </CardContent>
              </Card>
              <Card
                className="cursor-pointer hover:border-muted-foreground/30 transition-colors"
                onClick={() => setFilter(filter === "low" ? "all" : "low")}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <AlertTriangle className="w-8 h-8 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-2xl font-bold">{counts.low}</p>
                    <p className="text-xs text-muted-foreground arabic-text">خطر منخفض</p>
                  </div>
                </CardContent>
              </Card>
            </div>
            {data.summary.at_risk_revenue > 0 && (
              <div className="text-sm text-muted-foreground arabic-text">
                إيرادات معرضة للخطر:{" "}
                <span className="font-semibold text-foreground">
                  {data.summary.at_risk_revenue.toLocaleString("ar-SA")} ر.س
                </span>
              </div>
            )}
          </div>
        ) : null}

        {/* Customer List */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base arabic-text">
              {filter === "all"
                ? "جميع العملاء في الخطر"
                : `عملاء ${RISK_LABELS[filter]?.label ?? filter}`}
              {!loading && <span className="text-muted-foreground font-normal text-sm me-2">({filtered.length})</span>}
            </CardTitle>
            {filter !== "all" && (
              <Button variant="ghost" size="sm" onClick={() => setFilter("all")}>
                عرض الكل
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-muted-foreground text-sm arabic-text text-center py-8">
                لا يوجد عملاء في هذه الفئة
              </p>
            ) : (
              <div className="divide-y divide-border">
                {filtered.map((customer) => {
                  const risk = RISK_LABELS[customer.risk_level] ?? RISK_LABELS.low;
                  return (
                    <div
                      key={customer.customer_id}
                      className="py-4 flex items-start justify-between gap-4"
                    >
                      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium arabic-text truncate">
                            عميل {customer.customer_id.slice(0, 8)}…
                          </span>
                          <Badge variant={risk.variant}>{risk.label}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {customer.customer_tier}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full arabic-text">
                            {customer.reason}
                          </span>
                          {customer.days_inactive > 0 && (
                            <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                              غير نشط منذ {customer.days_inactive} يوم
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span className="arabic-text">
                              آخر تواصل{" "}
                              {formatRelativeTime(customer.last_seen_at)}
                            </span>
                          </span>
                          {customer.total_revenue > 0 && (
                            <span className="arabic-text">
                              إيرادات: {customer.total_revenue.toLocaleString("ar-SA")} ر.س
                            </span>
                          )}
                        </div>
                      </div>

                      {customer.suggested_action && (
                        <div className="shrink-0 text-left max-w-[200px]">
                          <p className="text-xs text-muted-foreground arabic-text text-end">
                            الإجراء المقترح
                          </p>
                          <p className="text-xs arabic-text text-end mt-0.5">
                            {customer.suggested_action}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
