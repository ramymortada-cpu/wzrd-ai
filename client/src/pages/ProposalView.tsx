import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Streamdown } from "streamdown";
import type { LucideIcon } from "lucide-react";
import {
  CheckCircle2, XCircle, FileText, Loader2, Building2,
  Calendar, DollarSign, Clock, Sparkles, Shield, MessageSquare,
} from "lucide-react";
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

const SECTION_LABELS: Record<string, string> = {
  executiveSummary: "Executive Summary",
  clientBackground: "Client Background",
  serviceDescription: "Service Description",
  methodology: "Methodology",
  deliverables: "Deliverables",
  timeline: "Timeline",
  investment: "Investment",
  whyPrimoMarca: "Why WZZRD AI",
  terms: "Terms & Conditions",
};

function proposalSectionMarkdownView(proposal: ProposalDetailRow, key: (typeof SECTIONS)[number]): string {
  const v = proposal[key];
  return typeof v === "string" ? v : "";
}

const SERVICE_LABELS: Record<string, string> = {
  business_health_check: "Business Health Check",
  starting_business_logic: "Clarity Package — Business Logic",
  brand_identity: "Brand Foundation — Full Brand Identity",
  business_takeoff: "Business Takeoff — Complete Launch",
  consultation: "Growth Partnership — Strategic Consultation",
};

const statusConfig: Record<string, { color: string; icon: LucideIcon; label: string }> = {
  draft: { color: "bg-gray-500/10 text-gray-400 border-gray-500/20", icon: FileText, label: "Draft" },
  sent: { color: "bg-blue-500/10 text-blue-400 border-blue-500/20", icon: Clock, label: "Awaiting Response" },
  accepted: { color: "bg-green-500/10 text-green-400 border-green-500/20", icon: CheckCircle2, label: "Accepted" },
  rejected: { color: "bg-red-500/10 text-red-400 border-red-500/20", icon: XCircle, label: "Declined" },
};

export default function ProposalViewPage() {
  const [, params] = useRoute("/proposal-view/:id");
  const proposalId = Number(params?.id);
  const [showAcceptDialog, setShowAcceptDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [signatureName, setSignatureName] = useState("");
  const [signatureTitle, setSignatureTitle] = useState("");
  const [feedback, setFeedback] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const { data: proposal, isLoading } = trpc.proposals.getById.useQuery(
    { id: proposalId },
    { enabled: !!proposalId }
  );

  const acceptMutation = trpc.proposalAcceptance.submit.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      setShowAcceptDialog(false);
      setShowRejectDialog(false);
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center text-white">
        <div className="text-center space-y-4">
          <FileText className="h-16 w-16 mx-auto text-white/20" />
          <h2 className="text-2xl font-bold">Proposal Not Found</h2>
          <p className="text-white/50">This proposal may have been removed or the link is invalid.</p>
        </div>
      </div>
    );
  }

  const status = statusConfig[proposal.status] || statusConfig.draft;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-white/5 backdrop-blur-xl bg-white/[0.02] sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="https://d2xsxph8kpxj0f.cloudfront.net/310519663371561184/TgSL8MhgJ4oMR4dsotVnRS/wzrd-ai-logo_a6bceffd.png"
              alt="Wzrd AI"
              className="w-10 h-10 rounded-lg"
            />
            <div>
              <h1 className="text-lg font-bold tracking-tight">WZZRD AI</h1>
              <p className="text-xs text-white/50">Brand Engineering Proposal</p>
            </div>
          </div>
          <Badge variant="outline" className={`${status.color} text-xs`}>
            {status.label}
          </Badge>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Submitted confirmation */}
        {submitted && (
          <Card className="bg-green-500/10 border-green-500/20 text-white">
            <CardContent className="p-6 text-center space-y-3">
              <CheckCircle2 className="h-12 w-12 mx-auto text-green-400" />
              <h3 className="text-xl font-bold">Thank You!</h3>
              <p className="text-white/70">
                Your response has been recorded. Our team will be in touch shortly.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Proposal Header */}
        <div className="space-y-4">
          <h2 className="text-3xl font-bold tracking-tight">{proposal.title}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
              <div className="flex items-center gap-2 text-white/50 text-xs">
                <DollarSign className="h-3.5 w-3.5" /> Investment
              </div>
              <p className="text-xl font-bold text-amber-400">
                {Number(proposal.price).toLocaleString()} EGP
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
              <div className="flex items-center gap-2 text-white/50 text-xs">
                <Building2 className="h-3.5 w-3.5" /> Service
              </div>
              <p className="text-sm font-medium">
                {SERVICE_LABELS[proposal.serviceType] || proposal.serviceType}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
              <div className="flex items-center gap-2 text-white/50 text-xs">
                <Calendar className="h-3.5 w-3.5" /> Date
              </div>
              <p className="text-sm font-medium">
                {new Date(proposal.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
              <div className="flex items-center gap-2 text-white/50 text-xs">
                <FileText className="h-3.5 w-3.5" /> Language
              </div>
              <p className="text-sm font-medium">
                {proposal.language === "ar" ? "Arabic" : "English"}
              </p>
            </div>
          </div>
        </div>

        {/* Proposal Sections */}
        <div className="space-y-6">
          {SECTIONS.map((sectionKey) => {
            const content = proposalSectionMarkdownView(proposal, sectionKey);
            if (!content) return null;
            return (
              <Card key={sectionKey} className="bg-white/[0.03] border-white/10 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold text-amber-400/80">
                    {SECTION_LABELS[sectionKey]}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm prose-invert max-w-none">
                    <Streamdown>{content}</Streamdown>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Action Buttons (only if proposal is sent and not yet responded) */}
        {proposal.status === "sent" && !submitted && (
          <Card className="bg-white/[0.03] border-white/10 text-white">
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <Sparkles className="h-8 w-8 mx-auto text-amber-400" />
                <h3 className="text-xl font-bold">Ready to Move Forward?</h3>
                <p className="text-white/60 max-w-md mx-auto">
                  Review the proposal above and let us know your decision. We're excited to work together!
                </p>
                <div className="flex items-center justify-center gap-4">
                  <Button
                    size="lg"
                    onClick={() => setShowAcceptDialog(true)}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold gap-2"
                  >
                    <CheckCircle2 className="h-5 w-5" />
                    Accept Proposal
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => setShowRejectDialog(true)}
                    className="border-white/10 text-white hover:bg-white/5 gap-2"
                  >
                    <MessageSquare className="h-5 w-5" />
                    Request Changes
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Accept Dialog */}
        <Dialog open={showAcceptDialog} onOpenChange={setShowAcceptDialog}>
          <DialogContent className="bg-slate-900 border-white/10 text-white">
            <DialogHeader>
              <DialogTitle>Accept Proposal</DialogTitle>
              <DialogDescription className="text-white/50">
                Sign below to confirm your acceptance of this proposal.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-white/70">Your Full Name *</Label>
                <Input
                  maxLength={500}
                  value={signatureName}
                  onChange={(e) => setSignatureName(e.target.value)}
                  placeholder="Enter your full name"
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white/70">Your Title</Label>
                <Input
                  maxLength={500}
                  value={signatureTitle}
                  onChange={(e) => setSignatureTitle(e.target.value)}
                  placeholder="e.g., CEO, Marketing Director"
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white/70">Comments (optional)</Label>
                <Textarea
                  maxLength={5000}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Any additional comments..."
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/10 text-xs text-amber-400/80">
                <Shield className="inline h-3.5 w-3.5 mr-1" />
                By accepting, you agree to the terms outlined in this proposal.
              </div>
              <Button
                onClick={() =>
                  acceptMutation.mutate({
                    proposalId,
                    clientId: proposal.clientId,
                    decision: "accepted",
                    signatureName,
                    signatureTitle,
                    feedback,
                  })
                }
                disabled={!signatureName || acceptMutation.isPending}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold h-12"
              >
                {acceptMutation.isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 mr-2" />
                )}
                Confirm Acceptance
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Reject/Revision Dialog */}
        <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <DialogContent className="bg-slate-900 border-white/10 text-white">
            <DialogHeader>
              <DialogTitle>Request Changes</DialogTitle>
              <DialogDescription className="text-white/50">
                Let us know what changes you'd like to see in this proposal.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-white/70">Your Name *</Label>
                <Input
                  maxLength={500}
                  value={signatureName}
                  onChange={(e) => setSignatureName(e.target.value)}
                  placeholder="Enter your name"
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white/70">Feedback *</Label>
                <Textarea
                  maxLength={5000}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="What changes would you like to see?"
                  rows={4}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() =>
                    acceptMutation.mutate({
                      proposalId,
                      clientId: proposal.clientId,
                      decision: "revision_requested",
                      signatureName,
                      feedback,
                    })
                  }
                  disabled={!signatureName || !feedback || acceptMutation.isPending}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-semibold"
                >
                  {acceptMutation.isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  ) : (
                    <MessageSquare className="h-5 w-5 mr-2" />
                  )}
                  Request Revision
                </Button>
                <Button
                  onClick={() =>
                    acceptMutation.mutate({
                      proposalId,
                      clientId: proposal.clientId,
                      decision: "rejected",
                      signatureName,
                      feedback,
                    })
                  }
                  disabled={!signatureName || acceptMutation.isPending}
                  variant="outline"
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                >
                  <XCircle className="h-5 w-5 mr-2" />
                  Decline
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Footer */}
        <div className="text-center space-y-2 py-8">
          <p className="text-sm text-white/40">
            This proposal was prepared exclusively for you by WZZRD AI.
          </p>
          <p className="text-xs text-white/25">
            Powered by Wzrd AI — Brand Engineering Intelligence
          </p>
        </div>
      </main>
    </div>
  );
}
