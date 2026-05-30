// External libs
import { Router } from 'express';

/**
 * Placeholder router for unimplemented consent endpoints.
 *
 * Returns 501 Not Implemented for any request.
 * Used as a fallback until real handlers are registered.
 */
const router:Router= Router();

router.use((_req, res) =>
  res.status(501).json({ success: false, message: 'Not implemented yet' }),
);

export default router;
