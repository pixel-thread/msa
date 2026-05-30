import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import type { Express } from 'express';

import { createAssociation, createUser, cleanupByPrefix } from '../helpers/factories';
import { signAccessToken } from '../helpers/auth';

const PREFIX = `test-chpw-${Date.now()}`;

describe('POST /api/v1/auth/change-password — success', () => {
  let app: Express;
  let token: string;
  let password: string;

  beforeAll(async () => {
    const mod = await import('@src/index');
    app = mod.default;
    password = 'OldPass1!';
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
    const res = await request(app)
      .post('/api/v1/auth/change-password')
      .send({ currentPassword: password, newPassword: 'NewPass1!', confirmPassword: 'NewPass1!' });
    expect(res.status).toBe(401);
  });

  it('should return 200 with valid current password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: password, newPassword: 'NewPass1!', confirmPassword: 'NewPass1!' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should reject wrong current password → 400', async () => {
    const res = await request(app)
      .post('/api/v1/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'WrongPass1!', newPassword: 'NewPass2!', confirmPassword: 'NewPass2!' });
    expect(res.status).toBe(400);
  });
});
