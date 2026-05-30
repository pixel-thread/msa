import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import type { Express } from 'express';

import { createAssociation, createUser, cleanupByPrefix } from '../helpers/factories';
import { prisma } from '@src/shared/lib';

const PREFIX = `test-signin-success-${Date.now()}`;

describe('POST /api/v1/auth/sign-in — success', () => {
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

  it('should return 200 with tokens and store refresh token in DB', async () => {
    const res = await request(app)
      .post('/api/v1/auth/sign-in')
      .send({ email: `${PREFIX}@test.com`, password: 'ValidPass1!' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const { access_token, refresh_token } = res.body.data;
    expect(access_token).toBeDefined();
    expect(refresh_token).toBeDefined();
    expect(access_token.split('.').length).toBe(3);
    expect(refresh_token.split('.').length).toBe(3);

    const tokens = await prisma.refreshToken.findMany({
      where: { user: { email: `${PREFIX}@test.com` } },
    });
    expect(tokens.length).toBe(1);
    expect(tokens[0].expiresAt).toBeDefined();
  });

  it('should reset failedLoginAttempts to 0 on successful login', async () => {
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
    await cleanupByPrefix(PREFIX);
  });
});
