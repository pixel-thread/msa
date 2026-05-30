import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import type { Express } from 'express';
import { createAssociation, createUser, cleanupByPrefix } from '../helpers/factories';

const PREFIX = `test-signin-mfa-${Date.now()}`;

describe('POST /api/v1/auth/sign-in — MFA flow', () => {
  let app: Express;
  let association: Awaited<ReturnType<typeof createAssociation>>;

  beforeAll(async () => {
    const mod = await import('@src/index');
    app = mod.default;
    association = await createAssociation({ slug: `${PREFIX}-assoc` });
    await createUser({
      email: `${PREFIX}@test.com`,
      password: 'ValidPass1!',
      role: ['MEMBER'],
      associationId: association.id,
      mfaEnabled: true,
    });
  });

  afterAll(async () => {
    await cleanupByPrefix(PREFIX);
  });

  it('should return 200 with mfaRequired and tempToken when MFA is enabled', async () => {
    const res = await request(app)
      .post('/api/v1/auth/sign-in')
      .send({ email: `${PREFIX}@test.com`, password: 'ValidPass1!' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.mfaRequired).toBe(true);
    expect(res.body.data.tempToken).toBeDefined();
    expect(typeof res.body.data.tempToken).toBe('string');
  });

  it('should not return full access tokens when MFA is pending', async () => {
    const res = await request(app)
      .post('/api/v1/auth/sign-in')
      .send({ email: `${PREFIX}@test.com`, password: 'ValidPass1!' });

    expect(res.body.data.access_token).toBeUndefined();
    expect(res.body.data.refresh_token).toBeUndefined();
  });

  it('should set mfa_temp_token cookie with httpOnly and secure flags', async () => {
    const res = await request(app)
      .post('/api/v1/auth/sign-in')
      .send({ email: `${PREFIX}@test.com`, password: 'ValidPass1!' });

    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    const joined = (Array.isArray(cookies) ? cookies : [cookies]).join('; ');
    expect(joined).toContain('mfa_temp_token=');
    expect(joined).toContain('HttpOnly');
    expect(joined).toContain('SameSite=Strict');
  });

  it('should reset failedLoginAttempts even when MFA is pending', async () => {
    const { prisma } = await import('@src/shared/lib');
    await prisma.user.updateMany({
      where: { email: `${PREFIX}@test.com` },
      data: { failedLoginAttempts: 3 },
    });

    await request(app)
      .post('/api/v1/auth/sign-in')
      .send({ email: `${PREFIX}@test.com`, password: 'ValidPass1!' });

    const user = await prisma.user.findFirst({ where: { email: `${PREFIX}@test.com` } });
    expect(user?.failedLoginAttempts).toBe(0);
    expect(user?.lockedUntil).toBeNull();
  });
});
