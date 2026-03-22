/**
 * Token Security — hashing and constant-time comparison for portal tokens.
 * 
 * Portal tokens are stored as SHA-256 hashes in the database.
 * The raw token is only sent to the client once (in the portal URL).
 * 
 * This prevents token theft from database dumps or logs.
 */

import crypto from 'crypto';

/**
 * Generate a cryptographically secure random token.
 * Returns the raw token (to be sent to client) and its hash (to be stored in DB).
 */
export function generateSecureToken(): { raw: string; hash: string } {
  const raw = crypto.randomBytes(48).toString('base64url'); // URL-safe, 64 chars
  const hash = hashToken(raw);
  return { raw, hash };
}

/**
 * Hash a token for storage.
 * Uses SHA-256 which is fast enough for token hashing (unlike passwords).
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Verify a token against its stored hash using constant-time comparison.
 * Prevents timing attacks.
 */
export function verifyToken(rawToken: string, storedHash: string): boolean {
  const inputHash = hashToken(rawToken);
  
  try {
    return crypto.timingSafeEqual(
      Buffer.from(inputHash, 'hex'),
      Buffer.from(storedHash, 'hex')
    );
  } catch {
    return false;
  }
}

/**
 * Generate a simple numeric OTP (for WhatsApp/SMS verification).
 */
export function generateOTP(digits: number = 6): string {
  const max = Math.pow(10, digits);
  const num = crypto.randomInt(0, max);
  return num.toString().padStart(digits, '0');
}
