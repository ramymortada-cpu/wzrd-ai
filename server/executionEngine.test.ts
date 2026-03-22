import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the LLM module
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{ message: { content: "Test AI response content" } }],
  }),
}));

// Mock the image generation module
vi.mock("./_core/imageGeneration", () => ({
  generateImage: vi.fn().mockResolvedValue({ url: "https://example.com/test-image.png" }),
}));

// Mock the storage module
vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ url: "https://s3.example.com/test.pdf", key: "test-key.pdf" }),
}));

// Mock notification
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

describe("PDF Generator", () => {
  it("should export generateAndUploadPDF function", async () => {
    const { generateAndUploadPDF } = await import("./pdfGenerator");
    expect(generateAndUploadPDF).toBeDefined();
    expect(typeof generateAndUploadPDF).toBe("function");
  });

  it("should export getQualityChecklist function", async () => {
    const { getQualityChecklist } = await import("./pdfGenerator");
    expect(getQualityChecklist).toBeDefined();
    expect(typeof getQualityChecklist).toBe("function");
  });

  it("should generate a PDF buffer from content", async () => {
    const { generateDeliverablePDF } = await import("./pdfGenerator");
    const result = await generateDeliverablePDF({
      title: "Brand Positioning Document",
      content: "# Executive Summary\n\nThis is a test brand positioning document.\n\n## Market Analysis\n\nThe market shows strong potential.\n\n### Key Findings\n\n- Finding 1: Market is growing\n- Finding 2: Competition is moderate\n- Finding 3: Opportunity exists\n\n## Recommendations\n\n1. Focus on digital channels\n2. Build brand awareness\n3. Invest in content marketing",
      clientName: "Test Company",
      projectName: "Test Project",
      serviceType: "Brand Identity",
      stage: "Design",
    });

    expect(result).toBeDefined();
    expect(result.buffer).toBeInstanceOf(Buffer);
    expect(result.buffer.length).toBeGreaterThan(0);
    expect(result.pageCount).toBeGreaterThanOrEqual(1);
  });

  it("should generate PDF with cover page and content pages", async () => {
    const { generateDeliverablePDF } = await import("./pdfGenerator");
    const longContent = Array(20).fill("## Section\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.").join("\n\n");

    const result = await generateDeliverablePDF({
      title: "Comprehensive Strategy Document",
      content: longContent,
      clientName: "Big Corp",
    });

    expect(result.pageCount).toBeGreaterThan(1); // Should have cover + content pages
  });

  it("should upload PDF to S3 and return URL", async () => {
    const { generateAndUploadPDF } = await import("./pdfGenerator");
    const result = await generateAndUploadPDF({
      title: "Test Document",
      content: "# Test\n\nSimple test content",
      clientName: "Test Client",
    });

    expect(result.url).toBe("https://s3.example.com/test.pdf");
    expect(result.key).toBe("test-key.pdf");
    expect(result.pageCount).toBeGreaterThanOrEqual(1);
  });
});

describe("Quality Checklists", () => {
  it("should return checklist for Brand Diagnosis Report", async () => {
    const { getQualityChecklist } = await import("./pdfGenerator");
    const checklist = getQualityChecklist("Brand Diagnosis Report");
    expect(checklist).toBeDefined();
    expect(checklist.length).toBeGreaterThan(0);
    expect(checklist.some(item => item.toLowerCase().includes("executive summary"))).toBe(true);
  });

  it("should return checklist for Brand Positioning Document", async () => {
    const { getQualityChecklist } = await import("./pdfGenerator");
    const checklist = getQualityChecklist("Brand Positioning Document");
    expect(checklist).toBeDefined();
    expect(checklist.length).toBeGreaterThan(0);
    expect(checklist.some(item => item.toLowerCase().includes("positioning"))).toBe(true);
  });

  it("should return checklist for Messaging Framework", async () => {
    const { getQualityChecklist } = await import("./pdfGenerator");
    const checklist = getQualityChecklist("Messaging Framework");
    expect(checklist).toBeDefined();
    expect(checklist.length).toBeGreaterThan(0);
    expect(checklist.some(item => item.toLowerCase().includes("narrative") || item.toLowerCase().includes("value proposition"))).toBe(true);
  });

  it("should return checklist for Visual Identity Brief", async () => {
    const { getQualityChecklist } = await import("./pdfGenerator");
    const checklist = getQualityChecklist("Visual Identity Brief");
    expect(checklist).toBeDefined();
    expect(checklist.some(item => item.toLowerCase().includes("color"))).toBe(true);
  });

  it("should return checklist for Implementation Roadmap", async () => {
    const { getQualityChecklist } = await import("./pdfGenerator");
    const checklist = getQualityChecklist("Implementation Roadmap");
    expect(checklist).toBeDefined();
    expect(checklist.some(item => item.toLowerCase().includes("timeline") || item.toLowerCase().includes("milestone"))).toBe(true);
  });

  it("should return default checklist for unknown deliverable types", async () => {
    const { getQualityChecklist } = await import("./pdfGenerator");
    const checklist = getQualityChecklist("Random Unknown Document");
    expect(checklist).toBeDefined();
    expect(checklist.length).toBeGreaterThan(0);
    expect(checklist.some(item => item.toLowerCase().includes("specific to client"))).toBe(true);
  });

  it("should fuzzy match deliverable types", async () => {
    const { getQualityChecklist } = await import("./pdfGenerator");

    // Test fuzzy matching
    const diagnosis = getQualityChecklist("Full Brand Health Audit");
    expect(diagnosis.some(item => item.toLowerCase().includes("executive summary"))).toBe(true);

    const social = getQualityChecklist("Social Media Content Strategy");
    expect(social.some(item => item.toLowerCase().includes("platform") || item.toLowerCase().includes("content"))).toBe(true);

    const business = getQualityChecklist("Business Model Analysis Report");
    expect(business.some(item => item.toLowerCase().includes("business model"))).toBe(true);
  });
});

describe("Quality Checklist Constants", () => {
  it("should have all expected checklist types", async () => {
    const { QUALITY_CHECKLISTS } = await import("./pdfGenerator");
    expect(QUALITY_CHECKLISTS).toBeDefined();
    expect(QUALITY_CHECKLISTS["Brand Diagnosis Report"]).toBeDefined();
    expect(QUALITY_CHECKLISTS["Brand Positioning Document"]).toBeDefined();
    expect(QUALITY_CHECKLISTS["Messaging Framework"]).toBeDefined();
    expect(QUALITY_CHECKLISTS["Visual Identity Brief"]).toBeDefined();
    expect(QUALITY_CHECKLISTS["Implementation Roadmap"]).toBeDefined();
    expect(QUALITY_CHECKLISTS["Social Strategy Document"]).toBeDefined();
    expect(QUALITY_CHECKLISTS["Business Model Analysis"]).toBeDefined();
    expect(QUALITY_CHECKLISTS["default"]).toBeDefined();
  });

  it("should have 8 items per checklist", async () => {
    const { QUALITY_CHECKLISTS } = await import("./pdfGenerator");
    for (const [key, checklist] of Object.entries(QUALITY_CHECKLISTS)) {
      expect(checklist.items.length).toBe(8);
      expect(checklist.label).toBeDefined();
      expect(checklist.label.length).toBeGreaterThan(0);
    }
  });
});

describe("PDF Content Parsing", () => {
  it("should handle empty content gracefully", async () => {
    const { generateDeliverablePDF } = await import("./pdfGenerator");
    const result = await generateDeliverablePDF({
      title: "Empty Document",
      content: "",
    });
    expect(result.buffer).toBeInstanceOf(Buffer);
    expect(result.pageCount).toBeGreaterThanOrEqual(1);
  });

  it("should handle markdown with various formatting", async () => {
    const { generateDeliverablePDF } = await import("./pdfGenerator");
    const content = `# Main Title

## Section One

This has **bold text** and *italic text* and \`code\`.

- Bullet point 1
- Bullet point 2
- Bullet point 3

### Subsection

1. Numbered item
2. Another item

[Link text](https://example.com)

> Blockquote text here

---

## Section Two

More content here with a [link](https://test.com).`;

    const result = await generateDeliverablePDF({
      title: "Formatted Document",
      content,
      clientName: "Format Test Corp",
    });

    expect(result.buffer).toBeInstanceOf(Buffer);
    expect(result.buffer.length).toBeGreaterThan(1000); // Should have substantial content
  });

  it("should handle very long content with page breaks", async () => {
    const { generateDeliverablePDF } = await import("./pdfGenerator");
    const sections = Array(50).fill(null).map((_, i) =>
      `## Section ${i + 1}\n\n${"Lorem ipsum dolor sit amet, consectetur adipiscing elit. ".repeat(20)}`
    );
    const content = sections.join("\n\n");

    const result = await generateDeliverablePDF({
      title: "Very Long Document",
      content,
      clientName: "Long Content Corp",
      projectName: "Mega Project",
      serviceType: "Brand Identity",
    });

    expect(result.pageCount).toBeGreaterThan(5);
  });
});

describe("PDF Branding", () => {
  it("should include all optional parameters in generation", async () => {
    const { generateDeliverablePDF } = await import("./pdfGenerator");
    const result = await generateDeliverablePDF({
      title: "Full Options Test",
      content: "# Test\n\nContent here",
      clientName: "Acme Corp",
      projectName: "Brand Refresh 2024",
      serviceType: "Brand Identity",
      stage: "Design",
      date: "March 19, 2026",
    });

    expect(result.buffer).toBeInstanceOf(Buffer);
    expect(result.pageCount).toBeGreaterThanOrEqual(1);
  });

  it("should work without optional parameters", async () => {
    const { generateDeliverablePDF } = await import("./pdfGenerator");
    const result = await generateDeliverablePDF({
      title: "Minimal Test",
      content: "Simple content",
    });

    expect(result.buffer).toBeInstanceOf(Buffer);
  });
});
