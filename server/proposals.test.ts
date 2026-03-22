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

// Mock the LLM
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
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
    it("creates a proposal with AI-generated content", async () => {
      const { createProposal } = await import("./db");
      const { invokeLLM } = await import("./_core/llm");

      const result = await caller.proposals.create({
        clientId: 1,
        serviceType: "business_health_check",
        title: "Test Proposal for Client",
        language: "en",
      });

      expect(result.id).toBe(1);
      expect(invokeLLM).toHaveBeenCalledOnce();
      expect(createProposal).toHaveBeenCalledOnce();

      // Verify the proposal data passed to createProposal
      const createCall = vi.mocked(createProposal).mock.calls[0][0];
      expect(createCall.clientId).toBe(1);
      expect(createCall.serviceType).toBe("business_health_check");
      expect(createCall.title).toBe("Test Proposal for Client");
      expect(createCall.language).toBe("en");
      expect(createCall.status).toBe("draft");
      expect(createCall.executiveSummary).toBe("Generated executive summary");
      expect(createCall.methodology).toBe("Generated methodology");
    });

    it("creates an Arabic proposal", async () => {
      const { invokeLLM } = await import("./_core/llm");

      await caller.proposals.create({
        clientId: 1,
        serviceType: "brand_identity",
        title: "عرض هوية العلامة التجارية",
        language: "ar",
      });

      expect(invokeLLM).toHaveBeenCalledOnce();
      const llmCall = vi.mocked(invokeLLM).mock.calls[0][0];
      const userMessage = llmCall.messages[1].content as string;
      expect(userMessage).toContain("Arabic");
    });

    it("includes custom notes in the AI prompt", async () => {
      const { invokeLLM } = await import("./_core/llm");

      await caller.proposals.create({
        clientId: 1,
        serviceType: "consultation",
        title: "Consultation Proposal",
        language: "en",
        customNotes: "Client is interested in expanding to KSA market",
      });

      const llmCall = vi.mocked(invokeLLM).mock.calls[0][0];
      // Custom notes are included in the system prompt via buildSystemPrompt clientContext
      const systemMessage = llmCall.messages[0].content as string;
      expect(systemMessage).toContain("expanding to KSA market");
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
      const { invokeLLM } = await import("./_core/llm");

      // First call: extract info from conversation
      vi.mocked(invokeLLM).mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: JSON.stringify({
                clientName: "Rashid Group",
                companyName: "Rashid Group Holdings",
                industry: "Real Estate",
                market: "KSA",
                challenges: "Brand perception issues",
                recommendedService: "business_health_check",
                suggestedTitle: "Brand Health Diagnostic for Rashid Group",
              }),
            },
          },
        ],
      } as any);

      // Second call: generate proposal content
      vi.mocked(invokeLLM).mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: JSON.stringify({
                executiveSummary: "Discovery-based executive summary",
                clientBackground: "Discovery-based client background",
                serviceDescription: "Discovery-based service description",
                methodology: "Discovery-based methodology",
                deliverables: "Discovery-based deliverables",
                timeline: "Discovery-based timeline",
                investment: "Discovery-based investment",
                whyPrimoMarca: "Discovery-based why Primo Marca",
                terms: "Discovery-based terms",
              }),
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
      expect(invokeLLM).toHaveBeenCalledTimes(2);
      expect(createProposal).toHaveBeenCalledOnce();

      const createCall = vi.mocked(createProposal).mock.calls[0][0];
      expect(createCall.status).toBe("draft");
      expect(createCall.executiveSummary).toBe("Discovery-based executive summary");
    });

    it("uses provided clientId and serviceType when available", async () => {
      const { createProposal } = await import("./db");
      const { invokeLLM } = await import("./_core/llm");

      // Only one LLM call needed when serviceType is provided (no classify call)
      vi.mocked(invokeLLM).mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: JSON.stringify({
                executiveSummary: "Summary",
                clientBackground: "Background",
                serviceDescription: "Description",
                methodology: "Methodology",
                deliverables: "Deliverables",
                timeline: "Timeline",
                investment: "Investment",
                whyPrimoMarca: "Why PM",
                terms: "Terms",
              }),
            },
          },
        ],
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

    it("requires at least 2 conversation messages", async () => {
      await expect(
        caller.proposals.createFromDiscovery({
          conversationMessages: [
            { role: "user", content: "Hello" },
          ],
          language: "en",
        })
      ).rejects.toThrow();
    });
  });

  describe("proposals.regenerateSection", () => {
    it("regenerates a specific section with AI", async () => {
      const { invokeLLM } = await import("./_core/llm");
      const { updateProposal, getProposalById, getClientById } = await import("./db");

      // Re-setup mocks for this test
      vi.mocked(getProposalById).mockResolvedValueOnce({
        id: 1, clientId: 1, serviceType: "business_health_check", title: "Test",
        language: "en", status: "draft", executiveSummary: "Old summary",
        clientBackground: "", serviceDescription: "", methodology: "",
        deliverables: "", timeline: "", investment: "", whyPrimoMarca: "",
        terms: "", customNotes: null, price: "140000.00", currency: "EGP",
        pdfUrl: null, createdAt: new Date(), updatedAt: new Date(),
      });
      vi.mocked(getClientById).mockResolvedValueOnce({
        id: 1, name: "Test Client", companyName: "Test Company",
        email: "test@example.com", phone: "+201234567890", market: "egypt",
        industry: "Technology", website: "https://example.com", notes: "Test notes",
        status: "active", createdAt: new Date(), updatedAt: new Date(),
      });

      // Mock invokeLLM for regeneration (returns plain text, not JSON)
      vi.mocked(invokeLLM).mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: "Regenerated executive summary with improved content",
            },
          },
        ],
      } as any);

      const result = await caller.proposals.regenerateSection({
        proposalId: 1,
        section: "executiveSummary",
      });

      expect(result.content).toBe("Regenerated executive summary with improved content");
      expect(invokeLLM).toHaveBeenCalled();
      expect(updateProposal).toHaveBeenCalledWith(1, {
        executiveSummary: "Regenerated executive summary with improved content",
      });
    });

    it("passes additional instructions to AI when provided", async () => {
      const { invokeLLM, } = await import("./_core/llm");
      const { getProposalById, getClientById } = await import("./db");

      // Re-setup mocks for this test
      vi.mocked(getProposalById).mockResolvedValueOnce({
        id: 1, clientId: 1, serviceType: "business_health_check", title: "Test",
        language: "en", status: "draft", executiveSummary: "Old summary",
        clientBackground: "", serviceDescription: "", methodology: "",
        deliverables: "", timeline: "", investment: "", whyPrimoMarca: "",
        terms: "", customNotes: null, price: "140000.00", currency: "EGP",
        pdfUrl: null, createdAt: new Date(), updatedAt: new Date(),
      });
      vi.mocked(getClientById).mockResolvedValueOnce({
        id: 1, name: "Test Client", companyName: "Test Company",
        email: "test@example.com", phone: "+201234567890", market: "egypt",
        industry: "Technology", website: "https://example.com", notes: "Test notes",
        status: "active", createdAt: new Date(), updatedAt: new Date(),
      });

      vi.mocked(invokeLLM).mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: "Regenerated content",
            },
          },
        ],
      } as any);

      await caller.proposals.regenerateSection({
        proposalId: 1,
        section: "methodology",
        additionalInstructions: "Make it more detailed and include case studies",
      });

      const llmCall = vi.mocked(invokeLLM).mock.calls[0][0];
      const userMessage = llmCall.messages[1].content as string;
      expect(userMessage).toContain("Make it more detailed and include case studies");
    });
  });
});
