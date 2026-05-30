// External libs
import { Router } from 'express';

// ---- Route handlers

import {
  postRegisterPushToken,
  postLinkNotification,
  patchNotificationStatus,
} from './notification-actions.route';

// ---------------------------------------------------------------------------
// Notifications router
//
// Aggregates all notification-related route handlers under a single Express
// Router so it can be mounted at /api/notifications.
// ---------------------------------------------------------------------------

const router: Router = Router();

// ---- POST  /api/notifications/register                 — Register a push token

router.post('/register', postRegisterPushToken);

// ---- POST  /api/notifications/link                     — Link a push token to the current user

router.post('/link', postLinkNotification);

// ---- PATCH /api/notifications/:notificationId/status   — Update read / received status

router.patch('/:notificationId/status', patchNotificationStatus);

export default router;
