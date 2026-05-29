import type { MiddlewareFn } from './chain';
import { normalizeUnknownError } from '../errors';
import { AppErrorResponse, getTraceId } from '../utils';
import { logger } from '../logger/server';
import { env } from '@src/env';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const randomBetween = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

export const withSleep: MiddlewareFn = async (req, next) => {
  try {
    if (env.NODE_ENV === 'development') {
      const delay = randomBetween(50, 10);
      logger.debug({ delayMs: delay }, 'Sleeping for random delay');
      await sleep(delay);
    }
    const response = await next(req);
    return response;
  } catch (error) {
    const traceId = getTraceId(req);
    const appError = normalizeUnknownError(error);
    return AppErrorResponse(appError, traceId);
  }
};
