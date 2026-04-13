import { describe, it, expect } from "vitest";
import { mapObservatoryAlertToInsert } from "./db/brand";

describe("Sprint F — Brand Monitor alert mapper", () => {
  it("maps low → info + overall dimension for unknown type", () => {
    const row = mapObservatoryAlertToInsert(42, {
      type: "custom_type",
      severity: "low",
      message: "Hello",
      recommendation: "Do X",
    });
    expect(row.clientId).toBe(42);
    expect(row.severity).toBe("info");
    expect(row.dimension).toBe("overall");
    expect(row.title).toContain("Brand Monitor");
    expect(row.description).toBe("Hello");
  });

  it("maps negative_sentiment → reputation + high → critical", () => {
    const row = mapObservatoryAlertToInsert(1, {
      type: "negative_sentiment",
      severity: "high",
      message: "Bad reviews",
      recommendation: "Respond",
    });
    expect(row.dimension).toBe("reputation");
    expect(row.severity).toBe("critical");
  });

  it("maps competitor_activity → market_fit", () => {
    const row = mapObservatoryAlertToInsert(2, {
      type: "competitor_activity",
      severity: "medium",
      message: "Competitors",
      recommendation: "Watch",
    });
    expect(row.dimension).toBe("market_fit");
    expect(row.severity).toBe("warning");
  });
});
