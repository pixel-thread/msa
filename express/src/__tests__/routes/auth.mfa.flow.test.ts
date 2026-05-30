import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import type { Express } from 'express';

import { createAssociation, createUser, cleanupByPrefix } from '../helpers/factories';
import { signAccessToken } from '../helpers/auth';

const PREFIX = `test-mfa-${Date.now()}`;

describe('POST /api/v1/auth/mfa/setup', () => {
  let app: Express;
  let token: string;
  let password: string;

  beforeAll(async () => {
    const mod = await import('@src/index');
    app = mod.default;
    password = 'ValidPass1!';
    const association = await createAssociation({ slug: `${PREFIX}-assoc` });
    const user = await createUser({
      email: `${PREFIX}@test.com`,
      password,
      role: ['MEMBER'],
      associationId: association.id,
    });
    token = await signAccessToken(user.id);
  });

  afterAll(async () => {
    await cleanupByPrefix(PREFIX);
  });

  it('should return 401 without token', async () => {
    const res = await request(app).post('/api/v1/auth/mfa/setup').send({ password });
    expect(res.status).toBe(401);
  });

  it('should return 200 with valid password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/mfa/setup')
      .set('Authorization', `Bearer ${token}`)
      .send({ password });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should reject wrong password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/mfa/setup')
      .set('Authorization', `Bearer ${token}`)
      .send({ password: 'WrongPass1!' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/v1/auth/mfa/verify', () => {
  let app: Express;
  let token: string;

  beforeAll(async () => {
    const mod = await import('@src/index');
    app = mod.default;
    const association = await createAssociation({ slug: `${PREFIX}-verify-assoc` });
    const user = await createUser({
      email: `${PREFIX}-verify@test.com`,
      password: 'ValidPass1!',
      role: ['MEMBER'],
      associationId: association.id,
    });
    token = await signAccessToken(user.id);
  });

  afterAll(async () => {
    await cleanupByPrefix(PREFIX);
  });

  it('should return 401 without token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/mfa/verify')
      .send({ code: '123456' });
    expect(res.status).toBe(401);
  });

  it('should reject invalid code length', async () => {
    const res = await request(app)
      .post('/api/v1/auth/mfa/verify')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: '123' });
    expect(res.status).toBe(400);
  });

  it('should reject code without prior setup', async () => {
    const res = await request(app)
      .post('/api/v1/auth/mfa/verify')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: '123456' });
    expect(res.status).toBe(401);
  });
});

describe('POST /api/v1/auth/mfa/resend', () => {
  let app: Express;
  let token: string;

  beforeAll(async () => {
    const mod = await import('@src/index');
    app = mod.default;
    const association = await createAssociation({ slug: `${PREFIX}-resend-assoc` });
    const user = await createUser({
      email: `${PREFIX}-resend@test.com`,
      password: 'ValidPass1!',
      role: ['MEMBER'],
      associationId: association.id,
    });
    token = await signAccessToken(user.id);
  });

  afterAll(async () => {
    await cleanupByPrefix(PREFIX);
  });

  it('should return 401 without token', async () => {
    const res = await request(app).post('/api/v1/auth/mfa/resend').send({});
    expect(res.status).toBe(401);
  });
});

describe('POST /api/v1/auth/mfa/disable', () => {
  let app: Express;
  let token: string;
  let password: string;

  beforeAll(async () => {
    const mod = await import('@src/index');
    app = mod.default;
    password = 'ValidPass1!';
    const association = await createAssociation({ slug: `${PREFIX}-disable-assoc` });
    const user = await createUser({
      email: `${PREFIX}-disable@test.com`,
      password,
      role: ['MEMBER'],
      associationId: association.id,
    });
    token = await signAccessToken(user.id);
  });

  afterAll(async () => {
    await cleanupByPrefix(PREFIX);
  });

  it('should return 401 without token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/mfa/disable')
      .send({ password });
    expect(res.status).toBe(401);
  });
});
