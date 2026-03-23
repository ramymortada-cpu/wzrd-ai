import ToolPage from './ToolPage';
export default function MessageCheck() {
  return <ToolPage config={{
    id: 'message_check', name: 'Message Check', icon: '💬', cost: 20,
    endpoint: 'tools.messageCheck',
    description: 'Is your messaging consistent, clear, and differentiated?',
    guideUrl: '/guides/brand-identity', guideTitle: 'What Is Brand Identity',
    intro: {
      headline: 'Are you saying the same thing everywhere?',
      headlineAr: 'بتقول نفس الكلام في كل مكان؟',
      body: 'This tool compares your messaging across touchpoints — tagline, social bio, website headline, key message. Inconsistency confuses customers and kills trust.',
      bodyAr: 'الأداة دي بتقارن الرسالة بتاعتك عبر القنوات — الشعار، البايو، عنوان الموقع، الرسالة الأساسية. الاختلاف بيخلي العملاء حاسين بالغموض.',
      measures: ['Cross-channel consistency', 'Message clarity score', 'Differentiation strength', 'Tone alignment', 'CTA effectiveness'],
      measuresAr: ['اتساق القنوات', 'وضوح الرسالة', 'قوة التميز', 'اتساق النبرة', 'فعالية النداء للتحرك'],
      bestFor: 'Businesses that have grown organically and never unified their messaging. If your Instagram bio says something different from your website — run this.',
      bestForAr: 'الأفضل لـ: بزنس كبر بسرعة ومتحدّثش الرسالة. لو البايو بتاع الإنستجرام مختلف عن الموقع — شغّل الأداة دي.',
    },
    fields: [
      { name: 'companyName', label: 'Company Name', labelAr: 'اسم الشركة', type: 'text', placeholder: 'e.g. Sahra Café', placeholderAr: 'مثال: كافيه سهرة', required: true },
      { name: 'tagline', label: 'Tagline / Slogan', labelAr: 'الشعار', type: 'text', placeholder: 'e.g. "Your daily escape"', placeholderAr: 'مثال: "هروبك اليومي"' },
      { name: 'keyMessage', label: 'Key Message', labelAr: 'الرسالة الأساسية', type: 'textarea', placeholder: 'What do you tell customers about who you are?', placeholderAr: 'بتقول للعملاء إيه عن نفسك؟', maxLength: 1000 },
      { name: 'socialBio', label: 'Social Media Bio', labelAr: 'البايو بتاع السوشيال ميديا', type: 'text', placeholder: 'Copy your Instagram/LinkedIn bio here', placeholderAr: 'انسخ البايو بتاع الإنستجرام أو اللينكدإن' },
      { name: 'websiteHeadline', label: 'Website Headline', labelAr: 'عنوان الصفحة الرئيسية', type: 'text', placeholder: 'The main headline on your homepage', placeholderAr: 'العنوان الرئيسي على الصفحة الأولى' },
    ],
  }} />;
}
