import ToolPage from './ToolPage';
export default function IdentitySnapshot() {
  return <ToolPage config={{
    id: 'identity_snapshot', name: 'Identity Snapshot', icon: '🪞', cost: 20,
    endpoint: 'tools.identitySnapshot',
    description: 'Does your brand personality match your audience?',
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
      { name: 'brandDescription', label: 'Describe Your Brand', labelAr: 'وصف البراند بتاعك', type: 'textarea', placeholder: 'How would you describe your brand in 2-3 sentences? What personality does it have?', placeholderAr: 'وصّف البراند في 2-3 جمل. إيه الشخصية بتاعته؟', required: true, maxLength: 1000 },
      { name: 'targetAudience', label: 'Target Audience', labelAr: 'الجمهور المستهدف', type: 'text', placeholder: 'Who are your ideal customers?', placeholderAr: 'مين العملاء المثاليين بتوعك؟' },
      { name: 'competitors', label: 'Main Competitors', labelAr: 'أهم المنافسين', type: 'text', placeholder: 'Name 2-3 competitors', placeholderAr: 'سمّي 2 أو 3 منافسين' },
    ],
  }} />;
}
