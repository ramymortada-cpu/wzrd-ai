import ToolPage from './ToolPage';
export default function OfferCheck() {
  return <ToolPage config={{
    id: 'offer_check', name: 'Offer Logic Check', icon: '📦', cost: 25,
    endpoint: 'tools.offerCheck',
    description: 'Is your offer structure clear and your pricing logical?',
    guideUrl: '/guides/offer-logic', guideTitle: 'Offer Logic 101',
    intro: {
      headline: 'Find out why smart products fail to sell',
      body: 'Most businesses have a good product but a confusing offer. This tool checks your ICP clarity, package structure, pricing logic (anchoring, decoy effects), and proof stack.',
      measures: ['ICP definition clarity', 'Package differentiation', 'Pricing logic & anchoring', 'Objection handling gaps', 'Proof stack strength'],
      bestFor: 'Businesses with a great product but low conversion. If customers say "I\'ll think about it" — your offer logic needs work.',
    },
    fields: [
      { name: 'companyName', label: 'Company Name', type: 'text', placeholder: 'e.g. Sahra Café', required: true },
      { name: 'packages', label: 'Your Current Packages/Services', type: 'textarea', placeholder: 'Describe your packages, pricing tiers, what each includes...', required: true, maxLength: 2000 },
      { name: 'pricing', label: 'Pricing Approach', type: 'text', placeholder: 'e.g. 3 tiers: 500, 1000, 2000 EGP' },
      { name: 'targetAudience', label: 'Target Audience', type: 'text', placeholder: 'Who are you selling to?' },
    ],
  }} />;
}
