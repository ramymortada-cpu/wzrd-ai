import ToolPage from './ToolPage';
export default function MessageCheck() {
  return <ToolPage config={{
    id: 'message_check', name: 'Message Check', icon: '💬', cost: 20,
    endpoint: 'tools.messageCheck',
    description: 'Is your messaging consistent, clear, and differentiated?',
    guideUrl: '/guides/brand-identity', guideTitle: 'What Is Brand Identity',
    intro: {
      headline: 'Are you saying the same thing everywhere?',
      body: 'This tool compares your messaging across touchpoints — tagline, social bio, website headline, key message. Inconsistency confuses customers and kills trust.',
      measures: ['Cross-channel consistency', 'Message clarity score', 'Differentiation strength', 'Tone alignment', 'CTA effectiveness'],
      bestFor: 'Businesses that have grown organically and never unified their messaging. If your Instagram bio says something different from your website — run this.',
    },
    fields: [
      { name: 'companyName', label: 'Company Name', type: 'text', placeholder: 'e.g. Sahra Café', required: true },
      { name: 'tagline', label: 'Tagline / Slogan', type: 'text', placeholder: 'e.g. "Your daily escape"' },
      { name: 'keyMessage', label: 'Key Message', type: 'textarea', placeholder: 'What do you tell customers about who you are?', maxLength: 1000 },
      { name: 'socialBio', label: 'Social Media Bio', type: 'text', placeholder: 'Copy your Instagram/LinkedIn bio here' },
      { name: 'websiteHeadline', label: 'Website Headline', type: 'text', placeholder: 'The main headline on your homepage' },
    ],
  }} />;
}
