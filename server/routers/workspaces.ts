import { randomBytes } from "crypto";
import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { requireWorkspaceRole } from "../_core/authorization";
import {
  addWorkspaceMember,
  createInvitedUser,
  createWorkspace,
  getWorkspaceMembers,
  getWorkspacesForUser,
  removeWorkspaceMember,
  updateWorkspaceMemberRole,
  getUserByEmail,
  getDb,
} from "../db";
import { auditLog, inviteTokens } from "../../drizzle/schema";

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
    .input(
      z.object({
        email: z.string().email(),
        role: z.enum(["admin", "editor", "viewer"]).default("viewer"),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      requireWorkspaceRole(ctx, "admin");

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const token = randomBytes(48).toString("hex").slice(0, 64);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await db.insert(inviteTokens).values({
        token,
        workspaceId: ctx.workspaceId,
        email: input.email,
        role: input.role,
        expiresAt,
      });

      return { token, expiresAt };
    }),

  /** Public + rate-limited — invitee may have no account yet; optional name for new user row */
  acceptInvite: publicProcedure
    .input(
      z.object({
        token: z.string().min(1).max(64),
        name: z.string().min(1).max(200).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const rows = await db
        .select()
        .from(inviteTokens)
        .where(eq(inviteTokens.token, input.token))
        .limit(1);

      const invite = rows[0];

      if (!invite) throw new Error("Invalid or expired invite token");
      if (invite.expiresAt < new Date()) {
        await db.delete(inviteTokens).where(eq(inviteTokens.token, input.token));
        throw new Error("This invite link has expired");
      }

      const resolvedName =
        input.name?.trim() || ctx.user?.name || invite.email;

      let user = await getUserByEmail(invite.email);
      if (!user) {
        const created = await createInvitedUser({
          name: resolvedName,
          email: invite.email,
        });
        if (!created) throw new Error("Failed to create user account");
        user = await getUserByEmail(invite.email);
        if (!user) throw new Error("User creation failed");
      }

      await addWorkspaceMember({
        workspaceId: invite.workspaceId,
        userId: user.id,
        role: invite.role,
      });

      await db.delete(inviteTokens).where(eq(inviteTokens.token, input.token));

      return { success: true as const, workspaceId: invite.workspaceId };
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
