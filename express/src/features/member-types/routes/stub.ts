// ---------------------------------------------------------------------------
// External libs
// ---------------------------------------------------------------------------

import { Router } from 'express';

// ---------------------------------------------------------------------------
// Stub router – 501 fallback for unimplemented member-type endpoints
// ---------------------------------------------------------------------------

/**
 * Catch-all stub router.
 * Every request to an unmounted member-type route receives a 501 response.
 * TODO: wire up actual handler when endpoint is implemented.
 */
const router: Router = Router();

router.use((_req, res) =>
  res.status(501).json({
    success: false,
    message: 'Not implemented yet',
  })
);

export default router;
