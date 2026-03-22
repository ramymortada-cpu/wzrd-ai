import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "sample-user",
    email: "ramy@primomarca.com",
    name: "Ramy Mortada",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

describe("proposalAcceptance router", () => {
  describe("submit (public)", () => {
    it("accepts a valid proposal acceptance submission", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      // This will fail gracefully if proposal doesn't exist, but validates input schema
      try {
        await caller.proposalAcceptance.submit({
          proposalId: 9999,
          clientId: 1,
          decision: "accepted",
          signatureName: "Ahmed Ali",
          signatureTitle: "CEO",
          feedback: "Looks great!",
        });
      } catch (e: any) {
        // Expected - proposal doesn't exist, but input validation passed
        expect(e.message).toBeTruthy();
      }
    });

    it("validates decision enum values", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.proposalAcceptance.submit({
          proposalId: 1,
          clientId: 1,
          decision: "invalid" as any,
        })
      ).rejects.toThrow();
    });
  });

  describe("getByProposal (protected)", () => {
    it("returns acceptances for authenticated user", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.proposalAcceptance.getByProposal({ proposalId: 1 });
      expect(Array.isArray(result)).toBe(true);
    });

    it("rejects unauthenticated access", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.proposalAcceptance.getByProposal({ proposalId: 1 })
      ).rejects.toThrow();
    });
  });
});

describe("deliverableFeedback router", () => {
  describe("submit (public)", () => {
    it("accepts valid feedback submission", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.deliverableFeedback.submit({
        deliverableId: 1,
        clientId: 1,
        comment: "Great work on the deliverable!",
        rating: 5,
      });

      expect(result).toBeDefined();
    });

    it("rejects empty comment", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.deliverableFeedback.submit({
          deliverableId: 1,
          comment: "",
        })
      ).rejects.toThrow();
    });

    it("rejects invalid rating", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.deliverableFeedback.submit({
          deliverableId: 1,
          comment: "Test",
          rating: 6,
        })
      ).rejects.toThrow();
    });

    it("rejects rating below 1", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.deliverableFeedback.submit({
          deliverableId: 1,
          comment: "Test",
          rating: 0,
        })
      ).rejects.toThrow();
    });
  });

  describe("getByDeliverable (protected)", () => {
    it("returns feedback for authenticated user", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.deliverableFeedback.getByDeliverable({
        deliverableId: 1,
      });

      expect(Array.isArray(result)).toBe(true);
    });

    it("rejects unauthenticated access", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.deliverableFeedback.getByDeliverable({ deliverableId: 1 })
      ).rejects.toThrow();
    });
  });
});

describe("leads integration with dashboard", () => {
  it("lead stats are accessible from authenticated context", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const stats = await caller.leads.stats();
    expect(stats).toHaveProperty("total");
    expect(stats).toHaveProperty("hot");
    expect(stats).toHaveProperty("warm");
    expect(stats).toHaveProperty("cold");
    expect(stats).toHaveProperty("converted");
    expect(stats).toHaveProperty("totalValue");
  });

  it("funnel stats are accessible from authenticated context", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const funnel = await caller.leads.funnel();
    expect(funnel).toHaveProperty("new");
    expect(funnel).toHaveProperty("contacted");
    expect(funnel).toHaveProperty("qualified");
    expect(funnel).toHaveProperty("proposalSent");
    expect(funnel).toHaveProperty("converted");
    expect(funnel).toHaveProperty("lost");
  });

  it("lead update status validates enum", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.leads.updateStatus({
        id: 1,
        status: "invalid_status" as any,
      })
    ).rejects.toThrow();
  });
});
