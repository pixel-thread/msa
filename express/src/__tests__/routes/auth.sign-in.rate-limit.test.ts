import { describe, it, expect, beforeAll } from '@jest/globals';
import request from 'supertest';
import type { Express } from 'express';

describe('POST /api/v1/auth/sign-in — rate limiting', () => {
  let app: Express;

  beforeAll(async () => {
    const mod = await import('@src/index');
    app = mod.default;
  });

  it('should allow normal single request through', async () => {
    const res = await request(app)
      .post('/api/v1/auth/sign-in')
      .send({ email: 'test@test.com', password: 'ValidPass1!' });
    expect([200, 400, 401]).toContain(res.status);
  });

  it('should handle burst requests without crashing', async () => {
    const promises = Array.from({ length: 50 }, (_, i) =>
      request(app)
        .post('/api/v1/auth/sign-in')
        .send({ email: `burst${i}@test.com`, password: 'ValidPass1!' }),
    );
    const results = await Promise.all(promises);
    const ok = results.filter((r) => r.status < 500);
    expect(ok.length).toBeGreaterThan(0);
  });
});
