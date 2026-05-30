import { Router } from 'express';
import { postLog, postLogBatch } from './logs.route';

const router = Router();

router.post('/', postLog);
router.post('/batch', postLogBatch);

export default router;
