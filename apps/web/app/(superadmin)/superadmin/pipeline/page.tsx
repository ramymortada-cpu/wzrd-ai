"use client";

import { useEffect, useState } from "react";
import { Cpu, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SATopBar from "@/components/superadmin/sa-topbar";
import { getSAPipeline, updateSAPipeline, getSABenchmark, type PipelineConfig } from "@/lib/api";

export default function SAPipelinePage() {
  const [config, setConfig] = useState<PipelineConfig | null>(null);
  const [benchmark, setBenchmark] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [thresholds, setThresholds] = useState({
    confidence_auto_threshold: 0.85,
    confidence_soft_escalation_threshold: 0.6,
  });

  useEffect(() => {
    Promise.all([getSAPipeline(), getSABenchmark()])
      .then(([cfg, bench]) => {
        setConfig(cfg);
        setBenchmark(bench);
        setThresholds({
          confidence_auto_threshold: cfg.confidence_auto_threshold,
          confidence_soft_escalation_threshold: cfg.confidence_soft_escalation_threshold,
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    try {
      await updateSAPipeline(thresholds);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <SATopBar title="إعدادات NLP Pipeline" subtitle="إدارة حدود الثقة والنماذج" />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-28 rounded-lg bg-slate-800 animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {/* Models info */}
            <Card className="bg-slate-900 border-slate-700">
              <CardHeader className="px-5 py-4 border-b border-slate-700">
                <CardTitle className="text-sm text-slate-100 flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-violet-400" />
                  النماذج المستخدمة
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 grid grid-cols-2 gap-4">
                <div className="bg-slate-800 rounded-lg p-4">
                  <p className="text-xs text-slate-400 mb-1">نموذج الدردشة</p>
                  <p className="text-sm font-mono text-violet-300">{config?.openai_chat_model}</p>
                </div>
                <div className="bg-slate-800 rounded-lg p-4">
                  <p className="text-xs text-slate-400 mb-1">نموذج التضمين</p>
                  <p className="text-sm font-mono text-violet-300">{config?.openai_embedding_model}</p>
                </div>
              </CardContent>
            </Card>

            {/* Confidence Thresholds */}
            <Card className="bg-slate-900 border-slate-700">
              <CardHeader className="px-5 py-4 border-b border-slate-700">
                <CardTitle className="text-sm text-slate-100">حدود الثقة الافتراضية</CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm text-slate-300">حد الأتمتة التلقائية</label>
                    <span className="text-sm font-bold text-violet-400">
                      {thresholds.confidence_auto_threshold.toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="range" min={0.5} max={1} step={0.05}
                    value={thresholds.confidence_auto_threshold}
                    onChange={(e) =>
                      setThresholds((t) => ({ ...t, confidence_auto_threshold: parseFloat(e.target.value) }))
                    }
                    className="w-full accent-violet-500"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>0.50 (أكثر رداً)</span>
                    <span>1.00 (أكثر تصعيداً)</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm text-slate-300">حد التصعيد الناعم</label>
                    <span className="text-sm font-bold text-amber-400">
                      {thresholds.confidence_soft_escalation_threshold.toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="range" min={0.3} max={0.9} step={0.05}
                    value={thresholds.confidence_soft_escalation_threshold}
                    onChange={(e) =>
                      setThresholds((t) => ({
                        ...t,
                        confidence_soft_escalation_threshold: parseFloat(e.target.value),
                      }))
                    }
                    className="w-full accent-amber-500"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>0.30</span>
                    <span>0.90</span>
                  </div>
                </div>

                {/* Routing explanation */}
                <div className="bg-slate-800 rounded-lg p-4 text-xs space-y-1.5">
                  <p className="text-slate-300 font-medium mb-2">منطق التوجيه الحالي:</p>
                  <p className="text-slate-400">
                    <span className="text-emerald-400">≥ {thresholds.confidence_auto_threshold.toFixed(2)}</span>
                    {" → رد تلقائي (auto_rag أو template)"}
                  </p>
                  <p className="text-slate-400">
                    <span className="text-amber-400">
                      {thresholds.confidence_soft_escalation_threshold.toFixed(2)} — {thresholds.confidence_auto_threshold.toFixed(2)}
                    </span>
                    {" → تصعيد ناعم (الذكاء يصيغ، الوكيل يراجع)"}
                  </p>
                  <p className="text-slate-400">
                    <span className="text-red-400">&lt; {thresholds.confidence_soft_escalation_threshold.toFixed(2)}</span>
                    {" → تصعيد صارم (الوكيل يتولى فوراً)"}
                  </p>
                </div>

                <button
                  onClick={save}
                  disabled={saving}
                  className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-5 py-2.5 rounded-md transition-colors disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {saving ? "جاري الحفظ..." : saved ? "تم الحفظ ✓" : "حفظ الإعدادات"}
                </button>

                <p className="text-xs text-slate-500">
                  ملاحظة: هذه القيم افتراضية للمتاجر الجديدة. لتغيير قيم متجر محدد، اذهب إلى تفاصيل المتجر.
                </p>
              </CardContent>
            </Card>

            {/* Intent list */}
            {config && config.intents.length > 0 && (
              <Card className="bg-slate-900 border-slate-700">
                <CardHeader className="px-5 py-4 border-b border-slate-700">
                  <CardTitle className="text-sm text-slate-100">
                    النوايا المُدرَّبة ({config.intents.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5">
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                    {config.intents.map((intent) => (
                      <div key={intent.name} className="bg-slate-800 rounded-lg p-3">
                        <p className="text-sm font-medium text-slate-100 font-mono">{intent.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{intent.keyword_count} كلمة مفتاحية</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Benchmark results */}
            <Card className="bg-slate-900 border-slate-700">
              <CardHeader className="px-5 py-4 border-b border-slate-700">
                <CardTitle className="text-sm text-slate-100">نتائج Benchmark الأخيرة</CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                {benchmark && benchmark.status === "not_run" ? (
                  <div className="text-center py-6 text-slate-500">
                    <p className="text-sm">{String(benchmark.message)}</p>
                    <code className="text-xs text-slate-600 mt-2 block">
                      uv run python scripts/benchmark.py
                    </code>
                  </div>
                ) : (
                  <pre className="text-xs text-slate-300 bg-slate-800 p-4 rounded-lg overflow-auto">
                    {JSON.stringify(benchmark, null, 2)}
                  </pre>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
