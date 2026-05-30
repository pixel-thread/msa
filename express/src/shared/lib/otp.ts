import crypto from 'crypto';
import { hashToken } from './token';

/** Generates a cryptographically random numeric OTP of the given length. */
export function generateOTP(length = 6): string {
  return Array.from({ length }, () => crypto.randomInt(0, 10)).join('');
}

/** Returns a hashed (one-way) representation of an OTP code for secure storage. */
export function hashOTP(code: string): string {
  return hashToken(code);
}
