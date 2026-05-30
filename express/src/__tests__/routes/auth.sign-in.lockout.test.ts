import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import type { Express } from 'express';
import { createAssociation, createUser, cleanupByPrefix } from '../helpers/factories';
import { prisma } from '@src/shared/lib';

const PREFIX = `test-signin-lockout-${Date.now()}`;

describe('POST /api/v1/auth/sign-in — account lockout', () => {
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
    });
  });

  afterAll(async () => {
    await cleanupByPrefix(PREFIX);
  });

  it('should lock account after 5 consecutive failed attempts', async () => {
    for (let i = 0; i < 5; i++) {
      const res = await request(app)
        .post('/api/v1/auth/sign-in')
        .send({ email: `${PREFIX}@test.com`, password: `WrongPass${i}!` });

      if (i < 4) {
        expect(res.status).toBe(401);
      } else {
        expect(res.status).toBe(403);
        expect(res.body.message).toContain('locked');
      }
    }
  });

  it('should reject login with valid password while account is locked', async () => {
    const res = await request(app)
      .post('/api/v1/auth/sign-in')
      .send({ email: `${PREFIX}@test.com`, password: 'ValidPass1!' });
    expect(res.status).toBe(403);
    expect(res.body.message).toContain('locked');
  });

  it('should set lockedUntil in the database', async () => {
    const user = await prisma.user.findFirst({ where: { email: `${PREFIX}@test.com` } });
    expect(user?.lockedUntil).toBeInstanceOf(Date);
    expect(user!.lockedUntil!.getTime()).toBeGreaterThan(Date.now());
    expect(user?.failedLoginAttempts).toBe(0);
  });

  it('should reset failedLoginAttempts on successful login after lockout expires', async () => {
    const user = await prisma.user.findFirst({ where: { email: `${PREFIX}@test.com` } });
    await prisma.user.update({
      where: { id: user!.id },
      data: { lockedUntil: null, failedLoginAttempts: 0 },
    });

    const res = await request(app)
      .post('/api/v1/auth/sign-in')
      .send({ email: `${PREFIX}@test.com`, password: 'ValidPass1!' });
    expect(res.status).toBe(200);
  });
});
