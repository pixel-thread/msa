import crypto from 'crypto';

/** Generates a cryptographically random hex-encoded token. */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/** Returns a SHA-256 hash of a token for secure storage (one-way). */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
