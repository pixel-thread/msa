import { withValidation } from '@src/shared/api';
import { upsertPushToken } from '@src/features/notifications/services/upsertPushToken';
import z from 'zod';
import { ValidationError } from '@src/shared/errors';
import { SuccessResponse } from '@src/shared/utils';
import { logger } from '@src/shared/logger/server';

const RegisterPushTokenSchema = z.object({
  token: z.string(),
});

export const POST = withValidation(
  { body: RegisterPushTokenSchema },
  async (_req, _ctx, { body, traceId }) => {
    logger.info({ traceId }, 'POST /api/notifications/register - Request started');

    const token = body?.token;

    if (!token) {
      throw new ValidationError('Missing token');
    }

    const pushToken = await upsertPushToken(token);

    logger.info({ traceId, tokenId: pushToken.id }, 'POST /api/notifications/register - Success');

    return SuccessResponse({ data: pushToken });
  },
);
