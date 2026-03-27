/**
 * AUTO REPORT GENERATOR
 * =====================
 * 
 * Generates monthly reports for active clients automatically.
 * 
 * Each report includes:
 * 1. Project progress summary
 * 2. Deliverables completed this month
 * 3. Fresh market insights (from live research)
 * 4. Recommended next steps
 * 5. Key metrics and quality scores
 * 
 * Reports are saved as deliverables and can be viewed in the Client Portal.
 */

import { logger } from './_core/logger';

/** Safely extract insertId from Drizzle result */
function getInsertId(result: unknown): number | undefined {
  if (!result) return undefined;
  if (Array.isArray(result) && result[0]) return (result[0] as { insertId?: number }).insertId;
  return (result as { id?: number; insertId?: number }).id ?? (result as { insertId?: number }).insertId;
}
import { resilientLLM } from './_core/llmRouter';
import {
  getClients, getProjectsByClient, getDeliverablesByProject,
  createDeliverable, getNotesByClient,
} from './db';
import { liveResearch } from './liveIntelligence';
import { SERVICE_LABELS } from '@shared/const';

export interface MonthlyReport {
  clientId: number;
  clientName: string;
  projectId: number;
  projectName: string;
  reportContent: string;
  deliverableId?: number;
}

/**
 * Generate a monthly report for a specific project.
 */
export async function generateMonthlyReport(
  projectId: number,
  clientId: number
): Promise<MonthlyReport | null> {
  try {
    const clients = await getClients({ page: 1, pageSize: 100 });
    const client = (clients.data || clients).find((c: { id: number }) => c.id === clientId);
    if (!client) return null;

    const projects = await getProjectsByClient(clientId);
    const project = projects.find((p: { id: number }) => p.id === projectId);
    if (!project || project.status === 'completed' || project.status === 'cancelled') return null;

    const deliverables = await getDeliverablesByProject(projectId);
    const notes = await getNotesByClient(clientId);

    // Get fresh market insight
    let marketUpdate = '';
    if (client.industry) {
      try {
        const research = await liveResearch(
          `${client.industry} market trends ${client.market || 'MENA'} ${new Date().getFullYear()}`,
          { industry: client.industry, market: client.market || undefined }
        );
        marketUpdate = research.answer;
      } catch { /* Non-blocking */ }
    }

    // Build report context
    const completedDeliverables = deliverables.filter((d: { status: string }) => ['approved', 'delivered'].includes(d.status));
    const pendingDeliverables = deliverables.filter((d: { status: string }) => ['pending', 'in_progress', 'ai_generated'].includes(d.status));
    const avgQuality = deliverables.filter((d: { qualityScore?: number | null }) => d.qualityScore)
      .reduce((sum: number, d: { qualityScore?: number | null }) => sum + (d.qualityScore || 0), 0) / Math.max(1, deliverables.filter((d: { qualityScore?: number | null }) => d.qualityScore).length);

    const serviceLabel = SERVICE_LABELS[project.serviceType as keyof typeof SERVICE_LABELS] || project.serviceType;

    // Generate report with AI
    const response = await resilientLLM({
      messages: [
        {
          role: 'system',
          content: `You are a senior brand strategist. Generate a monthly performance report in STRICT Markdown.

Structure (use exactly these headings):
# Monthly Brand Report — [Month Year]
## Key Metrics
## Executive Summary
## What Worked Well
## Areas for Improvement
## Action Plan for Next Month

Rules:
- Use ## for all section headings, never #
- Use **bold** for emphasis
- Use - for bullet points (never *)
- Do NOT use HTML tags
- Do NOT add a preamble or closing remarks outside the structure
- Keep each section concise (3-5 points max)`,
        },
        {
          role: 'user',
          content: `Generate a monthly report for:

CLIENT: ${client.companyName || client.name}
PROJECT: ${project.name}
SERVICE: ${serviceLabel}
CURRENT STAGE: ${project.stage}
STATUS: ${project.status}
MARKET: ${client.market || 'MENA'}
INDUSTRY: ${client.industry || 'General'}

DELIVERABLES COMPLETED: ${completedDeliverables.length}
${completedDeliverables.map((d: { title: string; qualityScore?: number | null }) => `- ${d.title} (QA Score: ${d.qualityScore || 'N/A'}/100)`).join('\n')}

DELIVERABLES IN PROGRESS: ${pendingDeliverables.length}
${pendingDeliverables.map((d: { title: string; status: string }) => `- ${d.title} (Status: ${d.status})`).join('\n')}

AVERAGE QUALITY SCORE: ${Math.round(avgQuality)}/100

RECENT NOTES: ${notes.slice(0, 3).map((n: { category: string; title: string }) => `[${n.category}] ${n.title}`).join(', ') || 'None'}

${marketUpdate ? `LATEST MARKET UPDATE:\n${marketUpdate.substring(0, 1000)}` : ''}

Generate the monthly progress report.`,
        },
      ],
    }, { context: 'research' });

    const reportContent = response.choices[0].message.content as string;

    // Save as deliverable
    const month = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });
    const result = await createDeliverable({
      projectId,
      title: `Monthly Report — ${month}`,
      description: `Auto-generated monthly progress report for ${client.companyName || client.name}`,
      stage: project.stage === 'completed' ? 'optimize' : project.stage,
      status: 'delivered',
      sortOrder: 100 + new Date().getMonth(),
      content: reportContent,
      aiGenerated: 1,
    });
    const deliverableId = getInsertId(result);

    logger.info({ projectId, clientId, month }, 'Monthly report generated');

    return {
      clientId,
      clientName: client.companyName || client.name,
      projectId,
      projectName: project.name,
      reportContent,
      deliverableId,
    };
  } catch (err) {
    logger.error({ err, projectId, clientId }, 'Monthly report generation failed');
    return null;
  }
}

/**
 * Generate monthly reports for ALL active projects.
 * Call this via a cron job or manual trigger.
 */
export async function generateAllMonthlyReports(): Promise<{
  generated: number;
  failed: number;
  reports: MonthlyReport[];
}> {
  const reports: MonthlyReport[] = [];
  let failed = 0;

  try {
    const clients = await getClients({ page: 1, pageSize: 500 });
    const clientList = clients.data || clients;

    for (const client of clientList) {
      if (client.status !== 'active') continue;

      const projects = await getProjectsByClient(client.id);
      for (const project of projects) {
        if (project.status !== 'active') continue;

        const report = await generateMonthlyReport(project.id, client.id);
        if (report) {
          reports.push(report);
        } else {
          failed++;
        }
      }
    }
  } catch (err) {
    logger.error({ err }, 'Batch monthly report generation failed');
  }

  logger.info({ generated: reports.length, failed }, 'Monthly reports batch completed');
  return { generated: reports.length, failed, reports };
}
