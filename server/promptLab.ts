/**
 * PROMPT LAB — A/B Testing for AI Prompts
 * =========================================
 * 
 * Problem: No way to know if a prompt change improved quality.
 * Solution: Version prompts → split traffic → measure quality → pick winner.
 * 
 * Flow:
 * 1. Create prompt version (e.g., "diagnostician_system_v2")
 * 2. Activate A/B test: 50/50 split between current and new
 * 3. After N conversations, compare: quality scores, owner ratings, response time
 * 4. Promote winner → deactivate loser
 * 
 * Uses prompt_versions table from migration 0013.
 */

import { logger } from './_core/logger';

// ============ TYPES ============

interface PromptVersion {
  id: number;
  promptName: string;
  version: number;
  content: string;
  isActive: boolean;
  metrics: PromptMetrics;
  createdAt: Date;
}

interface PromptMetrics {
  conversations: number;
  avgQualityScore: number;
  avgOwnerRating: number;
  avgClientRating: number;
  avgResponseTimeMs: number;
  avgTokensUsed: number;
  totalScores: number[];
  totalRatings: number[];
}

interface ABTestResult {
  promptName: string;
  versionA: { version: number; metrics: PromptMetrics };
  versionB: { version: number; metrics: PromptMetrics };
  winner: 'A' | 'B' | 'inconclusive';
  confidence: string;
  recommendation: string;
}

// ============ IN-MEMORY STORE ============

const promptVersions: Map<string, PromptVersion[]> = new Map();
const conversationAssignments: Map<number, { promptName: string; version: number }> = new Map();

const DEFAULT_METRICS: PromptMetrics = {
  conversations: 0,
  avgQualityScore: 0,
  avgOwnerRating: 0,
  avgClientRating: 0,
  avgResponseTimeMs: 0,
  avgTokensUsed: 0,
  totalScores: [],
  totalRatings: [],
};

// ============ VERSION MANAGEMENT ============

/**
 * Create a new version of a prompt.
 */
export function createPromptVersion(promptName: string, content: string): PromptVersion {
  if (!promptVersions.has(promptName)) {
    promptVersions.set(promptName, []);
  }

  const versions = promptVersions.get(promptName)!;
  const newVersion: PromptVersion = {
    id: Date.now(),
    promptName,
    version: versions.length + 1,
    content,
    isActive: false,
    metrics: { ...DEFAULT_METRICS, totalScores: [], totalRatings: [] },
    createdAt: new Date(),
  };

  versions.push(newVersion);
  logger.info({ promptName, version: newVersion.version }, 'New prompt version created');
  return newVersion;
}

/**
 * Activate a specific version (deactivates others with same name).
 */
export function activateVersion(promptName: string, version: number): boolean {
  const versions = promptVersions.get(promptName);
  if (!versions) return false;

  for (const v of versions) {
    v.isActive = v.version === version;
  }

  logger.info({ promptName, version }, 'Prompt version activated');
  return true;
}

/**
 * Get the active prompt content for a given name.
 * If A/B test is running, randomly picks between active versions.
 */
export function getActivePrompt(promptName: string, conversationId?: number): {
  content: string;
  version: number;
} | null {
  const versions = promptVersions.get(promptName);
  if (!versions || versions.length === 0) return null;

  const activeVersions = versions.filter(v => v.isActive);
  if (activeVersions.length === 0) {
    // Return the latest version if none active
    const latest = versions[versions.length - 1];
    return { content: latest.content, version: latest.version };
  }

  if (activeVersions.length === 1) {
    return { content: activeVersions[0].content, version: activeVersions[0].version };
  }

  // A/B test: multiple active versions — randomly assign
  const selected = activeVersions[Math.floor(Math.random() * activeVersions.length)];

  // Track assignment
  if (conversationId) {
    conversationAssignments.set(conversationId, {
      promptName,
      version: selected.version,
    });
  }

  return { content: selected.content, version: selected.version };
}

// ============ METRICS RECORDING ============

/**
 * Record a metric for a prompt version.
 */
export function recordPromptMetric(
  promptName: string,
  version: number,
  metric: {
    qualityScore?: number;
    ownerRating?: number;
    clientRating?: number;
    responseTimeMs?: number;
    tokensUsed?: number;
  }
): void {
  const versions = promptVersions.get(promptName);
  if (!versions) return;

  const v = versions.find(x => x.version === version);
  if (!v) return;

  v.metrics.conversations++;

  if (metric.qualityScore !== undefined) {
    v.metrics.totalScores.push(metric.qualityScore);
    v.metrics.avgQualityScore = average(v.metrics.totalScores);
  }
  if (metric.ownerRating !== undefined) {
    v.metrics.totalRatings.push(metric.ownerRating);
    v.metrics.avgOwnerRating = average(v.metrics.totalRatings);
  }
  if (metric.responseTimeMs !== undefined) {
    v.metrics.avgResponseTimeMs = runningAvg(v.metrics.avgResponseTimeMs, metric.responseTimeMs, v.metrics.conversations);
  }
  if (metric.tokensUsed !== undefined) {
    v.metrics.avgTokensUsed = runningAvg(v.metrics.avgTokensUsed, metric.tokensUsed, v.metrics.conversations);
  }
}

function average(arr: number[]): number {
  if (arr.length === 0) return 0;
  return Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10;
}

function runningAvg(prev: number, value: number, count: number): number {
  return Math.round(((prev * (count - 1) + value) / count) * 10) / 10;
}

// ============ A/B TEST ANALYSIS ============

/**
 * Compare two versions and determine the winner.
 * Needs at least 20 conversations per version for meaningful results.
 */
export function analyzeABTest(promptName: string): ABTestResult | null {
  const versions = promptVersions.get(promptName);
  if (!versions || versions.length < 2) return null;

  const activeVersions = versions.filter(v => v.isActive || v.metrics.conversations > 0);
  if (activeVersions.length < 2) return null;

  // Sort by version number, take last 2
  const sorted = activeVersions.sort((a, b) => b.version - a.version);
  const vB = sorted[0]; // Newer (challenger)
  const vA = sorted[1]; // Older (champion)

  const minConversations = 20;
  const enoughData = vA.metrics.conversations >= minConversations && vB.metrics.conversations >= minConversations;

  // Score comparison (quality weighted most)
  const scoreA = (vA.metrics.avgQualityScore * 0.5) + (vA.metrics.avgOwnerRating * 20 * 0.3) + ((1000 - vA.metrics.avgResponseTimeMs) * 0.001 * 0.2);
  const scoreB = (vB.metrics.avgQualityScore * 0.5) + (vB.metrics.avgOwnerRating * 20 * 0.3) + ((1000 - vB.metrics.avgResponseTimeMs) * 0.001 * 0.2);

  const diff = ((scoreB - scoreA) / Math.max(scoreA, 1)) * 100;
  let winner: 'A' | 'B' | 'inconclusive' = 'inconclusive';
  let confidence = 'low';

  if (enoughData) {
    if (diff > 10) { winner = 'B'; confidence = diff > 25 ? 'high' : 'medium'; }
    else if (diff < -10) { winner = 'A'; confidence = diff < -25 ? 'high' : 'medium'; }
  }

  const recommendation = winner === 'inconclusive'
    ? `Need more data. A: ${vA.metrics.conversations} convos, B: ${vB.metrics.conversations} convos. Target: ${minConversations} each.`
    : `Version ${winner === 'A' ? vA.version : vB.version} wins by ${Math.abs(diff).toFixed(1)}%. Recommend activating it as sole version.`;

  return {
    promptName,
    versionA: { version: vA.version, metrics: vA.metrics },
    versionB: { version: vB.version, metrics: vB.metrics },
    winner,
    confidence,
    recommendation,
  };
}

// ============ DASHBOARD ============

/**
 * Get all prompt versions and their metrics for the dashboard.
 */
export function getPromptLabDashboard() {
  const allPrompts: Record<string, {
    versions: Array<{
      version: number;
      isActive: boolean;
      conversations: number;
      avgQualityScore: number;
      avgOwnerRating: number;
      avgResponseTimeMs: number;
    }>;
    abTest: ABTestResult | null;
  }> = {};

  for (const [name, versions] of Array.from(promptVersions.entries())) {
    allPrompts[name] = {
      versions: versions.map((v: PromptVersion) => ({
        version: v.version,
        isActive: v.isActive,
        conversations: v.metrics.conversations,
        avgQualityScore: v.metrics.avgQualityScore,
        avgOwnerRating: v.metrics.avgOwnerRating,
        avgResponseTimeMs: v.metrics.avgResponseTimeMs,
      })),
      abTest: analyzeABTest(name),
    };
  }

  return {
    prompts: allPrompts,
    totalVersions: Array.from(promptVersions.values()).reduce((sum, v) => sum + v.length, 0),
    activeTests: Array.from(promptVersions.values()).filter(v => v.filter(x => x.isActive).length > 1).length,
  };
}

/**
 * List all prompt names with their version counts.
 */
export function listPrompts(): Array<{ name: string; versions: number; activeVersion: number | null }> {
  return Array.from(promptVersions.entries()).map(([name, versions]) => ({
    name,
    versions: versions.length,
    activeVersion: versions.find(v => v.isActive)?.version || null,
  }));
}
