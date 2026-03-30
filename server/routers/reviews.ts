/**
 * Reviews Router — Incentivized Review Loop for WZZRD AI tool reports.
 *
 * Public endpoints:
 *   reviews.listApproved  → homepage testimonials feed
 *
 * Protected endpoints:
 *   reviews.submit        → user submits a review after a tool report (grants 100 CR)
 *   reviews.myReviews     → user's own review history
 *
 * Admin endpoints:
 *   reviews.pending       → list reviews awaiting moderation
 *   reviews.approve       → approve a review (makes it public)
 *   reviews.reject        → reject a review
 */
import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { checkOwner } from "../_core/authorization";
import { getDb } from "../db";
import { toolReviews, users } from "../../drizzle/schema";
import { addCredits } from "../db/credits";
import { TRPCError } from "@trpc/server";

const REVIEW_CREDIT_REWARD = 100;

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Map of country names → emoji flags for auto-detection display */
const COUNTRY_FLAGS: Record<string, string> = {
  "Egypt":        "🇪🇬",
  "Saudi Arabia": "🇸🇦",
  "UAE":          "🇦🇪",
  "Kuwait":       "🇰🇼",
  "Jordan":       "🇯🇴",
  "Qatar":        "🇶🇦",
  "Bahrain":      "🇧🇭",
  "Oman":         "🇴🇲",
  "Morocco":      "🇲🇦",
  "Tunisia":      "🇹🇳",
  "Algeria":      "🇩🇿",
  "Libya":        "🇱🇾",
  "Lebanon":      "🇱🇧",
  "Iraq":         "🇮🇶",
  "Sudan":        "🇸🇩",
  "Other":        "🌍",
};

export const reviewsRouter = router({

  // ── PUBLIC ─────────────────────────────────────────────────────────────────

  /** List approved reviews for homepage display */
  listApproved: publicProcedure
    .input(z.object({
      limit:  z.number().int().min(1).max(50).default(12),
      offset: z.number().int().min(0).default(0),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const limit  = input?.limit  ?? 12;
      const offset = input?.offset ?? 0;
      return db
        .select({
          id:          toolReviews.id,
          toolId:      toolReviews.toolId,
          toolNameAr:  toolReviews.toolNameAr,
          toolNameEn:  toolReviews.toolNameEn,
          rating:      toolReviews.rating,
          commentAr:   toolReviews.commentAr,
          commentEn:   toolReviews.commentEn,
          country:     toolReviews.country,
          countryFlag: toolReviews.countryFlag,
          createdAt:   toolReviews.createdAt,
        })
        .from(toolReviews)
        .where(eq(toolReviews.status, "approved"))
        .orderBy(desc(toolReviews.createdAt))
        .limit(limit)
        .offset(offset);
    }),

  // ── PROTECTED ──────────────────────────────────────────────────────────────

  /** Submit a review after completing a tool report */
  submit: protectedProcedure
    .input(z.object({
      toolId:     z.string().min(1).max(64),
      toolNameAr: z.string().min(1).max(120),
      toolNameEn: z.string().min(1).max(120),
      rating:     z.number().int().min(1).max(5),
      commentAr:  z.string().max(1000).optional(),
      commentEn:  z.string().max(1000).optional(),
      country:    z.string().max(64).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const userId = ctx.user!.id;

      // Prevent duplicate reviews for the same tool by the same user
      const existing = await db
        .select({ id: toolReviews.id, creditedAt: toolReviews.creditedAt })
        .from(toolReviews)
        .where(and(eq(toolReviews.userId, userId), eq(toolReviews.toolId, input.toolId)))
        .limit(1);

      if (existing.length > 0) {
        // Already reviewed this tool — return existing review id without re-crediting
        return { reviewId: existing[0].id, alreadyReviewed: true, creditsAwarded: 0 };
      }

      // Resolve country flag
      const countryFlag = input.country ? (COUNTRY_FLAGS[input.country] ?? "🌍") : undefined;

      // Insert the review (pending moderation)
      const [inserted] = await db.insert(toolReviews).values({
        userId,
        toolId:      input.toolId,
        toolNameAr:  input.toolNameAr,
        toolNameEn:  input.toolNameEn,
        rating:      input.rating,
        commentAr:   input.commentAr ?? null,
        commentEn:   input.commentEn ?? null,
        country:     input.country ?? null,
        countryFlag: countryFlag ?? null,
        status:      "pending",
        creditedAt:  new Date(), // credit immediately on submission
      });

      // Grant 100 credits as reward
      await addCredits(userId, REVIEW_CREDIT_REWARD, "admin", `مكافأة تقييم أداة: ${input.toolNameAr}`);

      return {
        reviewId:       (inserted as { insertId?: number })?.insertId ?? 0,
        alreadyReviewed: false,
        creditsAwarded:  REVIEW_CREDIT_REWARD,
      };
    }),

  /** Get the current user's own review history */
  myReviews: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db
      .select()
      .from(toolReviews)
      .where(eq(toolReviews.userId, ctx.user!.id))
      .orderBy(desc(toolReviews.createdAt));
  }),

  /** Check if the current user has already reviewed a specific tool */
  hasReviewed: protectedProcedure
    .input(z.object({ toolId: z.string().min(1).max(64) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { reviewed: false };
      const rows = await db
        .select({ id: toolReviews.id })
        .from(toolReviews)
        .where(and(eq(toolReviews.userId, ctx.user!.id), eq(toolReviews.toolId, input.toolId)))
        .limit(1);
      return { reviewed: rows.length > 0 };
    }),

  // ── ADMIN ──────────────────────────────────────────────────────────────────

  /** List all pending reviews (admin only) */
  pending: protectedProcedure.query(async ({ ctx }) => {
    checkOwner(ctx);
    const db = await getDb();
    if (!db) return [];
    return db
      .select({
        id:          toolReviews.id,
        userId:      toolReviews.userId,
        toolId:      toolReviews.toolId,
        toolNameAr:  toolReviews.toolNameAr,
        toolNameEn:  toolReviews.toolNameEn,
        rating:      toolReviews.rating,
        commentAr:   toolReviews.commentAr,
        commentEn:   toolReviews.commentEn,
        country:     toolReviews.country,
        countryFlag: toolReviews.countryFlag,
        status:      toolReviews.status,
        creditedAt:  toolReviews.creditedAt,
        createdAt:   toolReviews.createdAt,
        // Join user info
        userName:    users.name,
        userEmail:   users.email,
      })
      .from(toolReviews)
      .leftJoin(users, eq(toolReviews.userId, users.id))
      .where(eq(toolReviews.status, "pending"))
      .orderBy(desc(toolReviews.createdAt));
  }),

  /** List ALL reviews (admin only) */
  listAll: protectedProcedure
    .input(z.object({
      status: z.enum(["pending", "approved", "rejected", "all"]).default("all"),
      limit:  z.number().int().min(1).max(100).default(50),
      offset: z.number().int().min(0).default(0),
    }).optional())
    .query(async ({ ctx, input }) => {
      checkOwner(ctx);
      const db = await getDb();
      if (!db) return [];
      const status = input?.status ?? "all";
      const limit  = input?.limit  ?? 50;
      const offset = input?.offset ?? 0;
      const conditions = status !== "all"
        ? [eq(toolReviews.status, status as "pending" | "approved" | "rejected")]
        : [];
      return db
        .select({
          id:          toolReviews.id,
          userId:      toolReviews.userId,
          toolId:      toolReviews.toolId,
          toolNameAr:  toolReviews.toolNameAr,
          toolNameEn:  toolReviews.toolNameEn,
          rating:      toolReviews.rating,
          commentAr:   toolReviews.commentAr,
          commentEn:   toolReviews.commentEn,
          country:     toolReviews.country,
          countryFlag: toolReviews.countryFlag,
          status:      toolReviews.status,
          creditedAt:  toolReviews.creditedAt,
          createdAt:   toolReviews.createdAt,
          userName:    users.name,
          userEmail:   users.email,
        })
        .from(toolReviews)
        .leftJoin(users, eq(toolReviews.userId, users.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(toolReviews.createdAt))
        .limit(limit)
        .offset(offset);
    }),

  /** Approve a review — makes it public on the homepage */
  approve: protectedProcedure
    .input(z.object({ reviewId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      checkOwner(ctx);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db
        .update(toolReviews)
        .set({ status: "approved", updatedAt: new Date() })
        .where(eq(toolReviews.id, input.reviewId));
      return { success: true };
    }),

  /** Reject a review */
  reject: protectedProcedure
    .input(z.object({ reviewId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      checkOwner(ctx);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db
        .update(toolReviews)
        .set({ status: "rejected", updatedAt: new Date() })
        .where(eq(toolReviews.id, input.reviewId));
      return { success: true };
    }),
});
