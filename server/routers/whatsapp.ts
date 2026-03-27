/**
 * WhatsApp account linking — authenticated users link E.164 to WZRD for WA Copilot.
 */
import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import {
  getUserByWhatsAppPhone,
  linkWhatsAppPhone,
  unlinkWhatsAppPhone,
} from "../db/users";
import { logger } from "../_core/logger";

function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, "").replace(/^0+/, "");
}

export const whatsappRouter = router({
  status: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const [user] = await db
      .select({
        whatsappPhone: users.whatsappPhone,
        whatsappVerified: users.whatsappVerified,
        whatsappLinkedAt: users.whatsappLinkedAt,
      })
      .from(users)
      .where(eq(users.id, ctx.user!.id));

    return {
      linked: (user?.whatsappVerified ?? 0) === 1,
      phone: user?.whatsappPhone ?? null,
      linkedAt: user?.whatsappLinkedAt ?? null,
    };
  }),

  link: protectedProcedure
    .input(
      z.object({
        phone: z
          .string()
          .min(7)
          .max(20)
          .regex(/^[\d\s+()-]+$/, "رقم الهاتف غير صحيح"),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const normalized = normalizePhone(input.phone);
      if (normalized.length < 7 || normalized.length > 15) {
        throw new Error("رقم الهاتف يجب يكون بين 7 و 15 رقم");
      }

      const existing = await getUserByWhatsAppPhone(normalized);
      if (existing && existing.id !== ctx.user!.id) {
        throw new Error("الرقم ده مربوط بحساب تاني. تواصل مع الدعم لو في مشكلة.");
      }

      await linkWhatsAppPhone(ctx.user!.id, normalized);
      logger.info({ userId: ctx.user!.id, phone: normalized }, "WhatsApp phone linked");

      return {
        success: true as const,
        phone: normalized,
        message: `تم ربط واتساب بنجاح! ابعت رسالة على الرقم المسجّل لتجربة الكوبايلوت.`,
      };
    }),

  unlink: protectedProcedure.mutation(async ({ ctx }) => {
    await unlinkWhatsAppPhone(ctx.user!.id);
    logger.info({ userId: ctx.user!.id }, "WhatsApp phone unlinked");
    return { success: true as const };
  }),
});
