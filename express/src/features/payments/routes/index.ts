import { Router } from 'express';
import { auth } from '@src/middleware/auth';
import { listPayments } from './list-payments.route';
import { myPayments } from './my-payments.route';
import { paymentHistory } from './payment-history.route';
import { paymentStats } from './payment-stats.route';
import { getPayment } from './get-payment.route';
import { getReceipt } from './get-receipt.route';
import { createOrder } from './create-order.route';
import { verifyPayment } from './verify-payment.route';
import { webhook } from './webhook.route';
import { recordPayment } from './record-payment.route';
import { userPayments, userContributions } from './user-payments.route';
import {
  listContributions,
  generateContributions,
  waiveContributionHandler,
  getContribution,
} from './contributions.route';
import { collectionsReport } from './collections-report.route';
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

const router = Router();

// Static routes must come before :paymentId parameterized routes
router.get('/', auth, listPayments);
router.get('/my', auth, myPayments);
router.get('/history', auth, paymentHistory);
router.get('/stats', auth, paymentStats);

// Razorpay flow
router.post('/order', auth, createOrder);
router.post('/verify', auth, verifyPayment);
router.post('/webhook', webhook);
router.post('/record', auth, recordPayment);

// User-specific
router.get('/users/:userId', auth, userPayments);
router.get('/users/:userId/contributions', auth, userContributions);

// Contributions
router.get('/contributions', auth, listContributions);
router.post('/contributions', auth, generateContributions);
router.patch('/contributions', auth, waiveContributionHandler);
router.get('/contributions/:contributionId', auth, getContribution);

// Reports
router.get('/reports/collections', auth, collectionsReport);

// Providers
router.get('/providers', auth, listProviders);
router.post('/providers', auth, createProviderHandler);
router.get('/providers/status', auth, providerStatus);
router.get('/providers/:providerId', auth, getProvider);
router.patch('/providers/:providerId', auth, updateProviderHandler);
router.delete('/providers/:providerId', auth, deleteProviderHandler);
router.post('/providers/:providerId/activate', auth, activateProvider);
router.post('/providers/:providerId/test', auth, testProvider);
router.post('/providers/:providerId/test/verify', auth, verifyTestProvider);

// Parameterized routes (must be last)
router.get('/:paymentId', auth, getPayment);
router.get('/:paymentId/receipt', auth, getReceipt);

export default router;
