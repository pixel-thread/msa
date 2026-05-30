// ---------------------------------------------------------------------------
// Payment Routes Index
// Organises all /api/payments/* route handlers into a single router.
// Route ordering is deliberate: static routes before parameterized routes,
// and providers' :providerId routes before generic :paymentId routes.
// ---------------------------------------------------------------------------

import { Router } from 'express';
import { auth } from '@src/middleware/auth';

// ---- Payments ----
import { listPayments } from './list-payments.route';
import { myPayments } from './my-payments.route';
import { paymentHistory } from './payment-history.route';
import { paymentStats } from './payment-stats.route';
import { getPayment } from './get-payment.route';
import { getReceipt } from './get-receipt.route';

// ---- Razorpay Flow ----
import { createOrder } from './create-order.route';
import { verifyPayment } from './verify-payment.route';
import { webhook } from './webhook.route';
import { recordPayment } from './record-payment.route';

// ---- User-Specific ----
import { userPayments, userContributions } from './user-payments.route';

// ---- Contributions ----
import {
  listContributions,
  generateContributions,
  waiveContributionHandler,
  getContribution,
} from './contributions.route';

// ---- Reports ----
import { collectionsReport } from './collections-report.route';

// ---- Providers ----
import {
  listProviders,
  createProviderHandler,
  providerStatus,
  getProvider,
  updateProviderHandler,
  deleteProviderHandler,
  activateProvider,
  testProvider,
  verifyTestProvider,
} from './providers.route';

const router: Router = Router();

// ===========================================================================
// Static Routes
// ===========================================================================

router.get('/', auth, listPayments);
router.get('/my', auth, myPayments);
router.get('/history', auth, paymentHistory);
router.get('/stats', auth, paymentStats);

// ===========================================================================
// Razorpay Flow
// ===========================================================================

router.post('/order', auth, createOrder);
router.post('/verify', auth, verifyPayment);
router.post('/webhook', webhook);
router.post('/record', auth, recordPayment);

// ===========================================================================
// User-Specific
// ===========================================================================

router.get('/users/:userId', auth, userPayments);
router.get('/users/:userId/contributions', auth, userContributions);

// ===========================================================================
// Contributions
// ===========================================================================

router.get('/contributions', auth, listContributions);
router.post('/contributions', auth, generateContributions);
router.patch('/contributions', auth, waiveContributionHandler);
router.get('/contributions/:contributionId', auth, getContribution);

// ===========================================================================
// Reports
// ===========================================================================

router.get('/reports/collections', auth, collectionsReport);

// ===========================================================================
// Providers
// Must come before :paymentId to avoid route collision with /providers
// ===========================================================================

router.get('/providers', auth, listProviders);
router.post('/providers', auth, createProviderHandler);
router.get('/providers/status', auth, providerStatus);
router.get('/providers/:providerId', auth, getProvider);
router.patch('/providers/:providerId', auth, updateProviderHandler);
router.delete('/providers/:providerId', auth, deleteProviderHandler);
router.post('/providers/:providerId/activate', auth, activateProvider);
router.post('/providers/:providerId/test', auth, testProvider);
router.post('/providers/:providerId/test/verify', auth, verifyTestProvider);

// ===========================================================================
// Parameterized Routes (must be last — catch-all /:paymentId)
// ===========================================================================

router.get('/:paymentId', auth, getPayment);
router.get('/:paymentId/receipt', auth, getReceipt);

export default router;
