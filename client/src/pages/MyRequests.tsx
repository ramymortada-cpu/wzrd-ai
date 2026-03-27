import { useState, useEffect, useCallback } from 'react';
import { useI18n } from '@/lib/i18n';
import WzrdPublicHeader from '@/components/WzrdPublicHeader';

interface ServiceRequest {
  id: number;
  requestNumber: string;
  serviceType: string;
  serviceTypeAr: string;
  status: string;
  statusLabel: { ar: string; en: string; icon: string; color: string };
  statusOrder: string[];
  currentStep: number;
  estimatedDelivery: string | null;
  createdAt: string;
}

interface TimelineEntry {
  id: number;
  status: string;
  title: string;
  titleAr: string;
  detail: string | null;
  detailAr: string | null;
  updateType: string;
  fileUrl: string | null;
  fileName: string | null;
  meetingLink: string | null;
  meetingDate: string | null;
  statusLabel: { ar: string; en: string; icon: string; color: string } | null;
  createdAt: string;
}

interface RequestFile {
  id: number;
  fileName: string;
  fileUrl: string;
  uploadedBy: string;
  createdAt: string;
}

const STATUS_STEPS = [
  { key: 'received', ar: 'استلام', en: 'Received', icon: '📩' },
  { key: 'reviewing', ar: 'مراجعة', en: 'Review', icon: '👀' },
  { key: 'in_progress', ar: 'تنفيذ', en: 'In Progress', icon: '⚙️' },
  { key: 'ready_for_delivery', ar: 'جاهز', en: 'Ready', icon: '📦' },
  { key: 'delivered', ar: 'تسليم', en: 'Delivered', icon: '✅' },
];

export default function MyRequests() {
  const { locale } = useI18n();
  const isAr = locale === 'ar';

  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [selected, setSelected] = useState<ServiceRequest | null>(null);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [files, setFiles] = useState<RequestFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState({ serviceType: '', description: '' });
  const [diagnosisContext, setDiagnosisContext] = useState<{ toolName?: string; toolNameAr?: string; score?: number; topFindings?: string } | null>(null);

  // Read diagnosis context if coming from ?from=diagnosis
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('from') === 'diagnosis') {
      try {
        const ctx = JSON.parse(sessionStorage.getItem('wzrd_service_context') || '{}');
        if (ctx.score) {
          setDiagnosisContext(ctx);
          // Auto-fill form based on diagnosis
          const autoDesc = isAr
            ? `بناءً على تشخيص ${ctx.toolNameAr || ctx.toolName} — النتيجة: ${ctx.score}/100\nأهم المشاكل: ${ctx.topFindings || 'غير محدد'}\nعايز فريقكم يشتغل على تحسين البراند.`
            : `Based on ${ctx.toolName} diagnosis — Score: ${ctx.score}/100\nTop issues: ${ctx.topFindings || 'Not specified'}\nI'd like your team to work on improving the brand.`;
          setNewForm({ serviceType: 'brand_audit', description: autoDesc });
          setShowNew(true);
          // Clean up
          sessionStorage.removeItem('wzrd_service_context');
        }
      } catch { /* invalid session JSON */ }
    }
  }, [isAr]);

  // Fetch requests — reusable for polling
  const fetchRequests = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      const res = await fetch('/api/trpc/serviceRequest.myRequests', { credentials: 'include' });
      const d = await res.json();
      const data = d.result?.data?.json ?? d.result?.data ?? [];
      setRequests(Array.isArray(data) ? data : []);
    } catch { /* keep existing list on fetch error */ }
    if (showLoader) setLoading(false);
  }, []);

  // Initial load
  useEffect(() => { fetchRequests(true); }, [fetchRequests]);

  // Auto-refresh every 30 seconds (only when on list view, not editing)
  useEffect(() => {
    if (selected || showNew) return; // Don't poll while viewing detail or creating
    const interval = setInterval(() => fetchRequests(false), 30_000);
    return () => clearInterval(interval);
  }, [fetchRequests, selected, showNew]);

  const loadTimeline = useCallback(async (req: ServiceRequest) => {
    setSelected(req);
    try {
      const res = await fetch(`/api/trpc/serviceRequest.getTimeline?input=${encodeURIComponent(JSON.stringify({ json: { requestId: req.id } }))}`, { credentials: 'include' });
      const d = await res.json();
      const data = d.result?.data?.json ?? d.result?.data ?? {};
      // Update selected with fresh data if available
      if (data.request) setSelected(data.request);
      setTimeline(data.updates || []);
      setFiles(data.files || []);
    } catch { setTimeline([]); setFiles([]); }
  }, []);

  // Auto-refresh timeline every 30 seconds when viewing detail
  useEffect(() => {
    if (!selected) return;
    const interval = setInterval(() => {
      loadTimeline(selected);
    }, 30_000);
    return () => clearInterval(interval);
  }, [selected, loadTimeline]);

  const submitNew = async () => {
    if (!newForm.serviceType.trim()) return;
    try {
      const services: Record<string, string> = {
        'brand_audit': 'تقييم براند شامل',
        'brand_strategy': 'استراتيجية براند',
        'visual_identity': 'هوية بصرية',
        'content_strategy': 'استراتيجية محتوى',
        'social_media': 'إدارة سوشيال ميديا',
        'other': 'خدمة أخرى',
      };
      const res = await fetch('/api/trpc/serviceRequest.submitRequest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ json: {
          serviceType: newForm.serviceType,
          serviceTypeAr: services[newForm.serviceType] || newForm.serviceType,
          description: newForm.description || undefined,
        }}),
      });
      const d = await res.json();
      const result = d.result?.data?.json ?? d.result?.data;
      if (result?.success) {
        alert(isAr ? `تم إرسال طلبك! رقم الطلب: ${result.requestNumber}` : `Request submitted! Number: ${result.requestNumber}`);
        setShowNew(false);
        setNewForm({ serviceType: '', description: '' });
        setDiagnosisContext(null);
        fetchRequests(false);
      }
    } catch { alert(isAr ? 'حصل مشكلة — حاول تاني.' : 'Error — try again.'); }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  const getStepIndex = (status: string) => {
    const map: Record<string, number> = { received: 0, reviewing: 1, info_needed: 1, meeting_scheduled: 1, in_progress: 2, internal_review: 2, revision: 2, ready_for_delivery: 3, delivered: 4, completed: 4 };
    return map[status] ?? 0;
  };

  if (loading) {
    return (
      <div className="wzrd-page-radial min-h-screen text-zinc-900 dark:text-white" dir={isAr ? 'rtl' : 'ltr'}>
        <WzrdPublicHeader />
        <div className="wzrd-public-pt mx-auto max-w-2xl px-4 py-12">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-1/2 rounded-lg bg-zinc-200/80 dark:bg-zinc-700/80" />
            <div className="h-40 rounded-3xl bg-zinc-200/80 dark:bg-zinc-700/80" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="wzrd-page-radial min-h-screen text-zinc-900 dark:text-white" dir={isAr ? 'rtl' : 'ltr'}>
      <WzrdPublicHeader />
      <div className="wzrd-public-pt mx-auto max-w-2xl px-4 pb-24 pt-2">

        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">
            {isAr ? 'طلباتي' : 'My Requests'}
          </h1>
          <button
            onClick={() => setShowNew(!showNew)}
            className="rounded-full bg-gradient-to-r from-primary to-violet-600 px-4 py-2 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition hover:brightness-110"
          >
            {isAr ? '+ طلب جديد' : '+ New Request'}
          </button>
        </div>

        {/* New Request Form */}
        {showNew && (
          <div className="wzrd-glass mb-6 rounded-3xl p-6">
            <h3 className="mb-4 text-base font-bold">{isAr ? 'طلب خدمة جديدة' : 'New Service Request'}</h3>

            {/* Diagnosis context banner */}
            {diagnosisContext && (
              <div className="mb-4 rounded-2xl border border-indigo-200/60 bg-indigo-500/10 p-4 dark:border-indigo-500/30">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">🔬</span>
                  <span className="text-sm font-bold text-indigo-800">
                    {isAr ? 'بناءً على نتيجة التشخيص' : 'Based on your diagnosis'}
                  </span>
                </div>
                <p className="text-xs text-indigo-600">
                  {isAr
                    ? `${diagnosisContext.toolNameAr || diagnosisContext.toolName} — النتيجة: ${diagnosisContext.score}/100`
                    : `${diagnosisContext.toolName} — Score: ${diagnosisContext.score}/100`}
                </p>
                {diagnosisContext.topFindings && (
                  <p className="text-xs text-indigo-500 mt-1">{diagnosisContext.topFindings}</p>
                )}
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{isAr ? 'نوع الخدمة' : 'Service Type'}</label>
                <select value={newForm.serviceType} onChange={e => setNewForm({ ...newForm, serviceType: e.target.value })}
                  className="w-full rounded-2xl border border-zinc-200/90 bg-white/70 px-4 py-3 text-sm outline-none backdrop-blur-md focus:border-primary dark:border-zinc-600 dark:bg-zinc-900/50">
                  <option value="">{isAr ? 'اختار...' : 'Select...'}</option>
                  <option value="brand_audit">{isAr ? 'تقييم براند شامل' : 'Full Brand Audit'}</option>
                  <option value="brand_strategy">{isAr ? 'استراتيجية براند' : 'Brand Strategy'}</option>
                  <option value="visual_identity">{isAr ? 'هوية بصرية' : 'Visual Identity'}</option>
                  <option value="content_strategy">{isAr ? 'استراتيجية محتوى' : 'Content Strategy'}</option>
                  <option value="social_media">{isAr ? 'إدارة سوشيال ميديا' : 'Social Media Management'}</option>
                  <option value="other">{isAr ? 'خدمة أخرى' : 'Other'}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{isAr ? 'وصف (اختياري)' : 'Description (optional)'}</label>
                <textarea value={newForm.description} onChange={e => setNewForm({ ...newForm, description: e.target.value })}
                  rows={3} placeholder={isAr ? 'اكتب أي تفاصيل عن طلبك...' : 'Any details about your request...'}
                  className="w-full resize-none rounded-2xl border border-zinc-200/90 bg-white/70 px-4 py-3 text-sm outline-none backdrop-blur-md focus:border-primary dark:border-zinc-600 dark:bg-zinc-900/50" />
              </div>
              <button onClick={submitNew}
                className="w-full rounded-2xl bg-gradient-to-r from-primary to-violet-600 py-3 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition hover:brightness-110">
                {isAr ? 'ابعت الطلب' : 'Submit Request'}
              </button>
            </div>
          </div>
        )}

        {/* Detail View */}
        {selected ? (
          <div>
            <button onClick={() => setSelected(null)} className="mb-4 text-sm text-primary hover:underline">
              {isAr ? '← رجوع للقائمة' : '← Back to list'}
            </button>

            {/* Request Header */}
            <div className="wzrd-glass mb-4 rounded-3xl p-6">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-mono text-xs text-zinc-400">#{selected.requestNumber}</span>
                <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: selected.statusLabel.color + '20', color: selected.statusLabel.color }}>
                  {selected.statusLabel.icon} {isAr ? selected.statusLabel.ar : selected.statusLabel.en}
                </span>
              </div>
              <h2 className="text-lg font-bold">{isAr ? selected.serviceTypeAr : selected.serviceType}</h2>
              {selected.estimatedDelivery && (
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  {isAr ? 'موعد التسليم المتوقع: ' : 'Expected delivery: '}{formatDate(selected.estimatedDelivery)}
                </p>
              )}
            </div>

            {/* Progress Steps — shipping style */}
            <div className="wzrd-glass mb-4 rounded-3xl p-6">
              <div className="relative flex items-center justify-between">
                {/* Line */}
                <div className="absolute top-5 left-[10%] right-[10%] z-0 h-1 rounded-full bg-zinc-200/90 dark:bg-zinc-800/90" />
                <div
                  className="absolute top-5 left-[10%] z-[1] h-1 rounded-full bg-gradient-to-r from-primary to-cyan-500 transition-all duration-700"
                  style={{ width: `${Math.min(100, (getStepIndex(selected.status) / (STATUS_STEPS.length - 1)) * 80)}%` }}
                />

                {STATUS_STEPS.map((step, i) => {
                  const active = getStepIndex(selected.status) >= i;
                  const current = getStepIndex(selected.status) === i;
                  return (
                    <div key={step.key} className="relative z-[2] flex flex-col items-center" style={{ width: `${100 / STATUS_STEPS.length}%` }}>
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full text-lg transition-all duration-500 ${
                          current
                            ? 'wzrd-courier-pulse scale-110 bg-primary text-primary-foreground shadow-lg shadow-primary/30'
                            : active
                              ? 'bg-primary/15 text-primary'
                              : 'bg-zinc-200/80 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500'
                        }`}
                      >
                        {step.icon}
                      </div>
                      <span className={`mt-2 text-xs font-medium ${active ? 'text-primary' : 'text-zinc-400'}`}>
                        {isAr ? step.ar : step.en}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Timeline */}
            <div className="wzrd-glass mb-4 rounded-3xl p-6">
              <h3 className="mb-4 text-sm font-bold text-zinc-700 dark:text-zinc-300">{isAr ? 'سجل التحديثات' : 'Update Timeline'}</h3>
              {timeline.length === 0 ? (
                <p className="py-4 text-center text-sm text-zinc-400">{isAr ? 'لا توجد تحديثات بعد' : 'No updates yet'}</p>
              ) : (
                <div className="relative">
                  {/* Vertical line */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/45 via-zinc-300/50 to-transparent dark:via-zinc-600/50"
                    style={{ [isAr ? 'right' : 'left']: '15px' }}
                  />

                  <div className="space-y-4">
                    {timeline.map((entry, ti) => (
                      <div key={entry.id} className="relative flex gap-4" style={{ [isAr ? 'paddingRight' : 'paddingLeft']: '40px' }}>
                        {/* Dot */}
                        <div
                          className={`absolute top-1 h-3 w-3 rounded-full border-2 border-white shadow-sm dark:border-zinc-900 ${ti === 0 ? 'wzrd-courier-pulse' : ''}`}
                          style={{
                            [isAr ? 'right' : 'left']: '10px',
                            backgroundColor: entry.statusLabel?.color || '#9ca3af',
                          }}
                        />

                        <div className="flex-1 pb-2">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-bold text-gray-900">{isAr ? entry.titleAr : entry.title}</span>
                          </div>
                          {(isAr ? entry.detailAr : entry.detail) && (
                            <div className={`text-xs leading-relaxed mt-1 ${
                              (isAr ? entry.detailAr : entry.detail)!.length > 200
                                ? 'p-3 rounded-lg bg-gray-50 border border-gray-100 text-gray-600'
                                : 'text-gray-500'
                            }`} style={{ whiteSpace: 'pre-line' }}>
                              {isAr ? entry.detailAr : entry.detail}
                            </div>
                          )}

                          {/* Meeting link + date */}
                          {entry.meetingLink && (
                            <div className="mt-2 p-3 rounded-lg bg-blue-50 border border-blue-100">
                              <div className="flex items-center gap-2 flex-wrap">
                                <a href={entry.meetingLink} target="_blank" rel="noopener"
                                  className="inline-flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-500 transition">
                                  📹 {isAr ? 'انضم للاجتماع' : 'Join Meeting'}
                                </a>
                                {entry.meetingDate && (
                                  <span className="text-xs text-blue-600 font-medium">
                                    📅 {formatDate(entry.meetingDate)}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* File download */}
                          {entry.fileUrl && (
                            <div className="mt-2 p-3 rounded-lg bg-green-50 border border-green-100">
                              <a href={entry.fileUrl} target="_blank" rel="noopener"
                                className="inline-flex items-center gap-2 text-green-700 text-xs font-medium hover:text-green-600 transition">
                                <span className="text-lg">📄</span>
                                <span className="flex-1">{entry.fileName || (isAr ? 'حمّل الملف' : 'Download File')}</span>
                                <span className="px-2 py-1 bg-green-600 text-white rounded-md text-xs font-bold">⬇ {isAr ? 'حمّل' : 'Download'}</span>
                              </a>
                            </div>
                          )}

                          <span className="block text-xs text-gray-300 mt-1">{formatDate(entry.createdAt)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Files Section */}
            {files.length > 0 && (
              <div className="wzrd-glass mb-4 rounded-3xl p-6">
                <h3 className="mb-3 text-sm font-bold text-zinc-700 dark:text-zinc-300">{isAr ? 'الملفات' : 'Files'}</h3>
                <div className="space-y-2">
                  {files.map(f => (
                    <a key={f.id} href={f.fileUrl} target="_blank" rel="noopener"
                      className="flex items-center gap-3 rounded-2xl bg-zinc-100/60 p-3 transition hover:bg-primary/10 dark:bg-zinc-800/40">
                      <span className="text-lg">📄</span>
                      <div className="flex-1">
                        <span className="text-sm font-medium">{f.fileName}</span>
                        <span className="block text-xs text-zinc-400">{formatDate(f.createdAt)} · {isAr ? (f.uploadedBy === 'team' ? 'الفريق' : 'أنت') : f.uploadedBy}</span>
                      </div>
                      <span className="text-xs font-medium text-primary">⬇</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Request List */
          <div>
            {requests.length === 0 ? (
              <div className="wzrd-glass rounded-3xl p-8 text-center">
                <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/15 to-cyan-500/10">
                  <svg className="h-10 w-10 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-1.5-1.5v-9a1.5 1.5 0 011.5-1.5h5.586a1.5 1.5 0 011.06.44l2.914 2.914a1.5 1.5 0 01.44 1.06V17.25a1.5 1.5 0 01-1.5 1.5h-9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 5.25v3.75a1.5 1.5 0 001.5 1.5h3.75" />
                    <path strokeLinecap="round" d="M9 12h6M9 15.75h4.5" />
                  </svg>
                </div>
                <h2 className="mb-2 text-lg font-semibold">
                  {isAr ? 'مفيش طلبات لسه' : 'No requests yet'}
                </h2>
                <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
                  {isAr ? 'عايز نشتغل على البراند بتاعك؟ قدّم طلب وفريقنا هيتواصل معاك.' : 'Want us to work on your brand? Submit a request and our team will reach out.'}
                </p>
                <button onClick={() => setShowNew(true)}
                  className="rounded-full bg-gradient-to-r from-primary to-violet-600 px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition hover:brightness-110">
                  {isAr ? 'قدّم طلب خدمة' : 'Submit Service Request'}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {requests.map(req => (
                  <button key={req.id} onClick={() => loadTimeline(req)}
                    className="wzrd-glass w-full rounded-3xl p-5 text-right transition hover:ring-2 hover:ring-primary/15">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="font-mono text-xs text-zinc-400">#{req.requestNumber}</span>
                      <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: req.statusLabel.color + '20', color: req.statusLabel.color }}>
                        {req.statusLabel.icon} {isAr ? req.statusLabel.ar : req.statusLabel.en}
                      </span>
                    </div>
                    <h3 className="mb-2 text-base font-bold">{isAr ? req.serviceTypeAr : req.serviceType}</h3>

                    {/* Mini progress bar */}
                    <div className="flex gap-1">
                      {STATUS_STEPS.map((_, i) => (
                        <div key={i} className={`h-1.5 flex-1 rounded-full ${getStepIndex(req.status) >= i ? 'bg-gradient-to-r from-primary to-cyan-500' : 'bg-zinc-200/80 dark:bg-zinc-800'}`} />
                      ))}
                    </div>

                    <p className="mt-2 text-xs text-zinc-400">{formatDate(req.createdAt)}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
