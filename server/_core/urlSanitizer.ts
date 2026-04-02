/**
 * URL Sanitizer — Prevents SSRF attacks in scraping operations.
 */
import { logger } from './logger';

const BLOCKED_HOSTS = [
  'localhost', '127.0.0.1', '0.0.0.0',
  '169.254.169.254',  // AWS metadata
  'metadata.google.internal', // GCP metadata
];

const PRIVATE_IP_RANGES = [
  /^10\./,                      // 10.0.0.0/8
  /^172\.(1[6-9]|2\d|3[01])\./, // 172.16.0.0/12
  /^192\.168\./,                // 192.168.0.0/16
  /^fc00:/i,                    // IPv6 private
  /^fe80:/i,                    // IPv6 link-local
];

export function validateScrapingUrl(input: string): { valid: boolean; url: string; error?: string } {
  // 1. Must start with http:// or https://
  if (!input.match(/^https?:\/\//i)) {
    return { valid: false, url: '', error: 'URL must start with http:// or https://' };
  }

  let parsed: URL;
  try {
    parsed = new URL(input);
  } catch {
    return { valid: false, url: '', error: 'Invalid URL format' };
  }

  // 2. Only HTTP/HTTPS allowed
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return { valid: false, url: '', error: 'Only HTTP/HTTPS URLs allowed' };
  }

  const hostname = parsed.hostname.toLowerCase();

  // 3. Block private/local hosts
  if (BLOCKED_HOSTS.includes(hostname)) {
    logger.warn({ url: input }, '[SSRF] Blocked request to internal host');
    return { valid: false, url: '', error: 'Internal URLs are not allowed' };
  }

  // 4. Block private IP ranges
  for (const range of PRIVATE_IP_RANGES) {
    if (range.test(hostname)) {
      logger.warn({ url: input, hostname }, '[SSRF] Blocked request to private IP range');
      return { valid: false, url: '', error: 'Private IP addresses are not allowed' };
    }
  }

  // 5. Block non-standard ports (often internal services)
  if (parsed.port && !['80', '443', ''].includes(parsed.port)) {
    logger.warn({ url: input, port: parsed.port }, '[SSRF] Blocked request to non-standard port');
    return { valid: false, url: '', error: 'Non-standard ports are not allowed' };
  }

  return { valid: true, url: parsed.toString() };
}
