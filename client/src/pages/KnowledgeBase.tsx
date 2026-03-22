import { EmptyState } from "@/components/EmptyState";
import { PageSkeleton } from "@/components/PageSkeleton";
import { useDebounce } from "@/hooks/useDebounce";
import { useState, useMemo } from "react";
import { useI18n } from "@/lib/i18n";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Brain, Plus, Search, BookOpen, Lightbulb, Target, Users, FileText,
  Trash2, Edit, Download, Upload, Sparkles, Filter, Tag, Database,
  TrendingUp, Eye, BarChart3, ArrowRight
} from "lucide-react";

const CATEGORIES = [
  { value: "case_study", label: "Case Study", icon: BookOpen, color: "bg-blue-100 text-blue-700" },
  { value: "framework", label: "Framework", icon: Target, color: "bg-purple-100 text-purple-700" },
  { value: "lesson_learned", label: "Lesson Learned", icon: Lightbulb, color: "bg-amber-100 text-amber-700" },
  { value: "market_insight", label: "Market Insight", icon: TrendingUp, color: "bg-green-100 text-green-700" },
  { value: "competitor_intel", label: "Competitor Intel", icon: Eye, color: "bg-red-100 text-red-700" },
  { value: "client_pattern", label: "Client Pattern", icon: Users, color: "bg-indigo-100 text-indigo-700" },
  { value: "methodology", label: "Methodology", icon: Brain, color: "bg-pink-100 text-pink-700" },
  { value: "template", label: "Template", icon: FileText, color: "bg-slate-100 text-slate-700" },
  { value: "general", label: "General", icon: Database, color: "bg-gray-100 text-gray-700" },
];

const SOURCE_LABELS: Record<string, string> = {
  manual: "Manual",
  research_import: "Research Import",
  ai_generated: "AI Generated",
  conversation_extract: "Conversation Extract",
};

export default function KnowledgeBasePage() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState("browse");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formCategory, setFormCategory] = useState("general");
  const [formIndustry, setFormIndustry] = useState("");
  const [formMarket, setFormMarket] = useState("");
  const [formTags, setFormTags] = useState("");

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const entriesQuery = trpc.knowledge.list.useQuery({
    search: debouncedSearchQuery || undefined,
    category: filterCategory || undefined,
  });
  const statsQuery = trpc.knowledge.stats.useQuery();
  const researchReportsQuery = trpc.research.list.useQuery();

  const createMutation = trpc.knowledge.create.useMutation({
    onSuccess: () => {
      toast.success("Knowledge entry created!");
      setShowCreateDialog(false);
      resetForm();
      entriesQuery.refetch();
      statsQuery.refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.knowledge.update.useMutation({
    onSuccess: () => {
      toast.success("Entry updated!");
      setShowEditDialog(false);
      entriesQuery.refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.knowledge.delete.useMutation({
    onSuccess: () => {
      toast.success("Entry deleted!");
      entriesQuery.refetch();
      statsQuery.refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const importMutation = trpc.knowledge.importFromResearch.useMutation({
    onSuccess: (data) => {
      toast.success(`Imported ${data.imported} entries from research!`);
      entriesQuery.refetch();
      statsQuery.refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const resetForm = () => {
    setFormTitle("");
    setFormContent("");
    setFormCategory("general");
    setFormIndustry("");
    setFormMarket("");
    setFormTags("");
  };

  const handleCreate = () => {
    createMutation.mutate({
      title: formTitle,
      content: formContent,
      category: formCategory as any,
      industry: formIndustry || undefined,
      market: formMarket || undefined,
      tags: formTags ? formTags.split(",").map(t => t.trim()).filter(Boolean) : undefined,
    });
  };

  const handleEdit = () => {
    if (!selectedEntry) return;
    updateMutation.mutate({
      id: selectedEntry.id,
      title: formTitle,
      content: formContent,
      category: formCategory as any,
      industry: formIndustry || undefined,
      market: formMarket || undefined,
      tags: formTags ? formTags.split(",").map(t => t.trim()).filter(Boolean) : undefined,
    });
  };

  const openEditDialog = (entry: any) => {
    setSelectedEntry(entry);
    setFormTitle(entry.title);
    setFormContent(entry.content);
    setFormCategory(entry.category);
    setFormIndustry(entry.industry || "");
    setFormMarket(entry.market || "");
    setFormTags((entry.tags || []).join(", "));
    setShowEditDialog(true);
  };

  const entries = entriesQuery.data || [];
  const stats = statsQuery.data;
  const researchReports = researchReportsQuery.data || [];

  const getCategoryInfo = (cat: string) => CATEGORIES.find(c => c.value === cat) || CATEGORIES[CATEGORIES.length - 1];

  if (entriesQuery.isLoading) return <PageSkeleton />;

  return (
    <div className="container max-w-7xl px-3 sm:px-6 py-6 sm:py-8 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl text-white">
              <Brain className="h-7 w-7" />
            </div>
            {t("nav.knowledge") || "Knowledge Base"}
          </h1>
          <p className="text-muted-foreground mt-1">
            The AI Brain's memory — every insight makes Wzrd AI smarter
          </p>
        </div>
        <Button onClick={() => { resetForm(); setShowCreateDialog(true); }} className="gap-2">
          <Plus className="h-4 w-4" /> Add Knowledge
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="border-0 bg-gradient-to-br from-purple-50 to-purple-100">
            <CardContent className="p-4 text-center">
              <div className="text-2xl sm:text-3xl font-bold text-purple-700">{stats.total}</div>
              <div className="text-sm text-purple-600">Total Entries</div>
            </CardContent>
          </Card>
          {Object.entries(stats.byCategory).slice(0, 4).map(([cat, count]) => {
            const info = getCategoryInfo(cat);
            return (
              <Card key={cat} className="border-0 bg-gradient-to-br from-gray-50 to-gray-100">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold">{count as number}</div>
                  <div className="text-sm text-muted-foreground">{info.label}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="browse">Browse Knowledge</TabsTrigger>
          <TabsTrigger value="import">Import from Research</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-4">
          {/* Search & Filter */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search knowledge entries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Entries Grid */}
          {entries.length === 0 ? (
            <EmptyState type="knowledge" onAction={() => { resetForm(); setShowCreateDialog(true); }} />
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {entries.map((entry: any) => {
                const catInfo = getCategoryInfo(entry.category);
                const CatIcon = catInfo.icon;
                return (
                  <Card key={entry.id} className="hover:shadow-md transition-shadow cursor-pointer group" onClick={() => { setSelectedEntry(entry); setShowDetailDialog(true); }}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <Badge variant="secondary" className={`${catInfo.color} gap-1`}>
                          <CatIcon className="h-3 w-3" />
                          {catInfo.label}
                        </Badge>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); openEditDialog(entry); }}>
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={(e) => { e.stopPropagation(); deleteMutation.mutate({ id: entry.id }); }}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      <h3 className="font-semibold text-sm mb-2 line-clamp-2">{entry.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-3">{entry.content}</p>
                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        {entry.industry && <Badge variant="outline" className="text-xs">{entry.industry}</Badge>}
                        {entry.market && <Badge variant="outline" className="text-xs">{entry.market}</Badge>}
                        <Badge variant="outline" className="text-xs">{SOURCE_LABELS[entry.source] || entry.source}</Badge>
                      </div>
                      {entry.tags && (entry.tags as string[]).length > 0 && (
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {(entry.tags as string[]).slice(0, 3).map((tag: string, i: number) => (
                            <span key={i} className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">#{tag}</span>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="import" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Import from Research Reports
              </CardTitle>
              <CardDescription>
                Automatically extract key insights, competitor intelligence, and recommendations from your research reports into the Knowledge Base.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {researchReports.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No research reports available. Run a research first.</p>
              ) : (
                <div className="space-y-3">
                  {researchReports.map((report: any) => (
                    <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div>
                        <div className="font-medium">{report.companyName || 'Unknown'}</div>
                        <div className="text-sm text-muted-foreground">
                          {report.industry} • {report.market} • {report.totalSources || 0} sources
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => importMutation.mutate({ reportId: report.id })}
                        disabled={importMutation.isPending}
                      >
                        <Sparkles className="h-4 w-4" />
                        Import Insights
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" /> Add Knowledge Entry
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Title" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} />
            <Textarea placeholder="Content — share your insight, lesson, or knowledge..." value={formContent} onChange={(e) => setFormContent(e.target.value)} rows={6} />
            <div className="grid grid-cols-2 gap-3">
              <Select value={formCategory} onValueChange={setFormCategory}>
                <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input placeholder="Industry (optional)" value={formIndustry} onChange={(e) => setFormIndustry(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Market (optional)" value={formMarket} onChange={(e) => setFormMarket(e.target.value)} />
              <Input placeholder="Tags (comma-separated)" value={formTags} onChange={(e) => setFormTags(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!formTitle || !formContent || createMutation.isPending}>
              {createMutation.isPending ? "Saving..." : "Save Entry"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" /> Edit Knowledge Entry
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Title" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} />
            <Textarea placeholder="Content" value={formContent} onChange={(e) => setFormContent(e.target.value)} rows={6} />
            <div className="grid grid-cols-2 gap-3">
              <Select value={formCategory} onValueChange={setFormCategory}>
                <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input placeholder="Industry" value={formIndustry} onChange={(e) => setFormIndustry(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Market" value={formMarket} onChange={(e) => setFormMarket(e.target.value)} />
              <Input placeholder="Tags (comma-separated)" value={formTags} onChange={(e) => setFormTags(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
            <Button onClick={handleEdit} disabled={!formTitle || !formContent || updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Update Entry"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          {selectedEntry && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={getCategoryInfo(selectedEntry.category).color}>
                    {getCategoryInfo(selectedEntry.category).label}
                  </Badge>
                  <Badge variant="outline">{SOURCE_LABELS[selectedEntry.source] || selectedEntry.source}</Badge>
                </div>
                <DialogTitle>{selectedEntry.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-wrap">{selectedEntry.content}</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {selectedEntry.industry && <Badge variant="outline">{selectedEntry.industry}</Badge>}
                  {selectedEntry.market && <Badge variant="outline">{selectedEntry.market}</Badge>}
                  {selectedEntry.tags && (selectedEntry.tags as string[]).map((tag: string, i: number) => (
                    <Badge key={i} variant="secondary">#{tag}</Badge>
                  ))}
                </div>
                <div className="text-xs text-muted-foreground">
                  Created: {new Date(selectedEntry.createdAt).toLocaleDateString()} • Updated: {new Date(selectedEntry.updatedAt).toLocaleDateString()}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setShowDetailDialog(false); openEditDialog(selectedEntry); }}>
                  <Edit className="h-4 w-4 mr-2" /> Edit
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
