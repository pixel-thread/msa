import { Router } from 'express';

/** Placeholder router for unimplemented audit-log endpoints. */
const router: Router = Router();

router.use((_req, res) => res.status(501).json({ success: false, message: 'Not implemented yet' }));

export default router;
