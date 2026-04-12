/**
 * Brand Monitor — Command Center: observatory schedule + alerts (Sprint F).
 * Route: /cc/brand-monitor
 */
import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Radio, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function BrandMonitor() {
  const { locale } = useI18n();
  const isAr = locale === "ar";

  const clientsQuery = trpc.clients.list.useQuery({ page: 1, pageSize: 100 });
  const clients = clientsQuery.data?.data ?? [];

  const [clientId, setClientId] = useState<number | null>(null);

  useEffect(() => {
    if (clientId === null && clients.length > 0) {
      setClientId(clients[0].id);
    }
  }, [clients, clientId]);

  const settingsQuery = trpc.brandTwin.monitorSettings.useQuery(
    { clientId: clientId! },
    { enabled: !!clientId },
  );

  const alertsQuery = trpc.brandTwin.getAlerts.useQuery(
    { clientId: clientId!, status: "active" },
    { enabled: !!clientId },
  );

  const [enabled, setEnabled] = useState(false);
  const [intervalDays, setIntervalDays] = useState(7);
  const [lastResultSummary, setLastResultSummary] = useState<string | null>(null);

  useEffect(() => {
    if (settingsQuery.data) {
      setEnabled(settingsQuery.data.brandMonitorEnabled);
      setIntervalDays(settingsQuery.data.brandMonitorIntervalDays);
    }
  }, [settingsQuery.data]);

  const updateSettings = trpc.brandTwin.updateMonitorSettings.useMutation({
    onSuccess: () => {
      toast.success(isAr ? "تم حفظ الإعدادات" : "Settings saved");
      void settingsQuery.refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const observe = trpc.brandTwin.observe.useMutation({
    onSuccess: (res) => {
      if (res?.summary) setLastResultSummary(res.summary);
      toast.success(isAr ? "اكتمل المسح" : "Scan complete");
      void alertsQuery.refetch();
      void settingsQuery.refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const selectedLabel = useMemo(() => {
    const c = clients.find((x) => x.id === clientId);
    if (!c) return "";
    return c.companyName || c.name;
  }, [clients, clientId]);

  if (clientsQuery.isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
        <div className="flex items-center gap-3">
          <Radio className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {isAr ? "مراقبة العلامة" : "Brand Monitor"}
            </h1>
            <p className="text-muted-foreground text-sm">
              {isAr
                ? "جدولة مسح Observatory أسبوعيًا + عرض التنبيهات النشطة."
                : "Schedule weekly Observatory scans and review active alerts."}
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{isAr ? "العميل" : "Client"}</CardTitle>
            <CardDescription>
              {isAr ? "اختر عميلاً من مساحة العمل الحالية." : "Pick a client in the current workspace."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {clients.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {isAr ? "لا يوجد عملاء." : "No clients yet."}
              </p>
            ) : (
              <Select
                value={clientId ? String(clientId) : ""}
                onValueChange={(v) => setClientId(Number(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isAr ? "اختر عميلاً" : "Select client"} />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.companyName || c.name} (#{c.id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </CardContent>
        </Card>

        {clientId && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>{isAr ? "الجدولة" : "Schedule"}</CardTitle>
                <CardDescription>
                  {settingsQuery.data?.brandMonitorLastRunAt
                    ? isAr
                      ? `آخر مسح: ${new Date(settingsQuery.data.brandMonitorLastRunAt).toLocaleString()}`
                      : `Last run: ${new Date(settingsQuery.data.brandMonitorLastRunAt).toLocaleString()}`
                    : isAr
                      ? "لم يُسجَّل مسح بعد."
                      : "No run recorded yet."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <Label htmlFor="bm-enabled">{isAr ? "تفعيل المراقبة" : "Monitoring on"}</Label>
                  <Switch id="bm-enabled" checked={enabled} onCheckedChange={setEnabled} />
                </div>
                <div className="space-y-2">
                  <Label>{isAr ? "أيام بين المسح التلقائي (١–٩٠)" : "Days between scans (1–90)"}</Label>
                  <Input
                    type="number"
                    min={1}
                    max={90}
                    value={intervalDays}
                    onChange={(e) => setIntervalDays(Number(e.target.value) || 7)}
                  />
                </div>
                <Button
                  disabled={updateSettings.isPending}
                  onClick={() =>
                    updateSettings.mutate({
                      clientId,
                      brandMonitorEnabled: enabled,
                      brandMonitorIntervalDays: intervalDays,
                    })
                  }
                >
                  {updateSettings.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isAr ? (
                    "حفظ"
                  ) : (
                    "Save"
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{isAr ? "مسح الآن" : "Run scan now"}</CardTitle>
                <CardDescription>{selectedLabel}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="secondary"
                  disabled={observe.isPending}
                  onClick={() => observe.mutate({ clientId })}
                >
                  {observe.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  {isAr ? "تشغيل Observatory" : "Run Observatory"}
                </Button>
                {lastResultSummary && (
                  <p className="text-sm text-muted-foreground border rounded-md p-3">{lastResultSummary}</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{isAr ? "تنبيهات نشطة" : "Active alerts"}</CardTitle>
              </CardHeader>
              <CardContent>
                {alertsQuery.isLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (alertsQuery.data?.length ?? 0) === 0 ? (
                  <p className="text-sm text-muted-foreground">{isAr ? "لا تنبيهات." : "No alerts."}</p>
                ) : (
                  <ul className="space-y-3">
                    {alertsQuery.data!.map((a) => (
                      <li key={a.id} className="rounded-lg border p-3 text-sm">
                        <div className="font-medium">{a.title}</div>
                        <div className="text-muted-foreground mt-1">{a.description?.slice(0, 400)}</div>
                        <div className="mt-1 text-xs opacity-80">
                          {a.severity} · {a.dimension}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
