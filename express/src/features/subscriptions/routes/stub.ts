// ---------------------------------------------------------------------------
// External libs
// ---------------------------------------------------------------------------
import { Router } from 'express';

// ---- Stub router -------------------------------------------------------------

/**
 * Placeholder router for unimplemented subscription endpoints.
 *
 * Returns 501 for any request routed here, which allows the
 * feature to be partially deployed while the remaining
 * endpoints are still under development.
 */
const router: Router = Router();

router.use(
  (
    _req,
    res,
  ) => {
    res.status(501).json({
      success: false,
      message: 'Not implemented yet',
    });
  },
);

export default router;
