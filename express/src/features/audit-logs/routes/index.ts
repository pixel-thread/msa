// ---- Routes: Audit-log index

// External libs
import { Router } from 'express';

// Middleware
import { auth } from '@src/middleware/auth';

// Route handlers
import { getAuditLogs } from './audit-logs.route';

// ---- Route definitions

/** Audit-logs feature router - all routes require authentication. */
const router: Router = Router();

// ---- Middleware

/** All audit-log routes require a valid session. */
router.use(auth);

// ---- Audit-log endpoints

router.get('/', getAuditLogs);

export default router;
