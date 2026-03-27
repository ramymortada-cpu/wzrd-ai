import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { requireWorkspaceRole } from "../_core/authorization";
import {
  addWorkspaceMember,
  createWorkspace,
  getWorkspaceMembers,
  getWorkspacesForUser,
  removeWorkspaceMember,
  updateWorkspaceMemberRole,
  getUserByEmail,
  getDb,
} from "../db";
import { auditLog } from "../../drizzle/schema";

export const workspacesRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return getWorkspacesForUser(ctx.user!.id);
  }),

  create: protectedProcedure
    .input(z.object({ name: z.string().min(2).max(255), plan: z.enum(["free", "pro", "enterprise"]).default("free") }))
    .mutation(async ({ input, ctx }) => {
      const created = await createWorkspace({ name: input.name, plan: input.plan }, ctx.user!.id);
      return created;
    }),

  getMembers: protectedProcedure.query(async ({ ctx }) => {
    requireWorkspaceRole(ctx, "viewer");
    return getWorkspaceMembers(ctx.workspaceId);
  }),

  inviteMember: protectedProcedure
    .input(z.object({ email: z.string().email(), role: z.enum(["admin", "editor", "viewer"]).default("viewer") }))
    .mutation(async ({ input, ctx }) => {
      requireWorkspaceRole(ctx, "admin");
      const user = await getUserByEmail(input.email);
      if (!user) throw new Error("User not found");
      return addWorkspaceMember({
        workspaceId: ctx.workspaceId,
        userId: user.id,
        role: input.role,
      });
    }),

  updateRole: protectedProcedure
    .input(z.object({ userId: z.number().int().positive(), role: z.enum(["owner", "admin", "editor", "viewer"]) }))
    .mutation(async ({ input, ctx }) => {
      requireWorkspaceRole(ctx, "admin");
      await updateWorkspaceMemberRole(ctx.workspaceId, input.userId, input.role);
      return { success: true as const };
    }),

  removeMember: protectedProcedure
    .input(z.object({ userId: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      requireWorkspaceRole(ctx, "admin");
      await removeWorkspaceMember(ctx.workspaceId, input.userId);
      return { success: true as const };
    }),

  auditLogs: protectedProcedure.query(async ({ ctx }) => {
    requireWorkspaceRole(ctx, "admin");
    const db = await getDb();
    if (!db) return [];
    return db
      .select()
      .from(auditLog)
      .where(and(eq(auditLog.workspaceId, ctx.workspaceId)))
      .orderBy(desc(auditLog.createdAt))
      .limit(200);
  }),
});
