import ToolPage from './ToolPage';
export default function BrandDiagnosis() {
  return <ToolPage config={{
    id: 'brand_diagnosis', name: 'Brand Diagnosis', nameAr: 'تشخيص البراند', icon: '🔬', cost: 20,
    endpoint: 'tools.brandDiagnosis',
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
      { name: 'industry', label: 'Industry', labelAr: 'المجال', type: 'select', options: [
        { value: 'f&b', label: 'Food & Beverage', labelAr: 'مأكولات ومشروبات' }, { value: 'tech', label: 'Technology', labelAr: 'تكنولوجيا' },
        { value: 'healthcare', label: 'Healthcare', labelAr: 'رعاية صحية' }, { value: 'retail', label: 'Retail', labelAr: 'تجزئة' },
        { value: 'realestate', label: 'Real Estate', labelAr: 'عقارات' }, { value: 'education', label: 'Education', labelAr: 'تعليم' },
        { value: 'beauty', label: 'Beauty', labelAr: 'جمال' }, { value: 'other', label: 'Other', labelAr: 'آخر' },
      ]},
      { name: 'market', label: 'Market', labelAr: 'السوق', type: 'select', options: [
        { value: 'egypt', label: 'Egypt', labelAr: 'مصر' }, { value: 'ksa', label: 'Saudi Arabia', labelAr: 'السعودية' },
        { value: 'uae', label: 'UAE', labelAr: 'الإمارات' }, { value: 'other', label: 'Other', labelAr: 'آخر' },
      ]},
      { name: 'website', label: 'Website (optional)', labelAr: 'الموقع الإلكتروني (اختياري)', type: 'text', placeholder: 'https://...' },
      { name: 'challenge', label: 'Biggest Challenge', labelAr: 'أكبر تحدي بتواجهه', type: 'textarea', placeholder: 'What\'s the main problem you\'re facing?', placeholderAr: 'إيه أكبر مشكلة بتواجهك؟', maxLength: 1000 },
    ],
  }} />;
}
