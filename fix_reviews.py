#!/usr/bin/env python3
content = open('server/routers/reviews.ts').read()

# Find the insertion point
marker = '  // \u2500\u2500 PROTECTED \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500'

new_procedure = '''  /** Public: list approved reviews for a specific tool (social proof on tool page) */
  listByTool: publicProcedure
    .input(z.object({
      toolId: z.string().min(1).max(64),
      limit:  z.number().int().min(1).max(20).default(6),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
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
        .where(and(eq(toolReviews.status, "approved"), eq(toolReviews.toolId, input.toolId)))
        .orderBy(desc(toolReviews.createdAt))
        .limit(input.limit);
    }),

'''

idx = content.find(marker)
if idx == -1:
    print("MARKER NOT FOUND")
    # Try a simpler marker
    marker2 = '// \u2500\u2500 PROTECTED'
    idx = content.find(marker2)
    if idx != -1:
        print(f"Found simpler marker at {idx}")
        content = content[:idx] + new_procedure + content[idx:]
        open('server/routers/reviews.ts', 'w').write(content)
        print('SUCCESS with simpler marker')
    else:
        print("NOTHING FOUND")
else:
    content = content[:idx] + new_procedure + content[idx:]
    open('server/routers/reviews.ts', 'w').write(content)
    print('SUCCESS')
