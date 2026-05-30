import { Router } from 'express';
import { postSubscriptionExpiry, postDsarSla, postAnonymize } from './cron-jobs.route';

const router = Router();

router.post('/subscription-expiry', postSubscriptionExpiry);
router.post('/dsar-sla', postDsarSla);
router.post('/anonymize', postAnonymize);

export default router;
