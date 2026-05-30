import { SignJWT } from 'jose';
import { env } from '@src/env';

const accessTokenSecret = new TextEncoder().encode(env.JWT_SECRET);
const wrongSecret = new TextEncoder().encode('this-is-a-completely-different-secret-that-is-at-least-32-chars!!');

export async function signToken(payload: Record<string, unknown>): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, string>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(env.JWT_ISSUER)
    .setAudience(env.JWT_AUDIENCE)
    .setExpirationTime('15m')
    .sign(accessTokenSecret);
}

export async function signExpiredToken(payload: Record<string, unknown>): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, string>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuedAt(Math.floor(Date.now() / 1000) - 3600)
    .setIssuer(env.JWT_ISSUER)
    .setAudience(env.JWT_AUDIENCE)
    .setExpirationTime('-1h')
    .sign(accessTokenSecret);
}

export async function signTamperedToken(payload: Record<string, unknown>): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, string>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(env.JWT_ISSUER)
    .setAudience(env.JWT_AUDIENCE)
    .setExpirationTime('15m')
    .sign(wrongSecret);
}

export function getMalformedToken(): string {
  return 'not-a-jwt-token';
}

export function getBearerHeader(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

export async function signAccessToken(userId: string): Promise<string> {
  return signToken({ sub: userId, type: 'access' });
}

export async function signExpiredAccessToken(userId: string): Promise<string> {
  return signExpiredToken({ sub: userId, type: 'access' });
}

export async function signRefreshToken(userId: string): Promise<string> {
  return signToken({ sub: userId, type: 'refresh' });
}
