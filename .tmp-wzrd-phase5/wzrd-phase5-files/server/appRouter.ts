/**
 * Root tRPC router — merge feature routers here (imported by server entry / API handler).
 */
import { router } from "./_core/trpc";
import { wzrdAdminRouter } from "./routers/wzrdAdmin";
import { portalRouter } from "./routers/portal";
import { leadsRouter } from "./routers/leads";

export const appRouter = router({
  wzrdAdmin: wzrdAdminRouter,
  portal: portalRouter,
  leads: leadsRouter,
});

export type AppRouter = typeof appRouter;
