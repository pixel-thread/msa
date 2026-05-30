import { hashToken } from './token';

import crypto from 'crypto';

export function generateOTP(length = 6): string {
  return Array.from({ length }, () => crypto.randomInt(0, 10)).join('');
}

export function hashOTP(code: string): string {
  return hashToken(code);
}
