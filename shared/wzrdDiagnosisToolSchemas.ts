/**
 * Zod inputs for WZZRD diagnosis tools — must match client ToolPage field `name` values.
 */
import { z } from "zod";

const opt = (max: number) => z.string().max(max).optional();
const req = (max: number) => z.string().min(1).max(max);

export const brandDiagnosisInputSchema = z.object({
  companyName: req(255),
  industry: req(100),
  market: req(50),
  yearsInBusiness: opt(50),
  teamSize: opt(50),
  website: opt(500),
  socialMedia: opt(500),
  currentPositioning: opt(1000),
  targetAudience: req(1000),
  monthlyRevenue: opt(50),
  biggestChallenge: req(1000),
  previousBranding: opt(50),
});

export const offerCheckInputSchema = z.object({
  companyName: req(255),
  industry: req(100),
  currentPackages: req(2000),
  numberOfPackages: opt(50),
  pricingModel: opt(50),
  cheapestPrice: opt(120),
  highestPrice: opt(120),
  targetAudience: req(1000),
  commonObjections: opt(1000),
  competitorPricing: opt(1000),
});

export const messageCheckInputSchema = z.object({
  companyName: req(255),
  industry: req(100),
  tagline: opt(500),
  elevatorPitch: req(1000),
  websiteHeadline: opt(500),
  instagramBio: opt(500),
  linkedinAbout: opt(1000),
  keyDifferentiator: opt(1000),
  toneOfVoice: opt(50),
  customerQuote: opt(500),
});

export const presenceAuditInputSchema = z.object({
  companyName: req(255),
  industry: req(100),
  website: opt(500),
  instagramHandle: opt(255),
  instagramFollowers: opt(50),
  otherPlatforms: opt(500),
  postingFrequency: opt(50),
  contentType: opt(500),
  inquiryMethod: req(500),
  avgResponseTime: opt(50),
  googleBusiness: opt(50),
});

export const identitySnapshotInputSchema = z.object({
  companyName: req(255),
  industry: req(100),
  brandPersonality: req(1000),
  targetAudience: req(1000),
  brandColors: opt(200),
  hasLogo: opt(50),
  hasGuidelines: opt(50),
  competitors: opt(1000),
  desiredPerception: req(1000),
  currentGap: opt(1000),
});

export const launchReadinessInputSchema = z.object({
  companyName: req(255),
  industry: req(100),
  launchType: req(50),
  targetLaunchDate: opt(50),
  hasGuidelines: opt(50),
  hasOfferStructure: opt(50),
  hasWebsite: opt(50),
  hasContentPlan: opt(50),
  marketingBudget: opt(50),
  teamCapacity: opt(500),
  biggestConcern: req(1000),
  successMetric: opt(1000),
});

export const designHealthInputSchema = z.object({
  companyName: req(255),
  industry: req(100),
  website: req(500),
});

export type BrandDiagnosisInput = z.infer<typeof brandDiagnosisInputSchema>;
export type OfferCheckInput = z.infer<typeof offerCheckInputSchema>;
export type MessageCheckInput = z.infer<typeof messageCheckInputSchema>;
export type PresenceAuditInput = z.infer<typeof presenceAuditInputSchema>;
export type IdentitySnapshotInput = z.infer<typeof identitySnapshotInputSchema>;
export type LaunchReadinessInput = z.infer<typeof launchReadinessInputSchema>;
export type DesignHealthInput = z.infer<typeof designHealthInputSchema>;
