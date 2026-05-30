import { Router } from 'express';

// ---- Stub -------------------------------------------------------------------
// Placeholder router for unimplemented cron endpoints.
// Extend this file with real handlers as cron functionality is added.

const router:Router= Router();

router.use((_req, res) => {
  res.status(501).json({
    success: false,
    message: 'Not implemented yet',
  });
});

export default router;
