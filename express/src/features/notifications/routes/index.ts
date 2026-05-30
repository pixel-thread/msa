import { Router } from 'express';
import {
  postRegisterPushToken,
  postLinkNotification,
  patchNotificationStatus,
} from './notification-actions.route';

const router: Router = Router();

router.post('/register', postRegisterPushToken);
router.post('/link', postLinkNotification);
router.patch('/:notificationId/status', patchNotificationStatus);

export default router;
