import { StatusCodes } from 'http-status-codes';

/**
 * @class AppError
 * @description Operational error class. Distinguishes expected business errors
 * from unexpected programmer errors — only operational errors get user-facing messages.
 *
 * Use factory methods for the most common HTTP error cases.
 *
 * @example
 *   throw AppError.notFound('Article');
 *   throw AppError.unauthorized('Invalid token');
 *   throw new AppError('Custom message', 409);
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly status: 'fail' | 'error';
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.status = statusCode >= 500 ? 'error' : 'fail';
    this.isOperational = isOperational;

    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  // ─── Factory Methods ─────────────────────────────────────────────────────────

  /** 400 — Bad input that the client sent */
  static badRequest(message = 'Bad request'): AppError {
    return new AppError(message, StatusCodes.BAD_REQUEST);
  }

  /** 401 — Unauthenticated */
  static unauthorized(message = 'Authentication required'): AppError {
    return new AppError(message, StatusCodes.UNAUTHORIZED);
  }

  /** 403 — Authenticated but not allowed */
  static forbidden(message = 'You do not have permission to perform this action'): AppError {
    return new AppError(message, StatusCodes.FORBIDDEN);
  }

  /** 404 — Resource not found */
  static notFound(resource = 'Resource'): AppError {
    return new AppError(`${resource} not found`, StatusCodes.NOT_FOUND);
  }

  /** 409 — Conflict (e.g. duplicate email) */
  static conflict(message = 'Resource already exists'): AppError {
    return new AppError(message, StatusCodes.CONFLICT);
  }

  /** 422 — Validation failed */
  static unprocessable(message = 'Validation failed'): AppError {
    return new AppError(message, StatusCodes.UNPROCESSABLE_ENTITY);
  }

  /** 429 — Rate limit exceeded */
  static tooManyRequests(message = 'Too many requests. Please slow down.'): AppError {
    return new AppError(message, StatusCodes.TOO_MANY_REQUESTS);
  }

  /** 503 — External service (OpenAI, DB) temporarily unavailable */
  static serviceUnavailable(service = 'Service'): AppError {
    return new AppError(`${service} is temporarily unavailable. Please try again.`, StatusCodes.SERVICE_UNAVAILABLE);
  }

  /** 500 — Internal, non-operational programmer error */
  static internal(message = 'Internal server error'): AppError {
    return new AppError(message, StatusCodes.INTERNAL_SERVER_ERROR, false);
  }
}
