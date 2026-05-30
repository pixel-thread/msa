import { SignJWT, jwtVerify, JWTPayload, decodeJwt } from 'jose';

import { env } from '@src/env';
import { UnauthorizedError } from '../errors';

/** Payload carried by an access JWT. */
export interface AccessTokenPayload {
  sub: string;
  type: 'access';
}

/** Payload carried by a refresh JWT. */
export interface RefreshTokenPayload {
  sub: string;
  type: 'refresh';
}

/** Payload carried by a password-reset JWT. */
export interface PasswordResetPayload {
  sub: string;
  type: 'password_reset';
}

/** Payload carried by a temporary MFA JWT. */
export interface MfaTempPayload {
  sub: string;
  type: 'mfa_temp';
}

const accessTokenSecret = new TextEncoder().encode(env.JWT_SECRET);
const refreshTokenSecret = new TextEncoder().encode(env.JWT_REFRESH_SECRET);
const passwordResetSecret = new TextEncoder().encode(env.JWT_PASSWORD_RESET_SECRET);

/** Signs a short-lived access JWT for the given user ID. */
export async function signAccessToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId, type: 'access' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setAudience(env.JWT_AUDIENCE)
    .setIssuer(env.JWT_ISSUER)
    .setExpirationTime(env.ACCESS_TOKEN_EXPIRY)
    .sign(accessTokenSecret);
}

/** Signs a long-lived refresh JWT for the given user ID. */
export async function signRefreshToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId, type: 'refresh' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(env.JWT_ISSUER)
    .setExpirationTime(env.REFRESH_TOKEN_EXPIRY)
    .sign(refreshTokenSecret);
}

/** Signs a one-time password-reset JWT for the given user ID. */
export async function signPasswordResetToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId, type: 'password_reset' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(env.JWT_ISSUER)
    .setExpirationTime(env.PASSWORD_RESET_TOKEN_EXPIRY)
    .sign(passwordResetSecret);
}

/** Verifies and returns the payload of an access token. Throws on invalid type. */
export async function verifyAccessToken(token: string): Promise<AccessTokenPayload> {
  const { payload } = await jwtVerify(token, accessTokenSecret);

  if (payload.type !== 'access') {
    throw new UnauthorizedError('Invalid token type');
  }

  return payload as unknown as AccessTokenPayload;
}

/** Verifies and returns the payload of a refresh token. Throws on invalid type. */
export async function verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
  const { payload } = await jwtVerify(token, refreshTokenSecret);

  if (payload.type !== 'refresh') {
    throw new UnauthorizedError('Invalid token type');
  }

  return payload as unknown as RefreshTokenPayload;
}

/** Signs a short-lived MFA temporary token (5-minute TTL). */
export async function signMfaTempToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId, type: 'mfa_temp' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(env.JWT_ISSUER)
    .setAudience(env.JWT_AUDIENCE)
    .setExpirationTime('5m')
    .sign(accessTokenSecret);
}

/** Verifies and returns the payload of an MFA temp token. */
export async function verifyMfaTempToken(token: string): Promise<MfaTempPayload> {
  const { payload } = await jwtVerify(token, accessTokenSecret);

  if (payload.type !== 'mfa_temp') {
    throw new UnauthorizedError('Invalid token type');
  }

  return payload as unknown as MfaTempPayload;
}

/** Verifies and returns the payload of a password-reset token. */
export async function verifyPasswordResetToken(token: string): Promise<PasswordResetPayload> {
  const { payload } = await jwtVerify(token, passwordResetSecret, {
    algorithms: ['HS256'],
  });

  if (payload.type !== 'password_reset') {
    throw new UnauthorizedError('Invalid token type');
  }

  return payload as unknown as PasswordResetPayload;
}

/** Decodes a JWT without verifying its signature. Returns the payload or null. */
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

/** Returns the expiry timestamp (ms) of an access token. */
export async function getTokenExpiry(token: string): Promise<number> {
  const { payload } = await jwtVerify(token, accessTokenSecret);
  return payload.exp ? payload.exp * 1000 : 0;
}
