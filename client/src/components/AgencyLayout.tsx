import type { ReactNode } from "react";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { PageSkeleton } from "@/components/PageSkeleton";
import DashboardLayout from "@/components/DashboardLayout";

/**
 * Agency shell — wraps DashboardLayout and enforces canAccessCommandCenter.
 * Unauthenticated users → /login
 * Authenticated users without command-center access → /app/tools
 */
export default function AgencyLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      window.location.href = "/login";
      return;
    }
    if (!user.canAccessCommandCenter) {
      navigate("/app/tools");
    }
  }, [loading, user, navigate]);

  if (loading) return <PageSkeleton />;
  if (!user || !user.canAccessCommandCenter) return null;

  return <DashboardLayout>{children}</DashboardLayout>;
}
