import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the database functions
vi.mock("./db", () => ({
  // Onboarding helpers
  createOnboardingSession: vi.fn().mockResolvedValue({ id: 1 }),
  getOnboardingSessionById: vi.fn().mockResolvedValue({
    id: 1,
    step: "company_info",
    status: "in_progress",
    companyName: "Test Company",
    contactName: "John Doe",
    email: "john@test.com",
    phone: "+966512345678",
    market: "ksa",
    industry: "Technology",
    website: "https://test.com",
    assessmentAnswers: [
      { question: "What is your product?", answer: "SaaS platform" },
      { question: "Who is your target?", answer: "SMEs in KSA" },
    ],
    recommendedService: "business_health_check",
    recommendationReason: "Based on your answers, a health check is recommended.",
    clientId: 1,
    proposalId: null,
    projectId: null,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
  }),
  getOnboardingSessions: vi.fn().mockResolvedValue([
    {
      id: 1,
      step: "company_info",
      status: "in_progress",
      companyName: "Test Company",
      contactName: "John Doe",
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date("2026-01-01"),
    },
  ]),
  updateOnboardingSession: vi.fn().mockResolvedValue(undefined),

  // Portal helpers
  createPortalToken: vi.fn().mockResolvedValue({ id: 1 }),
  getPortalTokenByToken: vi.fn().mockResolvedValue({
    id: 1,
    projectId: 1,
    clientId: 1,
    token: "test-token-abc123",
    isActive: 1,
    expiresAt: new Date("2027-01-01"),
    lastAccessedAt: null,
    createdAt: new Date("2026-01-01"),
  }),
  getPortalTokensByProject: vi.fn().mockResolvedValue([
    {
      id: 1,
      projectId: 1,
      clientId: 1,
      token: "test-token-abc123",
      isActive: 1,
      expiresAt: new Date("2027-01-01"),
      lastAccessedAt: null,
      createdAt: new Date("2026-01-01"),
    },
  ]),
  updatePortalToken: vi.fn().mockResolvedValue(undefined),

  // Client/Project helpers needed by routers
  createClient: vi.fn().mockResolvedValue({ id: 1 }),
  getClients: vi.fn().mockResolvedValue([]),
  getClientById: vi.fn().mockResolvedValue({
    id: 1,
    name: "John Doe",
    companyName: "Test Company",
    email: "john@test.com",
    phone: "+966512345678",
    market: "ksa",
    industry: "Technology",
    website: "https://test.com",
    notes: null,
    status: "active",
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
  }),
  updateClient: vi.fn().mockResolvedValue(undefined),
  deleteClient: vi.fn().mockResolvedValue(undefined),
  createProject: vi.fn().mockResolvedValue({ id: 1 }),
  getProjects: vi.fn().mockResolvedValue([]),
  getProjectsByClient: vi.fn().mockResolvedValue([]),
  getProjectById: vi.fn().mockResolvedValue({
    id: 1,
    clientId: 1,
    name: "Test Company — Business Health Check",
    serviceType: "business_health_check",
    stage: "diagnose",
    status: "active",
    price: "140000",
    currency: "SAR",
    description: null,
    startDate: null,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
  }),
  updateProject: vi.fn().mockResolvedValue(undefined),
  deleteProject: vi.fn().mockResolvedValue(undefined),
  createDeliverable: vi.fn().mockResolvedValue({ id: 1 }),
  getDeliverablesByProject: vi.fn().mockResolvedValue([
    {
      id: 1,
      projectId: 1,
      title: "Client Discovery Session",
      description: "Deep conversation to understand the business",
      stage: "diagnose",
      status: "pending",
      content: null,
      sortOrder: 0,
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date("2026-01-01"),
    },
    {
      id: 2,
      projectId: 1,
      title: "Business Model Analysis",
      description: "Evaluate the current business model",
      stage: "diagnose",
      status: "delivered",
      content: "Detailed analysis content here...",
      sortOrder: 1,
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date("2026-01-01"),
    },
  ]),
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
    totalClients: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalRevenue: 0,
    pendingRevenue: 0,
    overdueRevenue: 0,
  }),
  getAnalyticsData: vi.fn().mockResolvedValue({
    conversionRate: 0,
    serviceBreakdown: [],
    revenueByMonth: [],
    clientsByMarket: [],
  }),
  createProposal: vi.fn().mockResolvedValue({ id: 1 }),
  getProposals: vi.fn().mockResolvedValue([]),
  getProposalById: vi.fn().mockResolvedValue({
    id: 1,
    clientId: 1,
    serviceType: "business_health_check",
    title: "Test Proposal",
    language: "en",
    status: "draft",
    executiveSummary: "Summary",
    clientBackground: "Background",
    serviceDescription: "Description",
    methodology: "Methodology",
    deliverables: "Deliverables",
    timeline: "Timeline",
    investment: "Investment",
    whyPrimoMarca: "Why",
    terms: "Terms",
    customNotes: null,
    price: "140000",
    currency: "SAR",
    pdfUrl: null,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
  }),
  getProposalsByClient: vi.fn().mockResolvedValue([]),
  updateProposal: vi.fn().mockResolvedValue(undefined),
  deleteProposal: vi.fn().mockResolvedValue(undefined),
}));

// Mock the LLM router (onboarding uses resilientLLM)
vi.mock("./_core/llmRouter", () => ({
  resilientLLM: vi.fn().mockResolvedValue({
    choices: [
      {
        message: {
          content: JSON.stringify({
            service: "business_health_check",
            reason: "Based on the assessment, a business health check is recommended.",
          }),
        },
      },
    ],
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

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("Onboarding Wizard", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeEach(() => {
    vi.clearAllMocks();
    const ctx = createAuthContext();
    caller = appRouter.createCaller(ctx);
  });

  describe("onboarding.create", () => {
    it("creates a new onboarding session", async () => {
      const { createOnboardingSession } = await import("./db");
      const result = await caller.onboarding.create({});
      expect(result).toHaveProperty("id");
      expect(result.id).toBe(1);
      expect(createOnboardingSession).toHaveBeenCalledWith(expect.any(Object));
    });
  });

  describe("onboarding.getById", () => {
    it("returns an onboarding session by ID", async () => {
      const result = await caller.onboarding.getById({ id: 1 });
      expect(result).not.toBeNull();
      expect(result?.companyName).toBe("Test Company");
      expect(result?.contactName).toBe("John Doe");
      expect(result?.market).toBe("ksa");
    });
  });

  describe("onboarding.list", () => {
    it("returns all onboarding sessions", async () => {
      const result = await caller.onboarding.list();
      expect(result).toHaveLength(1);
      expect(result[0].companyName).toBe("Test Company");
    });
  });

  describe("onboarding.updateCompanyInfo", () => {
    it("updates company info with provided fields", async () => {
      const { updateOnboardingSession } = await import("./db");
      const result = await caller.onboarding.updateCompanyInfo({
        id: 1,
        companyName: "Updated Company",
        contactName: "Jane Doe",
        email: "jane@test.com",
        phone: "+966599999999",
        market: "ksa",
        industry: "Healthcare",
        website: "https://updated.com",
      });
      expect(result.success).toBe(true);
      expect(updateOnboardingSession).toHaveBeenCalledWith(1, expect.objectContaining({
        companyName: "Updated Company",
        contactName: "Jane Doe",
      }));
    });
  });

  describe("onboarding.assessNeeds", () => {
    it("analyzes answers with AI and recommends a service", async () => {
      const { resilientLLM } = await import("./_core/llmRouter");
      vi.mocked(resilientLLM).mockResolvedValueOnce({
        choices: [{ message: { content: '{"service":"business_health_check","reason":"Based on your needs, a health check is recommended."}' } }],
      } as any);
      const { updateOnboardingSession } = await import("./db");

      const result = await caller.onboarding.assessNeeds({
        id: 1,
        answers: [
          { question: "What is your product?", answer: "SaaS platform for HR" },
          { question: "Who is your target?", answer: "SMEs in Saudi Arabia" },
        ],
      });

      expect(result.service).toBe("business_health_check");
      expect(result.reason).toBeDefined();
      expect(updateOnboardingSession).toHaveBeenCalledWith(1, expect.objectContaining({
        recommendedService: "business_health_check",
        step: "service_recommendation",
      }));
    });
  });

  describe("onboarding.confirmService", () => {
    it("creates a client and advances to proposal_review", async () => {
      const { createClient, updateOnboardingSession } = await import("./db");

      const result = await caller.onboarding.confirmService({
        id: 1,
        serviceType: "business_health_check",
      });

      expect(result.clientId).toBe(1);
      expect(createClient).toHaveBeenCalledWith(expect.objectContaining({
        name: "John Doe",
        companyName: "Test Company",
        market: "ksa",
      }));
      expect(updateOnboardingSession).toHaveBeenCalledWith(1, expect.objectContaining({
        clientId: 1,
        step: "proposal_review",
      }));
    });
  });

  describe("onboarding.complete", () => {
    it("creates a project and completes onboarding", async () => {
      const { createProject, updateOnboardingSession } = await import("./db");

      const result = await caller.onboarding.complete({ id: 1 });

      expect(result.projectId).toBeDefined();
      expect(result.clientId).toBe(1);
      expect(createProject).toHaveBeenCalledWith(expect.objectContaining({
        clientId: 1,
        serviceType: "business_health_check",
        name: "Test Company",
      }));
      expect(updateOnboardingSession).toHaveBeenCalledWith(1, expect.objectContaining({
        status: "completed",
      }));
    });
  });
});

describe("Client Portal", () => {
  let authCaller: ReturnType<typeof appRouter.createCaller>;
  let publicCaller: ReturnType<typeof appRouter.createCaller>;

  beforeEach(() => {
    vi.clearAllMocks();
    authCaller = appRouter.createCaller(createAuthContext());
    publicCaller = appRouter.createCaller(createPublicContext());
  });

  describe("portal.generateLink", () => {
    it("creates a portal access link", async () => {
      const { createPortalToken } = await import("./db");

      const result = await authCaller.portal.generateLink({
        projectId: 1,
        clientId: 1,
      });

      expect(result.token).toBeDefined();
      expect(result.token.length).toBeGreaterThan(0);
      expect(result.id).toBeDefined();
      expect(createPortalToken).toHaveBeenCalledWith(expect.objectContaining({
        projectId: 1,
        clientId: 1,
        token: expect.any(String),
        isActive: 1,
      }));
    });
  });

  describe("portal.getLinks", () => {
    it("returns portal links for a project", async () => {
      const result = await authCaller.portal.getLinks({ projectId: 1 });
      expect(Array.isArray(result)).toBe(true);
      if (result.length > 0) {
        expect(result[0]).toHaveProperty("token");
        expect(result[0]).toHaveProperty("isActive");
      }
    });
  });

  describe("portal.deactivateLink", () => {
    it("deactivates a portal link", async () => {
      const { updatePortalToken } = await import("./db");

      const result = await authCaller.portal.deactivateLink({ id: 1 });
      expect(result.success).toBe(true);
      expect(updatePortalToken).toHaveBeenCalledWith(1, { isActive: 0 });
    });
  });

  describe("portal.viewProject", () => {
    it("returns project data for a valid token (public access)", async () => {
      const result = await publicCaller.portal.viewProject({ token: "test-token-abc123" });

      expect(result.project).toBeDefined();
      expect(result.project.name).toBe("Test Company — Business Health Check");
      expect(result.project.stage).toBe("diagnose");
      expect(result.client).toBeDefined();
      expect(result.client?.companyName).toBe("Test Company");
      expect(result.deliverables).toHaveLength(2);
    });

    it("returns content only for delivered/approved deliverables", async () => {
      const result = await publicCaller.portal.viewProject({ token: "test-token-abc123" });

      // First deliverable is pending - no content
      expect(result.deliverables[0].content).toBeNull();
      // Second deliverable is delivered - has content
      expect(result.deliverables[1].content).toBe("Detailed analysis content here...");
    });

    it("throws for invalid token", async () => {
      const { getPortalTokenByToken } = await import("./db");
      vi.mocked(getPortalTokenByToken).mockResolvedValueOnce(null);

      await expect(
        publicCaller.portal.viewProject({ token: "invalid-token" })
      ).rejects.toThrow("Invalid or expired portal link");
    });

    it("throws for expired token", async () => {
      const { getPortalTokenByToken } = await import("./db");
      vi.mocked(getPortalTokenByToken).mockResolvedValueOnce({
        id: 1,
        projectId: 1,
        clientId: 1,
        token: "expired-token",
        isActive: 1,
        expiresAt: new Date("2020-01-01"), // expired
        lastAccessedAt: null,
        createdAt: new Date("2019-01-01"),
      });

      await expect(
        publicCaller.portal.viewProject({ token: "expired-token" })
      ).rejects.toThrow("Portal link has expired");
    });
  });

  describe("proposals.sendProposal", () => {
    it("sends a proposal notification and updates status", async () => {
      const { updateProposal } = await import("./db");
      const { notifyOwner } = await import("./_core/notification");

      const result = await authCaller.proposals.sendProposal({
        proposalId: 1,
        recipientEmail: "client@example.com",
        message: "Please review the attached proposal.",
      });

      expect(result).toBeDefined();
      expect(notifyOwner).toHaveBeenCalled();
      expect(updateProposal).toHaveBeenCalledWith(1, { status: "sent" });
    });
  });
});
