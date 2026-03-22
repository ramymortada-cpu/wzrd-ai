import { PageSkeleton } from "@/components/PageSkeleton";
import { trpc } from "@/lib/trpc";
import { useI18n } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { paginatedData } from "@/lib/utils";
import {
  Link2, Copy, Loader2, Shield, Plus, ExternalLink, Trash2, Eye
} from "lucide-react";

export default function PortalManagementPage() {
  const { locale } = useI18n();
  const isAr = locale === "ar";

  const { data: projects, isLoading } = trpc.projects.list.useQuery();
  const { data: clients } = trpc.clients.list.useQuery();
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createProjectId, setCreateProjectId] = useState<string>("");
  const [createClientId, setCreateClientId] = useState<string>("");

  const projectId = selectedProjectId ? parseInt(selectedProjectId) : undefined;
  const { data: tokens, refetch: refetchTokens } = trpc.portal.getLinks.useQuery(
    { projectId: projectId! },
    { enabled: !!projectId }
  );

  const createToken = trpc.portal.generateLink.useMutation({
    onSuccess: (data: { token: string }) => {
      const portalUrl = `${window.location.origin}/portal/${data.token}`;
      navigator.clipboard.writeText(portalUrl);
      toast.success(isAr ? "تم إنشاء الرابط ونسخه!" : "Portal link created and copied!");
      refetchTokens();
      setCreateDialogOpen(false);
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : String(err)),
  });

  const deactivateToken = trpc.portal.deactivateLink.useMutation({
    onSuccess: () => {
      toast.success(isAr ? "تم إلغاء تنشيط الرابط" : "Link deactivated");
      refetchTokens();
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : String(err)),
  });

  const projectsList = paginatedData(projects);
  const clientsList = paginatedData(clients);
  const projectsWithClients = useMemo(() => {
    if (!projectsList.length || !clientsList.length) return [];
    return (projectsList as any[]).map((p: any) => ({
      ...p,
      clientName: (clientsList as any[]).find((c: any) => c.id === p.clientId)?.name ?? (clientsList as any[]).find((c: any) => c.id === p.clientId)?.companyName ?? "Unknown",
    }));
  }, [projectsList, clientsList]);

  const handleCreateToken = () => {
    if (!createProjectId || !createClientId) {
      toast.error(isAr ? "يرجى اختيار المشروع والعميل" : "Please select project and client");
      return;
    }
    createToken.mutate({ projectId: parseInt(createProjectId), clientId: parseInt(createClientId) });
  };

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/portal/${token}`;
    navigator.clipboard.writeText(url);
    toast.success(isAr ? "تم نسخ الرابط" : "Link copied to clipboard");
  };

  if (isLoading) return <PageSkeleton />;

  return (
    <div className="space-y-4 sm:space-y-6 px-1 sm:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            {isAr ? "بوابة العميل" : "Client Portal"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isAr ? "إدارة روابط الوصول الآمنة للعملاء لمتابعة مشاريعهم" : "Manage secure access links for clients to track their projects"}
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              {isAr ? "رابط جديد" : "New Portal Link"}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isAr ? "إنشاء رابط بوابة عميل" : "Create Client Portal Link"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>{isAr ? "المشروع" : "Project"}</Label>
                <Select value={createProjectId} onValueChange={v => {
                  setCreateProjectId(v);
                  // Auto-select client
                  const proj = (projectsList as any[]).find((p: any) => p.id === parseInt(v));
                  if (proj) setCreateClientId(String(proj.clientId));
                }}>
                  <SelectTrigger><SelectValue placeholder={isAr ? "اختر مشروع" : "Select project"} /></SelectTrigger>
                  <SelectContent>
                    {projectsWithClients.map((p: any) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.name} ({p.clientName})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{isAr ? "العميل" : "Client"}</Label>
                <Select value={createClientId} onValueChange={setCreateClientId}>
                  <SelectTrigger><SelectValue placeholder={isAr ? "اختر عميل" : "Select client"} /></SelectTrigger>
                  <SelectContent>
                    {clientsList.map((c: { id: number; companyName?: string | null; name?: string | null }) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.companyName || c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreateToken} disabled={createToken.isPending} className="w-full gap-2">
                {createToken.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                {isAr ? "إنشاء ونسخ الرابط" : "Create & Copy Link"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Project Filter */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <Label className="whitespace-nowrap">{isAr ? "تصفية حسب المشروع:" : "Filter by project:"}</Label>
            <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
              <SelectTrigger className="max-w-sm"><SelectValue placeholder={isAr ? "اختر مشروع لعرض الروابط" : "Select project to view links"} /></SelectTrigger>
              <SelectContent>
                {projectsWithClients.map((p: any) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.name} ({p.clientName})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tokens List */}
      {projectId && tokens && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {isAr ? "روابط البوابة" : "Portal Links"}
              <Badge variant="secondary" className="ms-2">{tokens.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tokens.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Link2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>{isAr ? "لا توجد روابط لهذا المشروع" : "No portal links for this project"}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tokens.map((t: any) => (
                  <div key={t.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-lg border">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-muted px-2 py-0.5 rounded truncate max-w-[200px]">
                          {t.token.substring(0, 16)}...
                        </code>
                        <Badge variant={t.isActive ? "default" : "secondary"}>
                          {t.isActive ? (isAr ? "نشط" : "Active") : (isAr ? "معطل" : "Inactive")}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        {t.expiresAt && (
                          <span>{isAr ? "ينتهي:" : "Expires:"} {new Date(t.expiresAt).toLocaleDateString()}</span>
                        )}
                        {t.lastAccessedAt && (
                          <span>{isAr ? "آخر وصول:" : "Last accessed:"} {new Date(t.lastAccessedAt).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => copyLink(t.token)} title={isAr ? "نسخ الرابط" : "Copy link"}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => window.open(`/portal/${t.token}`, '_blank')} title={isAr ? "فتح البوابة" : "Open portal"}>
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      {t.isActive && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deactivateToken.mutate({ id: t.id })}
                          title={isAr ? "إلغاء التنشيط" : "Deactivate"}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!projectId && (
        <Card>
          <CardContent className="py-12 text-center">
            <Eye className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-muted-foreground">
              {isAr ? "اختر مشروع لعرض وإدارة روابط البوابة" : "Select a project to view and manage portal links"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
