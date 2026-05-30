import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import type { Express } from 'express';
import { hashToken } from '@src/shared/lib/password';
import { signPasswordResetToken } from '@src/shared/lib/jwt';
import { updateUser } from '@src/features/user/services';

import { createAssociation, createUser, cleanupByPrefix } from '../helpers/factories';

const PREFIX = `test-rp-${Date.now()}`;

describe('POST /api/v1/auth/reset-password — success', () => {
  let app: Express;
  let user: Awaited<ReturnType<typeof createUser>>;
  let resetToken: string;

  beforeAll(async () => {
    const mod = await import('@src/index');
    app = mod.default;
    const association = await createAssociation({ slug: `${PREFIX}-assoc` });
    user = await createUser({
      email: `${PREFIX}@test.com`,
      password: 'ValidPass1!',
      role: ['MEMBER'],
      associationId: association.id,
    });
    resetToken = await signPasswordResetToken(user.id);
    const hashedToken = hashToken(resetToken);
    const resetExpiry = new Date();
    resetExpiry.setHours(resetExpiry.getHours() + 1);
    await updateUser({
      where: { id: user.id },
      data: { passwordResetToken: hashedToken, passwordResetExpires: resetExpiry },
    });
  });

  afterAll(async () => {
    await cleanupByPrefix(PREFIX);
  });

  it('should return 200 and reset password with valid token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({ token: resetToken, password: 'NewValidPass1!' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBe(true);
  });
});
