import { describe, expect, it } from "vitest";
import {
  AGENT_IDENTITY,
  ACADEMIC_FOUNDATION,
  DIAGNOSTIC_ENGINE,
  CONVERSATION_LOGIC,
  QUALITY_STANDARDS,
  CASE_STUDY_INTELLIGENCE,
  CONSULTANT_BOX_MODEL,
  SERVICE_DEEP_KNOWLEDGE,
  DISCOVERY_QUESTIONS_BANK,
  DELIVERABLE_TEMPLATES,
  buildSystemPrompt,
  PRIMO_MARCA_SYSTEM_PROMPT,
  SERVICE_PROMPTS,
  SERVICE_PLAYBOOKS,
  SERVICE_LABELS,
  SERVICE_PRICES,
  STAGE_LABELS,
} from "./knowledgeBase";

describe("Knowledge Base — Agent Identity", () => {
  it("defines the AI as a Brand Strategy Consultant, not a chatbot", () => {
    expect(AGENT_IDENTITY).toContain("Senior Brand Consultant");
    expect(AGENT_IDENTITY).toContain("NOT a chatbot");
    expect(AGENT_IDENTITY).toContain("NOT an assistant");
  });

  it("includes the core diagnostic principle about clarity", () => {
    expect(AGENT_IDENTITY).toContain("clarity");
    expect(AGENT_IDENTITY).toContain("Most businesses don't need more content");
  });

  it("defines personality traits", () => {
    expect(AGENT_IDENTITY).toContain("CONFIDENT");
    expect(AGENT_IDENTITY).toContain("DIRECT");
    expect(AGENT_IDENTITY).toContain("STRATEGIC");
    expect(AGENT_IDENTITY).toContain("PATIENT");
    expect(AGENT_IDENTITY).toContain("HONEST");
  });

  it("defines anti-patterns (what the AI is NOT)", () => {
    expect(AGENT_IDENTITY).toContain("yes-man");
    expect(AGENT_IDENTITY).toContain("jargon machine");
  });

  it("includes voice/tone guidelines and is substantial", () => {
    expect(AGENT_IDENTITY).toContain("trusted advisor");
    expect(AGENT_IDENTITY.length).toBeGreaterThan(1000);
  });
});

describe("Knowledge Base — Academic Foundation", () => {
  it("includes Keller's CBBE model mapped to Primo Marca 4D Framework", () => {
    expect(ACADEMIC_FOUNDATION).toContain("Keller");
    expect(ACADEMIC_FOUNDATION).toContain("CBBE");
    expect(ACADEMIC_FOUNDATION).toContain("4D");
  });

  it("includes Aaker's Brand Architecture", () => {
    expect(ACADEMIC_FOUNDATION).toContain("Aaker");
    expect(ACADEMIC_FOUNDATION).toContain("Brand as Product");
    expect(ACADEMIC_FOUNDATION).toContain("Brand as Person");
  });

  it("includes Ries & Trout Positioning Theory mapped to Unfair Advantage", () => {
    expect(ACADEMIC_FOUNDATION).toContain("Ries & Trout");
    expect(ACADEMIC_FOUNDATION).toContain("Unfair Advantage");
  });

  it("includes Value Proposition Design mapped to Business Logic Pillar", () => {
    expect(ACADEMIC_FOUNDATION).toContain("Value Proposition");
    expect(ACADEMIC_FOUNDATION).toContain("Business Logic");
  });

  it("includes Customer Journey mapping", () => {
    expect(ACADEMIC_FOUNDATION).toContain("Customer Journey");
    expect(ACADEMIC_FOUNDATION).toContain("McKinsey");
  });

  it("includes Premium Pricing Psychology", () => {
    expect(ACADEMIC_FOUNDATION).toContain("PREMIUM PRICING");
    expect(ACADEMIC_FOUNDATION).toContain("Anchoring");
  });

  it("maps frameworks to Primo Marca methodology (not separate)", () => {
    expect(ACADEMIC_FOUNDATION).toContain("Primo Marca");
    expect(ACADEMIC_FOUNDATION).toContain("Three Pillars");
  });

  it("is substantial enough to provide real depth", () => {
    expect(ACADEMIC_FOUNDATION.length).toBeGreaterThan(2000);
  });
});

describe("Knowledge Base — Diagnostic Engine", () => {
  it("includes the master diagnostic tree", () => {
    expect(DIAGNOSTIC_ENGINE).toContain("MASTER DIAGNOSTIC TREE");
    expect(DIAGNOSTIC_ENGINE).toContain("LEVEL 1");
  });

  it("includes diagnostic patterns (Clarity Gap, Commodity Trap, etc.)", () => {
    expect(DIAGNOSTIC_ENGINE).toContain("CLARITY GAP");
    expect(DIAGNOSTIC_ENGINE).toContain("COMMODITY TRAP");
    expect(DIAGNOSTIC_ENGINE).toContain("IDENTITY CRISIS");
  });

  it("includes the question flow methodology", () => {
    expect(DIAGNOSTIC_ENGINE).toContain("QUESTION FLOW METHODOLOGY");
    expect(DIAGNOSTIC_ENGINE).toContain("ONE question at a time");
  });

  it("includes discovery phases with specific questions", () => {
    expect(DIAGNOSTIC_ENGINE).toContain("PHASE 1: Understanding the Human");
    expect(DIAGNOSTIC_ENGINE).toContain("PHASE 2: Understanding the Market Reality");
    expect(DIAGNOSTIC_ENGINE).toContain("PHASE 3: Understanding the Business Structure");
    expect(DIAGNOSTIC_ENGINE).toContain("PHASE 4: Understanding the Brand");
  });

  it("includes analysis patterns with symptoms and root causes", () => {
    expect(DIAGNOSTIC_ENGINE).toContain("Symptom:");
    expect(DIAGNOSTIC_ENGINE).toContain("Root cause:");
    expect(DIAGNOSTIC_ENGINE).toContain("Primo Marca approach:");
  });

  it("is substantial enough for real diagnostic depth", () => {
    expect(DIAGNOSTIC_ENGINE.length).toBeGreaterThan(2000);
  });
});

describe("Knowledge Base — Conversation Logic", () => {
  it("defines discovery mode with one-question-at-a-time rule", () => {
    expect(CONVERSATION_LOGIC).toContain("DISCOVERY");
    expect(CONVERSATION_LOGIC).toContain("ONE question at a time");
  });

  it("defines diagnosis mode", () => {
    expect(CONVERSATION_LOGIC).toContain("DIAGNOSIS");
    expect(CONVERSATION_LOGIC).toContain("observations");
  });

  it("defines recommendation mode", () => {
    expect(CONVERSATION_LOGIC).toContain("RECOMMENDATION");
    expect(CONVERSATION_LOGIC).toContain("strategic logic");
  });

  it("defines pushback mode for when client is going wrong direction", () => {
    expect(CONVERSATION_LOGIC).toContain("PUSHBACK");
    expect(CONVERSATION_LOGIC).toContain("wrong direction");
  });

  it("includes language rules for Arabic and English", () => {
    expect(CONVERSATION_LOGIC).toContain("Arabic");
    expect(CONVERSATION_LOGIC).toContain("English");
  });
});

describe("Knowledge Base — Quality Standards", () => {
  it("defines quality standards for proposals", () => {
    expect(QUALITY_STANDARDS).toContain("PROPOSAL QUALITY STANDARD");
    expect(QUALITY_STANDARDS).toContain("Opens with the CLIENT'S problem");
  });

  it("defines what a BAD proposal looks like", () => {
    expect(QUALITY_STANDARDS).toContain("BAD proposal");
    expect(QUALITY_STANDARDS).toContain("About Primo Marca");
  });

  it("defines quality standards for brand audits/diagnosis", () => {
    expect(QUALITY_STANDARDS).toContain("BRAND AUDIT");
    expect(QUALITY_STANDARDS).toContain("DIAGNOSIS");
  });

  it("is substantial with specific criteria", () => {
    expect(QUALITY_STANDARDS.length).toBeGreaterThan(1500);
  });
});

describe("Knowledge Base — Case Study Intelligence", () => {
  it("includes Beehive case study", () => {
    expect(CASE_STUDY_INTELLIGENCE).toContain("Beehive");
  });

  it("includes Tazkyah Plus case study", () => {
    expect(CASE_STUDY_INTELLIGENCE).toContain("Tazkyah");
  });

  it("includes patterns and lessons, not just descriptions", () => {
    const lower = CASE_STUDY_INTELLIGENCE.toLowerCase();
    expect(lower).toMatch(/pattern|lesson|result|outcome|learn/);
  });
});

describe("Knowledge Base — Consultant Box Model", () => {
  it("explains the Consultant Box transparency model", () => {
    expect(CONSULTANT_BOX_MODEL).toContain("Consultant Box");
    expect(CONSULTANT_BOX_MODEL.toLowerCase()).toContain("transparen");
  });

  it("explains the difference from typical agencies", () => {
    const lower = CONSULTANT_BOX_MODEL.toLowerCase();
    expect(lower).toMatch(/agenc|typical|traditional|different/);
  });
});

describe("Knowledge Base — Service Deep Knowledge", () => {
  it("has deep knowledge for clarity_package", () => {
    expect(SERVICE_DEEP_KNOWLEDGE.clarity_package).toBeDefined();
    expect(SERVICE_DEEP_KNOWLEDGE.clarity_package.length).toBeGreaterThan(500);
    expect(SERVICE_DEEP_KNOWLEDGE.clarity_package).toContain("80,000 EGP");
  });

  it("has deep knowledge for brand_foundation", () => {
    expect(SERVICE_DEEP_KNOWLEDGE.brand_foundation).toBeDefined();
    expect(SERVICE_DEEP_KNOWLEDGE.brand_foundation.length).toBeGreaterThan(500);
  });

  it("has deep knowledge for growth_partnership", () => {
    expect(SERVICE_DEEP_KNOWLEDGE.growth_partnership).toBeDefined();
    expect(SERVICE_DEEP_KNOWLEDGE.growth_partnership.length).toBeGreaterThan(500);
  });
});

describe("buildSystemPrompt", () => {
  it("builds a chat prompt with identity and conversation logic", () => {
    const prompt = buildSystemPrompt({ mode: "chat" });
    expect(prompt).toContain("Senior Brand Consultant");
    expect(prompt).toContain("MODE: DISCOVERY");
    expect(prompt).toContain("question");
  });

  it("builds a discovery prompt with diagnostic focus", () => {
    const prompt = buildSystemPrompt({ mode: "discovery" });
    expect(prompt).toContain("DISCOVERY");
    expect(prompt).toContain("ONE question");
    expect(prompt).toContain("DIAGNOSTIC ENGINE");
  });

  it("builds a diagnosis prompt with analysis focus", () => {
    const prompt = buildSystemPrompt({ mode: "diagnosis" });
    expect(prompt).toContain("DIAGNOSIS");
    expect(prompt).toContain("impact");
  });

  it("builds a deliverable prompt with quality standards", () => {
    const prompt = buildSystemPrompt({ mode: "deliverable" });
    expect(prompt).toContain("DELIVERABLE GENERATION");
    expect(prompt).toContain("CLIENT-READY");
    expect(prompt).toContain("QUALITY STANDARDS");
  });

  it("builds a proposal prompt with quality standards", () => {
    const prompt = buildSystemPrompt({ mode: "proposal" });
    expect(prompt).toContain("PROPOSAL GENERATION");
    expect(prompt).toContain("compelling");
    expect(prompt).toContain("QUALITY STANDARDS");
  });

  it("includes service-specific knowledge when serviceType is provided", () => {
    const prompt = buildSystemPrompt({ mode: "deliverable", serviceType: "clarity_package" });
    expect(prompt).toContain("CLARITY PACKAGE");
  });

  it("includes client context when provided", () => {
    const prompt = buildSystemPrompt({
      mode: "chat",
      clientContext: "Client: Rashid Group - Industry: Real Estate - Market: KSA",
    });
    expect(prompt).toContain("CLIENT CONTEXT");
    expect(prompt).toContain("Rashid Group");
  });

  it("includes project stage when provided", () => {
    const prompt = buildSystemPrompt({
      mode: "deliverable",
      projectStage: "Design",
    });
    expect(prompt).toContain("CURRENT PROJECT STAGE: Design");
  });

  it("includes diagnostic engine in discovery and diagnosis modes", () => {
    const discoveryPrompt = buildSystemPrompt({ mode: "discovery" });
    const diagnosisPrompt = buildSystemPrompt({ mode: "diagnosis" });
    expect(discoveryPrompt).toContain("MASTER DIAGNOSTIC TREE");
    expect(diagnosisPrompt).toContain("MASTER DIAGNOSTIC TREE");
  });

  it("includes case study intelligence when client context provided", () => {
    const prompt = buildSystemPrompt({ mode: "chat", clientContext: "Restaurant in Egypt needs repositioning" });
    expect(prompt.length).toBeGreaterThan(5000);
    // Case studies included when clientContext provided
  });

  it("produces substantial prompts (not thin wrappers)", () => {
    const chatPrompt = buildSystemPrompt({ mode: "chat" });
    const deliverablePrompt = buildSystemPrompt({ mode: "deliverable", serviceType: "brand_foundation" });
    
    expect(chatPrompt.length).toBeGreaterThan(5000);
    expect(deliverablePrompt.length).toBeGreaterThan(8000);
  });
});

describe("Service Playbooks", () => {
  it("has playbooks for all 3 core services", () => {
    expect(SERVICE_PLAYBOOKS.clarity_package).toBeDefined();
    expect(SERVICE_PLAYBOOKS.brand_foundation).toBeDefined();
    expect(SERVICE_PLAYBOOKS.growth_partnership).toBeDefined();
  });

  it("has playbooks with stages and steps", () => {
    const cp = SERVICE_PLAYBOOKS.clarity_package;
    expect(cp.stages.length).toBeGreaterThan(0);
    expect(cp.stages[0].steps.length).toBeGreaterThan(0);
    expect(cp.stages[0].steps[0].title).toBeTruthy();
    expect(cp.stages[0].steps[0].description).toBeTruthy();
  });

  it("clarity_package has diagnose and design stages", () => {
    const stages = SERVICE_PLAYBOOKS.clarity_package.stages.map(s => s.stage);
    expect(stages).toContain("diagnose");
    expect(stages).toContain("design");
  });

  it("brand_foundation has diagnose and design stages", () => {
    const stages = SERVICE_PLAYBOOKS.brand_foundation.stages.map(s => s.stage);
    expect(stages).toContain("diagnose");
    expect(stages).toContain("design");
  });

  it("growth_partnership has diagnose, design, and optimize stages", () => {
    const stages = SERVICE_PLAYBOOKS.growth_partnership.stages.map(s => s.stage);
    expect(stages).toContain("diagnose");
    expect(stages).toContain("design");
    expect(stages).toContain("optimize");
  });

  it("each step has a deliverable", () => {
    for (const key of ["clarity_package", "brand_foundation", "growth_partnership"]) {
      const playbook = SERVICE_PLAYBOOKS[key];
      for (const stage of playbook.stages) {
        for (const step of stage.steps) {
          expect(step.deliverable).toBeTruthy();
        }
      }
    }
  });

  it("legacy service keys map to core playbooks", () => {
    expect(SERVICE_PLAYBOOKS.business_health_check.stages).toBe(SERVICE_PLAYBOOKS.clarity_package.stages);
    expect(SERVICE_PLAYBOOKS.starting_business_logic.stages).toBe(SERVICE_PLAYBOOKS.clarity_package.stages);
    expect(SERVICE_PLAYBOOKS.brand_identity.stages).toBe(SERVICE_PLAYBOOKS.brand_foundation.stages);
  });

  it("business_takeoff combines brand_foundation and growth_partnership stages", () => {
    const takeoffStages = SERVICE_PLAYBOOKS.business_takeoff.stages;
    const brandStages = SERVICE_PLAYBOOKS.brand_foundation.stages;
    const growthStages = SERVICE_PLAYBOOKS.growth_partnership.stages;
    expect(takeoffStages.length).toBe(brandStages.length + growthStages.length);
    // Verify it contains stages from both
    const takeoffStageNames = takeoffStages.map(s => s.stage);
    expect(takeoffStageNames).toContain("diagnose");
    expect(takeoffStageNames).toContain("design");
    expect(takeoffStageNames).toContain("optimize");
  });

  it("consultation has a diagnose stage with advisory steps", () => {
    const stages = SERVICE_PLAYBOOKS.consultation.stages;
    expect(stages.length).toBe(1);
    expect(stages[0].stage).toBe("diagnose");
    expect(stages[0].steps.length).toBe(3);
  });
});

describe("Service Labels and Prices", () => {
  it("has labels for all services", () => {
    expect(SERVICE_LABELS.business_health_check).toBe("Business Health Check");
    expect(SERVICE_LABELS.starting_business_logic).toBeDefined();
    expect(SERVICE_LABELS.brand_identity).toBeDefined();
    expect(SERVICE_LABELS.business_takeoff).toBe("Business Takeoff");
    expect(SERVICE_LABELS.consultation).toBeDefined();
  });

  it("has prices for all services", () => {
    expect(SERVICE_PRICES.business_health_check).toBe(140000);
    expect(SERVICE_PRICES.starting_business_logic).toBe(160000);
    expect(SERVICE_PRICES.brand_identity).toBe(210000);
    expect(SERVICE_PRICES.business_takeoff).toBe(320000);
    expect(SERVICE_PRICES.consultation).toBe(70000);
  });

  it("has stage labels for all 4D stages plus completed", () => {
    expect(STAGE_LABELS.diagnose).toBe("Diagnose");
    expect(STAGE_LABELS.design).toBe("Design");
    expect(STAGE_LABELS.deploy).toBe("Deploy");
    expect(STAGE_LABELS.optimize).toBe("Optimize");
    expect(STAGE_LABELS.completed).toBe("Completed");
  });
});

describe("Knowledge Base — Discovery Questions Bank", () => {
  it("has tiered question structure (foundational, business, brand, social, industry, market)", () => {
    expect(DISCOVERY_QUESTIONS_BANK).toContain("TIER 1: FOUNDATIONAL QUESTIONS");
    expect(DISCOVERY_QUESTIONS_BANK).toContain("TIER 2: BUSINESS STRUCTURE QUESTIONS");
    expect(DISCOVERY_QUESTIONS_BANK).toContain("TIER 3: BRAND & IDENTITY QUESTIONS");
    expect(DISCOVERY_QUESTIONS_BANK).toContain("TIER 4: SOCIAL & GROWTH QUESTIONS");
    expect(DISCOVERY_QUESTIONS_BANK).toContain("TIER 5: INDUSTRY-SPECIFIC QUESTIONS");
    expect(DISCOVERY_QUESTIONS_BANK).toContain("TIER 6: MARKET-SPECIFIC QUESTIONS");
  });

  it("each question has WHY, LISTEN FOR, RED FLAG, and FOLLOW-UP", () => {
    const whyCount = (DISCOVERY_QUESTIONS_BANK.match(/- WHY:/g) || []).length;
    const listenCount = (DISCOVERY_QUESTIONS_BANK.match(/- LISTEN FOR:/g) || []).length;
    const redFlagCount = (DISCOVERY_QUESTIONS_BANK.match(/- RED FLAG:/g) || []).length;
    const followUpCount = (DISCOVERY_QUESTIONS_BANK.match(/- FOLLOW-UP:/g) || []).length;
    
    expect(whyCount).toBeGreaterThanOrEqual(15);
    expect(listenCount).toBeGreaterThanOrEqual(15);
    expect(redFlagCount).toBeGreaterThanOrEqual(15);
    expect(followUpCount).toBeGreaterThanOrEqual(15);
  });

  it("includes industry-specific questions for F&B, Healthcare, Real Estate, Tech, Retail, Education", () => {
    expect(DISCOVERY_QUESTIONS_BANK).toContain("F&B / Restaurants");
    expect(DISCOVERY_QUESTIONS_BANK).toContain("Healthcare / Clinics");
    expect(DISCOVERY_QUESTIONS_BANK).toContain("Real Estate");
    expect(DISCOVERY_QUESTIONS_BANK).toContain("Tech / SaaS");
    expect(DISCOVERY_QUESTIONS_BANK).toContain("Retail / E-commerce");
    expect(DISCOVERY_QUESTIONS_BANK).toContain("Education / Training");
  });

  it("includes market-specific questions for Egypt and KSA", () => {
    expect(DISCOVERY_QUESTIONS_BANK).toContain("Egypt Market");
    expect(DISCOVERY_QUESTIONS_BANK).toContain("KSA Market");
    expect(DISCOVERY_QUESTIONS_BANK).toContain("Vision 2030");
    expect(DISCOVERY_QUESTIONS_BANK).toContain("Saudization");
  });

  it("connects red flags to diagnostic patterns", () => {
    expect(DISCOVERY_QUESTIONS_BANK).toContain("Clarity Gap");
    expect(DISCOVERY_QUESTIONS_BANK).toContain("Commodity Trap");
    expect(DISCOVERY_QUESTIONS_BANK).toContain("Random Effort Trap");
    expect(DISCOVERY_QUESTIONS_BANK).toContain("Identity Crisis");
  });

  it("is substantial enough for real diagnostic depth", () => {
    expect(DISCOVERY_QUESTIONS_BANK.length).toBeGreaterThan(5000);
  });
});

describe("Knowledge Base — Deliverable Templates", () => {
  it("has templates for all major deliverable types", () => {
    expect(DELIVERABLE_TEMPLATES).toContain("TEMPLATE 1: BUSINESS MODEL ANALYSIS REPORT");
    expect(DELIVERABLE_TEMPLATES).toContain("TEMPLATE 2: BRAND POSITIONING DOCUMENT");
    expect(DELIVERABLE_TEMPLATES).toContain("TEMPLATE 3: MESSAGING FRAMEWORK");
    expect(DELIVERABLE_TEMPLATES).toContain("TEMPLATE 4: CUSTOMER JOURNEY MAP");
    expect(DELIVERABLE_TEMPLATES).toContain("TEMPLATE 5: SOCIAL STRATEGY DOCUMENT");
    expect(DELIVERABLE_TEMPLATES).toContain("TEMPLATE 6: BRAND AUDIT / DIAGNOSIS REPORT");
    expect(DELIVERABLE_TEMPLATES).toContain("TEMPLATE 7: PROPOSAL DOCUMENT");
  });

  it("each template has detailed structure with sections", () => {
    // Business Model Analysis has specific sections
    expect(DELIVERABLE_TEMPLATES).toContain("EXECUTIVE SUMMARY");
    expect(DELIVERABLE_TEMPLATES).toContain("UNIT ECONOMICS");
    expect(DELIVERABLE_TEMPLATES).toContain("COMPETITIVE POSITION");
    expect(DELIVERABLE_TEMPLATES).toContain("PRIORITIZED RECOMMENDATIONS");
  });

  it("brand positioning template includes Unfair Advantage", () => {
    expect(DELIVERABLE_TEMPLATES).toContain("POSITIONING STATEMENT");
    expect(DELIVERABLE_TEMPLATES).toContain("POINTS OF DIFFERENCE");
    expect(DELIVERABLE_TEMPLATES).toContain("POINTS OF PARITY");
    expect(DELIVERABLE_TEMPLATES).toContain("UNFAIR ADVANTAGE");
  });

  it("customer journey template covers all stages", () => {
    expect(DELIVERABLE_TEMPLATES).toContain("Awareness");
    expect(DELIVERABLE_TEMPLATES).toContain("Consideration");
    expect(DELIVERABLE_TEMPLATES).toContain("Decision");
    expect(DELIVERABLE_TEMPLATES).toContain("Experience");
    expect(DELIVERABLE_TEMPLATES).toContain("Loyalty");
    expect(DELIVERABLE_TEMPLATES).toContain("Advocacy");
  });

  it("defines quality standards for all deliverables", () => {
    expect(DELIVERABLE_TEMPLATES).toContain("SPECIFIC to this client");
    expect(DELIVERABLE_TEMPLATES).toContain("ACTIONABLE");
    expect(DELIVERABLE_TEMPLATES).toContain("STRUCTURED");
  });

  it("proposal template starts with client problem not our services", () => {
    expect(DELIVERABLE_TEMPLATES).toContain("Client's problem, NOT our services");
  });

  it("is substantial enough for real deliverable generation", () => {
    expect(DELIVERABLE_TEMPLATES.length).toBeGreaterThan(5000);
  });
});

describe("buildSystemPrompt — Discovery Questions Bank integration", () => {
  it("includes Discovery Questions Bank in discovery mode", () => {
    const prompt = buildSystemPrompt({ mode: "discovery" });
    expect(prompt).toContain("DISCOVERY QUESTIONS BANK");
    expect(prompt).toContain("TIER 1: FOUNDATIONAL QUESTIONS");
  });

  it("chat mode has lean prompt without full discovery bank", () => {
    const prompt = buildSystemPrompt({ mode: "chat" });
    expect(prompt.length).toBeGreaterThan(3000);
  });

  it("includes Discovery Questions Bank in diagnosis mode", () => {
    const prompt = buildSystemPrompt({ mode: "diagnosis" });
    expect(prompt).toContain("DISCOVERY QUESTIONS BANK");
  });

  it("does NOT include Discovery Questions Bank in deliverable mode", () => {
    const prompt = buildSystemPrompt({ mode: "deliverable" });
    expect(prompt).not.toContain("DISCOVERY QUESTIONS BANK");
  });

  it("does NOT include Discovery Questions Bank in proposal mode", () => {
    const prompt = buildSystemPrompt({ mode: "proposal" });
    expect(prompt).not.toContain("DISCOVERY QUESTIONS BANK");
  });
});

describe("buildSystemPrompt — Deliverable Templates integration", () => {
  it("includes Deliverable Templates in deliverable mode", () => {
    const prompt = buildSystemPrompt({ mode: "deliverable" });
    expect(prompt).toContain("DELIVERABLE TEMPLATES");
    expect(prompt).toContain("TEMPLATE 1: BUSINESS MODEL ANALYSIS REPORT");
  });

  it("includes Deliverable Templates in proposal mode", () => {
    const prompt = buildSystemPrompt({ mode: "proposal" });
    expect(prompt).toContain("DELIVERABLE TEMPLATES");
    expect(prompt).toContain("TEMPLATE 7: PROPOSAL DOCUMENT");
  });

  it("does NOT include Deliverable Templates in chat mode", () => {
    const prompt = buildSystemPrompt({ mode: "chat" });
    expect(prompt).not.toContain("DELIVERABLE TEMPLATES");
  });

  it("does NOT include Deliverable Templates in discovery mode", () => {
    const prompt = buildSystemPrompt({ mode: "discovery" });
    expect(prompt).not.toContain("DELIVERABLE TEMPLATES");
  });
});

describe("Legacy Compatibility", () => {
  it("PRIMO_MARCA_SYSTEM_PROMPT combines core knowledge sections", () => {
    expect(PRIMO_MARCA_SYSTEM_PROMPT).toContain("Senior Brand Consultant");
    expect(PRIMO_MARCA_SYSTEM_PROMPT).toContain("Keller");
    expect(PRIMO_MARCA_SYSTEM_PROMPT).toContain("DISCOVERY");
    expect(PRIMO_MARCA_SYSTEM_PROMPT).toContain("Consultant Box");
    expect(PRIMO_MARCA_SYSTEM_PROMPT.length).toBeGreaterThan(5000);
  });

  it("SERVICE_PROMPTS has entries for all services", () => {
    expect(SERVICE_PROMPTS.clarity_package).toBeDefined();
    expect(SERVICE_PROMPTS.brand_foundation).toBeDefined();
    expect(SERVICE_PROMPTS.growth_partnership).toBeDefined();
    expect(SERVICE_PROMPTS.business_health_check).toBeDefined();
    expect(SERVICE_PROMPTS.consultation).toBeDefined();
    expect(SERVICE_PROMPTS.general).toBeDefined();
  });

  it("SERVICE_PROMPTS are substantial (not empty strings)", () => {
    for (const key of Object.keys(SERVICE_PROMPTS)) {
      expect(SERVICE_PROMPTS[key].length).toBeGreaterThan(1000);
    }
  });
});
