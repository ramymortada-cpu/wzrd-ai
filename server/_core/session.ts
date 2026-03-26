/**
 * JWT Session Helper — signs and verifies session cookies.
 * 
 * Replaces plain JSON cookies with signed JWT tokens.
 * Uses the `jose` library (already in dependencies).
 * Secret: JWT_SECRET from env vars.
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

const secret = () => getSecretKey();

export interface SessionPayload {
  id: number;
  openId: string;
  email: string;
}

/**
 * Sign a session payload into a JWT string.
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
 * Returns null if invalid/expired.
 */
export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    if (payload.id && payload.openId && payload.email) {
      return {
        id: payload.id as number,
        openId: payload.openId as string,
        email: payload.email as string,
      };
    }
    return null;
  } catch {
    return null;
  }
}
