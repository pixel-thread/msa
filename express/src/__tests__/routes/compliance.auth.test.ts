import { describe, it, expect, beforeAll } from '@jest/globals';
import request from 'supertest';
import type { Express } from 'express';

describe('GET /api/v1/compliance — auth', () => {
  let app: Express;

  beforeAll(async () => {
    const mod = await import('@src/index');
    app = mod.default;
  });

  it('should not succeed on GET / without token', async () => {
    const res = await request(app).get('/api/v1/compliance');
    expect(res.status).not.toBe(200);
  });

  it('should not succeed on GET /my without token', async () => {
    const res = await request(app).get('/api/v1/compliance/my');
    expect(res.status).not.toBe(200);
  });
});
