import ToolPage from './ToolPage';
import { INDUSTRIES } from '@/lib/industries';
import { INSTAGRAM_FOLLOWERS, POSTING_FREQUENCY, AVG_RESPONSE_TIME, GOOGLE_BUSINESS } from '@/lib/formOptions';

export default function PresenceAudit() {
  return <ToolPage config={{
    id: 'presence_audit', name: 'Presence Audit', nameAr: 'فحص الحضور الرقمي', icon: '🌐', cost: 25,
    endpoint: 'tools.presenceAudit',
    paywallAfterFreePreview: true,
    freePreviewEndpoint: 'tools.freePresenceAuditDiagnosis',
    unlockEndpoint: 'tools.unlockPresenceAudit',
    description: 'How you appear across social, web, and inquiry channels',
    descriptionAr: 'إزاي بتظهر على السوشيال والويب',
    guideUrl: '/guides/brand-health', guideTitle: 'Brand Health Guide',
    intro: {
      headline: 'What does a stranger see when they Google you?',
      headlineAr: 'الغريب بيشوف إيه لما يبحث عنك؟',
      body: 'This tool audits your digital footprint — Instagram, website, inquiry flow, other channels. It checks if your online presence matches your intended positioning.',
      bodyAr: 'الأداة دي بتراجع بصمتك الرقمية — الإنستجرام، الموقع، طريقة التواصل، القنوات التانية. بتتأكد إن الحضور بتاعك على الإنترنت متوافق مع التموضع بتاعك.',
      measures: ['Channel coverage score', 'Visual consistency', 'Inquiry flow friction', 'Response time indicators', 'Cross-platform coherence'],
      measuresAr: ['تغطية القنوات', 'الاتساق البصري', 'احتكاك التواصل', 'مؤشرات وقت الرد', 'الاتساق عبر المنصات'],
      bestFor: 'Businesses investing in digital marketing but not seeing results. If you\'re posting but not converting — your presence has gaps.',
      bestForAr: 'الأفضل لـ: بزنس بيستثمر في الديجيتال ماركتينج ومش شايف نتائج. لو بتعمل بوستات ومش بيحوّل — عندك فجوات في الحضور.',
    },
    fields: [
      { name: 'companyName', label: 'Company Name', labelAr: 'اسم الشركة', type: 'text', placeholder: 'e.g. Sahra Café', placeholderAr: 'مثال: كافيه سهرة', required: true },
      { name: 'industry', label: 'Industry', labelAr: 'المجال', type: 'select', options: [...INDUSTRIES], required: true },
      { name: 'website', label: 'Website', labelAr: 'الموقع الإلكتروني', type: 'text', placeholder: 'https://...' },
      { name: 'instagramHandle', label: 'Instagram handle', labelAr: 'حساب Instagram', type: 'text', placeholder: '@yourhandle' },
      { name: 'instagramFollowers', label: 'Follower count', labelAr: 'عدد المتابعين', type: 'select', options: [...INSTAGRAM_FOLLOWERS] },
      { name: 'otherPlatforms', label: 'Other platforms', labelAr: 'منصات تانية', type: 'text', placeholder: 'TikTok, LinkedIn, Facebook, YouTube' },
      { name: 'postingFrequency', label: 'Posting frequency', labelAr: 'معدل النشر', type: 'select', options: [...POSTING_FREQUENCY] },
      { name: 'contentType', label: 'What content do you post?', labelAr: 'إيه نوع المحتوى اللي بتنشره؟', type: 'textarea', placeholder: 'Photos, video, reels, articles', placeholderAr: 'صور، فيديو، ريلز، مقالات', maxLength: 500 },
      { name: 'inquiryMethod', label: 'How do customers reach you?', labelAr: 'العملاء بيتواصلوا معاك إزاي؟', type: 'textarea', placeholder: 'DM, WhatsApp, Form, Email, Phone', placeholderAr: 'DM، واتساب، فورم، إيميل، تليفون', required: true, maxLength: 500 },
      { name: 'avgResponseTime', label: 'Response time to inquiries', labelAr: 'بترد على الاستفسارات في', type: 'select', options: [...AVG_RESPONSE_TIME] },
      { name: 'googleBusiness', label: 'Google Business Profile', labelAr: 'عندك Google Business Profile؟', type: 'select', options: [...GOOGLE_BUSINESS] },
    ],
  }} />;
}
