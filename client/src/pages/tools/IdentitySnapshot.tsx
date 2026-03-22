import ToolPage from './ToolPage';
export default function IdentitySnapshot() {
  return <ToolPage config={{
    id: 'identity_snapshot', name: 'Identity Snapshot', icon: '🪞', cost: 20,
    endpoint: 'tools.identitySnapshot',
    description: 'Does your brand personality match your audience?',
    guideUrl: '/guides/brand-identity', guideTitle: 'What Is Brand Identity',
    intro: {
      headline: 'Is your brand personality attracting the right people?',
      body: 'Using Kapferer\'s Brand Identity Prism, this tool checks if your brand\'s personality, culture, and self-image align with your target audience\'s expectations and values.',
      measures: ['Personality-audience fit', 'Brand archetype clarity', 'Cultural alignment', 'Visual-verbal consistency', 'Competitive differentiation'],
      bestFor: 'Businesses that attract the wrong type of customer, or whose brand "feels cheaper than the product." If people love your product but your brand feels off — run this.',
    },
    fields: [
      { name: 'companyName', label: 'Company Name', type: 'text', placeholder: 'e.g. Sahra Café', required: true },
      { name: 'brandDescription', label: 'Describe Your Brand', type: 'textarea', placeholder: 'How would you describe your brand in 2-3 sentences? What personality does it have?', required: true, maxLength: 1000 },
      { name: 'targetAudience', label: 'Target Audience', type: 'text', placeholder: 'Who are your ideal customers?' },
      { name: 'competitors', label: 'Main Competitors', type: 'text', placeholder: 'Name 2-3 competitors' },
    ],
  }} />;
}
