import { describe, it, expect } from "vitest";
import { pillarsToRadarData } from "./fullAuditRadarData";

describe("pillarsToRadarData", () => {
  it("returns empty array for null, undefined, or empty pillars", () => {
    expect(pillarsToRadarData(null, false)).toEqual([]);
    expect(pillarsToRadarData(undefined, false)).toEqual([]);
    expect(pillarsToRadarData([], true)).toEqual([]);
  });

  it("clamps scores to 0–100 and rounds to integers", () => {
    const rows = pillarsToRadarData(
      [{ name: "A", nameAr: "أ", score: -5 }, { name: "B", nameAr: "ب", score: 150.6 }],
      false,
    );
    expect(rows).toHaveLength(2);
    expect(rows[0]?.score).toBe(0);
    expect(rows[1]?.score).toBe(100);
    expect(Number.isNaN(rows[0]?.score)).toBe(false);
  });

  it("uses NaN-safe fallback to 0", () => {
    const rows = pillarsToRadarData([{ name: "X", nameAr: "س", score: Number.NaN }], true);
    expect(rows[0]?.score).toBe(0);
  });

  it("caps at 7 pillars", () => {
    const many = Array.from({ length: 10 }, (_, i) => ({
      name: `P${i}`,
      nameAr: `م${i}`,
      score: i * 10,
    }));
    expect(pillarsToRadarData(many, false)).toHaveLength(7);
  });

  it("uses Arabic labels when isAr is true", () => {
    const rows = pillarsToRadarData([{ name: "Identity", nameAr: "الهوية", score: 50 }], true);
    expect(rows[0]?.subject).toContain("الهوية");
  });

  it("uses English labels when isAr is false", () => {
    const rows = pillarsToRadarData([{ name: "Identity", nameAr: "الهوية", score: 50 }], false);
    expect(rows[0]?.subject).toContain("Identity");
  });
});
