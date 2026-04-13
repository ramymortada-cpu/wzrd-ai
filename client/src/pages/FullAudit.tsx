/**
 * FullAudit.tsx — Sprint A + D: 7-pillar brand audit + Honesty Engine
 * Routes: /app/full-audit (new) | /app/full-audit/:id (view saved)
 * States: form | loading | results | partial | error
 */

import { useState, useEffect, useRef, type RefObject } from 'react';
import { useParams, useLocation } from 'wouter';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Target, Loader2, ChevronDown, ChevronUp, AlertTriangle,
  CheckCircle2, History, RefreshCw, MessageSquare, FileDown, Sparkles
} from 'lucide-react';
import { INDUSTRIES } from '@/lib/industries';
import { waMeQualifiedLeadHref } from '@/lib/waContact';
import { formatTierPrice } from '@shared/const';

// ─── Types ────────────────────────────────────────────────────────────────────

type State = 'form' | 'loading' | 'results' | 'error';
type ErrorType = 'insufficient_credits' | 'ai_failed' | 'timeout' | 'network' | 'none';

interface Pillar {
  id: string;
  name: string;
  nameAr: string;
  score: number;
  summary: string;
  source?: string;
  findings: Array<{ title: string; detail: string; severity: 'high' | 'medium' | 'low' }>;
}

interface AuditResult {
  pillars: Pillar[];
  overallScore: number | null;
  overallLabel: string | null;
  confidence: string;
  confidenceScore?: number;
  confidenceReason: string;
  confidenceReasonAr?: string;
  confidenceSources?: string[];
  top3Issues: Array<{ issue: string; impact: string; fix: string }>;
  actionPlan: { thisWeek: string[]; thisMonth: string[]; next3Months: string[] };
  limitations: string[];
}

type StrategyPackData = {
  competitive: Record<string, unknown> | null;
  messaging: Record<string, unknown> | null;
  roadmap: Record<string, unknown> | null;
};

/** Matches server `getPersistedStrategyPack` — at least two non-empty JSON objects. */
function hydrateStrategyFromResultJson(resultJson: unknown): StrategyPackData | null {
  const rj = (resultJson ?? {}) as Record<string, unknown>;
  const raw = (rj.strategyPack ?? rj.strategy) as Record<string, unknown> | undefined;
  if (!raw || typeof raw !== "object") return null;
  const competitive = (raw.competitive as Record<string, unknown> | null) ?? null;
  const messaging = (raw.messaging as Record<string, unknown> | null) ?? null;
  const roadmap = (raw.roadmap as Record<string, unknown> | null) ?? null;
  const filled = [competitive, messaging, roadmap].filter((p) => p != null && Object.keys(p).length > 0);
  if (filled.length < 2) return null;
  return { competitive, messaging, roadmap };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const LOADING_PHASES = [
  { id: 'data', labelAr: 'بنجمع البيانات...', labelEn: 'Gathering data...', icon: '🔍' },
  { id: 'website', labelAr: 'بنحلل الموقع...', labelEn: 'Analyzing website...', icon: '🌐' },
  { id: 'competitors', labelAr: 'بنبحث عن المنافسين...', labelEn: 'Researching competitors...', icon: '📊' },
  { id: 'analysis', labelAr: 'بنحلل العلامة التجارية...', labelEn: 'Running brand analysis...', icon: '🧠' },
  { id: 'report', labelAr: 'بنجهز التقرير...', labelEn: 'Preparing report...', icon: '📋' },
];

const SOURCE_BADGE: Record<string, { icon: string; label: string; labelAr: string; className: string }> = {
  lighthouse:          { icon: '⚡', label: 'Lighthouse',       labelAr: 'قياس الأداء',      className: 'bg-purple-100 text-purple-700 border-purple-200' },
  website:             { icon: '🌐', label: 'Website',          labelAr: 'الموقع',            className: 'bg-blue-100 text-blue-700 border-blue-200' },
  competitor_research: { icon: '🔍', label: 'Research',         labelAr: 'بحث المنافسين',     className: 'bg-orange-100 text-orange-700 border-orange-200' },
  user_input:          { icon: '📝', label: 'User Input',       labelAr: 'بيانات المستخدم',   className: 'bg-gray-100 text-gray-600 border-gray-200' },
};

const CONFIDENCE_STYLE: Record<string, { dot: string; text: string }> = {
  high:   { dot: 'bg-green-500',  text: 'text-green-700' },
  medium: { dot: 'bg-yellow-500', text: 'text-yellow-700' },
  low:    { dot: 'bg-red-500',    text: 'text-red-700' },
};

const SEVERITY_COLOR: Record<string, string> = {
  high: 'bg-red-100 text-red-700 border-red-200',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  low: 'bg-green-100 text-green-700 border-green-200',
};
const SEVERITY_ICON: Record<string, string> = { high: '🔴', medium: '🟡', low: '🟢' };

function scoreColor(score: number) {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  if (score >= 40) return 'text-orange-600';
  return 'text-red-600';
}

function scoreBg(score: number) {
  if (score >= 80) return 'bg-green-50 border-green-200';
  if (score >= 60) return 'bg-yellow-50 border-yellow-200';
  if (score >= 40) return 'bg-orange-50 border-orange-200';
  return 'bg-red-50 border-red-200';
}

function tierMarketKey(m: string): string {
  return m === 'egypt' || m === 'ksa' || m === 'uae' ? m : 'other';
}

function StrategyJsonBlock({ title, data }: { title: string; data: Record<string, unknown> | null }) {
  if (!data) return null;
  return (
    <Card className="border-muted">
      <CardContent className="p-4">
        <h4 className="font-semibold text-sm mb-2">{title}</h4>
        <pre className="text-[11px] leading-relaxed overflow-auto max-h-56 rounded-md bg-muted/50 p-3" dir="ltr">
          {JSON.stringify(data, null, 2)}
        </pre>
      </CardContent>
    </Card>
  );
}

// ─── Pillar Card ──────────────────────────────────────────────────────────────

function PillarCard({ pillar, isAr }: { pillar: Pillar; isAr: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const score = pillar.score ?? 0;
  const srcBadge = pillar.source ? (SOURCE_BADGE[pillar.source] ?? SOURCE_BADGE['user_input']) : null;

  return (
    <Card className={`border ${scoreBg(score)}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-bold text-sm">{isAr ? pillar.nameAr : pillar.name}</h3>
          <span className={`text-2xl font-black ${scoreColor(score)}`}>{score}</span>
        </div>
        {srcBadge && (
          <span className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-medium mb-2 ${srcBadge.className}`}>
            {srcBadge.icon} {isAr ? srcBadge.labelAr : srcBadge.label}
          </span>
        )}
        <div className="w-full h-1.5 rounded-full bg-gray-200 mb-2">
          <div
            className={`h-1.5 rounded-full transition-all ${score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : score >= 40 ? 'bg-orange-500' : 'bg-red-500'}`}
            style={{ width: `${score}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mb-2">{pillar.summary}</p>
        {pillar.findings?.length > 0 && (
          <>
            <button
              className="flex items-center gap-1 text-xs text-primary hover:underline"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {isAr ? `${pillar.findings.length} نتيجة` : `${pillar.findings.length} findings`}
            </button>
            {expanded && (
              <div className="mt-2 space-y-2">
                {pillar.findings.map((f, i) => (
                  <div key={i} className={`rounded-lg border p-2 text-xs ${SEVERITY_COLOR[f.severity] ?? ''}`}>
                    <div className="flex items-center gap-1 font-semibold mb-0.5">
                      <span>{SEVERITY_ICON[f.severity] ?? '⚪'}</span>
                      {f.title}
                    </div>
                    <p className="text-xs opacity-80">{f.detail}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Results View ─────────────────────────────────────────────────────────────

function ResultsView({
  audit,
  isPartial,
  partialMessage,
  isAr,
  onRetry,
  auditRecordId,
  onDownloadPdf,
  pdfLoading,
  strategyPack,
  strategyPackLoading,
  strategyPackError,
  strategyPackCost,
  userCredits,
  onGenerateStrategyPack,
  onDownloadStrategyPdf,
  strategyPdfLoading,
  strategySectionRef,
  companyName,
  marketForPricing,
}: {
  audit: AuditResult;
  isPartial: boolean;
  partialMessage?: string;
  isAr: boolean;
  onRetry: () => void;
  auditRecordId: number | null;
  onDownloadPdf: () => void;
  pdfLoading: boolean;
  strategyPack: StrategyPackData | null;
  strategyPackLoading: boolean;
  strategyPackError: string | null;
  strategyPackCost: number;
  userCredits: number;
  onGenerateStrategyPack: () => void;
  onDownloadStrategyPdf: () => void;
  strategyPdfLoading: boolean;
  strategySectionRef: RefObject<HTMLDivElement | null>;
  companyName: string;
  marketForPricing: string;
}) {
  const [, navigate] = useLocation();
  const waHref = waMeQualifiedLeadHref({
    diagnosisLabel: 'التحليل الشامل',
    brandName: companyName.trim() || null,
    score: audit.overallScore ?? undefined,
  });
  const overall = audit.overallScore ?? 0;
  const canRunStrategy = userCredits >= strategyPackCost;
  const strategyWa = waMeQualifiedLeadHref({
    diagnosisLabel: isAr ? 'حزمة الاستراتيجية' : 'Strategy Pack',
    brandName: companyName.trim() || null,
    score: overall,
  });

  return (
    <div className="space-y-6 pb-10">
      {auditRecordId !== null && (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            className="border-2 border-primary"
            disabled={pdfLoading}
            onClick={onDownloadPdf}
          >
            {pdfLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="mr-2 h-4 w-4" />
            )}
            {isAr ? 'حمّل PDF' : 'Download PDF'}
          </Button>
        </div>
      )}

      {isPartial && (
        <Card className="border-2 border-yellow-400 bg-yellow-50">
          <CardContent className="p-4 flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-yellow-800 text-sm">{partialMessage}</p>
              <button onClick={onRetry} className="text-xs text-yellow-700 underline mt-1">
                {isAr ? 'أعد التحليل كامل' : 'Retry full analysis'}
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hero score */}
      <Card className={`border-2 ${scoreBg(overall)}`}>
        <CardContent className="p-6 text-center">
          <div className={`text-7xl font-black mb-1 ${scoreColor(overall)}`}>{overall}</div>
          <div className="text-2xl font-bold mb-3">{audit.overallLabel ?? ''}</div>

          {/* Confidence badge */}
          {(() => {
            const cs = CONFIDENCE_STYLE[audit.confidence] ?? CONFIDENCE_STYLE['low'];
            return (
              <div className="inline-flex flex-col items-center gap-1 mb-3">
                <div className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold ${cs.text} border-current/30 bg-white/70`}>
                  <span className={`h-2 w-2 rounded-full ${cs.dot}`} />
                  {isAr
                    ? (audit.confidence === 'high' ? 'ثقة عالية' : audit.confidence === 'medium' ? 'ثقة متوسطة' : 'ثقة منخفضة')
                    : (audit.confidence === 'high' ? 'High Confidence' : audit.confidence === 'medium' ? 'Medium Confidence' : 'Low Confidence')}
                  {audit.confidenceScore !== undefined && (
                    <span className="opacity-60 text-xs">({audit.confidenceScore}/100)</span>
                  )}
                </div>
                {audit.confidenceSources && audit.confidenceSources.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-1 mt-1">
                    {audit.confidenceSources.map((src) => {
                      const b = SOURCE_BADGE[src] ?? SOURCE_BADGE['user_input'];
                      return (
                        <span key={src} className={`inline-flex items-center gap-0.5 rounded border px-1.5 py-0.5 text-[10px] ${b.className}`}>
                          {b.icon} {isAr ? b.labelAr : b.label}
                        </span>
                      );
                    })}
                  </div>
                )}
                {(isAr ? audit.confidenceReasonAr : audit.confidenceReason) && (
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                    {isAr ? audit.confidenceReasonAr : audit.confidenceReason}
                  </p>
                )}
              </div>
            );
          })()}

          <Badge variant="outline" className="text-xs text-muted-foreground">
            {isAr ? 'تحليل شامل مكتمل' : 'Full audit complete'}
          </Badge>
        </CardContent>
      </Card>

      {auditRecordId !== null && overall < 70 && (
        <Card className="border-2 border-amber-400/70 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/35 dark:to-orange-950/25">
          <CardContent className="p-5 space-y-3 text-center">
            <p className="text-lg font-bold text-amber-950 dark:text-amber-50">
              {isAr ? 'عايز خطة تنفيذ كاملة؟' : 'Want a full execution plan?'}
            </p>
            <p className="text-sm text-muted-foreground">
              {isAr
                ? `حزمة الاستراتيجية — يبدأ من ${formatTierPrice('strategy_pack', tierMarketKey(marketForPricing))}`
                : `Strategy Pack — from ${formatTierPrice('strategy_pack', tierMarketKey(marketForPricing))}`}
            </p>
            <Button
              type="button"
              className="bg-amber-600 hover:bg-amber-700"
              onClick={() => strategySectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            >
              {isAr ? 'اكتشف الحزمة ↓' : 'Explore Strategy Pack ↓'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 7 Pillars */}
      {audit.pillars?.length > 0 && (
        <div>
          <h2 className="font-bold text-lg mb-3">{isAr ? 'المحاور السبعة' : '7 Pillars'}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {(audit.pillars as Pillar[]).map((p, i) => (
              <PillarCard key={p.id ?? i} pillar={p} isAr={isAr} />
            ))}
          </div>
        </div>
      )}

      {/* Top 3 Issues */}
      {audit.top3Issues?.length > 0 && (
        <div>
          <h2 className="font-bold text-lg mb-3">{isAr ? 'أهم 3 مشاكل' : 'Top 3 Issues'}</h2>
          <div className="space-y-3">
            {audit.top3Issues.map((issue, i) => (
              <Card key={i} className="border-l-4 border-l-red-400">
                <CardContent className="p-4">
                  <div className="flex items-start gap-2">
                    <span className="text-red-500 font-black text-lg shrink-0">{i + 1}.</span>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{issue.issue}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        <span className="font-medium">{isAr ? 'التأثير:' : 'Impact:'}</span> {issue.impact}
                      </p>
                      <p className="text-xs text-green-700 mt-1">
                        <span className="font-medium">✅ {isAr ? 'الحل:' : 'Fix:'}</span> {issue.fix}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Action Plan */}
      {audit.actionPlan && (
        <div>
          <h2 className="font-bold text-lg mb-3">{isAr ? 'خطة العمل' : 'Action Plan'}</h2>
          <Tabs defaultValue="week">
            <TabsList className="w-full">
              <TabsTrigger value="week" className="flex-1 text-xs">{isAr ? 'هذا الأسبوع' : 'This Week'}</TabsTrigger>
              <TabsTrigger value="month" className="flex-1 text-xs">{isAr ? 'هذا الشهر' : 'This Month'}</TabsTrigger>
              <TabsTrigger value="quarter" className="flex-1 text-xs">{isAr ? 'الـ 3 شهور' : '3 Months'}</TabsTrigger>
            </TabsList>
            <TabsContent value="week">
              <Card><CardContent className="p-4">
                <ul className="space-y-2">
                  {audit.actionPlan.thisWeek.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm"><CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />{item}</li>
                  ))}
                </ul>
              </CardContent></Card>
            </TabsContent>
            <TabsContent value="month">
              <Card><CardContent className="p-4">
                <ul className="space-y-2">
                  {audit.actionPlan.thisMonth.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm"><Target className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />{item}</li>
                  ))}
                </ul>
              </CardContent></Card>
            </TabsContent>
            <TabsContent value="quarter">
              <Card><CardContent className="p-4">
                <ul className="space-y-2">
                  {audit.actionPlan.next3Months.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm"><Target className="h-4 w-4 text-purple-600 mt-0.5 shrink-0" />{item}</li>
                  ))}
                </ul>
              </CardContent></Card>
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Limitations */}
      {audit.limitations?.length > 0 && (
        <details className="border rounded-lg p-3 text-sm">
          <summary className="cursor-pointer font-medium flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            {isAr ? 'حدود التحليل' : 'Analysis Limitations'}
          </summary>
          <ul className="mt-2 space-y-1 text-muted-foreground">
            {audit.limitations.map((l, i) => <li key={i} className="text-xs">• {l}</li>)}
          </ul>
        </details>
      )}

      {/* Strategy Pack */}
      {auditRecordId !== null && (
        <div ref={strategySectionRef} className="space-y-3">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            {isAr ? 'حزمة الاستراتيجية' : 'Strategy Pack'}
          </h2>
          {strategyPackError && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-3 text-sm text-red-800">{strategyPackError}</CardContent>
            </Card>
          )}
          {strategyPack ? (
            <div className="space-y-4">
              {auditRecordId !== null && (
                <div className="flex justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-2 border-amber-600/50"
                    disabled={strategyPdfLoading}
                    onClick={onDownloadStrategyPdf}
                  >
                    {strategyPdfLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <FileDown className="mr-2 h-4 w-4" />
                    )}
                    {isAr ? 'حمّل PDF الاستراتيجية' : 'Download strategy PDF'}
                  </Button>
                </div>
              )}
              <div className="grid gap-3 md:grid-cols-3">
                <StrategyJsonBlock title={isAr ? 'تنافسية' : 'Competitive'} data={strategyPack.competitive} />
                <StrategyJsonBlock title={isAr ? 'الرسالة' : 'Messaging'} data={strategyPack.messaging} />
                <StrategyJsonBlock title={isAr ? 'خطة ٩٠ يوم' : '90-day roadmap'} data={strategyPack.roadmap} />
              </div>
              <div className="rounded-xl border border-green-200/60 bg-green-50/50 dark:bg-green-950/20 p-4 text-center space-y-2">
                <p className="text-sm font-semibold">{isAr ? 'عايز فريق ينفذلك؟' : 'Want a team to run this for you?'}</p>
                <p className="text-xs text-muted-foreground">Primo Marca</p>
                <a
                  href={strategyWa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                >
                  <MessageSquare className="h-4 w-4" />
                  WhatsApp
                </a>
              </div>
            </div>
          ) : (
            <Card className="border-2 border-amber-200/60 bg-amber-50/40">
              <CardContent className="p-4 space-y-3">
                <p className="text-sm text-muted-foreground">
                  {isAr
                    ? 'توسيعة اختيارية: منافسين، رسائل العلامة، وخطة تنفيذ — بعد التحليل الشامل.'
                    : 'Optional add-on: competitors, brand messaging, and an execution roadmap on top of this audit.'}
                </p>
                {!canRunStrategy && (
                  <p className="text-xs text-amber-900 font-medium">
                    {isAr ? 'فعّل الباقة أو اشحن الرصيد من الأسعار.' : 'Open Pricing to add balance or upgrade.'}
                  </p>
                )}
                <Button
                  type="button"
                  size="sm"
                  disabled={strategyPackLoading || !canRunStrategy}
                  onClick={onGenerateStrategyPack}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  {strategyPackLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  {isAr ? 'ولّد حزمة الاستراتيجية' : 'Generate strategy pack'}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* CTAs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Card className="border-dashed border-2 border-muted">
          <CardContent className="p-4 text-center">
            <p className="text-sm font-medium mb-1">📄 {isAr ? 'تقرير PDF كامل' : 'Full PDF report'}</p>
            <p className="text-xs text-muted-foreground">
              {auditRecordId !== null
                ? (isAr ? 'استخدم زر «حمّل PDF» أعلاه' : 'Use the Download PDF button above')
                : (isAr ? 'احفظ التحليل أولاً لتحميل PDF' : 'Save the audit to enable PDF download')}
            </p>
          </CardContent>
        </Card>
        <Card className="border-2 border-green-200 bg-green-50">
          <CardContent className="p-4 text-center">
            <p className="text-sm font-medium mb-2">💬 {isAr ? 'استشارة مع خبير' : 'Expert Consultation'}</p>
            <a href={waHref} target="_blank" rel="noopener noreferrer">
              <Button size="sm" className="bg-green-600 hover:bg-green-700 w-full">
                <MessageSquare className="mr-1 h-3.5 w-3.5" />
                {isAr ? 'تواصل على WhatsApp' : 'WhatsApp'}
              </Button>
            </a>
          </CardContent>
        </Card>
      </div>

      <div className="text-center">
        <button
          onClick={() => navigate('/app/my-audits')}
          className="text-sm text-primary hover:underline flex items-center gap-1 mx-auto"
        >
          <History className="h-4 w-4" />
          {isAr ? 'كل تحليلاتي' : 'All my audits'}
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function FullAudit() {
  const params = useParams<{ id?: string }>();
  const auditId = params.id ? Number(params.id) : null;
  const [, navigate] = useLocation();
  const { user } = useAuth({ redirectOnUnauthenticated: true });
  const { locale } = useI18n();
  const isAr = locale === 'ar';
  const utils = trpc.useUtils();
  const strategySectionRef = useRef<HTMLDivElement>(null);

  const toolCostsQuery = trpc.credits.toolCosts.useQuery(undefined, { staleTime: 60_000 });
  const strategyPackCost = toolCostsQuery.data?.costs?.strategy_pack ?? 140;

  const [state, setState] = useState<State>('form');
  const [errorType, setErrorType] = useState<ErrorType>('none');
  const [errorMeta, setErrorMeta] = useState<{ needed?: number; have?: number }>({});
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [isPartial, setIsPartial] = useState(false);
  const [partialMessage, setPartialMessage] = useState('');
  const [loadingPhase, setLoadingPhase] = useState(0);
  const [slowWarning, setSlowWarning] = useState(false);
  /** DB row id for PDF download (URL :id or last run insertId). */
  const [resolvedAuditId, setResolvedAuditId] = useState<number | null>(null);
  const [strategyPack, setStrategyPack] = useState<StrategyPackData | null>(null);
  const [strategyPackError, setStrategyPackError] = useState<string | null>(null);

  // Form state
  const [companyName, setCompanyName] = useState('');
  const [website, setWebsite] = useState('');
  const [industry, setIndustry] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [mainChallenge, setMainChallenge] = useState('');
  const [marketRegion, setMarketRegion] = useState<'egypt' | 'ksa' | 'uae' | 'other'>('egypt');

  // Load saved audit if :id present
  const savedAuditQuery = trpc.fullAudit.getAudit.useQuery(
    { id: auditId! },
    { enabled: !!auditId, retry: false }
  );

  useEffect(() => {
    if (auditId && savedAuditQuery.data) {
      const row = savedAuditQuery.data;
      const result = row.resultJson as AuditResult;
      setAuditResult(result);
      setResolvedAuditId(row.id);
      setStrategyPack(hydrateStrategyFromResultJson(row.resultJson));
      setStrategyPackError(null);
      const m = row.marketRegion;
      if (m === 'egypt' || m === 'ksa' || m === 'uae' || m === 'other') {
        setMarketRegion(m);
      }
      setState('results');
    }
  }, [auditId, savedAuditQuery.data]);

  /** After Paymob redirect: poll until purchase is reflected (webhook). */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const qs = new URLSearchParams(window.location.search);
    if (qs.get('payment') !== 'pending') return;
    const raw = qs.get('plan') || 'full_audit';
    const planId = raw === 'strategy_pack' ? 'strategy_pack' : 'full_audit';
    const tierStrategy = qs.get('tier') === 'strategy';

    let cancelled = false;
    const run = async () => {
      for (let i = 0; i < 40; i++) {
        if (cancelled) return;
        try {
          const st = await utils.credits.purchaseStatus.fetch({ planId });
          await utils.auth.me.invalidate();
          await utils.credits.balance.invalidate();
          if (st.processed) {
            toast.success(isAr ? 'تم تأكيد الدفع.' : 'Payment confirmed.');
            window.history.replaceState(null, '', window.location.pathname);
            if (tierStrategy || planId === 'strategy_pack') {
              setTimeout(() => strategySectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 400);
            }
            return;
          }
        } catch {
          /* non-fatal */
        }
        await new Promise((r) => setTimeout(r, 3000));
      }
      if (!cancelled) {
        toast.info(isAr ? 'لسه بنأكد الدفع — حدّث الصفحة أو انتظر دقيقة.' : 'Still confirming payment — refresh in a moment.');
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [utils, isAr]);

  const strategyPackMutation = trpc.fullAudit.generateStrategyPack.useMutation({
    onSuccess: (data, variables) => {
      if (data.success && data.strategy) {
        setStrategyPack(data.strategy as StrategyPackData);
        setStrategyPackError(null);
        void utils.auth.me.invalidate();
        void utils.credits.balance.invalidate();
        void utils.fullAudit.getAudit.invalidate({ id: variables.auditId });
        toast.success(isAr ? 'تم توليد حزمة الاستراتيجية.' : 'Strategy pack generated.');
      } else if (!data.success) {
        if (data.error === 'insufficient_credits') {
          navigate('/app/pricing');
          return;
        }
        const msg =
          'message' in data && typeof data.message === 'string'
            ? data.message
            : data.error === 'not_found'
              ? isAr
                ? 'لم يُعثر على التحليل.'
                : 'Audit not found.'
              : isAr
                ? 'تعذّر التوليد.'
                : 'Generation failed.';
        setStrategyPackError(msg);
      }
    },
    onError: () => {
      setStrategyPackError(isAr ? 'خطأ في الشبكة.' : 'Network error.');
    },
  });

  const pdfMutation = trpc.fullAudit.generatePdf.useMutation({
    onSuccess: (data) => {
      window.open(data.downloadUrl, "_blank", "noopener,noreferrer");
    },
  });

  const strategyPdfMutation = trpc.fullAudit.generateStrategyPdf.useMutation({
    onSuccess: (data) => {
      window.open(data.downloadUrl, "_blank", "noopener,noreferrer");
    },
  });

  // Loading phase cycling
  useEffect(() => {
    if (state !== 'loading') return;
    const interval = setInterval(() => {
      setLoadingPhase(p => Math.min(p + 1, LOADING_PHASES.length - 1));
    }, 4500);
    const slowTimer = setTimeout(() => setSlowWarning(true), 45000);
    return () => { clearInterval(interval); clearTimeout(slowTimer); };
  }, [state]);

  // 60-second frontend timeout
  const mutation = trpc.fullAudit.run.useMutation({
    onSuccess: (data) => {
      if (!data.success) {
        if (data.error === 'insufficient_credits') {
          setErrorMeta({ needed: data.needed, have: data.have });
          setErrorType('insufficient_credits');
        } else {
          setErrorType('ai_failed');
        }
        setState('error');
        return;
      }
      setAuditResult(data.audit as unknown as AuditResult);
      setIsPartial(data.partial ?? false);
      setPartialMessage(data.partialMessage ?? '');
      setResolvedAuditId(typeof data.auditId === "number" ? data.auditId : null);
      setState('results');
    },
    onError: () => {
      setErrorType('network');
      setState('error');
    },
  });

  useEffect(() => {
    if (!mutation.isPending) return;
    const timeout = setTimeout(() => {
      mutation.reset();
      setErrorType('timeout');
      setState('error');
    }, 60000);
    return () => clearTimeout(timeout);
  }, [mutation.isPending, mutation]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !industry || !targetAudience.trim() || !mainChallenge.trim()) return;
    setState('loading');
    setLoadingPhase(0);
    setSlowWarning(false);
    mutation.mutate({ companyName, website: website || undefined, industry, targetAudience, mainChallenge, marketRegion });
  };

  const handleRetry = () => {
    setState('form');
    setErrorType('none');
    setAuditResult(null);
    setResolvedAuditId(null);
    mutation.reset();
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (state === 'loading') {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-6" />
        <h2 className="font-bold text-xl mb-6">{isAr ? 'جاري التحليل...' : 'Analyzing your brand...'}</h2>
        <div className="space-y-3 text-left">
          {LOADING_PHASES.map((phase, i) => (
            <div key={phase.id} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${i === loadingPhase ? 'bg-primary/10 border border-primary/30' : i < loadingPhase ? 'opacity-50' : 'opacity-30'}`}>
              <span className="text-xl">{i < loadingPhase ? '✅' : phase.icon}</span>
              <span className={`text-sm font-medium ${i === loadingPhase ? 'text-primary animate-pulse' : ''}`}>
                {isAr ? phase.labelAr : phase.labelEn}
              </span>
            </div>
          ))}
        </div>
        {slowWarning && (
          <p className="mt-6 text-sm text-muted-foreground animate-pulse">
            {isAr ? 'بيتأخر شوية... استنى كمان 🔄' : 'Taking a bit longer... hang tight 🔄'}
          </p>
        )}
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (state === 'error') {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        {errorType === 'insufficient_credits' && (
          <>
            <div className="text-4xl mb-2">💳</div>
            <h2 className="font-bold text-xl">{isAr ? 'الرصيد مش كافي' : 'Insufficient Credits'}</h2>
            <p className="text-muted-foreground text-sm">
              {isAr
                ? `محتاج ${errorMeta.needed ?? 60} credit — عندك ${errorMeta.have ?? 0}`
                : `Need ${errorMeta.needed ?? 60} credits — you have ${errorMeta.have ?? 0}`}
            </p>
            <Button onClick={() => navigate('/app/pricing')} className="w-full">
              {isAr ? 'اشحن رصيدك' : 'Top Up Credits'}
            </Button>
          </>
        )}
        {errorType === 'ai_failed' && (
          <>
            <div className="text-4xl mb-2">🤖</div>
            <h2 className="font-bold text-xl">{isAr ? 'التحليل فشل' : 'Analysis Failed'}</h2>
            <p className="text-sm text-muted-foreground">{isAr ? 'مفيش credits اتخصمت' : 'No credits were deducted'}</p>
            <div className="flex gap-2">
              <Button onClick={handleRetry} className="flex-1"><RefreshCw className="mr-1 h-4 w-4" />{isAr ? 'جرب تاني' : 'Try Again'}</Button>
              <a href={waMeQualifiedLeadHref({ diagnosisLabel: 'التحليل الشامل - خطأ' })} target="_blank" rel="noopener noreferrer" className="flex-1">
                <Button variant="outline" className="w-full"><MessageSquare className="mr-1 h-4 w-4" />{isAr ? 'تواصل معانا' : 'Contact Us'}</Button>
              </a>
            </div>
          </>
        )}
        {errorType === 'timeout' && (
          <>
            <div className="text-4xl mb-2">⏱</div>
            <h2 className="font-bold text-xl">{isAr ? 'الاتصال اتأخر' : 'Connection Timeout'}</h2>
            <Button onClick={handleRetry} className="w-full"><RefreshCw className="mr-1 h-4 w-4" />{isAr ? 'جرب تاني' : 'Try Again'}</Button>
          </>
        )}
        {errorType === 'network' && (
          <>
            <div className="text-4xl mb-2">🌐</div>
            <h2 className="font-bold text-xl">{isAr ? 'خطأ في الشبكة' : 'Network Error'}</h2>
            <Button onClick={handleRetry} className="w-full"><RefreshCw className="mr-1 h-4 w-4" />{isAr ? 'جرب تاني' : 'Try Again'}</Button>
          </>
        )}
      </div>
    );
  }

  // ── Results ──────────────────────────────────────────────────────────────
  if (state === 'results' && auditResult) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center gap-2 mb-6">
          <button onClick={() => navigate('/app/full-audit')} className="text-sm text-primary hover:underline">
            {isAr ? '+ تحليل جديد' : '+ New Audit'}
          </button>
        </div>
        <ResultsView
          audit={auditResult}
          isPartial={isPartial}
          partialMessage={partialMessage}
          isAr={isAr}
          onRetry={handleRetry}
          auditRecordId={resolvedAuditId}
          pdfLoading={pdfMutation.isPending}
          strategyPdfLoading={strategyPdfMutation.isPending}
          strategyPack={strategyPack}
          strategyPackLoading={strategyPackMutation.isPending}
          strategyPackError={strategyPackError}
          strategyPackCost={strategyPackCost}
          userCredits={user?.credits ?? 0}
          strategySectionRef={strategySectionRef}
          onGenerateStrategyPack={() => {
            if (resolvedAuditId === null) return;
            setStrategyPackError(null);
            strategyPackMutation.mutate({ auditId: resolvedAuditId });
          }}
          onDownloadStrategyPdf={() => {
            if (resolvedAuditId !== null) {
              strategyPdfMutation.mutate({ auditId: resolvedAuditId });
            }
          }}
          onDownloadPdf={() => {
            if (resolvedAuditId !== null) {
              pdfMutation.mutate({ auditId: resolvedAuditId });
            }
          }}
          companyName={(auditId && savedAuditQuery.data?.companyName) || companyName || ''}
          marketForPricing={marketRegion}
        />
      </div>
    );
  }

  // ── Form ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Target className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-black">{isAr ? 'التحليل الشامل' : 'Full Brand Audit'}</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          {isAr
            ? 'تحليل 7 محاور: الهوية، التمركز، الرسالة، العرض، التواجد الرقمي، التصميم، الجاهزية'
            : '7 dimensions: Identity, Positioning, Messaging, Offer, Digital Presence, Design, Market Readiness'}
        </p>
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="outline" className="text-xs text-muted-foreground">
            {isAr ? 'يتطلب باقة التحليل الشامل' : 'Requires Full Audit plan balance'}
          </Badge>
        </div>
      </div>

      {user && (user.credits ?? 0) < 60 && (
        <Card className="border-2 border-amber-200 bg-amber-50/60 mb-6">
          <CardContent className="p-4">
            <p className="text-sm font-semibold text-amber-900">
              {isAr ? 'محتاج تفعيل باقة التحليل الشامل من الأسعار.' : 'You need the Full Audit plan from Pricing.'}
            </p>
            <Button size="sm" className="mt-2" onClick={() => navigate('/app/pricing')}>
              {isAr ? 'اذهب للأسعار' : 'Open pricing'}
            </Button>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="companyName">{isAr ? 'اسم الشركة / العلامة التجارية *' : 'Company / Brand Name *'}</Label>
          <Input
            id="companyName"
            value={companyName}
            onChange={e => setCompanyName(e.target.value)}
            placeholder={isAr ? 'مثال: Volta Coffee' : 'e.g., Volta Coffee'}
            required
            maxLength={200}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="website">
            {isAr ? 'الموقع الإلكتروني (اختياري)' : 'Website (optional)'}
          </Label>
          <Input
            id="website"
            type="url"
            value={website}
            onChange={e => setWebsite(e.target.value)}
            placeholder="https://example.com"
          />
          <p className="text-xs text-muted-foreground">
            {isAr ? 'أضف الموقع عشان نحلله فعلياً ونجيب بيانات دقيقة' : 'Add website for real data analysis (Lighthouse, content, etc.)'}
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="industry">{isAr ? 'القطاع *' : 'Industry *'}</Label>
          <Select value={industry} onValueChange={setIndustry} required>
            <SelectTrigger id="industry">
              <SelectValue placeholder={isAr ? 'اختر القطاع' : 'Select industry'} />
            </SelectTrigger>
            <SelectContent>
              {INDUSTRIES.map(ind => (
                <SelectItem key={ind.value} value={ind.value}>
                  {isAr ? ind.labelAr : ind.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="targetAudience">{isAr ? 'الجمهور المستهدف *' : 'Target Audience *'}</Label>
          <Textarea
            id="targetAudience"
            value={targetAudience}
            onChange={e => setTargetAudience(e.target.value)}
            placeholder={isAr ? 'مثال: أصحاب الشركات الصغيرة في مصر، عمر 25-45' : 'e.g., Small business owners in Egypt, age 25-45'}
            rows={2}
            required
            maxLength={1000}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="mainChallenge">{isAr ? 'التحدي الأكبر *' : 'Main Challenge *'}</Label>
          <Textarea
            id="mainChallenge"
            value={mainChallenge}
            onChange={e => setMainChallenge(e.target.value)}
            placeholder={isAr ? 'مثال: ما بنتميزش عن المنافسين، رسالتنا مش واضحة' : 'e.g., Not standing out from competitors, unclear messaging'}
            rows={2}
            required
            maxLength={1000}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="market">{isAr ? 'السوق المستهدف *' : 'Target Market *'}</Label>
          <Select value={marketRegion} onValueChange={v => setMarketRegion(v as typeof marketRegion)}>
            <SelectTrigger id="market">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="egypt">🇪🇬 {isAr ? 'مصر' : 'Egypt'}</SelectItem>
              <SelectItem value="ksa">🇸🇦 {isAr ? 'السعودية' : 'Saudi Arabia'}</SelectItem>
              <SelectItem value="uae">🇦🇪 {isAr ? 'الإمارات' : 'UAE'}</SelectItem>
              <SelectItem value="other">🌍 {isAr ? 'أخرى' : 'Other'}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          type="submit"
          className="w-full"
          size="lg"
          disabled={mutation.isPending || !companyName.trim() || !industry || !targetAudience.trim() || !mainChallenge.trim() || (user ? (user.credits ?? 0) < 60 : false)}
        >
          {mutation.isPending ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{isAr ? 'جاري التحليل...' : 'Analyzing...'}</>
          ) : (
            <><Target className="mr-2 h-4 w-4" />{isAr ? 'ابدأ التحليل الشامل' : 'Start full audit'}</>
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          {isAr
            ? 'التحليل بيغطي 7 محاور: الهوية، التمركز، الرسالة، العرض، التواجد الرقمي، التصميم، الجاهزية'
            : 'Analysis covers 7 dimensions: Identity, Positioning, Messaging, Offer, Digital Presence, Design, Market Readiness'}
        </p>
      </form>
    </div>
  );
}
