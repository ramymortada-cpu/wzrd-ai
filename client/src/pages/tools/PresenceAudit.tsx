import ToolPage from './ToolPage';
export default function PresenceAudit() {
  return <ToolPage config={{
    id: 'presence_audit', name: 'Presence Audit', icon: '🌐', cost: 25,
    endpoint: 'tools.presenceAudit',
    description: 'How you appear across social, web, and inquiry channels',
    guideUrl: '/guides/brand-health', guideTitle: 'Brand Health Guide',
    intro: {
      headline: 'What does a stranger see when they Google you?',
      body: 'This tool audits your digital footprint — Instagram, website, inquiry flow, other channels. It checks if your online presence matches your intended positioning.',
      measures: ['Channel coverage score', 'Visual consistency', 'Inquiry flow friction', 'Response time indicators', 'Cross-platform coherence'],
      bestFor: 'Businesses investing in digital marketing but not seeing results. If you\'re posting but not converting — your presence has gaps.',
    },
    fields: [
      { name: 'companyName', label: 'Company Name', type: 'text', placeholder: 'e.g. Sahra Café', required: true },
      { name: 'instagramHandle', label: 'Instagram Handle', type: 'text', placeholder: '@yourhandle' },
      { name: 'website', label: 'Website URL', type: 'text', placeholder: 'https://...' },
      { name: 'otherChannels', label: 'Other Channels', type: 'text', placeholder: 'LinkedIn, TikTok, Facebook...' },
      { name: 'inquiryFlow', label: 'How Do Customers Reach You?', type: 'textarea', placeholder: 'DM, WhatsApp, email, phone, website form...', maxLength: 500 },
    ],
  }} />;
}
