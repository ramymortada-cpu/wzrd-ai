import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
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
  const [, navigate] = useLocation();
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
      } catch {}
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
    } catch {}
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
      <div className="min-h-screen bg-gray-50">
        <WzrdPublicHeader />
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/2" />
            <div className="h-40 bg-gray-200 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir={isAr ? 'rtl' : 'ltr'}>
      <WzrdPublicHeader />
      <div className="max-w-2xl mx-auto px-4 py-6 pb-24">

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {isAr ? 'طلباتي' : 'My Requests'}
          </h1>
          <button onClick={() => setShowNew(!showNew)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-full text-sm font-semibold hover:bg-indigo-500 transition">
            {isAr ? '+ طلب جديد' : '+ New Request'}
          </button>
        </div>

        {/* New Request Form */}
        {showNew && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
            <h3 className="text-base font-bold text-gray-900 mb-4">{isAr ? 'طلب خدمة جديدة' : 'New Service Request'}</h3>

            {/* Diagnosis context banner */}
            {diagnosisContext && (
              <div className="mb-4 p-4 rounded-xl bg-indigo-50 border border-indigo-100">
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
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:border-indigo-500 outline-none">
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
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:border-indigo-500 outline-none resize-none" />
              </div>
              <button onClick={submitNew}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-500 transition">
                {isAr ? 'ابعت الطلب' : 'Submit Request'}
              </button>
            </div>
          </div>
        )}

        {/* Detail View */}
        {selected ? (
          <div>
            <button onClick={() => setSelected(null)} className="text-sm text-indigo-600 mb-4 hover:underline">
              {isAr ? '← رجوع للقائمة' : '← Back to list'}
            </button>

            {/* Request Header */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono text-gray-400">#{selected.requestNumber}</span>
                <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: selected.statusLabel.color + '20', color: selected.statusLabel.color }}>
                  {selected.statusLabel.icon} {isAr ? selected.statusLabel.ar : selected.statusLabel.en}
                </span>
              </div>
              <h2 className="text-lg font-bold text-gray-900">{isAr ? selected.serviceTypeAr : selected.serviceType}</h2>
              {selected.estimatedDelivery && (
                <p className="text-sm text-gray-500 mt-1">
                  {isAr ? 'موعد التسليم المتوقع: ' : 'Expected delivery: '}{formatDate(selected.estimatedDelivery)}
                </p>
              )}
            </div>

            {/* Progress Steps — shipping style */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
              <div className="flex items-center justify-between relative">
                {/* Line */}
                <div className="absolute top-5 left-[10%] right-[10%] h-1 bg-gray-100 rounded-full" style={{ zIndex: 0 }} />
                <div className="absolute top-5 left-[10%] h-1 bg-indigo-500 rounded-full transition-all duration-700" style={{ zIndex: 1, width: `${Math.min(100, (getStepIndex(selected.status) / (STATUS_STEPS.length - 1)) * 80)}%` }} />

                {STATUS_STEPS.map((step, i) => {
                  const active = getStepIndex(selected.status) >= i;
                  const current = getStepIndex(selected.status) === i;
                  return (
                    <div key={step.key} className="flex flex-col items-center relative" style={{ zIndex: 2, width: `${100 / STATUS_STEPS.length}%` }}>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all duration-500 ${
                        current ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-110' :
                        active ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-400'
                      }`}>
                        {step.icon}
                      </div>
                      <span className={`text-xs mt-2 font-medium ${active ? 'text-indigo-600' : 'text-gray-400'}`}>
                        {isAr ? step.ar : step.en}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
              <h3 className="text-sm font-bold text-gray-700 mb-4">{isAr ? 'سجل التحديثات' : 'Update Timeline'}</h3>
              {timeline.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">{isAr ? 'لا توجد تحديثات بعد' : 'No updates yet'}</p>
              ) : (
                <div className="relative">
                  {/* Vertical line */}
                  <div className="absolute top-0 bottom-0 w-0.5 bg-gray-100" style={{ [isAr ? 'right' : 'left']: '15px' }} />

                  <div className="space-y-4">
                    {timeline.map((entry) => (
                      <div key={entry.id} className="relative flex gap-4" style={{ [isAr ? 'paddingRight' : 'paddingLeft']: '40px' }}>
                        {/* Dot */}
                        <div className="absolute top-1 w-3 h-3 rounded-full border-2 border-white shadow-sm" style={{
                          [isAr ? 'right' : 'left']: '10px',
                          backgroundColor: entry.statusLabel?.color || '#9ca3af'
                        }} />

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
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
                <h3 className="text-sm font-bold text-gray-700 mb-3">{isAr ? 'الملفات' : 'Files'}</h3>
                <div className="space-y-2">
                  {files.map(f => (
                    <a key={f.id} href={f.fileUrl} target="_blank" rel="noopener"
                      className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-indigo-50 transition">
                      <span className="text-lg">📄</span>
                      <div className="flex-1">
                        <span className="text-sm font-medium text-gray-800">{f.fileName}</span>
                        <span className="block text-xs text-gray-400">{formatDate(f.createdAt)} · {isAr ? (f.uploadedBy === 'team' ? 'الفريق' : 'أنت') : f.uploadedBy}</span>
                      </div>
                      <span className="text-xs text-indigo-600 font-medium">⬇</span>
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
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
                <div className="text-5xl mb-4">📋</div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  {isAr ? 'مفيش طلبات لسه' : 'No requests yet'}
                </h2>
                <p className="text-gray-500 text-sm mb-6">
                  {isAr ? 'عايز نشتغل على البراند بتاعك؟ قدّم طلب وفريقنا هيتواصل معاك.' : 'Want us to work on your brand? Submit a request and our team will reach out.'}
                </p>
                <button onClick={() => setShowNew(true)}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-full font-semibold text-sm hover:bg-indigo-500 transition">
                  {isAr ? 'قدّم طلب خدمة' : 'Submit Service Request'}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {requests.map(req => (
                  <button key={req.id} onClick={() => loadTimeline(req)}
                    className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-5 text-right hover:shadow-md transition">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-mono text-gray-400">#{req.requestNumber}</span>
                      <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: req.statusLabel.color + '20', color: req.statusLabel.color }}>
                        {req.statusLabel.icon} {isAr ? req.statusLabel.ar : req.statusLabel.en}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-gray-900 mb-2">{isAr ? req.serviceTypeAr : req.serviceType}</h3>

                    {/* Mini progress bar */}
                    <div className="flex gap-1">
                      {STATUS_STEPS.map((_, i) => (
                        <div key={i} className={`flex-1 h-1.5 rounded-full ${getStepIndex(req.status) >= i ? 'bg-indigo-500' : 'bg-gray-100'}`} />
                      ))}
                    </div>

                    <p className="text-xs text-gray-400 mt-2">{formatDate(req.createdAt)}</p>
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
