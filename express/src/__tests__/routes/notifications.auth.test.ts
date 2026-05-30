import { describe, it, expect, beforeAll } from '@jest/globals';
import request from 'supertest';
import type { Express } from 'express';

describe('POST /api/v1/notifications/* — public access', () => {
  let app: Express;

  beforeAll(async () => {
    const mod = await import('@src/index');
    app = mod.default;
  });

  it('should handle POST /register without crashing', async () => {
    const res = await request(app).post('/api/v1/notifications/register').send({});
    expect(res.status).toBeGreaterThanOrEqual(200);
  });

  it('should handle POST /link without crashing', async () => {
    const res = await request(app).post('/api/v1/notifications/link').send({});
    expect(res.status).toBeGreaterThanOrEqual(200);
  });
});
