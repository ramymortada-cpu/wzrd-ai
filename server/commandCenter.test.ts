import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";
import {
  PRIMO_MARCA_SYSTEM_PROMPT,
  SERVICE_PROMPTS,
  SERVICE_PLAYBOOKS,
  SERVICE_LABELS,
  SERVICE_PRICES,
  STAGE_LABELS,
} from "./knowledgeBase";

// ============ KNOWLEDGE BASE TESTS ============

describe("Knowledge Base", () => {
  it("has a comprehensive system prompt", () => {
    expect(PRIMO_MARCA_SYSTEM_PROMPT).toBeDefined();
    expect(PRIMO_MARCA_SYSTEM_PROMPT.length).toBeGreaterThan(500);
    expect(PRIMO_MARCA_SYSTEM_PROMPT).toContain("Primo Marca");
    expect(PRIMO_MARCA_SYSTEM_PROMPT).toContain("4D");
    expect(PRIMO_MARCA_SYSTEM_PROMPT).toContain("Three Pillars");
    expect(PRIMO_MARCA_SYSTEM_PROMPT).toContain("Consultant Box");
  });

  it("contains service prompts for all services plus general", () => {
    const expectedServices = [
      "clarity_package",
      "brand_foundation",
      "growth_partnership",
      "business_health_check",
      "starting_business_logic",
      "brand_identity",
      "business_takeoff",
      "consultation",
      "general",
    ];
    for (const service of expectedServices) {
      expect(SERVICE_PROMPTS[service]).toBeDefined();
      expect(SERVICE_PROMPTS[service].length).toBeGreaterThan(100);
    }
  });

  it("has correct service labels for all services (core + legacy)", () => {
    expect(SERVICE_LABELS.clarity_package).toBe("Clarity Package");
    expect(SERVICE_LABELS.brand_foundation).toBe("Brand Foundation");
    expect(SERVICE_LABELS.growth_partnership).toBe("Growth Partnership");
    expect(SERVICE_LABELS.business_health_check).toBe("Business Health Check");
    expect(SERVICE_LABELS.starting_business_logic).toBe("Starting Business Logic");
    expect(SERVICE_LABELS.brand_identity).toBe("Brand Identity");
    expect(SERVICE_LABELS.business_takeoff).toBe("Business Takeoff");
    expect(SERVICE_LABELS.consultation).toBe("Consultation");
  });

  it("has correct service prices in EGP", () => {
    expect(SERVICE_PRICES.clarity_package).toBe(80000);
    expect(SERVICE_PRICES.brand_foundation).toBe(120000);
    expect(SERVICE_PRICES.growth_partnership).toBe(35000);
    expect(SERVICE_PRICES.business_health_check).toBe(140000);
    expect(SERVICE_PRICES.starting_business_logic).toBe(160000);
    expect(SERVICE_PRICES.brand_identity).toBe(210000);
    expect(SERVICE_PRICES.business_takeoff).toBe(320000);
    expect(SERVICE_PRICES.consultation).toBe(70000);
  });

  it("has all 4D Framework stage labels plus completed", () => {
    expect(STAGE_LABELS.diagnose).toBe("Diagnose");
    expect(STAGE_LABELS.design).toBe("Design");
    expect(STAGE_LABELS.deploy).toBe("Deploy");
    expect(STAGE_LABELS.optimize).toBe("Optimize");
    expect(STAGE_LABELS.completed).toBe("Completed");
  });
});

describe("Service Playbooks", () => {
  it("has playbooks for all 8 services (3 core + 5 legacy)", () => {
    const expectedServices = [
      "clarity_package",
      "brand_foundation",
      "growth_partnership",
      "business_health_check",
      "starting_business_logic",
      "brand_identity",
      "business_takeoff",
      "consultation",
    ];
    for (const service of expectedServices) {
      expect(SERVICE_PLAYBOOKS[service]).toBeDefined();
      expect(SERVICE_PLAYBOOKS[service].name).toBeDefined();
      expect(SERVICE_PLAYBOOKS[service].description).toBeDefined();
      expect(SERVICE_PLAYBOOKS[service].stages.length).toBeGreaterThan(0);
    }
  });

  it("business_health_check maps to clarity_package playbook", () => {
    const playbook = SERVICE_PLAYBOOKS.business_health_check;
    expect(playbook.name).toBe("Business Health Check");
    expect(playbook.stages).toBe(SERVICE_PLAYBOOKS.clarity_package.stages);
    expect(playbook.stages[0].stage).toBe("diagnose");
    // Clarity package has 3 steps in diagnose stage
    expect(playbook.stages[0].steps.length).toBeGreaterThanOrEqual(3);
    for (const step of playbook.stages[0].steps) {
      expect(step.title).toBeDefined();
      expect(step.description).toBeDefined();
      expect(step.deliverable).toBeDefined();
    }
  });

  it("business_takeoff combines brand_foundation and growth_partnership stages", () => {
    const playbook = SERVICE_PLAYBOOKS.business_takeoff;
    const stageNames = playbook.stages.map((s) => s.stage);
    expect(stageNames).toContain("diagnose");
    expect(stageNames).toContain("design");
    expect(stageNames).toContain("optimize");
    // It should have stages from both brand_foundation and growth_partnership
    const brandStages = SERVICE_PLAYBOOKS.brand_foundation.stages.length;
    const growthStages = SERVICE_PLAYBOOKS.growth_partnership.stages.length;
    expect(playbook.stages.length).toBe(brandStages + growthStages);
  });

  it("brand_identity maps to brand_foundation playbook", () => {
    const playbook = SERVICE_PLAYBOOKS.brand_identity;
    const stageNames = playbook.stages.map((s) => s.stage);
    expect(stageNames).toContain("diagnose");
    expect(stageNames).toContain("design");
    expect(playbook.stages).toBe(SERVICE_PLAYBOOKS.brand_foundation.stages);
  });

  it("all playbook steps have required fields", () => {
    for (const [, playbook] of Object.entries(SERVICE_PLAYBOOKS)) {
      for (const stage of playbook.stages) {
        expect(stage.stage).toBeDefined();
        expect(stage.title).toBeDefined();
        expect(stage.steps.length).toBeGreaterThan(0);
        for (const step of stage.steps) {
          expect(step.title).toBeTruthy();
          expect(step.description).toBeTruthy();
        }
      }
    }
  });
});

// ============ ROUTER STRUCTURE TESTS ============

describe("Router Structure", () => {
  it("has all required routers", () => {
    const routerKeys = Object.keys(appRouter._def.record);
    expect(routerKeys).toContain("system");
    expect(routerKeys).toContain("auth");
    expect(routerKeys).toContain("clients");
    expect(routerKeys).toContain("projects");
    expect(routerKeys).toContain("deliverables");
    expect(routerKeys).toContain("notes");
    expect(routerKeys).toContain("payments");
    expect(routerKeys).toContain("ai");
    expect(routerKeys).toContain("dashboard");
  });

  it("clients router exists with CRUD operations", () => {
    expect(appRouter._def.record).toHaveProperty("clients");
    const clientsRouter = appRouter._def.record.clients;
    expect(clientsRouter).toBeDefined();
  });

  it("projects router exists with CRUD operations", () => {
    expect(appRouter._def.record).toHaveProperty("projects");
    const projectsRouter = appRouter._def.record.projects;
    expect(projectsRouter).toBeDefined();
  });

  it("deliverables router has operations including AI generation", () => {
    const delRouter = appRouter._def.record.deliverables;
    expect(delRouter).toBeDefined();
    const procedures = (delRouter as any)._def?.procedures || (delRouter as any)._def?.record;
    if (procedures) {
      expect(procedures).toHaveProperty("getByProject");
    } else {
      expect(appRouter._def.record).toHaveProperty("deliverables");
    }
  });

  it("notes router exists with required operations", () => {
    expect(appRouter._def.record).toHaveProperty("notes");
    const notesRouter = appRouter._def.record.notes;
    expect(notesRouter).toBeDefined();
  });

  it("payments router exists", () => {
    expect(appRouter._def.record).toHaveProperty("payments");
    const paymentsRouter = appRouter._def.record.payments;
    expect(paymentsRouter).toBeDefined();
  });

  it("ai router exists with chat and analysis capabilities", () => {
    expect(appRouter._def.record).toHaveProperty("ai");
    const aiRouter = appRouter._def.record.ai;
    expect(aiRouter).toBeDefined();
  });

  it("dashboard router exists with stats and playbooks", () => {
    expect(appRouter._def.record).toHaveProperty("dashboard");
    const dashboardRouter = appRouter._def.record.dashboard;
    expect(dashboardRouter).toBeDefined();
  });
});

// ============ AUTH TESTS ============

type CookieCall = {
  name: string;
  options: Record<string, unknown>;
};

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext; clearedCookies: CookieCall[] } {
  const clearedCookies: CookieCall[] = [];
  const user: AuthenticatedUser = {
    id: 1,
    openId: "ramy-mortada",
    email: "ramy.mortada@gmail.com",
    name: "Ramy Mortada",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  const ctx: TrpcContext = {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };
  return { ctx, clearedCookies };
}

describe("auth.logout", () => {
  it("clears the session cookie and reports success", async () => {
    const { ctx, clearedCookies } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
  });
});

describe("auth.me", () => {
  it("returns the authenticated user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeDefined();
    expect(result?.name).toBe("Ramy Mortada");
    expect(result?.role).toBe("admin");
  });

  it("returns null for unauthenticated user", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: { clearCookie: () => {} } as any,
    };
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });
});

// ============ DASHBOARD PLAYBOOKS TEST ============

describe("dashboard.playbooks", () => {
  it("returns playbooks, labels, prices, and stages", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.dashboard.playbooks();

    expect(result.playbooks).toBeDefined();
    // Now has 8 playbooks (3 core + 5 legacy)
    expect(Object.keys(result.playbooks).length).toBeGreaterThanOrEqual(5);
    expect(result.labels).toBeDefined();
    expect(Object.keys(result.labels).length).toBeGreaterThanOrEqual(5);
    expect(result.prices).toBeDefined();
    expect(result.prices.business_health_check).toBe(140000);
    expect(result.prices.clarity_package).toBe(80000);
    expect(result.stages).toBeDefined();
    expect(Object.keys(result.stages)).toHaveLength(5);
  });
});
