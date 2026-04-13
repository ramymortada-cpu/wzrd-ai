import type { ReactNode } from "react";
import { Redirect } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { PageSkeleton } from "@/components/PageSkeleton";

/**
 * Restricts children to users with WZZRD admin access (canAccessCommandCenter) (same rules as auth.me.canAccessCommandCenter).
 */
export default function CommandCenterGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <PageSkeleton />;
  }

  const ok =
    user &&
    "canAccessCommandCenter" in user &&
    Boolean((user as { canAccessCommandCenter?: boolean }).canAccessCommandCenter);

  if (!ok) {
    return <Redirect to="/app/tools" />;
  }

  return <>{children}</>;
}
