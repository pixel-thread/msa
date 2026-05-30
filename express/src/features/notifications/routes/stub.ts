// External libs
import { Router } from 'express';

// ---------------------------------------------------------------------------
// Stub router — Notifications
//
// Placeholder that returns 501 for any currently unimplemented notification
// endpoint. This allows the parent router to mount routes without waiting for
// the full implementation to be completed.
// ---------------------------------------------------------------------------

const router:Router= Router();

router.use((_req, res) =>
  res.status(501).json({ success: false, message: 'Not implemented yet' }),
);

export default router;
