/**
 * AUTO-EXECUTION ENGINE
 * =====================
 * 
 * When a project moves to a new stage, the right agents auto-execute:
 * 
 * DIAGNOSE → Researcher searches + Diagnostician analyzes
 * DESIGN  → Strategist builds positioning + messaging
 * DEPLOY  → Executor generates deliverables + QA reviews them
 * OPTIMIZE → Researcher refreshes market data + PM generates report
 * 
 * Ramy reviews and approves at each gate. Nothing reaches the client
 * without human approval.
 */

import { logger } from './_core/logger';
import {
  getProjectById, getClientById, getDeliverablesByProject, updateDeliverable,
  getNotesByClient, updatePipelineRun, createDeliverable,
} from './db';
import { orchestrate, type AgentId } from './agentOrchestrator';
import { liveResearch, deepResearch } from './liveIntelligence';
import { reviewDeliverable } from './qualityAssurance';
import { SERVICE_PLAYBOOKS } from './knowledgeBase';

// ════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════

export interface ExecutionResult {
  stage: string;
  stepsCompleted: number;
  stepsTotal: number;
  outputs: Array<{
    agent: AgentId;
    action: string;
    result: string;
    deliverableId?: number;
    qualityScore?: number;
  }>;
  status: 'completed' | 'partial' | 'failed';
  error?: string;
}

/** Common DB row types used in this module */
interface NoteRow { category: string; title: string; content: string | null }
interface DeliverableRow { id: number; title: string; stage: string; content: string | null; qualityScore?: number | null }
interface PlaybookStage { stage: string; title: string; steps: Array<{ title: string; description: string; deliverable?: string }> }
interface InsertResult { insertId?: number; id?: number }

/** Safely extract insertId from Drizzle insert result */
function getInsertId(result: unknown): number | undefined {
  if (!result) return undefined;
  if (Array.isArray(result) && result[0]) return (result[0] as InsertResult).insertId;
  return (result as InsertResult).id ?? (result as InsertResult).insertId;
}

// ════════════════════════════════════════════
// STAGE EXECUTORS
// ════════════════════════════════════════════

/**
 * Executes the DIAGNOSE stage automatically.
 * 
 * Steps:
 * 1. Researcher searches for company + industry + competitors
 * 2. Diagnostician analyzes findings + client notes
 * 3. Creates a diagnostic summary deliverable
 */
async function executeDiagnose(
  projectId: number, clientId: number, serviceType: string
): Promise<ExecutionResult> {
  const outputs: ExecutionResult['outputs'] = [];
  const client = await getClientById(clientId);
  const notes = await getNotesByClient(clientId);

  if (!client) return { stage: 'diagnose', stepsCompleted: 0, stepsTotal: 3, outputs, status: 'failed', error: 'Client not found' };

  const clientContext = `Client: ${client.companyName || client.name}, Industry: ${client.industry || 'Unknown'}, Market: ${client.market}`;

  try {
    // Step 1: Research
    const topic = `${client.companyName} ${client.industry || ''} branding ${client.market || 'MENA'} competitors market`;
    const research = await deepResearch(topic, { industry: client.industry || undefined, market: client.market || undefined });
    outputs.push({
      agent: 'researcher',
      action: 'Market & competitor research',
      result: `Researched ${research.sourcesUsed} sources → Created ${research.entriesCreated} knowledge entries`,
    });

    // Step 2: Diagnostic analysis
    const notesContext = notes.slice(0, 10).map((n: NoteRow) => `[${n.category}] ${n.title}: ${n.content?.substring(0, 300)}`).join('\n');
    const diagResponse = await orchestrate(
      `Analyze this client and provide a diagnostic assessment. What is their core problem? Which diagnostic pattern applies (Clarity Gap, Commodity Trap, Random Effort, Identity Crisis)? What service do they need and why?\n\nClient notes:\n${notesContext || 'No notes yet — use research data.'}`,
      { clientContext, industry: client.industry || undefined, market: client.market || undefined, serviceType, projectStage: 'diagnose', conversationHistory: [] }
    );
    outputs.push({
      agent: 'diagnostician',
      action: 'Diagnostic assessment',
      result: diagResponse.message.substring(0, 500),
    });

    // Step 3: Create diagnostic deliverable
    const deliverableResult = await createDeliverable({
      projectId, title: 'Diagnostic Assessment Report',
      description: 'AI-generated diagnostic analysis based on research and client data',
      stage: 'diagnose', status: 'ai_generated', sortOrder: 1,
      content: diagResponse.message,
    });
    const deliverableId = getInsertId(deliverableResult);

    // QA the deliverable
    if (deliverableId) {
      const qa = await reviewDeliverable(diagResponse.message, {
        deliverableType: 'diagnostic_assessment', clientName: client.companyName || client.name,
        industry: client.industry || undefined, market: client.market || undefined,
      });
      await updateDeliverable(deliverableId, { qualityScore: qa.score });
      outputs.push({ agent: 'executor', action: 'Quality check', result: `Score: ${qa.score}/100 — ${qa.passed ? 'PASSED' : 'NEEDS REVIEW'}`, deliverableId, qualityScore: qa.score });
    }

    return { stage: 'diagnose', stepsCompleted: 3, stepsTotal: 3, outputs, status: 'completed' };
  } catch (err: unknown) {
    logger.error({ err, projectId }, 'Diagnose auto-execution failed');
    return { stage: 'diagnose', stepsCompleted: outputs.length, stepsTotal: 3, outputs, status: 'partial', error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Executes the DESIGN stage automatically.
 * 
 * Steps:
 * 1. Strategist builds brand positioning
 * 2. Strategist builds messaging framework
 * 3. QA reviews both
 */
async function executeDesign(
  projectId: number, clientId: number, serviceType: string
): Promise<ExecutionResult> {
  const outputs: ExecutionResult['outputs'] = [];
  const client = await getClientById(clientId);
  const existingDeliverables = await getDeliverablesByProject(projectId);
  const diagReport = existingDeliverables.find((d: DeliverableRow) => d.stage === 'diagnose' && d.content);

  if (!client) return { stage: 'design', stepsCompleted: 0, stepsTotal: 3, outputs, status: 'failed', error: 'Client not found' };

  const clientContext = `Client: ${client.companyName || client.name}, Industry: ${client.industry || 'Unknown'}, Market: ${client.market}${diagReport?.content ? `\n\nDiagnostic Findings:\n${diagReport.content.substring(0, 2000)}` : ''}`;

  try {
    // Step 1: Brand Positioning
    const posResponse = await orchestrate(
      `Based on the diagnostic assessment, build a complete Brand Positioning for this client. Include: Target audience definition, Frame of reference, Points of difference (PODs), Points of parity (POPs), Positioning statement, and Reason to believe (RTB). Use Keller CBBE and Kapferer Prism frameworks.`,
      { clientContext, industry: client.industry || undefined, market: client.market || undefined, serviceType, projectStage: 'design', conversationHistory: [] }
    );

    const posDeliverable = await createDeliverable({
      projectId, title: 'Brand Positioning Strategy',
      description: 'AI-generated brand positioning based on diagnostic findings',
      stage: 'design', status: 'ai_generated', sortOrder: 2, content: posResponse.message,
    });
    outputs.push({ agent: 'strategist', action: 'Brand positioning', result: posResponse.message.substring(0, 300), deliverableId: getInsertId(posDeliverable) });

    // Step 2: Messaging Framework
    const msgResponse = await orchestrate(
      `Build a Messaging Framework for this client based on the positioning. Include: Brand narrative (the story), Value proposition (one sentence), Key messages for each audience segment, Tone of voice guidelines, and Tagline options (3-5 options).`,
      { clientContext: clientContext + `\n\nPositioning:\n${posResponse.message.substring(0, 1500)}`, industry: client.industry || undefined, market: client.market || undefined, serviceType, projectStage: 'design', conversationHistory: [] }
    );

    const msgDeliverable = await createDeliverable({
      projectId, title: 'Messaging Framework',
      description: 'AI-generated messaging framework aligned with positioning',
      stage: 'design', status: 'ai_generated', sortOrder: 3, content: msgResponse.message,
    });
    outputs.push({ agent: 'strategist', action: 'Messaging framework', result: msgResponse.message.substring(0, 300), deliverableId: getInsertId(msgDeliverable) });

    // Step 3: QA both
    for (const output of outputs) {
      if (output.deliverableId) {
        const deliverables = await getDeliverablesByProject(projectId);
        const d = deliverables.find((del: DeliverableRow) => del.id === output.deliverableId);
        if (d?.content) {
          const qa = await reviewDeliverable(d.content, { clientName: client.companyName || client.name, industry: client.industry || undefined });
          await updateDeliverable(output.deliverableId, { qualityScore: qa.score });
          output.qualityScore = qa.score;
        }
      }
    }

    return { stage: 'design', stepsCompleted: 3, stepsTotal: 3, outputs, status: 'completed' };
  } catch (err: unknown) {
    logger.error({ err, projectId }, 'Design auto-execution failed');
    return { stage: 'design', stepsCompleted: outputs.length, stepsTotal: 3, outputs, status: 'partial', error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Executes the DEPLOY stage automatically.
 * 
 * Steps:
 * 1. Look at playbook steps for this service
 * 2. Executor generates remaining deliverables
 * 3. QA reviews each one
 */
async function executeDeploy(
  projectId: number, clientId: number, serviceType: string
): Promise<ExecutionResult> {
  const outputs: ExecutionResult['outputs'] = [];
  const client = await getClientById(clientId);
  const existingDeliverables = await getDeliverablesByProject(projectId);

  if (!client) return { stage: 'deploy', stepsCompleted: 0, stepsTotal: 1, outputs, status: 'failed', error: 'Client not found' };

  const clientContext = `Client: ${client.companyName || client.name}, Industry: ${client.industry || 'Unknown'}, Market: ${client.market}`;

  // Get playbook for this service
  const playbook = SERVICE_PLAYBOOKS[serviceType];
  const deployStage = playbook?.stages?.find((s: PlaybookStage) => s.stage === 'deploy');

  if (!deployStage?.steps) {
    return { stage: 'deploy', stepsCompleted: 0, stepsTotal: 0, outputs, status: 'completed' };
  }

  // Previous deliverables as context
  const prevContent = existingDeliverables
    .filter((d: DeliverableRow) => d.content && (d.stage === 'diagnose' || d.stage === 'design'))
    .map((d: DeliverableRow) => `[${d.title}]: ${(d.content ?? '').substring(0, 1000)}`)
    .join('\n\n');

  try {
    for (const step of deployStage.steps) {
      // Skip if deliverable already exists
      const exists = existingDeliverables.some((d: DeliverableRow) => d.title === step.title || (step.deliverable && d.title === step.deliverable));
      if (exists) continue;

      const execResponse = await orchestrate(
        `Generate this deliverable for the client: "${step.deliverable || step.title}"\n\nDescription: ${step.description}\n\nPrevious work:\n${prevContent.substring(0, 3000)}`,
        { clientContext, industry: client.industry || undefined, market: client.market || undefined, serviceType, projectStage: 'deploy', conversationHistory: [] }
      );

      const result = await createDeliverable({
        projectId, title: step.deliverable || step.title,
        description: step.description, stage: 'deploy', status: 'ai_generated',
        sortOrder: outputs.length + 10, content: execResponse.message,
      });
      const delId = getInsertId(result);

      // QA
      const qa = await reviewDeliverable(execResponse.message, { clientName: client.companyName || client.name, industry: client.industry || undefined });
      if (delId) await updateDeliverable(delId, { qualityScore: qa.score });

      outputs.push({
        agent: 'executor', action: `Generated: ${step.deliverable || step.title}`,
        result: `QA Score: ${qa.score}/100`, deliverableId: delId, qualityScore: qa.score,
      });
    }

    return { stage: 'deploy', stepsCompleted: outputs.length, stepsTotal: deployStage.steps.length, outputs, status: 'completed' };
  } catch (err: unknown) {
    logger.error({ err, projectId }, 'Deploy auto-execution failed');
    return { stage: 'deploy', stepsCompleted: outputs.length, stepsTotal: deployStage.steps.length, outputs, status: 'partial', error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Executes the OPTIMIZE stage automatically.
 * 
 * Steps:
 * 1. Refresh market data
 * 2. Generate project summary report
 */
async function executeOptimize(
  projectId: number, clientId: number, serviceType: string
): Promise<ExecutionResult> {
  const outputs: ExecutionResult['outputs'] = [];
  const client = await getClientById(clientId);
  const deliverables = await getDeliverablesByProject(projectId);

  if (!client) return { stage: 'optimize', stepsCompleted: 0, stepsTotal: 2, outputs, status: 'failed', error: 'Client not found' };

  try {
    // Step 1: Refresh market data
    const research = await liveResearch(
      `${client.industry || 'branding'} market trends ${client.market || 'MENA'} ${new Date().getFullYear()}`,
      { industry: client.industry || undefined, market: client.market || undefined }
    );
    outputs.push({ agent: 'researcher', action: 'Market data refresh', result: `Updated with ${research.sources.length} sources` });

    // Step 2: Project summary
    const deliverableSummary = deliverables
      .filter((d: DeliverableRow) => d.content)
      .map((d: DeliverableRow) => `${d.title} (QA: ${d.qualityScore || 'N/A'}/100): ${(d.content ?? '').substring(0, 200)}`)
      .join('\n');

    const summaryResponse = await orchestrate(
      `Generate a project completion summary for this client. Include: what was delivered, key strategic decisions, metrics to track going forward, and recommended next steps.\n\nDeliverables completed:\n${deliverableSummary}`,
      { clientContext: `Client: ${client.companyName}, Industry: ${client.industry}, Market: ${client.market}`, industry: client.industry || undefined, market: client.market || undefined, serviceType, projectStage: 'optimize', conversationHistory: [] }
    );

    const result = await createDeliverable({
      projectId, title: 'Project Summary & Next Steps',
      description: 'Auto-generated project completion summary',
      stage: 'optimize', status: 'ai_generated', sortOrder: 99,
      content: summaryResponse.message,
    });
    outputs.push({ agent: 'pm', action: 'Project summary', result: summaryResponse.message.substring(0, 300), deliverableId: getInsertId(result) });

    return { stage: 'optimize', stepsCompleted: 2, stepsTotal: 2, outputs, status: 'completed' };
  } catch (err: unknown) {
    logger.error({ err, projectId }, 'Optimize auto-execution failed');
    return { stage: 'optimize', stepsCompleted: outputs.length, stepsTotal: 2, outputs, status: 'partial', error: err instanceof Error ? err.message : String(err) };
  }
}

// ════════════════════════════════════════════
// MAIN EXECUTOR
// ════════════════════════════════════════════

/**
 * Execute a specific stage for a project.
 * Called when a project transitions to a new stage.
 */
export async function executeStage(
  projectId: number,
  stage: string,
  pipelineRunId?: number
): Promise<ExecutionResult> {
  const project = await getProjectById(projectId);
  if (!project) return { stage, stepsCompleted: 0, stepsTotal: 0, outputs: [], status: 'failed', error: 'Project not found' };

  logger.info({ projectId, stage, service: project.serviceType }, 'Auto-execution starting');

  if (pipelineRunId) {
    await updatePipelineRun(pipelineRunId, { status: 'diagnosing', currentStep: 0 });
  }

  let result: ExecutionResult;

  switch (stage) {
    case 'diagnose':
      result = await executeDiagnose(projectId, project.clientId, project.serviceType);
      break;
    case 'design':
      result = await executeDesign(projectId, project.clientId, project.serviceType);
      break;
    case 'deploy':
      result = await executeDeploy(projectId, project.clientId, project.serviceType);
      break;
    case 'optimize':
      result = await executeOptimize(projectId, project.clientId, project.serviceType);
      break;
    default:
      result = { stage, stepsCompleted: 0, stepsTotal: 0, outputs: [], status: 'failed', error: `Unknown stage: ${stage}` };
  }

  if (pipelineRunId) {
    await updatePipelineRun(pipelineRunId, {
      status: result.status === 'completed' ? 'completed' : result.status === 'partial' ? 'paused' : 'failed',
      currentStep: result.stepsCompleted,
      completedAt: result.status === 'completed' ? new Date() : undefined,
      errorMessage: result.error,
    });
  }

  logger.info({ projectId, stage, status: result.status, steps: `${result.stepsCompleted}/${result.stepsTotal}` }, 'Auto-execution completed');
  return result;
}
