import ToolPage from './ToolPage';
export default function LaunchReadiness() {
  return <ToolPage config={{
    id: 'launch_readiness', name: 'Launch Readiness', icon: '🚀', cost: 30,
    endpoint: 'tools.launchReadiness',
    description: 'How ready are you to go to market?',
    guideUrl: '/services-info', guideTitle: 'Business Takeoff Package',
    intro: {
      headline: 'Are you actually ready to launch?',
      body: 'This tool scores your go-to-market readiness across 5 dimensions: brand guidelines, offer structure, content plan, web presence, and launch strategy. Most businesses launch too early — this tells you what to fix first.',
      measures: ['Brand guidelines completeness', 'Offer structure readiness', 'Content plan existence', 'Web presence status', 'Launch strategy clarity'],
      bestFor: 'New brands about to launch, or existing brands planning a rebrand/relaunch. If you\'re about to spend money on marketing — run this first.',
    },
    fields: [
      { name: 'companyName', label: 'Company Name', type: 'text', placeholder: 'e.g. Sahra Café', required: true },
      { name: 'hasGuidelines', label: 'Brand Guidelines', type: 'checkbox', placeholder: 'I have brand guidelines (logo, colors, fonts)' },
      { name: 'hasOfferStructure', label: 'Offer Structure', type: 'checkbox', placeholder: 'I have structured packages/pricing' },
      { name: 'hasContentPlan', label: 'Content Plan', type: 'checkbox', placeholder: 'I have a content/marketing plan' },
      { name: 'hasWebsite', label: 'Website', type: 'checkbox', placeholder: 'I have a live website' },
      { name: 'launchGoal', label: 'Launch Goal', type: 'textarea', placeholder: 'What are you trying to launch? What does success look like?', maxLength: 500 },
    ],
  }} />;
}
