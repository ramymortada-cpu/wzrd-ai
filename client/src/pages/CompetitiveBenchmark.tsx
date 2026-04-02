import { ShieldAlert } from 'lucide-react';

export default function CompetitiveBenchmark() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-6">
        <ShieldAlert size={32} />
      </div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
        أداة تحليل المنافسين تحت التحديث
      </h1>
      <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
        بنقوم حالياً بتحديث الأداة لربطها ببيانات حقيقية من مواقع المنافسين لضمان أعلى دقة في التقرير. الأداة هتكون متاحة قريباً.
      </p>
    </div>
  );
}
