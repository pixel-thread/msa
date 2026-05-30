import { Router } from 'express';
import { auth } from '@src/middleware/auth';
import { getProfile, updateProfile } from './profile.route';
import { listInvoices, getInvoice } from './invoices.route';

const router = Router();

router.use(auth);

router.get('/', getProfile);
router.post('/', updateProfile);
router.get('/invoices', listInvoices);
router.get('/invoices/:invoiceId', getInvoice);

export default router;
