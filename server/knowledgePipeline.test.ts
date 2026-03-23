import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the database functions
vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue(null),
  getProjectById: vi.fn().mockResolvedValue({
    id: 1,
    clientId: 1,
    name: "Test Project",
    serviceType: "business_health_check",
    stage: "diagnose",
    status: "active",
  }),
  getResearchReportById: vi.fn().mockResolvedValue({
    id: 1,
    clientId: 1,
    companyName: "Test Co",
    industry: "Tech",
    market: "Egypt",
    reportData: {
      summary: "Test summary",
      keyInsights: ["Insight 1"],
      recommendations: ["Rec 1"],
      competitors: [],
      marketData: { overview: "Market overview" },
    },
  }),
  // Knowledge Base mocks
  createKnowledgeEntry: vi.fn().mockResolvedValue(1),
  getKnowledgeEntries: vi.fn().mockResolvedValue([
    {
      id: 1,
      title: "Test Knowledge Entry",
      content: "Test content about brand strategy",
      category: "framework",
      industry: "Technology",
      market: "Egypt",
      source: "manual",
      sourceId: null,
      tags: ["branding", "strategy"],
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date("2026-01-01"),
    },
  ]),
  getKnowledgeEntryById: vi.fn().mockResolvedValue({
    id: 1,
    title: "Test Knowledge Entry",
    content: "Test content about brand strategy",
    category: "framework",
    industry: "Technology",
    market: "Egypt",
    source: "manual",
    sourceId: null,
    tags: ["branding", "strategy"],
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
  }),
  updateKnowledgeEntry: vi.fn().mockResolvedValue(undefined),
  deleteKnowledgeEntry: vi.fn().mockResolvedValue(undefined),
  getKnowledgeStats: vi.fn().mockResolvedValue({
    total: 15,
    byCategory: { framework: 5, case_study: 4, market_insight: 3, lesson_learned: 2, general: 1 },
    bySource: { manual: 8, research_import: 5, conversation_extract: 2 },
  }),
  getKnowledgeForContext: vi.fn().mockResolvedValue("## KNOWLEDGE BASE\n- Framework: Test insight"),

  // Pipeline mocks
  createPipelineRun: vi.fn().mockResolvedValue(1),
  getPipelineRunById: vi.fn().mockResolvedValue({
    id: 1,
    clientId: 1,
    projectId: null,
    serviceType: "business_health_check",
    status: "pending",
    currentStep: 0,
    totalSteps: 5,
    autoApprove: 1,
    startedAt: new Date("2026-01-01"),
    completedAt: null,
    researchOutput: null,
    diagnosisOutput: null,
    strategyOutput: null,
    deliverablesOutput: null,
    proposalOutput: null,
    errorMessage: null,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
  }),
  updatePipelineRun: vi.fn().mockResolvedValue(undefined),
  getAllPipelineRuns: vi.fn().mockResolvedValue([
    {
      id: 1,
      clientId: 1,
      serviceType: "business_health_check",
      status: "completed",
      currentStep: 5,
      totalSteps: 5,
      createdAt: new Date("2026-01-01"),
    },
    {
      id: 2,
      clientId: 2,
      serviceType: "brand_identity",
      status: "pending",
      currentStep: 0,
      totalSteps: 5,
      createdAt: new Date("2026-01-02"),
    },
  ]),
  getPipelineRunsByClient: vi.fn().mockResolvedValue([
    {
      id: 1,
      clientId: 1,
      serviceType: "business_health_check",
      status: "completed",
      currentStep: 5,
      createdAt: new Date("2026-01-01"),
    },
  ]),

  // Research mocks (needed for pipeline and knowledge import)
  getResearchReportsByClient: vi.fn().mockResolvedValue([]),
  getResearchCacheByIndustryMarket: vi.fn().mockResolvedValue([]),

  // Client mocks (needed for pipeline)
  getClientById: vi.fn().mockResolvedValue({
    id: 1,
    name: "Ahmed",
    companyName: "Sushi Master",
    industry: "Restaurants",
    market: "ksa",
    website: "sushimaster.com",
  }),
  getNotesByClient: vi.fn().mockResolvedValue([]),

  // Conversation mocks (needed for extractFromConversation)
  getAiConversationById: vi.fn().mockResolvedValue({
    id: 1,
    title: "Test Conversation",
    messages: [
      { role: "user", content: "I need help with my brand" },
      { role: "assistant", content: "Based on my analysis, your brand needs better positioning in the market. Key insight: your target audience is not well defined." },
    ],
    createdAt: new Date("2026-01-01"),
  }),
}));

// Mock research engine
vi.mock("./researchEngine", () => ({
  conductResearch: vi.fn().mockResolvedValue({
    summary: "Research summary for pipeline",
    keyInsights: ["Insight 1"],
    recommendations: ["Rec 1"],
    competitors: [],
    marketData: { overview: "Market data" },
    academicResults: [],
    totalSources: 3,
    searchQueries: ["test query"],
  }),
  formatResearchForContext: vi.fn().mockReturnValue("## RESEARCH CONTEXT\nTest research data"),
}));

// Mock knowledge base
vi.mock("./knowledgeBase", () => ({
  buildSystemPrompt: vi.fn().mockReturnValue("You are Wzrd AI, a brand strategy consultant."),
}));

// Mock LLM
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{ message: { content: '{"insights": [{"title": "Test Insight", "content": "Test content", "category": "market_insight"}]}' } }],
  }),
}));

// Mock db/research so getResearchReportById returns mock data (knowledge imports from db/research)
vi.mock("./db/research", () => ({
  getResearchReportById: vi.fn().mockResolvedValue({
    id: 1,
    clientId: 1,
    companyName: "Test Co",
    industry: "Tech",
    market: "Egypt",
    reportData: {
      summary: "Test summary",
      keyInsights: ["Insight 1"],
      recommendations: ["Rec 1"],
      competitors: [],
      marketData: { overview: "Market overview" },
    },
  }),
}));

// Mock liveIntelligence to avoid DB/LLM in researchToKnowledge
vi.mock("./liveIntelligence", () => ({
  researchToKnowledge: vi.fn().mockResolvedValue({ entriesCreated: 3 }),
  liveResearch: vi.fn().mockResolvedValue({ summary: "Live research", sources: [] }),
  deepResearch: vi.fn().mockResolvedValue({ entriesCreated: 2 }),
  refreshStaleKnowledge: vi.fn().mockResolvedValue({ refreshed: 0 }),
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

describe("Knowledge Base Router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create a knowledge entry", async () => {
    const caller = createCaller();
    const result = await caller.knowledge.create({
      title: "Brand Strategy Framework",
      content: "A comprehensive framework for brand strategy...",
      category: "framework",
      industry: "Technology",
      market: "Egypt",
      tags: ["branding", "strategy"],
    });
    expect(result).toHaveProperty("id");
    expect(result.id).toBe(1);
  });

  it("should list knowledge entries", async () => {
    const caller = createCaller();
    const entries = await caller.knowledge.list({});
    expect(Array.isArray(entries)).toBe(true);
    expect(entries.length).toBeGreaterThan(0);
    expect(entries[0]).toHaveProperty("title");
    expect(entries[0]).toHaveProperty("category");
  });

  it("should list entries with filters", async () => {
    const caller = createCaller();
    const entries = await caller.knowledge.list({
      category: "framework",
      industry: "Technology",
    });
    expect(Array.isArray(entries)).toBe(true);
  });

  it("should get a knowledge entry by id", async () => {
    const caller = createCaller();
    const entry = await caller.knowledge.getById({ id: 1 });
    expect(entry).toHaveProperty("title", "Test Knowledge Entry");
    expect(entry).toHaveProperty("category", "framework");
  });

  it("should update a knowledge entry", async () => {
    const caller = createCaller();
    const result = await caller.knowledge.update({
      id: 1,
      title: "Updated Title",
      content: "Updated content",
    });
    expect(result).toEqual({ success: true });
  });

  it("should delete a knowledge entry", async () => {
    const caller = createCaller();
    const result = await caller.knowledge.delete({ id: 1 });
    expect(result).toEqual({ success: true });
  });

  it("should return knowledge stats", async () => {
    const caller = createCaller();
    const stats = await caller.knowledge.stats();
    expect(stats).toHaveProperty("total", 15);
    expect(stats).toHaveProperty("byCategory");
    expect(stats.byCategory).toHaveProperty("framework", 5);
  });

  it("should import insights from research report", async () => {
    const caller = createCaller();
    const result = await caller.knowledge.importFromResearch({ reportId: 1 });
    expect(result).toHaveProperty("imported");
    expect(result.imported).toBeGreaterThanOrEqual(0);
  });

  it("should extract knowledge from conversation", async () => {
    const caller = createCaller();
    const result = await caller.knowledge.extractFromConversation({
      messages: [
        { role: "user", content: "I need help with my brand" },
        { role: "assistant", content: "Your brand needs better positioning." },
      ],
    });
    expect(result).toBeDefined();
    expect(result).toHaveProperty("extracted");
    expect(result).toHaveProperty("savedIds");
  });
});

describe("Pipeline Router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should start a new pipeline", async () => {
    const caller = createCaller();
    const result = await caller.pipeline.start({
      clientId: 1,
      projectId: 1,
      serviceType: "business_health_check",
      autoApprove: true,
    });
    expect(result).toHaveProperty("runId");
    expect(result.runId).toBe(1);
  });

  it("should list all pipeline runs", async () => {
    const caller = createCaller();
    const pipelines = await caller.pipeline.list();
    expect(Array.isArray(pipelines)).toBe(true);
    expect(pipelines.length).toBe(2);
  });

  it("should get a pipeline by id", async () => {
    const caller = createCaller();
    const pipeline = await caller.pipeline.getById({ id: 1 });
    expect(pipeline).toHaveProperty("serviceType", "business_health_check");
    expect(pipeline).toHaveProperty("status");
  });

  it("should get pipelines by client", async () => {
    const caller = createCaller();
    const pipelines = await caller.pipeline.getByClient({ clientId: 1 });
    expect(Array.isArray(pipelines)).toBe(true);
    expect(pipelines.length).toBe(1);
  });

  it("should pause a pipeline", async () => {
    const caller = createCaller();
    const result = await caller.pipeline.update({ id: 1, status: "paused" });
    expect(result).toEqual({ success: true });
  });

  it("should resume a pipeline", async () => {
    const caller = createCaller();
    const result = await caller.pipeline.update({ id: 1, status: "pending" });
    expect(result).toEqual({ success: true });
  });

  it("should execute a pipeline stage", async () => {
    const caller = createCaller();
    const result = await caller.pipeline.executeStage({ projectId: 1, stage: "diagnose", pipelineRunId: 1 });
    expect(result).toHaveProperty("status");
  });

  it("should handle completed pipeline", async () => {
    const { getPipelineRunById } = await import("./db");
    (getPipelineRunById as any).mockResolvedValueOnce({
      id: 1,
      clientId: 1,
      serviceType: "business_health_check",
      status: "completed",
      currentStep: 5,
      totalSteps: 5,
    });

    const caller = createCaller();
    const pipeline = await caller.pipeline.getById({ id: 1 });
    expect(pipeline?.status).toBe("completed");
  });
});
