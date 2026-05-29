import { NextResponse } from 'next/server';
import { logger } from '@src/shared/logger/server';

export async function GET() {
  logger.info('GET /api/health - Request started');
  return NextResponse.json(
    {
      status: 'ok',
    },
    { status: 200 },
  );
}
