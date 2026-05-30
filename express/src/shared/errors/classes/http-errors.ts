import { AppError } from './base';

/** Error for malformed or invalid client requests (400). */
export class BadRequestError extends AppError {
  constructor(message = 'Bad request', details?: unknown) {
    super('BAD_REQUEST', message, 400, details);
  }
}

/** Error for inputs that fail schema validation (400). */
export class ValidationError extends AppError {
  constructor(message = 'Validation failed', details?: unknown) {
    super('VALIDATION_ERROR', message, 400, details);
  }
}

/** Error for requests exceeding size limits (413). */
export class PayloadTooLargeError extends AppError {
  constructor(message = 'Payload to Large', details?: unknown) {
    super('PAYLOAD_TOO_LARGE', message, 413, details);
  }
}

/** Error for missing or invalid authentication credentials (401). */
export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super('UNAUTHORIZED', message, 401);
  }
}

/** Error for insufficient permissions to access a resource (403). */
export class ForbiddenError extends AppError {
  constructor(message = 'Access denied') {
    super('FORBIDDEN', message, 403);
  }
}

/** Error when a requested resource does not exist (404). */
export class NotFoundError extends AppError {
  constructor(resource: string) {
    super('NOT_FOUND', `${resource}`, 404);
  }
}

/** Error for duplicate or conflicting resource state (409). */
export class ConflictError extends AppError {
  constructor(message: string) {
    super('CONFLICT', message, 409);
  }
}

/** Error for semantically invalid payloads that cannot be processed (422). */
export class UnprocessableError extends AppError {
  constructor(message: string, details?: unknown) {
    super('UNPROCESSABLE', message, 422, details);
  }
}

/** Error for malformed JSON in request body (400). */
export class InvalidJsonError extends AppError {
  constructor() {
    super('INVALID_JSON', 'Invalid request body', 400);
  }
}

/** Error when rate-limit threshold is exceeded (429). */
export class TooManyRequestsError extends AppError {
  constructor(message = 'Too many requests', details?: unknown) {
    super('TOO_MANY_REQUESTS', message, 429, details);
  }
}

/** Error for payment-related failures. */
export class PaymentError extends Error {
  code: string;
  statusCode: number;

  constructor(message: string, code = 'PAYMENT_ERROR', statusCode = 400) {
    super(message);

    this.code = code;
    this.statusCode = statusCode;
  }
}

/** Error for invalid webhook signature verification. */
export class WebhookSignatureError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WebhookSignatureError';
  }
}
