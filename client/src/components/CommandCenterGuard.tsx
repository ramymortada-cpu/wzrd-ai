import type { ReactNode } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { PageSkeleton } from "@/components/PageSkeleton";
import NotFound from "@/pages/NotFound";

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
    return <NotFound />;
  }

  return <>{children}</>;
}
