/**
 * Type-only mirror of server `leads` procedures for `createTRPCReact` (no DB imports).
 * Keep inputs/outputs aligned with `server/routers/leads.ts`.
 */
import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { z } from "zod";

const t = initTRPC.create({ transformer: superjson });

const leadsRouter = t.router({
  subscribeToLeadMagnet: t.procedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async () => ({ success: true as const })),
});

export const appRouter = t.router({
  leads: leadsRouter,
});

export type AppRouter = typeof appRouter;
