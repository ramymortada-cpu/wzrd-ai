/**
 * JWT Session Helper — signs and verifies session cookies.
 * 
 * Replaces plain JSON cookies with signed JWT tokens.
 * Uses the `jose` library (already in dependencies).
 * Secret: JWT_SECRET from env vars.
 * 
 * Rotation: set JWT_SECRET_PREVIOUS = old JWT_SECRET, then update JWT_SECRET.
 * New tokens use JWT_SECRET; old tokens are accepted via JWT_SECRET_PREVIOUS
 * for the duration of the 30-day expiry window. Then unset JWT_SECRET_PREVIOUS.
 */

import { SignJWT, jwtVerify } from 'jose';
import { ENV } from './env';

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET?.trim()) {
  throw new Error('JWT_SECRET is required in production');
}

function getSecretKey(): Uint8Array {
  const raw = ENV.cookieSecret?.trim();
  if (process.env.NODE_ENV === 'production' && !raw) {
    throw new Error('JWT_SECRET is required in production');
  }
  return new TextEncoder().encode(raw || 'fallback-dev-secret-change-me');
}

/** Previous secret — accepted for verification during rotation window */
function getPreviousSecretKey(): Uint8Array | null {
  const raw = process.env.JWT_SECRET_PREVIOUS?.trim();
  if (!raw) return null;
  return new TextEncoder().encode(raw);
}

const secret = () => getSecretKey();
const previousSecret = () => getPreviousSecretKey();

export interface SessionPayload {
  id: number;
  openId: string;
  email: string;
}

/**
 * Sign a session payload into a JWT string.
 * Always signs with the current JWT_SECRET.
 * Expires in 30 days.
 */
export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secret());
}

/**
 * Verify a JWT session string and return the payload.
 * Tries the current secret first, then the previous secret (for rotation).
 * Returns null if invalid/expired with both secrets.
 */
export async function verifySession(token: string): Promise<SessionPayload | null> {
  // Try current secret first
  try {
    const { payload } = await jwtVerify(token, secret());
    if (payload.id && payload.openId && payload.email) {
      return {
        id: payload.id as number,
        openId: payload.openId as string,
        email: payload.email as string,
      };
    }
  } catch {
    // Current secret failed — try previous secret if rotation is active
    const prev = previousSecret();
    if (prev) {
      try {
        const { payload } = await jwtVerify(token, prev);
        if (payload.id && payload.openId && payload.email) {
          return {
            id: payload.id as number,
            openId: payload.openId as string,
            email: payload.email as string,
          };
        }
      } catch {
        // Both secrets failed — token is invalid or expired
      }
    }
  }
  return null;
}
