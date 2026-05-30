import { Router } from 'express';
import { auth } from '@src/middleware/auth';
import { getMyConsent } from './my-consent.route';
import { grantConsent, revokeConsent } from './grant-revoke.route';
import { getAllConsentRecords, getConsentHistory, getConsentReport } from './admin-consent.route';
import { getReceipt, updateReceipt, deleteReceipt, getUserConsents } from './user-consent.route';

const router = Router();

router.use(auth);

router.get('/my', getMyConsent);
router.post('/grant', grantConsent);
router.post('/revoke', revokeConsent);
router.get('/all', getAllConsentRecords);
router.get('/history', getConsentHistory);
router.get('/report', getConsentReport);
router.get('/users/:userId', getUserConsents);
router.get('/:receiptId', getReceipt);
router.patch('/:receiptId', updateReceipt);
router.delete('/:receiptId', deleteReceipt);

export default router;
