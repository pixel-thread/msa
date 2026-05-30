import { ZodError } from 'zod';
import { env } from '@src/env';
import { AppError } from './classes/base';
import {
  BadRequestError,
  NotFoundError,
  PaymentError,
  UnauthorizedError,
  ValidationError,
} from './classes/http-errors';
import { Prisma } from '@prisma/client';
import { JWTClaimValidationFailed, JOSEError } from 'jose/errors';
import { logger } from '../logger/server';

/**
 * Type guard to check if an error is a Prisma-specific error
 */
const isPrismaError = (
  error: unknown,
): error is
  | Prisma.PrismaClientKnownRequestError
  | Prisma.PrismaClientUnknownRequestError
  | Prisma.PrismaClientValidationError
  | Prisma.PrismaClientInitializationError => {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError ||
    error instanceof Prisma.PrismaClientUnknownRequestError ||
    error instanceof Prisma.PrismaClientValidationError ||
    error instanceof Prisma.PrismaClientInitializationError
  );
};

const isJwtError = (error: unknown): error is JWTClaimValidationFailed => {
  return error instanceof JOSEError;
};

export function isSupabaseStorageError(error: unknown) {
  if (typeof error !== 'object' || error === null) return false;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const err = error as any;

  return (
    err.name === 'StorageError' ||
    err.name === 'StorageUnknownError' ||
    typeof err.statusCode === 'string' ||
    typeof err.error?.message === 'string'
  );
}

export const normalizeUnknownError = (error: unknown, traceId?: string): AppError => {
  const isProd = env.NODE_ENV === 'production';

  if (isJwtError(error) || error instanceof UnauthorizedError) {
    logger.error({ ...error, traceId }, error.message);
    return new UnauthorizedError(error.message);
  }

  if (error instanceof NotFoundError) {
    logger.error({ ...error, traceId }, error.message);
    return new NotFoundError(error.message);
  }

  if (isSupabaseStorageError(error)) {
    logger.error({ error, traceId }, 'Supabase storage error');
    return new BadRequestError('Supabase storage error');
  }

  if (error instanceof ZodError) {
    logger.info({ ...error, traceId }, error.message);
    return new ValidationError(error.message, error.issues);
  }

  if (error instanceof PaymentError) {
    logger.error({ ...error, traceId }, error.message);
    return new PaymentError(error.message, error.code, error.statusCode);
  }

  if (isPrismaError(error)) {
    logger.error({ error, traceId }, 'Database error');
    return new AppError('DATABASE_ERROR', isProd ? 'Database error' : error.message, 500);
  }

  if (error instanceof AppError) {
    logger.error({ error, traceId }, error.message);
    return error;
  }

  const message = error instanceof Error ? error.message : 'An unexpected error occurred';

  const displayMessage = isProd ? 'Internal Server Error' : message;

  logger.error({ error, traceId }, displayMessage);
  return new AppError('INTERNAL_ERROR', displayMessage, 500);
};
