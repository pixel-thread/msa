import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import type { Express } from 'express';

import { createAssociation, createUser, cleanupByPrefix } from '../helpers/factories';
import { signAccessToken } from '../helpers/auth';

const PREFIX = `test-logout-${Date.now()}`;

describe('POST /api/v1/auth/logout', () => {
  let app: Express;
  let association: Awaited<ReturnType<typeof createAssociation>>;
  let token: string;

  beforeAll(async () => {
    const mod = await import('@src/index');
    app = mod.default;
    association = await createAssociation({ slug: `${PREFIX}-assoc` });
    const user = await createUser({
      email: `${PREFIX}@test.com`,
      password: 'ValidPass1!',
      role: ['MEMBER'],
      associationId: association.id,
    });
    token = await signAccessToken(user.id);
  });

  afterAll(async () => {
    await cleanupByPrefix(PREFIX);
  });

  it('should return 401 without auth token', async () => {
    const res = await request(app).post('/api/v1/auth/logout');
    expect(res.status).toBe(401);
  });

  it('should return 200 with auth token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
