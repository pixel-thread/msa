import { Router } from 'express';

// ---- Routes -----------------------------------------------------------------
// GET /api/health
// Description: Returns OK status with current timestamp (used by load balancers)
// Security: Public

const router:Router= Router();

router.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'OK',
    timestamp: new Date().toISOString(),
  });
});

export default router;
