import { describe, it, expect, beforeAll } from '@jest/globals';
import request from 'supertest';
import type { Express } from 'express';

describe('GET /api/v1/auth/me — authentication', () => {
  let app: Express;

  beforeAll(async () => {
    const mod = await import('@src/index');
    app = mod.default;
  });

  it('should return 401 without token', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should return error with malformed token', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer not-a-token');
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('should return error with tampered token', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiJ9.dGVzdA.tampered');
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('should return structured error with traceId on auth failure', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.body).toHaveProperty('traceId');
    expect(res.body).toHaveProperty('timestamp');
  });
});
