import { AppError } from './base';

export class BadRequestError extends AppError {
  constructor(message = 'Bad request', details?: unknown) {
    super('BAD_REQUEST', message, 400, details);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', details?: unknown) {
    super('VALIDATION_ERROR', message, 400, details);
  }
}

export class PayloadTooLargeError extends AppError {
  constructor(message = 'Payload to Large', details?: unknown) {
    super('PAYLOAD_TOO_LARGE', message, 413, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super('UNAUTHORIZED', message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access denied') {
    super('FORBIDDEN', message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super('NOT_FOUND', `${resource}`, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super('CONFLICT', message, 409);
  }
}

export class UnprocessableError extends AppError {
  constructor(message: string, details?: unknown) {
    super('UNPROCESSABLE', message, 422, details);
  }
}

export class InvalidJsonError extends AppError {
  constructor() {
    super('INVALID_JSON', 'Invalid request body', 400);
  }
}
export class TooManyRequestsError extends AppError {
  constructor(message = 'Too many requests', details?: unknown) {
    super('TOO_MANY_REQUESTS', message, 429, details);
  }
}

export class PaymentError extends Error {
  code: string;
  statusCode: number;

  constructor(message: string, code = 'PAYMENT_ERROR', statusCode = 400) {
    super(message);

    this.code = code;
    this.statusCode = statusCode;
  }
}

export class WebhookSignatureError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WebhookSignatureError';
  }
}
