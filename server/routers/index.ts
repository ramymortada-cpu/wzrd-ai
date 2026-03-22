/**
 * Router Index — composes all sub-routers into the main appRouter.
 * 
 * This replaces the monolithic 3,200-line routers.ts file.
 * Each domain has its own router file < 200 lines.
 */

import { router } from "../_core/trpc";
import { systemRouter } from "../_core/systemRouter";
import { authRouter } from "./auth";
import { clientsRouter } from "./clients";
import { projectsRouter } from "./projects";
import { deliverablesRouter } from "./deliverables";
import { notesRouter } from "./notes";
import { paymentsRouter } from "./payments";
import { aiRouter } from "./ai";
import { conversationsRouter } from "./conversations";
import { proposalsRouter } from "./proposals";
import { proposalAcceptanceRouter } from "./proposalAcceptance";
import { portalRouter } from "./portal";
import { researchRouter } from "./research";
import { knowledgeRouter } from "./knowledge";
import { pipelineRouter } from "./pipeline";
import { brandTwinRouter } from "./brandTwin";
import { leadsRouter } from "./leads";
import { onboardingRouter } from "./onboarding";
import { feedbackRouter } from "./feedback";
import { analyticsRouter } from "./analytics";
import { qualityRouter } from "./quality";
import { adminRouter } from "./admin";
import { creditsRouter } from "./credits";
import { toolsRouter } from "./tools";
import { wzrdAdminRouter } from "./wzrdAdmin";
import { dashboardRouter } from "./dashboard";

export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  dashboard: dashboardRouter,
  clients: clientsRouter,
  projects: projectsRouter,
  deliverables: deliverablesRouter,
  notes: notesRouter,
  payments: paymentsRouter,
  ai: aiRouter,
  conversations: conversationsRouter,
  proposals: proposalsRouter,
  proposalAcceptance: proposalAcceptanceRouter,
  portal: portalRouter,
  research: researchRouter,
  knowledge: knowledgeRouter,
  pipeline: pipelineRouter,
  brandTwin: brandTwinRouter,
  leads: leadsRouter,
  onboarding: onboardingRouter,
  feedback: feedbackRouter,
  analytics: analyticsRouter,
  quality: qualityRouter,
  admin: adminRouter,
  credits: creditsRouter,
  tools: toolsRouter,
  wzrdAdmin: wzrdAdminRouter,
});

export type AppRouter = typeof appRouter;
