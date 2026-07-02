/**
 * Shared test helper utilities.
 * Import these instead of redefining helpers in each spec file.
 */

/** Safely parse JSON — returns parsed object or raw string on failure */
export function tryParseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/** Decode a JWT and return the payload as an object */
export function decodeJwtPayload(token: string): Record<string, unknown> {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid JWT format');
  const payload = Buffer.from(parts[1], 'base64url').toString('utf-8');
  return JSON.parse(payload);
}
