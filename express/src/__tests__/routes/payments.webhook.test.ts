import { describe, it, expect, beforeAll } from '@jest/globals';
import request from 'supertest';
import type { Express } from 'express';

describe('POST /api/v1/payments/webhook', () => {
  let app: Express;

  beforeAll(async () => {
    const mod = await import('@src/index');
    app = mod.default;
  });

  it('should return 400 missing signature header', async () => {
    const res = await request(app)
      .post('/api/v1/payments/webhook')
      .send({ event: 'test' });
    expect(res.status).toBe(400);
  });

  it('should not crash with empty body', async () => {
    const res = await request(app)
      .post('/api/v1/payments/webhook')
      .set('x-razorpay-signature', 'test-sig')
      .send({});
    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(500);
  });
});
