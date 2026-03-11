"use client";

export function saveTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem("radd_access_token", accessToken);
  localStorage.setItem("radd_refresh_token", refreshToken);
}

export function clearTokens() {
  localStorage.removeItem("radd_access_token");
  localStorage.removeItem("radd_refresh_token");
}

export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem("radd_access_token");
}

function parseJwt(token: string): Record<string, unknown> | null {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

export function isSuperAdmin(): boolean {
  if (typeof window === "undefined") return false;
  const token = localStorage.getItem("radd_access_token");
  if (!token) return false;
  const payload = parseJwt(token);
  return payload?.is_superadmin === true;
}

export function getTokenPayload(): Record<string, unknown> | null {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("radd_access_token");
  if (!token) return null;
  return parseJwt(token);
}
