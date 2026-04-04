/**
 * Brand Profile Router — manages the persistent brand data store.
 * This is the "Brand Twin Memory" — every diagnosis upserts data here,
 * and the Copilot + Execution tools read from here.
 */
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db/index";
import { brandProfiles, users, diagnosisHistory } from "../../drizzle/schema";
import { eq, sql } from "drizzle-orm";
import { logger } from "../_core/logger";
import { autoExtractBrandData } from "../brandAutoExtract";

const TOTAL_BRAND_PROFILE_SLOTS = 55;
const TOOL_HISTORY_SLOT_BUDGET = TOTAL_BRAND_PROFILE_SLOTS - 11;
const DISTINCT_TOOLS_FOR_FULL_HISTORY_SLOTS = 6;

function valueFilled(v: unknown): boolean {
  return v !== null && v !== undefined && String(v).trim().length > 0;
}

function countCoreProfileSlots(
  bp: typeof brandProfiles.$inferSelect | undefined,
  displayName: string | null,
): number {
  let n = 0;
  if (valueFilled(displayName)) n++;
  if (!bp) return n;
  const keys = [
    "companyName",
    "industry",
    "market",
    "website",
    "tagline",
    "elevatorPitch",
    "toneOfVoice",
    "targetAudience",
    "brandPersonality",
    "brandColors",
  ] as const;
  for (const k of keys) {
    if (valueFilled(bp[k])) n++;
  }
  return n;
}

function computeCompleteness55(coreFilled: number, distinctToolCount: number): { filledSlots55: number; completeness55: number } {
  const toolFilled = Math.min(
    TOOL_HISTORY_SLOT_BUDGET,
    Math.round((distinctToolCount / DISTINCT_TOOLS_FOR_FULL_HISTORY_SLOTS) * TOOL_HISTORY_SLOT_BUDGET),
  );
  const filledSlots55 = Math.min(TOTAL_BRAND_PROFILE_SLOTS, coreFilled + toolFilled);
  const completeness55 = Math.round((filledSlots55 / TOTAL_BRAND_PROFILE_SLOTS) * 100);
  return { filledSlots55, completeness55 };
}

/** Field mapping: tool formData key → brand_profiles column */
const FIELD_MAP: Record<string, string> = {
  // Core identity
  companyName: "companyName",
  industry: "industry",
  market: "market",
  website: "website",
  socialMedia: "socialMedia",
  yearsInBusiness: "yearsInBusiness",
  teamSize: "teamSize",
  monthlyRevenue: "monthlyRevenue",
  // Positioning
  currentPositioning: "currentPositioning",
  targetAudience: "targetAudience",
  biggestChallenge: "biggestChallenge",
  brandPersonality: "brandPersonality",
  desiredPerception: "desiredPerception",
  currentGap: "currentGap",
  competitors: "competitors",
  // Messaging
  tagline: "tagline",
  elevatorPitch: "elevatorPitch",
  websiteHeadline: "websiteHeadline",
  instagramBio: "instagramBio",
  linkedinAbout: "linkedinAbout",
  toneOfVoice: "toneOfVoice",
  keyDifferentiator: "keyDifferentiator",
  customerQuote: "customerQuote",
  // Visual
  brandColors: "brandColors",
  hasLogo: "hasLogo",
  hasGuidelines: "hasGuidelines",
  // Offer
  currentPackages: "currentPackages",
  numberOfPackages: "numberOfPackages",
  pricingModel: "pricingModel",
  cheapestPrice: "cheapestPrice",
  highestPrice: "highestPrice",
  commonObjections: "commonObjections",
  competitorPricing: "competitorPricing",
  // Presence
  instagramHandle: "instagramHandle",
  instagramFollowers: "instagramFollowers",
  otherPlatforms: "otherPlatforms",
  postingFrequency: "postingFrequency",
  contentType: "contentType",
  inquiryMethod: "inquiryMethod",
  avgResponseTime: "avgResponseTime",
  googleBusiness: "googleBusiness",
  // Launch
  launchType: "launchType",
  targetLaunchDate: "targetLaunchDate",
  hasOfferStructure: "hasOfferStructure",
  hasWebsite: "hasWebsite",
  hasContentPlan: "hasContentPlan",
  marketingBudget: "marketingBudget",
  teamCapacity: "teamCapacity",
  biggestConcern: "biggestConcern",
  successMetric: "successMetric",
};

/**
 * Upserts brand profile data from a diagnosis formData.
 * Only non-empty values are merged — existing data is never overwritten with empty strings.
 */
export async function upsertBrandProfile(
  userId: number,
  toolId: string,
  formData: Record<string, unknown>,
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    // Build the update object from formData
    const updates: Record<string, unknown> = {};
    for (const [formKey, dbKey] of Object.entries(FIELD_MAP)) {
      const val = formData[formKey];
      if (typeof val === "string" && val.trim().length > 0) {
        updates[dbKey] = val.trim();
      }
    }

    if (Object.keys(updates).length === 0) return;

    // Check if profile exists
    const existing = await db
      .select({ id: brandProfiles.id })
      .from(brandProfiles)
      .where(eq(brandProfiles.userId, userId))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(brandProfiles)
        .set({
          ...updates,
          lastToolUsed: toolId,
          updatedAt: new Date(),
        })
        .where(eq(brandProfiles.userId, userId));

      await db.execute(
        sql`UPDATE brand_profiles SET total_diagnoses_run = total_diagnoses_run + 1 WHERE user_id = ${userId}`,
      );
    } else {
      // Insert new profile
      await db.insert(brandProfiles).values({
        userId,
        ...updates,
        lastToolUsed: toolId,
        totalDiagnosesRun: 1,
      } as typeof brandProfiles.$inferInsert);
    }

    logger.info(
      { userId, toolId, fieldsUpdated: Object.keys(updates).length },
      "Brand profile upserted",
    );
  } catch (err) {
    logger.error({ err, userId, toolId }, "Failed to upsert brand profile");
  }
}

/**
 * Reads the full brand profile for the Copilot context.
 */
export async function getBrandProfileForContext(
  userId: number,
): Promise<Record<string, unknown> | null> {
  const db = await getDb();
  if (!db) return null;

  const rows = await db
    .select()
    .from(brandProfiles)
    .where(eq(brandProfiles.userId, userId))
    .limit(1);

  return rows[0] ?? null;
}

export const brandProfileRouter = router({
  /** Get the current user's brand profile (+ displayName, completeness55 for nudges) */
  getMyProfile: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    }

    const userId = ctx.user!.id;
    const [u] = await db.select({ name: users.name }).from(users).where(eq(users.id, userId)).limit(1);
    const [bp] = await db.select().from(brandProfiles).where(eq(brandProfiles.userId, userId)).limit(1);

    let distinctToolCount = 0;
    try {
      const [distRow] = await db
        .select({
          c: sql<number>`count(distinct ${diagnosisHistory.toolId})`.mapWith(Number),
        })
        .from(diagnosisHistory)
        .where(eq(diagnosisHistory.userId, userId));
      distinctToolCount = Number(distRow?.c ?? 0);
    } catch {
      distinctToolCount = 0;
    }

    const displayName = u?.name ?? null;
    const coreFilled = countCoreProfileSlots(bp, displayName);
    const { filledSlots55, completeness55 } = computeCompleteness55(coreFilled, distinctToolCount);

    return {
      ...(bp ?? {}),
      displayName,
      completeness55,
      filledSlots55,
    };
  }),

  /** Manually update brand profile fields (merged into brand_profiles) */
  updateProfile: protectedProcedure
    .input(
      z
        .object({
          companyName: z.string().max(255).optional(),
          company: z.string().max(255).optional(),
          industry: z.string().max(100).optional(),
          market: z.string().max(50).optional(),
          website: z.string().max(500).optional(),
          tagline: z.string().max(500).optional(),
          elevatorPitch: z.string().max(8000).optional(),
          toneOfVoice: z.string().max(50).optional(),
          targetAudience: z.string().max(8000).optional(),
          brandPersonality: z.string().max(8000).optional(),
          brandColors: z.string().max(200).optional(),
        })
        .transform((raw) => {
          const companyName = raw.companyName?.trim() || raw.company?.trim();
          return {
            companyName: companyName || undefined,
            industry: raw.industry?.trim() || undefined,
            market: raw.market?.trim() || undefined,
            website: raw.website?.trim() || undefined,
            tagline: raw.tagline?.trim() || undefined,
            elevatorPitch: raw.elevatorPitch?.trim() || undefined,
            toneOfVoice: raw.toneOfVoice?.trim() || undefined,
            targetAudience: raw.targetAudience?.trim() || undefined,
            brandPersonality: raw.brandPersonality?.trim() || undefined,
            brandColors: raw.brandColors?.trim() || undefined,
          };
        }),
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      }

      const updates: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(input)) {
        if (typeof val === "string" && val.length > 0) {
          updates[key] = val;
        }
      }

      if (Object.keys(updates).length === 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No fields to update" });
      }

      const userId = ctx.user!.id;
      const existing = await db
        .select({ id: brandProfiles.id })
        .from(brandProfiles)
        .where(eq(brandProfiles.userId, userId))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(brandProfiles)
          .set({ ...updates, updatedAt: new Date() })
          .where(eq(brandProfiles.userId, userId));
      } else {
        await db.insert(brandProfiles).values({
          userId,
          ...updates,
        } as typeof brandProfiles.$inferInsert);
      }

      return { success: true as const };
    }),

  /** Auto-extract brand data from a URL */
  autoExtract: protectedProcedure
    .input(
      z.object({
        url: z
          .string()
          .min(1)
          .max(2000)
          .transform((s) => {
            const t = s.trim();
            if (!/^https?:\/\//i.test(t)) return `https://${t}`;
            return t;
          })
          .pipe(z.string().url()),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const result = await autoExtractBrandData(ctx.user!.id, input.url);
      return result;
    }),
});
