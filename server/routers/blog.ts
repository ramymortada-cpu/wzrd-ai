/**
 * Blog Router — Sprint A (Acquisition Engine)
 * Public endpoints serve ONLY published posts.
 * Admin endpoints are owner-only (checkOwner) and can manage drafts.
 */

import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { checkOwner } from "../_core/authorization";
import { getDb } from "../db";
import { blogPosts } from "../../drizzle/schema";
import { TRPCError } from "@trpc/server";

const blogStatus = z.enum(["draft", "published"]);

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
          title: blogPosts.title,
          excerpt: blogPosts.excerpt,
          coverImage: blogPosts.coverImage,
          publishedAt: blogPosts.publishedAt,
        })
        .from(blogPosts)
        .where(eq(blogPosts.status, "published"))
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
        .where(and(eq(blogPosts.slug, input.slug), eq(blogPosts.status, "published")))
        .limit(1);

      return rows[0] ?? null;
    }),

  /** Admin: list ALL posts (draft + published). */
  adminList: protectedProcedure
    .input(
      z
        .object({
          status: blogStatus.optional(),
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
      const status = input?.status;

      return db
        .select()
        .from(blogPosts)
        .where(status ? eq(blogPosts.status, status) : undefined)
        .orderBy(desc(blogPosts.updatedAt))
        .limit(limit)
        .offset(offset);
    }),

  /** Admin: create post (draft/published). */
  adminCreate: protectedProcedure
    .input(
      z.object({
        slug: z.string().min(3).max(255),
        title: z.string().min(1).max(500),
        excerpt: z.string().max(5000).optional().nullable(),
        content: z.string().min(1).max(200_000),
        coverImage: z.string().max(5000).optional().nullable(),
        status: blogStatus.default("draft"),
        seoTitle: z.string().max(500).optional().nullable(),
        seoDescription: z.string().max(1000).optional().nullable(),
        seoKeywords: z.string().max(1000).optional().nullable(),
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
          title: input.title,
          excerpt: input.excerpt ?? null,
          content: input.content,
          coverImage: input.coverImage ?? null,
          status: input.status,
          seoTitle: input.seoTitle ?? null,
          seoDescription: input.seoDescription ?? null,
          seoKeywords: input.seoKeywords ?? null,
          publishedAt:
            input.status === "published"
              ? (input.publishedAt ?? new Date())
              : (input.publishedAt ?? null),
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
        title: z.string().min(1).max(500).optional(),
        excerpt: z.string().max(5000).optional().nullable(),
        content: z.string().min(1).max(200_000).optional(),
        coverImage: z.string().max(5000).optional().nullable(),
        status: blogStatus.optional(),
        seoTitle: z.string().max(500).optional().nullable(),
        seoDescription: z.string().max(1000).optional().nullable(),
        seoKeywords: z.string().max(1000).optional().nullable(),
        publishedAt: z.coerce.date().optional().nullable(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      checkOwner(ctx);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB not connected" });

      const { id, ...patch } = input;
      await db
        .update(blogPosts)
        .set({
          ...patch,
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

