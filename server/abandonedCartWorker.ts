/**
 * Abandoned cart follow-up — hourly tick, emails users who started checkout >24h ago.
 */

import { and, eq, lt } from "drizzle-orm";
import { abandonedCarts, users } from "../drizzle/schema";
import { getDb } from "./db/index";
import { logger } from "./_core/logger";
import { sendEmail } from "./wzrdEmails";

const HOUR_MS = 60 * 60 * 1000;
const STALE_MS = 24 * HOUR_MS;

function checkoutReminderHtml(amountEgp: number, productType: string, appUrl: string): string {
  const base = appUrl.replace(/\/$/, "");
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;font-family:'Segoe UI',Tahoma,sans-serif;background:#0f0f12;color:#e4e4e7;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f12;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:linear-gradient(180deg,#1a1a22 0%,#121218 100%);border-radius:16px;border:1px solid #27272a;overflow:hidden;">
        <tr><td style="padding:28px 28px 12px;font-size:13px;color:#a1a1aa;">WZZRD AI</td></tr>
        <tr><td style="padding:0 28px 8px;font-size:22px;font-weight:700;color:#fafafa;">لسه فاكر عربية الشراء؟</td></tr>
        <tr><td style="padding:0 28px 16px;font-size:15px;line-height:1.7;color:#d4d4d8;">
          بدأت عملية شراء باقة <strong style="color:#fff;">${productType}</strong> بمبلغ تقريبي <strong style="color:#fbbf24;">${amountEgp} ج.م</strong> ومكتملتش الدفع.
          تقدر تكمّل في أي وقت — الكريدتات هتفضّل في انتظارك.
        </td></tr>
        <tr><td style="padding:12px 28px 28px;">
          <a href="${base}/pricing" style="display:inline-block;padding:14px 28px;border-radius:999px;background:linear-gradient(90deg,#6366f1,#8b5cf6);color:#fff;font-weight:700;text-decoration:none;font-size:15px;">إكمال الشراء</a>
        </td></tr>
        <tr><td style="padding:0 28px 24px;font-size:12px;color:#71717a;">لو حابب نساعدك يدوي — رد على الإيميل أو تواصل من الموقع.</td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function processAbandonedCartsOnce(): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const cutoff = new Date(Date.now() - STALE_MS);

  const rows = await db
    .select({
      cartId: abandonedCarts.id,
      userId: abandonedCarts.userId,
      amountEgp: abandonedCarts.amountEgp,
      productType: abandonedCarts.productType,
      email: users.email,
      name: users.name,
    })
    .from(abandonedCarts)
    .innerJoin(users, eq(users.id, abandonedCarts.userId))
    .where(
      and(
        eq(abandonedCarts.completed, 0),
        eq(abandonedCarts.followUpSent, 0),
        lt(abandonedCarts.clickedAt, cutoff)
      )
    )
    .limit(50);

  const appUrl = process.env.APP_URL || "https://wzzrdai.com";

  for (const row of rows) {
    if (!row.email) continue;
    const html = checkoutReminderHtml(row.amountEgp, row.productType, appUrl);
    const ok = await sendEmail({
      to: row.email,
      subject: "WZZRD AI — إكمال طلبك",
      html,
      text: `أكمل شراءك على ${appUrl}/pricing`,
    });
    if (ok) {
      await db
        .update(abandonedCarts)
        .set({ followUpSent: 1 })
        .where(eq(abandonedCarts.id, row.cartId));
      logger.info({ cartId: row.cartId, userId: row.userId }, "[AbandonedCart] follow-up email sent");
    }
  }
}

export function startAbandonedCartWorker(): void {
  setInterval(() => {
    processAbandonedCartsOnce().catch((err) =>
      logger.error({ err }, "[AbandonedCart] process tick failed")
    );
  }, HOUR_MS);
  void processAbandonedCartsOnce();
  logger.info("[AbandonedCart] Worker scheduled (every 1h + initial run)");
}
