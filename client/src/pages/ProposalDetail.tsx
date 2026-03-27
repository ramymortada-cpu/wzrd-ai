import { trpc } from "@/lib/trpc";
import { useI18n } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { paginatedData } from "@/lib/utils";
import { useRoute, useLocation } from "wouter";
import { useState, useRef } from "react";
import {
  ArrowLeft, Download, Edit3, Eye, RefreshCw, Loader2, Check,
  FileText, Link
} from "lucide-react";
import { Streamdown } from "streamdown";
import type { ProposalDetailRow } from "@/lib/routerTypes";

const SECTIONS = [
  "executiveSummary",
  "clientBackground",
  "serviceDescription",
  "methodology",
  "deliverables",
  "timeline",
  "investment",
  "whyPrimoMarca",
  "terms",
] as const;

type SectionKey = (typeof SECTIONS)[number];

const PROPOSAL_STATUSES = ["draft", "sent", "accepted", "rejected"] as const;
type ProposalStatusUi = (typeof PROPOSAL_STATUSES)[number];

function proposalSectionMarkdown(proposal: ProposalDetailRow, key: SectionKey): string {
  const v = proposal[key];
  return typeof v === "string" ? v : "";
}

function parseProposalStatus(v: string): ProposalStatusUi | null {
  return (PROPOSAL_STATUSES as readonly string[]).includes(v) ? (v as ProposalStatusUi) : null;
}

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
  sent: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  accepted: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export default function ProposalDetailPage() {
  const { t } = useI18n();
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/proposals/:id");
  const proposalId = Number(params?.id);

  const [editingSection, setEditingSection] = useState<SectionKey | null>(null);
  const [editContent, setEditContent] = useState("");
  const [regeneratingSection, setRegeneratingSection] = useState<SectionKey | null>(null);
  const [viewMode, setViewMode] = useState<"preview" | "edit">("preview");
  const printRef = useRef<HTMLDivElement>(null);

  const utils = trpc.useUtils();
  const { data: proposal, isLoading } = trpc.proposals.getById.useQuery(
    { id: proposalId },
    { enabled: !!proposalId }
  );
  const { data: clientsRaw } = trpc.clients.list.useQuery();
  const clients = paginatedData(clientsRaw);

  const updateMutation = trpc.proposals.update.useMutation({
    onSuccess: () => {
      utils.proposals.getById.invalidate({ id: proposalId });
      utils.proposals.list.invalidate();
      toast.success(t("common.success"));
      setEditingSection(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const regenerateMutation = trpc.proposals.regenerateSection.useMutation({
    onSuccess: () => {
      utils.proposals.getById.invalidate({ id: proposalId });
      setRegeneratingSection(null);
      toast.success(t("common.success"));
    },
    onError: (err: unknown) => {
      setRegeneratingSection(null);
      toast.error(err instanceof Error ? err.message : String(err));
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
        <p>Proposal not found</p>
        <Button variant="outline" className="mt-4" onClick={() => setLocation("/proposals")}>
          <ArrowLeft className="h-4 w-4 me-1.5" />{t("common.back")}
        </Button>
      </div>
    );
  }

  const client = clients.find((c) => c.id === proposal.clientId);

  const handleSaveSection = (section: SectionKey) => {
    updateMutation.mutate({
      id: proposalId,
      [section]: editContent,
    });
  };

  const handleRegenerateSection = (section: SectionKey) => {
    setRegeneratingSection(section);
    regenerateMutation.mutate({
      proposalId,
      section,
    });
  };

  const handleStatusChange = (status: "draft" | "sent" | "accepted" | "rejected") => {
    updateMutation.mutate({ id: proposalId, status });
  };

  const handlePrint = () => {
    // Open a new window with the proposal content for printing/PDF
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to download PDF');
      return;
    }

    const isArabic = proposal.language === 'ar';
    const dir = isArabic ? 'rtl' : 'ltr';
    const fontFamily = isArabic ? "'Segoe UI', 'Arial', sans-serif" : "'Segoe UI', 'Georgia', serif";

    const sections = SECTIONS.map(key => {
      const content = proposalSectionMarkdown(proposal, key);
      if (!content) return '';
      const title = t(`proposals.${key}`);
      return `<div class="section">
        <h2>${title}</h2>
        <div class="content">${markdownToHtml(content)}</div>
      </div>`;
    }).filter(Boolean).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="${dir}" lang="${proposal.language}">
      <head>
        <meta charset="utf-8">
        <title>${proposal.title}</title>
        <style>
          @page { margin: 2cm; size: A4; }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: ${fontFamily};
            color: #333;
            line-height: 1.7;
            direction: ${dir};
            padding: 0;
          }
          .cover {
            text-align: center;
            padding: 80px 40px;
            page-break-after: always;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
          }
          .cover .logo-text {
            font-size: 14px;
            letter-spacing: 4px;
            text-transform: uppercase;
            color: #8F5A31;
            margin-bottom: 60px;
            font-weight: 600;
          }
          .cover .tagline {
            font-size: 12px;
            color: #8F5A31;
            letter-spacing: 2px;
            margin-bottom: 80px;
          }
          .cover h1 {
            font-size: 32px;
            color: #4C4C54;
            margin-bottom: 16px;
            font-weight: 700;
          }
          .cover .client-name {
            font-size: 20px;
            color: #8F5A31;
            margin-bottom: 8px;
          }
          .cover .service-name {
            font-size: 16px;
            color: #666;
            margin-bottom: 40px;
          }
          .cover .date {
            font-size: 14px;
            color: #999;
          }
          .cover .price-tag {
            font-size: 24px;
            color: #8F5A31;
            font-weight: 700;
            margin-top: 30px;
            padding: 12px 30px;
            border: 2px solid #8F5A31;
            border-radius: 8px;
          }
          .section {
            margin-bottom: 30px;
            page-break-inside: avoid;
          }
          .section h2 {
            font-size: 20px;
            color: #8F5A31;
            border-bottom: 2px solid #E8E5C5;
            padding-bottom: 8px;
            margin-bottom: 16px;
            font-weight: 600;
          }
          .content { font-size: 14px; }
          .content p { margin-bottom: 12px; }
          .content ul, .content ol { padding-${isArabic ? 'right' : 'left'}: 24px; margin-bottom: 12px; }
          .content li { margin-bottom: 6px; }
          .content strong { color: #4C4C54; }
          .content h3 { font-size: 16px; color: #4C4C54; margin: 16px 0 8px; }
          .content h4 { font-size: 14px; color: #8F5A31; margin: 12px 0 6px; }
          .footer {
            text-align: center;
            padding: 30px;
            color: #999;
            font-size: 12px;
            border-top: 1px solid #E8E5C5;
            margin-top: 40px;
          }
          .footer .brand { color: #8F5A31; font-weight: 600; }
          @media print {
            body { padding: 0; }
            .cover { padding: 60px 20px; }
          }
        </style>
      </head>
      <body>
        <div class="cover">
          <div class="logo-text">Wzrd AI</div>
          <div class="tagline">${isArabic ? 'مستشارك الاستراتيجي الذكي' : 'Your AI Strategy Partner'}</div>
          <h1>${proposal.title}</h1>
          <div class="client-name">${isArabic ? 'مُعد لـ' : 'Prepared for'}: ${client?.companyName || client?.name || ''}</div>
          <div class="service-name">${t(`service.${proposal.serviceType}`)}</div>
          <div class="price-tag">${Number(proposal.price).toLocaleString()} ${isArabic ? 'ج.م' : 'EGP'}</div>
          <div class="date">${new Date(proposal.createdAt).toLocaleDateString(proposal.language === 'ar' ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </div>
        ${sections}
        <div class="footer">
          <div class="brand">Wzrd AI</div>
          <div>${isArabic ? '"الذكاء الاستراتيجي يصنع الفرق"' : '"Strategic Intelligence Makes the Difference"'}</div>
          <div style="margin-top: 8px;">${isArabic ? 'هذا العرض سري ومُعد حصرياً لـ' : 'This proposal is confidential and prepared exclusively for'} ${client?.companyName || client?.name || ''}</div>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" className="mt-1" onClick={() => setLocation("/proposals")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{proposal.title}</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {client?.companyName || client?.name || "—"} · {t(`service.${proposal.serviceType}`)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={`${statusColors[proposal.status]} border-0`}>
            {t(`proposals.${proposal.status}`)}
          </Badge>
        </div>
      </div>

      {/* Action Bar */}
      <Card className="shadow-sm">
        <CardContent className="py-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "preview" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("preview")}
            >
              <Eye className="h-3.5 w-3.5 me-1" />{t("proposals.preview")}
            </Button>
            <Button
              variant={viewMode === "edit" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("edit")}
            >
              <Edit3 className="h-3.5 w-3.5 me-1" />{t("proposals.edit")}
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={proposal.status}
              onValueChange={(v) => {
                const s = parseProposalStatus(v);
                if (s) handleStatusChange(s);
              }}
            >
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">{t("proposals.draft")}</SelectItem>
                <SelectItem value="sent">{t("proposals.sent")}</SelectItem>
                <SelectItem value="accepted">{t("proposals.accepted")}</SelectItem>
                <SelectItem value="rejected">{t("proposals.rejected")}</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" onClick={handlePrint}>
              <Download className="h-3.5 w-3.5 me-1" />{t("proposals.download")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const shareUrl = `${window.location.origin}/proposal-view/${proposalId}`;
                navigator.clipboard.writeText(shareUrl);
                toast.success("Proposal link copied! Share it with the client.");
              }}
            >
              <Link className="h-3.5 w-3.5 me-1" />Share Link
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Proposal Price & Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-sm">
          <CardContent className="py-4 text-center">
            <p className="text-sm text-muted-foreground">{t("proposals.investment")}</p>
            <p className="text-2xl font-bold text-primary mt-1">
              {Number(proposal.price).toLocaleString()} {t("common.egp")}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="py-4 text-center">
            <p className="text-sm text-muted-foreground">{t("proposals.language")}</p>
            <p className="text-lg font-medium mt-1">
              {proposal.language === "ar" ? t("proposals.arabic") : t("proposals.english")}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="py-4 text-center">
            <p className="text-sm text-muted-foreground">{t("projects.service")}</p>
            <p className="text-lg font-medium mt-1">{t(`service.${proposal.serviceType}`)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Proposal Sections */}
      <div ref={printRef} className="space-y-4">
        {SECTIONS.map((sectionKey) => {
          const content = proposalSectionMarkdown(proposal, sectionKey);
          const isEditing = editingSection === sectionKey;
          const isRegenerating = regeneratingSection === sectionKey;

          return (
            <Card key={sectionKey} className="shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold text-primary">
                    {t(`proposals.${sectionKey}`)}
                  </CardTitle>
                  {viewMode === "edit" && (
                    <div className="flex items-center gap-1">
                      {isEditing ? (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingSection(null)}
                          >
                            {t("common.cancel")}
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleSaveSection(sectionKey)}
                            disabled={updateMutation.isPending}
                          >
                            {updateMutation.isPending ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin me-1" />
                            ) : (
                              <Check className="h-3.5 w-3.5 me-1" />
                            )}
                            {t("common.save")}
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingSection(sectionKey);
                              setEditContent(content);
                            }}
                          >
                            <Edit3 className="h-3.5 w-3.5 me-1" />{t("common.edit")}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRegenerateSection(sectionKey)}
                            disabled={isRegenerating}
                          >
                            {isRegenerating ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin me-1" />
                            ) : (
                              <RefreshCw className="h-3.5 w-3.5 me-1" />
                            )}
                            {t("proposals.regenerate")}
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={12}
                    className="font-mono text-sm"
                  />
                ) : content ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none text-foreground">
                    <Streamdown>{content}</Streamdown>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm italic">No content generated for this section.</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// Simple markdown to HTML converter for the print view
function markdownToHtml(md: string): string {
  return md
    .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>[\s\S]*<\/li>)/, '<ul>$1</ul>')
    .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(.+)$/gm, (match) => {
      if (match.startsWith('<')) return match;
      return `<p>${match}</p>`;
    })
    .replace(/<p><\/p>/g, '');
}
