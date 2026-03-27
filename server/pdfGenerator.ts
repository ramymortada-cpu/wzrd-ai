/**
 * PDF Generator — Converts deliverable content into branded PDF documents
 * Uses jsPDF for server-side PDF generation with Primo Marca branding
 */
import { jsPDF } from "jspdf";
import { storagePut } from "./storage";

// Primo Marca brand colors (from brand guidelines)
const BRAND = {
  primary: "#E8A838",      // Gold/Amber
  secondary: "#1A1A2E",    // Dark navy
  accent: "#F5A623",       // Bright gold
  text: "#1A1A2E",         // Dark text
  textLight: "#6B7280",    // Gray text
  bg: "#FFFFFF",           // White
  bgAlt: "#FFF9F0",        // Warm off-white
  divider: "#E5E7EB",      // Light gray
};

// Quality checklist templates per deliverable type
export const QUALITY_CHECKLISTS: Record<string, { label: string; items: string[] }> = {
  "Brand Diagnosis Report": {
    label: "Brand Diagnosis Report",
    items: [
      "Executive summary is clear and actionable",
      "Specific to client's industry and market",
      "Includes quantified findings where possible",
      "Competitive analysis with real competitors",
      "Brand health scorecard completed (all dimensions)",
      "Prioritized action plan with timelines",
      "Connects findings to business outcomes",
      "Professional formatting and structure",
    ],
  },
  "Brand Positioning Document": {
    label: "Brand Positioning",
    items: [
      "Positioning statement is specific and unique",
      "Competitive frame of reference defined",
      "Points of Difference backed by evidence",
      "Points of Parity identified",
      "Unfair advantage articulated",
      "Brand promise is clear and deliverable",
      "Proof points are specific and verifiable",
      "Passes the 'so what?' test",
    ],
  },
  "Messaging Framework": {
    label: "Messaging Framework",
    items: [
      "Brand narrative is compelling and unique",
      "Value proposition is clear and differentiated",
      "Tagline options with rationale provided",
      "Key messages tailored per audience segment",
      "Elevator pitches at 3 lengths",
      "Content pillars defined with examples",
      "Language guidelines (use/avoid) included",
      "Tone adjustments by context specified",
    ],
  },
  "Visual Identity Brief": {
    label: "Visual Identity Brief",
    items: [
      "Color palette with hex codes and rationale",
      "Typography recommendations with hierarchy",
      "Logo direction/concepts described",
      "Visual mood and style defined",
      "Application examples provided",
      "Do's and Don'ts included",
      "Consistent with brand positioning",
      "Practical for client's industry",
    ],
  },
  "Implementation Roadmap": {
    label: "Implementation Roadmap",
    items: [
      "Phased timeline with clear milestones",
      "Quick wins identified (0-30 days)",
      "Medium-term goals (1-3 months)",
      "Long-term strategy (3-12 months)",
      "Resource requirements specified",
      "KPIs for each phase defined",
      "Dependencies and risks identified",
      "Budget estimates included",
    ],
  },
  "Social Strategy Document": {
    label: "Social Strategy",
    items: [
      "Platform strategy with rationale",
      "Content pillars defined",
      "Content calendar framework included",
      "Engagement strategy specified",
      "Performance KPIs by platform",
      "Content mix ratio defined",
      "Competitor social analysis included",
      "Budget allocation recommended",
    ],
  },
  "Business Model Analysis": {
    label: "Business Model Analysis",
    items: [
      "Business Model Canvas fully analyzed",
      "Unit economics calculated",
      "Competitive position mapped",
      "Structural assessment completed",
      "Revenue streams analyzed",
      "Cost structure reviewed",
      "Scalability score justified",
      "Prioritized recommendations provided",
    ],
  },
  default: {
    label: "General Deliverable",
    items: [
      "Content is specific to client",
      "Actionable recommendations included",
      "Professional formatting",
      "Connected to business outcomes",
      "Methodology applied correctly",
      "Clear structure and flow",
      "No generic/placeholder content",
      "Ready for client presentation",
    ],
  },
};

/** Get quality checklist for a deliverable title */
export function getQualityChecklist(title: string): string[] {
  // Try to match by key words in the title
  for (const [key, checklist] of Object.entries(QUALITY_CHECKLISTS)) {
    if (key === "default") continue;
    const words = key.toLowerCase().split(" ");
    const titleLower = title.toLowerCase();
    if (words.every(w => titleLower.includes(w)) || titleLower.includes(key.toLowerCase())) {
      return checklist.items;
    }
  }
  // Fuzzy match
  const titleLower = title.toLowerCase();
  if (titleLower.includes("diagnosis") || titleLower.includes("audit") || titleLower.includes("health")) {
    return QUALITY_CHECKLISTS["Brand Diagnosis Report"].items;
  }
  if (titleLower.includes("positioning")) {
    return QUALITY_CHECKLISTS["Brand Positioning Document"].items;
  }
  if (titleLower.includes("messaging") || titleLower.includes("message")) {
    return QUALITY_CHECKLISTS["Messaging Framework"].items;
  }
  if (titleLower.includes("visual") || titleLower.includes("identity") || titleLower.includes("brand guide")) {
    return QUALITY_CHECKLISTS["Visual Identity Brief"].items;
  }
  if (titleLower.includes("roadmap") || titleLower.includes("implementation") || titleLower.includes("plan")) {
    return QUALITY_CHECKLISTS["Implementation Roadmap"].items;
  }
  if (titleLower.includes("social") || titleLower.includes("content")) {
    return QUALITY_CHECKLISTS["Social Strategy Document"].items;
  }
  if (titleLower.includes("business model") || titleLower.includes("analysis")) {
    return QUALITY_CHECKLISTS["Business Model Analysis"].items;
  }
  return QUALITY_CHECKLISTS.default.items;
}

/** Parse markdown content into structured sections */
function parseMarkdownSections(content: string): { heading: string; body: string }[] {
  const lines = content.split("\n");
  const sections: { heading: string; body: string }[] = [];
  let currentHeading = "";
  let currentBody: string[] = [];

  for (const line of lines) {
    const headingMatch = line.match(/^#{1,3}\s+(.+)/);
    if (headingMatch) {
      if (currentHeading || currentBody.length > 0) {
        sections.push({ heading: currentHeading, body: currentBody.join("\n").trim() });
      }
      currentHeading = headingMatch[1].replace(/\*\*/g, "").trim();
      currentBody = [];
    } else {
      currentBody.push(line);
    }
  }
  if (currentHeading || currentBody.length > 0) {
    sections.push({ heading: currentHeading, body: currentBody.join("\n").trim() });
  }
  return sections;
}

/** Clean markdown formatting for PDF text */
function cleanMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/\[(.+?)\]\(.+?\)/g, "$1")
    .replace(/^[-*+]\s+/gm, "• ")
    .replace(/^\d+\.\s+/gm, "")
    .trim();
}

/** Word-wrap text to fit within a given width */
function wrapText(doc: jsPDF, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = doc.getTextWidth(testLine);
    if (testWidth > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

export interface GeneratePDFOptions {
  title: string;
  content: string;
  clientName?: string;
  projectName?: string;
  serviceType?: string;
  stage?: string;
  date?: string;
}

/** Generate a branded PDF from deliverable content */
export async function generateDeliverablePDF(options: GeneratePDFOptions): Promise<{ buffer: Buffer; pageCount: number }> {
  const { title, content, clientName, projectName, serviceType, date } = options;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = 0;

  const addNewPage = () => {
    doc.addPage();
    y = margin;
    // Add subtle header line on subsequent pages
    doc.setDrawColor(BRAND.primary);
    doc.setLineWidth(0.5);
    doc.line(margin, 12, pageWidth - margin, 12);
    doc.setFontSize(7);
    doc.setTextColor(BRAND.textLight);
    doc.text(`${title} — ${clientName || "Client"}`, margin, 10);
    doc.text(`Primo Marca`, pageWidth - margin, 10, { align: "right" });
    y = 18;
  };

  const checkPageBreak = (neededSpace: number) => {
    if (y + neededSpace > pageHeight - 25) {
      addNewPage();
    }
  };

  // ============ COVER PAGE ============
  // Dark background
  doc.setFillColor(BRAND.secondary);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  // Gold accent bar at top
  doc.setFillColor(BRAND.primary);
  doc.rect(0, 0, pageWidth, 4, "F");

  // Logo area - gold circle with "PM"
  doc.setFillColor(BRAND.primary);
  doc.circle(pageWidth / 2, 55, 12, "F");
  doc.setFontSize(14);
  doc.setTextColor("#FFFFFF");
  doc.setFont("helvetica", "bold");
  doc.text("PM", pageWidth / 2, 58, { align: "center" });

  // Company name
  doc.setFontSize(10);
  doc.setTextColor(BRAND.primary);
  doc.setFont("helvetica", "normal");
  doc.text("PRIMO MARCA", pageWidth / 2, 75, { align: "center" });
  doc.setFontSize(7);
  doc.setTextColor("#9CA3AF");
  doc.text("Brand Engineering", pageWidth / 2, 80, { align: "center" });

  // Document title
  doc.setFontSize(24);
  doc.setTextColor("#FFFFFF");
  doc.setFont("helvetica", "bold");
  const titleLines = wrapText(doc, title.toUpperCase(), contentWidth);
  let titleY = 110;
  for (const line of titleLines) {
    doc.text(line, pageWidth / 2, titleY, { align: "center" });
    titleY += 12;
  }

  // Gold divider
  doc.setDrawColor(BRAND.primary);
  doc.setLineWidth(1);
  doc.line(pageWidth / 2 - 30, titleY + 5, pageWidth / 2 + 30, titleY + 5);

  // Client info
  doc.setFontSize(12);
  doc.setTextColor("#D1D5DB");
  doc.setFont("helvetica", "normal");
  if (clientName) {
    doc.text(`Prepared for: ${clientName}`, pageWidth / 2, titleY + 20, { align: "center" });
  }
  if (projectName) {
    doc.setFontSize(9);
    doc.text(projectName, pageWidth / 2, titleY + 28, { align: "center" });
  }

  // Date and service type
  doc.setFontSize(8);
  doc.setTextColor("#9CA3AF");
  const dateStr = date || new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  doc.text(dateStr, pageWidth / 2, pageHeight - 40, { align: "center" });
  if (serviceType) {
    doc.text(serviceType, pageWidth / 2, pageHeight - 34, { align: "center" });
  }

  // Confidential notice
  doc.setFontSize(6);
  doc.setTextColor("#6B7280");
  doc.text("CONFIDENTIAL — Prepared exclusively for the named recipient", pageWidth / 2, pageHeight - 15, { align: "center" });

  // Gold bar at bottom
  doc.setFillColor(BRAND.primary);
  doc.rect(0, pageHeight - 4, pageWidth, 4, "F");

  // ============ CONTENT PAGES ============
  addNewPage();

  const sections = parseMarkdownSections(content);

  for (const section of sections) {
    if (section.heading) {
      checkPageBreak(20);

      // Section heading with gold accent
      doc.setFillColor(BRAND.primary);
      doc.rect(margin, y, 3, 8, "F");

      doc.setFontSize(14);
      doc.setTextColor(BRAND.secondary);
      doc.setFont("helvetica", "bold");
      doc.text(section.heading, margin + 7, y + 6);
      y += 14;

      // Subtle divider
      doc.setDrawColor(BRAND.divider);
      doc.setLineWidth(0.2);
      doc.line(margin, y, pageWidth - margin, y);
      y += 6;
    }

    if (section.body) {
      const cleanedBody = cleanMarkdown(section.body);
      const paragraphs = cleanedBody.split("\n\n").filter(p => p.trim());

      for (const para of paragraphs) {
        const lines = para.split("\n").filter(l => l.trim());

        for (const line of lines) {
          const isBullet = line.startsWith("• ") || line.startsWith("- ");
          const lineText = isBullet ? line : line;

          doc.setFontSize(9.5);
          doc.setTextColor(BRAND.text);
          doc.setFont("helvetica", isBullet ? "normal" : "normal");

          const indent = isBullet ? 5 : 0;
          const wrapped = wrapText(doc, lineText, contentWidth - indent);

          for (const wl of wrapped) {
            checkPageBreak(6);
            doc.text(wl, margin + indent, y);
            y += 5;
          }
        }
        y += 3; // paragraph spacing
      }
      y += 4;
    }
  }

  // ============ FOOTER ON LAST PAGE ============
  checkPageBreak(30);
  y = Math.max(y, pageHeight - 50);

  doc.setDrawColor(BRAND.primary);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  doc.setFontSize(8);
  doc.setTextColor(BRAND.textLight);
  doc.setFont("helvetica", "italic");
  doc.text("This document was prepared by Primo Marca using Wzrd AI — AI-Powered Brand Engineering.", margin, y);
  y += 5;
  doc.text("All content is confidential and intended solely for the named recipient.", margin, y);
  y += 5;
  doc.text(`© ${new Date().getFullYear()} Primo Marca. All rights reserved.`, margin, y);

  // Generate buffer
  const arrayBuffer = doc.output("arraybuffer");
  const buffer = Buffer.from(arrayBuffer);
  const pageCount = doc.getNumberOfPages();

  return { buffer, pageCount };
}

/** Generate PDF and upload to S3 */
export async function generateAndUploadPDF(options: GeneratePDFOptions): Promise<{
  url: string;
  key: string;
  pageCount: number;
}> {
  const { buffer, pageCount } = await generateDeliverablePDF(options);

  // Create a safe filename
  const safeName = options.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 50);

  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const fileKey = `deliverables/${safeName}-${timestamp}-${randomSuffix}.pdf`;

  const { url, key } = await storagePut(fileKey, buffer, "application/pdf");

  return { url, key, pageCount };
}
