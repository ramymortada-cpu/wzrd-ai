import { trpc } from "@/lib/trpc";
import { useI18n } from "@/lib/i18n";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { useState, useMemo } from "react";
import { Plus, Search, FolderKanban, Loader2, ArrowRight } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { PageSkeleton } from "@/components/PageSkeleton";
import { useDebounce } from "@/hooks/useDebounce";
import { paginatedData } from "@/lib/utils";

const stageColors: Record<string, string> = {
  diagnose: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  design: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  deploy: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  optimize: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  completed: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
};

const statusColors: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  paused: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  completed: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const SERVICE_TYPES = ["business_health_check", "starting_business_logic", "brand_identity", "business_takeoff", "consultation"] as const;

export default function ProjectsPage() {
  const { t } = useI18n();
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    clientId: 0, name: "", serviceType: "business_health_check" as (typeof SERVICE_TYPES)[number],
    description: "",
  });

  const utils = trpc.useUtils();
  const { data: projects, isLoading } = trpc.projects.list.useQuery();
  const { data: clients } = trpc.clients.list.useQuery();
  const debouncedSearch = useDebounce(search, 300);

  const createMutation = trpc.projects.create.useMutation({
    onMutate: async (newProject) => {
      await utils.projects.list.cancel();
      const previous = utils.projects.list.getData();
      utils.projects.list.setData(undefined, (old: any) => {
        if (!old) return old;
        const temp = { id: -Date.now(), ...newProject, createdAt: new Date(), updatedAt: new Date(), status: 'active' };
        return [temp, ...old];
      });
      return { previous };
    },
    onSuccess: (result) => {
      utils.projects.list.invalidate();
      setDialogOpen(false);
      toast.success(t("common.success"));
      setLocation(`/projects/${result.id}`);
    },
    onError: (err, _, context) => {
      if (context?.previous) utils.projects.list.setData(undefined, context.previous);
      toast.error(err.message);
    },
  });

  const projectsList = paginatedData(projects);
  const clientsList = paginatedData(clients);
  const filtered = useMemo(() => {
    if (!projectsList.length) return [];
    if (!debouncedSearch) return projectsList;
    const s = debouncedSearch.toLowerCase();
    return (projectsList as any[]).filter((p: any) => p.name?.toLowerCase().includes(s));
  }, [projectsList, debouncedSearch]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("projects.title")}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{projectsList.length} {t("projects.title").toLowerCase()}</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 me-1.5" />{t("projects.addNew")}</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{t("projects.addNew")}</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); if (!form.clientId) { toast.error("Select a client"); return; } createMutation.mutate(form as any); }} className="space-y-4">
              <div className="space-y-1.5">
                <Label>{t("projects.client")} *</Label>
                <Select value={form.clientId ? String(form.clientId) : ""} onValueChange={(v) => setForm({ ...form, clientId: Number(v) })}>
                  <SelectTrigger><SelectValue placeholder={t("projects.selectClient")} /></SelectTrigger>
                  <SelectContent>
                    {(clientsList as any[]).map((c: any) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.name}{c.companyName ? ` — ${c.companyName}` : ""}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t("projects.name")} *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required maxLength={255} />
              </div>
              <div className="space-y-1.5">
                <Label>{t("projects.service")} *</Label>
                <Select value={form.serviceType} onValueChange={(v: any) => setForm({ ...form, serviceType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SERVICE_TYPES.map(s => (
                      <SelectItem key={s} value={s}>{t(`service.${s}`)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t("projects.description")}</Label>
                <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <Button type="submit" className="w-full" disabled={!form.clientId || !form.name || createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin me-1.5" />}
                {t("common.create")}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder={t("projects.search")} value={search} onChange={(e) => setSearch(e.target.value)} className="ps-9" aria-label="Search projects" />
      </div>

      {isLoading ? (
        <PageSkeleton />
      ) : filtered.length === 0 ? (
        search ? (
          <Card className="shadow-sm">
            <CardContent className="py-12 text-center text-muted-foreground">
              <FolderKanban className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">{t("common.noResults")}</p>
            </CardContent>
          </Card>
        ) : (
          <EmptyState type="projects" onAction={() => setDialogOpen(true)} />
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((project: any) => {
            const client = (clientsList as any[]).find((c: any) => c.id === project.clientId);
            return (
              <Card key={project.id} className="shadow-sm hover:shadow-md transition-all cursor-pointer group" onClick={() => setLocation(`/projects/${project.id}`)} role="button" tabIndex={0} aria-label={`${project.name} — ${t(`stage.${project.stage}`)}`} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setLocation(`/projects/${project.id}`); } }}>
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <p className="font-medium truncate group-hover:text-primary transition-colors">{project.name}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {client?.companyName || client?.name || "—"} · {t(`service.${project.serviceType}`)}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Badge className={`${stageColors[project.stage]} border-0 text-xs`}>
                        {t(`stage.${project.stage}`)}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{project.price ? `${Number(project.price).toLocaleString()} ${t("common.egp")}` : ""}</span>
                      <Badge className={`${statusColors[project.status ?? "active"]} border-0 text-xs`}>
                        {t(`status.${project.status ?? "active"}`)}
                    </Badge>
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
