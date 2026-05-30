import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import type { Express } from 'express';
import bcrypt from 'bcryptjs';

import { createAssociation, createUser, cleanupByPrefix } from '../helpers/factories';
import { prisma } from '@src/shared/lib';

const PREFIX = `test-signin-bad-${Date.now()}`;

describe('POST /api/v1/auth/sign-in — bad credentials', () => {
  let app: Express;
  let association: Awaited<ReturnType<typeof createAssociation>>;

  beforeAll(async () => {
    const mod = await import('@src/index');
    app = mod.default;
    association = await createAssociation({ slug: `${PREFIX}-assoc` });
    const hashedPassword = await bcrypt.hash('ValidPass1!', 4);
    await createUser({
      email: `${PREFIX}@test.com`,
      password: hashedPassword,
      role: ['MEMBER'],
      associationId: association.id,
      name: 'Test User',
    });
  });

  afterAll(async () => {
    await cleanupByPrefix(PREFIX);
  });

  it('should return 401 for non-existent email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/sign-in')
      .send({ email: 'nonexistent@test.com', password: 'ValidPass1!' });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should return 401 for wrong password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/sign-in')
      .send({ email: `${PREFIX}@test.com`, password: 'WrongPass1!' });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should not reveal whether email or password was wrong (same message)', async () => {
    const [res1, res2] = await Promise.all([
      request(app)
        .post('/api/v1/auth/sign-in')
        .send({ email: `${PREFIX}@test.com`, password: 'WrongPass1!' }),
      request(app)
        .post('/api/v1/auth/sign-in')
        .send({ email: 'ghost@test.com', password: 'AnyPass1!' }),
    ]);
    expect(res1.body.message).toBe(res2.body.message);
  });

  it('should increment failedLoginAttempts on wrong password', async () => {
    const userBefore = await prisma.user.findUnique({ where: { email: `${PREFIX}@test.com` } });
    const attemptsBefore = userBefore?.failedLoginAttempts || 0;

    await request(app)
      .post('/api/v1/auth/sign-in')
      .send({ email: `${PREFIX}@test.com`, password: 'WrongPass2!' });

    const userAfter = await prisma.user.findUnique({ where: { email: `${PREFIX}@test.com` } });
    expect(userAfter?.failedLoginAttempts).toBe(attemptsBefore + 1);
  });

  it('should return structured error response on 401', async () => {
    const res = await request(app)
      .post('/api/v1/auth/sign-in')
      .send({ email: 'ghost@test.com', password: 'WrongPass1!' });
    expect(res.body).toHaveProperty('success', false);
    expect(res.body).toHaveProperty('message');
    expect(res.body).toHaveProperty('traceId');
    expect(res.body).toHaveProperty('timestamp');
  });
});
