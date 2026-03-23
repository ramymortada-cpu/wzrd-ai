import type { CookieOptions, Request } from "express";

function isSecureRequest(req: Request) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto)
    ? forwardedProto
    : forwardedProto.split(",");
  return protoList.some(proto => proto.trim().toLowerCase() === "https");
}

const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export function getSessionCookieOptions(
  req: Request
): CookieOptions {
  const secure = process.env.NODE_ENV === "production" || isSecureRequest(req);
  return {
    httpOnly: true,
    secure,
    sameSite: "lax", // Works for same-origin; "none" can break on Railway
    path: "/",
    maxAge: SESSION_MAX_AGE_MS,
  };
}
