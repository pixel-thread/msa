import { SignJWT, jwtVerify, JWTPayload, decodeJwt } from 'jose';

import { env } from '@src/env';
import { UnauthorizedError } from '../errors';

export interface AccessTokenPayload {
  sub: string;
  type: 'access';
}

export interface RefreshTokenPayload {
  sub: string;
  type: 'refresh';
}

export interface PasswordResetPayload {
  sub: string;
  type: 'password_reset';
}

export interface MfaTempPayload {
  sub: string;
  type: 'mfa_temp';
}

const accessTokenSecret = new TextEncoder().encode(env.JWT_SECRET);
const refreshTokenSecret = new TextEncoder().encode(env.JWT_REFRESH_SECRET);
const passwordResetSecret = new TextEncoder().encode(env.JWT_PASSWORD_RESET_SECRET);

export async function signAccessToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId, type: 'access' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setAudience(env.JWT_AUDIENCE)
    .setIssuer(env.JWT_ISSUER)
    .setExpirationTime(env.ACCESS_TOKEN_EXPIRY)
    .sign(accessTokenSecret);
}

export async function signRefreshToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId, type: 'refresh' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(env.JWT_ISSUER)
    .setExpirationTime(env.REFRESH_TOKEN_EXPIRY)
    .sign(refreshTokenSecret);
}

export async function signPasswordResetToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId, type: 'password_reset' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(env.JWT_ISSUER)
    .setExpirationTime(env.PASSWORD_RESET_TOKEN_EXPIRY)
    .sign(passwordResetSecret);
}

export async function verifyAccessToken(token: string): Promise<AccessTokenPayload> {
  const { payload } = await jwtVerify(token, accessTokenSecret);

  if (payload.type !== 'access') {
    throw new UnauthorizedError('Invalid token type');
  }

  return payload as unknown as AccessTokenPayload;
}

export async function verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
  const { payload } = await jwtVerify(token, refreshTokenSecret);

  if (payload.type !== 'refresh') {
    throw new UnauthorizedError('Invalid token type');
  }

  return payload as unknown as RefreshTokenPayload;
}

export async function signMfaTempToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId, type: 'mfa_temp' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(env.JWT_ISSUER)
    .setAudience(env.JWT_AUDIENCE)
    .setExpirationTime('5m')
    .sign(accessTokenSecret);
}

export async function verifyMfaTempToken(token: string): Promise<MfaTempPayload> {
  const { payload } = await jwtVerify(token, accessTokenSecret);

  if (payload.type !== 'mfa_temp') {
    throw new UnauthorizedError('Invalid token type');
  }

  return payload as unknown as MfaTempPayload;
}

export async function verifyPasswordResetToken(token: string): Promise<PasswordResetPayload> {
  const { payload } = await jwtVerify(token, passwordResetSecret, {
    algorithms: ['HS256'],
  });

  if (payload.type !== 'password_reset') {
    throw new UnauthorizedError('Invalid token type');
  }

  return payload as unknown as PasswordResetPayload;
}

export function decodeToken(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = JSON.parse(decodeJwt(parts[1]));
    return payload;
  } catch {
    return null;
  }
}

export async function getTokenExpiry(token: string): Promise<number> {
  const { payload } = await jwtVerify(token, accessTokenSecret);
  return payload.exp ? payload.exp * 1000 : 0;
}
