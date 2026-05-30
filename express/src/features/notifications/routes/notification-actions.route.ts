// External libs
import { Request, NextFunction, Response } from 'express';
import type { RequestHandler } from 'express';
import { z } from 'zod';

// Shared utilities
import { asyncHandler } from '@src/shared/utils/async-handler';
import { success } from '@src/shared/utils/responses';
import { validate } from '@src/shared/lib/validate';
import { UnauthorizedError, ValidationError, NotFoundError } from '@src/shared/errors';
import { logger } from '@src/shared/logger';
import { auth } from '@src/middleware/auth';
import { withRole } from '@utils/with-role';

// ---- Prisma

import { UserRole } from '@prisma/client';

// ---- Services

import { upsertPushToken } from '@src/features/notifications/services/upsertPushToken';
import {
  findUniqueNotification,
  updateNotificationStatus,
} from '@src/shared/services/notification';

// ---- Validators / Types

import {
  UpdateNotificationSchema,
  NotificationRouteParams,
} from '@src/shared/validators/notification';

// ---------------------------------------------------------------------------
// Local validation schemas
// ---------------------------------------------------------------------------

/** Schema for registering a push notification token (no user link). */
const RegisterPushTokenSchema = z.object({
  token: z.string(),
});

/** Schema for linking an existing push token to a user. */
const LinkNotificationSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

// ---------------------------------------------------------------------------
// POST /api/notifications/register
// Register (upsert) a push notification token without linking it to a user.
// The token can later be linked via the /link endpoint.
// Security: Public — no auth required.
// ---------------------------------------------------------------------------

export const postRegisterPushToken: RequestHandler[] = [
  // ---- Validate input

  validate({ body: RegisterPushTokenSchema }),

  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    // ---- Setup

    const traceId = (req.traceId as string) || '';
    logger.info({ traceId }, 'POST /api/notifications/register - Request started');

    // ---- Extract token

    const token = req.body?.token;
    if (!token) throw new ValidationError('Missing token');

    // ---- Persist / upsert push token

    // Creates a new push token record or updates the existing one identified
    // by the token string. No user association is established at this stage
    // so the token can be registered before the user is authenticated.
    const pushToken = await upsertPushToken(token);

    // ---- Log success & respond

    logger.info({ traceId, tokenId: pushToken.id }, 'POST /api/notifications/register - Success');
    return success(res, { data: pushToken });
  }),
];

// ---------------------------------------------------------------------------
// POST /api/notifications/link
// Link an existing push notification token to the currently authenticated
// user so that push notifications can be routed to this device.
// Security: Relies on req.userId from upstream auth middleware.
// ---------------------------------------------------------------------------

export const postLinkNotification: RequestHandler[] = [
  // ---- Validate input

  validate({ body: LinkNotificationSchema }),

  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    // ---- Setup

    const traceId = (req.traceId as string) || '';
    logger.info({ traceId }, 'POST /api/notifications/link - Request started');

    // ---- Authorize

    // Ensure the request has a userId set by the upstream auth middleware.
    const userId = req.userId;
    if (!userId) throw new UnauthorizedError('User ID is required');

    // ---- Validate token

    if (!req.body?.token) throw new ValidationError('Token is required');

    // ---- Link push token to user

    // Upsert the token and associate it with the authenticated user.
    const pushToken = await upsertPushToken(req.body.token, userId as string);

    // ---- Log success & respond

    logger.info({ traceId, tokenId: pushToken.id }, 'POST /api/notifications/link - Success');
    return success(res, { data: pushToken }, 201);
  }),
];

// ---------------------------------------------------------------------------
// PATCH /api/notifications/[notificationId]/status
// Mark a notification as read, received, or both.
// Security: auth + MEMBER role — user must own the notification.
// ---------------------------------------------------------------------------

export const patchNotificationStatus: RequestHandler[] = [
  // ---- Authenticate

  auth,

  // ---- Validate input

  validate({ body: UpdateNotificationSchema, params: NotificationRouteParams }),

  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    // ---- Setup

    const traceId = (req.traceId as string) || '';
    logger.info(
      { traceId },
      'PATCH /api/notifications/[notificationId]/status - Request started',
    );

    // ---- Authorize — require MEMBER role or higher

    // MEMBER role is the minimum permission level for modifying a
    // notification's status. Admins and higher roles are also allowed
    // via the withRole hierarchy.
    const user = await withRole(req, UserRole.MEMBER);

    // ---- Auth log

    logger.info(
      { traceId, userId: user.id },
      'PATCH /api/notifications/[notificationId]/status - User authorized',
    );

    // ---- Validate ownership

    const userId = req.userId as string;
    if (!userId) throw new UnauthorizedError('Unauthorized');

    // Confirm the notification exists and belongs to this user so that
    // users cannot modify another user's notifications.
    const isNotificaitonExist = await findUniqueNotification({
      where: { id: req.params.notificationId as string, userId },
    });
    if (!isNotificaitonExist) throw new NotFoundError('Notification not found.');

    // ---- Build update payload

    // Only set readAt / receivedAt timestamps when the corresponding boolean
    // flag is true. Setting them to null when the flag is not present allows
    // clients to clear a previously-set status.
    const payload = {
      isRead: req.body?.isRead,
      isReceived: req.body?.isReceived,
      readAt: req.body?.isRead ? new Date() : null,
      receivedAt: req.body?.isReceived ? new Date() : null,
    };

    // ---- Persist update

    const notification = await updateNotificationStatus({
      where: { id: req.params.notificationId as string },
      data: payload,
    });

    // ---- Log success & respond

    logger.info(
      { traceId, notificationId: req.params.notificationId },
      'PATCH /api/notifications/[notificationId]/status - Success',
    );
    return success(res, {
      data: notification,
      message: 'Successfully updated notification status',
    });
  }),
];
