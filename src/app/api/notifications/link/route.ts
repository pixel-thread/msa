import { withValidation } from '@src/shared/api';
import { upsertPushToken } from '@src/features/notifications/services/upsertPushToken';
import z from 'zod';
import { UnauthorizedError, ValidationError } from '@src/shared/errors';
import { SuccessResponse } from '@src/shared/utils';
import { logger } from '@src/shared/logger/server';

const LinkNotificationSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

export const POST = withValidation(
  { body: LinkNotificationSchema },
  async (req, _ctx, { body, traceId }) => {
    logger.info({ traceId }, 'POST /api/notifications/link - Request started');

    const userId = req.headers.get('x-user-id');

    if (!userId) {
      throw new UnauthorizedError('User ID is required');
    }

    if (!body?.token) {
      throw new ValidationError('Token is required');
    }

    const pushToken = await upsertPushToken(body.token, userId);

    logger.info({ traceId, tokenId: pushToken.id }, 'POST /api/notifications/link - Success');

    return SuccessResponse({ data: pushToken }, 201);
  },
);
