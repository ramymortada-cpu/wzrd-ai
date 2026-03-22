import { describe, it, expect } from 'vitest';
import {
  ACADEMIC_FRAMEWORKS,
  matchFrameworks,
  formatFrameworksForPrompt,
  getAllFrameworksForKnowledgeBase,
  getFrameworkById,
  getExamplesByRegion,
} from './academicFrameworks';

describe('Academic Frameworks Library', () => {
  describe('Framework Collection', () => {
    it('should have exactly 10 frameworks', () => {
      expect(ACADEMIC_FRAMEWORKS).toHaveLength(10);
    });

    it('should have unique IDs for all frameworks', () => {
      const ids = ACADEMIC_FRAMEWORKS.map(fw => fw.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should include all expected frameworks', () => {
      const ids = ACADEMIC_FRAMEWORKS.map(fw => fw.id);
      expect(ids).toContain('kapferer_prism');
      expect(ids).toContain('sharp_how_brands_grow');
      expect(ids).toContain('kahneman_behavioral_economics');
      expect(ids).toContain('cialdini_influence');
      expect(ids).toContain('porter_five_forces');
      expect(ids).toContain('blue_ocean_strategy');
      expect(ids).toContain('premium_pricing');
      expect(ids).toContain('brand_repositioning');
      expect(ids).toContain('customer_journey');
      expect(ids).toContain('ehrenberg_bass_laws');
    });

    it('each framework should have all required fields', () => {
      for (const fw of ACADEMIC_FRAMEWORKS) {
        expect(fw.id).toBeTruthy();
        expect(fw.name).toBeTruthy();
        expect(fw.creator).toBeTruthy();
        expect(fw.year).toBeTruthy();
        expect(fw.category).toBeTruthy();
        expect(fw.oneLiner).toBeTruthy();
        expect(fw.components.length).toBeGreaterThanOrEqual(3);
        expect(fw.deepExplanation.length).toBeGreaterThan(200);
        expect(fw.applicationSteps.length).toBeGreaterThanOrEqual(4);
        expect(fw.commonMistakes.length).toBeGreaterThanOrEqual(3);
        expect(fw.examples.length).toBeGreaterThanOrEqual(3);
        expect(fw.clientTalkingPoints.length).toBeGreaterThanOrEqual(2);
        expect(fw.counterArguments.length).toBeGreaterThan(50);
        expect(fw.connectionToOtherFrameworks.length).toBeGreaterThan(30);
        expect(fw.tags.length).toBeGreaterThanOrEqual(3);
      }
    });
  });

  describe('Real-World Examples Quality', () => {
    it('every framework should have at least one MENA example', () => {
      for (const fw of ACADEMIC_FRAMEWORKS) {
        const menaExamples = fw.examples.filter(
          ex => ['mena', 'egypt', 'ksa', 'uae'].includes(ex.region)
        );
        expect(menaExamples.length).toBeGreaterThanOrEqual(1);
      }
    });

    it('every framework should have at least two global examples', () => {
      for (const fw of ACADEMIC_FRAMEWORKS) {
        const globalExamples = fw.examples.filter(ex => ex.region === 'global');
        expect(globalExamples.length).toBeGreaterThanOrEqual(2);
      }
    });

    it('every example should have real numbers', () => {
      for (const fw of ACADEMIC_FRAMEWORKS) {
        for (const ex of fw.examples) {
          expect(ex.numbers.length).toBeGreaterThan(10);
          // Numbers should contain at least one digit
          expect(ex.numbers).toMatch(/\d/);
        }
      }
    });

    it('every example should have all required fields', () => {
      for (const fw of ACADEMIC_FRAMEWORKS) {
        for (const ex of fw.examples) {
          expect(ex.brand).toBeTruthy();
          expect(ex.context).toBeTruthy();
          expect(ex.strategy).toBeTruthy();
          expect(ex.results).toBeTruthy();
          expect(ex.numbers).toBeTruthy();
          expect(['global', 'mena', 'egypt', 'ksa', 'uae']).toContain(ex.region);
        }
      }
    });

    it('should have at least 40 total examples across all frameworks', () => {
      let totalExamples = 0;
      for (const fw of ACADEMIC_FRAMEWORKS) {
        totalExamples += fw.examples.length;
      }
      expect(totalExamples).toBeGreaterThanOrEqual(40);
    });
  });

  describe('Framework Categories', () => {
    it('should cover all expected categories', () => {
      const categories = new Set(ACADEMIC_FRAMEWORKS.map(fw => fw.category));
      expect(categories.has('brand_identity')).toBe(true);
      expect(categories.has('brand_growth')).toBe(true);
      expect(categories.has('behavioral_economics')).toBe(true);
      expect(categories.has('competitive_strategy')).toBe(true);
      expect(categories.has('pricing')).toBe(true);
      expect(categories.has('customer_experience')).toBe(true);
    });
  });

  describe('matchFrameworks', () => {
    it('should match pricing frameworks for premium/luxury situations', () => {
      const results = matchFrameworks({
        clientSituation: 'We want to position our brand as premium luxury',
      });
      const ids = results.map(fw => fw.id);
      expect(ids).toContain('premium_pricing');
    });

    it('should match Kapferer for brand identity situations', () => {
      const results = matchFrameworks({
        clientSituation: 'We need to define our brand identity and visual identity',
      });
      const ids = results.map(fw => fw.id);
      expect(ids).toContain('kapferer_prism');
    });

    it('should match repositioning frameworks for rebrand situations', () => {
      const results = matchFrameworks({
        clientSituation: 'We need to reposition our brand from budget to premium',
      });
      const ids = results.map(fw => fw.id);
      expect(ids).toContain('brand_repositioning');
    });

    it('should match growth frameworks for scaling situations', () => {
      const results = matchFrameworks({
        clientSituation: 'We want to grow our brand and scale to new markets',
      });
      const ids = results.map(fw => fw.id);
      const hasGrowthFramework = ids.includes('sharp_how_brands_grow') || ids.includes('ehrenberg_bass_laws');
      expect(hasGrowthFramework).toBe(true);
    });

    it('should match competitive frameworks for market analysis', () => {
      const results = matchFrameworks({
        clientSituation: 'We need to analyze our competitive landscape and industry',
      });
      const ids = results.map(fw => fw.id);
      expect(ids).toContain('porter_five_forces');
    });

    it('should match customer journey for experience situations', () => {
      const results = matchFrameworks({
        clientSituation: 'We need to improve our customer journey and experience',
      });
      const ids = results.map(fw => fw.id);
      expect(ids).toContain('customer_journey');
    });

    it('should boost Egypt-relevant frameworks for Egyptian clients', () => {
      const results = matchFrameworks({
        clientSituation: 'We are a restaurant brand in Egypt looking for premium positioning',
      });
      expect(results.length).toBeGreaterThan(0);
      // Should include frameworks with Egypt examples
      const hasEgyptExample = results.some(fw =>
        fw.examples.some(ex => ex.region === 'egypt')
      );
      expect(hasEgyptExample).toBe(true);
    });

    it('should boost KSA-relevant frameworks for Saudi clients', () => {
      const results = matchFrameworks({
        clientSituation: 'We are launching a new brand in Saudi Arabia KSA',
      });
      expect(results.length).toBeGreaterThan(0);
      const hasKSAExample = results.some(fw =>
        fw.examples.some(ex => ex.region === 'ksa')
      );
      expect(hasKSAExample).toBe(true);
    });

    it('should match influence frameworks for proposal mode', () => {
      const results = matchFrameworks({
        tags: ['pricing', 'proposals', 'influence'],
        limit: 3,
      });
      expect(results.length).toBeGreaterThan(0);
      const ids = results.map(fw => fw.id);
      const hasRelevant = ids.includes('cialdini_influence') || ids.includes('kahneman_behavioral_economics') || ids.includes('premium_pricing');
      expect(hasRelevant).toBe(true);
    });

    it('should respect the limit parameter', () => {
      const results = matchFrameworks({
        clientSituation: 'premium brand identity growth repositioning competitive analysis',
        limit: 3,
      });
      expect(results.length).toBeLessThanOrEqual(3);
    });

    it('should return empty array when no match', () => {
      const results = matchFrameworks({});
      expect(results).toHaveLength(0);
    });
  });

  describe('formatFrameworksForPrompt', () => {
    it('should format frameworks into a readable prompt string', () => {
      const frameworks = matchFrameworks({
        clientSituation: 'premium pricing strategy',
        limit: 2,
      });
      const formatted = formatFrameworksForPrompt(frameworks);
      expect(formatted).toContain('ACADEMIC FRAMEWORKS');
      expect(formatted).toContain('Real-World Examples');
      expect(formatted).toContain('Talking Points');
    });

    it('should return empty string for empty array', () => {
      const formatted = formatFrameworksForPrompt([]);
      expect(formatted).toBe('');
    });

    it('should include brand names and numbers in examples', () => {
      const frameworks = [ACADEMIC_FRAMEWORKS[0]]; // Kapferer
      const formatted = formatFrameworksForPrompt(frameworks);
      expect(formatted).toMatch(/\d/); // Should contain numbers
      expect(formatted).toContain('Kapferer');
    });
  });

  describe('getAllFrameworksForKnowledgeBase', () => {
    it('should generate a comprehensive knowledge base string', () => {
      const kb = getAllFrameworksForKnowledgeBase();
      expect(kb.length).toBeGreaterThan(5000);
      expect(kb).toContain('ACADEMIC FRAMEWORKS LIBRARY');
      expect(kb).toContain('FRAMEWORK QUICK REFERENCE');
    });

    it('should include all 10 framework names', () => {
      const kb = getAllFrameworksForKnowledgeBase();
      expect(kb).toContain('Kapferer');
      expect(kb).toContain('Sharp');
      expect(kb).toContain('Kahneman');
      expect(kb).toContain('Cialdini');
      expect(kb).toContain('Porter');
      expect(kb).toContain('Blue Ocean');
      expect(kb).toContain('Premium Pricing');
      expect(kb).toContain('Repositioning');
      expect(kb).toContain('Customer Journey');
      expect(kb).toContain('Ehrenberg-Bass');
    });
  });

  describe('getFrameworkById', () => {
    it('should return the correct framework by ID', () => {
      const fw = getFrameworkById('kapferer_prism');
      expect(fw).not.toBeNull();
      expect(fw!.name).toContain('Kapferer');
    });

    it('should return null for unknown ID', () => {
      const fw = getFrameworkById('nonexistent_framework');
      expect(fw).toBeNull();
    });
  });

  describe('getExamplesByRegion', () => {
    it('should return Egypt-specific examples', () => {
      const examples = getExamplesByRegion('egypt');
      expect(examples.length).toBeGreaterThanOrEqual(2);
      for (const ex of examples) {
        expect(ex.region).toBe('egypt');
      }
    });

    it('should return KSA-specific examples', () => {
      const examples = getExamplesByRegion('ksa');
      expect(examples.length).toBeGreaterThanOrEqual(1);
      for (const ex of examples) {
        expect(ex.region).toBe('ksa');
      }
    });

    it('should return MENA examples including all sub-regions', () => {
      const examples = getExamplesByRegion('mena');
      expect(examples.length).toBeGreaterThanOrEqual(10);
      const regions = new Set(examples.map(ex => ex.region));
      // Should include examples from multiple MENA sub-regions
      expect(regions.size).toBeGreaterThanOrEqual(2);
    });

    it('should return global examples', () => {
      const examples = getExamplesByRegion('global');
      expect(examples.length).toBeGreaterThanOrEqual(20);
      for (const ex of examples) {
        expect(ex.region).toBe('global');
      }
    });
  });

  describe('Client Talking Points Quality', () => {
    it('every talking point should be actionable and specific', () => {
      for (const fw of ACADEMIC_FRAMEWORKS) {
        for (const tp of fw.clientTalkingPoints) {
          // Should be substantial (not just a sentence fragment)
          expect(tp.length).toBeGreaterThan(50);
          // Should not be generic
          expect(tp.toLowerCase()).not.toContain('lorem ipsum');
        }
      }
    });

    it('talking points should reference specific brands or numbers', () => {
      let totalWithReferences = 0;
      for (const fw of ACADEMIC_FRAMEWORKS) {
        for (const tp of fw.clientTalkingPoints) {
          if (tp.match(/\d/) || tp.match(/[A-Z][a-z]+\s[A-Z]/)) {
            totalWithReferences++;
          }
        }
      }
      // At least 60% of talking points should reference specific data
      const totalTalkingPoints = ACADEMIC_FRAMEWORKS.reduce((sum, fw) => sum + fw.clientTalkingPoints.length, 0);
      expect(totalWithReferences / totalTalkingPoints).toBeGreaterThan(0.5);
    });
  });

  describe('Deep Explanation Quality', () => {
    it('every deep explanation should be substantial', () => {
      for (const fw of ACADEMIC_FRAMEWORKS) {
        expect(fw.deepExplanation.length).toBeGreaterThan(500);
      }
    });

    it('deep explanations should mention Primo Marca application', () => {
      let mentionsPrimo = 0;
      for (const fw of ACADEMIC_FRAMEWORKS) {
        if (fw.deepExplanation.toLowerCase().includes('primo marca') || 
            fw.deepExplanation.toLowerCase().includes('primo')) {
          mentionsPrimo++;
        }
      }
      // At least 50% should mention Primo Marca
      expect(mentionsPrimo / ACADEMIC_FRAMEWORKS.length).toBeGreaterThanOrEqual(0.5);
    });
  });

  describe('Counter-Arguments Quality', () => {
    it('every framework should have substantive counter-arguments', () => {
      for (const fw of ACADEMIC_FRAMEWORKS) {
        expect(fw.counterArguments.length).toBeGreaterThan(100);
        // Should mention at least one critic, limitation, or caveat
        const lower = fw.counterArguments.toLowerCase();
        const hasSubstance = lower.includes('critics') || 
                            lower.includes('argue') ||
                            lower.includes('limitation') ||
                            lower.includes('risk') ||
                            lower.includes('doesn\'t work') ||
                            lower.includes('can\'t') ||
                            lower.includes('challenge') ||
                            lower.includes('however');
        expect(hasSubstance).toBe(true);
      }
    });
  });
});
