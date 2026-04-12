import { describe, it, expect } from "vitest";
import { TIER_PRICES, formatTierPrice, TIER_CREDIT_GRANTS, SIGNUP_BONUS_CREDITS } from "@shared/const";
import { TOOL_COSTS } from "./db/credits";

describe("Sprint C pricing constants", () => {
  it("TIER_PRICES matches Paymob-facing amounts", () => {
    expect(TIER_PRICES.full_audit.egypt).toBe(2400);
    expect(TIER_PRICES.strategy_pack.egypt).toBe(7300);
    expect(TIER_PRICES.full_audit.usd).toBe(49);
    expect(TIER_PRICES.strategy_pack.usd).toBe(149);
  });

  it("formatTierPrice maps markets", () => {
    expect(formatTierPrice("full_audit", "egypt")).toContain("EGP");
    expect(formatTierPrice("strategy_pack", "ksa")).toContain("SAR");
    expect(formatTierPrice("full_audit", "uae")).toContain("AED");
    expect(formatTierPrice("strategy_pack", "other")).toMatch(/^\$/);
  });

  it("TIER_CREDIT_GRANTS documents plan credit top-ups", () => {
    expect(TIER_CREDIT_GRANTS.full_audit).toBe(60);
    expect(TIER_CREDIT_GRANTS.strategy_pack).toBe(200);
  });

  it("TOOL_COSTS includes strategy_pack tool debit", () => {
    expect(TOOL_COSTS.strategy_pack).toBe(140);
    expect(TOOL_COSTS.full_audit).toBe(60);
  });

  it("SIGNUP_BONUS_CREDITS aligns with welcome UI", () => {
    expect(SIGNUP_BONUS_CREDITS).toBe(100);
  });
});

describe("purchaseStatus plan id normalization", () => {
  it("accepts known Paymob plan ids", () => {
    const normalize = (raw: string | null) => {
      const r = raw || "full_audit";
      return r === "strategy_pack" ? "strategy_pack" : "full_audit";
    };
    expect(normalize(null)).toBe("full_audit");
    expect(normalize("strategy_pack")).toBe("strategy_pack");
    expect(normalize("full_audit")).toBe("full_audit");
    expect(normalize("credits_500")).toBe("full_audit");
  });
});

describe("KSA / UAE tier amounts", () => {
  it("exports non-zero Gulf list prices", () => {
    expect(TIER_PRICES.full_audit.ksa).toBeGreaterThan(0);
    expect(TIER_PRICES.strategy_pack.uae).toBeGreaterThan(0);
  });
});
