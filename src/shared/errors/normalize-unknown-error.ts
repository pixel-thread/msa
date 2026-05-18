import { ZodError } from "zod";
import { env } from "@src/env";
import { AppError } from "./classes/base";
import {
  NotFoundError,
  PaymentError,
  UnauthorizedError,
  ValidationError,
} from "./classes/http-errors";
import { Prisma } from "@prisma/client";
import { JWTClaimValidationFailed, JOSEError } from "jose/errors";

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

export const normalizeUnknownError = (error: unknown): AppError => {
  const isProd = env.NODE_ENV === "production";

  if (isJwtError(error) || error instanceof UnauthorizedError) {
    return new UnauthorizedError(error.message);
  }

  if (error instanceof NotFoundError) {
    return new NotFoundError(error.message);
  }

  if (error instanceof ZodError) {
    return new ValidationError("Invalid input", error.issues);
  }

  if (error instanceof PaymentError) {
    return new PaymentError(error.message, error.code, error.statusCode);
  }

  if (isPrismaError(error)) {
    return new AppError(
      "DATABASE_ERROR",
      isProd ? "Database error" : error.message,
      500,
    );
  }

  if (error instanceof AppError) {
    return error;
  }

  const message =
    error instanceof Error ? error.message : "An unexpected error occurred";

  const displayMessage = isProd ? "Internal Server Error" : message;

  return new AppError("INTERNAL_ERROR", displayMessage, 500);
};
