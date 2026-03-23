import ToolPage from './ToolPage';
import { INDUSTRIES } from '@/lib/industries';
import { HAS_LOGO, HAS_GUIDELINES_FULL } from '@/lib/formOptions';

export default function IdentitySnapshot() {
  return <ToolPage config={{
    id: 'identity_snapshot', name: 'Identity Snapshot', nameAr: 'لقطة الهوية', icon: '🪞', cost: 20,
    endpoint: 'tools.identitySnapshot',
    description: 'Does your brand personality match your audience?',
    descriptionAr: 'هل شخصية البراند بتاعك متوافقة مع جمهورك؟',
    guideUrl: '/guides/brand-identity', guideTitle: 'What Is Brand Identity',
    intro: {
      headline: 'Is your brand personality attracting the right people?',
      headlineAr: 'شخصية البراند بتاعتك بتبتّع الناس الصح؟',
      body: 'Using Kapferer\'s Brand Identity Prism, this tool checks if your brand\'s personality, culture, and self-image align with your target audience\'s expectations and values.',
      bodyAr: 'باستخدام منشور كابفيرر للهوية، الأداة بتفحص لو شخصية البراند، الثقافة، وصورته الذاتية متوافقة مع توقعات وقيم جمهورك.',
      measures: ['Personality-audience fit', 'Brand archetype clarity', 'Cultural alignment', 'Visual-verbal consistency', 'Competitive differentiation'],
      measuresAr: ['ملاءمة الشخصية للجمهور', 'وضوح نمط البراند', 'الاتساق الثقافي', 'الاتساق البصري واللفظي', 'التميز التنافسي'],
      bestFor: 'Businesses that attract the wrong type of customer, or whose brand "feels cheaper than the product." If people love your product but your brand feels off — run this.',
      bestForAr: 'الأفضل لـ: بزنس بيجذب نوع غلط من العملاء، أو البراند "بيبان أرخص من المنتج". لو الناس بحب المنتج بس البراند بيبان غريب — شغّل هنا.',
    },
    fields: [
      { name: 'companyName', label: 'Company Name', labelAr: 'اسم الشركة', type: 'text', placeholder: 'e.g. Sahra Café', placeholderAr: 'مثال: كافيه سهرة', required: true },
      { name: 'industry', label: 'Industry', labelAr: 'المجال', type: 'select', options: [...INDUSTRIES], required: true },
      { name: 'brandPersonality', label: 'If your brand were a person, their personality?', labelAr: 'لو البراند بتاعك شخص، هيكون شخصيته إيه؟', type: 'textarea', placeholder: 'e.g. serious, playful, luxury, simple', placeholderAr: 'مثلاً: جاد، مرح، فاخر، بسيط', required: true, maxLength: 1000 },
      { name: 'targetAudience', label: 'Ideal customer description', labelAr: 'وصف عميلك المثالي', type: 'textarea', placeholder: 'Age, interests, level', placeholderAr: 'السن، الاهتمامات، المستوى', required: true, maxLength: 1000 },
      { name: 'brandColors', label: 'Main brand colors', labelAr: 'الألوان الرئيسية للبراند', type: 'text', placeholder: 'If you have them' },
      { name: 'hasLogo', label: 'Do you have a logo?', labelAr: 'عندك لوجو؟', type: 'select', options: [...HAS_LOGO] },
      { name: 'hasGuidelines', label: 'Brand Guidelines', labelAr: 'عندك Brand Guidelines؟', type: 'select', options: [...HAS_GUIDELINES_FULL] },
      { name: 'competitors', label: 'Name 3 competitors and what differentiates them', labelAr: 'اذكر ٣ منافسين وإيه اللي بيميزهم', type: 'textarea', maxLength: 1000 },
      { name: 'desiredPerception', label: 'What do you want people to feel when they see your brand?', labelAr: 'عايز الناس يحسوا بإيه لما يشوفوا البراند بتاعك؟', type: 'textarea', required: true, maxLength: 1000 },
      { name: 'currentGap', label: 'Gap between desired and actual?', labelAr: 'إيه الفجوة بين اللي عايزه واللي حاصل فعلاً؟', type: 'textarea', maxLength: 1000 },
    ],
  }} />;
}
