import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import type { Express } from 'express';

import { createAssociation, createUser, cleanupByPrefix } from '../helpers/factories';
import { signAccessToken } from '../helpers/auth';

const PREFIX = `test-pay-val-${Date.now()}`;

describe('POST /api/v1/payments/verify — validation', () => {
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

  it('should reject missing razorpayOrderId → 400', async () => {
    const res = await request(app)
      .post('/api/v1/payments/verify')
      .set('Authorization', `Bearer ${token}`)
      .send({ razorpayPaymentId: 'pay_test', razorpaySignature: 'sig' });
    expect(res.status).toBe(400);
  });

  it('should reject missing razorpayPaymentId → 400', async () => {
    const res = await request(app)
      .post('/api/v1/payments/verify')
      .set('Authorization', `Bearer ${token}`)
      .send({ razorpayOrderId: 'order_test', razorpaySignature: 'sig' });
    expect(res.status).toBe(400);
  });

  it('should reject missing razorpaySignature → 400', async () => {
    const res = await request(app)
      .post('/api/v1/payments/verify')
      .set('Authorization', `Bearer ${token}`)
      .send({ razorpayOrderId: 'order_test', razorpayPaymentId: 'pay_test' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/v1/payments/record — validation', () => {
  let app: Express;
  let token: string;

  beforeAll(async () => {
    const mod = await import('@src/index');
    app = mod.default;
    const association = await createAssociation({ slug: `${PREFIX}-record-assoc` });
    const user = await createUser({
      email: `${PREFIX}-record@test.com`,
      password: 'ValidPass1!',
      role: ['FINANCE'],
      associationId: association.id,
    });
    token = await signAccessToken(user.id);
  });

  afterAll(async () => {
    await cleanupByPrefix(PREFIX);
  });

  it('should reject missing userId → 400', async () => {
    const res = await request(app)
      .post('/api/v1/payments/record')
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 100, method: 'CASH' });
    expect(res.status).toBe(400);
  });

  it('should reject missing amount → 400', async () => {
    const res = await request(app)
      .post('/api/v1/payments/record')
      .set('Authorization', `Bearer ${token}`)
      .send({ userId: '00000000-0000-0000-0000-000000000000', method: 'CASH' });
    expect(res.status).toBe(400);
  });

  it('should reject negative amount → 400', async () => {
    const res = await request(app)
      .post('/api/v1/payments/record')
      .set('Authorization', `Bearer ${token}`)
      .send({ userId: '00000000-0000-0000-0000-000000000000', amount: -10, method: 'CASH' });
    expect(res.status).toBe(400);
  });

  it('should reject missing method → 400', async () => {
    const res = await request(app)
      .post('/api/v1/payments/record')
      .set('Authorization', `Bearer ${token}`)
      .send({ userId: '00000000-0000-0000-0000-000000000000', amount: 100 });
    expect(res.status).toBe(400);
  });
});
