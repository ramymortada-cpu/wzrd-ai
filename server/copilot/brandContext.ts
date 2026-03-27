/**
 * Rich brand context for Copilot — diagnoses (latest per tool), Brand Twin snapshot,
 * active alerts, pending checklists. Resolves CRM clientId vs userId correctly.
 */
import { eq, desc, and, inArray, isNull, sql } from "drizzle-orm";
import type { AppDatabase } from "../db/types";
import {
  users,
  diagnosisHistory,
  brandAlerts,
  brandMetrics,
  userChecklists,
  clients,
  brandHealthSnapshots,
} from "../../drizzle/schema";

const DIAGNOSIS_TOOL_IDS = [
  "brand_diagnosis",
  "offer_check",
  "message_check",
  "presence_audit",
  "identity_snapshot",
  "launch_readiness",
] as const;

const TOOL_NAMES_AR: Record<string, string> = {
  brand_diagnosis: "تشخيص البراند",
  offer_check: "فحص العرض",
  message_check: "فحص الرسالة",
  presence_audit: "تدقيق الحضور",
  identity_snapshot: "لقطة الهوية",
  launch_readiness: "جاهزية الإطلاق",
};

const DIM_AR: Record<string, string> = {
  identity: "الهوية",
  positioning: "التموضع",
  messaging: "الرسالة",
  visual: "الهوية البصرية",
  digital_presence: "الحضور الرقمي",
  reputation: "السمعة",
  market_fit: "التوافق مع السوق",
};

function norm(s: string | null | undefined): string {
  return (s ?? "").trim().toLowerCase();
}

/**
 * CRM client IDs linked to this user (email / company name), newest Brand Twin activity first.
 */
export async function getCopilotEligibleClientIdsSorted(
  db: AppDatabase,
  userId: number,
): Promise<number[]> {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return [];

  const candidateIds = new Set<number>();

  const email = user.email?.trim();
  if (email) {
    const byEmail = await db
      .select({ id: clients.id })
      .from(clients)
      .where(and(isNull(clients.deletedAt), sql`LOWER(${clients.email}) = ${email.toLowerCase()}`))
      .limit(25);
    for (const r of byEmail) candidateIds.add(r.id);
  }

  const company = user.company?.trim();
  if (company) {
    const compNorm = norm(company);
    const byCompany = await db
      .select({ id: clients.id })
      .from(clients)
      .where(
        and(
          isNull(clients.deletedAt),
          sql`(LOWER(TRIM(IFNULL(${clients.companyName},''))) = ${compNorm} OR LOWER(TRIM(IFNULL(${clients.name},''))) = ${compNorm})`,
        ),
      )
      .limit(25);
    for (const r of byCompany) candidateIds.add(r.id);
  }

  if (candidateIds.size === 0) return [];

  const ids = [...candidateIds];
  const latestPerClient = await db
    .select({
      clientId: brandHealthSnapshots.clientId,
      createdAt: brandHealthSnapshots.createdAt,
    })
    .from(brandHealthSnapshots)
    .where(inArray(brandHealthSnapshots.clientId, ids))
    .orderBy(desc(brandHealthSnapshots.createdAt))
    .limit(500);

  const bestSeen = new Map<number, number>();
  for (const row of latestPerClient) {
    const t = row.createdAt ? new Date(row.createdAt).getTime() : 0;
    const prev = bestSeen.get(row.clientId) ?? 0;
    if (t > prev) bestSeen.set(row.clientId, t);
  }

  return ids.sort((a, b) => {
    const ta = bestSeen.get(a) ?? 0;
    const tb = bestSeen.get(b) ?? 0;
    if (tb !== ta) return tb - ta;
    return a - b;
  });
}

/**
 * Map logged-in user → default Brand CRM client (for snapshots / alerts / metrics).
 */
export async function resolveBrandTwinClientId(
  db: AppDatabase,
  userId: number,
): Promise<number | null> {
  const sorted = await getCopilotEligibleClientIdsSorted(db, userId);
  return sorted[0] ?? null;
}

/**
 * Resolve Brand Twin client for this chat: explicit selection (if allowed) or auto-detect.
 */
export async function resolveTwinClientIdForCopilot(
  db: AppDatabase,
  userId: number,
  userRole: string,
  explicitClientId?: number | null,
): Promise<number | null> {
  if (explicitClientId != null && explicitClientId > 0) {
    if (userRole === "admin") {
      const [row] = await db
        .select({ id: clients.id })
        .from(clients)
        .where(and(eq(clients.id, explicitClientId), isNull(clients.deletedAt)))
        .limit(1);
      if (!row) {
        throw new Error("العميل غير موجود.");
      }
      return explicitClientId;
    }
    const allowed = await getCopilotEligibleClientIdsSorted(db, userId);
    if (!allowed.includes(explicitClientId)) {
      throw new Error("مش مسموح تستخدم سياق هذا العميل — مش مرتبط بحسابك.");
    }
    return explicitClientId;
  }
  return resolveBrandTwinClientId(db, userId);
}

export type CopilotClientRow = { id: number; name: string; companyName: string | null };

/**
 * Clients shown in Copilot context switcher. Admins: CRM clients with Brand Twin data (else recent clients).
 * Regular users: only clients matched to their profile.
 */
export async function listClientsForCopilot(
  db: AppDatabase,
  userId: number,
  userRole: string,
): Promise<CopilotClientRow[]> {
  if (userRole === "admin") {
    const withTwin = await db
      .selectDistinct({ clientId: brandHealthSnapshots.clientId })
      .from(brandHealthSnapshots);
    const twinSet = new Set(withTwin.map((r) => r.clientId));
    const rows = await db
      .select({ id: clients.id, name: clients.name, companyName: clients.companyName })
      .from(clients)
      .where(isNull(clients.deletedAt))
      .orderBy(desc(clients.updatedAt))
      .limit(80);
    const prefer = rows.filter((r) => twinSet.has(r.id));
    const list = prefer.length > 0 ? prefer : rows;
    return list.slice(0, 30).map((r) => ({
      id: r.id,
      name: r.name,
      companyName: r.companyName,
    }));
  }

  const ids = await getCopilotEligibleClientIdsSorted(db, userId);
  if (ids.length === 0) return [];

  const rows = await db
    .select({ id: clients.id, name: clients.name, companyName: clients.companyName })
    .from(clients)
    .where(and(isNull(clients.deletedAt), inArray(clients.id, ids)));

  const order = new Map(ids.map((id, i) => [id, i]));
  return rows
    .sort((a, b) => (order.get(a.id) ?? 99) - (order.get(b.id) ?? 99))
    .map((r) => ({ id: r.id, name: r.name, companyName: r.companyName }));
}

export type DiagnosisRow = typeof diagnosisHistory.$inferSelect;

/** Latest diagnosis row per toolId (most recent first pass). */
export function latestDiagnosisPerTool(rows: DiagnosisRow[]): Map<string, DiagnosisRow> {
  const map = new Map<string, DiagnosisRow>();
  for (const d of rows) {
    if (!map.has(d.toolId)) map.set(d.toolId, d);
  }
  return map;
}

export async function buildBrandContext(
  userId: number,
  db: AppDatabase,
  twinClientId: number | null,
): Promise<string> {
  const parts: string[] = [];

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (user) {
    parts.push(`## معلومات المستخدم والبراند
الاسم: ${user.name || "غير محدد"}
الشركة: ${user.company || "غير محدد"}
الصناعة: ${user.industry || "غير محدد"}
السوق: ${user.market || "غير محدد"}`);
  }

  const diagnosisRows = await db
    .select()
    .from(diagnosisHistory)
    .where(eq(diagnosisHistory.userId, userId))
    .orderBy(desc(diagnosisHistory.createdAt))
    .limit(80);

  const latestByTool = latestDiagnosisPerTool(diagnosisRows);

  if (latestByTool.size > 0) {
    parts.push("\n## أحدث نتيجة لكل أداة تشخيص (استخدمها للتخصيص)");
    const ordered = DIAGNOSIS_TOOL_IDS.filter((id) => latestByTool.has(id));
    for (const toolId of ordered) {
      const d = latestByTool.get(toolId)!;
      const name = TOOL_NAMES_AR[toolId] || toolId;
      let line = `- ${name}: ${d.score}/100`;
      if (d.findings && Array.isArray(d.findings)) {
        const high = (d.findings as { severity?: string; title?: string }[])
          .filter((f) => f.severity === "high")
          .map((f) => f.title ?? "")
          .filter(Boolean)
          .slice(0, 2);
        if (high.length > 0) line += ` | مشاكل حرجة: ${high.join("، ")}`;
      }
      parts.push(line);
    }
    for (const [toolId, d] of latestByTool) {
      if (DIAGNOSIS_TOOL_IDS.includes(toolId as (typeof DIAGNOSIS_TOOL_IDS)[number])) continue;
      const name = TOOL_NAMES_AR[toolId] || toolId;
      parts.push(`- ${name}: ${d.score}/100`);
    }
  }

  if (twinClientId != null) {
    parts.push(`\n## Brand Twin (عميل CRM #${twinClientId})`);

    const [snapshot] = await db
      .select()
      .from(brandHealthSnapshots)
      .where(eq(brandHealthSnapshots.clientId, twinClientId))
      .orderBy(desc(brandHealthSnapshots.createdAt))
      .limit(1);

    if (snapshot) {
      const dims: Array<{ key: string; score: number | null }> = [
        { key: "identity", score: snapshot.identityScore },
        { key: "positioning", score: snapshot.positioningScore },
        { key: "messaging", score: snapshot.messagingScore },
        { key: "visual", score: snapshot.visualScore },
        { key: "digital_presence", score: snapshot.digitalPresenceScore },
        { key: "reputation", score: snapshot.reputationScore },
        { key: "market_fit", score: snapshot.marketFitScore },
      ];
      parts.push(`آخر لقطة صحة البراند: ${snapshot.overallScore}/100 (التاريخ: ${snapshot.createdAt})`);
      parts.push("الأبعاد السبعة:");
      let weakest: { key: string; score: number } | null = null;
      for (const { key, score } of dims) {
        const s = score ?? 0;
        const label = s >= 70 ? "✅" : s >= 40 ? "⚠️" : "🔴";
        parts.push(`- ${DIM_AR[key] || key}: ${s}/100 ${label}`);
        if (weakest == null || s < weakest.score) weakest = { key, score: s };
      }
      if (snapshot.summary) {
        const sum = String(snapshot.summary).replace(/\s+/g, " ").trim().slice(0, 400);
        if (sum) parts.push(`ملخص اللقطة: ${sum}`);
      }
      if (weakest) {
        parts.push(
          `أضعف بُعد حالياً: ${DIM_AR[weakest.key] || weakest.key} (${weakest.score}/100) — ركّز عليه لو السؤال عام.`,
        );
      }
    } else {
      const metrics = await db
        .select()
        .from(brandMetrics)
        .where(eq(brandMetrics.clientId, twinClientId))
        .orderBy(desc(brandMetrics.createdAt))
        .limit(60);

      const dimScores = new Map<string, number>();
      for (const m of metrics) {
        const dim = m.dimension as string;
        if (!dimScores.has(dim)) dimScores.set(dim, m.score ?? 0);
      }
      if (dimScores.size > 0) {
        parts.push("أبعاد (من brand_metrics — آخر قياس لكل بعد):");
        for (const [dim, score] of dimScores) {
          const label = score >= 70 ? "✅" : score >= 40 ? "⚠️" : "🔴";
          parts.push(`- ${DIM_AR[dim] || dim}: ${score}/100 ${label}`);
        }
      }
    }

    const alerts = await db
      .select()
      .from(brandAlerts)
      .where(and(eq(brandAlerts.clientId, twinClientId), eq(brandAlerts.status, "active")))
      .orderBy(desc(brandAlerts.createdAt))
      .limit(12);

    const important = alerts.filter((a) => a.severity === "critical" || a.severity === "warning");
    if (important.length > 0) {
      parts.push("\n## تنبيهات Brand Twin نشطة (أول بالأهم)");
      for (const a of important.slice(0, 6)) {
        const sev = a.severity === "critical" ? "🔴" : "⚠️";
        const descText = (a.description ?? "").replace(/\s+/g, " ").trim().slice(0, 180);
        parts.push(`${sev} ${a.title}${descText ? ` — ${descText}` : ""}`);
      }
    }
  } else {
    parts.push(
      "\n## Brand Twin\nلا يوجد عميل CRM مربوط واضح (بريد/اسم شركة) — ركّز على نتائج التشخيص أعلاه.",
    );
  }

  const checklists = await db
    .select()
    .from(userChecklists)
    .where(eq(userChecklists.userId, userId))
    .orderBy(desc(userChecklists.createdAt))
    .limit(5);

  const pendingTasks: string[] = [];
  for (const cl of checklists) {
    if (cl.items && Array.isArray(cl.items)) {
      const incomplete = (cl.items as { completed?: boolean; task?: string }[])
        .filter((item) => !item.completed)
        .map((item) => (item.task ?? "").trim())
        .filter(Boolean)
        .slice(0, 4);
      pendingTasks.push(...incomplete);
    }
  }
  if (pendingTasks.length > 0) {
    parts.push(`\n## مهام checklist غير مكتملة (أولوية للمتابعة)`);
    for (const t of pendingTasks.slice(0, 8)) parts.push(`- ${t}`);
  }

  return parts.join("\n");
}

export interface CopilotSuggestionItem {
  text: string;
  icon: string;
}

export async function buildCopilotSuggestions(
  userId: number,
  db: AppDatabase,
): Promise<CopilotSuggestionItem[]> {
  const suggestions: CopilotSuggestionItem[] = [];

  const twinClientId = await resolveBrandTwinClientId(db, userId);

  if (twinClientId != null) {
    const alerts = await db
      .select()
      .from(brandAlerts)
      .where(
        and(
          eq(brandAlerts.clientId, twinClientId),
          eq(brandAlerts.status, "active"),
          eq(brandAlerts.severity, "critical"),
        ),
      )
      .orderBy(desc(brandAlerts.createdAt))
      .limit(2);
    for (const a of alerts) {
      suggestions.push({
        text: `إيه الحل العملي لمشكلة: "${a.title.slice(0, 60)}${a.title.length > 60 ? "…" : ""}"؟`,
        icon: "🚨",
      });
    }

    const [snapshot] = await db
      .select()
      .from(brandHealthSnapshots)
      .where(eq(brandHealthSnapshots.clientId, twinClientId))
      .orderBy(desc(brandHealthSnapshots.createdAt))
      .limit(1);

    if (snapshot) {
      const dims: Array<{ key: string; score: number | null }> = [
        { key: "identity", score: snapshot.identityScore },
        { key: "positioning", score: snapshot.positioningScore },
        { key: "messaging", score: snapshot.messagingScore },
        { key: "visual", score: snapshot.visualScore },
        { key: "digital_presence", score: snapshot.digitalPresenceScore },
        { key: "reputation", score: snapshot.reputationScore },
        { key: "market_fit", score: snapshot.marketFitScore },
      ];
      let weakest = dims[0]!;
      for (const d of dims) {
        const s = d.score ?? 0;
        const ws = weakest.score ?? 0;
        if (s < ws) weakest = d;
      }
      const wScore = weakest.score ?? 0;
      if (wScore < 65) {
        suggestions.push({
          text: `إزاي أرفع بُعد ${DIM_AR[weakest.key] || weakest.key} اللي نازل (${wScore}/100)؟`,
          icon: "📉",
        });
      }
    }
  }

  const diagnosisRows = await db
    .select()
    .from(diagnosisHistory)
    .where(eq(diagnosisHistory.userId, userId))
    .orderBy(desc(diagnosisHistory.createdAt))
    .limit(80);

  const latestByTool = latestDiagnosisPerTool(diagnosisRows);
  let lowest: DiagnosisRow | null = null;
  for (const row of latestByTool.values()) {
    if (!lowest || row.score < lowest.score) lowest = row;
  }

  if (lowest) {
    const tn = TOOL_NAMES_AR[lowest.toolId] || lowest.toolId;
    suggestions.push({
      text: `إزاي أحسّن نتيجة ${tn} (${lowest.score}/100)؟`,
      icon: "📈",
    });
  }

  if (suggestions.length < 3) {
    suggestions.push({ text: "اكتبلي Instagram bio قصير ومقنع", icon: "📱" });
  }
  if (suggestions.length < 3) {
    suggestions.push({ text: "ساعدني أكتب positioning statement في جملتين", icon: "🎯" });
  }
  if (suggestions.length < 3) {
    suggestions.push({ text: "إيه أول ٣ خطوات عملية أبدأ بيها بناءً على بياناتي؟", icon: "🔧" });
  }

  return suggestions.slice(0, 6);
}
