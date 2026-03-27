import { EmptyState } from "@/components/EmptyState";
import { PageSkeleton } from "@/components/PageSkeleton";
import { useDebounce } from "@/hooks/useDebounce";
import { trpc, type RouterOutputs } from "@/lib/trpc";
import type { ClientListItem, NoteCreateCategory, NoteListItem, ProjectListItem } from "@/lib/routerTypes";
import { useI18n } from "@/lib/i18n";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Plus, Search, StickyNote, Sparkles, Loader2, Brain } from "lucide-react";
import { useState, useMemo } from "react";
import { Streamdown } from "streamdown";
import { paginatedData } from "@/lib/utils";

const CATEGORIES = ["diagnostic", "strategic", "meeting", "insight", "general"] as const satisfies readonly NoteCreateCategory[];

const categoryColors: Record<string, string> = {
  diagnostic: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  strategic: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  meeting: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  insight: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  general: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
};

type NotesListData = RouterOutputs["notes"]["list"];

export default function NotesPage() {
  const { t } = useI18n();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [analyzeDialogOpen, setAnalyzeDialogOpen] = useState(false);
  const [analyzeResult, setAnalyzeResult] = useState("");
  const [viewNote, setViewNote] = useState<{ title: string; content: string } | null>(null);
  const [form, setForm] = useState({
    clientId: 0,
    projectId: undefined as number | undefined,
    title: "",
    content: "",
    category: "general" as NoteCreateCategory,
  });

  const utils = trpc.useUtils();
  const { data: projects } = trpc.projects.list.useQuery();
  const { data: clients } = trpc.clients.list.useQuery();
  const { data: notes, isLoading } = trpc.notes.list.useQuery();
  const debouncedSearch = useDebounce(search, 300);

  const createMutation = trpc.notes.create.useMutation({
    onMutate: async (newNote) => {
      await utils.notes.list.cancel();
      const previous = utils.notes.list.getData();
      utils.notes.list.setData(undefined, (old: NotesListData | undefined) => {
        if (!old?.data) return old;
        const temp = { id: -Date.now(), ...newNote, createdAt: new Date(), updatedAt: new Date() } as NotesListData["data"][number];
        return { ...old, data: [temp, ...old.data] };
      });
      return { previous };
    },
    onSuccess: () => {
      utils.notes.list.invalidate();
      setDialogOpen(false);
      setForm({ clientId: 0, projectId: undefined, title: "", content: "", category: "general" });
      toast.success(t("common.success"));
    },
    onError: (err, _, context) => {
      if (context?.previous) utils.notes.list.setData(undefined, context.previous);
      toast.error(err.message);
    },
  });

  const analyzeMutation = trpc.ai.analyzeNotes.useMutation({
    onSuccess: (result: { analysis: string | unknown[] }) => {
      const text = typeof result.analysis === "string" ? result.analysis : Array.isArray(result.analysis) ? (result.analysis as { text?: string }[]).map((c) => c.text ?? "").join("") : "";
      setAnalyzeResult(text);
      setAnalyzeDialogOpen(true);
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : String(err)),
  });

  const notesList = paginatedData(notes);
  const filtered = useMemo(() => {
    if (!notesList.length) return [];
    if (!debouncedSearch) return notesList;
    const s = debouncedSearch.toLowerCase();
    return notesList.filter(
      (n: NoteListItem) =>
        n.title?.toLowerCase().includes(s) || n.content?.toLowerCase().includes(s)
    );
  }, [notesList, debouncedSearch]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("notes.title")}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{t("notes.subtitle")}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              const notesText = notesList.map((n: NoteListItem) => `[${n.title ?? ""}] ${n.content ?? ""}`).join("\n\n");
              if (!notesText.trim()) {
                toast.error("No notes to analyze");
                return;
              }
              analyzeMutation.mutate({ notes: notesText });
            }}
            disabled={analyzeMutation.isPending || !notesList.length}
          >
            {analyzeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin me-1.5" /> : <Brain className="h-4 w-4 me-1.5" />}
            {t("notes.aiAnalysis")}
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 me-1.5" />{t("notes.addNew")}</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>{t("notes.addNew")}</DialogTitle></DialogHeader>
              <form onSubmit={(e) => {
                e.preventDefault();
                if (!form.clientId) { toast.error("Select a client"); return; }
                createMutation.mutate(form);
              }} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>{t("notes.client")} *</Label>
                    <Select value={form.clientId ? String(form.clientId) : ""} onValueChange={(v) => setForm({ ...form, clientId: Number(v) })}>
                      <SelectTrigger><SelectValue placeholder={t("projects.selectClient")} /></SelectTrigger>
                      <SelectContent>
                        {paginatedData(clients).map((c: ClientListItem) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t("notes.project")}</Label>
                    <Select value={form.projectId ? String(form.projectId) : "none"} onValueChange={(v) => setForm({ ...form, projectId: v === "none" ? undefined : Number(v) })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">—</SelectItem>
                        {paginatedData(projects).filter((p: ProjectListItem) => p.clientId === form.clientId).map((p: ProjectListItem) => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>{t("notes.category")}</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as NoteCreateCategory })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{t(`category.${c}`)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>{t("notes.noteTitle")} *</Label>
                  <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required maxLength={500} />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("notes.content")} *</Label>
                  <Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={5} required maxLength={10000} />
                </div>
                <Button type="submit" className="w-full" disabled={!form.clientId || createMutation.isPending}>
                  {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin me-1.5" />}
                  {t("common.create")}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder={t("notes.search")} value={search} onChange={(e) => setSearch(e.target.value)} className="ps-9" aria-label="Search notes" />
      </div>

      {isLoading ? (
        <PageSkeleton />
      ) : filtered.length === 0 ? (
        search ? (
          <Card className="shadow-sm">
            <CardContent className="py-12 text-center text-muted-foreground">
              <StickyNote className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">{t("common.noResults")}</p>
            </CardContent>
          </Card>
        ) : (
          <EmptyState type="notes" onAction={() => setDialogOpen(true)} />
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((note: NoteListItem) => {
            const project = paginatedData(projects).find((p: ProjectListItem) => p.id === note.projectId);
            const client = paginatedData(clients).find((c: ClientListItem) => c.id === note.clientId);
            return (
              <Card key={note.id} className="shadow-sm hover:shadow-md transition-all cursor-pointer" onClick={() => setViewNote({ title: note.title ?? "", content: note.content ?? "" })}>
                <CardContent className="pt-5 pb-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium text-sm truncate">{note.title}</p>
                    <Badge className={`${categoryColors[note.category] || categoryColors.general} border-0 text-xs shrink-0`}>
                      {t(`category.${note.category ?? "general"}`)}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-3">{note.content}</p>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1">
                    <span>{client?.name || "—"} {project ? `/ ${project.name}` : ""}</span>
                    <span>{note.createdAt ? new Date(note.createdAt).toLocaleDateString() : ""}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* View Note Dialog */}
      <Dialog open={viewNote !== null} onOpenChange={(open) => { if (!open) setViewNote(null); }}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader><DialogTitle>{viewNote?.title}</DialogTitle></DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="prose prose-sm dark:prose-invert max-w-none p-1">
              <Streamdown>{viewNote?.content || ""}</Streamdown>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* AI Analysis Dialog */}
      <Dialog open={analyzeDialogOpen} onOpenChange={setAnalyzeDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> {t("notes.aiAnalysis")}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="prose prose-sm dark:prose-invert max-w-none p-1">
              <Streamdown>{analyzeResult}</Streamdown>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
