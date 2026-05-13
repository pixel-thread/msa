import { ZodError } from "zod";

import { env } from "@src/env";
import { AppError } from "./classes/base";
import { ValidationError } from "./classes/http-errors";
import { Prisma } from "@prisma/client";

/**
 * Type guard to check if an error is a Prisma-specific error
 */
export const isPrismaError = (
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

export const normalizeUnknownError = (error: unknown): AppError => {
  const isProd = env.NODE_ENV === "production";
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof ZodError) {
    return new ValidationError("Invalid input", error.issues);
  }

  if (isPrismaError(error)) {
    return new AppError(
      "DATABASE_ERROR",
      isProd ? "Database error" : error.message,
      500,
    );
  }

  const message =
    error instanceof Error ? error.message : "An unexpected error occurred";

  const displayMessage = isProd ? "Internal Server Error" : message;

  return new AppError("INTERNAL_ERROR", displayMessage, 500);
};
