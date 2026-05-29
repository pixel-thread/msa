import { getTraceId } from '@src/shared/utils';
import type { NextRequest } from 'next/server';

export interface TracingContext {
  traceId: string;
}

export const createTracingContext = (request: NextRequest): TracingContext => ({
  traceId: getTraceId(request),
});
