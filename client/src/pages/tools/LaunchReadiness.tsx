import ToolPage from './ToolPage';
import { INDUSTRIES } from '@/lib/industries';
import { LAUNCH_TYPE, TARGET_LAUNCH_DATE, HAS_GUIDELINES_SIMPLE, HAS_OFFER_STRUCTURE, HAS_WEBSITE, HAS_CONTENT_PLAN, MARKETING_BUDGET } from '@/lib/formOptions';

export default function LaunchReadiness() {
  return <ToolPage config={{
    id: 'launch_readiness', name: 'Launch Readiness', nameAr: 'جاهزية الإطلاق', icon: '🚀', cost: 300,
    endpoint: 'tools.launchReadiness',
    paywallAfterFreePreview: true,
    freePreviewEndpoint: 'tools.freeLaunchReadinessDiagnosis',
    unlockEndpoint: 'tools.unlockLaunchReadiness',
    description: 'How ready are you to go to market?',
    descriptionAr: 'أد إيه أنت جاهز تنزل السوق؟',
    guideUrl: '/services-info', guideTitle: 'Business Takeoff Package',
    intro: {
      headline: 'Are you actually ready to launch?',
      headlineAr: 'أد إيه أنت فعلاً جاهز تنزل السوق؟',
      body: 'This tool scores your go-to-market readiness across 5 dimensions: brand guidelines, offer structure, content plan, web presence, and launch strategy. Most businesses launch too early — this tells you what to fix first.',
      bodyAr: 'الأداة دي بتقيّم جاهزيتك للنزول في 5 محاور: جوايد البراند، هيكل العرض، خطة المحتوى، الحضور على الإنترنت، واستراتيجية الإطلاق. أغلب البزنس بينزل بوقت — دي بتقولك إيه تصلح الأول.',
      measures: ['Brand guidelines completeness', 'Offer structure readiness', 'Content plan existence', 'Web presence status', 'Launch strategy clarity'],
      measuresAr: ['اكتمال جوايد البراند', 'جاهزية هيكل العرض', 'وجود خطة المحتوى', 'وضع الحضور على الإنترنت', 'وضوح استراتيجية الإطلاق'],
      bestFor: 'New brands about to launch, or existing brands planning a rebrand/relaunch. If you\'re about to spend money on marketing — run this first.',
      bestForAr: 'الأفضل لـ: براند جديد هينزل، أو براند موجود بيخطّط لتجديد. لو هتصرف فلوس على ماركتينج — شغّل الأداة دي الأول.',
    },
    fields: [
      { name: 'companyName', label: 'Company Name', labelAr: 'اسم الشركة', type: 'text', placeholder: 'e.g. Sahra Café', placeholderAr: 'مثال: كافيه سهرة', required: true },
      { name: 'industry', label: 'Industry', labelAr: 'المجال', type: 'select', options: [...INDUSTRIES], required: true },
      { name: 'launchType', label: 'Launch type', labelAr: 'نوع الإطلاق', type: 'select', options: [...LAUNCH_TYPE], required: true },
      { name: 'targetLaunchDate', label: 'Planned launch date', labelAr: 'الإطلاق المخطط', type: 'select', options: [...TARGET_LAUNCH_DATE] },
      { name: 'hasGuidelines', label: 'Brand Guidelines', labelAr: 'عندك Brand Guidelines؟', type: 'select', options: [...HAS_GUIDELINES_SIMPLE] },
      { name: 'hasOfferStructure', label: 'Structured packages & pricing?', labelAr: 'عندك باكدجات وأسعار محددة؟', type: 'select', options: [...HAS_OFFER_STRUCTURE] },
      { name: 'hasWebsite', label: 'Website', labelAr: 'عندك موقع إلكتروني؟', type: 'select', options: [...HAS_WEBSITE] },
      { name: 'hasContentPlan', label: 'Content plan', labelAr: 'عندك خطة محتوى؟', type: 'select', options: [...HAS_CONTENT_PLAN] },
      { name: 'marketingBudget', label: 'Monthly marketing budget', labelAr: 'ميزانية التسويق الشهرية', type: 'select', options: [...MARKETING_BUDGET] },
      { name: 'teamCapacity', label: 'Who will work on the launch?', labelAr: 'مين هيشتغل على الإطلاق؟', type: 'textarea', placeholder: 'e.g. just you / internal team / agency', placeholderAr: 'مثال: أنت لوحدك / فريق داخلي / وكالة', maxLength: 500 },
      { name: 'biggestConcern', label: 'Biggest launch concern', labelAr: 'إيه أكتر حاجة قلقان منها في الإطلاق؟', type: 'textarea', required: true, maxLength: 1000 },
      { name: 'successMetric', label: 'What would make launch a success after 3 months?', labelAr: 'إيه اللي لو حصل بعد ٣ شهور هتعتبر الإطلاق ناجح؟', type: 'textarea', maxLength: 1000 },
    ],
  }} />;
}
