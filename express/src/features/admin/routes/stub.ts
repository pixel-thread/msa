/**
 * @file Admin Stub Router
 * @description This file provides a placeholder router for unimplemented admin endpoints.
 * It returns a 501 Not Implemented status for any request hitting this router.
 */

import { Router } from 'express';

/**
 * @description Router instance for placeholder admin endpoints.
 */
const router: Router = Router();

// Middleware to handle unimplemented routes
router.use((_req, res) => {
  return res.status(501).json({
    success: false,
    message: 'Not implemented yet',
  });
});

export default router;
