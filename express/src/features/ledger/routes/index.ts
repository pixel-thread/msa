// ---------------------------------------------------------------------------
// External libs
// ---------------------------------------------------------------------------

import { Router } from 'express';

// ---------------------------------------------------------------------------
// Shared utilities
// ---------------------------------------------------------------------------

import { auth } from '@src/middleware/auth';

// ---------------------------------------------------------------------------
// Route handlers
// ---------------------------------------------------------------------------

import { listAccounts, createAccountHandler } from './accounts.route';
import { listEntries, createEntry, approveEntryHandler } from './entries.route';
import { getLedgerSummary } from './summary.route';
import { getMemberLedger } from './member-ledger.route';

// ---------------------------------------------------------------------------
// Router setup – all routes require authentication
// ---------------------------------------------------------------------------

const router: Router = Router();

router.use(auth);

// ---- Accounts ---------------------------------------------------------------

router.get('/accounts', listAccounts);
router.post('/accounts', createAccountHandler);

// ---- Entries ----------------------------------------------------------------

router.get('/entries', listEntries);
router.post('/entries', createEntry);
router.post('/entries/:entryId/approve', approveEntryHandler);

// ---- Summary ----------------------------------------------------------------

router.get('/summary', getLedgerSummary);

// ---- Member-specific ledger -------------------------------------------------

router.get('/member/:memberId', getMemberLedger);

export default router;
