import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import type { Express } from 'express';

import { createAssociation, createUser, cleanupByPrefix } from '../helpers/factories';
import { prisma } from '@src/shared/lib';

const PREFIX = `test-signin-dataleak-${Date.now()}`;

describe('POST /api/v1/auth/sign-in — data leakage', () => {
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

  it('should not expose password hash in any response', async () => {
    const res = await request(app)
      .post('/api/v1/auth/sign-in')
      .send({ email: `${PREFIX}@test.com`, password: 'ValidPass1!' });
    const bodyStr = JSON.stringify(res.body);
    expect(bodyStr).not.toContain('$2a$');
    expect(bodyStr).not.toContain('$2b$');
    expect(bodyStr).not.toContain('failedLoginAttempts');
    expect(bodyStr).not.toContain('passwordResetToken');
    expect(bodyStr).not.toContain('lockedUntil');
  });

  it('should not expose internal user fields in error response', async () => {
    const res = await request(app)
      .post('/api/v1/auth/sign-in')
      .send({ email: `${PREFIX}@test.com`, password: 'WrongPass1!' });
    expect(res.status).toBe(401);
    const bodyStr = JSON.stringify(res.body);
    expect(bodyStr).not.toContain('$2a$');
    expect(bodyStr).not.toContain('passwordResetToken');
    expect(bodyStr).not.toContain('failedLoginAttempts');
    expect(bodyStr).not.toContain('lockedUntil');
    expect(bodyStr).not.toContain('$2a$');
    expect(bodyStr).not.toContain('passwordResetToken');
  });

  it('should not reveal whether email exists via response message', async () => {
    const [res1, res2] = await Promise.all([
      request(app)
        .post('/api/v1/auth/sign-in')
        .send({ email: `${PREFIX}@test.com`, password: 'WrongPass1!' }),
      request(app)
        .post('/api/v1/auth/sign-in')
        .send({ email: 'doesnotexist@test.com', password: 'WrongPass1!' }),
    ]);
    expect(res1.body.message).toBe(res2.body.message);
    expect(res1.status).toBe(res2.status);
  });

  it('should not leak database error details to client', async () => {
    const res = await request(app)
      .post('/api/v1/auth/sign-in')
      .send({ email: `${PREFIX}@test.com`, password: 'ValidPass1!' });
    const bodyStr = JSON.stringify(res.body);
    expect(bodyStr).not.toContain('P2002');
    expect(bodyStr).not.toContain('UniqueConstraint');
    expect(bodyStr).not.toContain('driverAdapterError');
  });
});
