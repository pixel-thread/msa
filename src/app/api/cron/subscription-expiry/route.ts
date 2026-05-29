import { NextResponse } from 'next/server';
import { env } from '@src/env';
import { runSubscriptionExpiryCron } from '@src/features/cron/services';
import { logger } from '@src/shared/logger/server';

export async function GET(request: Request) {
  logger.info('GET /api/cron/subscription-expiry - Request started');
  const authHeader = request.headers.get('authorization');

  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    logger.warn('GET /api/cron/subscription-expiry - Unauthorized access attempt');
    return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  }

  try {
    const results = await runSubscriptionExpiryCron();

    const totalExpired = results.reduce((sum, r) => sum + r.expired, 0);
    const totalFailed = results.reduce((sum, r) => sum + r.failed, 0);
    const processedAssociations = results.filter((r) => r.expired > 0 || !r.error).length;

    logger.info(
      {
        totalAssociations: results.length,
        processedAssociations,
        totalExpired,
        totalFailed,
      },
      'GET /api/cron/subscription-expiry - Subscription expiry check completed',
    );

    return NextResponse.json({
      success: true,
      message: 'Subscription expiry check completed',
      summary: {
        totalAssociations: results.length,
        processedAssociations,
        totalExpired,
        totalFailed,
      },
      results,
    });
  } catch (error) {
    logger.error(
      {
        error,
      },
      'GET /api/cron/subscription-expiry - Unhandled error',
    );
    return NextResponse.json(
      {
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
