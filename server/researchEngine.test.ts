import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the database functions
vi.mock("./db", () => ({
  getCachedResearch: vi.fn().mockResolvedValue(null),
  setCachedResearch: vi.fn().mockResolvedValue(undefined),
  getResearchCacheByIndustryMarket: vi.fn().mockResolvedValue([]),
  createResearchReport: vi.fn().mockResolvedValue(1),
  getResearchReportById: vi.fn().mockResolvedValue({
    id: 1,
    clientId: null,
    projectId: null,
    companyName: "Sushi Master",
    industry: "Restaurants",
    market: "ksa",
    reportData: {
      summary: "Test research summary",
      keyInsights: ["Insight 1", "Insight 2"],
      recommendations: ["Rec 1", "Rec 2"],
      competitors: [],
      marketData: { overview: "Market overview", trends: [], challenges: [], opportunities: [] },
      academicResults: [],
      totalSources: 5,
      searchQueries: ["sushi restaurants riyadh"],
    },
    summary: "Test research summary",
    keyInsights: ["Insight 1", "Insight 2"],
    recommendations: ["Rec 1", "Rec 2"],
    totalSources: 5,
    searchQueries: ["sushi restaurants riyadh"],
    status: "completed",
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
  }),
  getResearchReportsByClient: vi.fn().mockResolvedValue([
    {
      id: 1,
      clientId: 1,
      companyName: "Sushi Master",
      industry: "Restaurants",
      market: "ksa",
      status: "completed",
      totalSources: 5,
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date("2026-01-01"),
    },
  ]),
  getAllResearchReports: vi.fn().mockResolvedValue([
    {
      id: 1,
      clientId: null,
      companyName: "Sushi Master",
      industry: "Restaurants",
      market: "ksa",
      status: "completed",
      totalSources: 5,
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date("2026-01-01"),
    },
  ]),
  updateResearchReport: vi.fn().mockResolvedValue(undefined),
  getResearchStats: vi.fn().mockResolvedValue({
    totalReports: 3,
    totalSources: 42,
    industries: ["Restaurants", "Technology", "Real Estate"],
  }),
  // Other db functions needed by the router
  getClients: vi.fn().mockResolvedValue([]),
  createClient: vi.fn().mockResolvedValue({ id: 1 }),
  getClientById: vi.fn().mockResolvedValue({
    id: 1, name: "Test Client", companyName: "Test Co", email: "test@test.com",
    phone: "", market: "ksa", industry: "Restaurants", website: "", notes: "",
    status: "active", createdAt: new Date(), updatedAt: new Date(),
  }),
  updateClient: vi.fn().mockResolvedValue(undefined),
  deleteClient: vi.fn().mockResolvedValue(undefined),
  getProjects: vi.fn().mockResolvedValue([]),
  createProject: vi.fn().mockResolvedValue({ id: 1 }),
  getProjectsByClient: vi.fn().mockResolvedValue([]),
  getProjectById: vi.fn().mockResolvedValue(null),
  updateProject: vi.fn().mockResolvedValue(undefined),
  deleteProject: vi.fn().mockResolvedValue(undefined),
  createDeliverable: vi.fn().mockResolvedValue({ id: 1 }),
  getDeliverablesByProject: vi.fn().mockResolvedValue([]),
  updateDeliverable: vi.fn().mockResolvedValue(undefined),
  deleteDeliverable: vi.fn().mockResolvedValue(undefined),
  createClientNote: vi.fn().mockResolvedValue({ id: 1 }),
  getNotesByClient: vi.fn().mockResolvedValue([]),
  getNotesByProject: vi.fn().mockResolvedValue([]),
  updateClientNote: vi.fn().mockResolvedValue(undefined),
  deleteClientNote: vi.fn().mockResolvedValue(undefined),
  getAllNotes: vi.fn().mockResolvedValue([]),
  createPayment: vi.fn().mockResolvedValue({ id: 1 }),
  getPaymentsByProject: vi.fn().mockResolvedValue([]),
  getPaymentsByClient: vi.fn().mockResolvedValue([]),
  getAllPayments: vi.fn().mockResolvedValue([]),
  updatePayment: vi.fn().mockResolvedValue(undefined),
  createAiConversation: vi.fn().mockResolvedValue({ id: 1 }),
  getAiConversationsByProject: vi.fn().mockResolvedValue([]),
  getAiConversationById: vi.fn().mockResolvedValue(null),
  updateAiConversation: vi.fn().mockResolvedValue(undefined),
  getDashboardStats: vi.fn().mockResolvedValue({
    totalClients: 0, activeProjects: 0, completedProjects: 0,
    totalRevenue: 0, pendingRevenue: 0, overdueRevenue: 0,
  }),
  getAnalyticsData: vi.fn().mockResolvedValue({
    clientGrowth: [], revenueByMonth: [], projectsByStage: [],
    serviceBreakdown: [], monthlyMetrics: [],
  }),
  createProposal: vi.fn().mockResolvedValue({ id: 1 }),
  getProposals: vi.fn().mockResolvedValue([]),
  getProposalById: vi.fn().mockResolvedValue(null),
  getProposalsByClient: vi.fn().mockResolvedValue([]),
  updateProposal: vi.fn().mockResolvedValue(undefined),
  deleteProposal: vi.fn().mockResolvedValue(undefined),
  createOnboardingSession: vi.fn().mockResolvedValue(1),
  getOnboardingSessionById: vi.fn().mockResolvedValue(null),
  getOnboardingSessions: vi.fn().mockResolvedValue([]),
  updateOnboardingSession: vi.fn().mockResolvedValue(undefined),
  createPortalToken: vi.fn().mockResolvedValue(1),
  getPortalTokenByToken: vi.fn().mockResolvedValue(null),
  getPortalTokensByProject: vi.fn().mockResolvedValue([]),
  updatePortalToken: vi.fn().mockResolvedValue(undefined),
}));

// Mock the research engine
vi.mock("./researchEngine", () => ({
  conductResearch: vi.fn().mockResolvedValue({
    summary: "Comprehensive research summary for Sushi Master in the Saudi restaurant market.",
    keyInsights: [
      "The Saudi F&B market is growing at 8% annually",
      "Japanese cuisine is trending in Riyadh and Jeddah",
      "Digital ordering accounts for 40% of restaurant revenue",
    ],
    recommendations: [
      "Focus on delivery-first strategy",
      "Build strong social media presence on Instagram and TikTok",
      "Consider franchise model for expansion",
    ],
    competitors: [
      {
        name: "Sakura Sushi",
        website: "https://sakurasushi.sa",
        positioning: "Premium Japanese dining",
        strengths: ["Strong brand", "Multiple locations"],
        weaknesses: ["High prices", "Limited delivery"],
      },
    ],
    marketData: {
      overview: "The Saudi restaurant market is valued at $25B",
      trends: ["Cloud kitchens", "Health-conscious dining"],
      challenges: ["High rent costs", "Labor regulations"],
      opportunities: ["Vision 2030 tourism", "Growing middle class"],
    },
    academicResults: [
      {
        title: "Consumer Behavior in Saudi F&B",
        authors: "Al-Rashid et al.",
        year: "2025",
        source: "Google Scholar",
        url: "https://scholar.google.com/example",
        snippet: "Study on dining preferences in KSA",
      },
    ],
    totalSources: 12,
    searchQueries: ["sushi restaurants riyadh", "japanese food market saudi arabia"],
  }),
  quickResearch: vi.fn().mockResolvedValue({
    summary: "Quick research results for the query",
    results: [
      { title: "Result 1", url: "https://example.com/1", snippet: "First result snippet" },
      { title: "Result 2", url: "https://example.com/2", snippet: "Second result snippet" },
    ],
  }),
  formatResearchForContext: vi.fn().mockReturnValue("Formatted research context for AI"),
  searchGoogle: vi.fn().mockResolvedValue([
    { title: "Google Result", url: "https://example.com", snippet: "A search result" },
  ]),
  searchAcademic: vi.fn().mockResolvedValue([
    { title: "Academic Paper", authors: "Smith et al.", year: "2025", url: "https://scholar.google.com", snippet: "Abstract" },
  ]),
  scrapeWebsite: vi.fn().mockResolvedValue({
    title: "Example Website",
    content: "Scraped content from the website",
    url: "https://example.com",
  }),
}));

// Mock the LLM
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{ message: { content: "AI response with research context" } }],
  }),
}));

// Mock notification
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("Research Engine", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeEach(() => {
    vi.clearAllMocks();
    const ctx = createAuthContext();
    caller = appRouter.createCaller(ctx);
  });

  // ============ FULL RESEARCH ============
  describe("research.conductFull", () => {
    it("conducts full research for a company and saves report", async () => {
      const { conductResearch } = await import("./researchEngine");
      const { createResearchReport, setCachedResearch } = await import("./db");

      const result = await caller.research.conductFull({
        companyName: "Sushi Master",
        industry: "Restaurants",
        market: "ksa",
      });

      expect(conductResearch).toHaveBeenCalledWith({
        companyName: "Sushi Master",
        industry: "Restaurants",
        market: "ksa",
        website: undefined,
        additionalContext: undefined,
      });
      expect(createResearchReport).toHaveBeenCalled();
      expect(setCachedResearch).toHaveBeenCalled();
      expect(result.summary).toContain("Sushi Master");
      expect(result.keyInsights).toHaveLength(3);
      expect(result.recommendations).toHaveLength(3);
      expect(result.competitors).toHaveLength(1);
      expect(result.totalSources).toBe(12);
      expect(result.id).toBe(1);
    });

    it("returns cached results if available and fresh", async () => {
      const { getCachedResearch } = await import("./db");
      const mockCached = {
        id: 1,
        cacheKey: "full:sushi master:restaurants:ksa",
        queryType: "company" as const,
        industry: "Restaurants",
        market: "ksa",
        companyName: "Sushi Master",
        results: {
          summary: "Cached summary",
          keyInsights: ["Cached insight"],
          recommendations: ["Cached rec"],
          competitors: [],
          marketData: { overview: "", trends: [], challenges: [], opportunities: [] },
          academicResults: [],
          totalSources: 3,
          searchQueries: [],
        },
        sourcesCount: 3,
        createdAt: new Date(), // fresh cache
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };
      vi.mocked(getCachedResearch).mockResolvedValueOnce(mockCached);

      const result = await caller.research.conductFull({
        companyName: "Sushi Master",
        industry: "Restaurants",
        market: "ksa",
      });

      expect(result.cached).toBe(true);
      expect(result.summary).toBe("Cached summary");
    });

    it("includes optional fields when provided", async () => {
      const { conductResearch } = await import("./researchEngine");

      await caller.research.conductFull({
        companyName: "Sushi Master",
        industry: "Restaurants",
        market: "ksa",
        website: "https://sushimaster.sa",
        clientId: 1,
        additionalContext: "They want to expand to Jeddah",
      });

      expect(conductResearch).toHaveBeenCalledWith(
        expect.objectContaining({
          website: "https://sushimaster.sa",
          additionalContext: "They want to expand to Jeddah",
        })
      );
    });
  });

  // ============ QUICK RESEARCH ============
  describe("research.quick", () => {
    it("performs quick research and returns results", async () => {
      const { quickResearch } = await import("./researchEngine");

      const result = await caller.research.quick({
        query: "restaurant market riyadh 2026",
      });

      expect(quickResearch).toHaveBeenCalledWith("restaurant market riyadh 2026");
      expect(result.summary).toBeDefined();
      expect(result.results).toHaveLength(2);
    });
  });

  // ============ WEB SEARCH ============
  describe("research.searchWeb", () => {
    it("searches Google and returns results", async () => {
      const { searchGoogle } = await import("./researchEngine");

      const result = await caller.research.searchWeb({
        query: "best sushi restaurants riyadh",
        numResults: 10,
      });

      expect(searchGoogle).toHaveBeenCalledWith("best sushi restaurants riyadh", 10);
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe("Google Result");
    });
  });

  // ============ ACADEMIC SEARCH ============
  describe("research.searchAcademic", () => {
    it("searches academic papers and returns results", async () => {
      const { searchAcademic } = await import("./researchEngine");

      const result = await caller.research.searchAcademic({
        query: "consumer behavior saudi food industry",
        numResults: 5,
      });

      expect(searchAcademic).toHaveBeenCalledWith("consumer behavior saudi food industry", 5);
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe("Academic Paper");
    });
  });

  // ============ WEBSITE SCRAPING ============
  describe("research.scrapeWebsite", () => {
    it("scrapes a website and returns content", async () => {
      const { scrapeWebsite } = await import("./researchEngine");

      const result = await caller.research.scrapeWebsite({
        url: "https://example.com",
      });

      expect(scrapeWebsite).toHaveBeenCalledWith("https://example.com");
      expect(result.title).toBe("Example Website");
      expect(result.content).toContain("Scraped content");
    });
  });

  // ============ REPORT RETRIEVAL ============
  describe("research.getReport", () => {
    it("returns a research report by ID", async () => {
      const result = await caller.research.getReport({ id: 1 });
      expect(result).not.toBeNull();
      expect(result?.companyName).toBe("Sushi Master");
      expect(result?.status).toBe("completed");
    });
  });

  describe("research.getByClient", () => {
    it("returns research reports for a client", async () => {
      const result = await caller.research.getByClient({ clientId: 1 });
      expect(result).toHaveLength(1);
      expect(result[0].clientId).toBe(1);
    });
  });

  describe("research.list", () => {
    it("returns all research reports", async () => {
      const result = await caller.research.list();
      expect(result).toHaveLength(1);
      expect(result[0].companyName).toBe("Sushi Master");
    });
  });

  // ============ STATS ============
  describe("research.stats", () => {
    it("returns research statistics", async () => {
      const result = await caller.research.stats();
      expect(result.totalReports).toBe(3);
      expect(result.totalSources).toBe(42);
      expect(result.industries).toHaveLength(3);
      expect(result.industries).toContain("Restaurants");
    });
  });

  // ============ CACHED BY INDUSTRY ============
  describe("research.getCachedByIndustry", () => {
    it("returns cached research for an industry/market", async () => {
      const result = await caller.research.getCachedByIndustry({
        industry: "Restaurants",
        market: "ksa",
      });
      expect(result).toEqual([]);
    });
  });

  // ============ AI WITH RESEARCH CONTEXT ============
  describe("aiResearch.chatWithResearch", () => {
    it("sends chat with research context to LLM", async () => {
      const { invokeLLM } = await import("./_core/llm");

      const result = await caller.aiResearch.chatWithResearch({
        messages: [
          { role: "user", content: "What are the main challenges for sushi restaurants in Riyadh?" },
        ],
        serviceContext: "business_health_check",
        researchReportId: 1,
      });

      expect(invokeLLM).toHaveBeenCalled();
      expect(result.content).toBeDefined();
      expect(typeof result.content).toBe("string");
    });

    it("works without research report", async () => {
      const { invokeLLM } = await import("./_core/llm");

      const result = await caller.aiResearch.chatWithResearch({
        messages: [
          { role: "user", content: "Tell me about branding" },
        ],
      });

      expect(invokeLLM).toHaveBeenCalled();
      expect(result.content).toBeDefined();
    });

    it("includes client context when clientId is provided", async () => {
      const { invokeLLM } = await import("./_core/llm");

      await caller.aiResearch.chatWithResearch({
        messages: [
          { role: "user", content: "Analyze this client" },
        ],
        clientId: 1,
      });

      expect(invokeLLM).toHaveBeenCalled();
      // The LLM should be called with system message containing client context
      const callArgs = vi.mocked(invokeLLM).mock.calls[0][0];
      const systemMsg = callArgs.messages.find((m: any) => m.role === "system");
      expect(systemMsg).toBeDefined();
    });
  });
});
