/**
 * Brand Profile Router — manages the persistent brand data store.
 * This is the "Brand Twin Memory" — every diagnosis upserts data here,
 * and the Copilot + Execution tools read from here.
 */
import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db/index";
import { brandProfiles } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { logger } from "../_core/logger";

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
      // Update: merge new data into existing profile
      await db
        .update(brandProfiles)
        .set({
          ...updates,
          lastToolUsed: toolId,
          totalDiagnosesRun: existing[0].id, // Will be incremented via SQL below
          updatedAt: new Date(),
        })
        .where(eq(brandProfiles.userId, userId));

      // Increment totalDiagnosesRun atomically
      await db.execute(
        `UPDATE brand_profiles SET total_diagnoses_run = total_diagnoses_run + 1 WHERE user_id = ${userId}`,
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
  /** Get the current user's brand profile */
  getMyProfile: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;

    const rows = await db
      .select()
      .from(brandProfiles)
      .where(eq(brandProfiles.userId, ctx.user!.id))
      .limit(1);

    return rows[0] ?? null;
  }),

  /** Manually update brand profile fields */
  updateProfile: protectedProcedure
    .input(
      z.object({
        companyName: z.string().max(255).optional(),
        industry: z.string().max(100).optional(),
        website: z.string().max(500).optional(),
        tagline: z.string().max(500).optional(),
        elevatorPitch: z.string().max(2000).optional(),
        toneOfVoice: z.string().max(50).optional(),
        targetAudience: z.string().max(2000).optional(),
        brandPersonality: z.string().max(2000).optional(),
        brandColors: z.string().max(200).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const updates: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(input)) {
        if (typeof val === "string" && val.trim().length > 0) {
          updates[key] = val.trim();
        }
      }

      if (Object.keys(updates).length === 0) {
        throw new Error("No fields to update");
      }

      const existing = await db
        .select({ id: brandProfiles.id })
        .from(brandProfiles)
        .where(eq(brandProfiles.userId, ctx.user!.id))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(brandProfiles)
          .set({ ...updates, updatedAt: new Date() })
          .where(eq(brandProfiles.userId, ctx.user!.id));
      } else {
        await db.insert(brandProfiles).values({
          userId: ctx.user!.id,
          ...updates,
        } as typeof brandProfiles.$inferInsert);
      }

      return { success: true };
    }),
});
