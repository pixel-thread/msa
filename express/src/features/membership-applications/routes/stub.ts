// ---- Membership Applications - Stub Router

import { Router } from 'express';

// ---- Router Setup

/** Placeholder router for unimplemented membership-application endpoints. */
const router:Router= Router();

// ---- Catch-All Handler

router.use((_req, res) =>
  res.status(501).json({ success: false, message: 'Not implemented yet' })
);

export default router;
