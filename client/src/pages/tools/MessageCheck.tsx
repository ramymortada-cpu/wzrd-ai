import ToolPage from './ToolPage';
import { INDUSTRIES } from '@/lib/industries';
import { TONE_OF_VOICE } from '@/lib/formOptions';

export default function MessageCheck() {
  return <ToolPage config={{
    id: 'message_check', name: 'Message Check', nameAr: 'فحص الرسالة', icon: '💬', cost: 20,
    endpoint: 'tools.messageCheck',
    paywallAfterFreePreview: true,
    freePreviewEndpoint: 'tools.freeMessageCheckDiagnosis',
    unlockEndpoint: 'tools.unlockMessageCheck',
    description: 'Is your messaging consistent, clear, and differentiated?',
    descriptionAr: 'هل رسالتك متسقة وواضحة ومميزة؟',
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
      { name: 'industry', label: 'Industry', labelAr: 'المجال', type: 'select', options: [...INDUSTRIES], required: true },
      { name: 'tagline', label: 'Tagline / Slogan', labelAr: 'الـ Tagline أو الشعار بتاعك', type: 'text', placeholder: 'e.g. "Your daily escape"' },
      { name: 'elevatorPitch', label: 'If someone asked "What do you do?" — 30 sec answer', labelAr: 'لو حد سألك "بتعملوا إيه؟" هتقوله إيه في ٣٠ ثانية؟', type: 'textarea', required: true, maxLength: 1000 },
      { name: 'websiteHeadline', label: 'First headline on homepage', labelAr: 'أول جملة على الـ homepage بتاعك', type: 'text', placeholder: 'Main headline' },
      { name: 'instagramBio', label: 'Instagram bio', labelAr: 'الـ bio بتاع Instagram', type: 'text', placeholder: 'Copy your bio' },
      { name: 'linkedinAbout', label: 'LinkedIn / Facebook About section', labelAr: 'الـ About section على LinkedIn أو Facebook', type: 'textarea', maxLength: 1000 },
      { name: 'keyDifferentiator', label: 'What makes you different?', labelAr: 'إيه اللي بيخليك مختلف عن أي حد تاني؟', type: 'textarea', maxLength: 1000 },
      { name: 'toneOfVoice', label: 'Your tone of voice', labelAr: 'نبرة الصوت بتاعتك', type: 'select', options: [...TONE_OF_VOICE] },
      { name: 'customerQuote', label: 'A quote from a customer about you', labelAr: 'جملة عميل قالها عنك', type: 'textarea', placeholder: 'If you have one', placeholderAr: 'لو عندك', maxLength: 500 },
    ],
  }} />;
}
