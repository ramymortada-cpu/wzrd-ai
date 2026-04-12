import { lazy } from "react";
import { Route, Switch } from "wouter";
import { Suspense } from "react";
import { PageSkeleton, DetailPageSkeleton, ChatSkeleton } from "@/components/PageSkeleton";
import AgencyLayout from "@/components/AgencyLayout";
import CommandCenterGuard from "@/components/CommandCenterGuard";
import NotFound from "@/pages/NotFound";

const Home = lazy(() => import("@/pages/Home"));
const ClientsPage = lazy(() => import("@/pages/Clients"));
const ClientDetailPage = lazy(() => import("@/pages/ClientDetail"));
const ProjectsPage = lazy(() => import("@/pages/Projects"));
const ProjectDetailPage = lazy(() => import("@/pages/ProjectDetail"));
const DeliverablesPage = lazy(() => import("@/pages/Deliverables"));
const NotesPage = lazy(() => import("@/pages/Notes"));
const FinancialsPage = lazy(() => import("@/pages/Financials"));
const AIEnginePage = lazy(() => import("@/pages/AIEngine"));
const ProposalsPage = lazy(() => import("@/pages/Proposals"));
const ProposalDetailPage = lazy(() => import("@/pages/ProposalDetail"));
const ContractsPage = lazy(() => import("@/pages/Contracts"));
const InvoicesPage = lazy(() => import("@/pages/Invoices"));
const AnalyticsPage = lazy(() => import("@/pages/Analytics"));
const PlaybooksPage = lazy(() => import("@/pages/Playbooks"));
const OnboardingPage = lazy(() => import("@/pages/Onboarding"));
const PortalManagementPage = lazy(() => import("@/pages/PortalManagement"));
const ResearchEnginePage = lazy(() => import("@/pages/ResearchEngine"));
const KnowledgeBasePage = lazy(() => import("@/pages/KnowledgeBase"));
const PipelinePage = lazy(() => import("@/pages/Pipeline"));
const BrandTwinPage = lazy(() => import("@/pages/BrandTwin"));
const LeadsPage = lazy(() => import("@/pages/Leads"));
const SalesFunnelPage = lazy(() => import("@/pages/SalesFunnel"));

function S({ children, detail, chat }: { children: React.ReactNode; detail?: boolean; chat?: boolean }) {
  return (
    <Suspense fallback={chat ? <ChatSkeleton /> : detail ? <DetailPageSkeleton /> : <PageSkeleton />}>
      {children}
    </Suspense>
  );
}

export default function AgencyRoutes() {
  return (
    <AgencyLayout>
      <Switch>
        <Route path="/cc/dashboard">{() => <S><Home /></S>}</Route>
        <Route path="/cc/clients">{() => <S><ClientsPage /></S>}</Route>
        <Route path="/cc/clients/:id">{() => <S detail><ClientDetailPage /></S>}</Route>
        <Route path="/cc/projects">{() => <S><ProjectsPage /></S>}</Route>
        <Route path="/cc/projects/:id">{() => <S detail><ProjectDetailPage /></S>}</Route>
        <Route path="/cc/deliverables">{() => <S><DeliverablesPage /></S>}</Route>
        <Route path="/cc/notes">{() => <S><NotesPage /></S>}</Route>
        <Route path="/cc/financials">{() => <S><FinancialsPage /></S>}</Route>
        <Route path="/cc/ai">{() => (
          <CommandCenterGuard>
            <S chat><AIEnginePage /></S>
          </CommandCenterGuard>
        )}</Route>
        <Route path="/cc/proposals">{() => <S><ProposalsPage /></S>}</Route>
        <Route path="/cc/proposals/:id">{() => <S detail><ProposalDetailPage /></S>}</Route>
        <Route path="/cc/contracts">{() => <S><ContractsPage /></S>}</Route>
        <Route path="/cc/invoices">{() => <S><InvoicesPage /></S>}</Route>
        <Route path="/cc/analytics">{() => <S><AnalyticsPage /></S>}</Route>
        <Route path="/cc/playbooks">{() => <S><PlaybooksPage /></S>}</Route>
        <Route path="/cc/onboarding">{() => <S><OnboardingPage /></S>}</Route>
        <Route path="/cc/portal-management">{() => <S><PortalManagementPage /></S>}</Route>
        <Route path="/cc/research">{() => (
          <CommandCenterGuard>
            <S><ResearchEnginePage /></S>
          </CommandCenterGuard>
        )}</Route>
        <Route path="/cc/knowledge">{() => (
          <CommandCenterGuard>
            <S><KnowledgeBasePage /></S>
          </CommandCenterGuard>
        )}</Route>
        <Route path="/cc/pipeline">{() => (
          <CommandCenterGuard>
            <S><PipelinePage /></S>
          </CommandCenterGuard>
        )}</Route>
        <Route path="/cc/brand-twin">{() => (
          <CommandCenterGuard>
            <S><BrandTwinPage /></S>
          </CommandCenterGuard>
        )}</Route>
        <Route path="/cc/leads">{() => <S><LeadsPage /></S>}</Route>
        <Route path="/cc/sales-funnel">{() => <S><SalesFunnelPage /></S>}</Route>
        <Route component={NotFound} />
      </Switch>
    </AgencyLayout>
  );
}
