/**
 * BRAND HEALTH OBSERVATORY
 * ========================
 * 
 * Continuous monitoring of client brand health. Checks weekly:
 * 
 * 1. SOCIAL SIGNALS — searches for brand mentions, reviews, sentiment
 * 2. COMPETITOR MOVES — detects new competitors, pricing changes, campaigns
 * 3. MARKET SHIFTS — industry trends, regulation changes, new opportunities
 * 4. BRAND CONSISTENCY — checks if online presence matches strategy
 * 
 * When something important changes → creates an alert.
 * Monthly → generates a Brand Health Report with trends.
 */

import { logger } from './_core/logger';
import { resilientLLM } from './_core/llmRouter';
import { searchGoogle } from './researchEngine';
import {
  getClients, getProjectsByClient, getClientById,
  createBrandAlert, createBrandMetrics, getLatestSnapshot,
  createBrandHealthSnapshot,
} from './db';
import { liveResearch } from './liveIntelligence';
import { createKnowledgeEntry } from './db';

// ════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════

export interface ObservatoryResult {
  clientId: number;
  companyName: string;
  signals: BrandSignal[];
  alerts: BrandAlertData[];
  healthDelta: number; // Change from last snapshot (-100 to +100)
  summary: string;
}

interface BrandSignal {
  type: 'mention' | 'review' | 'competitor' | 'market' | 'consistency';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  detail: string;
  source?: string;
  detectedAt: string;
}

interface BrandAlertData {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  recommendation: string;
}

// ════════════════════════════════════════════
// SIGNAL DETECTORS
// ════════════════════════════════════════════

/**
 * Search for brand mentions and sentiment.
 */
async function detectSocialSignals(
  companyName: string, market: string
): Promise<BrandSignal[]> {
  const signals: BrandSignal[] = [];
  try {
    const results = await searchGoogle(`"${companyName}" reviews ${new Date().getFullYear()}`, 5);
    const negativeKeywords = ['bad', 'terrible', 'worst', 'scam', 'disappointed', 'سيء', 'مخيب', 'نصب'];
    const positiveKeywords = ['amazing', 'best', 'excellent', 'recommend', 'love', 'ممتاز', 'أفضل', 'رائع'];

    for (const result of results) {
      const snippetLower = result.snippet.toLowerCase();
      const hasNegative = negativeKeywords.some(k => snippetLower.includes(k));
      const hasPositive = positiveKeywords.some(k => snippetLower.includes(k));

      if (hasNegative) {
        signals.push({
          type: 'review', severity: 'warning',
          title: `Negative mention detected`,
          detail: result.snippet.substring(0, 200),
          source: result.url, detectedAt: new Date().toISOString(),
        });
      }
      if (hasPositive) {
        signals.push({
          type: 'mention', severity: 'info',
          title: `Positive brand mention`,
          detail: result.snippet.substring(0, 200),
          source: result.url, detectedAt: new Date().toISOString(),
        });
      }
    }
  } catch (err) {
    logger.debug({ err, companyName }, 'Social signal detection failed');
  }
  return signals;
}

/**
 * Check for competitor movements.
 */
async function detectCompetitorMoves(
  companyName: string, industry: string, market: string
): Promise<BrandSignal[]> {
  const signals: BrandSignal[] = [];
  try {
    const results = await searchGoogle(`${industry} new brand launch ${market} ${new Date().getFullYear()}`, 5);

    for (const result of results) {
      if (!result.snippet.toLowerCase().includes(companyName.toLowerCase())) {
        const launchKeywords = ['launch', 'new', 'opens', 'announces', 'enters', 'يطلق', 'جديد', 'يفتتح'];
        if (launchKeywords.some(k => result.snippet.toLowerCase().includes(k))) {
          signals.push({
            type: 'competitor', severity: 'warning',
            title: `New competitor activity in ${industry}`,
            detail: result.snippet.substring(0, 200),
            source: result.url, detectedAt: new Date().toISOString(),
          });
        }
      }
    }
  } catch (err) {
    logger.debug({ err }, 'Competitor detection failed');
  }
  return signals;
}

/**
 * Check for market-level shifts.
 */
async function detectMarketShifts(
  industry: string, market: string
): Promise<BrandSignal[]> {
  const signals: BrandSignal[] = [];
  try {
    const queries = [
      `${industry} regulation change ${market} ${new Date().getFullYear()}`,
      `${industry} market trend ${market} new`,
    ];

    for (const query of queries) {
      const results = await searchGoogle(query, 3);
      const shiftKeywords = ['regulation', 'law', 'ban', 'mandatory', 'new policy', 'trend', 'growth', 'decline', 'قانون', 'تنظيم', 'إلزامي'];

      for (const result of results) {
        if (shiftKeywords.some(k => result.snippet.toLowerCase().includes(k.toLowerCase()))) {
          signals.push({
            type: 'market', severity: 'info',
            title: `Market shift detected in ${industry}`,
            detail: result.snippet.substring(0, 200),
            source: result.url, detectedAt: new Date().toISOString(),
          });
        }
      }
    }
  } catch (err) {
    logger.debug({ err }, 'Market shift detection failed');
  }
  return signals;
}

// ════════════════════════════════════════════
// ALERT GENERATOR
// ════════════════════════════════════════════

/**
 * Analyze signals and generate actionable alerts.
 */
async function generateAlerts(
  signals: BrandSignal[], companyName: string, industry: string
): Promise<BrandAlertData[]> {
  if (signals.length === 0) return [];

  const criticalSignals = signals.filter(s => s.severity === 'critical');
  const warningSignals = signals.filter(s => s.severity === 'warning');

  const alerts: BrandAlertData[] = [];

  // Negative reviews alert
  const negativeReviews = signals.filter(s => s.type === 'review' && s.severity === 'warning');
  if (negativeReviews.length >= 2) {
    alerts.push({
      type: 'negative_sentiment',
      severity: 'high',
      message: `${negativeReviews.length} negative mentions detected for ${companyName}. Brand perception may be declining.`,
      recommendation: 'Review the negative feedback, identify common themes, and consider a response strategy. If the issues are about brand clarity, a Brand Health Check may be needed.',
    });
  }

  // New competitor alert
  const competitorSignals = signals.filter(s => s.type === 'competitor');
  if (competitorSignals.length > 0) {
    alerts.push({
      type: 'competitor_activity',
      severity: 'medium',
      message: `${competitorSignals.length} competitor activities detected in ${industry}.`,
      recommendation: 'Monitor these competitors. If they\'re entering your client\'s positioning space, consider a competitive response strategy.',
    });
  }

  // Market regulation alert
  const marketShifts = signals.filter(s => s.type === 'market');
  if (marketShifts.length > 0) {
    alerts.push({
      type: 'market_shift',
      severity: 'low',
      message: `Market shifts detected in ${industry} that may affect branding strategy.`,
      recommendation: 'Share these insights with the client. Consider updating the brand strategy if shifts are significant.',
    });
  }

  return alerts;
}

// ════════════════════════════════════════════
// MAIN OBSERVATORY FUNCTIONS
// ════════════════════════════════════════════

/**
 * Run observatory check for a single client.
 */
export async function observeClient(clientId: number): Promise<ObservatoryResult | null> {
  const client = await getClientById(clientId);
  if (!client) return null;

  const companyName = client.companyName || client.name;
  const industry = client.industry || 'General';
  const market = client.market || 'egypt';

  logger.info({ clientId, company: companyName }, 'Observatory scan starting');

  // Collect signals
  const [socialSignals, competitorSignals, marketSignals] = await Promise.allSettled([
    detectSocialSignals(companyName, market),
    detectCompetitorMoves(companyName, industry, market),
    detectMarketShifts(industry, market),
  ]);

  const allSignals: BrandSignal[] = [
    ...(socialSignals.status === 'fulfilled' ? socialSignals.value : []),
    ...(competitorSignals.status === 'fulfilled' ? competitorSignals.value : []),
    ...(marketSignals.status === 'fulfilled' ? marketSignals.value : []),
  ];

  // Generate alerts
  const alerts = await generateAlerts(allSignals, companyName, industry);

  // Save alerts to database
  for (const alert of alerts) {
    try {
      await createBrandAlert({
        clientId,
        type: alert.type,
        severity: alert.severity,
        message: alert.message,
        recommendation: alert.recommendation,
      });
    } catch (err) {
      logger.debug({ err }, 'Failed to save alert');
    }
  }

  // Save signals as knowledge entries for future context
  if (allSignals.length > 0) {
    try {
      const signalSummary = allSignals.map(s => `[${s.type}/${s.severity}] ${s.title}: ${s.detail}`).join('\n');
      await createKnowledgeEntry({
        title: `Observatory: ${companyName} — ${new Date().toISOString().split('T')[0]}`,
        content: `Brand Observatory scan for ${companyName} (${industry}, ${market}):\n\n${signalSummary}\n\nAlerts generated: ${alerts.length}`,
        category: 'market_insight',
        industry, market,
        source: 'research_import',
        tags: ['observatory', 'auto_scan', companyName.toLowerCase(), industry.toLowerCase()],
      });
    } catch (err) {
      logger.debug({ err }, 'Failed to save observatory knowledge');
    }
  }

  // Calculate health delta from last snapshot
  let healthDelta = 0;
  try {
    const lastSnapshot = await getLatestSnapshot(clientId);
    if (lastSnapshot) {
      const warningCount = allSignals.filter(s => s.severity === 'warning' || s.severity === 'critical').length;
      const positiveCount = allSignals.filter(s => s.severity === 'info' && s.type === 'mention').length;
      healthDelta = (positiveCount * 2) - (warningCount * 5);
    }
  } catch { /* No previous snapshot */ }

  // Generate summary
  const summary = allSignals.length === 0
    ? `No significant brand signals detected for ${companyName} this period.`
    : `Detected ${allSignals.length} signals: ${allSignals.filter(s => s.severity === 'warning').length} warnings, ${allSignals.filter(s => s.severity === 'info').length} info. ${alerts.length} alerts generated.`;

  logger.info({
    clientId, signals: allSignals.length, alerts: alerts.length, healthDelta,
  }, 'Observatory scan completed');

  return { clientId, companyName, signals: allSignals, alerts, healthDelta, summary };
}

/**
 * Run observatory for ALL active clients.
 * Call weekly via cron or manual trigger.
 */
export async function observeAllClients(): Promise<{
  scanned: number;
  totalSignals: number;
  totalAlerts: number;
  results: ObservatoryResult[];
}> {
  const results: ObservatoryResult[] = [];
  let totalSignals = 0;
  let totalAlerts = 0;

  try {
    const clients = await getClients({ page: 1, pageSize: 500 });
    const clientList = clients.data || clients;
    const activeClients = clientList.filter((c: { status?: string }) => c.status === 'active');

    for (const client of activeClients) {
      const result = await observeClient(client.id);
      if (result) {
        results.push(result);
        totalSignals += result.signals.length;
        totalAlerts += result.alerts.length;
      }
      // Rate limit: 2 second delay between clients
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  } catch (err) {
    logger.error({ err }, 'Observatory batch scan failed');
  }

  logger.info({ scanned: results.length, totalSignals, totalAlerts }, 'Observatory batch completed');
  return { scanned: results.length, totalSignals, totalAlerts, results };
}
