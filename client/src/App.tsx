import { lazy, Suspense, useMemo } from 'react';
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { I18nProvider } from "./lib/i18n";
import DashboardLayout from "./components/DashboardLayout";
import CommandCenterGuard from "./components/CommandCenterGuard";
import { PageSkeleton, ChatSkeleton, DetailPageSkeleton } from "./components/PageSkeleton";
import WzrdAppShell from "./components/WzrdAppShell";
import QuickSearch from "./components/QuickSearch";

/** Public WZZRD funnel + tools; Command Center (/dashboard, etc.) stays on default app chrome. */
const WZZRD_PREMIUM_SHELL_RE = new RegExp(
  "^/(?:signup|login|pricing|my-brand|copilot|wzrd-admin|admin|panel|profile|settings|my-requests|quick-check|tools|portal|proposal-view)(?:/|$)"
);

// ============ LAZY-LOADED PAGES ============
// Each page is loaded only when the user navigates to it.
// This reduces the initial bundle size significantly.

const Home = lazy(() => import("./pages/Home"));
const WelcomePage = lazy(() => import("./pages/Welcome"));
const ClientsPage = lazy(() => import("./pages/Clients"));
const ClientDetailPage = lazy(() => import("./pages/ClientDetail"));
const ProjectsPage = lazy(() => import("./pages/Projects"));
const ProjectDetailPage = lazy(() => import("./pages/ProjectDetail"));
const DeliverablesPage = lazy(() => import("./pages/Deliverables"));
const NotesPage = lazy(() => import("./pages/Notes"));
const FinancialsPage = lazy(() => import("./pages/Financials"));
const AIEnginePage = lazy(() => import("./pages/AIEngine"));
const PlaybooksPage = lazy(() => import("./pages/Playbooks"));
const ProposalsPage = lazy(() => import("./pages/Proposals"));
const ProposalDetailPage = lazy(() => import("./pages/ProposalDetail"));
const AnalyticsPage = lazy(() => import("./pages/Analytics"));
const OnboardingPage = lazy(() => import("./pages/Onboarding"));
const ClientPortalPage = lazy(() => import("./pages/ClientPortal"));
const PortalManagementPage = lazy(() => import("./pages/PortalManagement"));
const ResearchEnginePage = lazy(() => import("./pages/ResearchEngine"));
const KnowledgeBasePage = lazy(() => import("./pages/KnowledgeBase"));
const PipelinePage = lazy(() => import("./pages/Pipeline"));
const BrandTwinPage = lazy(() => import("./pages/BrandTwin"));
const LeadsPage = lazy(() => import("./pages/Leads"));
const SalesFunnelPage = lazy(() => import("./pages/SalesFunnel"));
const QuickCheckPage = lazy(() => import("./pages/QuickCheck"));
const ProposalViewPage = lazy(() => import("./pages/ProposalView"));

// WZZRD AI — Public funnel pages
const SignupPage = lazy(() => import("./pages/Signup"));
const LoginPage = lazy(() => import("./pages/Login"));
const BlogIndexPage = lazy(() => import("./pages/public/BlogIndex"));
const BlogPostPage = lazy(() => import("./pages/public/BlogPost"));
const ToolsPage = lazy(() => import("./pages/Tools"));
const BrandDiagnosisPage = lazy(() => import("./pages/tools/BrandDiagnosis"));
const OfferCheckPage = lazy(() => import("./pages/tools/OfferCheck"));
const MessageCheckPage = lazy(() => import("./pages/tools/MessageCheck"));
const PresenceAuditPage = lazy(() => import("./pages/tools/PresenceAudit"));
const IdentitySnapshotPage = lazy(() => import("./pages/tools/IdentitySnapshot"));
const LaunchReadinessPage = lazy(() => import("./pages/tools/LaunchReadiness"));
const PricingPage = lazy(() => import("./pages/Pricing"));
const TermsOfUsePage = lazy(() => import("./pages/public/TermsOfUse"));
const PrivacyPolicyPage = lazy(() => import("./pages/public/PrivacyPolicy"));
const WzrdAdminPage = lazy(() => import("./pages/WzrdAdmin"));
const ProfilePage = lazy(() => import("./pages/Profile"));
const MyBrandPage = lazy(() => import("./pages/MyBrand"));
const CopilotPage = lazy(() => import("./pages/Copilot"));
const CompetitiveBenchmarkPage = lazy(() => import("./pages/CompetitiveBenchmark"));
const QuickDiagnosisPage = lazy(() => import("./pages/QuickDiagnosis"));
const MyRequestsPage = lazy(() => import("./pages/MyRequests"));
const SettingsPage = lazy(() => import("./pages/Settings"));
const ContractsPage = lazy(() => import("./pages/Contracts"));
const InvitePage = lazy(() => import("./pages/Invite"));
const InvoicesPage = lazy(() => import("./pages/Invoices"));

function SuspenseWrapper({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <Suspense fallback={fallback || <PageSkeleton />}>
      {children}
    </Suspense>
  );
}

function DashboardRouter() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path="/dashboard">{() => <SuspenseWrapper><Home /></SuspenseWrapper>}</Route>
        <Route path="/clients">{() => <SuspenseWrapper><ClientsPage /></SuspenseWrapper>}</Route>
        <Route path="/clients/:id">{() => <SuspenseWrapper fallback={<DetailPageSkeleton />}><ClientDetailPage /></SuspenseWrapper>}</Route>
        <Route path="/projects">{() => <SuspenseWrapper><ProjectsPage /></SuspenseWrapper>}</Route>
        <Route path="/projects/:id">{() => <SuspenseWrapper fallback={<DetailPageSkeleton />}><ProjectDetailPage /></SuspenseWrapper>}</Route>
        <Route path="/deliverables">{() => <SuspenseWrapper><DeliverablesPage /></SuspenseWrapper>}</Route>
        <Route path="/notes">{() => <SuspenseWrapper><NotesPage /></SuspenseWrapper>}</Route>
        <Route path="/financials">{() => <SuspenseWrapper><FinancialsPage /></SuspenseWrapper>}</Route>
        <Route path="/ai">{() => (
          <CommandCenterGuard>
            <SuspenseWrapper fallback={<ChatSkeleton />}><AIEnginePage /></SuspenseWrapper>
          </CommandCenterGuard>
        )}</Route>
        <Route path="/proposals">{() => <SuspenseWrapper><ProposalsPage /></SuspenseWrapper>}</Route>
        <Route path="/contracts">{() => <SuspenseWrapper><ContractsPage /></SuspenseWrapper>}</Route>
        <Route path="/invoices">{() => <SuspenseWrapper><InvoicesPage /></SuspenseWrapper>}</Route>
        <Route path="/proposals/:id">{() => <SuspenseWrapper fallback={<DetailPageSkeleton />}><ProposalDetailPage /></SuspenseWrapper>}</Route>
        <Route path="/analytics">{() => <SuspenseWrapper><AnalyticsPage /></SuspenseWrapper>}</Route>
        <Route path="/playbooks">{() => <SuspenseWrapper><PlaybooksPage /></SuspenseWrapper>}</Route>
        <Route path="/onboarding">{() => <SuspenseWrapper><OnboardingPage /></SuspenseWrapper>}</Route>
        <Route path="/portal-management">{() => <SuspenseWrapper><PortalManagementPage /></SuspenseWrapper>}</Route>
        <Route path="/research">{() => (
          <CommandCenterGuard>
            <SuspenseWrapper><ResearchEnginePage /></SuspenseWrapper>
          </CommandCenterGuard>
        )}</Route>
        <Route path="/knowledge">{() => (
          <CommandCenterGuard>
            <SuspenseWrapper><KnowledgeBasePage /></SuspenseWrapper>
          </CommandCenterGuard>
        )}</Route>
        <Route path="/pipeline">{() => (
          <CommandCenterGuard>
            <SuspenseWrapper><PipelinePage /></SuspenseWrapper>
          </CommandCenterGuard>
        )}</Route>
        <Route path="/brand-twin">{() => (
          <CommandCenterGuard>
            <SuspenseWrapper><BrandTwinPage /></SuspenseWrapper>
          </CommandCenterGuard>
        )}</Route>
        <Route path="/leads">{() => <SuspenseWrapper><LeadsPage /></SuspenseWrapper>}</Route>
        <Route path="/sales-funnel">{() => <SuspenseWrapper><SalesFunnelPage /></SuspenseWrapper>}</Route>
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
  );
}

function PremiumShellLayout({ children }: { children: React.ReactNode }) {
  const [loc] = useLocation();
  const useShell = useMemo(() => WZZRD_PREMIUM_SHELL_RE.test(loc), [loc]);
  if (useShell) return <WzrdAppShell>{children}</WzrdAppShell>;
  return <>{children}</>;
}

function App() {
  return (
    <ErrorBoundary>
      <I18nProvider>
        <ThemeProvider defaultTheme="dark" switchable>
          <TooltipProvider>
            <PremiumShellLayout>
              <Toaster />
              <QuickSearch />
              <Switch>
                {/* WZZRD AI — Public funnel pages (no auth) */}
                <Route path="/">{() => <SuspenseWrapper><WelcomePage /></SuspenseWrapper>}</Route>
                <Route path="/signup">{() => <SuspenseWrapper><SignupPage /></SuspenseWrapper>}</Route>
                <Route path="/login">{() => <SuspenseWrapper><LoginPage /></SuspenseWrapper>}</Route>
                <Route path="/blog">{() => <SuspenseWrapper><BlogIndexPage /></SuspenseWrapper>}</Route>
                <Route path="/blog/:slug">{() => <SuspenseWrapper><BlogPostPage /></SuspenseWrapper>}</Route>
                <Route path="/tools">{() => <SuspenseWrapper><ToolsPage /></SuspenseWrapper>}</Route>
                <Route path="/tools/brand-diagnosis">{() => <SuspenseWrapper><BrandDiagnosisPage /></SuspenseWrapper>}</Route>
                <Route path="/tools/offer-check">{() => <SuspenseWrapper><OfferCheckPage /></SuspenseWrapper>}</Route>
                <Route path="/tools/message-check">{() => <SuspenseWrapper><MessageCheckPage /></SuspenseWrapper>}</Route>
                <Route path="/tools/presence-audit">{() => <SuspenseWrapper><PresenceAuditPage /></SuspenseWrapper>}</Route>
                <Route path="/tools/identity-snapshot">{() => <SuspenseWrapper><IdentitySnapshotPage /></SuspenseWrapper>}</Route>
                <Route path="/tools/launch-readiness">{() => <SuspenseWrapper><LaunchReadinessPage /></SuspenseWrapper>}</Route>
                <Route path="/pricing">{() => <SuspenseWrapper><PricingPage /></SuspenseWrapper>}</Route>
                <Route path="/terms">{() => <SuspenseWrapper><TermsOfUsePage /></SuspenseWrapper>}</Route>
                <Route path="/privacy">{() => <SuspenseWrapper><PrivacyPolicyPage /></SuspenseWrapper>}</Route>
                <Route path="/my-brand">{() => <SuspenseWrapper><MyBrandPage /></SuspenseWrapper>}</Route>
                <Route path="/copilot">{() => <SuspenseWrapper><CopilotPage /></SuspenseWrapper>}</Route>
                <Route path="/tools/benchmark">{() => <SuspenseWrapper><CompetitiveBenchmarkPage /></SuspenseWrapper>}</Route>
                <Route path="/tools/quick">{() => <SuspenseWrapper><QuickDiagnosisPage /></SuspenseWrapper>}</Route>
                <Route path="/my-requests">{() => <SuspenseWrapper><MyRequestsPage /></SuspenseWrapper>}</Route>
                <Route path="/admin">{() => <SuspenseWrapper><WzrdAdminPage /></SuspenseWrapper>}</Route>
                <Route path="/panel">{() => <SuspenseWrapper><WzrdAdminPage /></SuspenseWrapper>}</Route>
                <Route path="/wzrd-admin">{() => <SuspenseWrapper><WzrdAdminPage /></SuspenseWrapper>}</Route>
                <Route path="/profile">{() => <SuspenseWrapper><ProfilePage /></SuspenseWrapper>}</Route>
                <Route path="/settings/team">{() => <SuspenseWrapper><SettingsPage defaultTab="team" /></SuspenseWrapper>}</Route>
                <Route path="/settings/audit-logs">{() => <SuspenseWrapper><SettingsPage defaultTab="audit" /></SuspenseWrapper>}</Route>
                <Route path="/settings/whatsapp">{() => <SuspenseWrapper><SettingsPage defaultTab="whatsapp" /></SuspenseWrapper>}</Route>
                <Route path="/settings">{() => <SuspenseWrapper><SettingsPage /></SuspenseWrapper>}</Route>
                {/* Existing public routes */}
                <Route path="/quick-check">{() => <SuspenseWrapper><QuickCheckPage /></SuspenseWrapper>}</Route>
                <Route path="/invite">{() => <SuspenseWrapper><InvitePage /></SuspenseWrapper>}</Route>
                <Route path="/portal/:token">{() => <SuspenseWrapper><ClientPortalPage /></SuspenseWrapper>}</Route>
                <Route path="/proposal-view/:id">{() => <SuspenseWrapper><ProposalViewPage /></SuspenseWrapper>}</Route>
                {/* Dashboard routes (auth required) */}
                <Route component={DashboardRouter} />
              </Switch>
            </PremiumShellLayout>
          </TooltipProvider>
        </ThemeProvider>
      </I18nProvider>
    </ErrorBoundary>
  );
}

export default App;
