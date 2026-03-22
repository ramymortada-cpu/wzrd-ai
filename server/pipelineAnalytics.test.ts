import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the database functions
vi.mock("./db", () => ({
  // Pipeline analytics mocks
  getPipelineAnalytics: vi.fn().mockResolvedValue({
    total: 10,
    completed: 7,
    failed: 1,
    running: 1,
    paused: 1,
    pending: 0,
    successRate: 70,
    avgDuration: 245,
    recentRuns: [
      {
        id: 1,
        clientId: 1,
        serviceType: "business_health_check",
        status: "completed",
        currentStep: 5,
        totalSteps: 5,
        startedAt: new Date("2026-01-01"),
        completedAt: new Date("2026-01-01"),
        createdAt: new Date("2026-01-01"),
      },
      {
        id: 2,
        clientId: 2,
        serviceType: "brand_identity",
        status: "running",
        currentStep: 3,
        totalSteps: 5,
        startedAt: new Date("2026-01-02"),
        completedAt: null,
        createdAt: new Date("2026-01-02"),
      },
    ],
  }),

  // Dashboard stats mocks
  getAnalyticsData: vi.fn().mockResolvedValue({
    totalClients: 5,
    activeProjects: 3,
    totalRevenue: 50000,
    pendingRevenue: 20000,
    completedDeliverables: 12,
    totalDeliverables: 20,
  }),
  getDashboardStats: vi.fn().mockResolvedValue({
    totalClients: 5,
    activeProjects: 3,
    totalRevenue: 50000,
    pendingRevenue: 20000,
  }),

  // Knowledge base mocks (needed for some routes)
  getKnowledgeForContext: vi.fn().mockResolvedValue("## KNOWLEDGE BASE\n- Test"),
  getKnowledgeStats: vi.fn().mockResolvedValue({ total: 23, byCategory: {}, bySource: {} }),

  // Research mocks
  getResearchReportsByClient: vi.fn().mockResolvedValue([]),
  getResearchCacheByIndustryMarket: vi.fn().mockResolvedValue([]),

  // Pipeline mocks
  getAllPipelineRuns: vi.fn().mockResolvedValue([]),
  getPipelineRunsByClient: vi.fn().mockResolvedValue([]),
  createPipelineRun: vi.fn().mockResolvedValue(1),
  getPipelineRunById: vi.fn().mockResolvedValue({
    id: 1,
    clientId: 1,
    projectId: null,
    serviceType: "business_health_check",
    status: "completed",
    currentStep: 5,
    totalSteps: 5,
    autoApprove: 1,
    startedAt: new Date("2026-01-01"),
    completedAt: new Date("2026-01-01"),
    researchOutput: '{"summary":"test"}',
    diagnosisOutput: "Test diagnosis",
    strategyOutput: "Test strategy",
    deliverablesOutput: '[{"title":"Logo","content":"Logo design"}]',
    proposalOutput: "Test proposal",
    errorMessage: null,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
  }),
  updatePipelineRun: vi.fn().mockResolvedValue(undefined),

  // Client mocks
  getClientById: vi.fn().mockResolvedValue({
    id: 1,
    name: "Ahmed",
    companyName: "Sushi Master",
    industry: "Restaurants",
    market: "ksa",
    website: "sushimaster.com",
  }),
  getNotesByClient: vi.fn().mockResolvedValue([]),

  // Project/Portal mocks (needed for auto-portal)
  createProject: vi.fn().mockResolvedValue(1),
  createDeliverable: vi.fn().mockResolvedValue(1),
  createPortalToken: vi.fn().mockResolvedValue(1),
}));

// Mock research engine
vi.mock("./researchEngine", () => ({
  conductResearch: vi.fn().mockResolvedValue({
    summary: "Research summary",
    keyInsights: ["Insight 1"],
    recommendations: ["Rec 1"],
    competitors: [],
    marketData: { overview: "Market data" },
    academicResults: [],
    totalSources: 3,
    searchQueries: ["test"],
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
    choices: [{ message: { content: "Generated AI content for pipeline step" } }],
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

describe("Dashboard Pipeline Analytics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return pipeline analytics data", async () => {
    const caller = createCaller();
    const analytics = await caller.dashboard.pipelineAnalytics();
    expect(analytics).toHaveProperty("total", 10);
    expect(analytics).toHaveProperty("completed", 7);
    expect(analytics).toHaveProperty("failed", 1);
    expect(analytics).toHaveProperty("running", 1);
    expect(analytics).toHaveProperty("successRate", 70);
    expect(analytics).toHaveProperty("avgDuration", 245);
    expect(analytics).toHaveProperty("recentRuns");
    expect(analytics.recentRuns.length).toBe(2);
  });

  it("should return recent runs with correct structure", async () => {
    const caller = createCaller();
    const analytics = await caller.dashboard.pipelineAnalytics();
    const firstRun = analytics.recentRuns[0];
    expect(firstRun).toHaveProperty("id");
    expect(firstRun).toHaveProperty("clientId");
    expect(firstRun).toHaveProperty("serviceType");
    expect(firstRun).toHaveProperty("status");
    expect(firstRun).toHaveProperty("currentStep");
  });

  it("should return dashboard stats", async () => {
    const caller = createCaller();
    const stats = await caller.dashboard.stats();
    expect(stats).toHaveProperty("totalClients", 5);
    expect(stats).toHaveProperty("activeProjects", 3);
    expect(stats).toHaveProperty("totalRevenue", 50000);
    expect(stats).toHaveProperty("pendingRevenue", 20000);
  });
});

describe("Pipeline Auto-Portal Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should start a pipeline and get an id", async () => {
    const caller = createCaller();
    const result = await caller.pipeline.start({
      clientId: 1,
      serviceType: "business_health_check",
      autoApprove: true,
    });
    expect(result).toHaveProperty("id");
    expect(result.id).toBe(1);
  });

  it("should execute a step on a completed pipeline and return completed status", async () => {
    const caller = createCaller();
    const result = await caller.pipeline.executeStep({ pipelineId: 1 });
    expect(result.status).toBe("completed");
    expect(result.message).toBe("Pipeline already finished");
  });

  it("should get pipeline by id with all output fields", async () => {
    const caller = createCaller();
    const pipeline = await caller.pipeline.get({ id: 1 });
    expect(pipeline).toHaveProperty("status", "completed");
    expect(pipeline).toHaveProperty("researchOutput");
    expect(pipeline).toHaveProperty("diagnosisOutput");
    expect(pipeline).toHaveProperty("strategyOutput");
    expect(pipeline).toHaveProperty("deliverablesOutput");
    expect(pipeline).toHaveProperty("proposalOutput");
  });

  it("should list pipelines", async () => {
    const caller = createCaller();
    const pipelines = await caller.pipeline.list();
    expect(Array.isArray(pipelines)).toBe(true);
  });

  it("should get pipelines by client", async () => {
    const caller = createCaller();
    const pipelines = await caller.pipeline.getByClient({ clientId: 1 });
    expect(Array.isArray(pipelines)).toBe(true);
  });
});
