import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import type { Express } from 'express';

import { createAssociation, createUser, cleanupByPrefix } from '../helpers/factories';
import { signRefreshToken } from '../helpers/auth';
import { hashToken } from '@src/shared/lib/password';

const PREFIX = `test-refresh-${Date.now()}`;

describe('POST /api/v1/auth/refresh — success', () => {
  let app: Express;
  let refreshToken: string;

  beforeAll(async () => {
    const mod = await import('@src/index');
    app = mod.default;
    const association = await createAssociation({ slug: `${PREFIX}-assoc` });
    const user = await createUser({
      email: `${PREFIX}@test.com`,
      password: 'ValidPass1!',
      role: ['MEMBER'],
      associationId: association.id,
    });
    refreshToken = await signRefreshToken(user.id);
    const hashedToken = hashToken(refreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    const { prisma } = await import('@src/shared/lib/prisma');
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: hashedToken,
        expiresAt,
      },
    });
  });

  afterAll(async () => {
    await cleanupByPrefix(PREFIX);
  });

  it('should return 200 with new tokens for valid refresh token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ token: refreshToken });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('access_token');
    expect(res.body.data).toHaveProperty('refresh_token');
  });
});
