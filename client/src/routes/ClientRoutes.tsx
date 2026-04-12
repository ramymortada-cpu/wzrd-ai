import { lazy } from "react";
import { Route, Switch } from "wouter";
import { Suspense } from "react";
import { PageSkeleton, DetailPageSkeleton } from "@/components/PageSkeleton";
import ClientLayout from "@/components/ClientLayout";
import NotFound from "@/pages/NotFound";

const ToolsPage = lazy(() => import("@/pages/Tools"));
const BrandDiagnosisPage = lazy(() => import("@/pages/tools/BrandDiagnosis"));
const OfferCheckPage = lazy(() => import("@/pages/tools/OfferCheck"));
const MessageCheckPage = lazy(() => import("@/pages/tools/MessageCheck"));
const PresenceAuditPage = lazy(() => import("@/pages/tools/PresenceAudit"));
const IdentitySnapshotPage = lazy(() => import("@/pages/tools/IdentitySnapshot"));
const LaunchReadinessPage = lazy(() => import("@/pages/tools/LaunchReadiness"));
const DesignHealthPage = lazy(() => import("@/pages/tools/DesignHealth"));
const CompetitiveBenchmarkPage = lazy(() => import("@/pages/CompetitiveBenchmark"));
const MyBrandPage = lazy(() => import("@/pages/MyBrand"));
const CopilotPage = lazy(() => import("@/pages/Copilot"));
const PricingPage = lazy(() => import("@/pages/Pricing"));
const ProfilePage = lazy(() => import("@/pages/Profile"));
const MyRequestsPage = lazy(() => import("@/pages/MyRequests"));

function S({ children, detail }: { children: React.ReactNode; detail?: boolean }) {
  return (
    <Suspense fallback={detail ? <DetailPageSkeleton /> : <PageSkeleton />}>
      {children}
    </Suspense>
  );
}

export default function ClientRoutes() {
  return (
    <ClientLayout>
      <Switch>
        <Route path="/app/tools">{() => <S><ToolsPage /></S>}</Route>
        <Route path="/app/tools/brand-diagnosis">{() => <S><BrandDiagnosisPage /></S>}</Route>
        <Route path="/app/tools/offer-check">{() => <S><OfferCheckPage /></S>}</Route>
        <Route path="/app/tools/message-check">{() => <S><MessageCheckPage /></S>}</Route>
        <Route path="/app/tools/presence-audit">{() => <S><PresenceAuditPage /></S>}</Route>
        <Route path="/app/tools/identity-snapshot">{() => <S><IdentitySnapshotPage /></S>}</Route>
        <Route path="/app/tools/launch-readiness">{() => <S><LaunchReadinessPage /></S>}</Route>
        <Route path="/app/tools/design-health">{() => <S><DesignHealthPage /></S>}</Route>
        <Route path="/app/tools/benchmark">{() => <S><CompetitiveBenchmarkPage /></S>}</Route>
        <Route path="/app/my-brand">{() => <S><MyBrandPage /></S>}</Route>
        <Route path="/app/copilot">{() => <S><CopilotPage /></S>}</Route>
        <Route path="/app/pricing">{() => <S><PricingPage /></S>}</Route>
        <Route path="/app/profile">{() => <S><ProfilePage /></S>}</Route>
        <Route path="/app/my-requests">{() => <S><MyRequestsPage /></S>}</Route>
        <Route component={NotFound} />
      </Switch>
    </ClientLayout>
  );
}
