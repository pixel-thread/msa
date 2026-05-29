import type { MiddlewareFn } from './chain';
import { PayloadTooLargeError } from '@src/shared/errors';

const MAX_BODY_SIZE = 5 * 1024 * 1024; // 5MB

export const withRequestSizeLimit: MiddlewareFn = async (request, next) => {
  const contentLength = request.headers.get('content-length');

  if (contentLength && Number(contentLength) > MAX_BODY_SIZE) {
    throw new PayloadTooLargeError('Request body too large');
  }

  return next(request);
};
