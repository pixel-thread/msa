import { NextResponse } from 'next/server';

import type { ResponseMeta, SuccessEnvelope } from '@src/shared/types';

export function SuccessResponse<T>(
  { data, meta, message }: { data: T; meta?: ResponseMeta; message?: string },
  status: 200 | 201 | 204 = 200,
): NextResponse<SuccessEnvelope<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      meta,
      message,
      timestamp: new Date().toISOString(),
    },
    { status },
  );
}
