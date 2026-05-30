import { describe, it, expect, beforeAll } from '@jest/globals';
import request from 'supertest';
import type { Express } from 'express';

describe('GET /api/v1/meetings — auth', () => {
  let app: Express;

  beforeAll(async () => {
    const mod = await import('@src/index');
    app = mod.default;
  });

  it('should not succeed on GET /my without token', async () => {
    const res = await request(app).get('/api/v1/meetings/my');
    expect(res.status).not.toBe(200);
  });

  it('should not succeed on GET / without token', async () => {
    const res = await request(app).get('/api/v1/meetings');
    expect(res.status).not.toBe(200);
  });

  it('should not succeed on POST / without token', async () => {
    const res = await request(app).post('/api/v1/meetings').send({});
    expect(res.status).not.toBe(200);
  });
});
