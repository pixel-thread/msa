import { describe, it, expect } from '@jest/globals';
import request from 'supertest';
import type { Express } from 'express';

describe('GET /api/v1/health', () => {
  let app: Express;

  beforeAll(async () => {
    const mod = await import('@src/index');
    app = mod.default;
  });

  it('should return 200 OK with success status', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('OK');
  });

  it('should include a timestamp in response', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.body.timestamp).toBeDefined();
    expect(new Date(res.body.timestamp).toISOString()).toBe(res.body.timestamp);
  });

  it('should return 404 for unknown routes', async () => {
    const res = await request(app).get('/api/v1/nonexistent');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
