import { NextResponse } from 'next/server';
import { openApiSpec } from '@feature/swagger';
import { logger } from '@src/shared/logger/server';

export const GET = () => {
  logger.info('GET /api/docs - Request started');
  return NextResponse.json(openApiSpec);
};

export const dynamic = 'force-dynamic';
