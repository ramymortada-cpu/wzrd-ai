/**
 * BRAND AUTO-EXTRACT
 * ==================
 * Scrapes a user's website and uses AI to extract brand profile fields.
 *
 * Flow:
 * 1. User provides a URL (website, Instagram, LinkedIn, etc.)
 * 2. We scrape the page content using the existing scrapeWebsite()
 * 3. We send the scraped content to the LLM with a structured extraction prompt
 * 4. The LLM returns a JSON object with brand profile fields
 * 5. We upsert the extracted data into brand_profiles
 *
 * This runs as a background task — non-blocking to the user.
 */

import { scrapeWebsite } from "./researchEngine";
import { resilientLLM } from "./_core/llmRouter";
import { upsertBrandProfile } from "./routers/brandProfile";
import { logger } from "./_core/logger";

/** Fields the AI should extract from a scraped page */
const EXTRACTION_SCHEMA = `{
  "companyName": "string or null — the business/brand name",
  "industry": "string or null — the industry or sector",
  "market": "string or null — target market (e.g. Saudi Arabia, MENA, Global)",
  "website": "string or null — the main website URL",
  "socialMedia": "string or null — social media links found",
  "currentPositioning": "string or null — how the brand positions itself",
  "targetAudience": "string or null — who the brand targets",
  "tagline": "string or null — the brand tagline or slogan",
  "elevatorPitch": "string or null — a short description of what the brand does",
  "websiteHeadline": "string or null — the main headline on the website",
  "toneOfVoice": "string or null — the brand's tone (professional, casual, playful, etc.)",
  "keyDifferentiator": "string or null — what makes this brand unique",
  "brandColors": "string or null — brand colors mentioned or visible",
  "currentPackages": "string or null — services or packages offered",
  "pricingModel": "string or null — pricing approach (subscription, one-time, hourly, etc.)",
  "instagramHandle": "string or null — Instagram handle if found",
  "otherPlatforms": "string or null — other social platforms found",
  "brandPersonality": "string or null — the brand's personality traits"
}`;

const SYSTEM_PROMPT = `You are a brand analyst AI. You receive scraped website content and extract structured brand data from it.

RULES:
- Only extract information that is EXPLICITLY present in the content
- Do NOT guess, infer, or fabricate any data
- If a field is not found in the content, set it to null
- Keep values concise but accurate
- For tagline: extract the exact tagline/slogan if present
- For toneOfVoice: analyze the writing style (e.g. "professional", "casual and friendly", "bold and direct")
- For brandPersonality: describe the brand's personality based on the content tone and messaging
- Return ONLY valid JSON, no markdown fences, no explanation`;

export interface AutoExtractResult {
  success: boolean;
  fieldsExtracted: number;
  data: Record<string, string | null>;
  error?: string;
}

/**
 * Scrape a URL and extract brand profile data using AI.
 * Returns the extracted data (also upserts into brand_profiles).
 */
export async function autoExtractBrandData(
  userId: number,
  url: string,
): Promise<AutoExtractResult> {
  const startTime = Date.now();

  try {
    // Step 1: Scrape the website
    logger.info({ userId, url }, "[AutoExtract] Starting website scrape");
    const scraped = await scrapeWebsite(url);

    if (!scraped || !scraped.content || scraped.content.length < 100) {
      logger.warn({ userId, url }, "[AutoExtract] Scrape returned insufficient content");
      return {
        success: false,
        fieldsExtracted: 0,
        data: {},
        error: "Could not scrape website content. The site may be blocking automated access.",
      };
    }

    // Step 2: Prepare content for AI (truncate to avoid token limits)
    const contentForAI = [
      scraped.title ? `Page Title: ${scraped.title}` : "",
      scraped.description ? `Meta Description: ${scraped.description}` : "",
      scraped.headings?.length
        ? `Headings: ${scraped.headings.slice(0, 20).join(" | ")}`
        : "",
      `\nPage Content:\n${scraped.content.substring(0, 6000)}`,
    ]
      .filter(Boolean)
      .join("\n");

    // Step 3: Call AI to extract structured data
    logger.info({ userId, url, contentLength: contentForAI.length }, "[AutoExtract] Sending to AI for extraction");

    const result = await resilientLLM(
      {
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Extract brand profile data from this website content. URL: ${url}\n\n${contentForAI}\n\nReturn a JSON object matching this schema:\n${EXTRACTION_SCHEMA}`,
          },
        ],
        maxTokens: 1500,
      },
      { context: "diagnosis", timeout: 25000 },
    );

    // Step 4: Parse AI response
    const rawContent = result.choices?.[0]?.message?.content;
    const responseText = typeof rawContent === "string"
      ? rawContent
      : Array.isArray(rawContent)
        ? rawContent.map((c) => ("text" in c ? c.text : "")).join("")
        : "";

    // Clean up potential markdown fences
    const jsonStr = responseText
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "")
      .trim();

    let extracted: Record<string, string | null>;
    try {
      extracted = JSON.parse(jsonStr);
    } catch {
      logger.error({ userId, url, response: responseText.substring(0, 200) }, "[AutoExtract] Failed to parse AI response as JSON");
      return {
        success: false,
        fieldsExtracted: 0,
        data: {},
        error: "AI returned invalid response format.",
      };
    }

    // Step 5: Count extracted fields and filter nulls
    const nonNullData: Record<string, string> = {};
    for (const [key, value] of Object.entries(extracted)) {
      if (typeof value === "string" && value.trim().length > 0) {
        nonNullData[key] = value.trim();
      }
    }

    const fieldsExtracted = Object.keys(nonNullData).length;
    logger.info(
      { userId, url, fieldsExtracted, durationMs: Date.now() - startTime },
      "[AutoExtract] Extraction complete",
    );

    if (fieldsExtracted === 0) {
      return {
        success: true,
        fieldsExtracted: 0,
        data: {},
        error: "No brand data could be extracted from this page.",
      };
    }

    // Step 6: Upsert into brand_profiles
    // Ensure the website field is set
    if (!nonNullData.website) {
      nonNullData.website = url;
    }

    await upsertBrandProfile(userId, "auto_extract", nonNullData);

    return {
      success: true,
      fieldsExtracted,
      data: nonNullData,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error({ userId, url, error: message }, "[AutoExtract] Unexpected error");
    return {
      success: false,
      fieldsExtracted: 0,
      data: {},
      error: `Extraction failed: ${message}`,
    };
  }
}
