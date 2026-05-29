import { NextResponse } from 'next/server';

import type { ErrorEnvelope } from '@src/shared/types';

interface ErrorResponseOptions {
  message: string;
  status: number;
  code: string;
  traceId?: string;
  details?: unknown;
}

export function ErrorResponse({
  message,
  status,
  code,
  traceId,
  details,
}: ErrorResponseOptions): NextResponse<ErrorEnvelope> {
  const finalTraceId = traceId ?? crypto.randomUUID();

  return NextResponse.json(
    {
      success: false,
      message: message,
      error: {
        code,
        message,
        details,
        traceId: finalTraceId,
      },
      timestamp: new Date().toISOString(),
    },
    {
      status,
      headers: {
        'x-trace-id': finalTraceId,
      },
    },
  );
}
