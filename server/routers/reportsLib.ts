/**
 * Reports Library Router
 *
 * Public endpoints:
 *   reportsLib.list         → list published reports (with optional category filter)
 *   reportsLib.getBySlug    → get one published report (no pdfUrl for paid)
 *   reportsLib.download     → protected: deduct credits and return pdfUrl
 *   reportsLib.myDownloads  → protected: list reports the user already unlocked
 *
 * Admin endpoints (owner only):
 *   reportsLib.adminList    → all reports (draft + published)
 *   reportsLib.adminCreate  → create a new report
 *   reportsLib.adminUpdate  → update a report
 *   reportsLib.adminDelete  → delete a report
 */
import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { checkOwner } from "../_core/authorization";
import { getDb } from "../db";
import { reports, reportDownloads, creditTransactions } from "../../drizzle/schema";
import { getUserCredits } from "../db/credits";
import { sql } from "drizzle-orm";

const CATEGORY_VALUES = [
  "market_report",
  "brand_guide",
  "marketing_guide",
  "template",
  "framework",
  "other",
] as const;

export const reportsLibRouter = router({
  /** Public: list published reports — optional category filter */
  list: publicProcedure
    .input(
      z.object({
        category: z.enum(CATEGORY_VALUES).optional(),
        limit: z.number().int().min(1).max(100).default(50),
        offset: z.number().int().min(0).default(0),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const limit  = input?.limit  ?? 50;
      const offset = input?.offset ?? 0;
      const cat    = input?.category;

      const conditions = cat
        ? and(eq(reports.published, 1), eq(reports.category, cat))
        : eq(reports.published, 1);

      return db
        .select({
          id:            reports.id,
          slug:          reports.slug,
          titleAr:       reports.titleAr,
          titleEn:       reports.titleEn,
          descAr:        reports.descAr,
          descEn:        reports.descEn,
          category:      reports.category,
          coverImage:    reports.coverImage,
          isFree:        reports.isFree,
          creditCost:    reports.creditCost,
          downloadCount: reports.downloadCount,
          createdAt:     reports.createdAt,
        })
        .from(reports)
        .where(conditions)
        .orderBy(desc(reports.createdAt))
        .limit(limit)
        .offset(offset);
    }),

  /** Public: get one published report by slug (pdfUrl hidden for paid reports) */
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string().min(1).max(255) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const rows = await db
        .select()
        .from(reports)
        .where(and(eq(reports.slug, input.slug), eq(reports.published, 1)))
        .limit(1);
      if (!rows[0]) return null;
      const r = rows[0];
      // Hide pdfUrl for paid reports — only returned after credits deduction
      return {
        ...r,
        pdfUrl: r.isFree ? r.pdfUrl : null,
      };
    }),

  /** Protected: deduct credits and return pdfUrl for paid report */
  download: protectedProcedure
    .input(z.object({ reportId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const userId = ctx.user!.id;

      // Fetch the report
      const rows = await db
        .select()
        .from(reports)
        .where(and(eq(reports.id, input.reportId), eq(reports.published, 1)))
        .limit(1);
      const report = rows[0];
      if (!report) throw new TRPCError({ code: "NOT_FOUND", message: "Report not found" });

      // Free reports — return pdfUrl directly
      if (report.isFree) {
        // Increment download count
        await db.update(reports)
          .set({ downloadCount: report.downloadCount + 1 })
          .where(eq(reports.id, report.id));
        return { pdfUrl: report.pdfUrl };
      }

      // Check if user already purchased this report
      const existing = await db
        .select({ id: reportDownloads.id })
        .from(reportDownloads)
        .where(and(
          eq(reportDownloads.userId, userId),
          eq(reportDownloads.reportId, report.id)
        ))
        .limit(1);

      if (existing.length > 0) {
        // Already purchased — return pdfUrl without re-charging
        return { pdfUrl: report.pdfUrl };
      }

      // Check credits balance
      const balance = await getUserCredits(userId);
      if (balance < report.creditCost) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: `Insufficient credits. Need ${report.creditCost}, have ${balance}.`,
        });
      }

      // Deduct credits atomically via direct SQL
      const deductDb = await getDb();
      if (!deductDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const deductResult = await deductDb.execute(
        sql`UPDATE users SET credits = credits - ${report.creditCost} WHERE id = ${userId} AND credits >= ${report.creditCost}`
      );
      const affected = (deductResult as unknown as { affectedRows?: number })?.affectedRows
        ?? (deductResult as unknown as [{ affectedRows?: number }])?.[0]?.affectedRows ?? 0;
      if (affected === 0) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Insufficient credits. Please top up and try again.",
        });
      }
      // Log the transaction
      await deductDb.insert(creditTransactions).values({
        userId,
        amount: -report.creditCost,
        balance: 0,
        type: "tool_usage",
        reason: `Report: ${report.titleEn}`,
      }).catch(() => { /* non-fatal */ });

      // Record the purchase
      await db.insert(reportDownloads).values({ userId, reportId: report.id });

      // Increment download count
      await db.update(reports)
        .set({ downloadCount: report.downloadCount + 1 })
        .where(eq(reports.id, report.id));

      return { pdfUrl: report.pdfUrl };
    }),

  /** Protected: list reports the current user already unlocked */
  myDownloads: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    const userId = ctx.user!.id;
    return db
      .select({ reportId: reportDownloads.reportId, createdAt: reportDownloads.createdAt })
      .from(reportDownloads)
      .where(eq(reportDownloads.userId, userId))
      .orderBy(desc(reportDownloads.createdAt));
  }),

  /* ─── Admin endpoints ─────────────────────────────────────────── */

  /** Admin: list ALL reports (draft + published) */
  adminList: protectedProcedure.query(async ({ ctx }) => {
    checkOwner(ctx);
    const db = await getDb();
    if (!db) return [];
    return db.select().from(reports).orderBy(desc(reports.createdAt));
  }),

  /** Admin: create a new report */
  adminCreate: protectedProcedure
    .input(z.object({
      slug:       z.string().min(1).max(255),
      titleAr:    z.string().min(1).max(500),
      titleEn:    z.string().min(1).max(500),
      descAr:     z.string().optional(),
      descEn:     z.string().optional(),
      category:   z.enum(CATEGORY_VALUES),
      coverImage: z.string().url().optional(),
      pdfUrl:     z.string().url(),
      isFree:     z.boolean().default(true),
      creditCost: z.number().int().min(0).default(0),
      published:  z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      checkOwner(ctx);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.insert(reports).values({
        slug:       input.slug,
        titleAr:    input.titleAr,
        titleEn:    input.titleEn,
        descAr:     input.descAr,
        descEn:     input.descEn,
        category:   input.category,
        coverImage: input.coverImage,
        pdfUrl:     input.pdfUrl,
        isFree:     input.isFree ? 1 : 0,
        creditCost: input.creditCost,
        published:  input.published ? 1 : 0,
      });
      return { ok: true };
    }),

  /** Admin: update a report */
  adminUpdate: protectedProcedure
    .input(z.object({
      id:         z.number().int().positive(),
      slug:       z.string().min(1).max(255).optional(),
      titleAr:    z.string().min(1).max(500).optional(),
      titleEn:    z.string().min(1).max(500).optional(),
      descAr:     z.string().optional(),
      descEn:     z.string().optional(),
      category:   z.enum(CATEGORY_VALUES).optional(),
      coverImage: z.string().url().optional().nullable(),
      pdfUrl:     z.string().url().optional(),
      isFree:     z.boolean().optional(),
      creditCost: z.number().int().min(0).optional(),
      published:  z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      checkOwner(ctx);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { id, isFree, published, ...rest } = input;
      await db.update(reports)
        .set({
          ...rest,
          ...(isFree     !== undefined && { isFree:    isFree    ? 1 : 0 }),
          ...(published  !== undefined && { published: published ? 1 : 0 }),
        })
        .where(eq(reports.id, id));
      return { ok: true };
    }),

  /** Admin: delete a report */
  adminDelete: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      checkOwner(ctx);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.delete(reports).where(eq(reports.id, input.id));
      return { ok: true };
    }),
});
