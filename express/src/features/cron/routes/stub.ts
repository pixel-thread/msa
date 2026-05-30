import { Router } from 'express';

/** Placeholder router for unimplemented cron endpoints. */
const router = Router();

router.use((_req, res) => res.status(501).json({ success: false, message: 'Not implemented yet' }));

export default router;
