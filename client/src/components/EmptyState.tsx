import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
  Users, FolderOpen, FileText, DollarSign, MessageSquare,
  Brain, Search, BookOpen, GitBranch, Heart, TrendingUp,
  Inbox, Plus, ArrowRight,
} from 'lucide-react';

interface EmptyStateProps {
  /** Which page/entity is empty */
  type: 'clients' | 'projects' | 'deliverables' | 'payments' | 'notes' |
        'conversations' | 'proposals' | 'research' | 'knowledge' |
        'pipeline' | 'brand' | 'leads' | 'analytics' | 'general';
  /** Optional custom title override */
  title?: string;
  /** Optional custom description override */
  description?: string;
  /** CTA button text */
  actionLabel?: string;
  /** CTA button click handler */
  onAction?: () => void;
  /** Optional secondary action */
  secondaryLabel?: string;
  onSecondaryAction?: () => void;
  /** Custom icon */
  icon?: ReactNode;
}

const EMPTY_STATE_CONFIG: Record<string, {
  icon: ReactNode;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  actionLabel: string;
  actionLabelAr: string;
}> = {
  clients: {
    icon: <Users className="w-12 h-12 text-muted-foreground/50" />,
    title: 'No clients yet',
    titleAr: 'لا يوجد عملاء بعد',
    description: 'Start by adding your first client. Every great project begins with a great relationship.',
    descriptionAr: 'ابدأ بإضافة أول عميل. كل مشروع عظيم يبدأ بعلاقة عظيمة.',
    actionLabel: 'Add First Client',
    actionLabelAr: 'أضف أول عميل',
  },
  projects: {
    icon: <FolderOpen className="w-12 h-12 text-muted-foreground/50" />,
    title: 'No projects yet',
    titleAr: 'لا يوجد مشاريع بعد',
    description: 'Create a project to start the 4D Framework journey — Diagnose, Design, Deploy, Optimize.',
    descriptionAr: 'أنشئ مشروعاً لبدء رحلة إطار العمل 4D — تشخيص، تصميم، تنفيذ، تحسين.',
    actionLabel: 'Create Project',
    actionLabelAr: 'أنشئ مشروع',
  },
  deliverables: {
    icon: <FileText className="w-12 h-12 text-muted-foreground/50" />,
    title: 'No deliverables yet',
    titleAr: 'لا يوجد مخرجات بعد',
    description: 'Deliverables will appear here once you create a project. Use AI to generate them automatically.',
    descriptionAr: 'ستظهر المخرجات هنا بمجرد إنشاء مشروع. استخدم الذكاء الاصطناعي لإنشائها تلقائياً.',
    actionLabel: 'Go to Projects',
    actionLabelAr: 'اذهب للمشاريع',
  },
  payments: {
    icon: <DollarSign className="w-12 h-12 text-muted-foreground/50" />,
    title: 'No payments recorded',
    titleAr: 'لا يوجد مدفوعات مسجلة',
    description: 'Track payments and invoices for your projects here.',
    descriptionAr: 'تتبع المدفوعات والفواتير لمشاريعك هنا.',
    actionLabel: 'Add Payment',
    actionLabelAr: 'أضف دفعة',
  },
  notes: {
    icon: <MessageSquare className="w-12 h-12 text-muted-foreground/50" />,
    title: 'No notes yet',
    titleAr: 'لا يوجد ملاحظات بعد',
    description: 'Capture diagnostic findings, strategic decisions, and project insights.',
    descriptionAr: 'سجّل نتائج التشخيص والقرارات الاستراتيجية والرؤى.',
    actionLabel: 'Add Note',
    actionLabelAr: 'أضف ملاحظة',
  },
  conversations: {
    icon: <Brain className="w-12 h-12 text-muted-foreground/50" />,
    title: 'No AI conversations',
    titleAr: 'لا يوجد محادثات ذكاء اصطناعي',
    description: 'Start a conversation with Wzrd AI to get strategic brand insights.',
    descriptionAr: 'ابدأ محادثة مع Wzrd AI للحصول على رؤى استراتيجية للعلامة التجارية.',
    actionLabel: 'Start Chat',
    actionLabelAr: 'ابدأ محادثة',
  },
  proposals: {
    icon: <FileText className="w-12 h-12 text-muted-foreground/50" />,
    title: 'No proposals yet',
    titleAr: 'لا يوجد عروض بعد',
    description: 'Generate professional proposals with AI and send them to clients.',
    descriptionAr: 'أنشئ عروضاً احترافية بالذكاء الاصطناعي وأرسلها للعملاء.',
    actionLabel: 'Create Proposal',
    actionLabelAr: 'أنشئ عرض',
  },
  research: {
    icon: <Search className="w-12 h-12 text-muted-foreground/50" />,
    title: 'No research reports',
    titleAr: 'لا يوجد تقارير بحثية',
    description: 'Run market research to build deep understanding of your clients\' industries.',
    descriptionAr: 'قم بإجراء بحوث السوق لبناء فهم عميق لصناعات عملائك.',
    actionLabel: 'Start Research',
    actionLabelAr: 'ابدأ البحث',
  },
  knowledge: {
    icon: <BookOpen className="w-12 h-12 text-muted-foreground/50" />,
    title: 'Knowledge base is empty',
    titleAr: 'قاعدة المعرفة فارغة',
    description: 'Add case studies, frameworks, and insights to make AI smarter.',
    descriptionAr: 'أضف دراسات حالة وأطر عمل ورؤى لجعل الذكاء الاصطناعي أذكى.',
    actionLabel: 'Add Knowledge',
    actionLabelAr: 'أضف معرفة',
  },
  pipeline: {
    icon: <GitBranch className="w-12 h-12 text-muted-foreground/50" />,
    title: 'No pipeline runs',
    titleAr: 'لا يوجد عمليات تشغيل',
    description: 'Run the autonomous pipeline to generate complete project deliverables.',
    descriptionAr: 'شغّل خط الإنتاج الذاتي لإنشاء مخرجات المشروع كاملة.',
    actionLabel: 'Start Pipeline',
    actionLabelAr: 'شغّل Pipeline',
  },
  brand: {
    icon: <Heart className="w-12 h-12 text-muted-foreground/50" />,
    title: 'No brand health data',
    titleAr: 'لا يوجد بيانات صحة العلامة التجارية',
    description: 'Run a brand audit to track your client\'s brand health across 7 dimensions.',
    descriptionAr: 'قم بتدقيق العلامة التجارية لتتبع صحتها عبر 7 أبعاد.',
    actionLabel: 'Run Brand Audit',
    actionLabelAr: 'شغّل تدقيق العلامة',
  },
  leads: {
    icon: <TrendingUp className="w-12 h-12 text-muted-foreground/50" />,
    title: 'No leads yet',
    titleAr: 'لا يوجد عملاء محتملين بعد',
    description: 'Share the Quick-Check link to start capturing leads automatically.',
    descriptionAr: 'شارك رابط الفحص السريع لبدء جمع العملاء المحتملين تلقائياً.',
    actionLabel: 'View Quick-Check',
    actionLabelAr: 'عرض الفحص السريع',
  },
  analytics: {
    icon: <TrendingUp className="w-12 h-12 text-muted-foreground/50" />,
    title: 'No analytics data yet',
    titleAr: 'لا يوجد بيانات تحليلية بعد',
    description: 'Analytics will populate as you add clients, projects, and track progress.',
    descriptionAr: 'ستمتلئ التحليلات بمجرد إضافة عملاء ومشاريع وتتبع التقدم.',
    actionLabel: 'Add Client',
    actionLabelAr: 'أضف عميل',
  },
  general: {
    icon: <Inbox className="w-12 h-12 text-muted-foreground/50" />,
    title: 'Nothing here yet',
    titleAr: 'لا يوجد شيء هنا بعد',
    description: 'This section will be populated as you use the system.',
    descriptionAr: 'سيمتلئ هذا القسم أثناء استخدامك للنظام.',
    actionLabel: 'Get Started',
    actionLabelAr: 'ابدأ الآن',
  },
};

export function EmptyState({
  type,
  title,
  description,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondaryAction,
  icon,
}: EmptyStateProps) {
  const config = EMPTY_STATE_CONFIG[type] || EMPTY_STATE_CONFIG.general;

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {/* Icon */}
      <div className="mb-6 p-4 rounded-full bg-muted/50">
        {icon || config.icon}
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-foreground mb-2">
        {title || config.title}
      </h3>

      {/* Description */}
      <p className="text-sm text-muted-foreground max-w-md mb-6">
        {description || config.description}
      </p>

      {/* Actions */}
      <div className="flex gap-3">
        {onAction && (
          <Button onClick={onAction} className="gap-2">
            <Plus className="w-4 h-4" />
            {actionLabel || config.actionLabel}
          </Button>
        )}
        {onSecondaryAction && secondaryLabel && (
          <Button variant="outline" onClick={onSecondaryAction} className="gap-2">
            {secondaryLabel}
            <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

export default EmptyState;
