import { describe, it, expect } from "vitest";
import {
  formatLighthouseForPrompt,
  normalizeTop3Issues,
} from "./quickCheckSiteData";

describe("Sprint G — Quick Check site helpers", () => {
  it("formatLighthouseForPrompt includes four categories", () => {
    const s = formatLighthouseForPrompt({
      performance: 90,
      accessibility: 85,
      bestPractices: 70,
      seo: 60,
    });
    expect(s).toContain("Performance: 90");
    expect(s).toContain("SEO: 60");
  });

  it("normalizeTop3Issues prefers LLM array when valid", () => {
    const out = normalizeTop3Issues(
      ["A", "B", "C"],
      "teaser",
      "full",
    );
    expect(out).toEqual(["A", "B", "C"]);
  });

  it("normalizeTop3Issues pads from full diagnosis lines", () => {
    const out = normalizeTop3Issues(
      [],
      "Short.",
      "First line here\nSecond line\nThird line here",
    );
    expect(out.length).toBe(3);
    expect(out[0]).toContain("First line");
  });
});
