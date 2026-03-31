/**
 * Safe blog seeder — spawned by the server after startup.
 * Waits for the blog_posts table to exist (retry up to 10 times, 3s apart),
 * then inserts seed posts. Skips duplicates. Never crashes.
 *
 * Called from server/_core/index.ts via child_process.spawn.
 */
import mysql from "mysql2/promise";
import { config as loadDotenv } from "dotenv";

loadDotenv();

const DATABASE_URL = process.env.DATABASE_URL?.trim();
if (!DATABASE_URL) {
  console.log("[seed-blogs] No DATABASE_URL — skipping.");
  process.exit(0);
}

const MAX_RETRIES = 10;
const RETRY_INTERVAL_MS = 3000; // 3 seconds between retries

const blogs = [
  {
    slug: "brand-diagnosis-guide",
    title_ar: "كيف تعرف إن براندك محتاج تدخل طبي؟ ٧ علامات لا تتجاهلها",
    title_en: "How to Know Your Brand Needs Medical Intervention? 7 Signs You Shouldn't Ignore",
    excerpt_ar: "كثير من أصحاب المشاريع يعرفون إن فيه مشكلة، لكن مش عارفين فين بالظبط. تعرف على ٧ علامات تحتاج تشخيص فوري.",
    excerpt_en: "Many business owners know something is wrong, but can't pinpoint where. Learn the 7 signs that need immediate diagnosis.",
    category: "Branding",
    tags: "diagnosis, brand health, strategy",
    published: 1,
    reading_time_min: 3,
  },
  {
    slug: "offer-check-guide",
    title_ar: "عرضك التجاري ضعيف؟ إليك كيف تعرف وتصلحه",
    title_en: "Is Your Commercial Offer Weak? Here's How to Know and Fix It",
    excerpt_ar: "العرض التجاري هو أول ما يراه العميل. إذا كان ضعيفاً، لن يكمل الشراء. تعلم كيف تقيّم وتحسّن عرضك.",
    excerpt_en: "Your commercial offer is the first thing a customer sees. If it's weak, they won't complete the purchase. Learn how to evaluate and improve your offer.",
    category: "Sales",
    tags: "offer, pricing, conversion",
    published: 1,
    reading_time_min: 3,
  },
  {
    slug: "message-check-guide",
    title_ar: "رسالتك التسويقية لا تصل؟ ٥ أخطاء شائعة وكيف تصلحها",
    title_en: "Your Marketing Message Isn't Landing? 5 Common Mistakes and How to Fix Them",
    excerpt_ar: "رسالتك التسويقية هي صوت براندك. إذا كانت مشوشة أو ضعيفة، العميل لن يفهم قيمتك. اكتشف الأخطاء الخمسة الأكثر شيوعاً.",
    excerpt_en: "Your marketing message is your brand's voice. If it's confusing or weak, the customer won't understand your value. Discover the 5 most common mistakes.",
    category: "Marketing",
    tags: "message, copywriting, communication",
    published: 1,
    reading_time_min: 3,
  },
  {
    slug: "quick-diagnosis-guide",
    title_ar: "تقييم سريع لصحة علامتك التجارية في أقل من دقيقة",
    title_en: "Quick Assessment of Your Brand's Health in Under a Minute",
    excerpt_ar: "أحياناً لا تحتاج تحليلاً معمقاً — تحتاج فقط مؤشرات سريعة تدلك على الخلل. تعرف على ٥ أسئلة أساسية.",
    excerpt_en: "Sometimes you don't need deep analysis — you just need quick indicators to point out the flaws. Learn the 5 essential questions.",
    category: "Strategy",
    tags: "diagnosis, quick, health",
    published: 1,
    reading_time_min: 2,
  },
  {
    slug: "competitive-benchmark-guide",
    title_ar: "كيف تتفوق على منافسيك حتى لو كانت ميزانيتهم أكبر؟",
    title_en: "How to Outsmart Your Competitors Even if They Have a Bigger Budget?",
    excerpt_ar: "المنافسة شرسة، لكن الفوز لا يعتمد دائماً على الميزانية الأكبر. تعلم كيف تحلل منافسيك وتجد ثغراتهم لتتفوق عليهم.",
    excerpt_en: "Competition is fierce, but winning doesn't always depend on the biggest budget. Learn how to analyze your competitors and find their gaps to outsmart them.",
    category: "Market Research",
    tags: "competitors, benchmark, strategy",
    published: 1,
    reading_time_min: 3,
  },
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForTable(conn) {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const [tables] = await conn.query(
      "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'blog_posts'"
    );
    if (Array.isArray(tables) && tables.length > 0) {
      console.log(`[seed-blogs] blog_posts table found (attempt ${attempt}/${MAX_RETRIES}).`);
      return true;
    }
    console.log(`[seed-blogs] blog_posts table not found yet (attempt ${attempt}/${MAX_RETRIES}). Retrying in ${RETRY_INTERVAL_MS / 1000}s...`);
    await sleep(RETRY_INTERVAL_MS);
  }
  return false;
}

async function run() {
  let conn;
  try {
    conn = await mysql.createConnection(DATABASE_URL);

    // Wait for the table to be created by drizzle-kit push
    const tableExists = await waitForTable(conn);
    if (!tableExists) {
      console.log(`[seed-blogs] blog_posts table not found after ${MAX_RETRIES} retries (${MAX_RETRIES * RETRY_INTERVAL_MS / 1000}s). Skipping seed — will retry on next deploy.`);
      return;
    }

    let inserted = 0;
    let skipped = 0;
    for (const blog of blogs) {
      try {
        await conn.query(
          `INSERT INTO blog_posts (slug, title_ar, title_en, excerpt_ar, excerpt_en, category, tags, published, published_at, reading_time_min, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, NOW(), NOW())`,
          [
            blog.slug,
            blog.title_ar,
            blog.title_en,
            blog.excerpt_ar,
            blog.excerpt_en,
            blog.category,
            blog.tags,
            blog.published,
            blog.reading_time_min,
          ]
        );
        console.log(`[seed-blogs] Inserted: ${blog.slug}`);
        inserted++;
      } catch (e) {
        if (e.code === "ER_DUP_ENTRY") {
          console.log(`[seed-blogs] Skipped (exists): ${blog.slug}`);
          skipped++;
        } else {
          console.error(`[seed-blogs] Error inserting ${blog.slug}:`, e.message);
        }
      }
    }
    console.log(`[seed-blogs] Done. Inserted: ${inserted}, Skipped: ${skipped}.`);
  } catch (err) {
    console.error("[seed-blogs] Could not connect to DB — skipping:", err.message);
  } finally {
    if (conn) await conn.end();
  }
}

run();
