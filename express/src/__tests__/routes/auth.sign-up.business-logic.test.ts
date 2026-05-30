import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import type { Express } from 'express';

import { createAssociation, createUser, cleanupByPrefix } from '../helpers/factories';

const PREFIX = `test-signup-biz-${Date.now()}`;

describe('POST /api/v1/auth/sign-up — business logic', () => {
  let app: Express;
  let association: Awaited<ReturnType<typeof createAssociation>>;

  beforeAll(async () => {
    const mod = await import('@src/index');
    app = mod.default;
    // Slug must be one of ['mfsa', 'mpsa', 'mpsc'] per MembershipApplicationSchema
    const { prisma: p } = await import('@src/shared/lib/prisma');
    association = await p.association.upsert({
      where: { slug: 'mfsa' },
      update: { name: 'Test MFSA' },
      create: { slug: 'mfsa', name: 'Test MFSA', country: 'India', state: 'Karnataka' },
    });
    await createUser({
      email: `${PREFIX}@test.com`,
      password: 'ValidPass1!',
      role: ['MEMBER'],
      associationId: association.id,
      status: 'ACTIVE',
    });
  });

  afterAll(async () => {
    await cleanupByPrefix(PREFIX);
    const { prisma: p } = await import('@src/shared/lib/prisma');
    await p.membershipApplication.deleteMany({ where: { email: { startsWith: PREFIX } } });
    await p.user.deleteMany({ where: { email: { startsWith: PREFIX } } });
  });

  const validPayload = {
    email: `${PREFIX}-new@test.com`,
    firstName: 'Johnny',
    lastName: 'Doe',
    dateOfBirth: '1990-01-01',
    age: 35,
    phone: `${PREFIX}900`,
    gender: 'MALE' as const,
    associationSlug: 'mfsa' as const,
  };

  it('should return 201 for valid sign-up', async () => {
    const res = await request(app)
      .post('/api/v1/auth/sign-up')
      .send(validPayload);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.status).toBeDefined();
  });

  it('should return 409 for duplicate active email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/sign-up')
      .send({ ...validPayload, email: `${PREFIX}@test.com` });
    expect(res.status).toBe(409);
  });

  it('should reject when association slug is invalid → 400', async () => {
    const res = await request(app)
      .post('/api/v1/auth/sign-up')
      .send({ ...validPayload, associationSlug: 'bad-slug' });
    expect(res.status).toBe(400);
  });
});
