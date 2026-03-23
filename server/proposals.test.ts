import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the database functions
vi.mock("./db", () => ({
  createProposal: vi.fn().mockResolvedValue({ id: 1 }),
  getProposals: vi.fn().mockResolvedValue([
    {
      id: 1,
      clientId: 1,
      serviceType: "business_health_check",
      title: "Test Proposal",
      language: "en",
      status: "draft",
      executiveSummary: "Test summary",
      clientBackground: "Test background",
      serviceDescription: "Test description",
      methodology: "Test methodology",
      deliverables: "Test deliverables",
      timeline: "Test timeline",
      investment: "Test investment",
      whyPrimoMarca: "Test why",
      terms: "Test terms",
      customNotes: null,
      price: "140000.00",
      currency: "EGP",
      pdfUrl: null,
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date("2026-01-01"),
    },
  ]),
  getProposalById: vi.fn().mockResolvedValue({
    id: 1,
    clientId: 1,
    serviceType: "business_health_check",
    title: "Test Proposal",
    language: "en",
    status: "draft",
    executiveSummary: "Test summary",
    clientBackground: "Test background",
    serviceDescription: "Test description",
    methodology: "Test methodology",
    deliverables: "Test deliverables",
    timeline: "Test timeline",
    investment: "Test investment",
    whyPrimoMarca: "Test why",
    terms: "Test terms",
    customNotes: null,
    price: "140000.00",
    currency: "EGP",
    pdfUrl: null,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
  }),
  getProposalsByClient: vi.fn().mockResolvedValue([]),
  updateProposal: vi.fn().mockResolvedValue(undefined),
  deleteProposal: vi.fn().mockResolvedValue(undefined),
  getClientById: vi.fn().mockResolvedValue({
    id: 1,
    name: "Test Client",
    companyName: "Test Company",
    email: "test@example.com",
    phone: "+201234567890",
    market: "egypt",
    industry: "Technology",
    website: "https://example.com",
    notes: "Test notes",
    status: "active",
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
  }),
  getNotesByClient: vi.fn().mockResolvedValue([]),
  // Other db functions that may be needed
  getClients: vi.fn().mockResolvedValue([]),
  createClient: vi.fn().mockResolvedValue({ id: 1 }),
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
}));

// Mock the LLM router (proposals uses resilientLLM)
vi.mock("./_core/llmRouter", () => ({
  resilientLLM: vi.fn().mockResolvedValue({
    choices: [
      {
        message: {
          content: JSON.stringify({
            executiveSummary: "Generated executive summary",
            clientBackground: "Generated client background",
            serviceDescription: "Generated service description",
            methodology: "Generated methodology",
            deliverables: "Generated deliverables",
            timeline: "Generated timeline",
            investment: "Generated investment",
            whyPrimoMarca: "Generated why Primo Marca",
            terms: "Generated terms",
          }),
        },
      },
    ],
  }),
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

describe("proposals", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeEach(() => {
    vi.clearAllMocks();
    const ctx = createAuthContext();
    caller = appRouter.createCaller(ctx);
  });

  describe("proposals.list", () => {
    it("returns list of proposals", async () => {
      const result = await caller.proposals.list();
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe("Test Proposal");
      expect(result[0].serviceType).toBe("business_health_check");
      expect(result[0].status).toBe("draft");
    });
  });

  describe("proposals.getById", () => {
    it("returns a single proposal by ID", async () => {
      const result = await caller.proposals.getById({ id: 1 });
      expect(result).not.toBeNull();
      expect(result?.title).toBe("Test Proposal");
      expect(result?.price).toBe("140000.00");
    });
  });

  describe("proposals.getByClient", () => {
    it("returns proposals for a specific client", async () => {
      const result = await caller.proposals.getByClient({ clientId: 1 });
      expect(result).toEqual([]);
    });
  });

  describe("proposals.create", () => {
    it("creates a proposal from input", async () => {
      const { createProposal } = await import("./db");

      const result = await caller.proposals.create({
        clientId: 1,
        serviceType: "business_health_check",
        title: "Test Proposal for Client",
        language: "en",
        currency: "EGP",
      });

      expect(result).toHaveProperty("id");
      expect(result.id).toBe(1);
      expect(createProposal).toHaveBeenCalledOnce();
      const createCall = vi.mocked(createProposal).mock.calls[0][0];
      expect(createCall.clientId).toBe(1);
      expect(createCall.serviceType).toBe("business_health_check");
      expect(createCall.title).toBe("Test Proposal for Client");
      expect(createCall.language).toBe("en");
    });

    it("creates a proposal with optional fields", async () => {
      const { createProposal } = await import("./db");

      await caller.proposals.create({
        clientId: 1,
        serviceType: "brand_identity",
        title: "عرض هوية العلامة التجارية",
        language: "ar",
        currency: "EGP",
        executiveSummary: "Custom summary",
      });

      expect(createProposal).toHaveBeenCalledOnce();
      const createCall = vi.mocked(createProposal).mock.calls[0][0];
      expect(createCall.executiveSummary).toBe("Custom summary");
    });

    it("includes custom notes when provided", async () => {
      const { createProposal } = await import("./db");

      await caller.proposals.create({
        clientId: 1,
        serviceType: "consultation",
        title: "Consultation Proposal",
        language: "en",
        currency: "EGP",
        customNotes: "Client is interested in expanding to KSA market",
      });

      const createCall = vi.mocked(createProposal).mock.calls[0][0];
      expect(createCall.customNotes).toBe("Client is interested in expanding to KSA market");
    });
  });

  describe("proposals.update", () => {
    it("updates proposal status", async () => {
      const { updateProposal } = await import("./db");

      const result = await caller.proposals.update({
        id: 1,
        status: "sent",
      });

      expect(result.success).toBe(true);
      expect(updateProposal).toHaveBeenCalledWith(1, { status: "sent" });
    });

    it("updates proposal section content", async () => {
      const { updateProposal } = await import("./db");

      const result = await caller.proposals.update({
        id: 1,
        executiveSummary: "Updated executive summary content",
      });

      expect(result.success).toBe(true);
      expect(updateProposal).toHaveBeenCalledWith(1, {
        executiveSummary: "Updated executive summary content",
      });
    });
  });

  describe("proposals.delete", () => {
    it("deletes a proposal", async () => {
      const { deleteProposal } = await import("./db");

      const result = await caller.proposals.delete({ id: 1 });

      expect(result.success).toBe(true);
      expect(deleteProposal).toHaveBeenCalledWith(1);
    });
  });

  describe("proposals.createFromDiscovery", () => {
    it("creates a proposal from conversation messages", async () => {
      const { createProposal } = await import("./db");
      const { resilientLLM } = await import("./_core/llmRouter");

      vi.mocked(resilientLLM).mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: "Discovery-based executive summary and proposal content",
            },
          },
        ],
      } as any);

      const result = await caller.proposals.createFromDiscovery({
        conversationMessages: [
          { role: "user", content: "I have a real estate company in Riyadh" },
          { role: "assistant", content: "Tell me more about your brand challenges" },
          { role: "user", content: "We struggle with brand perception" },
          { role: "assistant", content: "I recommend a Business Health Check" },
        ],
        language: "en",
      });

      expect(result.id).toBe(1);
      expect(resilientLLM).toHaveBeenCalled();
      expect(createProposal).toHaveBeenCalledOnce();
      const createCall = vi.mocked(createProposal).mock.calls[0][0];
      expect(createCall.status).toBe("draft");
    });

    it("uses provided clientId and serviceType when available", async () => {
      const { createProposal } = await import("./db");
      const { resilientLLM } = await import("./_core/llmRouter");

      vi.mocked(resilientLLM).mockResolvedValueOnce({
        choices: [{ message: { content: "Summary content" } }],
      } as any);

      await caller.proposals.createFromDiscovery({
        conversationMessages: [
          { role: "user", content: "I need brand identity help" },
          { role: "assistant", content: "Let me understand your needs" },
        ],
        clientId: 1,
        serviceType: "brand_identity",
        language: "ar",
      });

      const createCall = vi.mocked(createProposal).mock.calls[0][0];
      expect(createCall.clientId).toBe(1);
      expect(createCall.serviceType).toBe("brand_identity");
      expect(createCall.language).toBe("ar");
    });
  });

  describe("proposals.regenerateSection", () => {
    it("regenerates a specific section with AI", async () => {
      const { resilientLLM } = await import("./_core/llmRouter");
      const { updateProposal, getProposalById, getClientById } = await import("./db");

      vi.mocked(getProposalById).mockResolvedValueOnce({
        id: 1, clientId: 1, serviceType: "business_health_check", title: "Test",
        language: "en", status: "draft", executiveSummary: "Old summary",
        clientBackground: "", serviceDescription: "", methodology: "",
        deliverables: "", timeline: "", investment: "", whyPrimoMarca: "",
        terms: "", customNotes: null, price: "140000.00", currency: "EGP",
        pdfUrl: null, createdAt: new Date(), updatedAt: new Date(),
      } as any);
      vi.mocked(getClientById).mockResolvedValueOnce({
        id: 1, name: "Test Client", companyName: "Test Company",
        email: "test@example.com", phone: "+201234567890", market: "egypt",
        industry: "Technology", website: "https://example.com", notes: "Test notes",
        status: "active", createdAt: new Date(), updatedAt: new Date(),
      } as any);

      vi.mocked(resilientLLM).mockResolvedValueOnce({
        choices: [{ message: { content: "Regenerated executive summary with improved content" } }],
      } as any);

      const result = await caller.proposals.regenerateSection({
        proposalId: 1,
        section: "executiveSummary",
      });

      expect(result.executiveSummary).toBe("Regenerated executive summary with improved content");
      expect(resilientLLM).toHaveBeenCalled();
      expect(updateProposal).toHaveBeenCalledWith(1, {
        executiveSummary: "Regenerated executive summary with improved content",
      });
    });
  });
});
