/**
 * Demo Data Seeder — creates sample data to showcase the system's value.
 * 
 * Called when the owner first opens the dashboard and has zero data.
 * Creates: 2 sample clients, 2 projects, deliverables, a lead, and sample knowledge.
 */

import { logger } from './_core/logger';

export interface DemoData {
  clients: Array<{
    name: string; companyName: string; email: string; phone: string;
    market: 'ksa' | 'egypt' | 'uae' | 'other'; industry: string; website: string;
    status: 'lead' | 'active' | 'completed' | 'paused';
  }>;
  projects: Array<{
    clientIndex: number; name: string;
    serviceType: 'business_health_check' | 'starting_business_logic' | 'brand_identity' | 'business_takeoff' | 'consultation';
    stage: string; status: string; price: string; description: string;
  }>;
  notes: Array<{
    clientIndex: number; title: string; content: string;
    category: 'diagnostic' | 'strategic' | 'meeting' | 'insight' | 'general';
  }>;
  knowledge: Array<{
    title: string; content: string;
    category: string; industry: string; tags: string[];
  }>;
}

export const DEMO_DATA: DemoData = {
  clients: [
    {
      name: 'Ahmed Hassan',
      companyName: 'NileTech Solutions',
      email: 'ahmed@niletech.eg',
      phone: '+20 100 123 4567',
      market: 'egypt',
      industry: 'Technology',
      website: 'https://niletech.eg',
      status: 'active',
    },
    {
      name: 'Fatima Al-Rashid',
      companyName: 'Sahra Café',
      email: 'fatima@sahracafe.sa',
      phone: '+966 50 987 6543',
      market: 'ksa',
      industry: 'F&B (Food & Beverage)',
      website: 'https://sahracafe.sa',
      status: 'active',
    },
  ],
  projects: [
    {
      clientIndex: 0,
      name: 'NileTech — Brand Identity Foundation',
      serviceType: 'brand_identity',
      stage: 'design',
      status: 'active',
      price: '210000',
      description: 'Complete brand identity system for NileTech — from strategy to visual identity to brand guidelines.',
    },
    {
      clientIndex: 1,
      name: 'Sahra Café — Business Health Check',
      serviceType: 'business_health_check',
      stage: 'diagnose',
      status: 'active',
      price: '140000',
      description: 'Comprehensive brand health audit for Sahra Café across all 7 brand dimensions.',
    },
  ],
  notes: [
    {
      clientIndex: 0,
      title: 'Discovery Call — Key Findings',
      content: 'NileTech is a 3-year-old SaaS startup in Cairo targeting SMBs across MENA. Current pain points:\n\n1. No consistent brand identity — logo was made on Canva\n2. Messaging differs across website, social media, and sales decks\n3. Competing against larger players (Odoo, Zoho) but positioning is unclear\n4. Strong product but weak brand perception\n\nOpportunity: They have a solid product-market fit but need a professional brand to compete at the enterprise level.',
      category: 'diagnostic',
    },
    {
      clientIndex: 1,
      title: 'Sahra Café — Market Position Analysis',
      content: 'Sahra Café operates 3 locations in Riyadh. Key observations:\n\n1. Strong local following but no digital presence strategy\n2. Menu and interior design are premium but branding is inconsistent\n3. Competition from international chains (Starbucks, %Arabica) and local specialty cafés\n4. Target audience: Young Saudi professionals (25-35) who value quality and ambiance\n\nRecommendation: Position as "Saudi Arabia\'s premium local café experience" — authentic, modern, rooted.',
      category: 'strategic',
    },
  ],
  knowledge: [
    {
      title: 'MENA Brand Identity Pricing Benchmarks (2025)',
      content: 'Based on our market research across 50+ agencies in MENA:\n\n- Budget agencies (Fiverr/freelancers): 5,000 - 30,000 EGP\n- Mid-tier agencies: 50,000 - 150,000 EGP\n- Premium agencies (Primo Marca tier): 150,000 - 350,000 EGP\n- International agencies: 500,000+ EGP\n\nPrimo Marca sits in the premium-but-accessible tier with data-driven, framework-backed deliverables that justify the investment.',
      category: 'market_insight',
      industry: 'Branding',
      tags: ['pricing', 'MENA', 'benchmark', 'agency'],
    },
    {
      title: 'F&B Branding — What Works in Saudi Arabia',
      content: 'Key learnings from F&B brand projects in KSA:\n\n1. Arabic-first approach performs 40% better in brand recall\n2. Heritage + modernity balance is critical — too traditional feels dated, too modern feels foreign\n3. Instagram-worthy design drives 60% of discovery for new cafés\n4. Storytelling about sourcing and quality resonates with Saudi consumers\n5. Premium pricing is accepted when brand experience is consistent\n\nCase: When we repositioned a Jeddah café with these principles, their foot traffic increased 35% in 3 months.',
      category: 'case_study',
      industry: 'F&B',
      tags: ['saudi', 'f&b', 'café', 'branding', 'case study'],
    },
  ],
};

/**
 * Seeds demo data into the database.
 * Only runs if the database has zero clients.
 * Returns true if data was seeded, false if skipped.
 */
export async function seedDemoData(
  createClient: (data: unknown) => Promise<any>,
  createProject: (data: unknown) => Promise<any>,
  createNote: (data: unknown) => Promise<any>,
  createKnowledge: (data: unknown) => Promise<any>,
  getClients: () => Promise<any[]>,
): Promise<boolean> {
  try {
    // Check if data already exists
    const existingClients = await getClients();
    const clientList = Array.isArray(existingClients) ? existingClients : (existingClients as { data?: unknown[] })?.data ?? [];
    if (clientList.length > 0) {
      logger.debug('Demo data skipped — clients already exist');
      return false;
    }

    logger.info('Seeding demo data for first-time user...');

    // Create clients
    const clientIds: number[] = [];
    for (const client of DEMO_DATA.clients) {
      const result = await createClient(client);
      const id = (result as { id?: number })?.id ?? (Array.isArray(result) ? (result as { insertId?: number }[])?.[0]?.insertId : undefined);
      if (id) clientIds.push(id);
    }

    // Create projects
    for (const project of DEMO_DATA.projects) {
      const clientId = clientIds[project.clientIndex];
      if (!clientId) continue;
      await createProject({ ...project, clientId });
    }

    // Create notes
    for (const note of DEMO_DATA.notes) {
      const clientId = clientIds[note.clientIndex];
      if (!clientId) continue;
      await createNote({ ...note, clientId });
    }

    // Create knowledge entries
    for (const entry of DEMO_DATA.knowledge) {
      await createKnowledge({ ...entry, source: 'manual', isActive: 1 });
    }

    logger.info({ clientsCreated: clientIds.length }, 'Demo data seeded successfully');
    return true;
  } catch (err) {
    logger.error({ err }, 'Failed to seed demo data');
    return false;
  }
}

/**
 * Guided onboarding steps configuration.
 * Used by the frontend to show a first-use tour.
 */
export const ONBOARDING_STEPS = [
  {
    id: 'welcome',
    target: 'body',
    title: 'Welcome to Primo Command Center',
    titleAr: 'مرحباً بك في Primo Command Center',
    content: 'Your AI-powered brand engineering dashboard. Let us show you around.',
    contentAr: 'لوحة هندسة العلامات التجارية بالذكاء الاصطناعي. دعنا نأخذك في جولة.',
  },
  {
    id: 'clients',
    target: '[href="/clients"]',
    title: 'Manage Clients',
    titleAr: 'إدارة العملاء',
    content: 'Start by adding your clients. Each client gets a complete project lifecycle.',
    contentAr: 'ابدأ بإضافة عملائك. كل عميل يحصل على دورة مشروع كاملة.',
  },
  {
    id: 'ai-engine',
    target: '[href="/ai"]',
    title: 'AI Brain (Wzrd AI)',
    titleAr: 'العقل الذكي (Wzrd AI)',
    content: 'Chat with the AI Brain to get strategic brand insights backed by academic frameworks.',
    contentAr: 'تحدث مع العقل الذكي للحصول على رؤى استراتيجية مدعومة بأطر أكاديمية.',
  },
  {
    id: 'pipeline',
    target: '[href="/pipeline"]',
    title: 'Autonomous Pipeline',
    titleAr: 'خط الإنتاج الذاتي',
    content: 'Let AI handle the entire workflow: Research → Diagnose → Strategize → Generate → Deliver.',
    contentAr: 'دع الذكاء الاصطناعي يتولى سير العمل بالكامل: بحث ← تشخيص ← استراتيجية ← إنتاج ← تسليم.',
  },
  {
    id: 'quick-check',
    target: '[href="/leads"]',
    title: 'Lead Generation',
    titleAr: 'جذب العملاء',
    content: 'Share the Quick-Check link to capture and score leads automatically.',
    contentAr: 'شارك رابط الفحص السريع لجذب وتسجيل العملاء المحتملين تلقائياً.',
  },
];
