import { NextResponse } from 'next/server';
import { env } from '@src/env';
import { runAnonymizeCron } from '@src/features/cron/services';
import { logger } from '@src/shared/logger/server';

export async function GET(request: Request) {
  logger.info('GET /api/cron/anonymize - Request started');
  const authHeader = request.headers.get('authorization');

  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    logger.warn('GET /api/cron/anonymize - Unauthorized access attempt');
    return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  }

  try {
    const results = await runAnonymizeCron();

    const totalProcessed = results.reduce((sum, r) => sum + r.processed, 0);
    const totalFailed = results.reduce((sum, r) => sum + r.failed, 0);
    const processedAssociations = results.filter((r) => r.processed && !r.error).length;

    logger.info(
      {
        totalAssociations: results.length,
        processedAssociations,
        totalAnonymized: totalProcessed,
        totalFailed,
      },
      'GET /api/cron/anonymize - Anonymization completed',
    );

    return NextResponse.json({
      success: true,
      message: 'User anonymization completed',
      summary: {
        totalAssociations: results.length,
        processedAssociations,
        totalAnonymized: totalProcessed,
        totalFailed,
      },
      results,
    });
  } catch (error) {
    logger.error({ error }, 'GET /api/cron/anonymize - Unhandled error');
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
