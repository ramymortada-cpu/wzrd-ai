/**
 * Arabic PDF gate — Sprint B
 * jsPDF + default Helvetica does not embed Arabic shaping; we ship Plan B (HTML + Puppeteer).
 */
import { describe, it, expect } from "vitest";
import { jsPDF } from "jspdf";
import { escapeHtml, FULL_AUDIT_PDF_ENGINE } from "./fullAuditPdf";

describe("Arabic PDF gate (jsPDF)", () => {
  it("does not embed raw UTF-8 Arabic in PDF stream with default font — Plan B required", () => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "normal");
    doc.text("مرحبا بالعالم", 20, 20);
    const buf = Buffer.from(doc.output("arraybuffer"));
    // If Arabic were embedded as UTF-8 text in content, this substring would often appear
    expect(buf.includes(Buffer.from("مرحبا", "utf8"))).toBe(false);
  });

  it("escapeHtml preserves Arabic and neutralizes XSS", () => {
    const s = escapeHtml('مرحبا<script>alert(1)</script>');
    expect(s).toContain("مرحبا");
    expect(s).not.toContain("<script>");
    expect(FULL_AUDIT_PDF_ENGINE).toBe("html-puppeteer");
  });
});
