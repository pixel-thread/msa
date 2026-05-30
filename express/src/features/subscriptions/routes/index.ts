import { Router } from 'express';
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

const router = Router();

router.get('/plans', getPlansHandler);
router.post('/plans', createPlanHandler);
router.post('/plans/default', setDefaultPlanHandler);
router.patch('/plans/:planId', updatePlanHandler);
router.delete('/plans/:planId', deletePlanHandler);
router.get('/my', getMySubscriptionHandler);
router.post('/subscribe', postSubscribe);
router.post('/upgrade', postUpgrade);
router.post('/waive', postWaive);
router.get('/:subscriptionId/payments', getSubscriptionPaymentsHandler);

export default router;
