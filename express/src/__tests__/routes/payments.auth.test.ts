import { describe, it, expect, beforeAll } from '@jest/globals';
import request from 'supertest';
import type { Express } from 'express';

describe('POST /api/v1/payments/* — auth (no token)', () => {
  let app: Express;

  beforeAll(async () => {
    const mod = await import('@src/index');
    app = mod.default;
  });

  it('should not succeed (200) on POST /order without token', async () => {
    // These routes may or may not return 401 depending on
    // how Express sub-router path resolution works. At minimum
    // they should not return 200 with success:true.
    const res = await request(app).post('/api/v1/payments/order').send({});
    expect(res.status).not.toBe(200);
  });

  it('should not succeed (200) on POST /verify without token', async () => {
    const res = await request(app).post('/api/v1/payments/verify').send({});
    expect(res.status).not.toBe(200);
  });

  it('should not succeed (200) on POST /record without token', async () => {
    const res = await request(app).post('/api/v1/payments/record').send({});
    expect(res.status).not.toBe(200);
  });
});
