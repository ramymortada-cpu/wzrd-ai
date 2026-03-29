/**
 * Contract verification (Node + tsx) — WZZRD ToolPage payloads vs tRPC Zod inputs.
 * Vitest in this repo hits a Vite SSR bug when importing local shared/*.ts modules.
 *
 * Run: pnpm test:diagnosis-contract
 */
import assert from "node:assert/strict";
import {
  WZRD_DIAGNOSIS_TOOL_COSTS,
} from "../shared/wzrdDiagnosisToolCosts.ts";
import {
  brandDiagnosisInputSchema,
  offerCheckInputSchema,
  messageCheckInputSchema,
  presenceAuditInputSchema,
  identitySnapshotInputSchema,
  launchReadinessInputSchema,
} from "../shared/wzrdDiagnosisToolSchemas.ts";

function main() {
  const ids = Object.keys(WZRD_DIAGNOSIS_TOOL_COSTS);
  assert.equal(ids.length, 6, "six diagnosis tools billed");
  for (const id of ids) {
    assert.ok(WZRD_DIAGNOSIS_TOOL_COSTS[id]! > 0, `${id} cost > 0`);
  }

  brandDiagnosisInputSchema.parse({
    companyName: "Sahra Café",
    industry: "food_beverage",
    market: "ksa",
    yearsInBusiness: "1_3",
    teamSize: "2_5",
    website: "https://example.com",
    socialMedia: "@sahra",
    currentPositioning: "Coffee",
    targetAudience: "Professionals",
    monthlyRevenue: "10_50k",
    biggestChallenge: "Differentiation",
    previousBranding: "yes_needs_update",
  });

  offerCheckInputSchema.parse({
    companyName: "Acme",
    industry: "services",
    currentPackages: "Basic … Pro …",
    numberOfPackages: "2_3",
    pricingModel: "subscription",
    cheapestPrice: "299",
    highestPrice: "999",
    targetAudience: "SMB",
    commonObjections: "price",
    competitorPricing: "lower elsewhere",
  });

  messageCheckInputSchema.parse({
    companyName: "Nile",
    industry: "technology",
    tagline: "Ship",
    elevatorPitch: "We build tools.",
    websiteHeadline: "Ops",
    instagramBio: "bio",
    linkedinAbout: "about",
    keyDifferentiator: "support",
    toneOfVoice: "friendly",
    customerQuote: "great",
  });

  presenceAuditInputSchema.parse({
    companyName: "DF",
    industry: "retail",
    website: "https://x.com",
    instagramHandle: "@x",
    instagramFollowers: "5k_20k",
    otherPlatforms: "TikTok",
    postingFrequency: "daily",
    contentType: "reels",
    inquiryMethod: "WhatsApp",
    avgResponseTime: "same_day",
    googleBusiness: "yes_updated",
  });

  identitySnapshotInputSchema.parse({
    companyName: "P",
    industry: "fashion",
    brandPersonality: "Bold",
    targetAudience: "Women 25-35",
    brandColors: "black",
    hasLogo: "yes_pro",
    hasGuidelines: "partial",
    competitors: "A,B",
    desiredPerception: "Premium",
    currentGap: "mixed signals",
  });

  launchReadinessInputSchema.parse({
    companyName: "L",
    industry: "ecommerce",
    launchType: "new_brand",
    targetLaunchDate: "1_3months",
    hasGuidelines: "in_progress",
    hasOfferStructure: "yes",
    hasWebsite: "in_progress",
    hasContentPlan: "ideas",
    marketingBudget: "5_15k",
    teamCapacity: "solo",
    biggestConcern: "ICP",
    successMetric: "orders",
  });

  const badLaunch = launchReadinessInputSchema.safeParse({
    companyName: "X",
    industry: "y",
    launchType: "new_brand",
    biggestConcern: "z",
    hasGuidelines: true,
  });
  assert.equal(badLaunch.success, false, "booleans must not parse for launch enums");

  console.log("verify-diagnosis-tool-contract: OK (6 tools + 6 payloads + launch boolean guard)");
}

main();
