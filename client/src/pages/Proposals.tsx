import { EmptyState } from "@/components/EmptyState";
import { PageSkeleton } from "@/components/PageSkeleton";
import { useDebounce } from "@/hooks/useDebounce";
import { trpc, type RouterOutputs } from "@/lib/trpc";
import type { ClientListItem, ProposalListItem } from "@/lib/routerTypes";
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
import { useLocation } from "wouter";
import { useState, useMemo } from "react";
import { Plus, Search, FileText, Loader2, Sparkles, Trash2 } from "lucide-react";
import { paginatedData } from "@/lib/utils";

const SERVICE_TYPES = ["business_health_check", "starting_business_logic", "brand_identity", "business_takeoff", "consultation"] as const;

type ProposalsListData = RouterOutputs["proposals"]["list"];

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
  sent: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  accepted: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export default function ProposalsPage() {
  const { t } = useI18n();
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    clientId: 0,
    serviceType: "business_health_check" as (typeof SERVICE_TYPES)[number],
    title: "",
    language: "en" as "en" | "ar",
    customNotes: "",
  });

  const utils = trpc.useUtils();
  const { data: proposalsRaw, isLoading } = trpc.proposals.list.useQuery();
  const { data: clientsRaw } = trpc.clients.list.useQuery();
  const proposals = paginatedData(proposalsRaw);
  const clients = paginatedData(clientsRaw);

  const createMutation = trpc.proposals.create.useMutation({
    onMutate: async (newProposal) => {
      await utils.proposals.list.cancel();
      const previous = utils.proposals.list.getData();
      utils.proposals.list.setData(undefined, (old: ProposalsListData | undefined) => {
        if (!old) return old;
        const temp = { id: -Date.now(), ...newProposal, status: "draft" as const, createdAt: new Date(), updatedAt: new Date() };
        return [temp, ...old] as ProposalsListData;
      });
      return { previous };
    },
    onSuccess: (result) => {
      utils.proposals.list.invalidate();
      setDialogOpen(false);
      toast.success(t("common.success"));
      setLocation(`/proposals/${result.id}`);
    },
    onError: (err, _, context) => {
      if (context?.previous) utils.proposals.list.setData(undefined, context.previous);
      toast.error(err.message);
    },
  });

  const deleteMutation = trpc.proposals.delete.useMutation({
    onMutate: async ({ id }) => {
      await utils.proposals.list.cancel();
      const previous = utils.proposals.list.getData();
      utils.proposals.list.setData(undefined, (old: ProposalsListData | undefined) => {
        if (!old) return old;
        return old.filter((p: ProposalListItem) => p.id !== id);
      });
      return { previous };
    },
    onSuccess: () => {
      utils.proposals.list.invalidate();
      toast.success(t("common.success"));
    },
    onError: (err, _, context) => {
      if (context?.previous) utils.proposals.list.setData(undefined, context.previous);
      toast.error(err.message);
    },
  });

  const debouncedSearch = useDebounce(search, 300);

  const filtered = useMemo(() => {
    if (!proposals) return [];
    if (!debouncedSearch) return proposals;
    const s = debouncedSearch.toLowerCase();
    return proposals.filter((p: ProposalListItem) => p.title.toLowerCase().includes(s));
  }, [proposals, debouncedSearch]);

  const handleCreate = () => {
    if (!form.clientId) { toast.error(t("proposals.selectClient")); return; }
    if (!form.title) { toast.error(t("proposals.proposalTitle")); return; }
    createMutation.mutate(form);
  };

  // Auto-generate title when client and service change
  const autoTitle = (clientId: number, serviceType: string) => {
    const client = clients?.find(c => c.id === clientId);
    if (client) {
      const serviceName = t(`service.${serviceType}`);
      return `${client.companyName || client.name} — ${serviceName} Proposal`;
    }
    return "";
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("proposals.title")}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{t("proposals.subtitle")}</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 me-1.5" />{t("proposals.addNew")}</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                {t("proposals.addNew")}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>{t("proposals.selectClient")} *</Label>
                <Select
                  value={form.clientId ? String(form.clientId) : ""}
                  onValueChange={(v) => {
                    const newClientId = Number(v);
                    const newTitle = autoTitle(newClientId, form.serviceType);
                    setForm({ ...form, clientId: newClientId, title: newTitle });
                  }}
                >
                  <SelectTrigger><SelectValue placeholder={t("proposals.selectClient")} /></SelectTrigger>
                  <SelectContent>
                    {clients?.map(c => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}{c.companyName ? ` — ${c.companyName}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t("proposals.selectService")} *</Label>
                <Select
                  value={form.serviceType}
                  onValueChange={(v) => {
                    const st = v as (typeof SERVICE_TYPES)[number];
                    const newTitle = form.clientId ? autoTitle(form.clientId, st) : "";
                    setForm({ ...form, serviceType: st, title: newTitle || form.title });
                  }}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SERVICE_TYPES.map(s => (
                      <SelectItem key={s} value={s}>{t(`service.${s}`)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t("proposals.proposalTitle")} *</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("proposals.language")}</Label>
                <Select value={form.language} onValueChange={(v) => setForm({ ...form, language: v as "en" | "ar" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">{t("proposals.english")}</SelectItem>
                    <SelectItem value="ar">{t("proposals.arabic")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t("proposals.customNotes")} <span className="text-muted-foreground text-xs">({t("common.optional")})</span></Label>
                <Textarea
                  value={form.customNotes}
                  onChange={(e) => setForm({ ...form, customNotes: e.target.value })}
                  placeholder={t("proposals.customNotesHint")}
                  rows={3}
                />
              </div>
              <Button
                onClick={handleCreate}
                className="w-full"
                disabled={!form.clientId || !form.title || createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin me-1.5" />
                    {t("proposals.generating")}
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 me-1.5" />
                    {t("proposals.generate")}
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder={t("proposals.search")} value={search} onChange={(e) => setSearch(e.target.value)} maxLength={200} className="ps-9" aria-label="Search" />
      </div>

      {isLoading ? (
        <PageSkeleton />
      ) : filtered.length === 0 ? (
        search ? (
          <Card className="shadow-sm">
            <CardContent className="py-12 text-center text-muted-foreground">
              <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">{t("common.noResults")}</p>
            </CardContent>
          </Card>
        ) : (
          <EmptyState type="proposals" onAction={() => setDialogOpen(true)} />
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" role="list">
          {filtered.map((proposal: ProposalListItem) => {
            const client = clients?.find((c: ClientListItem) => c.id === proposal.clientId);
            return (
              <Card
                key={proposal.id}
                className="shadow-sm hover:shadow-md transition-all cursor-pointer group"
                onClick={() => setLocation(`/proposals/${proposal.id}`)}
              >
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <p className="font-medium truncate group-hover:text-primary transition-colors">
                        {proposal.title}
                      </p>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {client?.companyName || client?.name || "—"} · {t(`service.${proposal.serviceType}`)}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0 items-center">
                      <Badge className={`${statusColors[proposal.status]} border-0 text-xs`}>
                        {t(`proposals.${proposal.status}`)}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(t("proposals.deleteConfirm"))) {
                            deleteMutation.mutate({ id: proposal.id });
                          }
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{proposal.price ? `${Number(proposal.price).toLocaleString()} ${t("common.egp")}` : ""}</span>
                    <span className="flex items-center gap-1">
                      <Badge variant="outline" className="text-xs border-0 bg-muted/50">
                        {proposal.language === "ar" ? "عربي" : "EN"}
                      </Badge>
                      <span>{new Date(proposal.createdAt).toLocaleDateString()}</span>
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
