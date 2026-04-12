import { lazy } from "react";
import { Route, Switch } from "wouter";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/PageSkeleton";
import AdminLayout from "@/components/AdminLayout";
import NotFound from "@/pages/NotFound";

const WzrdAdminPage = lazy(() => import("@/pages/WzrdAdmin"));
const SettingsPage = lazy(() => import("@/pages/Settings"));
const InvitePage = lazy(() => import("@/pages/Invite"));

function S({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageSkeleton />}>{children}</Suspense>;
}

export default function AdminRoutes() {
  return (
    <AdminLayout>
      <Switch>
        <Route path="/admin">{() => <S><WzrdAdminPage /></S>}</Route>
        <Route path="/admin/settings/team">{() => <S><SettingsPage defaultTab="team" /></S>}</Route>
        <Route path="/admin/settings/whatsapp">{() => <S><SettingsPage defaultTab="whatsapp" /></S>}</Route>
        <Route path="/admin/settings/audit-logs">{() => <S><SettingsPage defaultTab="audit" /></S>}</Route>
        <Route path="/admin/settings">{() => <S><SettingsPage /></S>}</Route>
        <Route path="/admin/invite">{() => <S><InvitePage /></S>}</Route>
        <Route component={NotFound} />
      </Switch>
    </AdminLayout>
  );
}
