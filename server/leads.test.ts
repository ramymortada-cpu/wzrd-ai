import { describe, expect, it, vi, beforeEach } from "vitest";
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
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
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
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("leads router", () => {
  describe("submitQuickCheck (public)", () => {
    it("accepts a valid quick-check submission and returns a result", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.leads.submitQuickCheck({
        companyName: "Test Corp",
        contactName: "Ahmed Ali",
        email: "ahmed@testcorp.com",
        phone: "+201234567890",
        industry: "F&B",
        market: "egypt",
        website: "https://testcorp.com",
        answers: [
          { question: "How would you describe your brand?", answer: "We are a premium coffee brand" },
          { question: "What is your biggest challenge?", answer: "Standing out from competitors" },
          { question: "What would success look like?", answer: "Double our social media following" },
        ],
      });

      // Should return teaser data
      expect(result).toBeDefined();
      expect(result.diagnosisTeaser).toBeTruthy();
      expect(typeof result.score).toBe("number");
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(["hot", "warm", "cold"]).toContain(result.scoreLabel);
      expect(result.recommendedService).toBeTruthy();
    }, 30000); // LLM call can take time

    it("rejects submission with invalid email", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.leads.submitQuickCheck({
          companyName: "Test Corp",
          email: "not-an-email",
          market: "egypt",
          answers: [{ question: "Q1", answer: "A1" }],
        })
      ).rejects.toThrow();
    });

    it("rejects submission without company name", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.leads.submitQuickCheck({
          companyName: "",
          email: "test@test.com",
          market: "egypt",
          answers: [{ question: "Q1", answer: "A1" }],
        })
      ).rejects.toThrow();
    });
  });

  describe("list (protected)", () => {
    it("returns leads list for authenticated user", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const leads = await caller.leads.list();

      expect(Array.isArray(leads)).toBe(true);
    });

    it("rejects unauthenticated access", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      await expect(caller.leads.list()).rejects.toThrow();
    });
  });

  describe("stats (protected)", () => {
    it("returns lead statistics for authenticated user", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const stats = await caller.leads.stats();

      expect(stats).toBeDefined();
      expect(typeof stats.total).toBe("number");
      expect(typeof stats.hot).toBe("number");
      expect(typeof stats.warm).toBe("number");
      expect(typeof stats.cold).toBe("number");
      expect(typeof stats.converted).toBe("number");
      expect(typeof stats.totalValue).toBe("number");
    });

    it("rejects unauthenticated access", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      await expect(caller.leads.stats()).rejects.toThrow();
    });
  });

  describe("funnel (protected)", () => {
    it("returns funnel stats for authenticated user", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const funnel = await caller.leads.funnel();

      expect(funnel).toBeDefined();
      expect(typeof funnel.new).toBe("number");
      expect(typeof funnel.contacted).toBe("number");
      expect(typeof funnel.qualified).toBe("number");
      expect(typeof funnel.proposalSent).toBe("number");
      expect(typeof funnel.converted).toBe("number");
      expect(typeof funnel.lost).toBe("number");
    });
  });

  describe("updateStatus (protected)", () => {
    it("rejects unauthenticated access", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.leads.updateStatus({ id: 1, status: "contacted" })
      ).rejects.toThrow();
    });
  });
});
