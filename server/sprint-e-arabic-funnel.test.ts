import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { getToneExamples } from "./routers/fullAudit";
import { formatTierPrice } from "@shared/const";
import { sendQuickCheckResultEmail, sendPurchaseConfirmationEmail } from "./wzrdEmails";

/** Mirrors QuickCheck funnel tiers (Sprint E). */
function quickCheckFunnelTier(score: number): "red" | "yellow" | "green" {
  if (score < 60) return "red";
  if (score < 80) return "yellow";
  return "green";
}

describe("Sprint E — getToneExamples", () => {
  it("Egypt includes عامية cue and local brand anchors", () => {
    const t = getToneExamples("egypt");
    expect(t).toMatch(/brand identity|بتاعك|عامية/i);
    expect(t).toMatch(/Juhayna|Fawry|Vodafone Egypt|Noon Egypt/);
  });

  it("KSA uses formal tone description and brand anchors", () => {
    const t = getToneExamples("ksa");
    expect(t).toMatch(/نلاحظ|تطوير|formal/i);
    expect(t).toMatch(/Almarai|STC|Al Rajhi|Jarir|Noon KSA/);
  });
});

describe("Sprint E — Quick Check funnel tiers", () => {
  it("maps score < 60 to urgent (red card)", () => {
    expect(quickCheckFunnelTier(0)).toBe("red");
    expect(quickCheckFunnelTier(59)).toBe("red");
  });
  it("maps 60–79 to opportunity (yellow card)", () => {
    expect(quickCheckFunnelTier(60)).toBe("yellow");
    expect(quickCheckFunnelTier(79)).toBe("yellow");
  });
  it("maps ≥ 80 to strength (green card)", () => {
    expect(quickCheckFunnelTier(80)).toBe("green");
    expect(quickCheckFunnelTier(100)).toBe("green");
  });
});

describe("Sprint E — formatTierPrice (import only, no duplication)", () => {
  it("formats strategy_pack for Egypt", () => {
    expect(formatTierPrice("strategy_pack", "egypt")).toContain("EGP");
  });
});

describe("Sprint E — SEO full-audit landing", () => {
  const htmlPath = join(import.meta.dirname, "..", "client", "public", "landing", "seo", "full-audit.html");

  it("full-audit.html exists", () => {
    expect(existsSync(htmlPath)).toBe(true);
  });

  it("includes SoftwareApplication JSON-LD with price 0", () => {
    const html = readFileSync(htmlPath, "utf8");
    expect(html).toContain("SoftwareApplication");
    expect(html).toContain('"price":"0"');
    expect(html).toContain("/quick-check");
  });

  it("links tools under /app/tools prefix", () => {
    const html = readFileSync(htmlPath, "utf8");
    expect(html).toContain("/app/tools/brand-diagnosis");
    expect(html).toContain("/app/tools/offer-check");
  });
});

describe("Sprint E — immediate email helpers", () => {
  it("exports sendQuickCheckResultEmail", () => {
    expect(typeof sendQuickCheckResultEmail).toBe("function");
  });
  it("exports sendPurchaseConfirmationEmail", () => {
    expect(typeof sendPurchaseConfirmationEmail).toBe("function");
  });
});
