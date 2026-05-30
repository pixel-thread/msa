import { Router } from 'express';
import { getAuditLogs } from './audit-logs.route';

const router = Router();

router.get('/', getAuditLogs);

export default router;
