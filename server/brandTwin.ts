/**
 * Brand Digital Twin — Brand Health Scoring Engine
 * 
 * Evaluates brand health across 7 dimensions using AI + Research + Knowledge Base.
 * Generates alerts and tracks metrics over time.
 * 
 * 7 Dimensions:
 * 1. Identity — brand purpose, values, personality clarity
 * 2. Positioning — market differentiation, competitive advantage
 * 3. Messaging — clarity, consistency, resonance of communications
 * 4. Visual — logo, colors, typography, design system quality
 * 5. Digital Presence — website, social media, SEO, online visibility
 * 6. Reputation — customer perception, reviews, trust signals
 * 7. Market Fit — product-market alignment, target audience match
 */

import { resilientLLM } from "./_core/llmRouter";

// ============ TYPES ============

export interface DimensionScore {
  score: number;       // 0-100
  label: string;       // "Strong" | "Good" | "Needs Work" | "Critical"
  findings: string[];  // Key findings for this dimension
  recommendations: string[];  // Specific recommendations
}

export interface BrandAuditResult {
  overallScore: number;
  dimensions: {
    identity: DimensionScore;
    positioning: DimensionScore;
    messaging: DimensionScore;
    visual: DimensionScore;
    digitalPresence: DimensionScore;
    reputation: DimensionScore;
    marketFit: DimensionScore;
  };
  summary: string;
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  alerts: AlertData[];
  metrics: MetricData[];
}

export interface AlertData {
  severity: "critical" | "warning" | "info" | "opportunity";
  dimension: string;
  title: string;
  description: string;
  recommendation: string;
}

export interface MetricData {
  dimension: string;
  metricName: string;
  score: number;
  maxScore: number;
  details: string;
  dataSource: string;
}

// ============ SCORING ENGINE ============

/**
 * Run a full AI-powered brand health audit for a client.
 * Uses client data, research data, knowledge base, and notes to evaluate.
 */
export async function runBrandAudit(params: {
  client: {
    name: string;
    companyName?: string | null;
    industry?: string | null;
    market?: string | null;
    website?: string | null;
  };
  researchContext?: string;
  knowledgeContext?: string;
  notes?: string[];
  previousSnapshot?: {
    overallScore: number;
    identityScore: number;
    positioningScore: number;
    messagingScore: number;
    visualScore: number;
    digitalPresenceScore: number;
    reputationScore: number;
    marketFitScore: number;
  } | null;
}): Promise<BrandAuditResult> {
  const { client, researchContext, knowledgeContext, notes, previousSnapshot } = params;

  const systemPrompt = `You are Wzrd AI — Brand Digital Twin Engine, an expert brand health analyst working within the Primo Marca methodology.

Your job is to evaluate a brand's health across 7 dimensions and produce a comprehensive audit.

## 7 BRAND HEALTH DIMENSIONS

1. **Identity** (0-100): Brand purpose clarity, values definition, personality consistency, mission/vision alignment, brand story strength
2. **Positioning** (0-100): Market differentiation, competitive advantage clarity, unique value proposition, category ownership, price-value perception
3. **Messaging** (0-100): Communication clarity, tone consistency, key message resonance, tagline effectiveness, content quality
4. **Visual** (0-100): Logo quality, color system coherence, typography system, design consistency, visual identity guidelines adherence
5. **Digital Presence** (0-100): Website quality, social media presence, SEO performance, online visibility, digital content strategy
6. **Reputation** (0-100): Customer perception, review sentiment, trust signals, industry recognition, word-of-mouth strength
7. **Market Fit** (0-100): Target audience alignment, product-market fit, demand validation, customer satisfaction indicators, growth potential

## SCORING GUIDELINES
- 80-100: Strong — well-established, competitive advantage
- 60-79: Good — functional but room for improvement
- 40-59: Needs Work — significant gaps that hurt the brand
- 0-39: Critical — urgent intervention needed

## ALERT GENERATION RULES
- Score < 30 on any dimension → "critical" alert
- Score < 50 on any dimension → "warning" alert  
- Score dropped > 10 points from previous → "warning" alert
- Score > 80 on any dimension → "opportunity" alert (leverage this strength)
- Any notable finding → "info" alert

${researchContext ? `\n## LIVE RESEARCH DATA\n${researchContext}` : ""}
${knowledgeContext ? `\n## KNOWLEDGE BASE\n${knowledgeContext}` : ""}
${notes && notes.length > 0 ? `\n## CONSULTANT NOTES\n${notes.join("\n")}` : ""}
${previousSnapshot ? `\n## PREVIOUS AUDIT SCORES (for comparison)\nOverall: ${previousSnapshot.overallScore}, Identity: ${previousSnapshot.identityScore}, Positioning: ${previousSnapshot.positioningScore}, Messaging: ${previousSnapshot.messagingScore}, Visual: ${previousSnapshot.visualScore}, Digital: ${previousSnapshot.digitalPresenceScore}, Reputation: ${previousSnapshot.reputationScore}, Market Fit: ${previousSnapshot.marketFitScore}` : ""}

Respond ONLY with valid JSON matching the schema below. Be specific and actionable in findings and recommendations. Base scores on available data — if data is limited, note this and score conservatively.`;

  const userPrompt = `Run a comprehensive brand health audit for:

**Company:** ${client.companyName || client.name}
**Industry:** ${client.industry || "Not specified"}
**Market:** ${client.market || "Not specified"}
**Website:** ${client.website || "Not specified"}

Evaluate all 7 dimensions and generate the full audit report.`;

  try {
    const response = await resilientLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "brand_audit",
          strict: true,
          schema: {
            type: "object",
            properties: {
              overallScore: { type: "integer", description: "Overall brand health score 0-100" },
              dimensions: {
                type: "object",
                properties: {
                  identity: {
                    type: "object",
                    properties: {
                      score: { type: "integer" },
                      label: { type: "string" },
                      findings: { type: "array", items: { type: "string" } },
                      recommendations: { type: "array", items: { type: "string" } },
                    },
                    required: ["score", "label", "findings", "recommendations"],
                    additionalProperties: false,
                  },
                  positioning: {
                    type: "object",
                    properties: {
                      score: { type: "integer" },
                      label: { type: "string" },
                      findings: { type: "array", items: { type: "string" } },
                      recommendations: { type: "array", items: { type: "string" } },
                    },
                    required: ["score", "label", "findings", "recommendations"],
                    additionalProperties: false,
                  },
                  messaging: {
                    type: "object",
                    properties: {
                      score: { type: "integer" },
                      label: { type: "string" },
                      findings: { type: "array", items: { type: "string" } },
                      recommendations: { type: "array", items: { type: "string" } },
                    },
                    required: ["score", "label", "findings", "recommendations"],
                    additionalProperties: false,
                  },
                  visual: {
                    type: "object",
                    properties: {
                      score: { type: "integer" },
                      label: { type: "string" },
                      findings: { type: "array", items: { type: "string" } },
                      recommendations: { type: "array", items: { type: "string" } },
                    },
                    required: ["score", "label", "findings", "recommendations"],
                    additionalProperties: false,
                  },
                  digitalPresence: {
                    type: "object",
                    properties: {
                      score: { type: "integer" },
                      label: { type: "string" },
                      findings: { type: "array", items: { type: "string" } },
                      recommendations: { type: "array", items: { type: "string" } },
                    },
                    required: ["score", "label", "findings", "recommendations"],
                    additionalProperties: false,
                  },
                  reputation: {
                    type: "object",
                    properties: {
                      score: { type: "integer" },
                      label: { type: "string" },
                      findings: { type: "array", items: { type: "string" } },
                      recommendations: { type: "array", items: { type: "string" } },
                    },
                    required: ["score", "label", "findings", "recommendations"],
                    additionalProperties: false,
                  },
                  marketFit: {
                    type: "object",
                    properties: {
                      score: { type: "integer" },
                      label: { type: "string" },
                      findings: { type: "array", items: { type: "string" } },
                      recommendations: { type: "array", items: { type: "string" } },
                    },
                    required: ["score", "label", "findings", "recommendations"],
                    additionalProperties: false,
                  },
                },
                required: ["identity", "positioning", "messaging", "visual", "digitalPresence", "reputation", "marketFit"],
                additionalProperties: false,
              },
              summary: { type: "string", description: "Executive summary of the brand health audit" },
              strengths: { type: "array", items: { type: "string" }, description: "Top brand strengths" },
              weaknesses: { type: "array", items: { type: "string" }, description: "Key weaknesses" },
              opportunities: { type: "array", items: { type: "string" }, description: "Growth opportunities" },
              threats: { type: "array", items: { type: "string" }, description: "External threats" },
            },
            required: ["overallScore", "dimensions", "summary", "strengths", "weaknesses", "opportunities", "threats"],
            additionalProperties: false,
          },
        },
      },
    }, { context: 'diagnosis' });

    const content = response.choices?.[0]?.message?.content as string;
    const parsed = JSON.parse(content);

    // Generate alerts based on scores
    const alerts: AlertData[] = [];
    const dimensionNames = ["identity", "positioning", "messaging", "visual", "digitalPresence", "reputation", "marketFit"] as const;
    const dimensionLabels: Record<string, string> = {
      identity: "Brand Identity",
      positioning: "Market Positioning",
      messaging: "Brand Messaging",
      visual: "Visual Identity",
      digitalPresence: "Digital Presence",
      reputation: "Brand Reputation",
      marketFit: "Market Fit",
    };

    for (const dim of dimensionNames) {
      const dimData = parsed.dimensions[dim];
      const score = dimData.score;
      const dbDim = dim === "digitalPresence" ? "digital_presence" : dim === "marketFit" ? "market_fit" : dim;

      if (score < 30) {
        alerts.push({
          severity: "critical",
          dimension: dbDim,
          title: `Critical: ${dimensionLabels[dim]} Score is ${score}/100`,
          description: `${dimensionLabels[dim]} scored critically low at ${score}/100. ${dimData.findings[0] || "Immediate intervention needed."}`,
          recommendation: dimData.recommendations[0] || "Conduct a focused audit on this dimension.",
        });
      } else if (score < 50) {
        alerts.push({
          severity: "warning",
          dimension: dbDim,
          title: `Warning: ${dimensionLabels[dim]} Needs Attention (${score}/100)`,
          description: `${dimensionLabels[dim]} scored ${score}/100, below the healthy threshold. ${dimData.findings[0] || ""}`,
          recommendation: dimData.recommendations[0] || "Prioritize improvement in this area.",
        });
      } else if (score >= 80) {
        alerts.push({
          severity: "opportunity",
          dimension: dbDim,
          title: `Strength: ${dimensionLabels[dim]} is Strong (${score}/100)`,
          description: `${dimensionLabels[dim]} is a competitive advantage at ${score}/100. ${dimData.findings[0] || ""}`,
          recommendation: `Leverage this strength in marketing and positioning. ${dimData.recommendations[0] || ""}`,
        });
      }

      // Check for score drops from previous snapshot
      if (previousSnapshot) {
        const prevScoreMap: Record<string, number> = {
          identity: previousSnapshot.identityScore,
          positioning: previousSnapshot.positioningScore,
          messaging: previousSnapshot.messagingScore,
          visual: previousSnapshot.visualScore,
          digitalPresence: previousSnapshot.digitalPresenceScore,
          reputation: previousSnapshot.reputationScore,
          marketFit: previousSnapshot.marketFitScore,
        };
        const prevScore = prevScoreMap[dim] || 0;
        if (prevScore - score > 10) {
          alerts.push({
            severity: "warning",
            dimension: dbDim,
            title: `Decline: ${dimensionLabels[dim]} dropped ${prevScore - score} points`,
            description: `${dimensionLabels[dim]} dropped from ${prevScore} to ${score} since the last audit.`,
            recommendation: "Investigate the cause of this decline and take corrective action.",
          });
        }
      }
    }

    // Generate granular metrics
    const metrics: MetricData[] = [];
    for (const dim of dimensionNames) {
      const dimData = parsed.dimensions[dim];
      const dbDim = dim === "digitalPresence" ? "digital_presence" : dim === "marketFit" ? "market_fit" : dim;
      
      metrics.push({
        dimension: dbDim,
        metricName: `${dimensionLabels[dim]} Overall`,
        score: dimData.score,
        maxScore: 100,
        details: dimData.findings.join("; "),
        dataSource: "ai_audit",
      });
    }

    return {
      ...parsed,
      alerts,
      metrics,
    };
  } catch {
    // Return a conservative fallback if AI fails
    const fallbackDimension: DimensionScore = {
      score: 50,
      label: "Needs Work",
      findings: ["Unable to fully assess — limited data available"],
      recommendations: ["Provide more information for a comprehensive audit"],
    };

    return {
      overallScore: 50,
      dimensions: {
        identity: { ...fallbackDimension },
        positioning: { ...fallbackDimension },
        messaging: { ...fallbackDimension },
        visual: { ...fallbackDimension },
        digitalPresence: { ...fallbackDimension },
        reputation: { ...fallbackDimension },
        marketFit: { ...fallbackDimension },
      },
      summary: "Brand audit could not be fully completed due to limited data. Please provide more information about the brand for a comprehensive assessment.",
      strengths: ["Data collection in progress"],
      weaknesses: ["Insufficient data for full assessment"],
      opportunities: ["Complete brand audit with more data"],
      threats: ["Unknown — requires further analysis"],
      alerts: [{
        severity: "info" as const,
        dimension: "overall",
        title: "Partial Audit — More Data Needed",
        description: "The brand audit was completed with limited data. Scores are conservative estimates.",
        recommendation: "Add research data and client notes for a more accurate assessment.",
      }],
      metrics: [],
    };
  }
}

/** Snapshot row shape from DB — dimension scores may be null until backfilled. */
export type SnapshotCompareInput = {
  overallScore: number;
  identityScore: number | null;
  positioningScore: number | null;
  messagingScore: number | null;
  visualScore: number | null;
  digitalPresenceScore: number | null;
  reputationScore: number | null;
  marketFitScore: number | null;
  createdAt: Date;
};

/**
 * Compare two brand health snapshots and generate a comparison report.
 */
export function compareSnapshots(current: SnapshotCompareInput, previous: SnapshotCompareInput) {
  const dimensions = [
    { key: "identity", label: "Identity", current: current.identityScore || 0, previous: previous.identityScore || 0 },
    { key: "positioning", label: "Positioning", current: current.positioningScore || 0, previous: previous.positioningScore || 0 },
    { key: "messaging", label: "Messaging", current: current.messagingScore || 0, previous: previous.messagingScore || 0 },
    { key: "visual", label: "Visual", current: current.visualScore || 0, previous: previous.visualScore || 0 },
    { key: "digitalPresence", label: "Digital Presence", current: current.digitalPresenceScore || 0, previous: previous.digitalPresenceScore || 0 },
    { key: "reputation", label: "Reputation", current: current.reputationScore || 0, previous: previous.reputationScore || 0 },
    { key: "marketFit", label: "Market Fit", current: current.marketFitScore || 0, previous: previous.marketFitScore || 0 },
  ];

  return {
    overallChange: (current.overallScore || 0) - (previous.overallScore || 0),
    dimensions: dimensions.map(d => ({
      ...d,
      change: d.current - d.previous,
      trend: d.current > d.previous ? "up" : d.current < d.previous ? "down" : "stable",
    })),
    periodStart: previous.createdAt,
    periodEnd: current.createdAt,
  };
}
