import { describe, it, expect } from "vitest";
import {
  matchTemplate,
  buildTemplatePrompt,
  generateSmartImagePrompts,
  getAvailableTemplates,
  getTemplateById,
  TEMPLATES,
} from "./templateEngine";

describe("Template Engine", () => {
  describe("getAvailableTemplates", () => {
    it("should return all available templates as summaries", () => {
      const templates = getAvailableTemplates();
      expect(templates.length).toBeGreaterThanOrEqual(6);
      templates.forEach((t) => {
        expect(t).toHaveProperty("id");
        expect(t).toHaveProperty("name");
        expect(t).toHaveProperty("description");
        expect(t).toHaveProperty("sectionCount");
        expect(t.sectionCount).toBeGreaterThan(0);
      });
    });

    it("should include brand guidelines template", () => {
      const templates = getAvailableTemplates();
      const bg = templates.find((t) => t.id === "brand_guidelines");
      expect(bg).toBeDefined();
      expect(bg!.name).toContain("Brand Guidelines");
    });

    it("should include strategy deck template", () => {
      const templates = getAvailableTemplates();
      const sd = templates.find((t) => t.id === "strategy_deck");
      expect(sd).toBeDefined();
    });

    it("should include social media calendar template", () => {
      const templates = getAvailableTemplates();
      const smc = templates.find((t) => t.id === "social_media_calendar");
      expect(smc).toBeDefined();
    });
  });

  describe("getTemplateById", () => {
    it("should return full template by valid ID", () => {
      const template = getTemplateById("brand_guidelines");
      expect(template).toBeDefined();
      expect(template!.id).toBe("brand_guidelines");
      expect(template!.sections.length).toBeGreaterThan(0);
    });

    it("should return undefined for invalid ID", () => {
      const template = getTemplateById("nonexistent-template");
      expect(template).toBeUndefined();
    });
  });

  describe("matchTemplate", () => {
    it("should match 'Brand Guidelines' title to brand-guidelines template", () => {
      const template = matchTemplate("Brand Guidelines Document");
      expect(template).toBeDefined();
      expect(template!.id).toBe("brand_guidelines");
    });

    it("should match 'Brand Identity' title to brand-guidelines template", () => {
      const template = matchTemplate("Brand Identity Guidelines");
      expect(template).toBeDefined();
      expect(template!.id).toBe("brand_guidelines");
    });

    it("should match 'Strategy Deck' title to strategy-deck template", () => {
      const template = matchTemplate("Brand Strategy Deck");
      expect(template).toBeDefined();
      expect(template!.id).toBe("strategy_deck");
    });

    it("should match 'Social Media Calendar' to social-media-calendar template", () => {
      const template = matchTemplate("Social Media Content Calendar");
      expect(template).toBeDefined();
      expect(template!.id).toBe("social_media_calendar");
    });

    it("should match 'Brand Audit' to brand-audit template", () => {
      const template = matchTemplate("Brand Health Audit Report");
      expect(template).toBeDefined();
      expect(template!.id).toBe("brand_audit");
    });

    it("should match 'Business Model' to business-model template", () => {
      const template = matchTemplate("Business Model Analysis");
      expect(template).toBeDefined();
      expect(template!.id).toBe("business_model_analysis");
    });

    it("should match 'Messaging Framework' to messaging-framework template", () => {
      const template = matchTemplate("Brand Messaging Framework");
      expect(template).toBeDefined();
      expect(template!.id).toBe("messaging_framework");
    });

    it("should return null for unrecognized titles", () => {
      const template = matchTemplate("Random Unrelated Document XYZ 12345");
      expect(template).toBeNull();
    });

    it("should use description as fallback for matching", () => {
      const template = matchTemplate("Client Document", "This document contains brand guidelines and visual identity standards");
      expect(template).toBeDefined();
      expect(template!.id).toBe("brand_guidelines");
    });
  });

  describe("buildTemplatePrompt", () => {
    it("should build a prompt with all sections from the template", () => {
      const template = getTemplateById("brand_guidelines")!;
      const prompt = buildTemplatePrompt(template, {
        clientName: "Test Client",
        companyName: "Test Corp",
        industry: "Technology",
        market: "egypt",
      });

      expect(prompt).toContain("Test Client");
      expect(prompt).toContain("Test Corp");
      expect(prompt).toContain("Technology");
      // Should contain section titles
      template.sections.forEach((section) => {
        expect(prompt).toContain(section.title);
      });
    });

    it("should include notes when provided", () => {
      const template = getTemplateById("strategy_deck")!;
      const prompt = buildTemplatePrompt(template, {
        clientName: "Client A",
        notes: "Client wants premium positioning in luxury segment",
      });

      expect(prompt).toContain("premium positioning");
    });

    it("should include additional context when provided", () => {
      const template = getTemplateById("brand_audit")!;
      const prompt = buildTemplatePrompt(template, {
        clientName: "Client B",
        additionalContext: "Focus on digital presence and social media",
      });

      expect(prompt).toContain("digital presence");
    });

    it("should include required elements from each section", () => {
      const template = getTemplateById("brand_guidelines")!;
      const prompt = buildTemplatePrompt(template, {
        clientName: "Test",
      });

      // Each section should have its required elements mentioned
      template.sections.forEach((section) => {
        section.requiredElements.forEach((element) => {
          expect(prompt).toContain(element);
        });
      });
    });

    it("should produce different prompts for different templates", () => {
      const bg = getTemplateById("brand_guidelines")!;
      const smc = getTemplateById("social_media_calendar")!;
      const bgPrompt = buildTemplatePrompt(bg, { clientName: "X" });
      const smcPrompt = buildTemplatePrompt(smc, { clientName: "X" });
      expect(bgPrompt).not.toBe(smcPrompt);
    });
  });

  describe("generateSmartImagePrompts", () => {
    it("should generate image prompts for brand guidelines template", () => {
      const template = getTemplateById("brand_guidelines")!;
      const prompts = generateSmartImagePrompts(template, {
        companyName: "Acme Corp",
        industry: "Technology",
      });

      expect(prompts.length).toBeGreaterThan(0);
      expect(prompts.length).toBeLessThanOrEqual(5);
      prompts.forEach((p) => {
        expect(p.length).toBeGreaterThan(10);
        expect(typeof p).toBe("string");
      });
    });

    it("should replace placeholders in prompts with provided context", () => {
      const template = getTemplateById("brand_guidelines")!;
      const prompts = generateSmartImagePrompts(template, {
        companyName: "UniqueCompanyXYZ",
        industry: "FinTech",
        primaryColor: "emerald green",
      });

      const hasIndustry = prompts.some((p) => p.includes("FinTech"));
      expect(hasIndustry).toBe(true);
      const hasColor = prompts.some((p) => p.includes("emerald green"));
      expect(hasColor).toBe(true);
    });

    it("should generate different prompts for different templates", () => {
      const bgTemplate = getTemplateById("brand_guidelines")!;
      const smcTemplate = getTemplateById("social_media_calendar")!;

      const bgPrompts = generateSmartImagePrompts(bgTemplate, { companyName: "Test" });
      const smcPrompts = generateSmartImagePrompts(smcTemplate, { companyName: "Test" });

      expect(bgPrompts.join()).not.toBe(smcPrompts.join());
    });

    it("should generate prompts for all template types", () => {
      TEMPLATES.forEach((template) => {
        const prompts = generateSmartImagePrompts(template, { companyName: "Test" });
        expect(prompts.length).toBeGreaterThan(0);
      });
    });
  });

  describe("TEMPLATES structure validation", () => {
    it("each template should have unique ID", () => {
      const ids = TEMPLATES.map((t) => t.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it("each section should have title, description, and required elements", () => {
      TEMPLATES.forEach((template) => {
        template.sections.forEach((section) => {
          expect(section.title).toBeTruthy();
          expect(section.description).toBeTruthy();
          expect(section.requiredElements.length).toBeGreaterThan(0);
        });
      });
    });

    it("each section should have example output", () => {
      TEMPLATES.forEach((template) => {
        template.sections.forEach((section) => {
          expect(section.exampleOutput).toBeTruthy();
          expect(section.exampleOutput.length).toBeGreaterThan(10);
        });
      });
    });

    it("each template should have matchKeywords for matching", () => {
      TEMPLATES.forEach((template) => {
        expect(template.matchKeywords).toBeDefined();
        expect(template.matchKeywords.length).toBeGreaterThan(0);
      });
    });

    it("each template should have imagePromptTemplates", () => {
      TEMPLATES.forEach((template) => {
        expect(template.imagePromptTemplates).toBeDefined();
        expect(template.imagePromptTemplates.length).toBeGreaterThan(0);
      });
    });

    it("each template should have a valid pdfStyle", () => {
      const validStyles = ["report", "deck", "calendar", "brief"];
      TEMPLATES.forEach((template) => {
        expect(validStyles).toContain(template.pdfStyle);
      });
    });
  });
});
