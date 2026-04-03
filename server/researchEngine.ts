/**
 * ═══════════════════════════════════════════════════════════════════════════
 * WZZRD AI — RESEARCH ENGINE
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * The Research Engine is what transforms Wzrd AI from a chatbot into a
 * real consultant. It searches, scrapes, and analyzes BEFORE responding.
 * 
 * Components:
 * 1. Google Search — web search for companies, competitors, markets
 * 2. Web Scraper — extract structured data from websites
 * 3. Academic Search — find relevant research papers and studies
 * 4. Research Orchestrator — coordinates all sources into structured reports
 * 5. Knowledge Accumulator — caches results for faster future lookups
 * 
 * Cost: $0 — uses free APIs and built-in scraping
 */

import { Semaphore } from 'async-mutex';
import puppeteer from 'puppeteer';

import { resilientLLM } from './_core/llmRouter';
import { logger } from './_core/logger';
import { validateScrapingUrl } from './_core/urlSanitizer';

// Limit concurrent Puppeteer instances to prevent OOM crashes
const MAX_BROWSERS = 2;
const browserSemaphore = new Semaphore(MAX_BROWSERS);

const PUPPETEER_USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15',
  'Mozilla/5.0 (compatible; WzrdAI/1.0; +https://wzzrdai.com)',
];

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
}

export interface ScrapedPage {
  url: string;
  title: string;
  description: string;
  content: string;
  headings: string[];
  links: string[];
  scrapedAt: number;
  quality: 'full' | 'partial' | 'failed';
}

export interface AcademicResult {
  title: string;
  authors: string;
  year: string;
  snippet: string;
  url: string;
  source: string;
}

export interface CompetitorProfile {
  name: string;
  website: string;
  description: string;
  positioning: string;
  strengths: string[];
  weaknesses: string[];
}

export interface MarketData {
  industry: string;
  market: string;
  overview: string;
  trends: string[];
  challenges: string[];
  opportunities: string[];
  keyPlayers: string[];
  sources: string[];
}

export interface ResearchReport {
  id?: number;
  query: string;
  companyName?: string;
  industry?: string;
  market?: string;
  // Research results
  webResults: SearchResult[];
  competitors: CompetitorProfile[];
  marketData: MarketData | null;
  academicResults: AcademicResult[];
  scrapedPages: ScrapedPage[];
  // AI-synthesized summary
  summary: string;
  keyInsights: string[];
  recommendations: string[];
  // Metadata
  searchQueries: string[];
  totalSources: number;
  createdAt: number;
  cached: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. GOOGLE SEARCH (via Forge API proxy or direct fetch)
// ═══════════════════════════════════════════════════════════════════════════

export async function searchGoogle(query: string, _numResults: number = 10): Promise<SearchResult[]> {
  try {
    // TODO: Implement real Google Custom Search API here
    // For now, we return empty array to prevent hallucinations
    logger.warn({ query }, '[ResearchEngine] Google search called but no API configured. Returning empty.');
    return [];
  } catch (error) {
    logger.error({ query, error }, '[ResearchEngine] Google search failed');
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. WEB SCRAPER
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Scrape a webpage and extract structured content.
 * Uses a lightweight fetch + HTML parsing approach.
 */
export async function scrapeWebsite(url: string): Promise<ScrapedPage | null> {
  // SSRF Protection — block internal/private URLs
  const urlCheck = validateScrapingUrl(url);
  if (!urlCheck.valid) {
    logger.warn({ url, error: urlCheck.error }, '[Scraper] Blocked suspicious URL (SSRF protection)');
    return null;
  }
  url = urlCheck.url; // Use sanitized URL from here on

  // Layer 1: Try with rotating user agents + retry
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15',
    'Mozilla/5.0 (compatible; WzrdAI/1.0; +https://wzzrdai.com)',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Mobile/15E148 Safari/604.1',
  ];

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout (was 15s)

      const response = await fetch(url, {
        headers: {
          'User-Agent': userAgents[attempt % userAgents.length],
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8',
          'Accept-Encoding': 'gzip, deflate',
          'Cache-Control': 'no-cache',
        },
        signal: controller.signal,
        redirect: 'follow',
      });

      clearTimeout(timeout);

      if (response.ok) {
        const html = await response.text();
        if (html.length > 200) {
          const parsed = parseHTML(url, html);
          parsed.quality = parsed.content.length > 500 ? 'full' : 'partial';
          return parsed;
        }
      }

      // If 403/429, wait before retry
      if (response.status === 403 || response.status === 429) {
        logger.debug({ url, status: response.status, attempt }, 'Scrape blocked — retrying with different UA');
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1))); // 1s, 2s backoff
        continue;
      }

      // Other error — don't retry
      break;
    } catch (err: unknown) {
      const name = err instanceof Error ? err.name : "";
      const message = err instanceof Error ? err.message : String(err);
      if (name === "AbortError") {
        logger.debug({ url, attempt }, 'Scrape timeout — retrying');
        continue;
      }
      logger.debug({ url, err: message, attempt }, 'Scrape failed');
      if (attempt === 0) continue; // Retry once on network errors
      break;
    }
  }

  // Layer 1.5: Puppeteer fallback for SPAs (if fetch failed or returned minimal content)
  try {
    logger.debug({ url }, 'Attempting Puppeteer fallback for SPA rendering');

    const [, release] = await browserSemaphore.acquire();

    try {
      const browser = await puppeteer.launch({
        headless: true,
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--single-process',
        ],
      });

      try {
        const page = await browser.newPage();

        await page.setRequestInterception(true);
        page.on('request', (req) => {
          const type = req.resourceType();
          if (['image', 'font', 'media', 'stylesheet'].includes(type)) {
            void req.abort();
          } else {
            void req.continue();
          }
        });

        await page.setUserAgent(userAgents[0]);

        await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });

        const html = await page.content();

        if (html.length > 500) {
          logger.info({ url }, 'Scrape succeeded via Puppeteer fallback');
          const parsed = parseHTML(url, html);
          parsed.quality = parsed.content.length > 500 ? 'full' : 'partial';
          return parsed;
        }
      } finally {
        await browser.close();
      }
    } finally {
      release();
    }
  } catch (err) {
    logger.debug({ url, err: err instanceof Error ? err.message : String(err) }, 'Puppeteer fallback failed');
    // Continue to Layer 2 (Google Cache)
  }

  // Layer 2: Try Google Cache
  try {
    const cacheUrl = `https://webcache.googleusercontent.com/search?q=cache:${encodeURIComponent(url)}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    
    const response = await fetch(cacheUrl, {
      headers: { 'User-Agent': userAgents[2] },
      signal: controller.signal,
      redirect: 'follow',
    });
    
    clearTimeout(timeout);
    
    if (response.ok) {
      const html = await response.text();
      if (html.length > 200) {
        logger.info({ url }, 'Scrape succeeded via Google Cache fallback');
        const parsed = parseHTML(url, html);
        parsed.quality = parsed.content.length > 500 ? 'full' : 'partial';
        return parsed;
      }
    }
  } catch {
    // Google Cache also failed — continue to Layer 3
  }

  // Layer 3: Return partial data from what we know
  // Extract domain info as minimal result
  try {
    const domain = new URL(url).hostname;
    logger.warn({ url }, 'All scraping methods failed — returning minimal result');
    
    return {
      url,
      title: domain.replace('www.', ''),
      description: `Content from ${domain} was not accessible at the time of research.`,
      content: `[Website content unavailable — ${domain} blocked scraping or was temporarily down]`,
      headings: [],
      links: [],
      scrapedAt: Date.now(),
      quality: 'failed',
    };
  } catch {
    return null;
  }
}

/**
 * Full-page viewport screenshot for vision models — does NOT block images/fonts (unlike scrapeWebsite Puppeteer fallback).
 */
export async function captureScreenshot(rawUrl: string): Promise<string | null> {
  const urlCheck = validateScrapingUrl(rawUrl.trim());
  if (!urlCheck.valid) {
    logger.warn({ url: rawUrl, error: urlCheck.error }, '[Screenshot] URL validation failed');
    return null;
  }
  const url = urlCheck.url;

  try {
    logger.debug({ url }, 'Attempting to capture screenshot via Puppeteer');
    const [, release] = await browserSemaphore.acquire();
    try {
      const browser = await puppeteer.launch({
        headless: true,
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--single-process',
        ],
      });
      try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });
        await page.setUserAgent(PUPPETEER_USER_AGENTS[0]);
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 20_000 });
        const shot = await page.screenshot({ type: 'png', encoding: 'base64', fullPage: false });
        const b64 = typeof shot === 'string' ? shot : Buffer.from(shot).toString('base64');
        logger.info({ url }, 'Screenshot captured successfully');
        return b64;
      } finally {
        await browser.close();
      }
    } finally {
      release();
    }
  } catch (err) {
    logger.error({ url, err: err instanceof Error ? err.message : String(err) }, 'Screenshot capture failed');
    return null;
  }
}

/**
 * Parse HTML and extract structured data without external dependencies.
 * Lightweight server-side HTML parsing using regex patterns.
 */
function parseHTML(url: string, html: string): ScrapedPage {
  // Extract title
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim().replace(/\s+/g, ' ') : '';

  // Extract meta description
  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([\s\S]*?)["']/i)
    || html.match(/<meta[^>]*content=["']([\s\S]*?)["'][^>]*name=["']description["']/i);
  const description = descMatch ? descMatch[1].trim() : '';

  // Extract headings
  const headings: string[] = [];
  const headingRegex = /<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi;
  let headingMatch;
  while ((headingMatch = headingRegex.exec(html)) !== null) {
    const text = headingMatch[1].replace(/<[^>]+>/g, '').trim();
    if (text && text.length > 2 && text.length < 200) {
      headings.push(text);
    }
  }

  // Extract main text content (strip tags, scripts, styles)
  let content = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

  // Limit content length
  if (content.length > 5000) {
    content = content.substring(0, 5000) + '...';
  }

  // Extract links
  const links: string[] = [];
  const linkRegex = /href=["'](https?:\/\/[^"']+)["']/gi;
  let linkMatch;
  while ((linkMatch = linkRegex.exec(html)) !== null && links.length < 20) {
    links.push(linkMatch[1]);
  }

  return {
    url,
    title,
    description,
    content,
    headings: headings.slice(0, 20),
    links: links.slice(0, 20),
    scrapedAt: Date.now(),
    quality: 'full' as const,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. ACADEMIC SEARCH
// ═══════════════════════════════════════════════════════════════════════════

export async function searchAcademic(query: string, _numResults: number = 5): Promise<AcademicResult[]> {
  try {
    // TODO: Implement real Academic Search API (e.g., Semantic Scholar, Crossref)
    // For now, we return empty array to prevent hallucinations
    logger.warn({ query }, '[ResearchEngine] Academic search called but no API configured. Returning empty.');
    return [];
  } catch (error) {
    logger.error({ query, error }, '[ResearchEngine] Academic search failed');
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 4. COMPETITOR ANALYSIS (AI-powered)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Analyze competitors based on search results and scraped data.
 * Uses AI to synthesize competitor profiles from raw data.
 */
export async function analyzeCompetitors(
  companyName: string,
  industry: string,
  market: string,
  searchResults: SearchResult[],
  scrapedPages: ScrapedPage[]
): Promise<CompetitorProfile[]> {
  const scrapedContext = scrapedPages
    .filter(p => p.content.length > 100)
    .map(p => `[${p.title}] (${p.url}): ${p.content.substring(0, 1000)}`)
    .join('\n\n');

  const searchContext = searchResults
    .map(r => `- ${r.title}: ${r.snippet}`)
    .join('\n');

  try {
    const response = await resilientLLM({
      messages: [
        {
          role: 'system',
          content: `You are a competitive intelligence analyst. Analyze the provided data about competitors in the ${industry} industry in ${market}. Create detailed competitor profiles. Be specific and factual — use the data provided, don't make up information that isn't supported by the sources.`
        },
        {
          role: 'user',
          content: `Company being analyzed: ${companyName}
Industry: ${industry}
Market: ${market}

Search results about competitors:
${searchContext}

Scraped website data:
${scrapedContext}

Create competitor profiles for the top 5 competitors. Return JSON with array of competitor profiles.`
        }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'competitor_profiles',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              competitors: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    website: { type: 'string' },
                    description: { type: 'string' },
                    positioning: { type: 'string' },
                    strengths: { type: 'array', items: { type: 'string' } },
                    weaknesses: { type: 'array', items: { type: 'string' } },
                  },
                  required: ['name', 'website', 'description', 'positioning', 'strengths', 'weaknesses'],
                  additionalProperties: false,
                },
              },
            },
            required: ['competitors'],
            additionalProperties: false,
          },
        },
      },
    }, { context: 'research' });

    const content = typeof response.choices[0]?.message?.content === 'string'
      ? response.choices[0].message.content : '{"competitors":[]}';
    const parsed = JSON.parse(content);
    return parsed.competitors || [];
  } catch {
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 5. MARKET ANALYSIS (AI-powered)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate market analysis from search results and academic data.
 */
export async function analyzeMarket(
  industry: string,
  market: string,
  searchResults: SearchResult[],
  academicResults: AcademicResult[]
): Promise<MarketData | null> {
  const searchContext = searchResults
    .map(r => `- ${r.title}: ${r.snippet}`)
    .join('\n');

  const academicContext = academicResults
    .map(r => `- [${r.year}] ${r.title} by ${r.authors}: ${r.snippet}`)
    .join('\n');

  try {
    const response = await resilientLLM({
      messages: [
        {
          role: 'system',
          content: `You are a market research analyst specializing in the MENA region. Provide detailed, factual market analysis for the ${industry} industry in ${market}. Use the provided search and academic data. Be specific with numbers and trends where the data supports it.`
        },
        {
          role: 'user',
          content: `Industry: ${industry}
Market: ${market}

Web search data:
${searchContext}

Academic research:
${academicContext}

Provide a comprehensive market analysis. Return JSON.`
        }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'market_analysis',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              industry: { type: 'string' },
              market: { type: 'string' },
              overview: { type: 'string' },
              trends: { type: 'array', items: { type: 'string' } },
              challenges: { type: 'array', items: { type: 'string' } },
              opportunities: { type: 'array', items: { type: 'string' } },
              keyPlayers: { type: 'array', items: { type: 'string' } },
              sources: { type: 'array', items: { type: 'string' } },
            },
            required: ['industry', 'market', 'overview', 'trends', 'challenges', 'opportunities', 'keyPlayers', 'sources'],
            additionalProperties: false,
          },
        },
      },
    }, { context: 'research' });

    const content = typeof response.choices[0]?.message?.content === 'string'
      ? response.choices[0].message.content : 'null';
    return JSON.parse(content);
  } catch {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 6. RESEARCH ORCHESTRATOR — The Main Brain
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Conduct a full research workflow for a company/client.
 * This is the main entry point that coordinates all research components.
 * 
 * Flow:
 * 1. Search Google for the company
 * 2. Search Google for competitors in the same industry/market
 * 3. Scrape top competitor websites
 * 4. Search for academic research on the industry
 * 5. Analyze competitors from collected data
 * 6. Analyze market from collected data
 * 7. Synthesize everything into a research report
 */
export async function conductResearch(params: {
  companyName: string;
  industry: string;
  market: string;
  website?: string;
  additionalContext?: string;
}): Promise<ResearchReport> {
  const { companyName, industry, market, website, additionalContext } = params;
  const searchQueries: string[] = [];
  const startTime = Date.now();

  // Determine market name for search queries
  const marketName = market === 'ksa' ? 'Saudi Arabia' : market === 'egypt' ? 'Egypt' : market === 'uae' ? 'UAE' : market;

  // Step 1: Search for the company
  const companyQuery = `${companyName} ${industry} ${marketName}`;
  searchQueries.push(companyQuery);
  const companyResults = await searchGoogle(companyQuery, 8);

  // Step 2: Search for competitors
  const competitorQuery = `top ${industry} companies ${marketName} 2025 2026`;
  searchQueries.push(competitorQuery);
  const competitorResults = await searchGoogle(competitorQuery, 10);

  // Step 3: Search for market data
  const marketQuery = `${industry} market size trends ${marketName} 2025 2026`;
  searchQueries.push(marketQuery);
  const marketResults = await searchGoogle(marketQuery, 8);

  // Step 4: Scrape company website if provided
  const scrapedPages: ScrapedPage[] = [];
  if (website) {
    const companyPage = await scrapeWebsite(website);
    if (companyPage) scrapedPages.push(companyPage);
  }

  // Step 5: Scrape top competitor websites (up to 3)
  const competitorUrls = competitorResults
    .filter(r => r.url && !r.url.includes('wikipedia') && !r.url.includes('linkedin'))
    .slice(0, 3)
    .map(r => r.url);

  for (const url of competitorUrls) {
    const page = await scrapeWebsite(url);
    if (page) scrapedPages.push(page);
  }

  // Step 6: Academic search
  const academicQuery = `brand positioning strategy ${industry} consumer behavior`;
  searchQueries.push(academicQuery);
  const academicResults = await searchAcademic(academicQuery, 5);

  // Industry-specific academic search
  const industryAcademicQuery = `${industry} market analysis ${marketName} business strategy`;
  searchQueries.push(industryAcademicQuery);
  const industryAcademicResults = await searchAcademic(industryAcademicQuery, 3);
  academicResults.push(...industryAcademicResults);

  // Step 7: AI-powered competitor analysis
  const allSearchResults = [...companyResults, ...competitorResults, ...marketResults];
  const competitors = await analyzeCompetitors(companyName, industry, marketName, allSearchResults, scrapedPages);

  // Step 8: AI-powered market analysis
  const marketData = await analyzeMarket(industry, marketName, [...marketResults, ...companyResults], academicResults);

  // Step 9: Synthesize into summary
  const { summary, keyInsights, recommendations } = await synthesizeResearch(
    companyName, industry, marketName, allSearchResults, competitors, marketData, academicResults, additionalContext
  );

  return {
    query: companyQuery,
    companyName,
    industry,
    market,
    webResults: allSearchResults,
    competitors,
    marketData,
    academicResults,
    scrapedPages,
    summary,
    keyInsights,
    recommendations,
    searchQueries,
    totalSources: allSearchResults.length + academicResults.length + scrapedPages.length,
    createdAt: startTime,
    cached: false,
  };
}

/**
 * Synthesize all research data into a coherent summary with insights.
 */
async function synthesizeResearch(
  companyName: string,
  industry: string,
  market: string,
  searchResults: SearchResult[],
  competitors: CompetitorProfile[],
  marketData: MarketData | null,
  academicResults: AcademicResult[],
  additionalContext?: string
): Promise<{ summary: string; keyInsights: string[]; recommendations: string[] }> {
  const competitorSummary = competitors
    .map(c => `- ${c.name}: ${c.positioning} | Strengths: ${c.strengths.join(', ')} | Weaknesses: ${c.weaknesses.join(', ')}`)
    .join('\n');

  const marketSummary = marketData
    ? `Market Overview: ${marketData.overview}\nTrends: ${marketData.trends.join(', ')}\nChallenges: ${marketData.challenges.join(', ')}\nOpportunities: ${marketData.opportunities.join(', ')}`
    : 'Market data not available';

  const academicSummary = academicResults
    .map(r => `- [${r.year}] ${r.title}: ${r.snippet}`)
    .join('\n');

  try {
    const response = await resilientLLM({
      messages: [
        {
          role: 'system',
          content: `You are a Senior Brand Strategy Consultant at Primo Marca. Synthesize the research data into actionable insights using Primo Marca's 4D Framework lens. Be specific, connect every insight to a business outcome, and think like a strategist — not a reporter.`
        },
        {
          role: 'user',
          content: `Company: ${companyName}
Industry: ${industry}
Market: ${market}
${additionalContext ? `Additional Context: ${additionalContext}` : ''}

COMPETITOR ANALYSIS:
${competitorSummary}

MARKET DATA:
${marketSummary}

ACADEMIC RESEARCH:
${academicSummary}

Synthesize this into:
1. A comprehensive summary (2-3 paragraphs)
2. 5-7 key insights (each must be specific and actionable)
3. 3-5 strategic recommendations (using Primo Marca's methodology)

Return JSON.`
        }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'research_synthesis',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              summary: { type: 'string' },
              keyInsights: { type: 'array', items: { type: 'string' } },
              recommendations: { type: 'array', items: { type: 'string' } },
            },
            required: ['summary', 'keyInsights', 'recommendations'],
            additionalProperties: false,
          },
        },
      },
    }, { context: 'research' });

    const content = typeof response.choices[0]?.message?.content === 'string'
      ? response.choices[0].message.content : '{}';
    const parsed = JSON.parse(content);
    return {
      summary: parsed.summary || '',
      keyInsights: parsed.keyInsights || [],
      recommendations: parsed.recommendations || [],
    };
  } catch {
    return { summary: '', keyInsights: [], recommendations: [] };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 7. QUICK RESEARCH — Lightweight version for real-time use
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Quick research for use during conversations.
 * Faster than full conductResearch — focuses on the most relevant data.
 */
export async function quickResearch(query: string): Promise<{
  results: SearchResult[];
  summary: string;
}> {
  const results = await searchGoogle(query, 5);

  if (results.length === 0) {
    return { results: [], summary: 'No results found.' };
  }

  try {
    const response = await resilientLLM({
      messages: [
        {
          role: 'system',
          content: 'You are a research assistant. Summarize the search results in 2-3 sentences. Be factual and specific.'
        },
        {
          role: 'user',
          content: `Query: "${query}"\n\nResults:\n${results.map(r => `- ${r.title}: ${r.snippet}`).join('\n')}\n\nProvide a brief, factual summary.`
        }
      ],
    }, { context: 'research' });

    const summary = typeof response.choices[0]?.message?.content === 'string'
      ? response.choices[0].message.content : '';

    return { results, summary };
  } catch {
    return { results, summary: results.map(r => r.snippet).join(' ') };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 8. FORMAT RESEARCH FOR AI CONTEXT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Format a research report into a string that can be injected into
 * the AI system prompt as context. This is how the AI Brain uses research.
 */
export function formatResearchForContext(report: ResearchReport): string {
  let context = `\n## LIVE RESEARCH DATA (Conducted ${new Date(report.createdAt).toLocaleDateString()})\n\n`;

  if (report.summary) {
    context += `### Research Summary\n${report.summary}\n\n`;
  }

  if (report.keyInsights.length > 0) {
    context += `### Key Insights\n${report.keyInsights.map((i, idx) => `${idx + 1}. ${i}`).join('\n')}\n\n`;
  }

  if (report.competitors.length > 0) {
    context += `### Competitive Landscape\n`;
    for (const c of report.competitors) {
      context += `**${c.name}** (${c.website})\n`;
      context += `Positioning: ${c.positioning}\n`;
      context += `Strengths: ${c.strengths.join(', ')}\n`;
      context += `Weaknesses: ${c.weaknesses.join(', ')}\n\n`;
    }
  }

  if (report.marketData) {
    context += `### Market Analysis\n`;
    context += `${report.marketData.overview}\n`;
    context += `Trends: ${report.marketData.trends.join(', ')}\n`;
    context += `Challenges: ${report.marketData.challenges.join(', ')}\n`;
    context += `Opportunities: ${report.marketData.opportunities.join(', ')}\n\n`;
  }

  if (report.academicResults.length > 0) {
    context += `### Academic Research\n`;
    for (const a of report.academicResults) {
      context += `- [${a.year}] "${a.title}" by ${a.authors} (${a.source}): ${a.snippet}\n`;
    }
    context += '\n';
  }

  if (report.recommendations.length > 0) {
    context += `### Strategic Recommendations (from Research)\n${report.recommendations.map((r, idx) => `${idx + 1}. ${r}`).join('\n')}\n\n`;
  }

  context += `*Research based on ${report.totalSources} sources across ${report.searchQueries.length} search queries.*\n`;

  return context;
}

/**
 * Intelligently builds a context string from scraped website data,
 * prioritizing metadata and headings, then filling the remaining
 * token budget with body content.
 *
 * @param scrapedData The parsed website data
 * @param maxTokens The maximum number of tokens allowed (approx 4 chars/token)
 * @returns A formatted string ready for the LLM prompt
 */
export function buildWebsiteContext(scrapedData: ScrapedPage, maxTokens: number = 2000): string {
  if (scrapedData.quality === 'failed') {
    return `[Website content unavailable — scraping failed]`;
  }

  // 1 token ≈ 4 characters (conservative estimate for English/Arabic mix)
  const maxChars = maxTokens * 4;

  let context = `--- SCRAPED WEBSITE DATA (quality: ${scrapedData.quality}) ---\n`;
  context += `URL: ${scrapedData.url}\n`;
  context += `Title: ${scrapedData.title}\n`;
  context += `Description: ${scrapedData.description}\n\n`;

  // Always include headings (they provide structural context)
  if (scrapedData.headings && scrapedData.headings.length > 0) {
    context += `## Site Structure (Headings):\n`;
    context += scrapedData.headings.slice(0, 15).map((h) => `- ${h}`).join('\n') + '\n\n';
  }

  // Calculate remaining character budget
  const currentLength = context.length;
  const remainingChars = Math.max(0, maxChars - currentLength - 100);

  // Add body content up to the remaining budget
  if (scrapedData.content && remainingChars > 0) {
    context += `## Main Content:\n`;
    const cleanContent = scrapedData.content.replace(/\s+/g, ' ').trim();

    if (cleanContent.length > remainingChars) {
      context += cleanContent.substring(0, remainingChars) + '... [Content truncated to fit context window]';
    } else {
      context += cleanContent;
    }
  }

  context += `\n--- END WEBSITE DATA ---\n`;

  return context;
}

/**
 * Fetches Lighthouse scores from Google PageSpeed Insights API.
 * No API key required for basic usage (rate limited).
 */
export async function fetchLighthouseScores(url: string) {
  try {
    const apiUrl =
      `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}` +
      '&strategy=desktop&category=performance&category=accessibility&category=best-practices&category=seo';

    const response = await fetch(apiUrl, { signal: AbortSignal.timeout(30000) });
    if (!response.ok) {
      logger.warn({ url, status: response.status }, '[Lighthouse] API request failed');
      return null;
    }

    const data = (await response.json()) as {
      lighthouseResult?: { categories?: Record<string, { score?: number | null }> };
    };
    const categories = data.lighthouseResult?.categories;

    if (!categories) return null;

    return {
      performance: Math.round((categories.performance?.score ?? 0) * 100),
      accessibility: Math.round((categories.accessibility?.score ?? 0) * 100),
      bestPractices: Math.round((categories['best-practices']?.score ?? 0) * 100),
      seo: Math.round((categories.seo?.score ?? 0) * 100),
    };
  } catch (error) {
    logger.error({ url, error }, '[Lighthouse] Fetch failed');
    return null;
  }
}
