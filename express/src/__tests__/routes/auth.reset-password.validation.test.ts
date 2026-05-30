import { describe, it, expect, beforeAll } from '@jest/globals';
import request from 'supertest';
import type { Express } from 'express';

describe('POST /api/v1/auth/reset-password — validation', () => {
  let app: Express;

  beforeAll(async () => {
    const mod = await import('@src/index');
    app = mod.default;
  });

  it('should reject missing token → 400', async () => {
    const res = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({ password: 'NewValidPass1!' });
    expect(res.status).toBe(400);
  });

  it('should reject missing password → 400', async () => {
    const res = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({ token: 'some-token' });
    expect(res.status).toBe(400);
  });

  it('should reject weak password → 400', async () => {
    const res = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({ token: 'some-token', password: 'weak' });
    expect(res.status).toBe(400);
  });

  it('should reject invalid reset token → 401', async () => {
    const res = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({ token: 'invalid-token', password: 'NewValidPass1!' });
    expect(res.status).toBe(401);
  });
});
