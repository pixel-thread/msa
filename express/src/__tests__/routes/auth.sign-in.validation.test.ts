import { describe, it, expect, beforeAll } from '@jest/globals';
import request from 'supertest';
import type { Express } from 'express';

describe('POST /api/v1/auth/sign-in — input validation', () => {
  let app: Express;

  beforeAll(async () => {
    const mod = await import('@src/index');
    app = mod.default;
  });

  it('should reject missing email → 400', async () => {
    const res = await request(app)
      .post('/api/v1/auth/sign-in')
      .send({ password: 'ValidPass1!' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should reject missing password → 400', async () => {
    const res = await request(app)
      .post('/api/v1/auth/sign-in')
      .send({ email: 'test@test.com' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should reject empty password → 400', async () => {
    const res = await request(app)
      .post('/api/v1/auth/sign-in')
      .send({ email: 'test@test.com', password: '' });
    expect(res.status).toBe(400);
  });

  it('should reject invalid email format → 400', async () => {
    const res = await request(app)
      .post('/api/v1/auth/sign-in')
      .send({ email: 'not-an-email', password: 'ValidPass1!' });
    expect(res.status).toBe(400);
  });

  it('should reject password shorter than 8 chars → 400', async () => {
    const res = await request(app)
      .post('/api/v1/auth/sign-in')
      .send({ email: 'test@test.com', password: 'Ab1!' });
    expect(res.status).toBe(400);
  });

  it('should reject password missing uppercase → 400', async () => {
    const res = await request(app)
      .post('/api/v1/auth/sign-in')
      .send({ email: 'test@test.com', password: 'lowercase1!' });
    expect(res.status).toBe(400);
  });

  it('should reject password missing number → 400', async () => {
    const res = await request(app)
      .post('/api/v1/auth/sign-in')
      .send({ email: 'test@test.com', password: 'NoNumber!' });
    expect(res.status).toBe(400);
  });

  it('should reject password missing special char → 400', async () => {
    const res = await request(app)
      .post('/api/v1/auth/sign-in')
      .send({ email: 'test@test.com', password: 'NoSpecial1' });
    expect(res.status).toBe(400);
  });

  it('should reject password exceeding 100 chars → 400', async () => {
    const res = await request(app)
      .post('/api/v1/auth/sign-in')
      .send({ email: 'test@test.com', password: 'A1!' + 'x'.repeat(100) });
    expect(res.status).toBe(400);
  });

  it('should reject extra unexpected fields (.strict()) → 400', async () => {
    const res = await request(app)
      .post('/api/v1/auth/sign-in')
      .send({ email: 'test@test.com', password: 'ValidPass1!', extraField: 'hack' });
    expect(res.status).toBe(400);
  });
});
