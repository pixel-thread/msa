// ---------------------------------------------------------------------------
// Stub Route — placeholder for unimplemented endpoints
// Returns 501 Not Implemented for every request method
// ---------------------------------------------------------------------------

import { Router } from 'express';

const router:Router= Router();

router.use((_req, res) =>
  res.status(501).json({ success: false, message: 'Not implemented yet' }),
);

export default router;
