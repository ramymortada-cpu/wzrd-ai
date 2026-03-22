import ToolPage from './ToolPage';
export default function BrandDiagnosis() {
  return <ToolPage config={{
    id: 'brand_diagnosis', name: 'Brand Diagnosis', icon: '🔬', cost: 20,
    endpoint: 'tools.brandDiagnosis',
    description: 'Overall brand health score with top issues identified',
    guideUrl: '/guides/brand-health', guideTitle: 'How to Audit Your Brand Health',
    intro: {
      headline: 'Get your brand health score in 30 seconds',
      body: 'This tool analyzes 5 pillars — positioning clarity, messaging consistency, offer logic, visual perception, and customer journey — using Keller\'s CBBE and Kapferer\'s Prism frameworks.',
      measures: ['Positioning clarity score', 'Messaging consistency', 'Offer structure logic', 'Visual identity cohesion', 'Customer journey friction'],
      bestFor: 'Businesses that feel "something is off" but can\'t pinpoint what. If your marketing spend isn\'t converting, start here.',
    },
    fields: [
      { name: 'companyName', label: 'Company Name', type: 'text', placeholder: 'e.g. Sahra Café', required: true },
      { name: 'industry', label: 'Industry', type: 'select', options: [
        { value: 'f&b', label: 'Food & Beverage' }, { value: 'tech', label: 'Technology' },
        { value: 'healthcare', label: 'Healthcare' }, { value: 'retail', label: 'Retail' },
        { value: 'realestate', label: 'Real Estate' }, { value: 'education', label: 'Education' },
        { value: 'beauty', label: 'Beauty' }, { value: 'other', label: 'Other' },
      ]},
      { name: 'market', label: 'Market', type: 'select', options: [
        { value: 'egypt', label: 'Egypt' }, { value: 'ksa', label: 'Saudi Arabia' },
        { value: 'uae', label: 'UAE' }, { value: 'other', label: 'Other' },
      ]},
      { name: 'website', label: 'Website (optional)', type: 'text', placeholder: 'https://...' },
      { name: 'challenge', label: 'Biggest Challenge', type: 'textarea', placeholder: 'What\'s the main problem you\'re facing?', maxLength: 1000 },
    ],
  }} />;
}
