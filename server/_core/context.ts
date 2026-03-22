import { COOKIE_NAME } from "@shared/const";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { parse as parseCookie } from "cookie";
import * as db from "../db";
import { verifySession } from "./session";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

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

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
