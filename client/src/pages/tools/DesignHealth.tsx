import ToolPage from './ToolPage';
import { INDUSTRIES } from '@/lib/industries';

export default function DesignHealth() {
  return (
    <ToolPage
      config={{
        id: 'design_health',
        name: 'Design Health Check',
        nameAr: 'فحص صحة التصميم',
        icon: '🎨',
        cost: 300,
        endpoint: 'tools.freeDesignHealthDiagnosis',
        paywallAfterFreePreview: true,
        freePreviewEndpoint: 'tools.freeDesignHealthDiagnosis',
        unlockEndpoint: 'tools.unlockDesignHealth',
        description: 'Visual audit of your website using AI vision',
        descriptionAr: 'فحص بصري لموقعك باستخدام الذكاء الاصطناعي',
        guideUrl: '/guides/brand-identity',
        guideTitle: 'Brand Identity Guide',
        intro: {
          headline: 'Is your website design helping or hurting your brand?',
          headlineAr: 'هل تصميم موقعك بيفيد براندك ولا بيضره؟',
          body: "This tool captures a screenshot of your website and uses advanced AI vision to evaluate Color Harmony, Visual Hierarchy, and Whitespace & Clutter.",
          bodyAr:
            'الأداة دي بتاخد صورة لموقعك وبتستخدم الذكاء الاصطناعي البصري عشان تقيّم تناسق الألوان، التسلسل الهرمي البصري، والمساحات الفاضية والزحمة.',
          measures: ['Color Harmony', 'Visual Hierarchy', 'Whitespace & Clutter'],
          measuresAr: ['تناسق الألوان', 'التسلسل الهرمي البصري', 'المساحات الفاضية والزحمة'],
          bestFor: 'Anyone with an active website who wants an objective, instant design critique.',
          bestForAr: 'الأفضل لـ: أي حد عنده موقع شغال وعايز تقييم تصميم موضوعي وفوري.',
        },
        fields: [
          {
            name: 'companyName',
            label: 'Company Name',
            labelAr: 'اسم الشركة',
            type: 'text',
            placeholder: 'e.g. Sahra Café',
            placeholderAr: 'مثال: كافيه سهرة',
            required: true,
          },
          {
            name: 'industry',
            label: 'Industry',
            labelAr: 'المجال',
            type: 'select',
            options: [...INDUSTRIES],
            required: true,
          },
          {
            name: 'website',
            label: 'Website URL',
            labelAr: 'رابط الموقع',
            type: 'text',
            placeholder: 'https://...',
            required: true,
          },
        ],
      }}
    />
  );
}
