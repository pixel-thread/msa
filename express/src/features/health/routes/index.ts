import { Router } from 'express';

/** Health check router. */
const router = Router();

/** GET /api/health - Returns OK status with current timestamp. */
router.get('/', (_req, res) => {
  res.json({ success: true, message: 'OK', timestamp: new Date().toISOString() });
});

export default router;
