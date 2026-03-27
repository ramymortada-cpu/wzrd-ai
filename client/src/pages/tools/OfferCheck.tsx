import ToolPage from './ToolPage';
import { INDUSTRIES } from '@/lib/industries';
import { NUMBER_OF_PACKAGES, PRICING_MODEL } from '@/lib/formOptions';

export default function OfferCheck() {
  return <ToolPage config={{
    id: 'offer_check', name: 'Offer Logic Check', nameAr: 'فحص منطق العرض', icon: '📦', cost: 25,
    endpoint: 'tools.offerCheck',
    paywallAfterFreePreview: true,
    freePreviewEndpoint: 'tools.freeOfferCheckDiagnosis',
    unlockEndpoint: 'tools.unlockOfferCheck',
    description: 'Is your offer structure clear and your pricing logical?',
    descriptionAr: 'هل عرضك واضح وتسعيرك منطقي؟',
    guideUrl: '/guides/offer-logic', guideTitle: 'Offer Logic 101',
    intro: {
      headline: 'Find out why smart products fail to sell',
      headlineAr: 'اعرف ليه المنتجات الذكية مش بتبيع',
      body: 'Most businesses have a good product but a confusing offer. This tool checks your ICP clarity, package structure, pricing logic (anchoring, decoy effects), and proof stack.',
      bodyAr: 'أغلب البزنس عنده منتج كويس وعرض مش واضح. الأداة دي بتفحص وضوح العميل المثالي، هيكل الباقات، منطق التسعير، ومعرفة التعامل مع الاعتراضات.',
      measures: ['ICP definition clarity', 'Package differentiation', 'Pricing logic & anchoring', 'Objection handling gaps', 'Proof stack strength'],
      measuresAr: ['وضوح تعريف العميل المثالي', 'تميز الباقات', 'منطق التسعير', 'فجوات التعامل مع الاعتراضات', 'قوة الإثباتات'],
      bestFor: 'Businesses with a great product but low conversion. If customers say "I\'ll think about it" — your offer logic needs work.',
      bestForAr: 'الأفضل لـ: بزنس عنده منتج كويس بس المبيعات ضعيفة. لو العملاء بيقولوا "هفكّر" — العرض بتاعك محتاج شغل.',
    },
    fields: [
      { name: 'companyName', label: 'Company Name', labelAr: 'اسم الشركة', type: 'text', placeholder: 'e.g. Sahra Café', placeholderAr: 'مثال: كافيه سهرة', required: true },
      { name: 'industry', label: 'Industry', labelAr: 'المجال', type: 'select', options: [...INDUSTRIES], required: true },
      { name: 'currentPackages', label: 'Describe your packages/services in detail', labelAr: 'اوصف باكدجاتك/خدماتك الحالية بالتفصيل', type: 'textarea', placeholder: 'Name, what\'s included, price per package', placeholderAr: 'الاسم، إيه المشمول، السعر', required: true, maxLength: 2000 },
      { name: 'numberOfPackages', label: 'How many packages do you have?', labelAr: 'كام باكدج عندك؟', type: 'select', options: [...NUMBER_OF_PACKAGES] },
      { name: 'pricingModel', label: 'Pricing model', labelAr: 'نوع التسعير', type: 'select', options: [...PRICING_MODEL] },
      { name: 'cheapestPrice', label: 'Lowest price', labelAr: 'أقل سعر عندك', type: 'text', placeholder: 'In local currency', placeholderAr: 'بالعملة المحلية' },
      { name: 'highestPrice', label: 'Highest price', labelAr: 'أعلى سعر عندك', type: 'text', placeholder: 'In local currency', placeholderAr: 'بالعملة المحلية' },
      { name: 'targetAudience', label: 'Who do you sell to?', labelAr: 'مين بتبيع لهم؟', type: 'textarea', placeholder: 'Describe their financial level', placeholderAr: 'إيه مستواهم المادي؟', required: true, maxLength: 1000 },
      { name: 'commonObjections', label: 'Most common objections from customers', labelAr: 'أكتر اعتراض بتسمعه من العملاء', type: 'textarea', placeholder: 'e.g. too expensive, don\'t see the difference', placeholderAr: 'مثلاً: غالي، مش فاهم الفرق', maxLength: 1000 },
      { name: 'competitorPricing', label: 'How do competitor prices compare to yours?', labelAr: 'أسعار المنافسين عاملة إزاي مقارنة بيك؟', type: 'textarea', placeholder: 'Describe', placeholderAr: 'وصف', maxLength: 1000 },
    ],
  }} />;
}
