/**
 * FullAudit.tsx — Sprint A: 7-pillar brand audit
 * Routes: /app/full-audit (new) | /app/full-audit/:id (view saved)
 * States: form | loading | results | partial | error
 */

import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
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
  CheckCircle2, History, RefreshCw, MessageSquare
} from 'lucide-react';
import { INDUSTRIES } from '@/lib/industries';
import { waMeQualifiedLeadHref } from '@/lib/waContact';

// ─── Types ────────────────────────────────────────────────────────────────────

type State = 'form' | 'loading' | 'results' | 'error';
type ErrorType = 'insufficient_credits' | 'ai_failed' | 'timeout' | 'network' | 'none';

interface Pillar {
  id: string;
  name: string;
  nameAr: string;
  score: number;
  summary: string;
  findings: Array<{ title: string; detail: string; severity: 'high' | 'medium' | 'low' }>;
}

interface AuditResult {
  pillars: Pillar[];
  overallScore: number | null;
  overallLabel: string | null;
  confidence: string;
  confidenceReason: string;
  top3Issues: Array<{ issue: string; impact: string; fix: string }>;
  actionPlan: { thisWeek: string[]; thisMonth: string[]; next3Months: string[] };
  limitations: string[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const LOADING_PHASES = [
  { id: 'data', labelAr: 'بنجمع البيانات...', labelEn: 'Gathering data...', icon: '🔍' },
  { id: 'website', labelAr: 'بنحلل الموقع...', labelEn: 'Analyzing website...', icon: '🌐' },
  { id: 'competitors', labelAr: 'بنبحث عن المنافسين...', labelEn: 'Researching competitors...', icon: '📊' },
  { id: 'analysis', labelAr: 'بنحلل العلامة التجارية...', labelEn: 'Running brand analysis...', icon: '🧠' },
  { id: 'report', labelAr: 'بنجهز التقرير...', labelEn: 'Preparing report...', icon: '📋' },
];

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

// ─── Pillar Card ──────────────────────────────────────────────────────────────

function PillarCard({ pillar, isAr }: { pillar: Pillar; isAr: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const score = pillar.score ?? 0;

  return (
    <Card className={`border ${scoreBg(score)}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-sm">{isAr ? pillar.nameAr : pillar.name}</h3>
          <span className={`text-2xl font-black ${scoreColor(score)}`}>{score}</span>
        </div>
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
  creditsUsed,
  isAr,
  onRetry,
}: {
  audit: AuditResult;
  isPartial: boolean;
  partialMessage?: string;
  creditsUsed: number;
  isAr: boolean;
  onRetry: () => void;
}) {
  const [, navigate] = useLocation();
  const waHref = waMeQualifiedLeadHref({ diagnosisLabel: 'التحليل الشامل' });
  const overall = audit.overallScore ?? 0;

  return (
    <div className="space-y-6 pb-10">
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
          <div className="text-2xl font-bold mb-2">{audit.overallLabel ?? ''}</div>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-xs">
              {isAr ? 'الثقة:' : 'Confidence:'} {audit.confidence}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {creditsUsed} {isAr ? 'credit' : 'credits'}
            </Badge>
          </div>
          {audit.confidenceReason && (
            <p className="text-xs text-muted-foreground mt-2 max-w-md mx-auto">{audit.confidenceReason}</p>
          )}
        </CardContent>
      </Card>

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

      {/* CTAs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Card className="border-dashed border-2 border-muted">
          <CardContent className="p-4 text-center">
            <p className="text-sm font-medium mb-1">📄 {isAr ? 'عايز تقرير PDF مصمم؟' : 'Want a designed PDF report?'}</p>
            <p className="text-xs text-muted-foreground">{isAr ? 'قريباً — Sprint B' : 'Coming soon — Sprint B'}</p>
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

  const [state, setState] = useState<State>('form');
  const [errorType, setErrorType] = useState<ErrorType>('none');
  const [errorMeta, setErrorMeta] = useState<{ needed?: number; have?: number }>({});
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [isPartial, setIsPartial] = useState(false);
  const [partialMessage, setPartialMessage] = useState('');
  const [creditsUsed, setCreditsUsed] = useState(0);
  const [loadingPhase, setLoadingPhase] = useState(0);
  const [slowWarning, setSlowWarning] = useState(false);

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
      setCreditsUsed(row.creditsUsed ?? 0);
      setState('results');
    }
  }, [auditId, savedAuditQuery.data]);

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
      setAuditResult(data.audit as AuditResult);
      setCreditsUsed(data.meta.creditsUsed);
      setIsPartial(data.partial ?? false);
      setPartialMessage(data.partialMessage ?? '');
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
          creditsUsed={creditsUsed}
          isAr={isAr}
          onRetry={handleRetry}
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
          <Badge variant="outline" className="text-xs">60 {isAr ? 'credit' : 'credits'}</Badge>
          {user && (
            <span className="text-xs text-muted-foreground">
              {isAr ? `رصيدك: ${user.credits ?? 0}` : `Balance: ${user.credits ?? 0}`}
            </span>
          )}
        </div>
      </div>

      {user && (user.credits ?? 0) < 60 && (
        <Card className="border-2 border-red-200 bg-red-50 mb-6">
          <CardContent className="p-4">
            <p className="text-sm font-semibold text-red-700">
              {isAr ? `محتاج 60 credit — عندك ${user.credits ?? 0}` : `Need 60 credits — you have ${user.credits ?? 0}`}
            </p>
            <Button size="sm" className="mt-2 bg-red-600 hover:bg-red-700" onClick={() => navigate('/app/pricing')}>
              {isAr ? 'اشحن رصيدك' : 'Top Up'}
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
            <><Target className="mr-2 h-4 w-4" />{isAr ? 'ابدأ التحليل الشامل (60 credit)' : 'Start Full Audit (60 credits)'}</>
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
