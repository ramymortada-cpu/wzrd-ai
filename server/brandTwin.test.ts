import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the database functions
vi.mock("./db", () => ({
  // Brand Twin mocks
  createBrandHealthSnapshot: vi.fn().mockResolvedValue(1),
  getLatestSnapshot: vi.fn().mockResolvedValue(null), // no previous snapshot
  getSnapshotHistory: vi.fn().mockResolvedValue([
    { id: 1, clientId: 1, overallScore: 72, createdAt: new Date("2026-01-15") },
    { id: 2, clientId: 1, overallScore: 68, createdAt: new Date("2026-01-01") },
  ]),
  getSnapshotById: vi.fn().mockResolvedValue({
    id: 1, clientId: 1, overallScore: 72,
    identityScore: 85, positioningScore: 75, messagingScore: 70, visualScore: 78,
    digitalPresenceScore: 65, reputationScore: 60, marketFitScore: 68,
    dimensionDetails: '{}', summary: "Good brand health", strengths: '["Strong identity"]',
    weaknesses: '["Weak digital"]', opportunities: '["Expand digital"]', threats: '["Competition"]',
    auditType: "ai_auto", createdAt: new Date("2026-01-15"),
  }),
  createBrandAlert: vi.fn().mockResolvedValue(1),
  getAlertsByClient: vi.fn().mockResolvedValue([
    { id: 1, clientId: 1, snapshotId: 1, dimension: "digitalPresence", severity: "warning", title: "Low Digital Score", description: "Digital presence score below 70", recommendation: "Improve social media", status: "active", createdAt: new Date("2026-01-15") },
    { id: 2, clientId: 1, snapshotId: 1, dimension: "reputation", severity: "info", title: "Reputation Needs Attention", description: "Reputation score is below average", recommendation: "Get more reviews", status: "active", createdAt: new Date("2026-01-15") },
  ]),
  updateAlertStatus: vi.fn().mockResolvedValue(undefined),
  createBrandMetrics: vi.fn().mockResolvedValue(undefined),
  getMetricsByClient: vi.fn().mockResolvedValue([
    { id: 1, clientId: 1, snapshotId: 1, dimension: "identity", metricName: "Logo Quality", score: 85, maxScore: 100, details: "Strong logo", dataSource: "ai_audit", createdAt: new Date("2026-01-15") },
    { id: 2, clientId: 1, snapshotId: 1, dimension: "digitalPresence", metricName: "Social Media", score: 45, maxScore: 100, details: "Weak presence", dataSource: "ai_audit", createdAt: new Date("2026-01-15") },
  ]),
  getBrandTwinDashboard: vi.fn().mockResolvedValue({
    totalAudited: 5, avgHealth: 72, healthyCount: 3, atRiskCount: 1, criticalCount: 1, activeAlerts: 4,
  }),

  // Client mocks
  getClientById: vi.fn().mockResolvedValue({
    id: 1, name: "Ahmed", companyName: "Sushi Master", industry: "Restaurants", market: "ksa", website: "sushimaster.com",
  }),
  getClients: vi.fn().mockResolvedValue([
    { id: 1, name: "Ahmed", companyName: "Sushi Master", industry: "Restaurants", market: "ksa" },
    { id: 2, name: "Sara", companyName: "Fashion Hub", industry: "Retail", market: "egypt" },
  ]),
  getNotesByClient: vi.fn().mockResolvedValue([]),

  // Research mocks
  getResearchReportsByClient: vi.fn().mockResolvedValue([]),
  getResearchCacheByIndustryMarket: vi.fn().mockResolvedValue([]),

  // Knowledge mocks
  getKnowledgeForContext: vi.fn().mockResolvedValue("## KNOWLEDGE\n- Test"),
  getKnowledgeStats: vi.fn().mockResolvedValue({ total: 23, byCategory: {}, bySource: {} }),

  // Dashboard mocks
  getAnalyticsData: vi.fn().mockResolvedValue({ totalClients: 5 }),
  getDashboardStats: vi.fn().mockResolvedValue({ totalClients: 5 }),
  getPipelineAnalytics: vi.fn().mockResolvedValue({ total: 0 }),

  // Pipeline mocks
  getAllPipelineRuns: vi.fn().mockResolvedValue([]),
  getPipelineRunsByClient: vi.fn().mockResolvedValue([]),
  createPipelineRun: vi.fn().mockResolvedValue(1),
  getPipelineRunById: vi.fn().mockResolvedValue(null),
  updatePipelineRun: vi.fn().mockResolvedValue(undefined),

  // Project/Portal mocks
  createProject: vi.fn().mockResolvedValue(1),
  createDeliverable: vi.fn().mockResolvedValue(1),
  createPortalToken: vi.fn().mockResolvedValue(1),
  getDb: vi.fn().mockResolvedValue({
    select: () => ({
      from: () => ({
        where: () => ({ orderBy: () => ({ limit: () => Promise.resolve([]) }) }),
        orderBy: () => ({ limit: () => Promise.resolve([]) }),
      }),
    }),
  }),
}));

// Mock brand twin engine
vi.mock("./brandTwin", () => ({
  runBrandAudit: vi.fn().mockResolvedValue({
    overallScore: 72,
    dimensions: {
      identity: { score: 85, label: "Strong", findings: ["Strong logo"], recommendations: ["Maintain consistency"] },
      positioning: { score: 75, label: "Good", findings: ["Clear positioning"], recommendations: ["Sharpen USP"] },
      messaging: { score: 70, label: "Good", findings: ["Decent tagline"], recommendations: ["Refine messaging"] },
      visual: { score: 78, label: "Good", findings: ["Good visual system"], recommendations: ["Update guidelines"] },
      digitalPresence: { score: 65, label: "Good", findings: ["Weak social"], recommendations: ["Improve social media"] },
      reputation: { score: 60, label: "Good", findings: ["Positive reviews"], recommendations: ["Get more reviews"] },
      marketFit: { score: 68, label: "Good", findings: ["Good fit"], recommendations: ["Expand market"] },
    },
    summary: "Overall good brand health with room for improvement in digital presence",
    strengths: ["Strong identity", "Good visual system"],
    weaknesses: ["Weak digital presence", "Limited reputation"],
    opportunities: ["Expand digital", "Leverage identity strength"],
    threats: ["Growing competition", "Market saturation"],
    alerts: [
      { dimension: "digitalPresence", severity: "warning", title: "Low Digital Score", description: "Digital presence score below 70", recommendation: "Improve social media presence" },
    ],
    metrics: [
      { dimension: "identity", metricName: "Logo Quality", score: 85, maxScore: 100, details: "Strong logo", dataSource: "ai_audit" },
    ],
  }),
  compareSnapshots: vi.fn().mockReturnValue({
    overallChange: 4,
    dimensions: [
      { key: "identity", label: "Identity", current: 85, previous: 80, change: 5, trend: "up" },
      { key: "positioning", label: "Positioning", current: 75, previous: 70, change: 5, trend: "up" },
      { key: "messaging", label: "Messaging", current: 70, previous: 65, change: 5, trend: "up" },
      { key: "visual", label: "Visual", current: 78, previous: 75, change: 3, trend: "up" },
      { key: "digitalPresence", label: "Digital Presence", current: 65, previous: 60, change: 5, trend: "up" },
      { key: "reputation", label: "Reputation", current: 60, previous: 55, change: 5, trend: "up" },
      { key: "marketFit", label: "Market Fit", current: 68, previous: 65, change: 3, trend: "up" },
    ],
    periodStart: new Date("2026-01-01"),
    periodEnd: new Date("2026-01-15"),
  }),
}));

// Mock research engine
vi.mock("./researchEngine", () => ({
  conductResearch: vi.fn().mockResolvedValue({
    summary: "Research summary", keyInsights: ["Insight 1"], recommendations: ["Rec 1"],
    competitors: [], marketData: { overview: "Market data" }, academicResults: [], totalSources: 3, searchQueries: ["test"],
  }),
  formatResearchForContext: vi.fn().mockReturnValue("## RESEARCH\nTest"),
}));

// Mock knowledge base
vi.mock("./knowledgeBase", () => ({
  buildSystemPrompt: vi.fn().mockReturnValue("You are Wzrd AI."),
}));

// Mock LLM
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{ message: { content: "AI response" } }],
  }),
}));

// Mock notification
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

const mockUser = { id: "user-1", name: "Test User", role: "admin" };
const createCaller = (user = mockUser) => {
  const ctx = { user } as unknown as TrpcContext;
  return appRouter.createCaller(ctx);
};

describe("Brand Digital Twin - Run Audit", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("should run a brand audit for a client and return snapshot id", async () => {
    const caller = createCaller();
    const result = await caller.brandTwin.runAudit({ clientId: 1 });
    expect(result).toHaveProperty("snapshotId", 1);
    expect(result).toHaveProperty("overallScore", 72);
    expect(result).toHaveProperty("summary");
    expect(result).toHaveProperty("strengths");
    expect(result).toHaveProperty("weaknesses");
  });

  it("should run audit with optional overrides", async () => {
    const caller = createCaller();
    const result = await caller.brandTwin.runAudit({ clientId: 1, companyName: "Custom Name", industry: "F&B", market: "ksa" });
    expect(result).toHaveProperty("snapshotId", 1);
    expect(result).toHaveProperty("overallScore", 72);
  });
});

describe("Brand Digital Twin - Dashboard", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("should return brand twin dashboard stats", async () => {
    const caller = createCaller();
    const dashboard = await caller.brandTwin.dashboard();
    expect(dashboard).toHaveProperty("totalAudited", 5);
    expect(dashboard).toHaveProperty("avgHealth", 72);
    expect(dashboard).toHaveProperty("healthyCount", 3);
    expect(dashboard).toHaveProperty("atRiskCount", 1);
    expect(dashboard).toHaveProperty("criticalCount", 1);
    expect(dashboard).toHaveProperty("activeAlerts", 4);
  });
});

describe("Brand Digital Twin - Snapshot History", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("should return snapshot history for a client", async () => {
    const caller = createCaller();
    const history = await caller.brandTwin.getHistory({ clientId: 1 });
    expect(Array.isArray(history)).toBe(true);
    expect(history.length).toBe(2);
    expect(history[0]).toHaveProperty("overallScore", 72);
  });

  it("should return a single snapshot by id", async () => {
    const caller = createCaller();
    const snapshot = await caller.brandTwin.getSnapshot({ id: 1 });
    expect(snapshot).toHaveProperty("overallScore", 72);
    expect(snapshot).toHaveProperty("identityScore", 85);
    expect(snapshot).toHaveProperty("positioningScore", 75);
    expect(snapshot).toHaveProperty("digitalPresenceScore", 65);
  });
});

describe("Brand Digital Twin - Alerts", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("should return alerts for a client", async () => {
    const caller = createCaller();
    const alerts = await caller.brandTwin.getAlerts({ clientId: 1 });
    expect(Array.isArray(alerts)).toBe(true);
    expect(alerts.length).toBe(2);
    expect(alerts[0]).toHaveProperty("dimension", "digitalPresence");
    expect(alerts[0]).toHaveProperty("severity", "warning");
    expect(alerts[0]).toHaveProperty("status", "active");
  });

  it("should update alert status", async () => {
    const caller = createCaller();
    const result = await caller.brandTwin.updateAlert({ id: 1, status: "resolved" });
    expect(result).toHaveProperty("success", true);
  });
});

describe("Brand Digital Twin - Metrics", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("should return metrics for a client", async () => {
    const caller = createCaller();
    const metrics = await caller.brandTwin.metrics({ clientId: 1 });
    expect(Array.isArray(metrics)).toBe(true);
    expect(metrics.length).toBe(2);
    expect(metrics[0]).toHaveProperty("dimension", "identity");
    expect(metrics[0]).toHaveProperty("score", 85);
  });

  it("should filter metrics by dimension", async () => {
    const caller = createCaller();
    const metrics = await caller.brandTwin.metrics({ clientId: 1, dimension: "digitalPresence" });
    expect(Array.isArray(metrics)).toBe(true);
  });
});

describe("Brand Digital Twin - Compare Snapshots", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("should compare two snapshots and return differences", async () => {
    const caller = createCaller();
    const comparison = await caller.brandTwin.compare({ snapshotIdA: 1, snapshotIdB: 2 });
    expect(comparison).toHaveProperty("overallChange");
    expect(comparison).toHaveProperty("dimensions");
    expect(Array.isArray(comparison.dimensions)).toBe(true);
    expect(comparison.dimensions[0]).toHaveProperty("trend");
  });
});

describe("Brand Digital Twin - All Alerts", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("should return all alerts across all clients", async () => {
    const caller = createCaller();
    const result = await caller.brandTwin.allAlerts({});
    expect(Array.isArray(result)).toBe(true);
  });

  it("should filter alerts by status", async () => {
    const caller = createCaller();
    const result = await caller.brandTwin.allAlerts({ status: "active" });
    expect(Array.isArray(result)).toBe(true);
  });
});
