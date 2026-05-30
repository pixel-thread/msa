import { describe, it, expect, beforeAll } from '@jest/globals';
import request from 'supertest';
import type { Express } from 'express';

describe('POST /api/v1/auth/refresh — input validation', () => {
  let app: Express;

  beforeAll(async () => {
    const mod = await import('@src/index');
    app = mod.default;
  });

  it('should return 401 without refresh token', async () => {
    const res = await request(app).post('/api/v1/auth/refresh').send({});
    expect(res.status).toBe(401);
  });

  it('should return 401 with invalid token format', async () => {
    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ token: 'not-a-valid-jwt' });
    expect(res.status).toBe(401);
  });
});
