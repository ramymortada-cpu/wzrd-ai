import { COOKIE_NAME } from "@shared/const";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { parse as parseCookie } from "cookie";
import * as db from "../db";
import { verifySession } from "./session";
import { sdk } from "./sdk";
import { eq } from "drizzle-orm";
import { workspaceMembers } from "../../drizzle/schema";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  workspaceId: number;
  workspaceRole: "owner" | "admin" | "editor" | "viewer" | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;
  let workspaceId = 1;
  let workspaceRole: "owner" | "admin" | "editor" | "viewer" | null = null;

  // 1. Try app session (email signup/login) — JWT stores { id, openId, email }
  const cookies = opts.req.headers.cookie
    ? parseCookie(opts.req.headers.cookie)
    : {};
  const token = cookies[COOKIE_NAME];
  const appSession = token ? await verifySession(token) : null;
  if (appSession) {
    user = await db.getUserByOpenId(appSession.openId) ?? null;
  }

  // 2. Fall back to OAuth/SDK session (Manus) — expects { openId, appId, name }
  if (!user) {
    try {
      user = await sdk.authenticateRequest(opts.req);
    } catch {
      user = null;
    }
  }

  const rawWorkspaceHeader = opts.req.headers["x-workspace-id"];
  const headerWorkspaceId = Number(Array.isArray(rawWorkspaceHeader) ? rawWorkspaceHeader[0] : rawWorkspaceHeader);
  if (Number.isFinite(headerWorkspaceId) && headerWorkspaceId > 0) {
    workspaceId = headerWorkspaceId;
  }

  if (user) {
    const dbConn = await db.getDb();
    if (dbConn) {
      const memberships = await dbConn
        .select()
        .from(workspaceMembers)
        .where(eq(workspaceMembers.userId, user.id))
        .limit(50);
      if (memberships.length > 0) {
        if (!headerWorkspaceId || !Number.isFinite(headerWorkspaceId) || headerWorkspaceId <= 0) {
          workspaceId = memberships[0].workspaceId;
          workspaceRole = memberships[0].role;
        } else {
          const match = memberships.find((r) => r.workspaceId === workspaceId) ?? memberships[0];
          workspaceId = match.workspaceId;
          workspaceRole = match.role;
        }
      }
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
    workspaceId,
    workspaceRole,
  };
}
