import { describe, it, expect, beforeAll } from '@jest/globals';
import request from 'supertest';
import type { Express } from 'express';

const REQUIRED_FIELDS = {
  phone: `val-${Date.now()}-phone`,
  gender: 'MALE' as const,
  associationSlug: 'mfsa' as const,
};

describe('POST /api/v1/auth/sign-up — input validation', () => {
  let app: Express;

  beforeAll(async () => {
    const mod = await import('@src/index');
    app = mod.default;
  });

  it('should reject missing email → 400', async () => {
    const res = await request(app)
      .post('/api/v1/auth/sign-up')
      .send({ firstName: 'Johnny', lastName: 'Doe', dateOfBirth: '2000-01-01', age: 25, ...REQUIRED_FIELDS });
    expect(res.status).toBe(400);
  });

  it('should reject missing firstName → 400', async () => {
    const res = await request(app)
      .post('/api/v1/auth/sign-up')
      .send({ email: 'test@test.com', lastName: 'Doe', dateOfBirth: '2000-01-01', age: 25, ...REQUIRED_FIELDS });
    expect(res.status).toBe(400);
  });

  it('should reject missing lastName → 400', async () => {
    const res = await request(app)
      .post('/api/v1/auth/sign-up')
      .send({ email: 'test@test.com', firstName: 'Johnny', dateOfBirth: '2000-01-01', age: 25, ...REQUIRED_FIELDS });
    expect(res.status).toBe(400);
  });

  it('should reject invalid email format → 400', async () => {
    const res = await request(app)
      .post('/api/v1/auth/sign-up')
      .send({ email: 'not-an-email', firstName: 'Johnny', lastName: 'Doe', dateOfBirth: '2000-01-01', age: 25, ...REQUIRED_FIELDS });
    expect(res.status).toBe(400);
  });

  it('should reject firstName shorter than 3 chars → 400', async () => {
    const res = await request(app)
      .post('/api/v1/auth/sign-up')
      .send({ email: 'test@test.com', firstName: 'Jo', lastName: 'Doe', dateOfBirth: '2000-01-01', age: 25, ...REQUIRED_FIELDS });
    expect(res.status).toBe(400);
  });

  it('should reject age under 18 → 400', async () => {
    const res = await request(app)
      .post('/api/v1/auth/sign-up')
      .send({ email: 'test@test.com', firstName: 'Johnny', lastName: 'Doe', dateOfBirth: '2010-01-01', age: 15, ...REQUIRED_FIELDS });
    expect(res.status).toBe(400);
  });

  it('should reject extra unexpected fields (.strict()) → 400', async () => {
    const res = await request(app)
      .post('/api/v1/auth/sign-up')
      .send({
        email: 'test@test.com', firstName: 'Johnny', lastName: 'Doe',
        dateOfBirth: '2000-01-01', age: 25, ...REQUIRED_FIELDS, extraField: 'hack',
      });
    expect(res.status).toBe(400);
  });
});
