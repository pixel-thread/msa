import { Router } from 'express';
import { auth } from '@src/middleware/auth';
import { listAccounts, createAccountHandler } from './accounts.route';
import { listEntries, createEntry, approveEntryHandler } from './entries.route';
import { getLedgerSummary } from './summary.route';
import { getMemberLedger } from './member-ledger.route';

/** Ledger feature router - all routes require authentication. */
const router: Router = Router();

router.use(auth);

router.get('/accounts', listAccounts);


router.post('/accounts', createAccountHandler);
router.get('/entries', listEntries);
router.post('/entries', createEntry);
router.post('/entries/:entryId/approve', approveEntryHandler);
router.get('/summary', getLedgerSummary);
router.get('/member/:memberId', getMemberLedger);

export default router;
