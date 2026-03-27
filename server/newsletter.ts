/**
 * Newsletter System — weekly brand tips for subscribers.
 * 
 * Flow:
 * 1. User signs up with newsletterOptIn=true → auto-subscribed
 * 2. Unsubscribe link in every email → sets newsletterOptIn=0
 * 3. Weekly scheduler sends curated brand tips
 * 
 * Content: Pre-written tips rotated weekly (no AI needed).
 */

import { eq, and } from "drizzle-orm";
import { users } from "../drizzle/schema";
import { getDb } from "./db/index";
import { logger } from "./_core/logger";

const WEEKLY_TIPS = [
  {
    subject: "The Clarity Test — can your team pass it?",
    subjectAr: "اختبار الوضوح — فريقك يقدر يعديه؟",
    tip: "Ask 5 people on your team: 'What makes us different?' If you get 5 different answers, you have a Clarity Gap. This is the #1 invisible brand killer.",
    tipAr: "اسأل 5 أشخاص في فريقك: 'إيه اللي بيميّزنا؟' لو جالك 5 إجابات مختلفة، عندك فجوة وضوح. ده القاتل #1 الغير مرئي للبراند.",
    cta: "Run a free Brand Diagnosis →",
    ctaAr: "شغّل تشخيص البراند المجاني →",
    ctaUrl: "/tools",
  },
  {
    subject: "Why 6 packages kill your conversion rate",
    subjectAr: "ليه 6 باكدجات بتقتل معدل التحويل بتاعك",
    tip: "The jam study: 24 options → 3% bought. 6 options → 30% bought. If customers keep asking 'What's the difference between X and Y?' — your offer structure is leaking conversions.",
    tipAr: "دراسة المربى: 24 خيار → 3% اشتروا. 6 خيارات → 30% اشتروا. لو العملاء بيسألوا 'إيه الفرق بين X و Y؟' — هيكل العرض بتاعك بيسرّب تحويلات.",
    cta: "Read: Offer Logic 101 →",
    ctaAr: "اقرأ: منطق العرض 101 →",
    ctaUrl: "/guides/offer-logic",
  },
  {
    subject: "A logo is not a brand identity",
    subjectAr: "اللوجو مش هوية براند",
    tip: "Remove your logo. Can people still recognize your brand? If not, you have a mark — not an identity. Real identity = positioning + messaging + visual system + verbal tone + guidelines.",
    tipAr: "شيل اللوجو. الناس لسه هتعرف البراند بتاعك؟ لو لا، عندك علامة — مش هوية. الهوية الحقيقية = تموضع + رسائل + نظام بصري + نبرة كلام + دليل.",
    cta: "Read: What Is Brand Identity →",
    ctaAr: "اقرأ: إيه هي هوية البراند →",
    ctaUrl: "/guides/brand-identity",
  },
  {
    subject: "Price is a message, not a number",
    subjectAr: "السعر رسالة، مش رقم",
    tip: "The Anchoring Effect (Kahneman): the first price a customer sees becomes their reference. Show premium first → mid-tier feels like a bargain. Show cheapest first → everything feels expensive.",
    tipAr: "تأثير المرساة (Kahneman): أول سعر العميل بيشوفه بيبقى مرجعه. وري البريميوم الأول → الوسط هيحسسه بصفقة. وري الأرخص الأول → كل حاجة هتحسسه إنها غالية.",
    cta: "Check your pricing logic →",
    ctaAr: "افحص منطق التسعير بتاعك →",
    ctaUrl: "/tools",
  },
  {
    subject: "The 3-second test your website fails",
    subjectAr: "اختبار الـ 3 ثواني اللي موقعك بيفشل فيه",
    tip: "A stranger lands on your homepage. Within 3 seconds they must answer: What do you do? Who is it for? Why should I care? If ANY of these is unclear, you're losing visitors before they scroll.",
    tipAr: "غريب دخل على الصفحة الرئيسية. في 3 ثواني لازم يقدر يجاوب: بتعملوا إيه؟ لمين؟ ليه أهتم؟ لو أي واحدة مش واضحة، بتخسر زوار قبل ما يعملوا scroll.",
    cta: "Run a Presence Audit →",
    ctaAr: "شغّل فحص الحضور →",
    ctaUrl: "/tools",
  },
  {
    subject: "Your 'About Us' page is about you. It shouldn't be.",
    subjectAr: "صفحة 'من نحن' بتتكلم عنك. المفروض لا.",
    tip: "The best About pages are actually about the CUSTOMER's problem. Open with their pain. Then explain how you solve it. Your story comes last — and only if it builds trust.",
    tipAr: "أحسن صفحات 'من نحن' بتتكلم عن مشكلة العميل. افتح بالألم بتاعهم. بعدين اشرح إزاي بتحلها. قصتك تيجي في الآخر — وبس لو بتبني ثقة.",
    cta: "Check your messaging →",
    ctaAr: "افحص رسالتك →",
    ctaUrl: "/tools",
  },
  {
    subject: "The proof stack: why testimonials alone don't work",
    subjectAr: "كومة الإثبات: ليه الشهادات لوحدها مش كفاية",
    tip: "A proof stack has 5 layers: (1) Testimonials, (2) Case studies with numbers, (3) Certifications or press, (4) Process transparency, (5) Risk reversal (guarantee). Most businesses only have layer 1.",
    tipAr: "كومة الإثبات فيها 5 طبقات: (1) شهادات (2) دراسات حالة بأرقام (3) شهادات أو صحافة (4) شفافية العملية (5) عكس المخاطر (ضمان). معظم البزنسات عندها الطبقة الأولى بس.",
    cta: "Read: Offer Logic 101 →",
    ctaAr: "اقرأ: منطق العرض 101 →",
    ctaUrl: "/guides/offer-logic",
  },
  {
    subject: "Why 'we do everything' means 'we do nothing well'",
    subjectAr: "ليه 'بنعمل كل حاجة' معناها 'مش بنعمل حاجة كويس'",
    tip: "Positioning is about sacrifice. The brands that try to serve everyone end up serving no one with excellence. Pick a niche. Dominate it. Then expand.",
    tipAr: "التموضع عن التضحية. البراندات اللي بتحاول تخدم الكل بتنتهي إنها مبتخدمش حد بتميّز. اختار niche. سيطر عليه. بعدين توسّع.",
    cta: "Check your brand positioning →",
    ctaAr: "افحص تموضع البراند →",
    ctaUrl: "/tools",
  },
  {
    subject: "The follow-up gap: where 80% of leads die",
    subjectAr: "فجوة المتابعة: فين 80% من الـ leads بيموتوا",
    tip: "48% of salespeople never follow up. 80% of deals need 5+ follow-ups. If someone inquired and you replied once — you probably lost them. Build a follow-up sequence: Day 1, Day 3, Day 7, Day 14.",
    tipAr: "48% من المبيعات مش بيتابعوا أبداً. 80% من الصفقات محتاجة 5+ متابعات. لو حد استفسر وأنت رديت مرة — غالباً خسرته. ابني تسلسل متابعة: يوم 1، يوم 3، يوم 7، يوم 14.",
    cta: "Run a Brand Diagnosis →",
    ctaAr: "شغّل تشخيص البراند →",
    ctaUrl: "/tools",
  },
  {
    subject: "Content without strategy is noise",
    subjectAr: "المحتوى من غير استراتيجية = ضوضاء",
    tip: "Posting daily without a messaging framework is like shouting in a crowded room. First: define what you want to be known for (positioning). Then: create a content pillar for each message. Then: post.",
    tipAr: "النشر اليومي من غير framework للرسائل زي الصراخ في أوضة مزدحمة. الأول: حدد عايز تتعرف بإيه (تموضع). بعدين: اعمل عمود محتوى لكل رسالة. بعدين: انشر.",
    cta: "Read: What Is Brand Identity →",
    ctaAr: "اقرأ: إيه هي هوية البراند →",
    ctaUrl: "/guides/brand-identity",
  },
  {
    subject: "Expensive growth = broken brand",
    subjectAr: "نمو غالي = براند مكسور",
    tip: "If your cost per lead keeps rising, the problem isn't your ad budget — it's your brand clarity. When positioning is sharp, every marketing dollar works harder. When it's vague, you're paying for confusion.",
    tipAr: "لو تكلفة الـ lead بتزيد، المشكلة مش الـ ad budget — المشكلة في وضوح البراند. لما التموضع حاد، كل جنيه تسويق بيشتغل أقوى. لما غامض، بتدفع ثمن الارتباك.",
    cta: "Audit your brand health →",
    ctaAr: "افحص صحة البراند →",
    ctaUrl: "/guides/brand-health",
  },
  {
    subject: "The 'premium perception' checklist",
    subjectAr: "تشيكلست 'الإحساس بالبريميوم'",
    tip: "5 signs your brand feels premium: (1) Consistent visual language, (2) Deliberate white space, (3) Selective about who you serve, (4) Clear 'this is not for you' signals, (5) Proof of transformation, not just features.",
    tipAr: "5 علامات إن البراند بيحسّس بالبريميوم: (1) لغة بصرية متسقة (2) مساحة بيضاء متعمدة (3) انتقائي فيمن تخدمه (4) إشارات واضحة 'ده مش ليك' (5) إثبات تحوّل، مش مجرد مميزات.",
    cta: "Check your identity →",
    ctaAr: "افحص هويتك →",
    ctaUrl: "/tools",
  },
];

// ════════════════════════════════════════════
// DB HELPERS
// ════════════════════════════════════════════

export async function getNewsletterSubscribers(): Promise<Array<{ id: number; email: string; name: string | null }>> {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({ id: users.id, email: users.email, name: users.name })
    .from(users)
    .where(and(eq(users.newsletterOptIn, 1)))
    .limit(5000);
  return rows.filter((r): r is { id: number; email: string; name: string | null } => Boolean(r.email));
}

export async function unsubscribeUser(email: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  try {
    await db.update(users).set({ newsletterOptIn: 0 }).where(eq(users.email, email));
    logger.info({ email }, '[Newsletter] User unsubscribed');
    return true;
  } catch {
    return false;
  }
}

// ════════════════════════════════════════════
// SEND WEEKLY TIP
// ════════════════════════════════════════════

function getWeekNumber(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now.getTime() - start.getTime();
  return Math.floor(diff / (7 * 24 * 60 * 60 * 1000));
}

function wrapEmail(tip: typeof WEEKLY_TIPS[0], appUrl: string, email: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{margin:0;padding:0;background:#09090b;font-family:-apple-system,sans-serif;color:#b0b0be}
.c{max-width:520px;margin:0 auto;padding:32px 24px}
.logo{font-family:monospace;font-size:16px;font-weight:700;color:#f4f4f6;letter-spacing:2px;text-align:center;margin-bottom:24px}
.logo span{background:linear-gradient(135deg,#6d5cff,#44ddc9);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.card{background:#111114;border:1px solid rgba(255,255,255,.06);border-radius:14px;padding:28px}
h2{font-size:18px;color:#f4f4f6;margin:0 0 12px}
p{margin:0 0 14px;line-height:1.8;font-size:14px}
.btn{display:inline-block;padding:10px 24px;border-radius:30px;background:linear-gradient(135deg,#c8a24e,#e0b94b);color:#09090b;font-weight:700;font-size:13px;text-decoration:none}
.footer{text-align:center;padding:20px;font-size:11px;color:#64647a}
.footer a{color:#9a7a3a}
</style></head><body><div class="c">
<div class="logo">WZRD <span>AI</span></div>
<div class="card">
<h2>${tip.subject}</h2>
<p>${tip.tip}</p>
<p><a href="${appUrl}${tip.ctaUrl}" class="btn">${tip.cta}</a></p>
</div>
<div class="footer">
<p>Weekly brand tip from <a href="${appUrl}">WZRD AI</a> by Primo Marca</p>
<p><a href="${appUrl}/unsubscribe?email=${encodeURIComponent(email)}">Unsubscribe</a></p>
</div>
</div></body></html>`;
}

export async function sendWeeklyNewsletter(): Promise<{ sent: number; failed: number }> {
  const provider = process.env.EMAIL_PROVIDER || 'none';
  const apiKey = process.env.EMAIL_API_KEY;
  if (provider === 'none' || !apiKey) {
    logger.info('[Newsletter] Skipped — no email provider');
    return { sent: 0, failed: 0 };
  }

  const subscribers = await getNewsletterSubscribers();
  if (subscribers.length === 0) {
    logger.info('[Newsletter] No subscribers');
    return { sent: 0, failed: 0 };
  }

  const weekNum = getWeekNumber();
  const tipIndex = weekNum % WEEKLY_TIPS.length;
  const tip = WEEKLY_TIPS[tipIndex];
  const appUrl = process.env.APP_URL || 'https://wzzrdai.com';
  const from = process.env.EMAIL_FROM || 'WZRD AI <noreply@primomarca.com>';

  let sent = 0, failed = 0;

  for (const sub of subscribers) {
    try {
      const html = wrapEmail(tip, appUrl, sub.email);

      if (provider === 'resend') {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
          body: JSON.stringify({ from, to: sub.email, subject: `💡 ${tip.subject}`, html }),
        });
        if (res.ok) sent++; else failed++;
      }
    } catch {
      failed++;
    }
  }

  logger.info({ sent, failed, total: subscribers.length, tip: tip.subject }, '[Newsletter] Weekly send complete');
  return { sent, failed };
}

// ════════════════════════════════════════════
// SCHEDULER — runs every hour, sends on Sunday 10am
// ════════════════════════════════════════════

let lastSentWeek = -1;

export function startNewsletterScheduler() {
  setInterval(async () => {
    const now = new Date();
    const weekNum = getWeekNumber();

    // Send on Sunday at 10am (UTC)
    if (now.getUTCDay() === 0 && now.getUTCHours() === 10 && weekNum !== lastSentWeek) {
      lastSentWeek = weekNum;
      await sendWeeklyNewsletter();
    }
  }, 60 * 60 * 1000); // Check every hour

  logger.info('[Newsletter] Scheduler started — sends every Sunday 10am UTC');
}
