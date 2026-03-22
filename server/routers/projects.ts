/**
 * Projects Router — project management with 4D Framework.
 * Auto-creates deliverables from service playbook on project creation.
 */

import { protectedProcedure, router } from "../_core/trpc";
import { checkOwner, checkEditor } from "../_core/authorization";
import { z } from "zod";
import { createProjectInput, updateProjectInput } from "@shared/validators";
import { paginationInput } from "../_core/pagination";
import { sanitizeObject } from "../_core/sanitize";
import { audit, computeChanges } from "../_core/audit";
import { logger } from "../_core/logger";
import { SERVICE_PRICES } from "@shared/const";
import {
  createProject, getProjects, getProjectsByClient, getProjectById, updateProject, deleteProject,
  createDeliverable,
} from "../db";
import { SERVICE_PLAYBOOKS } from "../knowledgeBase";

export const projectsRouter = router({
  list: protectedProcedure
    .input(z.object({ ...paginationInput }).optional())
    .query(async () => {
      return getProjects();
    }),

  getByClient: protectedProcedure
    .input(z.object({ clientId: z.number().int().positive() }))
    .query(async ({ input }) => {
      return getProjectsByClient(input.clientId);
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ input }) => {
      return getProjectById(input.id);
    }),

  create: protectedProcedure
    .input(createProjectInput)
    .mutation(async ({ input, ctx }) => {
      checkEditor(ctx);
      const sanitized = sanitizeObject(input);
      const price = sanitized.price || String(SERVICE_PRICES[input.serviceType] || 0);
      const result = await createProject({ ...sanitized, price });
      const projectId = (result as { id: number }).id;

      const playbook = SERVICE_PLAYBOOKS[input.serviceType];
      if (playbook && projectId) {
        let sortOrder = 0;
        for (const stageData of playbook.stages) {
          for (const step of stageData.steps) {
            await createDeliverable({
              projectId,
              title: step.deliverable || step.title,
              description: step.description,
              stage: stageData.stage as "diagnose" | "design" | "deploy" | "optimize",
              status: "pending",
              sortOrder: sortOrder++,
            });
          }
        }
        logger.info({ projectId, deliverables: sortOrder }, 'Auto-created deliverables');
      }

      if (projectId) {
        await audit('projects', projectId, 'create', ctx.user?.id, { ...sanitized, price });
      }
      return result;
    }),

  update: protectedProcedure
    .input(updateProjectInput)
    .mutation(async ({ input, ctx }) => {
      checkEditor(ctx);
      const { id, ...data } = sanitizeObject(input);
      const before = await getProjectById(id);
      if (!before) throw new Error('Project not found');
      await updateProject(id, data);
      const changes = computeChanges(before as Record<string, unknown>, data);
      if (Object.keys(changes).length > 0) {
        await audit('projects', id, 'update', ctx.user?.id, changes);
      }
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      checkOwner(ctx); // Only owner can delete projects
      await deleteProject(input.id);
      await audit('projects', input.id, 'delete', ctx.user?.id);
      return { success: true };
    }),
});
