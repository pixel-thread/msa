import crypto from 'crypto';

/**
 * Generates a cryptographically random CSRF token for the double-submit cookie pattern.
 *
 * Uses 32 random bytes encoded as hex (64-character string).
 * Suitable for the double-submit cookie CSRF protection pattern.
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Verifies a CSRF token against a stored cookie value using constant-time comparison.
 *
 * Security:
 *   - Constant-time comparison via crypto.timingSafeEqual prevents timing attacks
 *   - Early returns on empty or length-mismatched inputs are safe (no secret data leaked)
 *
 * @param token - The token from the X-CSRF-Token header
 * @param cookie - The token from the csrf-token cookie
 * @returns true if the tokens match
 */
export function verifyCsrfToken(token: string, cookie: string): boolean {
  if (!token || !cookie) return false;

  if (token.length !== cookie.length) return false;

  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(cookie));
}
