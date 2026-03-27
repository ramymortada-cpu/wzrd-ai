/**
 * KNOWLEDGE MIGRATION — Static → Dynamic
 * ========================================
 * 
 * Problem: 90% of knowledge is hardcoded in TypeScript strings (6,652 lines).
 *          This means: no search, no freshness tracking, no dynamic updates.
 * 
 * Solution: Extract sections from static modules → create knowledge_entries in DB.
 *           The static knowledge remains as "foundation" but the DB becomes the
 *           primary source for Smart Context Manager retrieval.
 * 
 * After migration:
 * - Static: 50% (Agent Identity, Diagnostic Engine, Conversation Logic — these don't change)
 * - Dynamic: 50% (Case studies, market data, competitive intel, frameworks — these evolve)
 * 
 * Run once: `await migrateStaticKnowledge()`
 * Safe to re-run: checks for duplicates via title matching.
 */

import { logger } from './_core/logger';

// ============ TYPES ============

interface MigrationEntry {
  title: string;
  content: string;
  category: string;
  industry: string | null;
  market: string | null;
  tags: string[];
  source: 'migration_static';
}

// ============ EXTRACTION RULES ============

/**
 * Extract knowledge sections from a large string module.
 * Splits on ## headings and creates one entry per section.
 */
function extractSections(
  moduleName: string,
  content: string,
  defaultCategory: string,
  defaultTags: string[] = []
): MigrationEntry[] {
  const entries: MigrationEntry[] = [];
  
  // Split on ## or ### headings
  const sections = content.split(/(?=^#{2,3}\s)/m).filter(s => s.trim().length > 100);
  
  for (const section of sections) {
    // Extract title from first line
    const titleMatch = section.match(/^#{2,3}\s+(.+)/);
    const title = titleMatch 
      ? titleMatch[1].replace(/[—\-_]+$/, '').trim().substring(0, 200)
      : `${moduleName} — Section`;
    
    // Skip if it's just a heading with no content
    if (section.trim().length < 150) continue;
    
    // Detect industry from content
    const industry = detectIndustry(section);
    const market = detectMarket(section);
    const tags = [...defaultTags, ...extractTags(section)];
    
    entries.push({
      title: `[${moduleName}] ${title}`,
      content: section.trim().substring(0, 10000), // Max 10K chars per entry
      category: defaultCategory,
      industry,
      market,
      tags: Array.from(new Set(tags)).slice(0, 15),
      source: 'migration_static',
    });
  }
  
  return entries;
}

function detectIndustry(text: string): string | null {
  const t = text.toLowerCase();
  if (t.includes('restaurant') || t.includes('food') || t.includes('café') || t.includes('مطعم')) return 'F&B';
  if (t.includes('healthcare') || t.includes('medical') || t.includes('clinic') || t.includes('صحة')) return 'Healthcare';
  if (t.includes('tech') || t.includes('saas') || t.includes('software') || t.includes('تقنية')) return 'Technology';
  if (t.includes('real estate') || t.includes('property') || t.includes('عقار')) return 'Real Estate';
  if (t.includes('retail') || t.includes('ecommerce') || t.includes('تجزئة')) return 'Retail';
  if (t.includes('education') || t.includes('school') || t.includes('تعليم')) return 'Education';
  if (t.includes('beauty') || t.includes('cosmetic') || t.includes('جمال')) return 'Beauty';
  return null;
}

function detectMarket(text: string): string | null {
  const t = text.toLowerCase();
  if (t.includes('egypt') || t.includes('cairo') || t.includes('مصر') || t.includes('القاهرة')) return 'egypt';
  if (t.includes('saudi') || t.includes('ksa') || t.includes('riyadh') || t.includes('السعودية')) return 'ksa';
  if (t.includes('uae') || t.includes('dubai') || t.includes('الإمارات')) return 'uae';
  if (t.includes('mena') || t.includes('arab') || t.includes('عربي')) return 'mena';
  return null;
}

function extractTags(text: string): string[] {
  const tags: string[] = [];
  const keywords: Record<string, string> = {
    'keller': 'keller', 'kapferer': 'kapferer', 'sharp': 'sharp',
    'kahneman': 'kahneman', 'porter': 'porter', 'cialdini': 'cialdini',
    'cbbe': 'cbbe', 'prism': 'prism', 'swot': 'swot',
    'positioning': 'positioning', 'identity': 'identity', 'audit': 'audit',
    'pricing': 'pricing', 'competitor': 'competitive', 'case study': 'case_study',
    'market': 'market_data', 'trend': 'trends', 'consumer': 'consumer_behavior',
    'digital': 'digital', 'social media': 'social_media', 'content': 'content',
    'loyalty': 'loyalty', 'retention': 'retention', 'growth': 'growth',
  };
  
  const t = text.toLowerCase();
  for (const [keyword, tag] of Object.entries(keywords)) {
    if (t.includes(keyword)) tags.push(tag);
  }
  return tags;
}

// ============ MAIN MIGRATION ============

/**
 * Run the full migration.
 * Returns the entries that would be created (for preview or actual insertion).
 */
export function prepareStaticMigration(): MigrationEntry[] {
  // Lazy-import the knowledge modules to avoid circular dependencies
  const allEntries: MigrationEntry[] = [];
  
  try {
    // We can't import at top level due to circular deps, so we import dynamically
    // This function is meant to be called once at setup time
    
    const modules: Array<{
      name: string;
      category: string;
      tags: string[];
      contentGetter: () => string;
    }> = [
      {
        name: 'Academic_Keller',
        category: 'academic_framework',
        tags: ['keller', 'cbbe', 'brand_equity'],
        contentGetter: () => {
          try { return require('./academicFrameworks').getAllFrameworksForKnowledgeBase?.() || ''; } catch { return ''; }
        },
      },
      {
        name: 'Competitive_Intel',
        category: 'competitive_intelligence',
        tags: ['competitive', 'market_data', 'pricing'],
        contentGetter: () => {
          try { return require('./competitiveIntelligence').getFullCompetitiveIntelligence?.() || ''; } catch { return ''; }
        },
      },
      {
        name: 'Market_Intelligence',
        category: 'market_data',
        tags: ['market', 'trends', 'mena'],
        contentGetter: () => {
          try { return require('./marketIntelligence').getAllMarketIntelligenceForKnowledgeBase?.() || ''; } catch { return ''; }
        },
      },
      {
        name: 'Case_Studies',
        category: 'case_study',
        tags: ['case_study', 'example', 'mena'],
        contentGetter: () => {
          try { return require('./caseStudyLibrary').getAllCaseStudiesForKnowledgeBase?.() || ''; } catch { return ''; }
        },
      },
      {
        name: 'MENA_Cases',
        category: 'case_study',
        tags: ['case_study', 'mena', 'arabic'],
        contentGetter: () => {
          try { return require('./menaCaseStudies').getAllMENACaseStudies?.() || ''; } catch { return ''; }
        },
      },
    ];

    for (const mod of modules) {
      try {
        const content = mod.contentGetter();
        if (content && content.length > 200) {
          const sections = extractSections(mod.name, content, mod.category, mod.tags);
          allEntries.push(...sections);
        }
      } catch (err) {
        logger.warn({ module: mod.name, err }, 'Failed to extract knowledge from module');
      }
    }

    logger.info({ totalEntries: allEntries.length }, 'Static knowledge migration prepared');
  } catch (err) {
    logger.error({ err }, 'Knowledge migration preparation failed');
  }

  return allEntries;
}

/**
 * Execute the migration — insert entries into the DB.
 * Checks for duplicates by title.
 */
export async function migrateStaticKnowledge(
  createEntry: (data: unknown) => Promise<unknown>,
  getExistingTitles: () => Promise<string[]>
): Promise<{ created: number; skipped: number; errors: number }> {
  const entries = prepareStaticMigration();
  const existingTitles = new Set(await getExistingTitles());
  
  let created = 0, skipped = 0, errors = 0;

  for (const entry of entries) {
    if (existingTitles.has(entry.title)) {
      skipped++;
      continue;
    }

    try {
      await createEntry({
        title: entry.title,
        content: entry.content,
        category: entry.category,
        industry: entry.industry,
        market: entry.market,
        tags: entry.tags,
        source: 'migration_static',
        isActive: 1,
      });
      created++;
    } catch (err) {
      errors++;
      logger.warn({ title: entry.title, err }, 'Failed to create knowledge entry');
    }
  }

  logger.info({ created, skipped, errors, total: entries.length }, 'Static knowledge migration completed');
  return { created, skipped, errors };
}
