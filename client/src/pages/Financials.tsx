import { EmptyState } from "@/components/EmptyState";
import { PageSkeleton } from "@/components/PageSkeleton";
import { trpc, type RouterInputs } from "@/lib/trpc";
import type { ClientListItem, PaymentListItem, ProjectListItem } from "@/lib/routerTypes";
import { useI18n } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Loader2, TrendingUp, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { useState, useMemo } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { paginatedData } from "@/lib/utils";

const CHART_COLORS = ["#8F5A31", "#4C4C54", "#D4A574", "#7C9885", "#B8860B"];

type PaymentUiStatus = NonNullable<RouterInputs["payments"]["update"]["status"]>;

export default function FinancialsPage() {
  const { t } = useI18n();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [form, setForm] = useState({
    projectId: 0,
    clientId: 0,
    amount: "",
    currency: "EGP",
    status: "pending" as "pending" | "paid" | "overdue" | "cancelled",
    description: "",
  });

  const utils = trpc.useUtils();
  const { data: payments, isLoading } = trpc.payments.getAll.useQuery();
  const { data: projects } = trpc.projects.list.useQuery();
  const { data: clients } = trpc.clients.list.useQuery();

  const createMutation = trpc.payments.create.useMutation({
    onSuccess: () => {
      utils.payments.getAll.invalidate();
      utils.dashboard.stats.invalidate();
      setDialogOpen(false);
      setForm({ projectId: 0, clientId: 0, amount: "", currency: "EGP", status: "pending", description: "" });
      toast.success(t("common.success"));
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.payments.update.useMutation({
    onSuccess: () => {
      utils.payments.getAll.invalidate();
      utils.dashboard.stats.invalidate();
      toast.success(t("common.success"));
    },
  });

  const filtered = payments?.filter((p: PaymentListItem) => statusFilter === "all" || p.status === statusFilter) || [];

  // Financial calculations
  const stats = useMemo(() => {
    if (!payments) return { total: 0, collected: 0, pending: 0, overdue: 0 };
    const total = payments.reduce((s, p) => s + Number(p.amount), 0);
    const collected = payments.filter((p) => p.status === "paid").reduce((s, p) => s + Number(p.amount), 0);
    const pending = payments.filter((p) => p.status === "pending").reduce((s, p) => s + Number(p.amount), 0);
    const overdue = payments.filter((p) => p.status === "overdue").reduce((s, p) => s + Number(p.amount), 0);
    return { total, collected, pending, overdue };
  }, [payments]);

  const clientsList = paginatedData(clients);
  const projectsList = paginatedData(projects);

  // Market breakdown
  const marketData = useMemo(() => {
    if (!payments || !projectsList.length || !clientsList.length) return [];
    const byMarket: Record<string, number> = {};
    payments.forEach((p: PaymentListItem) => {
      const client = clientsList.find((c: ClientListItem) => c.id === p.clientId);
      const market = client?.market || "other";
      byMarket[market] = (byMarket[market] || 0) + Number(p.amount);
    });
    return Object.entries(byMarket).map(([name, value]) => ({ name: t(`market.${name}`), value }));
  }, [payments, projectsList, clientsList, t]);

  // Service breakdown
  const serviceData = useMemo(() => {
    if (!payments || !projectsList.length) return [];
    const byService: Record<string, number> = {};
    payments.forEach((p: PaymentListItem) => {
      const proj = projectsList.find((pr: ProjectListItem) => pr.id === p.projectId);
      const service = proj?.serviceType || "other";
      byService[service] = (byService[service] || 0) + Number(p.amount);
    });
    return Object.entries(byService).map(([name, value]) => ({ name: t(`service.${name}`), value }));
  }, [payments, projectsList, t]);

  if (isLoading) {
    return <PageSkeleton />;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("financials.title")}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{t("financials.subtitle")}</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 me-1.5" />{t("financials.addPayment")}</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{t("financials.addPayment")}</DialogTitle></DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (!form.projectId || !form.clientId) { toast.error("Select project and client"); return; }
              createMutation.mutate(form);
            }} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>{t("clients.title")} *</Label>
                  <Select value={form.clientId ? String(form.clientId) : ""} onValueChange={(v) => setForm({ ...form, clientId: Number(v) })}>
                    <SelectTrigger><SelectValue placeholder={t("projects.selectClient")} /></SelectTrigger>
                    <SelectContent>
                      {clientsList.map((c: ClientListItem) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>{t("projects.title")} *</Label>
                  <Select value={form.projectId ? String(form.projectId) : ""} onValueChange={(v) => setForm({ ...form, projectId: Number(v) })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {projectsList.filter((p: ProjectListItem) => !form.clientId || p.clientId === form.clientId).map((p: ProjectListItem) => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>{t("financials.amount")} *</Label>
                  <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required min={0} max={99999999} />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("financials.status")}</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as PaymentUiStatus })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["pending", "paid", "overdue"].map(s => (
                        <SelectItem key={s} value={s}>{t(`payment.${s}`)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>{t("financials.description")}</Label>
                <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <Button type="submit" className="w-full" disabled={!form.projectId || !form.amount || createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin me-1.5" />}
                {t("common.create")}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("financials.totalRevenue")}</p>
                <p className="text-lg font-semibold">{stats.total.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("financials.collected")}</p>
                <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">{stats.collected.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("financials.pendingAmount")}</p>
                <p className="text-lg font-semibold text-amber-600 dark:text-amber-400">{stats.pending.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("financials.overdue")}</p>
                <p className="text-lg font-semibold text-red-600 dark:text-red-400">{stats.overdue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      {(marketData.length > 0 || serviceData.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {marketData.length > 0 && (
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{t("financials.byMarket")}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={marketData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                      {marketData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => `${v.toLocaleString()} EGP`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
          {serviceData.length > 0 && (
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{t("financials.byService")}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={serviceData} layout="vertical">
                    <XAxis type="number" fontSize={10} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                    <YAxis type="category" dataKey="name" width={100} fontSize={10} />
                    <Tooltip formatter={(v: number) => `${v.toLocaleString()} EGP`} />
                    <Bar dataKey="value" fill="#8F5A31" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-2">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("common.all")}</SelectItem>
            {["pending", "paid", "overdue", "cancelled"].map(s => (
              <SelectItem key={s} value={s}>{t(`payment.${s}`)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Payments List */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">{t("financials.recentPayments")}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <EmptyState type="payments" onAction={() => setDialogOpen(true)} />
          ) : (
            <div className="divide-y">
              {filtered.map((payment: PaymentListItem) => {
                const project = projectsList.find((p: ProjectListItem) => p.id === payment.projectId);
                const client = clientsList.find((c: ClientListItem) => c.id === payment.clientId);
                return (
                  <div key={payment.id} className="flex items-center justify-between gap-4 p-4 hover:bg-muted/30 transition-colors">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{payment.description || project?.name || "—"}</p>
                      <p className="text-xs text-muted-foreground">{client?.name || "—"} · {project?.name || "—"}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <p className="text-sm font-semibold">{Number(payment.amount).toLocaleString()} {t("common.egp")}</p>
                      <Select value={payment.status} onValueChange={(v) => updateMutation.mutate({ id: payment.id, status: v as PaymentUiStatus })}>
                        <SelectTrigger className="h-7 text-xs w-28"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["pending", "paid", "overdue", "cancelled"].map(s => (
                            <SelectItem key={s} value={s}>{t(`payment.${s}`)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span className="text-[10px] text-muted-foreground">{new Date(payment.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
