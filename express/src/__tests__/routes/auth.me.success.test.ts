import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import type { Express } from 'express';

import { createAssociation, createUser, cleanupByPrefix } from '../helpers/factories';
import { signAccessToken } from '../helpers/auth';

const PREFIX = `test-me-success-${Date.now()}`;

describe('GET /api/v1/auth/me — success', () => {
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

  it('should return 200 with user data for valid token', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
  });

  it('should not expose password hash in response', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);
    const bodyStr = JSON.stringify(res.body);
    expect(bodyStr).not.toContain('$2a$');
    expect(bodyStr).not.toContain('password');
  });
});
