/**
 * Sprint G — bounded website scrape + Lighthouse for public Quick Check.
 */

import { validateScrapingUrl } from "./_core/urlSanitizer";
import { logger } from "./_core/logger";
import { scrapeWebsite, fetchLighthouseScores, buildWebsiteContext, type ScrapedPage } from "./researchEngine";

const SCRAPE_RACE_MS = 20_000;
const LIGHTHOUSE_TIMEOUT_MS = 18_000;
const MAX_CONTEXT_CHARS = 4500;

export type QuickCheckLighthouseScores = {
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
};

export type QuickCheckSiteBundle = {
  hasWebsiteData: boolean;
  websiteUrl: string | null;
  lighthouseScores: QuickCheckLighthouseScores | null;
  /** Trimmed text for LLM prompt (no raw HTML storage on lead) */
  websiteContextSnippet: string;
};

function racePromise<T>(p: Promise<T>, ms: number, label: string): Promise<T | null> {
  return new Promise((resolve) => {
    const t = setTimeout(() => {
      logger.debug({ label, ms }, "[QuickCheck] website subtask timed out");
      resolve(null);
    }, ms);
    p.then((v) => {
      clearTimeout(t);
      resolve(v);
    }).catch(() => {
      clearTimeout(t);
      resolve(null);
    });
  });
}

/**
 * When website is present and passes SSRF checks, scrape + Lighthouse in parallel
 * with strict time budgets suitable for a public endpoint.
 */
export async function gatherQuickCheckWebsiteBundle(
  websiteRaw: string | undefined | null,
): Promise<QuickCheckSiteBundle> {
  const empty: QuickCheckSiteBundle = {
    hasWebsiteData: false,
    websiteUrl: null,
    lighthouseScores: null,
    websiteContextSnippet: "",
  };
  const trimmed = (websiteRaw ?? "").trim();
  if (!trimmed) return empty;

  const check = validateScrapingUrl(trimmed);
  if (!check.valid) {
    logger.debug({ err: check.error }, "[QuickCheck] website URL rejected");
    return empty;
  }
  const url = check.url;

  const [scraped, lighthouse] = await Promise.all([
    racePromise(scrapeWebsite(url), SCRAPE_RACE_MS, "scrape"),
    racePromise(
      fetchLighthouseScores(url, { timeoutMs: LIGHTHOUSE_TIMEOUT_MS }),
      SCRAPE_RACE_MS + 2000,
      "lighthouse",
    ),
  ]);

  const scrapedPage = scraped as ScrapedPage | null;
  let snippet = "";
  if (scrapedPage) {
    const ctx = buildWebsiteContext(scrapedPage);
    snippet = ctx.length > MAX_CONTEXT_CHARS ? `${ctx.slice(0, MAX_CONTEXT_CHARS)}\n…[truncated]` : ctx;
  }

  const hasWebsiteData = Boolean(snippet) || Boolean(lighthouse);

  return {
    hasWebsiteData,
    websiteUrl: url,
    lighthouseScores: lighthouse,
    websiteContextSnippet: snippet,
  };
}

export function formatLighthouseForPrompt(scores: QuickCheckLighthouseScores | null): string {
  if (!scores) return "";
  return [
    `Performance: ${scores.performance}/100`,
    `Accessibility: ${scores.accessibility}/100`,
    `Best practices: ${scores.bestPractices}/100`,
    `SEO: ${scores.seo}/100`,
  ].join("\n");
}

/** Normalize LLM / fallback to exactly 3 short issue lines for UI + API. */
export function normalizeTop3Issues(
  llmIssues: unknown,
  diagnosisTeaser: string,
  fullDiagnosis: string,
): string[] {
  const fromLines = (text: string) =>
    text
      .split(/\n+/)
      .map((s) => s.replace(/^[-*•\d.)]+\s*/, "").trim())
      .filter(Boolean);

  let out: string[] = [];
  if (Array.isArray(llmIssues)) {
    out = llmIssues.map((x) => String(x).trim()).filter(Boolean);
  }
  if (out.length >= 3) return out.slice(0, 3);

  const fromFull = fromLines(fullDiagnosis);
  out = [...out, ...fromFull];
  if (out.length >= 3) return out.slice(0, 3);

  const fromTeaser = diagnosisTeaser
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  out = [...out, ...fromTeaser];
  while (out.length < 3) {
    out.push("Continue refining brand clarity and customer-facing touchpoints.");
  }
  return out.slice(0, 3);
}
