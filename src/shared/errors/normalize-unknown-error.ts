import { ZodError } from "zod";

import { env } from "~/env";
import { AppError } from "./classes/base";
import { ValidationError } from "./classes/http-errors";

export const normalizeUnknownError = (error: unknown): AppError => {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof ZodError) {
    return new ValidationError("Invalid input", error.issues);
  }

  const message =
    error instanceof Error ? error.message : "An unexpected error occurred";

  const isProd = env.NODE_ENV === "production";
  const displayMessage = isProd ? "Internal Server Error" : message;

  return new AppError("INTERNAL_ERROR", displayMessage, 500);
};
