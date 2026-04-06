/**
 * OnboardingTour — guided first-use tour for new users.
 * Shows step-by-step tooltips highlighting key features.
 */

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';

interface TourStep {
  id: string;
  target: string;
  title: string;
  titleAr: string;
  content: string;
  contentAr: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    target: 'body',
    title: 'Welcome to WZZRD AI',
    titleAr: 'مرحباً بك في WZZRD AI',
    content: 'Your AI-powered brand engineering dashboard. Let us show you around.',
    contentAr: 'لوحة هندسة العلامات التجارية بالذكاء الاصطناعي. دعنا نأخذك في جولة.',
  },
  {
    id: 'clients',
    target: '[href="/clients"]',
    title: 'Manage Clients',
    titleAr: 'إدارة العملاء',
    content: 'Start by adding your clients. Each client gets a complete project lifecycle with the 4D Framework.',
    contentAr: 'ابدأ بإضافة عملائك. كل عميل يحصل على دورة مشروع كاملة بإطار 4D.',
  },
  {
    id: 'ai-engine',
    target: '[href="/ai"]',
    title: 'AI Brain (Wzrd AI)',
    titleAr: 'العقل الذكي (Wzrd AI)',
    content: 'Chat with the AI to get strategic brand insights backed by Keller, Kapferer, and Sharp frameworks.',
    contentAr: 'تحدث مع الذكاء الاصطناعي للحصول على رؤى مدعومة بأطر Keller و Kapferer و Sharp.',
  },
  {
    id: 'pipeline',
    target: '[href="/pipeline"]',
    title: 'Autonomous Pipeline',
    titleAr: 'خط الإنتاج الذاتي',
    content: 'Let AI handle the entire workflow: Research → Diagnose → Strategize → Generate → Deliver.',
    contentAr: 'دع الذكاء الاصطناعي يدير سير العمل: بحث ← تشخيص ← استراتيجية ← إنتاج ← تسليم.',
  },
  {
    id: 'leads',
    target: '[href="/leads"]',
    title: 'Lead Generation',
    titleAr: 'جذب العملاء المحتملين',
    content: 'Share the Quick-Check link to automatically capture, score, and qualify leads.',
    contentAr: 'شارك رابط الفحص السريع لجذب وتسجيل العملاء المحتملين تلقائياً.',
  },
];

const TOUR_STORAGE_KEY = 'wzzrd_tour_completed';

export function OnboardingTour({ isAr = false }: { isAr?: boolean }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    // Only show tour if not completed before
    try {
      const completed = localStorage.getItem(TOUR_STORAGE_KEY);
      if (!completed) {
        // Delay to let page render
        const timer = setTimeout(() => setIsVisible(true), 1500);
        return () => clearTimeout(timer);
      }
    } catch {
      // localStorage not available
    }
  }, []);

  const highlightTarget = useCallback((step: TourStep) => {
    if (step.target === 'body') {
      setHighlightRect(null);
      return;
    }
    const el = document.querySelector(step.target);
    if (el) {
      const rect = el.getBoundingClientRect();
      setHighlightRect(rect);
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      setHighlightRect(null);
    }
  }, []);

  useEffect(() => {
    if (isVisible && TOUR_STEPS[currentStep]) {
      highlightTarget(TOUR_STEPS[currentStep]);
    }
  }, [currentStep, isVisible, highlightTarget]);

  const completeTour = useCallback(() => {
    setIsVisible(false);
    try { localStorage.setItem(TOUR_STORAGE_KEY, 'true'); } catch { /* storage may be unavailable */ }
  }, []);

  const nextStep = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTour();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  if (!isVisible) return null;

  const step = TOUR_STEPS[currentStep];
  const isLast = currentStep === TOUR_STEPS.length - 1;
  const isFirst = currentStep === 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-[9998] transition-opacity duration-300"
        onClick={completeTour}
        aria-hidden="true"
      />

      {/* Highlight box */}
      {highlightRect && (
        <div
          className="fixed z-[9999] border-2 border-primary rounded-lg shadow-lg shadow-primary/20 pointer-events-none transition-all duration-300"
          style={{
            top: highlightRect.top - 4,
            left: highlightRect.left - 4,
            width: highlightRect.width + 8,
            height: highlightRect.height + 8,
          }}
        />
      )}

      {/* Tour Card */}
      <Card
        className="fixed z-[10000] w-[340px] sm:w-[400px] shadow-2xl border-primary/20"
        style={{
          top: highlightRect
            ? Math.min(highlightRect.bottom + 16, window.innerHeight - 220)
            : '50%',
          left: highlightRect
            ? Math.min(Math.max(highlightRect.left, 16), window.innerWidth - 420)
            : '50%',
          transform: highlightRect ? 'none' : 'translate(-50%, -50%)',
        }}
        role="dialog"
        aria-label={isAr ? 'جولة تعريفية' : 'Onboarding tour'}
      >
        <CardContent className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-base">
                {isAr ? step.titleAr : step.title}
              </h3>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7 -mt-1 -me-1" onClick={completeTour} aria-label="Close tour">
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <p className="text-sm text-muted-foreground mb-4">
            {isAr ? step.contentAr : step.content}
          </p>

          {/* Progress + Navigation */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {currentStep + 1} / {TOUR_STEPS.length}
            </span>
            <div className="flex gap-2">
              {!isFirst && (
                <Button variant="outline" size="sm" onClick={prevStep} className="gap-1">
                  <ChevronLeft className="h-3 w-3" />
                  {isAr ? 'السابق' : 'Back'}
                </Button>
              )}
              <Button size="sm" onClick={nextStep} className="gap-1">
                {isLast ? (isAr ? 'ابدأ الآن' : 'Get Started') : (isAr ? 'التالي' : 'Next')}
                {!isLast && <ChevronRight className="h-3 w-3" />}
              </Button>
            </div>
          </div>

          {/* Step dots */}
          <div className="flex justify-center gap-1.5 mt-3">
            {TOUR_STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === currentStep ? 'w-4 bg-primary' : 'w-1.5 bg-muted-foreground/30'
                }`}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
}

export default OnboardingTour;
