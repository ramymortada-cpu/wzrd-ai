/**
 * Users DB Helpers — user CRUD operations.
 */

import { eq } from "drizzle-orm";
import { users, InsertUser } from "../../drizzle/schema";
import { getDb } from "./index";
import { logger } from "../_core/logger";
import { ENV } from "../_core/env";

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { logger.warn("Cannot upsert user: database not available"); return; }

  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    logger.error({ err: error }, "Failed to upsert user");
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) { logger.warn("Cannot get user: database not available"); return undefined; }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * Create a public user (from website signup — no OAuth).
 * Uses email as openId for simplicity.
 */
export async function createPublicUser(data: {
  name: string;
  email: string;
  company?: string;
  industry?: string;
  market?: string;
  newsletterOptIn?: boolean;
}): Promise<{ id: number; openId: string } | null> {
  const db = await getDb();
  if (!db) return null;

  const openId = `email:${data.email}`;

  try {
    await db.insert(users).values({
      openId,
      name: data.name,
      email: data.email,
      company: data.company || null,
      industry: data.industry || null,
      market: data.market || null,
      newsletterOptIn: data.newsletterOptIn ? 1 : 0,
      loginMethod: 'email',
      signupSource: 'website',
      credits: 0, // Credits added via addCredits() in auth.signup for proper transaction logging
      role: 'user',
      lastSignedIn: new Date(),
    });

    const user = await getUserByEmail(data.email);
    if (!user) return null;

    logger.info({ userId: user.id, email: data.email }, 'Public user created with 100 credits');
    return { id: user.id, openId };
  } catch (err) {
    // If duplicate email, return existing user
    const existing = await getUserByEmail(data.email);
    if (existing) return { id: existing.id, openId: existing.openId };
    logger.error({ err, email: data.email }, 'Failed to create public user');
    return null;
  }
}
