import { Router } from 'express';

/** Stub router returning 501 for unimplemented notification endpoints. */
const router = Router();

router.use((_req, res) => res.status(501).json({ success: false, message: 'Not implemented yet' }));

export default router;
