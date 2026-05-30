/**
 * @file Association Route Stub
 * @description Placeholder router for unimplemented association endpoints.
 */

import { Router } from 'express';

/**
 * Placeholder router for unimplemented association endpoints.
 * Returns 501 Not Implemented for any request.
 */
const router: Router = Router();

router.use((_req, res) =>
  res.status(501).json({
    success: false,
    message: 'Not implemented yet',
  }),
);

export default router;
