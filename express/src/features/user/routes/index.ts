// External libs
import { Router } from 'express';

// ---- Shared middleware

import { auth } from '@src/middleware/auth';

// ---- Route handlers

import { getProfile, updateProfile } from './profile.route';
import { toggleMfa } from './mfa.route';
import { listInvoices, getInvoice } from './invoices.route';

// ---------------------------------------------------------------------------
// User router
//
// Aggregates all user profile, MFA, and invoice route handlers behind a
// single auth wall. Every route under this router requires the caller to
// present a valid authentication token.
// ---------------------------------------------------------------------------

const router: Router = Router();

// ---- Apply auth middleware to every route below

router.use(auth);

// ---- GET  /api/user                  — Fetch own profile
// ---- POST /api/user                  — Update own profile

router.get('/', getProfile);
router.post('/', updateProfile);

// ---- POST /api/user/mfa              — Toggle MFA on/off

router.post('/mfa', toggleMfa);

// ---- GET  /api/user/invoices         — List invoices (paginated)
// ---- GET  /api/user/invoices/:id     — Get a single invoice by ID

router.get('/invoices', listInvoices);
router.get('/invoices/:invoiceId', getInvoice);

export default router;
