/**
 * KNOWLEDGE MIGRATION — Static → knowledge_entries
 * ===================================================
 * Idempotent: skips rows whose title already exists in the DB.
 *
 * Run on server startup via migrateStaticKnowledge() (non-blocking).
 */

import { logger } from './_core/logger';
import { getDb } from './db';
import { knowledgeEntries, type InsertKnowledgeEntry } from '../drizzle/schema';
import { getAllFrameworksForKnowledgeBase } from './academicFrameworks';
import { getAllCaseStudiesForKnowledgeBase } from './caseStudyLibrary';
import { getFullCompetitiveIntelligence } from './competitiveIntelligence';
import { getAllMarketIntelligenceForKnowledgeBase } from './marketIntelligence';
import { MENA_CASE_STUDIES } from './menaCaseStudies';
import {
  AGENT_IDENTITY,
  ACADEMIC_FOUNDATION,
  DIAGNOSTIC_ENGINE,
  CONVERSATION_LOGIC,
  QUALITY_STANDARDS,
  CONSULTANT_BOX_MODEL,
  SERVICE_DEEP_KNOWLEDGE,
} from './knowledgeBase';

type KnowledgeCategory = InsertKnowledgeEntry['category'];

interface MigrationEntry {
  title: string;
  content: string;
  category: KnowledgeCategory;
  industry: string | null;
  market: string | null;
  tags: string[];
  source: 'migration_static';
}

function formatServiceDeepKnowledge(): string {
  return Object.entries(SERVICE_DEEP_KNOWLEDGE)
    .map(([key, text]) => `## SERVICE PACK: ${key}\n${text}`)
    .join('\n\n');
}

function getAllMENACaseStudiesText(): string {
  let kb = `## MENA REGIONAL CASE STUDIES — ${MENA_CASE_STUDIES.length} CASES\n\n`;
  for (const c of MENA_CASE_STUDIES) {
    kb += `### ${c.brand}\n`;
    kb += `**Industry:** ${c.industry} | **Market:** ${c.market}\n`;
    kb += `**Situation:** ${c.situation}\n`;
    kb += `**Challenge:** ${c.challenge}\n`;
    kb += `**Strategy:** ${c.strategy}\n`;
    kb += `**Results:** ${c.results}\n`;
    kb += `**Lessons:** ${c.lessonsLearned}\n`;
    kb += `**Pattern:** ${c.patternToRecognize}\n`;
    kb += `**Frameworks:** ${c.frameworksUsed.join(' | ')}\n`;
    kb += `**Tags:** ${c.tags.join(', ')}\n\n`;
  }
  return kb;
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
    keller: 'keller',
    kapferer: 'kapferer',
    sharp: 'sharp',
    kahneman: 'kahneman',
    porter: 'porter',
    cialdini: 'cialdini',
    cbbe: 'cbbe',
    prism: 'prism',
    swot: 'swot',
    positioning: 'positioning',
    identity: 'identity',
    audit: 'audit',
    pricing: 'pricing',
    competitor: 'competitive',
    'case study': 'case_study',
    market: 'market_data',
    trend: 'trends',
    consumer: 'consumer_behavior',
    digital: 'digital',
    'social media': 'social_media',
    content: 'content',
    loyalty: 'loyalty',
    retention: 'retention',
    growth: 'growth',
  };

  const t = text.toLowerCase();
  for (const [keyword, tag] of Object.entries(keywords)) {
    if (t.includes(keyword)) tags.push(tag);
  }
  return tags;
}

/**
 * Split large markdown blobs into one DB row per ## / ### section.
 */
function extractSections(
  moduleName: string,
  content: string,
  defaultCategory: KnowledgeCategory,
  defaultTags: string[] = [],
): MigrationEntry[] {
  const entries: MigrationEntry[] = [];
  const sections = content.split(/(?=^#{2,3}\s)/m).filter((s) => s.trim().length > 100);

  for (const section of sections) {
    const titleMatch = section.match(/^#{2,3}\s+(.+)/m);
    let title: string;
    if (titleMatch) {
      title = titleMatch[1].replace(/[—\-_]+$/, '').trim().substring(0, 200);
    } else {
      const firstLine = section.split('\n')[0]?.trim() || 'section';
      title = `${moduleName} — ${firstLine}`.substring(0, 200);
    }

    if (section.trim().length < 150) continue;

    const industry = detectIndustry(section);
    const market = detectMarket(section);
    const tags = [...defaultTags, ...extractTags(section)];

    entries.push({
      title: `[${moduleName}] ${title}`.substring(0, 500),
      content: section.trim().substring(0, 65000),
      category: defaultCategory,
      industry,
      market,
      tags: Array.from(new Set(tags)).slice(0, 15),
      source: 'migration_static',
    });
  }

  return entries;
}

/**
 * Collect all static slices to migrate (ESM — no require).
 */
export function prepareStaticMigration(): MigrationEntry[] {
  const allEntries: MigrationEntry[] = [];

  const modules: Array<{
    name: string;
    category: KnowledgeCategory;
    tags: string[];
    contentGetter: () => string;
  }> = [
    {
      name: 'KnowledgeBase_Core',
      category: 'methodology',
      tags: ['knowledge_base', 'agent', 'wzzrd_ai'],
      contentGetter: () =>
        [
          AGENT_IDENTITY,
          ACADEMIC_FOUNDATION,
          DIAGNOSTIC_ENGINE,
          CONVERSATION_LOGIC,
          QUALITY_STANDARDS,
          CONSULTANT_BOX_MODEL,
        ].join('\n\n'),
    },
    {
      name: 'KnowledgeBase_Services',
      category: 'methodology',
      tags: ['services', 'offerings', 'wzzrd_ai'],
      contentGetter: formatServiceDeepKnowledge,
    },
    {
      name: 'Academic_Frameworks',
      category: 'framework',
      tags: ['academic', 'frameworks'],
      contentGetter: () => getAllFrameworksForKnowledgeBase(),
    },
    {
      name: 'Case_Studies',
      category: 'case_study',
      tags: ['case_study', 'global'],
      contentGetter: () => getAllCaseStudiesForKnowledgeBase(),
    },
    {
      name: 'MENA_Cases',
      category: 'case_study',
      tags: ['case_study', 'mena'],
      contentGetter: getAllMENACaseStudiesText,
    },
    {
      name: 'Competitive_Intel',
      category: 'competitor_intel',
      tags: ['competitive', 'pricing'],
      contentGetter: () => getFullCompetitiveIntelligence(),
    },
    {
      name: 'Market_Intelligence',
      category: 'market_insight',
      tags: ['market', 'trends', 'mena'],
      contentGetter: () => getAllMarketIntelligenceForKnowledgeBase(),
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
      logger.warn({ module: mod.name, err }, '[KnowledgeMigration] Failed to extract module');
    }
  }

  logger.info({ totalEntries: allEntries.length }, '[KnowledgeMigration] Prepared static rows');
  return allEntries;
}

/**
 * Insert prepared rows; skip existing titles. Safe to call on every boot.
 */
export async function migrateStaticKnowledge(): Promise<{
  created: number;
  skipped: number;
  errors: number;
}> {
  const db = await getDb();
  if (!db) {
    logger.warn('[KnowledgeMigration] Database unavailable — skipping');
    return { created: 0, skipped: 0, errors: 0 };
  }

  const existingRows = await db.select({ title: knowledgeEntries.title }).from(knowledgeEntries);
  const existingTitles = new Set(existingRows.map((r) => r.title));

  const entries = prepareStaticMigration();
  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const entry of entries) {
    if (existingTitles.has(entry.title)) {
      skipped++;
      continue;
    }

    const row: InsertKnowledgeEntry = {
      title: entry.title,
      content: entry.content,
      category: entry.category,
      industry: entry.industry ?? undefined,
      market: entry.market ?? undefined,
      tags: entry.tags,
      source: 'migration_static',
      isActive: 1,
    };

    try {
      await db.insert(knowledgeEntries).values(row);
      existingTitles.add(entry.title);
      created++;
    } catch (err: unknown) {
      // errno 1062 = ER_DUP_ENTRY: title already exists (DB-level unique constraint).
      // Titles may differ in case from what the in-memory Set stores, so the
      // existingTitles.has() check passes but the INSERT still conflicts. Treat
      // these as skips — not errors — to avoid noisy startup logs.
      if ((err as { errno?: number })?.errno === 1062) {
        skipped++;
      } else {
        errors++;
        logger.warn({ title: entry.title, err }, '[KnowledgeMigration] Insert failed');
      }
    }
  }

  logger.info(
    { created, skipped, errors, total: entries.length },
    '[KnowledgeMigration] migrateStaticKnowledge completed',
  );
  return { created, skipped, errors };
}
