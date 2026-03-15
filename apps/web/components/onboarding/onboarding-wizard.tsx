"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  BookOpen,
  Users,
  CheckCircle2,
} from "lucide-react";

type OnboardingStep = {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action: string;
  href: string;
  completed: boolean;
};

export default function OnboardingWizard() {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("radd_onboarding_dismissed");
    if (saved === "true") setDismissed(true);
  }, []);

  const handleDismiss = () => {
    localStorage.setItem("radd_onboarding_dismissed", "true");
    setDismissed(true);
  };

  if (dismissed) return null;

  const steps: OnboardingStep[] = [
    {
      id: "whatsapp",
      title: "ربط واتساب",
      description: "اربط رقم واتساب متجرك عشان رَدّ يبدأ يستقبل الرسائل",
      icon: <MessageSquare className="h-8 w-8 text-green-500" />,
      action: "ربط الآن",
      href: "/settings",
      completed: false,
    },
    {
      id: "knowledge",
      title: "درّب الذكاء الاصطناعي",
      description: "أضف سياسات متجرك والأسئلة الشائعة عشان رَدّ يرد بدقة",
      icon: <BookOpen className="h-8 w-8 text-blue-500" />,
      action: "إضافة محتوى",
      href: "/knowledge",
      completed: false,
    },
    {
      id: "team",
      title: "أضف فريقك",
      description: "أضف موظفي خدمة العملاء عشان يستلمون المحادثات المحوّلة",
      icon: <Users className="h-8 w-8 text-purple-500" />,
      action: "دعوة فريق",
      href: "/settings",
      completed: false,
    },
  ];

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-l from-primary/5 to-transparent">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-xl">
            أهلاً بك في رَدّ! 👋
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            ثلاث خطوات بسيطة وتبدأ الأتمتة
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="text-muted-foreground"
        >
          تخطي
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {steps.map((step, index) => (
            <Card
              key={step.id}
              className="relative overflow-hidden hover:shadow-md transition-shadow"
            >
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="rounded-full bg-muted p-3">
                    {step.completed ? (
                      <CheckCircle2 className="h-8 w-8 text-green-500" />
                    ) : (
                      step.icon
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">
                      {index + 1}. {step.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {step.description}
                    </p>
                  </div>
                  <Button
                    variant={step.completed ? "outline" : "default"}
                    size="sm"
                    className="w-full mt-2"
                    asChild
                  >
                    <Link href={step.href}>
                      {step.completed ? "تم ✓" : step.action}
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
