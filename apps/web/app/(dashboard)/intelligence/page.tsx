"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { Sparkles, TrendingUp, Calendar, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";

interface SectorBenchmark {
  available: boolean;
  sector: string;
  my_automation_rate: number;
  my_escalation_rate: number;
  sector_avg_automation: number;
  sector_avg_escalation: number;
  peer_count: number;
  percentile: number;
  gap_analysis: Array<{ metric: string; yours: number; benchmark: number; gap: number; unit: string }>;
  recommendations: string[];
  reason?: string;
}

interface SeasonAlert {
  name_ar: string;
  name_en: string;
  days_until: number;
  urgency: "critical" | "warning" | "info";
  traffic_multiplier: number;
  message_ar: string;
  kb_topics: string[];
}

const getBenchmark = () => apiFetch<SectorBenchmark>("/admin/benchmark");
const getUpcomingSeasons = () => apiFetch<{ seasons: SeasonAlert[]; total: number }>("/admin/seasonal/upcoming");
const generateSeasonalKB = (seasonName: string, sector: string) =>
  apiFetch("/admin/seasonal/generate-kb", { method: "POST", body: JSON.stringify({ season_name: seasonName, sector }) });

const urgencyConfig = {
  critical: { bg: "bg-red-900/40", border: "border-red-700", badge: "bg-red-800 text-red-200", icon: "🔥" },
  warning: { bg: "bg-amber-900/40", border: "border-amber-700", badge: "bg-amber-800 text-amber-200", icon: "⚡" },
  info: { bg: "bg-slate-800/60", border: "border-slate-700", badge: "bg-slate-700 text-slate-300", icon: "📅" },
};

export default function IntelligencePage() {
  const [selectedSeason, setSelectedSeason] = useState<string | null>(null);

  const { data: benchmark, isLoading: bmLoading } = useQuery({ queryKey: ["benchmark"], queryFn: getBenchmark });
  const { data: seasons, isLoading: seLoading } = useQuery({ queryKey: ["seasons"], queryFn: getUpcomingSeasons });

  const { mutate: genKB, isPending: genLoading, isSuccess: genSuccess } = useMutation({
    mutationFn: ({ name, sector }: { name: string; sector: string }) => generateSeasonalKB(name, sector),
  });

  return (
    <div className="space-y-8 p-6 max-w-5xl mx-auto" dir="rtl">
      <div className="flex items-center gap-3">
        <Sparkles className="text-indigo-400 w-6 h-6" />
        <h1 className="text-2xl font-bold text-slate-100">ذكاء السوق</h1>
      </div>

      {/* Cross-Merchant Benchmark */}
      <section>
        <h2 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-indigo-400" />
          مقارنة بمتاجر قطاعك
        </h2>

        {bmLoading && (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-indigo-400 w-8 h-8" />
          </div>
        )}

        {benchmark && !benchmark.available && (
          <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6 text-center text-slate-400">
            {benchmark.reason || "لا توجد بيانات كافية بعد"}
          </div>
        )}

        {benchmark?.available && (
          <div className="grid gap-4">
            {/* Header card */}
            <div className="rounded-xl border border-indigo-800 bg-indigo-950/40 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-right">
                  <p className="text-slate-400 text-sm">قطاعك</p>
                  <p className="text-lg font-bold text-slate-100">{benchmark.sector}</p>
                  <p className="text-sm text-slate-400">{benchmark.peer_count} متجر مماثل</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-black text-indigo-400">{benchmark.percentile}%</div>
                  <div className="text-sm text-slate-400">مرتبتك في القطاع</div>
                </div>
              </div>
            </div>

            {/* Gap Analysis */}
            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
              <h3 className="text-sm font-semibold text-slate-300 mb-4">مقارنة المؤشرات</h3>
              <div className="space-y-4">
                {benchmark.gap_analysis?.map((g, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-400">{g.metric}</span>
                      <span className="text-slate-200 font-medium">
                        أنت: {g.yours}% | السوق: {g.benchmark}%
                      </span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-2 bg-indigo-500 rounded-full"
                        style={{ width: `${Math.min(g.yours, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
              <h3 className="text-sm font-semibold text-slate-300 mb-4">توصيات للتحسين</h3>
              <ul className="space-y-3">
                {benchmark.recommendations?.map((rec, i) => (
                  <li key={i} className="flex gap-3 text-slate-300 text-sm leading-relaxed">
                    <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </section>

      {/* Seasonal Auto-Prep */}
      <section>
        <h2 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-amber-400" />
          التحضير الموسمي التلقائي
        </h2>

        {seLoading && (
          <div className="flex justify-center py-6">
            <Loader2 className="animate-spin text-amber-400 w-8 h-8" />
          </div>
        )}

        {seasons?.seasons?.length === 0 && (
          <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6 text-center text-slate-400">
            لا توجد مواسم قادمة في الـ 60 يوم القادمة
          </div>
        )}

        <div className="grid gap-4">
          {seasons?.seasons?.map((season, i) => {
            const config = urgencyConfig[season.urgency];
            return (
              <div key={i} className={`rounded-xl border ${config.border} ${config.bg} p-6`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <h3 className="text-lg font-bold text-slate-100">{season.name_ar}</h3>
                      <span className="text-2xl">{config.icon}</span>
                    </div>
                    <p className="text-slate-300 mt-1 text-sm">{season.message_ar}</p>
                  </div>
                  <div className="text-center shrink-0 ml-4">
                    <div className="text-3xl font-black text-slate-100">{season.days_until}</div>
                    <div className="text-xs text-slate-400">يوم متبقي</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${config.badge}`}>
                    {season.traffic_multiplier}x حجم المحادثات المتوقع
                  </span>
                </div>

                {/* KB Topics */}
                <div className="mb-4">
                  <p className="text-xs text-slate-400 mb-2">أضف هذه الأسئلة لقاعدة المعرفة:</p>
                  <div className="flex flex-wrap gap-2">
                    {season.kb_topics?.slice(0, 5).map((topic, j) => (
                      <span key={j} className="text-xs bg-slate-700 text-slate-300 px-3 py-1 rounded-full">
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedSeason(season.name_ar);
                    genKB({ name: season.name_ar, sector: "other" });
                  }}
                  disabled={genLoading && selectedSeason === season.name_ar}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white 
                    font-semibold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {genLoading && selectedSeason === season.name_ar ? (
                    <><Loader2 className="animate-spin w-4 h-4" /> يتم توليد المحتوى...</>
                  ) : genSuccess && selectedSeason === season.name_ar ? (
                    <><CheckCircle className="w-4 h-4" /> تم الإضافة لقاعدة المعرفة ✅</>
                  ) : (
                    <><Sparkles className="w-4 h-4" /> أضف لقاعدة المعرفة تلقائياً</>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
