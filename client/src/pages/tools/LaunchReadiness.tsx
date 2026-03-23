import ToolPage from './ToolPage';
export default function LaunchReadiness() {
  return <ToolPage config={{
    id: 'launch_readiness', name: 'Launch Readiness', icon: '🚀', cost: 30,
    endpoint: 'tools.launchReadiness',
    description: 'How ready are you to go to market?',
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
      { name: 'hasGuidelines', label: 'Brand Guidelines', labelAr: 'جوايد البراند', type: 'checkbox', placeholder: 'I have brand guidelines (logo, colors, fonts)', placeholderAr: 'عندي جوايد براند (لوجو، ألوان، فونتات)' },
      { name: 'hasOfferStructure', label: 'Offer Structure', labelAr: 'هيكل العرض', type: 'checkbox', placeholder: 'I have structured packages/pricing', placeholderAr: 'عندي باقات وتسعير منظم' },
      { name: 'hasContentPlan', label: 'Content Plan', labelAr: 'خطة المحتوى', type: 'checkbox', placeholder: 'I have a content/marketing plan', placeholderAr: 'عندي خطة محتوى/ماركتينج' },
      { name: 'hasWebsite', label: 'Website', labelAr: 'موقع إلكتروني', type: 'checkbox', placeholder: 'I have a live website', placeholderAr: 'عندي موقع شغال' },
      { name: 'launchGoal', label: 'Launch Goal', type: 'textarea', labelAr: 'هدف الإطلاق', placeholder: 'What are you trying to launch? What does success look like?', placeholderAr: 'بتحاول تنزل إيه؟ إيه هي شكل النجاح؟', maxLength: 500 },
    ],
  }} />;
}
