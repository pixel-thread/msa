import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import type { Express } from 'express';

import { createAssociation, createUser, cleanupByPrefix } from '../helpers/factories';

const PREFIX = `test-fp-${Date.now()}`;

describe('POST /api/v1/auth/forgot-password — success', () => {
  let app: Express;

  beforeAll(async () => {
    const mod = await import('@src/index');
    app = mod.default;
    const association = await createAssociation({ slug: `${PREFIX}-assoc` });
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

  it('should return 200 for existing email (triggers reset token)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: `${PREFIX}@test.com` });
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('A reset email will be sent');
  });
});
