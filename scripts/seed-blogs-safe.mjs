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
    content_ar: `كثير من أصحاب المشاريع يشعرون بأن شيئاً ما لا يسير على ما يرام في علامتهم التجارية، لكنهم لا يستطيعون تحديد المشكلة بدقة. في هذا المقال، نستعرض ٧ علامات تدل على أن براندك يحتاج إلى تدخل فوري.

١. انخفاض معدل التحويل رغم زيادة الزيارات: إذا كان موقعك يستقبل زوارًا لكنهم لا يتحولون إلى عملاء، فهذا مؤشر واضح على خلل في رسالتك أو عرضك.

٢. عدم وضوح الهوية البصرية: إذا كان جمهورك لا يتعرف على براندك بسرعة، فأنت بحاجة إلى مراجعة هويتك البصرية.

٣. ضعف التفاعل على وسائل التواصل الاجتماعي: قلة التفاعل تعني أن محتواك لا يلامس اهتمامات جمهورك المستهدف.

٤. كثرة الشكاوى المتعلقة بعدم الفهم: إذا كان عملاؤك يسألون كثيرًا "ماذا تقدم بالضبط؟" فرسالتك غير واضحة.

٥. المنافسون يسبقونك رغم تشابه المنتجات: يعني أن تموضعك في السوق يحتاج إلى إعادة نظر.

٦. صعوبة تبرير السعر: إذا كنت تضطر دائمًا لتقديم خصومات، فقيمتك المدركة منخفضة.

٧. غياب الولاء لدى العملاء: العملاء الذين لا يعودون ولا يحيلون غيرهم يشيرون إلى تجربة براند ضعيفة.

إذا وجدت نفسك في ثلاث أو أكثر من هذه العلامات، فقد حان وقت التشخيص الشامل لبراندك.`,
    content_en: `Many business owners feel that something is off with their brand, but can't pinpoint the exact problem. In this article, we cover 7 signs that your brand needs immediate intervention.

1. Declining conversion rates despite increased traffic: If your site gets visitors but they don't convert into customers, there's a clear issue with your message or offer.

2. Unclear visual identity: If your audience doesn't recognize your brand quickly, you need to revisit your visual identity.

3. Low engagement on social media: Poor engagement means your content isn't resonating with your target audience.

4. Frequent "what do you do exactly?" questions: If customers keep asking this, your message isn't clear enough.

5. Competitors outpacing you despite similar products: This means your market positioning needs rethinking.

6. Difficulty justifying your price: If you're always forced to offer discounts, your perceived value is low.

7. Lack of customer loyalty: Customers who don't return or refer others point to a weak brand experience.

If you identify with three or more of these signs, it's time for a comprehensive brand diagnosis.`,
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
    content_ar: `العرض التجاري هو حجر الأساس في أي عملية بيع ناجحة. إذا كان عرضك ضعيفاً، فلن تساعدك أي ميزانية إعلانية مهما كانت ضخمة. إليك كيف تقيّم عرضك وتصلحه.

**علامات العرض الضعيف:**
- العميل يقول "سأفكر في الأمر" ولا يعود
- تحتاج إلى شرح طويل لإقناع العميل
- معدل الرفض مرتفع جداً
- العملاء يقارنونك بالمنافسين على أساس السعر فقط

**عناصر العرض القوي:**
١. وضوح القيمة: ماذا يحصل العميل بالضبط؟
٢. الإلحاح: لماذا يجب أن يتصرف الآن؟
٣. ضمان المخاطرة: ماذا يحدث إذا لم يكن راضياً؟
٤. الدليل الاجتماعي: من استفاد من عرضك من قبل؟
٥. السهولة: كم هو سهل البدء؟

**خطوات الإصلاح:**
ابدأ بتحديد جمهورك المستهدف بدقة، ثم اكتب عرضك من منظور العميل لا من منظورك أنت. ركز على النتيجة التي يريدها العميل، وليس على المميزات التقنية لمنتجك.

اختبر عرضك على مجموعة صغيرة قبل إطلاقه على نطاق واسع، واستمع لردود الفعل بعناية.`,
    content_en: `Your commercial offer is the cornerstone of any successful sale. If your offer is weak, no advertising budget — no matter how large — will save you. Here's how to evaluate and fix your offer.

**Signs of a weak offer:**
- Customers say "I'll think about it" and never return
- You need a long explanation to convince the customer
- Your rejection rate is very high
- Customers compare you to competitors on price alone

**Elements of a strong offer:**
1. Value clarity: What exactly does the customer get?
2. Urgency: Why should they act now?
3. Risk reversal: What happens if they're not satisfied?
4. Social proof: Who has benefited from your offer before?
5. Ease: How easy is it to get started?

**Steps to fix it:**
Start by precisely identifying your target audience, then write your offer from the customer's perspective, not yours. Focus on the outcome the customer wants, not the technical features of your product.

Test your offer on a small group before launching it widely, and listen carefully to the feedback.`,
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
    content_ar: `رسالتك التسويقية هي الجسر بينك وبين عميلك. إذا كانت هذه الرسالة غير واضحة أو غير مقنعة، فأنت تخسر عملاء محتملين كل يوم. إليك أكثر ٥ أخطاء شيوعاً وكيف تتجنبها.

**الخطأ الأول: التحدث عن نفسك بدلاً من العميل**
معظم الشركات تبدأ رسالتها بـ"نحن نقدم..." أو "شركتنا متخصصة في...". العميل لا يهتم بك، يهتم بنفسه. ابدأ دائماً بمشكلة العميل أو حلمه.

**الخطأ الثاني: استخدام لغة تقنية معقدة**
إذا كان عميلك يحتاج إلى قاموس لفهم رسالتك، فأنت تخسره. استخدم لغة بسيطة وواضحة.

**الخطأ الثالث: محاولة مخاطبة الجميع**
الرسالة التي تخاطب الجميع لا تخاطب أحداً. حدد شريحتك المستهدفة بدقة وتحدث إليها مباشرة.

**الخطأ الرابع: غياب دعوة واضحة للتصرف**
كل رسالة تسويقية يجب أن تنتهي بخطوة واضحة: "اشترِ الآن"، "احجز استشارتك"، "جرّب مجاناً".

**الخطأ الخامس: عدم الاتساق عبر القنوات**
إذا كانت رسالتك على إنستغرام تختلف عن موقعك الإلكتروني، فأنت تربك عميلك. الاتساق يبني الثقة.`,
    content_en: `Your marketing message is the bridge between you and your customer. If this message is unclear or unconvincing, you're losing potential customers every day. Here are the 5 most common mistakes and how to avoid them.

**Mistake #1: Talking about yourself instead of the customer**
Most companies start their message with "We offer..." or "Our company specializes in...". The customer doesn't care about you — they care about themselves. Always start with the customer's problem or dream.

**Mistake #2: Using complex technical language**
If your customer needs a dictionary to understand your message, you've lost them. Use simple, clear language.

**Mistake #3: Trying to speak to everyone**
A message that speaks to everyone speaks to no one. Define your target segment precisely and speak to them directly.

**Mistake #4: Missing a clear call to action**
Every marketing message must end with a clear next step: "Buy now", "Book your consultation", "Try for free".

**Mistake #5: Inconsistency across channels**
If your message on Instagram differs from your website, you're confusing your customer. Consistency builds trust.`,
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
    content_ar: `لا تحتاج دائماً إلى تحليل معمق لتعرف إن كان براندك بصحة جيدة. هذه الأسئلة الخمسة ستعطيك صورة واضحة في أقل من دقيقة.

**السؤال الأول: هل يستطيع أي شخص في فريقك شرح قيمة براندك في جملة واحدة؟**
إذا كانت الإجابة لا، أو إذا كانت الإجابات متضاربة، فهويتك غير واضحة.

**السؤال الثاني: هل عملاؤك يحيلون أصدقاءهم إليك؟**
التوصية الشفهية هي أقوى مؤشر على رضا العملاء وقوة البراند.

**السؤال الثالث: هل تعرف من هو عميلك المثالي بالتحديد؟**
إذا كانت إجابتك "الجميع"، فأنت لا تستهدف أحداً بفعالية.

**السؤال الرابع: هل أسعارك تعكس قيمتك الحقيقية؟**
إذا كنت تتنافس على السعر فقط، فبراندك لم يبنِ قيمة مدركة كافية.

**السؤال الخامس: هل هويتك البصرية متسقة عبر جميع نقاط التواصل؟**
من بطاقة العمل إلى وسائل التواصل الاجتماعي — الاتساق يعني الاحترافية.

**تفسير النتائج:**
- ٥ إجابات بنعم: براندك بصحة ممتازة
- ٣-٤ إجابات بنعم: هناك مجال للتحسين
- أقل من ٣: براندك يحتاج إلى مراجعة شاملة`,
    content_en: `You don't always need a deep analysis to know if your brand is healthy. These five questions will give you a clear picture in under a minute.

**Question 1: Can anyone on your team explain your brand's value in one sentence?**
If the answer is no, or if the answers are inconsistent, your identity isn't clear.

**Question 2: Do your customers refer their friends to you?**
Word-of-mouth referrals are the strongest indicator of customer satisfaction and brand strength.

**Question 3: Do you know exactly who your ideal customer is?**
If your answer is "everyone", you're not effectively targeting anyone.

**Question 4: Do your prices reflect your true value?**
If you're competing on price alone, your brand hasn't built sufficient perceived value.

**Question 5: Is your visual identity consistent across all touchpoints?**
From business cards to social media — consistency means professionalism.

**Interpreting results:**
- 5 yes answers: Your brand is in excellent health
- 3–4 yes answers: There's room for improvement
- Fewer than 3: Your brand needs a comprehensive review`,
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
    content_ar: `كثير من أصحاب المشاريع الصغيرة يشعرون بالإحباط عندما يرون منافسين بميزانيات ضخمة. لكن الحقيقة هي أن الميزانية الكبيرة لا تضمن الفوز دائماً. إليك كيف تتفوق على منافسيك بذكاء.

**أولاً: افهم منافسيك قبل أن تنافسهم**
ادرس منتجاتهم، أسعارهم، رسائلهم التسويقية، وتعليقات عملائهم. ستجد دائماً ثغرات لم يلتفتوا إليها.

**ثانياً: ابحث عن الثغرات لا عن التشابه**
لا تحاول أن تكون نسخة أرخص منهم. ابحث عن شريحة لا يخدمونها جيداً، أو حاجة لا يلبونها، وركز عليها.

**ثالثاً: بنِ علاقات أعمق مع عملائك**
الشركات الكبيرة غالباً تفشل في بناء علاقات شخصية. هذه ميزتك التنافسية الأكبر كمشروع صغير.

**رابعاً: كن أسرع في التكيف**
المشاريع الصغيرة تستطيع التغيير والتكيف بسرعة أكبر بكثير من الشركات الكبيرة. استغل هذه الميزة.

**خامساً: ركز على تجربة العميل**
تجربة عميل استثنائية تصنع ولاءً لا تستطيع أي ميزانية إعلانية شراؤه.

تذكر: الهدف ليس أن تكون الأكبر، بل أن تكون الأفضل لشريحتك المستهدفة.`,
    content_en: `Many small business owners feel discouraged when they see competitors with massive budgets. But the truth is, a big budget doesn't always guarantee a win. Here's how to outsmart your competitors intelligently.

**First: Understand your competitors before competing with them**
Study their products, prices, marketing messages, and customer reviews. You'll always find gaps they haven't addressed.

**Second: Look for gaps, not similarities**
Don't try to be a cheaper version of them. Find a segment they don't serve well, or a need they don't fulfill, and focus on it.

**Third: Build deeper relationships with your customers**
Large companies often fail at building personal relationships. This is your biggest competitive advantage as a small business.

**Fourth: Be faster to adapt**
Small businesses can change and adapt much faster than large corporations. Leverage this advantage.

**Fifth: Focus on customer experience**
An exceptional customer experience creates loyalty that no advertising budget can buy.

Remember: the goal isn't to be the biggest — it's to be the best for your target segment.`,
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
          `INSERT INTO blog_posts (slug, title_ar, title_en, excerpt_ar, excerpt_en, content_ar, content_en, category, tags, published, published_at, reading_time_min, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, NOW(), NOW())`,
          [
            blog.slug,
            blog.title_ar,
            blog.title_en,
            blog.excerpt_ar,
            blog.excerpt_en,
            blog.content_ar,
            blog.content_en,
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
