"use client";

import { useEffect, useState, useCallback } from "react";
import { Activity, RefreshCw, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SATopBar from "@/components/superadmin/sa-topbar";
import { getSASystemHealth, type SystemHealth, type ServiceStatus } from "@/lib/api";

const SERVICE_ICONS: Record<string, string> = {
  PostgreSQL: "🐘",
  Redis: "🔴",
  Qdrant: "🔷",
  API: "⚡",
};

function StatusIcon({ status }: { status: string }) {
  if (status === "ok") return <CheckCircle className="h-5 w-5 text-emerald-400" />;
  if (status === "degraded") return <AlertCircle className="h-5 w-5 text-amber-400" />;
  return <XCircle className="h-5 w-5 text-red-400" />;
}

function ServiceCard({ svc }: { svc: ServiceStatus }) {
  const bg = svc.status === "ok"
    ? "border-emerald-700/50 bg-emerald-900/10"
    : svc.status === "degraded"
    ? "border-amber-700/50 bg-amber-900/10"
    : "border-red-700/50 bg-red-900/10";

  return (
    <div className={`rounded-xl border p-5 ${bg}`}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xl">{SERVICE_ICONS[svc.name] || "⚙️"}</span>
            <p className="font-semibold text-slate-100">{svc.name}</p>
          </div>
          {svc.latency_ms !== null && (
            <p className="text-xs text-slate-400">
              استجابة: <span className="font-mono text-slate-300">{svc.latency_ms} ms</span>
            </p>
          )}
          {svc.detail && (
            <p className="text-xs text-slate-500">{svc.detail}</p>
          )}
        </div>
        <StatusIcon status={svc.status} />
      </div>
    </div>
  );
}

export default function SASystemPage() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(30);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getSASystemHealth();
      setHealth(data);
      setCountdown(30);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, [load]);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((c) => (c > 0 ? c - 1 : 30));
    }, 1000);
    return () => clearInterval(timer);
  }, [health]);

  const overallColor = health?.overall === "ok"
    ? "text-emerald-400"
    : "text-amber-400";

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <SATopBar title="صحة النظام" subtitle="مراقبة لحظية لجميع الخدمات" />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Overall status bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className={`h-5 w-5 ${overallColor}`} />
            <div>
              <p className={`text-sm font-semibold ${overallColor}`}>
                {health?.overall === "ok" ? "جميع الأنظمة تعمل بشكل طبيعي" : "هناك مشكلة في بعض الخدمات"}
              </p>
              {health && (
                <p className="text-xs text-slate-500">
                  آخر فحص: {new Date(health.checked_at).toLocaleTimeString("ar-SA")}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>تحديث تلقائي بعد {countdown}s</span>
            <button
              onClick={load}
              className="text-violet-400 hover:text-violet-300 transition-colors"
            >
              الآن
            </button>
          </div>
        </div>

        {/* Services grid */}
        {loading && !health ? (
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 rounded-xl bg-slate-800 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {health?.services.map((svc) => (
              <ServiceCard key={svc.name} svc={svc} />
            ))}
          </div>
        )}

        {/* Raw JSON */}
        {health && (
          <Card className="bg-slate-900 border-slate-700">
            <CardHeader className="px-5 py-4 border-b border-slate-700">
              <CardTitle className="text-xs text-slate-400 font-mono">Raw Response</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <pre className="text-xs text-slate-400 overflow-auto">
                {JSON.stringify(health, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
