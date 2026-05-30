import { describe, it, expect, beforeAll } from '@jest/globals';
import request from 'supertest';
import type { Express } from 'express';

describe('GET /api/v1/members — auth', () => {
  let app: Express;

  beforeAll(async () => {
    const mod = await import('@src/index');
    app = mod.default;
  });

  it('should not succeed on GET / without token', async () => {
    const res = await request(app).get('/api/v1/members');
    expect(res.status).not.toBe(200);
  });

  it('should not succeed on GET /:memberId without token', async () => {
    const res = await request(app).get('/api/v1/members/00000000-0000-0000-0000-000000000000');
    expect(res.status).not.toBe(200);
  });

  it('should not succeed on POST /onboarding without token', async () => {
    const res = await request(app).post('/api/v1/members/onboarding').send({});
    expect(res.status).not.toBe(200);
  });
});
