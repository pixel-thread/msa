// ---------------------------------------------------------------------------
// External libs
// ---------------------------------------------------------------------------
import { Router } from 'express';

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
import { auth } from '@src/middleware/auth';

// ---------------------------------------------------------------------------
// Route handlers
// ---------------------------------------------------------------------------
import {
  getPlansHandler,
  createPlanHandler,
  setDefaultPlanHandler,
  updatePlanHandler,
  deletePlanHandler,
} from './plans.route';
import { getMySubscriptionHandler } from './my-subscription.route';
import { postSubscribe } from './subscribe.route';
import { postUpgrade } from './upgrade.route';
import { postWaive } from './waive.route';
import { getSubscriptionPaymentsHandler } from './subscription-payments.route';

// ---- Router setup ------------------------------------------------------------

/** Subscriptions feature router — all routes require authentication. */
const router: Router = Router();

router.use(auth);

// ---- Plans -------------------------------------------------------------------

router.get('/plans', getPlansHandler);
router.post('/plans', createPlanHandler);
router.post('/plans/default', setDefaultPlanHandler);
router.patch('/plans/:planId', updatePlanHandler);
router.delete('/plans/:planId', deletePlanHandler);

// ---- My subscription ---------------------------------------------------------

router.get('/my', getMySubscriptionHandler);

// ---- Subscription actions ----------------------------------------------------

router.post('/subscribe', postSubscribe);
router.post('/upgrade', postUpgrade);
router.post('/waive', postWaive);

// ---- Payments ----------------------------------------------------------------

router.get('/:subscriptionId/payments', getSubscriptionPaymentsHandler);

export default router;
