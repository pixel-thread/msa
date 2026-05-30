import { Router } from 'express';

/** Stub router for unimplemented meeting endpoints. Returns 501. */
const router:Router= Router();
router.use((_req, res) => res.status(501).json({ success: false, message: 'Not implemented yet' }));
export default router;
