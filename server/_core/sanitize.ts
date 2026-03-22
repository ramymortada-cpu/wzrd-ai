/**
 * Sanitization Utility — XSS protection for user-generated content.
 * 
 * Strips dangerous HTML tags/attributes while preserving safe formatting.
 * For full DOMPurify support, install: npm install isomorphic-dompurify
 */

/** HTML entities to escape */
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#96;',
};

/**
 * Escapes HTML special characters to prevent XSS.
 * Use this for user input displayed in HTML contexts.
 */
export function escapeHtml(str: string): string {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/[&<>"'`/]/g, (char) => HTML_ENTITIES[char] || char);
}

/**
 * Strips all HTML tags from a string.
 * Use for plain-text contexts like notification messages.
 */
export function stripHtml(str: string): string {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim();
}

/** Dangerous patterns to remove from content */
const DANGEROUS_PATTERNS = [
  /javascript\s*:/gi,
  /vbscript\s*:/gi,
  /data\s*:[^,]*;base64/gi,
  /on\w+\s*=\s*["'][^"']*["']/gi,    // onclick="..." etc.
  /on\w+\s*=\s*[^\s>]+/gi,            // onclick=alert(1)
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
  /<embed\b[^>]*>/gi,
  /<link\b[^>]*>/gi,
  /<meta\b[^>]*>/gi,
  /<base\b[^>]*>/gi,
  /expression\s*\(/gi,
  /url\s*\(\s*["']?\s*javascript/gi,
];

/**
 * Sanitizes HTML content — removes dangerous tags and attributes
 * while preserving basic formatting (bold, italic, lists, links).
 * 
 * For user-generated rich text (comments, descriptions, etc.)
 */
export function sanitizeHtml(str: string): string {
  if (!str || typeof str !== 'string') return '';

  let cleaned = str;

  // Remove all dangerous patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    cleaned = cleaned.replace(pattern, '');
  }

  // Remove all style attributes (can contain expressions)
  cleaned = cleaned.replace(/\s*style\s*=\s*["'][^"']*["']/gi, '');

  // Remove all class attributes (can be used for CSS injection)
  cleaned = cleaned.replace(/\s*class\s*=\s*["'][^"']*["']/gi, '');

  return cleaned.trim();
}

/**
 * Sanitizes an object's string values recursively.
 * Use for sanitizing entire input objects before storage.
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const result = { ...obj };

  for (const [key, value] of Object.entries(result)) {
    if (typeof value === 'string') {
      (result as Record<string, unknown>)[key] = sanitizeHtml(value);
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      (result as Record<string, unknown>)[key] = sanitizeObject(value as Record<string, unknown>);
    } else if (Array.isArray(value)) {
      (result as Record<string, unknown>)[key] = value.map(item =>
        typeof item === 'string'
          ? sanitizeHtml(item)
          : item && typeof item === 'object'
            ? sanitizeObject(item as Record<string, unknown>)
            : item
      );
    }
  }

  return result;
}

/**
 * Validates and sanitizes a URL to prevent javascript: and data: attacks.
 */
export function sanitizeUrl(url: string): string {
  if (!url || typeof url !== 'string') return '';

  const trimmed = url.trim().toLowerCase();

  // Block dangerous protocols
  if (
    trimmed.startsWith('javascript:') ||
    trimmed.startsWith('vbscript:') ||
    trimmed.startsWith('data:')
  ) {
    return '';
  }

  // Only allow http, https, and relative URLs
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/')) {
    return url.trim();
  }

  // Assume https if no protocol
  if (!trimmed.includes('://')) {
    return `https://${url.trim()}`;
  }

  return '';
}
