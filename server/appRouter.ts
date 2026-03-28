/**
 * Root tRPC router — merge additional routers from your app here.
 */
import { router } from "./_core/trpc";
import { leadsRouter } from "./routers/leads";

export const appRouter = router({
  leads: leadsRouter,
});

export type AppRouter = typeof appRouter;
