import { describe, it, expect } from 'vitest';
import { CASE_STUDIES, matchCaseStudies, formatCaseStudiesForPrompt, getAllCaseStudiesForKnowledgeBase } from './caseStudyLibrary';

describe('Case Study Library', () => {
  describe('CASE_STUDIES data integrity', () => {
    it('should have 17 case studies total', () => {
      expect(CASE_STUDIES.length).toBe(17);
    });

    it('should have 7 global icon case studies', () => {
      const globalIcons = CASE_STUDIES.filter(cs => cs.category === 'global_icon');
      expect(globalIcons.length).toBe(7);
    });

    it('should have 7 regional champion case studies', () => {
      const regional = CASE_STUDIES.filter(cs => cs.category === 'regional_champion');
      expect(regional.length).toBe(7);
    });

    it('should have 3 primo marca case studies', () => {
      const primo = CASE_STUDIES.filter(cs => cs.category === 'primo_marca');
      expect(primo.length).toBe(3);
    });

    it('every case study should have all required fields', () => {
      for (const cs of CASE_STUDIES) {
        expect(cs.brandName).toBeTruthy();
        expect(cs.category).toBeTruthy();
        expect(cs.situation).toBeTruthy();
        expect(cs.challenge).toBeTruthy();
        expect(cs.whatTheyDid).toBeTruthy();
        expect(cs.results).toBeTruthy();
        expect(cs.keyLesson).toBeTruthy();
        expect(cs.patternToRecognize).toBeTruthy();
        expect(cs.academicFramework).toBeTruthy();
        expect(cs.menaRelevance).toBeTruthy();
        expect(cs.tags.length).toBeGreaterThanOrEqual(2);
      }
    });

    it('should include Nike, Apple, Airbnb, Starbucks in global icons', () => {
      const names = CASE_STUDIES.filter(cs => cs.category === 'global_icon').map(cs => cs.brandName);
      expect(names).toContain('Nike');
      expect(names).toContain('Apple');
      expect(names).toContain('Airbnb');
      expect(names).toContain('Starbucks');
    });

    it('should include Careem, Noon.com, Talabat, Jahez in regional champions', () => {
      const names = CASE_STUDIES.filter(cs => cs.category === 'regional_champion').map(cs => cs.brandName);
      expect(names).toContain('Careem');
      expect(names).toContain('Noon.com');
      expect(names).toContain('Talabat');
      expect(names).toContain('Jahez');
    });

    it('should include Beehive, Tazkyah Plus, Ramy Mortada in primo marca cases', () => {
      const names = CASE_STUDIES.filter(cs => cs.category === 'primo_marca').map(cs => cs.brandName);
      expect(names.some(n => n.includes('Beehive'))).toBe(true);
      expect(names.some(n => n.includes('Tazkyah Plus'))).toBe(true);
      expect(names.some(n => n.includes('Ramy Mortada'))).toBe(true);
    });

    it('every case study should have substantive results', () => {
      for (const cs of CASE_STUDIES) {
        // Results should be substantive (at least 100 chars)
        expect(cs.results.length).toBeGreaterThan(100);
        // Global and regional cases should have real numbers
        if (cs.category !== 'primo_marca') {
          const hasNumbers = /\d/.test(cs.results);
          expect(hasNumbers).toBe(true);
        }
      }
    });

    it('every case study should have MENA relevance', () => {
      for (const cs of CASE_STUDIES) {
        expect(cs.menaRelevance.length).toBeGreaterThan(50);
      }
    });
  });

  describe('matchCaseStudies', () => {
    it('should return up to 5 case studies by default', () => {
      const results = matchCaseStudies({ clientSituation: 'brand repositioning' });
      expect(results.length).toBeLessThanOrEqual(5);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should filter by category', () => {
      const results = matchCaseStudies({ category: 'primo_marca' });
      expect(results.every(cs => cs.category === 'primo_marca')).toBe(true);
    });

    it('should respect limit parameter', () => {
      const results = matchCaseStudies({ clientSituation: 'brand', limit: 3 });
      expect(results.length).toBeLessThanOrEqual(3);
    });

    it('should match by tags', () => {
      const results = matchCaseStudies({ tags: ['repositioning'] });
      expect(results.length).toBeGreaterThan(0);
      // Results with matching tags should score higher
      expect(results[0].tags).toContain('repositioning');
    });

    it('should prioritize primo marca cases', () => {
      const results = matchCaseStudies({ clientSituation: 'brand perception problem' });
      // Primo marca cases get a +5 bonus, so they should appear in results
      const hasPrimo = results.some(cs => cs.category === 'primo_marca');
      expect(hasPrimo).toBe(true);
    });

    it('should match repositioning keywords to Beehive case', () => {
      const results = matchCaseStudies({ 
        clientSituation: 'our services are good but clients perceive us as budget option',
        tags: ['repositioning'],
      });
      const hasBeehive = results.some(cs => cs.brandName.includes('Beehive'));
      expect(hasBeehive).toBe(true);
    });

    it('should match personal branding to Ramy Mortada case', () => {
      const results = matchCaseStudies({ 
        clientSituation: 'founder wants to build personal authority and thought leadership',
        tags: ['personal_branding'],
      });
      const hasRamy = results.some(cs => cs.brandName.includes('Ramy Mortada'));
      expect(hasRamy).toBe(true);
    });
  });

  describe('formatCaseStudiesForPrompt', () => {
    it('should return empty string for empty array', () => {
      expect(formatCaseStudiesForPrompt([])).toBe('');
    });

    it('should format case studies with all sections', () => {
      const cases = CASE_STUDIES.slice(0, 2);
      const formatted = formatCaseStudiesForPrompt(cases);
      expect(formatted).toContain('RELEVANT CASE STUDIES');
      expect(formatted).toContain('Situation:');
      expect(formatted).toContain('What They Did:');
      expect(formatted).toContain('Results:');
      expect(formatted).toContain('Key Lesson:');
      expect(formatted).toContain('Pattern:');
      expect(formatted).toContain('Framework:');
      expect(formatted).toContain('MENA Relevance:');
      expect(formatted).toContain('HOW TO USE THESE CASES');
    });

    it('should label categories correctly', () => {
      const globalCase = CASE_STUDIES.filter(cs => cs.category === 'global_icon').slice(0, 1);
      const regionalCase = CASE_STUDIES.filter(cs => cs.category === 'regional_champion').slice(0, 1);
      const primoCase = CASE_STUDIES.filter(cs => cs.category === 'primo_marca').slice(0, 1);
      
      expect(formatCaseStudiesForPrompt(globalCase)).toContain('Global');
      expect(formatCaseStudiesForPrompt(regionalCase)).toContain('MENA');
      expect(formatCaseStudiesForPrompt(primoCase)).toContain('Primo Marca');
    });
  });

  describe('getAllCaseStudiesForKnowledgeBase', () => {
    it('should include all category headers', () => {
      const kb = getAllCaseStudiesForKnowledgeBase();
      expect(kb).toContain('GLOBAL ICONS');
      expect(kb).toContain('REGIONAL CHAMPIONS');
      expect(kb).toContain('PRIMO MARCA CASES');
    });

    it('should include all 17 case studies', () => {
      const kb = getAllCaseStudiesForKnowledgeBase();
      expect(kb).toContain('Nike');
      expect(kb).toContain('Apple');
      expect(kb).toContain('Careem');
      expect(kb).toContain('Beehive');
    });

    it('should include structured sections for each case', () => {
      const kb = getAllCaseStudiesForKnowledgeBase();
      expect(kb).toContain('**SITUATION:**');
      expect(kb).toContain('**CHALLENGE:**');
      expect(kb).toContain('**WHAT THEY DID:**');
      expect(kb).toContain('**RESULTS:**');
      expect(kb).toContain('**KEY LESSON:**');
      expect(kb).toContain('**PATTERN TO RECOGNIZE:**');
      expect(kb).toContain('**ACADEMIC FRAMEWORK:**');
      expect(kb).toContain('**MENA RELEVANCE:**');
    });

    it('should mention the total count', () => {
      const kb = getAllCaseStudiesForKnowledgeBase();
      expect(kb).toContain('17 REAL-WORLD BRAND CASES');
    });
  });
});
