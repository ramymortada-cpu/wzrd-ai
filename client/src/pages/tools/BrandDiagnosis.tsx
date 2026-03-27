import ToolPage from './ToolPage';
import { INDUSTRIES } from '@/lib/industries';
import { MARKET_OPTIONS, YEARS_IN_BUSINESS, TEAM_SIZE, MONTHLY_REVENUE, PREVIOUS_BRANDING } from '@/lib/formOptions';

export default function BrandDiagnosis() {
  return <ToolPage config={{
    id: 'brand_diagnosis', name: 'Brand Diagnosis', nameAr: 'تشخيص البراند', icon: '🔬', cost: 20,
    endpoint: 'tools.brandDiagnosis',
    paywallAfterFreePreview: true,
    description: 'Overall brand health score with top issues identified',
    descriptionAr: 'نتيجة صحة البراند الشاملة مع أهم المشاكل المكتشفة',
    guideUrl: '/guides/brand-health', guideTitle: 'How to Audit Your Brand Health',
    intro: {
      headline: 'Get your brand health score in 30 seconds',
      headlineAr: 'اعرف نتيجة صحة البراند بتاعك في 30 ثانية',
      body: 'This tool analyzes 5 pillars — positioning clarity, messaging consistency, offer logic, visual perception, and customer journey — using Keller\'s CBBE and Kapferer\'s Prism frameworks.',
      bodyAr: 'الأداة دي بتحلل 5 محاور — وضوح التموضع، اتساق الرسائل، منطق العرض، الهوية البصرية، ورحلة العميل.',
      measures: ['Positioning clarity score', 'Messaging consistency', 'Offer structure logic', 'Visual identity cohesion', 'Customer journey friction'],
      measuresAr: ['وضوح التموضع', 'اتساق الرسائل', 'منطق العرض', 'تماسك الهوية البصرية', 'احتكاك رحلة العميل'],
      bestFor: 'Businesses that feel "something is off" but can\'t pinpoint what. If your marketing spend isn\'t converting, start here.',
      bestForAr: 'الأفضل لـ: أصحاب البزنس اللي حاسين إن فيه حاجة غلط بس مش عارفين إيه. لو الماركتينج بتاعك مش بيحوّل — ابدأ من هنا.',
    },
    fields: [
      { name: 'companyName', label: 'Company Name', labelAr: 'اسم الشركة', type: 'text', placeholder: 'e.g. Sahra Café', placeholderAr: 'مثال: كافيه سهرة', required: true },
      { name: 'industry', label: 'Industry', labelAr: 'المجال', type: 'select', options: [...INDUSTRIES], required: true },
      { name: 'market', label: 'Market', labelAr: 'السوق', type: 'select', options: [...MARKET_OPTIONS], required: true },
      { name: 'yearsInBusiness', label: 'Years in business', labelAr: 'عمر الشركة', type: 'select', options: [...YEARS_IN_BUSINESS] },
      { name: 'teamSize', label: 'Team size', labelAr: 'حجم الفريق', type: 'select', options: [...TEAM_SIZE] },
      { name: 'website', label: 'Website', labelAr: 'الموقع الإلكتروني', type: 'text', placeholder: 'https://...' },
      { name: 'socialMedia', label: 'Social media accounts', labelAr: 'حسابات السوشيال ميديا', type: 'text', placeholder: 'Instagram, LinkedIn, etc.', placeholderAr: 'Instagram, LinkedIn, إلخ' },
      { name: 'currentPositioning', label: 'What differentiates you from competitors?', labelAr: 'إيه اللي بيميزك عن المنافسين؟', type: 'textarea', placeholder: "If unsure, write 'not sure'", placeholderAr: 'لو مش عارف قول "مش متأكد"', maxLength: 1000 },
      { name: 'targetAudience', label: 'Who is your ideal customer?', labelAr: 'مين عميلك المثالي؟', type: 'textarea', placeholder: 'Age, level, interests', placeholderAr: 'السن، المستوى، الاهتمامات', required: true, maxLength: 1000 },
      { name: 'monthlyRevenue', label: 'Approx. monthly revenue', labelAr: 'الإيرادات الشهرية التقريبية', type: 'select', options: [...MONTHLY_REVENUE] },
      { name: 'biggestChallenge', label: 'Biggest brand challenge', labelAr: 'أكبر تحدي بتواجهه في البراند بتاعك؟', type: 'textarea', placeholder: "What's the main problem?", placeholderAr: 'إيه أكبر تحدي؟', required: true, maxLength: 1000 },
      { name: 'previousBranding', label: 'Have you done branding before?', labelAr: 'هل عملت branding قبل كده؟', type: 'select', options: [...PREVIOUS_BRANDING] },
    ],
    fieldSections: [
      { title: 'Company basics', titleAr: 'معلومات الشركة الأساسية', fieldNames: ['companyName', 'industry', 'market', 'yearsInBusiness', 'teamSize'] },
      { title: 'Digital presence', titleAr: 'التواجد الرقمي', fieldNames: ['website', 'socialMedia'] },
      { title: 'Positioning & audience', titleAr: 'التموضع والجمهور', fieldNames: ['currentPositioning', 'targetAudience'] },
      { title: 'Current situation', titleAr: 'الوضع الحالي', fieldNames: ['monthlyRevenue', 'biggestChallenge', 'previousBranding'] },
    ],
  }} />;
}
