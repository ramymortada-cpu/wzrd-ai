import ToolPage from './ToolPage';
export default function PresenceAudit() {
  return <ToolPage config={{
    id: 'presence_audit', name: 'Presence Audit', icon: '🌐', cost: 25,
    endpoint: 'tools.presenceAudit',
    description: 'How you appear across social, web, and inquiry channels',
    guideUrl: '/guides/brand-health', guideTitle: 'Brand Health Guide',
    intro: {
      headline: 'What does a stranger see when they Google you?',
      headlineAr: 'الغريب بيشوف إيه لما يبحث عنك؟',
      body: 'This tool audits your digital footprint — Instagram, website, inquiry flow, other channels. It checks if your online presence matches your intended positioning.',
      bodyAr: 'الأداة دي بتراجع بصمتك الرقمية — الإنستجرام، الموقع، طريقة التواصل، القنوات التانية. بتتأكد إن الحضور بتاعك على الإنترنت متوافق مع التموضع بتاعك.',
      measures: ['Channel coverage score', 'Visual consistency', 'Inquiry flow friction', 'Response time indicators', 'Cross-platform coherence'],
      measuresAr: ['تغطية القنوات', 'الاتساق البصري', 'احتكاك التوا صل', 'مؤشرات وقت الرد', 'الاتساق عبر المنصات'],
      bestFor: 'Businesses investing in digital marketing but not seeing results. If you\'re posting but not converting — your presence has gaps.',
      bestForAr: 'الأفضل لـ: بزنس بيستثمر في الديجيتال ماركتينج ومش شايف نتائج. لو بتعمل بوستات ومش بيحوّل — عندك فجوات في الحضور.',
    },
    fields: [
      { name: 'companyName', label: 'Company Name', labelAr: 'اسم الشركة', type: 'text', placeholder: 'e.g. Sahra Café', placeholderAr: 'مثال: كافيه سهرة', required: true },
      { name: 'instagramHandle', label: 'Instagram Handle', labelAr: 'اليوزر بتاع الإنستجرام', type: 'text', placeholder: '@yourhandle', placeholderAr: '@اليوزر بتاعك' },
      { name: 'website', label: 'Website URL', labelAr: 'الموقع الإلكتروني', type: 'text', placeholder: 'https://...' },
      { name: 'otherChannels', label: 'Other Channels', labelAr: 'قنوات تانية', type: 'text', placeholder: 'LinkedIn, TikTok, Facebook...', placeholderAr: 'لينكدإن، تيك توك، فيسبوك...' },
      { name: 'inquiryFlow', label: 'How Do Customers Reach You?', labelAr: 'العملاء بيتواصلوا معاك إزاي؟', type: 'textarea', placeholder: 'DM, WhatsApp, email, phone, website form...', placeholderAr: 'DM، واتساب، إيميل، تليفون، فورم الموقع...', maxLength: 500 },
    ],
  }} />;
}
