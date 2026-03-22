import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

/**
 * Global error logging middleware — catches ALL procedure errors.
 * This replaces the need for try/catch in every single router.
 * Errors are logged with structured context, then re-thrown for tRPC to handle.
 */
const errorLogging = t.middleware(async ({ next, path, type }) => {
  const start = Date.now();
  try {
    const result = await next();
    return result;
  } catch (err: unknown) {
    const duration = Date.now() - start;
    const e = err as { code?: string; message?: string };
    // Log with structured context
    console.error(JSON.stringify({
      level: 'error',
      msg: `tRPC error: ${path}`,
      path,
      type,
      code: e?.code || 'INTERNAL_SERVER_ERROR',
      message: e?.message,
      duration,
      timestamp: new Date().toISOString(),
    }));
    throw err; // Re-throw for tRPC error formatting
  }
});

export const router = t.router;
export const publicProcedure = t.procedure.use(errorLogging);

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== 'admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);
