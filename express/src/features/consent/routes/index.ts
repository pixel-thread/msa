// ---- Routes: Consent index

// External libs
import { Router } from 'express';

// Middleware
import { auth } from '@src/middleware/auth';

// Route handlers
import { getMyConsent } from './my-consent.route';
import { grantConsent, revokeConsent } from './grant-revoke.route';
import { getAllConsentRecords, getConsentHistory, getConsentReport } from './admin-consent.route';
import { getReceipt, updateReceipt, deleteReceipt, getUserConsents } from './user-consent.route';

// ---- Route definitions

/** Consent feature router - all routes require authentication. */
const router: Router = Router();

// ---- Middleware

/** All consent routes require a valid session. */
router.use(auth);

// ---- User-facing consent endpoints

router.get('/my', getMyConsent);

// ---- Grant / Revoke endpoints

router.post('/grant', grantConsent);
router.post('/revoke', revokeConsent);

// ---- Admin consent records (DPO role required)

router.get('/all', getAllConsentRecords);
router.get('/history', getConsentHistory);
router.get('/report', getConsentReport);

// ---- User-specific admin endpoints

router.get('/users/:userId', getUserConsents);

// ---- Receipt management (DPO role required)

router.get('/:receiptId', getReceipt);
router.patch('/:receiptId', updateReceipt);
router.delete('/:receiptId', deleteReceipt);

export default router;
