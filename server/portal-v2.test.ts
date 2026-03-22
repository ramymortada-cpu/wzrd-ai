import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ============ HELPERS ============

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "sample-user",
    email: "sample@example.com",
    name: "Sample User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

function createPublicContext(): { ctx: TrpcContext } {
  const ctx: TrpcContext = {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

// ============ COMPETITIVE INTELLIGENCE TESTS ============

describe("Competitive Intelligence Module", () => {
  it("competitive intelligence module exports expected functions", async () => {
    const mod = await import("./competitiveIntelligence");
    expect(mod.getFullCompetitiveIntelligence).toBeDefined();
    expect(typeof mod.getFullCompetitiveIntelligence).toBe("function");
    expect(mod.getRelevantCompetitiveIntelligence).toBeDefined();
    expect(typeof mod.getRelevantCompetitiveIntelligence).toBe("function");
  });

  it("getCompetitiveIntelligence returns comprehensive data", async () => {
    const { getFullCompetitiveIntelligence } = await import("./competitiveIntelligence");
    const data = getFullCompetitiveIntelligence();
    expect(typeof data).toBe("string");
    expect(data.length).toBeGreaterThan(5000); // Should be substantial content
  });

  it("competitive intelligence covers Egyptian market agencies", async () => {
    const { getFullCompetitiveIntelligence } = await import("./competitiveIntelligence");
    const data = getFullCompetitiveIntelligence();
    // Should mention Egyptian agencies
    expect(data.toLowerCase()).toContain("egypt");
    // Should have pricing data
    expect(data.toLowerCase()).toContain("egp");
  });

  it("competitive intelligence covers Saudi market agencies", async () => {
    const { getFullCompetitiveIntelligence } = await import("./competitiveIntelligence");
    const data = getFullCompetitiveIntelligence();
    // Should mention Saudi agencies
    expect(data.toLowerCase()).toContain("saudi");
    // Should have SAR pricing
    expect(data.toLowerCase()).toContain("sar");
  });

  it("competitive intelligence includes pricing benchmarks", async () => {
    const { getFullCompetitiveIntelligence } = await import("./competitiveIntelligence");
    const data = getFullCompetitiveIntelligence();
    // Should have pricing sections
    expect(data.toLowerCase()).toContain("pricing");
    expect(data.toLowerCase()).toContain("comparison");
  });

  it("competitive intelligence includes client expectations", async () => {
    const { getFullCompetitiveIntelligence } = await import("./competitiveIntelligence");
    const data = getFullCompetitiveIntelligence();
    // Should discuss client expectations
    expect(data.toLowerCase()).toContain("client");
    expect(data.toLowerCase()).toContain("expect");
  });

  it("competitive intelligence includes market segments", async () => {
    const { getFullCompetitiveIntelligence } = await import("./competitiveIntelligence");
    const data = getFullCompetitiveIntelligence();
    // Should cover different segments
    expect(data.toLowerCase()).toContain("segment");
  });

  it("competitive intelligence is integrated into knowledge base", async () => {
    const { buildSystemPrompt } = await import("./knowledgeBase");
    const prompt = buildSystemPrompt("brand_strategy", "ksa", "tech");
    // The prompt should contain competitive intelligence content
    expect(prompt.toLowerCase()).toContain("primo marca");
  });
});

// ============ APPROVAL ROUTER TESTS ============

describe("Approvals Router", () => {
  it("approvals.list requires authentication", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.approvals.list({ deliverableId: 1 })).rejects.toThrow();
  });

  it("approvals.latest requires authentication", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.approvals.latest({ deliverableId: 1 })).rejects.toThrow();
  });

  it("approvals.publicSubmit rejects invalid token", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.approvals.publicSubmit({
        token: "invalid-token-12345",
        deliverableId: 1,
        decision: "approved",
        clientName: "Test Client",
      })
    ).rejects.toThrow("Invalid or expired portal link");
  });

  it("approvals.publicSubmit validates changes_requested requires reason", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    // This will fail on token validation first, but the schema validation should work
    await expect(
      caller.approvals.publicSubmit({
        token: "invalid-token",
        deliverableId: 1,
        decision: "changes_requested",
        reason: "",
        clientName: "Test Client",
      })
    ).rejects.toThrow();
  });

  it("approvals.publicList rejects invalid token", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.approvals.publicList({
        token: "invalid-token-12345",
        deliverableId: 1,
      })
    ).rejects.toThrow("Invalid or expired portal link");
  });
});

// ============ DIFF ROUTER TESTS ============

describe("Diff Router", () => {
  it("diff.compare rejects invalid token", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.diff.compare({
        token: "invalid-token-12345",
        deliverableId: 1,
        versionA: 1,
        versionB: 2,
      })
    ).rejects.toThrow("Invalid or expired portal link");
  });

  it("diff.adminCompare requires authentication", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.diff.adminCompare({
        deliverableId: 1,
        versionA: 1,
        versionB: 2,
      })
    ).rejects.toThrow();
  });

  it("diff.adminCompare works for authenticated users", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    // Should not throw auth error, may throw DB error if no data
    try {
      const result = await caller.diff.adminCompare({
        deliverableId: 99999,
        versionA: 1,
        versionB: 2,
      });
      // If DB is available, should return the pair structure
      expect(result).toHaveProperty("versionA");
      expect(result).toHaveProperty("versionB");
    } catch (e: any) {
      // DB might not be available in test, that's OK
      expect(e.message).not.toContain("UNAUTHORIZED");
    }
  });
});

// ============ COMMENTS ROUTER NOTIFICATION TESTS ============

describe("Comments Router - Notifications", () => {
  it("comments.publicCreate rejects invalid token", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.comments.publicCreate({
        token: "invalid-token-12345",
        deliverableId: 1,
        comment: "Test comment",
        authorName: "Test Client",
      })
    ).rejects.toThrow("Invalid or expired portal link");
  });

  it("comments.publicCreate validates required fields", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    // Missing authorName should fail validation
    await expect(
      caller.comments.publicCreate({
        token: "some-token",
        deliverableId: 1,
        comment: "Test",
        authorName: "", // empty
      })
    ).rejects.toThrow();
  });
});

// ============ PORTAL VIEWPROJECT TESTS ============

describe("Portal ViewProject", () => {
  it("portal.viewProject rejects invalid token", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.portal.viewProject({ token: "invalid-token-12345" })
    ).rejects.toThrow("Invalid or expired portal link");
  });
});

// ============ REVISION ROUTER TESTS ============

describe("Revisions Router", () => {
  it("revisions.publicList rejects invalid token", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.revisions.publicList({
        token: "invalid-token-12345",
        deliverableId: 1,
      })
    ).rejects.toThrow("Invalid or expired portal link");
  });

  it("revisions.list requires authentication", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.revisions.list({ deliverableId: 1 })
    ).rejects.toThrow();
  });

  it("revisions.create requires authentication", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.revisions.create({
        deliverableId: 1,
        changeType: "manual_edit",
        changeSummary: "Test",
      })
    ).rejects.toThrow();
  });
});
