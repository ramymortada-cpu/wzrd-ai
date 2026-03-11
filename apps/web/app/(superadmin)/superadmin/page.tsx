"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  MessageSquare,
  Zap,
  Users,
  AlertTriangle,
  TrendingUp,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import SATopBar from "@/components/superadmin/sa-topbar";
import { getSAAnalytics, type PlatformKPIs } from "@/lib/api";

function KPICard({
  title,
  value,
  icon: Icon,
  sub,
  color = "violet",
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  sub?: string;
  color?: string;
}) {
  const colorMap: Record<string, string> = {
    violet: "text-violet-400 bg-violet-600/10",
    blue: "text-blue-400 bg-blue-600/10",
    green: "text-emerald-400 bg-emerald-600/10",
    amber: "text-amber-400 bg-amber-600/10",
    red: "text-red-400 bg-red-600/10",
    sky: "text-sky-400 bg-sky-600/10",
  };
  return (
    <Card className="bg-slate-900 border-slate-700">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs text-slate-400 font-medium">{title}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
            {sub && <p className="text-xs text-slate-500">{sub}</p>}
          </div>
          <div className={`rounded-lg p-2.5 ${colorMap[color] || colorMap.violet}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function planBadge(plan: string) {
  const map: Record<string, string> = {
    pilot: "bg-slate-700 text-slate-300",
    growth: "bg-blue-900/50 text-blue-300",
    scale: "bg-violet-900/50 text-violet-300",
  };
  return map[plan] || map.pilot;
}

function statusBadge(status: string) {
  return status === "active"
    ? "bg-emerald-900/50 text-emerald-300"
    : "bg-red-900/50 text-red-300";
}

export default function SuperAdminOverview() {
  const [kpis, setKpis] = useState<PlatformKPIs | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await getSAAnalytics();
      setKpis(data);
      setLastRefresh(new Date());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <SATopBar
        title="نظرة عامة على المنصة"
        subtitle="إحصائيات لحظية لجميع المتاجر"
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Refresh bar */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">
            آخر تحديث: {lastRefresh.toLocaleTimeString("ar-SA")}
          </p>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-100 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            تحديث
          </button>
        </div>

        {/* KPI Cards */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-24 rounded-lg bg-slate-800 animate-pulse" />
            ))}
          </div>
        ) : kpis ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <KPICard
              title="إجمالي المتاجر"
              value={kpis.total_workspaces}
              icon={Building2}
              sub={`${kpis.active_workspaces} نشط`}
              color="violet"
            />
            <KPICard
              title="رسائل اليوم"
              value={kpis.total_messages_today.toLocaleString("ar-SA")}
              icon={MessageSquare}
              sub={`${kpis.total_messages_week.toLocaleString("ar-SA")} هذا الأسبوع`}
              color="blue"
            />
            <KPICard
              title="نسبة الأتمتة"
              value={`${(kpis.platform_automation_rate * 100).toFixed(1)}%`}
              icon={Zap}
              sub="متوسط المنصة (7 أيام)"
              color="green"
            />
            <KPICard
              title="محادثات نشطة"
              value={kpis.total_active_conversations}
              icon={TrendingUp}
              sub="الآن عبر جميع المتاجر"
              color="sky"
            />
            <KPICard
              title="تصعيدات معلقة"
              value={kpis.total_pending_escalations}
              icon={AlertTriangle}
              sub="تحتاج تدخل وكيل"
              color={kpis.total_pending_escalations > 0 ? "amber" : "green"}
            />
            <KPICard
              title="متاجر نشطة"
              value={kpis.active_workspaces}
              icon={Users}
              sub={`من أصل ${kpis.total_workspaces} متجر`}
              color="violet"
            />
          </div>
        ) : null}

        {/* Top Workspaces */}
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader className="px-5 py-4 border-b border-slate-700">
            <CardTitle className="text-sm font-semibold text-slate-100">
              أكثر المتاجر نشاطاً اليوم
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-5 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-10 rounded bg-slate-800 animate-pulse" />
                ))}
              </div>
            ) : kpis?.top_workspaces.length === 0 ? (
              <p className="text-center text-slate-500 text-sm py-8">لا توجد بيانات</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-right px-5 py-3 text-slate-400 font-medium">المتجر</th>
                    <th className="text-right px-5 py-3 text-slate-400 font-medium">الخطة</th>
                    <th className="text-right px-5 py-3 text-slate-400 font-medium">الحالة</th>
                    <th className="text-right px-5 py-3 text-slate-400 font-medium">الرسائل اليوم</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {kpis?.top_workspaces.map((ws) => (
                    <tr
                      key={ws.id}
                      className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="px-5 py-3">
                        <div>
                          <p className="font-medium text-slate-100">{ws.name}</p>
                          <p className="text-xs text-slate-500">{ws.slug}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${planBadge(ws.plan)}`}>
                          {ws.plan}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusBadge(ws.status)}`}>
                          {ws.status === "active" ? "نشط" : "موقوف"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-100 font-medium">
                        {ws.messages_today.toLocaleString("ar-SA")}
                      </td>
                      <td className="px-5 py-3 text-left">
                        <Link
                          href={`/superadmin/workspaces/${ws.id}`}
                          className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
                        >
                          عرض
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
