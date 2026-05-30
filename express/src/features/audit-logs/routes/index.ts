import { Router } from 'express';
import { getAuditLogs } from './audit-logs.route';
import { auth } from '@src/middleware/auth';

/** Audit-logs feature router - all routes require authentication. */
const router: Router = Router();

router.use(auth);

router.get('/', getAuditLogs);

export default router;
