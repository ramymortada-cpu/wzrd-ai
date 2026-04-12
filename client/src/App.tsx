import { lazy, Suspense, useEffect } from 'react';
import posthog from 'posthog-js';
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation, Redirect } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { I18nProvider } from "./lib/i18n";
import { PageSkeleton } from "./components/PageSkeleton";
import QuickSearch from "./components/QuickSearch";

// ===== LAZY PAGES — PUBLIC =====
const WelcomePage = lazy(() => import("./pages/Welcome"));
const SignupPage = lazy(() => import("./pages/Signup"));
const LoginPage = lazy(() => import("./pages/Login"));
const BlogIndexPage = lazy(() => import("./pages/public/BlogIndex"));
const BlogPostPage = lazy(() => import("./pages/public/BlogPost"));
const QuickCheckPage = lazy(() => import("./pages/QuickCheck"));
const QuickDiagnosisPage = lazy(() => import("./pages/QuickDiagnosis"));
const ClientPortalPage = lazy(() => import("./pages/ClientPortal"));
const ProposalViewPage = lazy(() => import("./pages/ProposalView"));
const TermsOfUsePage = lazy(() => import("./pages/public/TermsOfUse"));
const PrivacyPolicyPage = lazy(() => import("./pages/public/PrivacyPolicy"));
const ReportsPage = lazy(() => import("./pages/public/Reports"));

// ===== LAZY ROUTE BUNDLES (shell + all child pages loaded together) =====
const ClientRoutes = lazy(() => import("./routes/ClientRoutes"));
const AgencyRoutes = lazy(() => import("./routes/AgencyRoutes"));
const AdminRoutes = lazy(() => import("./routes/AdminRoutes"));

function S({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageSkeleton />}>{children}</Suspense>;
}

function PostHogPageViews() {
  const [location] = useLocation();
  useEffect(() => {
    if (import.meta.env.VITE_POSTHOG_KEY) {
      posthog.capture("$pageview", { path: window.location.pathname });
    }
  }, [location]);
  return null;
}

function App() {
  return (
    <ErrorBoundary>
      <I18nProvider>
        <ThemeProvider defaultTheme="dark" switchable>
          <TooltipProvider>
            <PostHogPageViews />
            <Toaster />
            <QuickSearch />
            <Switch>
              {/* ══════ PUBLIC (no shell, no auth) ══════ */}
              <Route path="/">{() => <S><WelcomePage /></S>}</Route>
              <Route path="/signup">{() => <S><SignupPage /></S>}</Route>
              <Route path="/login">{() => <S><LoginPage /></S>}</Route>
              <Route path="/quick-check">{() => <S><QuickCheckPage /></S>}</Route>
              <Route path="/tools/quick">{() => <S><QuickDiagnosisPage /></S>}</Route>
              <Route path="/portal/:token">{() => <S><ClientPortalPage /></S>}</Route>
              <Route path="/proposal-view/:id">{() => <S><ProposalViewPage /></S>}</Route>
              <Route path="/blog">{() => <S><BlogIndexPage /></S>}</Route>
              <Route path="/blog/:slug">{() => <S><BlogPostPage /></S>}</Route>
              <Route path="/terms">{() => <S><TermsOfUsePage /></S>}</Route>
              <Route path="/privacy">{() => <S><PrivacyPolicyPage /></S>}</Route>
              <Route path="/reports">{() => <S><ReportsPage /></S>}</Route>

              {/* ══════ LEGACY REDIRECTS ══════ */}
              <Route path="/dashboard">{() => <Redirect to="/cc/dashboard" />}</Route>
              <Route path="/clients">{() => <Redirect to="/cc/clients" />}</Route>
              <Route path="/clients/:id">{(p) => <Redirect to={`/cc/clients/${p.id}`} />}</Route>
              <Route path="/projects">{() => <Redirect to="/cc/projects" />}</Route>
              <Route path="/projects/:id">{(p) => <Redirect to={`/cc/projects/${p.id}`} />}</Route>
              <Route path="/deliverables">{() => <Redirect to="/cc/deliverables" />}</Route>
              <Route path="/notes">{() => <Redirect to="/cc/notes" />}</Route>
              <Route path="/financials">{() => <Redirect to="/cc/financials" />}</Route>
              <Route path="/ai">{() => <Redirect to="/cc/ai" />}</Route>
              <Route path="/proposals">{() => <Redirect to="/cc/proposals" />}</Route>
              <Route path="/proposals/:id">{(p) => <Redirect to={`/cc/proposals/${p.id}`} />}</Route>
              <Route path="/contracts">{() => <Redirect to="/cc/contracts" />}</Route>
              <Route path="/invoices">{() => <Redirect to="/cc/invoices" />}</Route>
              <Route path="/analytics">{() => <Redirect to="/cc/analytics" />}</Route>
              <Route path="/pipeline">{() => <Redirect to="/cc/pipeline" />}</Route>
              <Route path="/research">{() => <Redirect to="/cc/research" />}</Route>
              <Route path="/knowledge">{() => <Redirect to="/cc/knowledge" />}</Route>
              <Route path="/brand-twin">{() => <Redirect to="/cc/brand-twin" />}</Route>
              <Route path="/leads">{() => <Redirect to="/cc/leads" />}</Route>
              <Route path="/sales-funnel">{() => <Redirect to="/cc/sales-funnel" />}</Route>
              <Route path="/playbooks">{() => <Redirect to="/cc/playbooks" />}</Route>
              <Route path="/onboarding">{() => <Redirect to="/cc/onboarding" />}</Route>
              <Route path="/portal-management">{() => <Redirect to="/cc/portal-management" />}</Route>
              <Route path="/tools">{() => <Redirect to="/app/tools" />}</Route>
              <Route path="/tools/:t">{(p) => <Redirect to={`/app/tools/${p.t}`} />}</Route>
              <Route path="/my-brand">{() => <Redirect to="/app/my-brand" />}</Route>
              <Route path="/copilot">{() => <Redirect to="/app/copilot" />}</Route>
              <Route path="/pricing">{() => <Redirect to="/app/pricing" />}</Route>
              <Route path="/profile">{() => <Redirect to="/app/profile" />}</Route>
              <Route path="/my-requests">{() => <Redirect to="/app/my-requests" />}</Route>
              <Route path="/wzrd-admin">{() => <Redirect to="/admin" />}</Route>
              <Route path="/panel">{() => <Redirect to="/admin" />}</Route>
              <Route path="/settings">{() => <Redirect to="/admin/settings" />}</Route>
              <Route path="/settings/:t">{(p) => <Redirect to={`/admin/settings/${p.t}`} />}</Route>
              <Route path="/invite">{() => <Redirect to="/admin/invite" />}</Route>

              {/* ══════ 3 SHELLS (lazy loaded, each with own guard) ══════ */}
              <Route path="/app/:rest*">{() => <S><ClientRoutes /></S>}</Route>
              <Route path="/cc/:rest*">{() => <S><AgencyRoutes /></S>}</Route>
              <Route path="/admin/:rest*">{() => <S><AdminRoutes /></S>}</Route>

              {/* ══════ 404 ══════ */}
              <Route component={NotFound} />
            </Switch>
          </TooltipProvider>
        </ThemeProvider>
      </I18nProvider>
    </ErrorBoundary>
  );
}

export default App;
