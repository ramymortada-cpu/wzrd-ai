/**
 * Full Audit PDF — Sprint B tests (6) + arabic-pdf.test.ts (2) = 8 total
 */
import { describe, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  isValidFullAuditPdfUuid,
  cleanupOldFullAuditPdfs,
  buildFullAuditHtml,
  buildRadarSvg,
  writePdfMetaFile,
  readPdfMetaFile,
} from "./fullAuditPdf";
import type { FullAuditResult } from "../drizzle/schema";

function minimalRow(overrides: Partial<FullAuditResult> = {}): FullAuditResult {
  const base = {
    id: 1,
    userId: 1,
    companyName: "Test Co مرحبا",
    website: null,
    industry: "tech",
    targetAudience: "SMBs",
    mainChallenge: "Visibility",
    marketRegion: "egypt",
    overallScore: 72,
    confidence: "medium",
    resultJson: { pillars: [], overallScore: 72, overallLabel: "كويس" },
    metaJson: {},
    creditsUsed: 60,
    createdAt: new Date("2026-01-15T12:00:00Z"),
  };
  return { ...base, ...overrides } as FullAuditResult;
}

describe("Full Audit PDF helpers", () => {
  it("validates UUID format for download tokens", () => {
    expect(isValidFullAuditPdfUuid(randomUUID())).toBe(true);
    expect(isValidFullAuditPdfUuid("not-a-uuid")).toBe(false);
    expect(isValidFullAuditPdfUuid("")).toBe(false);
  });

  it("cleanupOldFullAuditPdfs removes stale meta+pdf pairs", async () => {
    const dir = join(tmpdir(), `wzzrd-pdf-test-${randomUUID()}`);
    await mkdir(dir, { recursive: true });
    const oldId = randomUUID();
    const oldMeta = { userId: 1, createdAt: Date.now() - 25 * 60 * 60 * 1000, auditId: 1 };
    await writeFile(join(dir, `${oldId}.meta.json`), JSON.stringify(oldMeta), "utf8");
    await writeFile(join(dir, `${oldId}.pdf`), "%PDF-1.4 fake", "utf8");
    const removed = await cleanupOldFullAuditPdfs(dir, 24 * 60 * 60 * 1000);
    expect(removed).toBeGreaterThanOrEqual(1);
  });

  it("buildFullAuditHtml handles missing pillars with placeholders", () => {
    const html = buildFullAuditHtml(minimalRow());
    expect(html).toContain("غير متاح");
    expect(html).toContain("WZZRD AI");
  });

  it("buildRadarSvg draws a closed polygon for 7 axes", () => {
    const pillars = Array.from({ length: 7 }, (_, i) => ({ id: `p${i}`, score: 50 + i }));
    const svg = buildRadarSvg(pillars as never[]);
    expect(svg).toContain("<polygon");
    expect(svg).toContain("points=");
  });

  it("fullAudit router defines generatePdf procedure", () => {
    const src = readFileSync(resolve(__dirname, "routers/fullAudit.ts"), "utf8");
    expect(src).toContain("generatePdf:");
    expect(src).toContain("protectedProcedure");
  });

  it("writePdfMetaFile + readPdfMetaFile roundtrip", async () => {
    const dir = join(tmpdir(), `wzzrd-meta-${randomUUID()}`);
    await mkdir(dir, { recursive: true });
    const id = randomUUID();
    await writePdfMetaFile(dir, id, { userId: 42, createdAt: Date.now(), auditId: 7 });
    const meta = await readPdfMetaFile(dir, id);
    expect(meta?.userId).toBe(42);
    expect(meta?.auditId).toBe(7);
  });
});
