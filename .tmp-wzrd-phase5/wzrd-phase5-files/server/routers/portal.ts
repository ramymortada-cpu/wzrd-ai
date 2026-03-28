/**
 * Portal Router — client portal public endpoints + management.
 */
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { logger } from "../_core/logger";
import { SERVICE_LABELS, STAGE_LABELS } from "@shared/const";
import { generateSecureToken, hashToken } from "../_core/tokenSecurity";
import { getIndustryPack, formatIndustryPackForAI } from "../industryPacks";
import {
  createPortalToken, getPortalTokenByToken, getPortalTokensByProject, updatePortalToken,
  getProjectById, getClientById, getDeliverablesByProject,
  getDeliverableRevisions, getDeliverableComments, getDeliverableApprovals, getLatestApproval,
  createDeliverableComment, createDeliverableApproval,
  createDeliverableFeedback,
} from "../db";
import { getDb } from "../db/index";
import { notifyOwner } from "../_core/notification";
import type { Deliverable } from "../../drizzle/schema";
import { serviceRequests, requestUpdates } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const portalRouter = router({
  // Generate portal link — stores HASHED token, returns raw to client
  generateLink: protectedProcedure
    .input(z.object({ projectId: z.number(), clientId: z.number() }))
    .mutation(async ({ input }) => {
      const { raw, hash } = generateSecureToken();
      const result = await createPortalToken({ projectId: input.projectId, clientId: input.clientId, token: hash, isActive: 1 });
      logger.info({ projectId: input.projectId }, 'Portal link generated (token hashed)');
      return { token: raw, id: result.id };
    }),

  getLinks: protectedProcedure.input(z.object({ projectId: z.number().int().positive() })).query(async ({ input }) => getPortalTokensByProject(input.projectId)),

  deactivateLink: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => { await updatePortalToken(input.id, { isActive: 0 }); return { success: true }; }),

  // PUBLIC: View project via portal token — hashes input token before DB lookup
  viewProject: publicProcedure.input(z.object({ token: z.string().max(255) })).query(async ({ input }) => {
    const hashedInput = hashToken(input.token);
    const portalToken = await getPortalTokenByToken(hashedInput);
    if (!portalToken) throw new Error('Invalid or expired portal link');
    if (portalToken.expiresAt && new Date(portalToken.expiresAt) < new Date()) throw new Error('Portal link has expired');
    await updatePortalToken(portalToken.id, { lastAccessedAt: new Date() });
    const project = await getProjectById(portalToken.projectId);
    if (!project) throw new Error('Project not found');
    const client = await getClientById(portalToken.clientId);
    const projectDeliverables = await getDeliverablesByProject(portalToken.projectId);
    // Market intelligence for client's industry
    let marketIntelligence: string | null = null;
    if (client?.industry) {
      const pack = getIndustryPack(client.industry);
      if (pack) marketIntelligence = formatIndustryPackForAI(pack, client.market || undefined);
    }
    return {
      project: { name: project.name, serviceType: project.serviceType, stage: project.stage, status: project.status, startDate: project.startDate, description: project.description },
      client: client ? { id: client.id, name: client.name, companyName: client.companyName } : null,
      deliverables: projectDeliverables.map((d: Deliverable) => ({
        id: d.id, title: d.title, description: d.description, stage: d.stage, status: d.status,
        aiGenerated: d.aiGenerated ?? 0,
        createdAt: d.createdAt,
        content: d.status === 'delivered' || d.status === 'approved' ? d.content : null,
        fileUrl: d.status === 'delivered' || d.status === 'approved' ? d.fileUrl : null,
        imageUrls: d.status === 'delivered' || d.status === 'approved' ? d.imageUrls : null,
      })),
      serviceLabel: SERVICE_LABELS[project.serviceType as keyof typeof SERVICE_LABELS] || project.serviceType,
      stageLabels: STAGE_LABELS,
      marketIntelligence,
    };
  }),

  // PUBLIC: Get revisions, comments, approvals for a deliverable
  getDeliverableDetails: publicProcedure.input(z.object({ token: z.string().max(255), deliverableId: z.number() })).query(async ({ input }) => {
    const portalToken = await getPortalTokenByToken(hashToken(input.token));
    if (!portalToken) throw new Error('Invalid token');
    const revisions = await getDeliverableRevisions(input.deliverableId);
    const comments = await getDeliverableComments(input.deliverableId);
    const approvals = await getDeliverableApprovals(input.deliverableId);
    const latestApproval = await getLatestApproval(input.deliverableId);
    return { revisions, comments, approvals, latestApproval };
  }),

  // PUBLIC: Add comment
  addComment: publicProcedure
    .input(z.object({ token: z.string().max(255), deliverableId: z.number(), comment: z.string().min(1).max(5000), authorName: z.string().min(1).max(255), parentId: z.number().optional(), version: z.number().optional() }))
    .mutation(async ({ input }) => {
      const portalToken = await getPortalTokenByToken(hashToken(input.token));
      if (!portalToken) throw new Error('Invalid token');
      const result = await createDeliverableComment({ deliverableId: input.deliverableId, authorType: 'client', authorName: input.authorName, comment: input.comment, parentId: input.parentId, version: input.version });
      try { await notifyOwner({ title: `New Comment: ${input.authorName}`, content: input.comment.substring(0, 200) }); } catch { /* non-blocking notify */ }
      return result;
    }),

  // PUBLIC: Approve/request changes
  submitApproval: publicProcedure
    .input(z.object({ token: z.string().max(255), deliverableId: z.number(), decision: z.enum(["approved", "changes_requested"]), reason: z.string().max(5000).optional(), clientName: z.string().min(1).max(255), version: z.number().optional() }))
    .mutation(async ({ input }) => {
      const portalToken = await getPortalTokenByToken(hashToken(input.token));
      if (!portalToken) throw new Error('Invalid token');
      const result = await createDeliverableApproval({ deliverableId: input.deliverableId, decision: input.decision, reason: input.reason, clientName: input.clientName, version: input.version });
      if (input.decision === 'approved') {
        const { updateDeliverable } = await import("../db");
        await updateDeliverable(input.deliverableId, { status: 'approved' });
      }
      try { await notifyOwner({ title: `Deliverable ${input.decision}: ${input.clientName}`, content: input.reason || 'No reason provided' }); } catch { /* non-blocking notify */ }
      logger.info({ deliverableId: input.deliverableId, decision: input.decision }, 'Portal approval submitted');
      return result;
    }),

  // PUBLIC: Submit a service request from the portal (no login required)
  submitServiceRequest: publicProcedure
    .input(z.object({
      token: z.string().max(255),
      serviceType: z.string().min(1).max(100),
      serviceTypeAr: z.string().min(1).max(100),
      description: z.string().max(2000).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database unavailable');
      const portalToken = await getPortalTokenByToken(hashToken(input.token));
      if (!portalToken) throw new Error('Invalid or expired portal link');
      if (portalToken.expiresAt && new Date(portalToken.expiresAt) < new Date()) throw new Error('Portal link has expired');
      const requestNumber = `REQ-${Date.now().toString(36).toUpperCase()}`;
      await db.insert(serviceRequests).values({
        userId: portalToken.clientId,
        requestNumber,
        serviceType: input.serviceType,
        serviceTypeAr: input.serviceTypeAr,
        status: 'received',
        description: input.description || null,
      });
      const [inserted] = await db.select().from(serviceRequests).where(eq(serviceRequests.requestNumber, requestNumber));
      if (inserted) {
        await db.insert(requestUpdates).values({
          requestId: inserted.id,
          status: 'received',
          title: 'Request Received',
          titleAr: 'تم استلام طلبك',
          detail: `Your service request #${requestNumber} has been received. Our team will review it within 24 hours.`,
          detailAr: `تم استلام طلبك رقم #${requestNumber}. فريقنا هيراجعه خلال ٢٤ ساعة.`,
          updateType: 'status_change',
          createdBy: 'portal',
        });
      }
      try { await notifyOwner({ title: `📥 New Portal Service Request: ${input.serviceType}`, content: input.description?.substring(0, 200) || 'No description provided' }); } catch { /* non-blocking */ }
      logger.info({ clientId: portalToken.clientId, requestNumber, serviceType: input.serviceType }, 'Portal service request submitted');
      return { success: true, requestNumber };
    }),

  // PUBLIC: Add feedback (rating + comment)
  addFeedback: publicProcedure
    .input(z.object({ token: z.string().max(255), deliverableId: z.number(), comment: z.string().min(1).max(5000), rating: z.number().min(1).max(5).optional() }))
    .mutation(async ({ input }) => {
      const portalToken = await getPortalTokenByToken(hashToken(input.token));
      if (!portalToken) throw new Error('Invalid token');
      const result = await createDeliverableFeedback({ deliverableId: input.deliverableId, clientId: portalToken.clientId, comment: input.comment, rating: input.rating });
      return result;
    }),
});
