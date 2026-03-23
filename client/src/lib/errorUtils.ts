/**
 * Safely extract a string error message from API/tRPC responses.
 * Prevents React error #31 (Objects are not valid as a React child).
 */
export function toErrorString(v: unknown, fallback = 'Something went wrong'): string {
  if (typeof v === 'string') return v;
  if (v && typeof v === 'object') {
    const obj = v as Record<string, unknown>;
    const msg = obj.json && typeof obj.json === 'object' && obj.json !== null
      ? (obj.json as Record<string, unknown>).message
      : obj.message;
    if (typeof msg === 'string') return msg;
  }
  return fallback;
}
