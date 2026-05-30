import { createSecretKey } from 'crypto';

const encoder = new TextEncoder();

export class SignJWT {
  private _payload: Record<string, unknown> = {};
  private _protectedHeader: Record<string, string> = {};
  private _issuedAt?: number;
  private _expirationTime?: string;
  private _issuer?: string;
  private _audience?: string;

  constructor(payload: Record<string, unknown>) {
    this._payload = payload;
  }

  setProtectedHeader(header: Record<string, string>) {
    this._protectedHeader = header;
    return this;
  }

  setIssuedAt(time?: number) {
    this._issuedAt = time ?? Math.floor(Date.now() / 1000);
    return this;
  }

  setIssuer(issuer: string) {
    this._issuer = issuer;
    return this;
  }

  setAudience(audience: string) {
    this._audience = audience;
    return this;
  }

  setExpirationTime(time: string) {
    this._expirationTime = time;
    return this;
  }

  async sign(_key: unknown): Promise<string> {
    const header = { alg: this._protectedHeader.alg ?? 'HS256', typ: 'JWT' };
    const now = this._issuedAt ?? Math.floor(Date.now() / 1000);
    let exp: number | undefined;
    if (this._expirationTime) {
      const match = this._expirationTime.match(/^(\d+)([smhd])$/);
      if (match) {
        const [, num, unit] = match;
        const multipliers: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
        exp = now + parseInt(num, 10) * (multipliers[unit] ?? 0);
      } else if (this._expirationTime.startsWith('-')) {
        const match2 = this._expirationTime.match(/^-(\d+)([smhd])$/);
        if (match2) {
          const [, num, unit] = match2;
          const multipliers: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
          exp = now - parseInt(num, 10) * (multipliers[unit] ?? 0);
        }
      }
    }
    const payload: Record<string, unknown> = {
      ...this._payload,
      iat: now,
      ...(exp ? { exp } : {}),
      ...(this._issuer ? { iss: this._issuer } : {}),
      ...(this._audience ? { aud: this._audience } : {}),
    };
    const b64 = (obj: Record<string, unknown>) =>
      Buffer.from(JSON.stringify(obj)).toString('base64url');
    const parts = [b64(header), b64(payload)];
    return `${parts[0]}.${parts[1]}.mock-sig`;
  }
}

export async function jwtVerify(
  token: string,
  _key: unknown,
): Promise<{ payload: Record<string, unknown> }> {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid token');
  const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error('Token expired');
  }
  return { payload };
}

export function decodeJwt(token: string): Record<string, unknown> {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid token');
  return JSON.parse(Buffer.from(parts[1], 'base64url').toString());
}

export class JWTClaimValidationFailed extends Error {
  code = 'ERR_JWT_CLAIM_VALIDATION_FAILED';
  constructor(message: string) {
    super(message);
    this.name = 'JWTClaimValidationFailed';
  }
}

export class JOSEError extends Error {
  code = 'ERR_JOSE_GENERIC';
  constructor(message: string) {
    super(message);
    this.name = 'JOSEError';
  }
}
