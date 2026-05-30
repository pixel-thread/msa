import { describe, it, expect, beforeAll } from '@jest/globals';
import request from 'supertest';
import type { Express } from 'express';

describe('GET /api/v1/membership-applications — stub', () => {
  let app: Express;

  beforeAll(async () => {
    const mod = await import('@src/index');
    app = mod.default;
  });

  it('should return 501 (not implemented) for GET /', async () => {
    const res = await request(app).get('/api/v1/membership-applications');
    expect(res.status).toBe(501);
  });

  it('should return 501 (not implemented) for POST /:id/approve', async () => {
    const res = await request(app).post('/api/v1/membership-applications/some-id/approve');
    expect(res.status).toBe(501);
  });
});
