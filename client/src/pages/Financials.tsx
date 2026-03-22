import { EmptyState } from "@/components/EmptyState";
import { PageSkeleton } from "@/components/PageSkeleton";
import { trpc } from "@/lib/trpc";
import { useI18n } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, DollarSign, Loader2, TrendingUp, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { useState, useMemo } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { paginatedData } from "@/lib/utils";

const paymentStatusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  partial: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  paid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  overdue: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  cancelled: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
};

const CHART_COLORS = ["#8F5A31", "#4C4C54", "#D4A574", "#7C9885", "#B8860B"];

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

  const filtered = payments?.filter((p: any) => statusFilter === "all" || p.status === statusFilter) || [];

  // Financial calculations
  const stats = useMemo(() => {
    if (!payments) return { total: 0, collected: 0, pending: 0, overdue: 0 };
    const total = payments.reduce((s: number, p: any) => s + Number(p.amount), 0);
    const collected = payments.filter((p: any) => p.status === "paid").reduce((s: number, p: any) => s + Number(p.amount), 0);
    const pending = payments.filter((p: any) => p.status === "pending").reduce((s: number, p: any) => s + Number(p.amount), 0);
    const overdue = payments.filter((p: any) => p.status === "overdue").reduce((s: number, p: any) => s + Number(p.amount), 0);
    return { total, collected, pending, overdue };
  }, [payments]);

  const clientsList = paginatedData(clients);
  const projectsList = paginatedData(projects);

  // Market breakdown
  const marketData = useMemo(() => {
    if (!payments || !projectsList.length || !clientsList.length) return [];
    const byMarket: Record<string, number> = {};
    payments.forEach((p: any) => {
      const client = (clientsList as any[]).find((c: any) => c.id === p.clientId);
      const market = client?.market || "other";
      byMarket[market] = (byMarket[market] || 0) + Number(p.amount);
    });
    return Object.entries(byMarket).map(([name, value]) => ({ name: t(`market.${name}`), value }));
  }, [payments, projectsList, clientsList, t]);

  // Service breakdown
  const serviceData = useMemo(() => {
    if (!payments || !projectsList.length) return [];
    const byService: Record<string, number> = {};
    payments.forEach((p: any) => {
      const proj = (projectsList as any[]).find((pr: any) => pr.id === p.projectId);
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
              createMutation.mutate(form as any);
            }} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>{t("clients.title")} *</Label>
                  <Select value={form.clientId ? String(form.clientId) : ""} onValueChange={(v) => setForm({ ...form, clientId: Number(v) })}>
                    <SelectTrigger><SelectValue placeholder={t("projects.selectClient")} /></SelectTrigger>
                    <SelectContent>
                      {(clientsList as any[]).map((c: any) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>{t("projects.title")} *</Label>
                  <Select value={form.projectId ? String(form.projectId) : ""} onValueChange={(v) => setForm({ ...form, projectId: Number(v) })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {projectsList.filter((p: any) => !form.clientId || p.clientId === form.clientId).map((p: any) => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
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
                  <Select value={form.status} onValueChange={(v: any) => setForm({ ...form, status: v })}>
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
              {filtered.map((payment: any) => {
                const project = (projectsList as any[]).find((p: any) => p.id === payment.projectId);
                const client = (clientsList as any[]).find((c: any) => c.id === payment.clientId);
                return (
                  <div key={payment.id} className="flex items-center justify-between gap-4 p-4 hover:bg-muted/30 transition-colors">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{payment.description || project?.name || "—"}</p>
                      <p className="text-xs text-muted-foreground">{client?.name || "—"} · {project?.name || "—"}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <p className="text-sm font-semibold">{Number(payment.amount).toLocaleString()} {t("common.egp")}</p>
                      <Select value={payment.status} onValueChange={(v: any) => updateMutation.mutate({ id: payment.id, status: v })}>
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
