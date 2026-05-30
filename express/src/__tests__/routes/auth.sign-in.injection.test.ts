import { describe, it, expect, beforeAll } from '@jest/globals';
import request from 'supertest';
import type { Express } from 'express';

describe('POST /api/v1/auth/sign-in — injection attacks', () => {
  let app: Express;

  beforeAll(async () => {
    const mod = await import('@src/index');
    app = mod.default;
  });

  it('should reject SQL injection in email field → 400 or safe handling', async () => {
    const res = await request(app)
      .post('/api/v1/auth/sign-in')
      .send({ email: "' OR 1=1 --", password: 'ValidPass1!' });
    expect([400, 401]).toContain(res.status);
  });

  it('should reject SQL injection in password field → 400 or safe handling', async () => {
    const res = await request(app)
      .post('/api/v1/auth/sign-in')
      .send({ email: 'test@test.com', password: "'; DROP TABLE users; --" });
    expect([400, 401]).toContain(res.status);
  });

  it('should reject NoSQL injection-like payload → 400', async () => {
    const res = await request(app)
      .post('/api/v1/auth/sign-in')
      .send({ email: { $ne: null }, password: 'ValidPass1!' });
    expect(res.status).toBe(400);
  });

  it('should reject XSS injection in email → 400 or safe handling', async () => {
    const res = await request(app)
      .post('/api/v1/auth/sign-in')
      .send({ email: '<script>alert(1)</script>', password: 'ValidPass1!' });
    expect([400, 401]).toContain(res.status);
  });

  it('should reject XSS injection in password → 400 or safe handling', async () => {
    const res = await request(app)
      .post('/api/v1/auth/sign-in')
      .send({ email: 'test@test.com', password: '<script>document.cookie</script>' });
    expect([400, 401]).toContain(res.status);
  });

  it('should not crash the server on extremely long values', async () => {
    const res = await request(app)
      .post('/api/v1/auth/sign-in')
      .send({ email: 'test@test.com', password: 'A1!' + 'x'.repeat(10000) });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('should not crash on malformed JSON body', async () => {
    const res = await request(app)
      .post('/api/v1/auth/sign-in')
      .set('Content-Type', 'application/json')
      .send('not-json-at-all');
    expect([400, 500]).toContain(res.status);
  });
});
