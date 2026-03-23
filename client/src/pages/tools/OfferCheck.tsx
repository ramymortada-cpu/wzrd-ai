import ToolPage from './ToolPage';
export default function OfferCheck() {
  return <ToolPage config={{
    id: 'offer_check', name: 'Offer Logic Check', nameAr: 'فحص منطق العرض', icon: '📦', cost: 25,
    endpoint: 'tools.offerCheck',
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
      { name: 'packages', label: 'Your Current Packages/Services', labelAr: 'الباقات أو الخدمات بتاعتك', type: 'textarea', placeholder: 'Describe your packages, pricing tiers, what each includes...', placeholderAr: 'وصف الباقات، مستويات التسعير، إيه اللي مشمول في كل واحدة...', required: true, maxLength: 2000 },
      { name: 'pricing', label: 'Pricing Approach', labelAr: 'أسلوب التسعير', type: 'text', placeholder: 'e.g. 3 tiers: 500, 1000, 2000 EGP', placeholderAr: 'مثال: 3 مستويات: 500، 1000، 2000 ج.م' },
      { name: 'targetAudience', label: 'Target Audience', labelAr: 'الجمهور المستهدف', type: 'text', placeholder: 'Who are you selling to?', placeholderAr: 'بتبيع لمين؟' },
    ],
  }} />;
}
