/**
 * Blog Router
 * Public endpoints serve ONLY published posts.
 * Admin endpoints are owner-only (checkOwner) and can manage drafts.
 *
 * NOTE: blog_posts is bilingual (AR/EN) with `published: int`.
 */

import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { checkOwner } from "../_core/authorization";
import { getDb } from "../db";
import { blogPosts } from "../../drizzle/schema";
import { TRPCError } from "@trpc/server";

const blogPublished = z.boolean();

export const blogRouter = router({
  /** Public: list published posts (SEO index). */
  getPosts: publicProcedure
    .input(
      z
        .object({
          limit: z.number().int().min(1).max(50).default(10),
          offset: z.number().int().min(0).default(0),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const limit = input?.limit ?? 10;
      const offset = input?.offset ?? 0;

      return db
        .select({
          id: blogPosts.id,
          slug: blogPosts.slug,
          titleAr: blogPosts.titleAr,
          titleEn: blogPosts.titleEn,
          excerptAr: blogPosts.excerptAr,
          excerptEn: blogPosts.excerptEn,
          coverImage: blogPosts.coverImage,
          publishedAt: blogPosts.publishedAt,
        })
        .from(blogPosts)
        .where(eq(blogPosts.published, 1))
        .orderBy(desc(blogPosts.publishedAt), desc(blogPosts.updatedAt))
        .limit(limit)
        .offset(offset);
    }),

  /** Public: get ONE published post by slug (full content). */
  getPostBySlug: publicProcedure
    .input(z.object({ slug: z.string().min(1).max(255) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const rows = await db
        .select()
        .from(blogPosts)
        // IMPORTANT: do NOT leak drafts.
        .where(and(eq(blogPosts.slug, input.slug), eq(blogPosts.published, 1)))
        .limit(1);

      return rows[0] ?? null;
    }),

  /** Admin: list ALL posts (draft + published). */
  adminList: protectedProcedure
    .input(
      z
        .object({
          published: blogPublished.optional(),
          limit: z.number().int().min(1).max(200).default(50),
          offset: z.number().int().min(0).default(0),
        })
        .optional()
    )
    .query(async ({ input, ctx }) => {
      checkOwner(ctx);
      const db = await getDb();
      if (!db) return [];

      const limit = input?.limit ?? 50;
      const offset = input?.offset ?? 0;
      const published = input?.published;

      return db
        .select()
        .from(blogPosts)
        .where(published == null ? undefined : eq(blogPosts.published, published ? 1 : 0))
        .orderBy(desc(blogPosts.updatedAt))
        .limit(limit)
        .offset(offset);
    }),

  /** Admin: create post (draft/published). */
  adminCreate: protectedProcedure
    .input(
      z.object({
        slug: z.string().min(3).max(255),
        titleAr: z.string().min(1).max(500),
        titleEn: z.string().min(1).max(500),
        excerptAr: z.string().max(5000).optional().nullable(),
        excerptEn: z.string().max(5000).optional().nullable(),
        contentAr: z.string().min(1).max(200_000),
        contentEn: z.string().min(1).max(200_000),
        coverImage: z.string().max(1000).optional().nullable(),
        category: z.string().max(100).optional().nullable(),
        tags: z.string().max(500).optional().nullable(),
        published: z.boolean().default(false),
        seoTitleAr: z.string().max(500).optional().nullable(),
        seoTitleEn: z.string().max(500).optional().nullable(),
        seoDescAr: z.string().max(5000).optional().nullable(),
        seoDescEn: z.string().max(5000).optional().nullable(),
        readingTimeMin: z.number().int().min(1).max(120).optional().nullable(),
        publishedAt: z.coerce.date().optional().nullable(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      checkOwner(ctx);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB not connected" });

      const rows = await db
        .insert(blogPosts)
        .values({
          slug: input.slug,
          titleAr: input.titleAr,
          titleEn: input.titleEn,
          excerptAr: input.excerptAr ?? null,
          excerptEn: input.excerptEn ?? null,
          contentAr: input.contentAr,
          contentEn: input.contentEn,
          coverImage: input.coverImage ?? null,
          category: input.category ?? null,
          tags: input.tags ?? null,
          published: input.published ? 1 : 0,
          publishedAt: input.published ? (input.publishedAt ?? new Date()) : (input.publishedAt ?? null),
          seoTitleAr: input.seoTitleAr ?? null,
          seoTitleEn: input.seoTitleEn ?? null,
          seoDescAr: input.seoDescAr ?? null,
          seoDescEn: input.seoDescEn ?? null,
          readingTimeMin: input.readingTimeMin ?? null,
        })
        .$returningId();

      return { id: rows[0]?.id ?? null };
    }),

  /** Admin: update post by id. */
  adminUpdate: protectedProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        slug: z.string().min(3).max(255).optional(),
        titleAr: z.string().min(1).max(500).optional(),
        titleEn: z.string().min(1).max(500).optional(),
        excerptAr: z.string().max(5000).optional().nullable(),
        excerptEn: z.string().max(5000).optional().nullable(),
        contentAr: z.string().min(1).max(200_000).optional(),
        contentEn: z.string().min(1).max(200_000).optional(),
        coverImage: z.string().max(1000).optional().nullable(),
        category: z.string().max(100).optional().nullable(),
        tags: z.string().max(500).optional().nullable(),
        published: z.boolean().optional(),
        seoTitleAr: z.string().max(500).optional().nullable(),
        seoTitleEn: z.string().max(500).optional().nullable(),
        seoDescAr: z.string().max(5000).optional().nullable(),
        seoDescEn: z.string().max(5000).optional().nullable(),
        readingTimeMin: z.number().int().min(1).max(120).optional().nullable(),
        publishedAt: z.coerce.date().optional().nullable(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      checkOwner(ctx);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB not connected" });

      const { id, published, ...patch } = input;
      await db
        .update(blogPosts)
        .set({
          ...patch,
          ...(published == null ? {} : { published: published ? 1 : 0 }),
        })
        .where(eq(blogPosts.id, id));

      return { success: true };
    }),

  /** Admin: delete post by id. */
  adminDelete: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      checkOwner(ctx);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB not connected" });

      await db.delete(blogPosts).where(eq(blogPosts.id, input.id));
      return { success: true };
    }),
});

