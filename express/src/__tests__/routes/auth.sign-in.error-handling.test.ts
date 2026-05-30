import { describe, it, expect, beforeAll } from '@jest/globals';
import request from 'supertest';
import type { Express } from 'express';

describe('POST /api/v1/auth/sign-in — error handling', () => {
  let app: Express;

  beforeAll(async () => {
    const mod = await import('@src/index');
    app = mod.default;
  });

  it('should return structured error with traceId on validation failure', async () => {
    const res = await request(app)
      .post('/api/v1/auth/sign-in')
      .send({ email: 'bad', password: 'short' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body).toHaveProperty('traceId');
    expect(typeof res.body.traceId).toBe('string');
    expect(res.body.traceId.length).toBeGreaterThan(0);
  });

  it('should return structured error with traceId on auth failure', async () => {
    const res = await request(app)
      .post('/api/v1/auth/sign-in')
      .send({ email: 'nonexistent@test.com', password: 'ValidPass1!' });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body).toHaveProperty('traceId');
    expect(typeof res.body.traceId).toBe('string');
  });

  it('should NOT expose stack traces in error responses', async () => {
    const res = await request(app)
      .post('/api/v1/auth/sign-in')
      .send({ email: 'nonexistent@test.com', password: 'ValidPass1!' });
    const bodyStr = JSON.stringify(res.body);
    expect(bodyStr).not.toContain('stack');
    expect(bodyStr).not.toContain('at ');
    expect(bodyStr).not.toContain('/src/');
  });

  it('should include timestamp in error responses', async () => {
    const res = await request(app)
      .post('/api/v1/auth/sign-in')
      .send({ email: 'nonexistent@test.com', password: 'ValidPass1!' });
    expect(res.body).toHaveProperty('timestamp');
    expect(new Date(res.body.timestamp).toISOString()).toBe(res.body.timestamp);
  });

  it('should handle extremely large JSON body without crashing', async () => {
    const largePayload = {
      email: 'test@test.com',
      password: 'ValidPass1!',
      extra: 'x'.repeat(100000),
    };
    const res = await request(app)
      .post('/api/v1/auth/sign-in')
      .send(largePayload);
    expect(res.status).toBeGreaterThanOrEqual(400);
  }, 10000);

  it('should handle invalid JSON gracefully', async () => {
    const res = await request(app)
      .post('/api/v1/auth/sign-in')
      .set('Content-Type', 'application/json')
      .send('{invalid json}');
    expect([400, 500]).toContain(res.status);
  });
});
