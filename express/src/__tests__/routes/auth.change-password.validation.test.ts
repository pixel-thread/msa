import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import type { Express } from 'express';

import { createAssociation, createUser, cleanupByPrefix } from '../helpers/factories';
import { signAccessToken } from '../helpers/auth';

const PREFIX = `test-chpw-val-${Date.now()}`;

describe('POST /api/v1/auth/change-password — input validation', () => {
  let app: Express;
  let token: string;

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
    token = await signAccessToken(user.id);
  });

  afterAll(async () => {
    await cleanupByPrefix(PREFIX);
  });

  it('should reject missing currentPassword → 400', async () => {
    const res = await request(app)
      .post('/api/v1/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ newPassword: 'NewPass1!', confirmPassword: 'NewPass1!' });
    expect(res.status).toBe(400);
  });

  it('should reject missing newPassword → 400', async () => {
    const res = await request(app)
      .post('/api/v1/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'OldPass1!', confirmPassword: 'NewPass1!' });
    expect(res.status).toBe(400);
  });

  it('should reject mismatched passwords → 400', async () => {
    const res = await request(app)
      .post('/api/v1/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'OldPass1!', newPassword: 'NewPass1!', confirmPassword: 'DiffPass1!' });
    expect(res.status).toBe(400);
  });

  it('should reject weak newPassword → 400', async () => {
    const res = await request(app)
      .post('/api/v1/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'OldPass1!', newPassword: 'weak', confirmPassword: 'weak' });
    expect(res.status).toBe(400);
  });
});
