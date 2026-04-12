/**
 * Express routes for Full Audit PDF download (Sprint B).
 * GET /api/download-pdf/:uuid — session cookie required; must match meta.userId.
 */

import type { Express, Request, Response } from "express";
import { parse as parseCookie } from "cookie";
import { join } from "node:path";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { COOKIE_NAME } from "@shared/const";
import { verifySession } from "./_core/session";
import { getUserByOpenId } from "./db";
import {
  getFullAuditPdfDir,
  isValidFullAuditPdfUuid,
  readPdfMetaFile,
  cleanupOldFullAuditPdfs,
} from "./fullAuditPdf";
import { logger } from "./_core/logger";

async function getSessionUser(req: Request) {
  const cookies = req.headers.cookie ? parseCookie(req.headers.cookie) : {};
  const token = cookies[COOKIE_NAME];
  const session = token ? await verifySession(token) : null;
  if (!session) return null;
  return getUserByOpenId(session.openId) ?? null;
}

export function mountFullAuditPdfDownload(app: Express): void {
  app.get("/api/download-pdf/:uuid", async (req: Request, res: Response) => {
    const uuid = req.params.uuid ?? "";
    if (!isValidFullAuditPdfUuid(uuid)) {
      return res.status(404).send("Not found");
    }

    const user = await getSessionUser(req);
    if (!user) {
      return res.status(401).send("Unauthorized");
    }

    const dir = getFullAuditPdfDir();
    const meta = await readPdfMetaFile(dir, uuid);
    if (!meta || meta.userId !== user.id) {
      return res.status(404).send("Not found");
    }

    const pdfPath = join(dir, `${uuid}.pdf`);
    try {
      await stat(pdfPath);
    } catch {
      return res.status(404).send("Not found");
    }

    void cleanupOldFullAuditPdfs(dir).catch(() => {});

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="WZZRD-FullAudit-${uuid.slice(0, 8)}.pdf"`);
    const stream = createReadStream(pdfPath);
    stream.on("error", () => {
      if (!res.headersSent) res.status(500).end();
    });
    stream.pipe(res);
  });

  logger.info({}, "[FullAuditPdf] Mounted GET /api/download-pdf/:uuid");
}
