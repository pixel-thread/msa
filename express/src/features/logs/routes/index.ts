import { Router } from 'express';
import { postLog, postLogBatch } from './logs.route';

/** Logs ingestion router. */
const router: Router = Router();

router.post('/', postLog);
router.post('/batch', postLogBatch);



export default router;
