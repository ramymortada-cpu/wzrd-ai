/**
 * Credits DB helpers — manages credit balance and transactions.
 * 
 * Credits flow:
 *   signup → +100 (signup_bonus)
 *   tool use → -20 to -30 (tool_usage)
 *   purchase → +500/1000 (purchase)
 *   refund → +N (refund)
 *   admin → +/- N (admin adjustment)
 */

import { eq, desc, sql, and } from "drizzle-orm";
import { users, creditTransactions } from "../../drizzle/schema";
import { getDb } from "./index";

// ════════════════════════════════════════════
// TOOL CREDIT COSTS
// ════════════════════════════════════════════

export const TOOL_COSTS: Record<string, number> = {
  brand_diagnosis: 20,
  offer_check: 25,
  message_check: 20,
  presence_audit: 25,
  identity_snapshot: 20,
  launch_readiness: 30,
  competitive_benchmark: 40,
  copilot_message: 5,
};

export const SIGNUP_BONUS = 100;

/**
 * Update a tool's credit cost (admin only).
 * Persists in memory until server restart.
 */
export function updateToolCost(toolName: string, newCost: number): boolean {
  if (!(toolName in TOOL_COSTS)) return false;
  if (newCost < 1 || newCost > 1000) return false;
  TOOL_COSTS[toolName] = newCost;
  return true;
}

// ════════════════════════════════════════════
// READ
// ════════════════════════════════════════════

export async function getUserCredits(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const rows = await db.select({ credits: users.credits }).from(users).where(eq(users.id, userId)).limit(1);
  return rows[0]?.credits ?? 0;
}

export async function getCreditHistory(userId: number, limit = 50): Promise<CreditHistoryItem[]> {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(creditTransactions)
    .where(eq(creditTransactions.userId, userId))
    .orderBy(desc(creditTransactions.createdAt))
    .limit(limit);
  return rows.map((r: any) => ({
    id: r.id,
    amount: r.amount,
    balance: r.balance,
    type: r.type,
    toolName: r.toolName,
    reason: r.reason,
    createdAt: r.createdAt,
  }));
}

export interface CreditHistoryItem {
  id: number;
  amount: number;
  balance: number;
  type: string;
  toolName: string | null;
  reason: string | null;
  createdAt: Date;
}

// ════════════════════════════════════════════
// WRITE
// ════════════════════════════════════════════

/**
 * Add credits to a user's balance.
 * ATOMIC: Single UPDATE statement, then log transaction.
 */
export async function addCredits(
  userId: number,
  amount: number,
  type:
    | "signup_bonus"
    | "purchase"
    | "refund"
    | "admin"
    | "referral_bonus"
    | "copilot_refund",
  reason?: string,
  metadata?: Record<string, unknown>
): Promise<{ success: boolean; newBalance: number }> {
  const db = await getDb();
  if (!db) return { success: false, newBalance: 0 };

  try {
    // Atomic add — single UPDATE
    await db.update(users)
      .set({ credits: sql`credits + ${amount}` })
      .where(eq(users.id, userId));

    // Read actual new balance AFTER the update
    const newBalance = await getUserCredits(userId);

    // Log transaction with the real balance
    await db.insert(creditTransactions).values({
      userId,
      amount,
      balance: newBalance,
      type,
      reason: reason || `${type}: +${amount} credits`,
      metadata: metadata ? JSON.stringify(metadata) : null,
    });

    return { success: true, newBalance };
  } catch (err) {
    const { logger } = await import("../_core/logger");
    logger.error({ err, userId, amount, type }, "addCredits failed");
    return { success: false, newBalance: 0 };
  }
}

/**
 * Deduct credits for tool usage.
 * ATOMIC: Uses conditional UPDATE (credits >= cost) to prevent race conditions.
 * Also checks daily cap before deducting.
 */
const DAILY_CREDIT_CAP = 500; // 500 credits/day per user — prevents abuse

export async function deductCredits(
  userId: number,
  toolName: string,
  metadata?: Record<string, unknown>
): Promise<{ success: boolean; newBalance: number; cost: number; error?: string }> {
  const db = await getDb();
  if (!db) return { success: false, newBalance: 0, cost: 0, error: 'DB unavailable' };

  const cost = TOOL_COSTS[toolName];
  if (!cost) return { success: false, newBalance: 0, cost: 0, error: `Unknown tool: ${toolName}` };

  // Check daily cap BEFORE attempting deduction
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayUsage = await db.select({ total: sql<number>`COALESCE(SUM(ABS(amount)), 0)` })
      .from(creditTransactions)
      .where(and(
        eq(creditTransactions.userId, userId),
        eq(creditTransactions.type, 'tool_usage'),
        sql`createdAt >= ${today}`
      ));
    const usedToday = todayUsage[0]?.total || 0;
    if (usedToday + cost > DAILY_CREDIT_CAP) {
      const currentBalance = await getUserCredits(userId);
      return { success: false, newBalance: currentBalance, cost, error: `وصلت الحد اليومي (${DAILY_CREDIT_CAP} كريدت/يوم). حاول بكره!` };
    }
  } catch {
    // If daily cap check fails — allow the deduction (fail open)
  }

  try {
    // ATOMIC deduction: only deducts if credits >= cost
    // This prevents race conditions — two simultaneous requests can't both succeed
    // because the second UPDATE will find credits < cost after the first deducted
    const result = await db.execute(
      sql`UPDATE users SET credits = credits - ${cost} WHERE id = ${userId} AND credits >= ${cost}`
    );

    // Check if the UPDATE actually affected a row
    const affectedRows = (result as unknown as { affectedRows?: number })?.affectedRows
      ?? (result as unknown as [{ affectedRows?: number }])?.[0]?.affectedRows
      ?? 0;

    if (affectedRows === 0) {
      // Either insufficient credits or user not found
      const currentBalance = await getUserCredits(userId);
      return { success: false, newBalance: currentBalance, cost, error: `Insufficient credits. Need ${cost}, have ${currentBalance}.` };
    }

    // Get the actual new balance (after atomic deduction)
    const newBalance = await getUserCredits(userId);

    // Log transaction
    await db.insert(creditTransactions).values({
      userId,
      amount: -cost,
      balance: newBalance,
      type: 'tool_usage',
      toolName,
      reason: `Used ${toolName} (-${cost} credits)`,
      metadata: metadata ? JSON.stringify(metadata) : null,
    });

    return { success: true, newBalance, cost };
  } catch (err) {
    const currentBalance = await getUserCredits(userId);
    return { success: false, newBalance: currentBalance, cost, error: 'Transaction failed' };
  }
}

// ════════════════════════════════════════════
// STATS (Admin)
// ════════════════════════════════════════════

export async function getCreditStats(): Promise<{
  totalUsersWithCredits: number;
  totalCreditsIssued: number;
  totalCreditsUsed: number;
  topTools: Array<{ tool: string; uses: number; creditsSpent: number }>;
}> {
  const db = await getDb();
  if (!db) return { totalUsersWithCredits: 0, totalCreditsIssued: 0, totalCreditsUsed: 0, topTools: [] };

  const allTransactions = await db.select().from(creditTransactions).limit(5000);

  const issued = allTransactions.filter((t: any) => t.amount > 0).reduce((s: number, t: any) => s + t.amount, 0);
  const used = allTransactions.filter((t: any) => t.amount < 0).reduce((s: number, t: any) => s + Math.abs(t.amount), 0);

  // Top tools
  const toolMap = new Map<string, { uses: number; spent: number }>();
  for (const t of allTransactions) {
    if (t.type === 'tool_usage' && t.toolName) {
      const entry = toolMap.get(t.toolName) || { uses: 0, spent: 0 };
      entry.uses++;
      entry.spent += Math.abs(t.amount);
      toolMap.set(t.toolName, entry);
    }
  }

  const topTools = Array.from(toolMap.entries())
    .map(([tool, data]) => ({ tool, uses: data.uses, creditsSpent: data.spent }))
    .sort((a, b) => b.uses - a.uses);

  const usersWithCredits = await db.select({ count: sql<number>`count(*)` })
    .from(users)
    .where(sql`credits > 0`);

  return {
    totalUsersWithCredits: usersWithCredits[0]?.count || 0,
    totalCreditsIssued: issued,
    totalCreditsUsed: used,
    topTools,
  };
}
