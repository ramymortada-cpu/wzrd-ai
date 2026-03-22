import { trpc } from "@/lib/trpc";
import { paginatedData } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Search, Building2, MapPin, Mail, Phone, Globe, Loader2 } from "lucide-react";
import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { EmptyState } from "@/components/EmptyState";
import { PageSkeleton } from "@/components/PageSkeleton";
import { useDebounce } from "@/hooks/useDebounce";

const statusColors: Record<string, string> = {
  lead: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  completed: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
  paused: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
};

export default function ClientsPage() {
  const { t } = useI18n();
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    name: "", companyName: "", email: "", phone: "",
    market: "ksa" as "ksa" | "egypt" | "uae" | "other",
    industry: "", website: "", notes: "",
    status: "lead" as "lead" | "active" | "completed" | "paused",
  });

  const utils = trpc.useUtils();
  const { data: clients, isLoading } = trpc.clients.list.useQuery();
  const debouncedSearch = useDebounce(search, 300);
  const createMutation = trpc.clients.create.useMutation({
    onMutate: async (newClient) => {
      await utils.clients.list.cancel();
      const previous = utils.clients.list.getData();
      utils.clients.list.setData(undefined, (old: any) => {
        if (!old) return old;
        const data = Array.isArray(old) ? old : old?.data || [];
        const temp = { id: -Date.now(), ...newClient, createdAt: new Date(), updatedAt: new Date() };
        return Array.isArray(old) ? [temp, ...data] : { ...old, data: [temp, ...data] };
      });
      return { previous };
    },
    onSuccess: () => {
      utils.clients.list.invalidate();
      setDialogOpen(false);
      setForm({ name: "", companyName: "", email: "", phone: "", market: "ksa", industry: "", website: "", notes: "", status: "lead" });
      toast.success(t("common.success"));
    },
    onError: (err, _, context) => {
      if (context?.previous) utils.clients.list.setData(undefined, context.previous);
      toast.error(err.message);
    },
  });

  const clientsList = paginatedData(clients);
  const filtered = useMemo(() => {
    if (!clientsList.length) return [];
    if (!debouncedSearch) return clientsList;
    const s = debouncedSearch.toLowerCase();
    return clientsList.filter((c) =>
      c.name?.toLowerCase().includes(s) ||
      c.companyName?.toLowerCase().includes(s) ||
      c.email?.toLowerCase().includes(s) ||
      c.industry?.toLowerCase().includes(s)
    );
  }, [clientsList, debouncedSearch]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">{t("clients.title")}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{clientsList.length} {t("clients.title").toLowerCase()}</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 me-1.5" />{t("clients.addNew")}</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{t("clients.addNew")}</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>{t("clients.name")} *</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required maxLength={255} />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("clients.company")}</Label>
                  <Input value={form.companyName} maxLength={255} onChange={(e) => setForm({ ...form, companyName: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>{t("clients.email")}</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("clients.phone")}</Label>
                  <Input value={form.phone} maxLength={20} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>{t("clients.market")}</Label>
                  <Select value={form.market} onValueChange={(v: any) => setForm({ ...form, market: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["ksa", "egypt", "uae", "other"].map(m => (
                        <SelectItem key={m} value={m}>{t(`market.${m}`)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>{t("clients.industry")}</Label>
                  <Input value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>{t("clients.website")}</Label>
                <Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>{t("clients.notes")}</Label>
                <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} />
              </div>
              <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin me-1.5" />}
                {t("common.create")}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder={t("clients.search")} value={search} onChange={(e) => setSearch(e.target.value)} className="ps-9" aria-label="Search clients" />
      </div>

      {/* Client Cards */}
      {isLoading ? (
        <PageSkeleton />
      ) : filtered.length === 0 ? (
        search ? (
          <Card className="shadow-sm">
            <CardContent className="py-12 text-center text-muted-foreground">
              <Building2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">{t("common.noResults")}</p>
            </CardContent>
          </Card>
        ) : (
          <EmptyState
            type="clients"
            onAction={() => setDialogOpen(true)}
          />
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((client) => (
            <Card
              key={client.id}
              className="shadow-sm hover:shadow-md transition-all cursor-pointer group"
              onClick={() => setLocation(`/clients/${client.id}`)}
              role="button"
              tabIndex={0}
              aria-label={`${client.name} — ${client.companyName || ""} — ${t(`status.${client.status ?? "lead"}`)}`}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setLocation(`/clients/${client.id}`); } }}
            >
              <CardContent className="pt-5 pb-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <p className="font-medium truncate group-hover:text-primary transition-colors">{client.name}</p>
                    {client.companyName && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Building2 className="h-3 w-3 shrink-0" />
                        <span className="truncate">{client.companyName}</span>
                      </p>
                    )}
                  </div>
                  <Badge className={`${statusColors[client.status ?? "lead"]} border-0 text-xs shrink-0`}>
                    {t(`status.${client.status ?? "lead"}`)}
                  </Badge>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  {client.email && <p className="flex items-center gap-1.5"><Mail className="h-3 w-3" /> {client.email}</p>}
                  {client.phone && <p className="flex items-center gap-1.5"><Phone className="h-3 w-3" /> {client.phone}</p>}
                  <p className="flex items-center gap-1.5"><MapPin className="h-3 w-3" /> {t(`market.${client.market ?? "other"}`)}</p>
                  {client.industry && <p className="text-primary/70">{client.industry}</p>}
                  {client.website && <p className="flex items-center gap-1.5"><Globe className="h-3 w-3" /> {client.website}</p>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
