import { trpc } from "@/lib/trpc";
import { useI18n } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Loader2, BookOpen, FileText } from "lucide-react";

const SERVICE_META: Record<string, { icon: string; color: string }> = {
  business_health_check: { icon: "🔍", color: "border-l-orange-500" },
  starting_business_logic: { icon: "⚙️", color: "border-l-blue-500" },
  brand_identity: { icon: "🎨", color: "border-l-purple-500" },
  business_takeoff: { icon: "🚀", color: "border-l-emerald-500" },
  consultation: { icon: "💡", color: "border-l-amber-500" },
};

const STAGE_COLORS: Record<string, string> = {
  diagnose: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  design: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  deploy: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  optimize: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
};

export default function PlaybooksPage() {
  const { t, locale } = useI18n();
  const { data, isLoading } = trpc.dashboard.playbooks.useQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const playbooks = data?.playbooks as Record<string, any> || {};
  const prices = data?.prices as Record<string, number> || {};

  return (
    <div className="space-y-6 sm:space-y-8 max-w-4xl mx-auto px-3 sm:px-0">
      {/* Header */}
      <div className="space-y-2 pt-2">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{t("playbooks.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("playbooks.subtitle")}</p>
          </div>
        </div>
      </div>

      {/* Playbook Cards */}
      <div className="space-y-4">
        {Object.entries(playbooks).map(([key, playbook]: [string, any]) => {
          const meta = SERVICE_META[key] || { icon: "📋", color: "border-l-gray-500" };
          const totalSteps = playbook.stages?.reduce((acc: number, s: any) => acc + (s.steps?.length || 0), 0) || 0;

          return (
            <Card key={key} className={`shadow-sm border-l-4 ${meta.color}`}>
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{meta.icon}</span>
                    <div>
                      <CardTitle className="text-lg">{playbook.name || t(`service.${key}`)}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-0.5">{playbook.description || ""}</p>
                    </div>
                  </div>
                  <div className="text-end shrink-0">
                    <p className="text-lg font-semibold text-primary">
                      {(prices[key] || 0).toLocaleString()} {t("common.egp")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {playbook.stages?.length || 0} {t("playbooks.stages")} · {totalSteps} {t("playbooks.steps")}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {playbook.stages?.map((stage: any, stageIdx: number) => (
                    <AccordionItem key={stageIdx} value={`stage-${stageIdx}`} className="border-b-0">
                      <AccordionTrigger className="hover:no-underline py-3">
                        <div className="flex items-center gap-2">
                          <Badge className={`${STAGE_COLORS[stage.stage] || "bg-muted text-muted-foreground"} border-0 text-xs`}>
                            {t(`stage.${stage.stage}`)}
                          </Badge>
                          <span className="text-sm font-medium">{stage.title}</span>
                          <span className="text-xs text-muted-foreground">({stage.steps?.length || 0} {t("playbooks.steps")})</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2 ps-2">
                          {stage.steps?.map((step: any, stepIdx: number) => (
                            <div key={stepIdx} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                                <span className="text-xs font-medium text-primary">{stepIdx + 1}</span>
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium">{step.title}</p>
                                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{step.description}</p>
                                {step.deliverable && (
                                  <div className="flex items-center gap-1.5 mt-2">
                                    <FileText className="h-3 w-3 text-primary" />
                                    <span className="text-xs text-primary font-medium">{step.deliverable}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
