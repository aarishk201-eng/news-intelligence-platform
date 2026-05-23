import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { JsonWebTokenError, TokenExpiredError, NotBeforeError } from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';
import { env } from '../config/env';

// ─── Error Normalizers ─────────────────────────────────────────────────────────

const handleCastError = (err: mongoose.Error.CastError): AppError =>
  AppError.badRequest(`Invalid value "${err.value as string}" for field "${err.path}"`);

const handleValidationError = (err: mongoose.Error.ValidationError): AppError => {
  const messages = Object.values(err.errors)
    .map((e) => e.message)
    .join('. ');
  return AppError.unprocessable(`Validation failed: ${messages}`);
};

const handleDuplicateKeyError = (
  err: Error & { keyValue?: Record<string, unknown>; code?: number }
): AppError => {
  const field  = Object.keys(err.keyValue ?? {}).join(', ');
  const value  = Object.values(err.keyValue ?? {}).join(', ');
  return AppError.conflict(
    `Duplicate value "${value}" for field "${field}". Please use a different value.`
  );
};

const handleJwtError  = (): AppError => AppError.unauthorized('Invalid token. Please log in again.');
const handleJwtExpiry = (): AppError => AppError.unauthorized('Your session has expired. Please log in again.');

// ─── Error Response Builder ────────────────────────────────────────────────────

interface ErrorResponseBody {
  success: false;
  status: string;
  message: string;
  requestId?: string;
  stack?: string;
  errors?: unknown[];
  timestamp: string;
}

const buildErrorResponse = (
  err: AppError,
  req: Request,
  isDev: boolean
): ErrorResponseBody => {
  const base: ErrorResponseBody = {
    success:   false,
    status:    err.status,
    message:   err.isOperational ? err.message : 'Something went wrong. Please try again later.',
    requestId: req.headers['x-request-id'] as string | undefined,
    timestamp: new Date().toISOString(),
  };

  if (isDev) {
    base.stack   = err.stack;
    base.message = err.message; // Show raw message in dev even for non-operational
  }

  return base;
};

// ─── Global Error Handler ──────────────────────────────────────────────────────
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction // Must have 4 params for Express to recognize as error handler
): void => {
  // Normalize to AppError
  let error: AppError;

  if (err instanceof AppError) {
    error = err;
  } else if (err instanceof mongoose.Error.CastError) {
    error = handleCastError(err);
  } else if (err instanceof mongoose.Error.ValidationError) {
    error = handleValidationError(err);
  } else if ((err as { code?: number }).code === 11000) {
    error = handleDuplicateKeyError(err as Error & { keyValue?: Record<string, unknown>; code?: number });
  } else if (err instanceof TokenExpiredError) {
    error = handleJwtExpiry();
  } else if (err instanceof JsonWebTokenError || err instanceof NotBeforeError) {
    error = handleJwtError();
  } else {
    // Unknown / programmer error — log with full details, NEVER expose internals to client
    error = new AppError(
      'An unexpected error occurred. Our team has been notified.',
      StatusCodes.INTERNAL_SERVER_ERROR,
      false
    );
  }

  // ── Logging ──────────────────────────────────────────────────────────────
  const logMeta = {
    statusCode: error.statusCode,
    path:       req.path,
    method:     req.method,
    requestId:  req.headers['x-request-id'] as string,
    userId:     (req as { user?: { _id?: unknown } }).user?._id?.toString(),
    ip:         req.ip,
  };

  if (!error.isOperational) {
    logger.error(`💥 UNHANDLED ERROR: ${error.message}`, { ...logMeta, stack: error.stack });
  } else if (error.statusCode >= 500) {
    logger.error(`Server error: ${error.message}`, logMeta);
  } else if (error.statusCode >= 400) {
    logger.warn(`Client error ${error.statusCode}: ${error.message}`, logMeta);
  }

  // ── Response ─────────────────────────────────────────────────────────────
  const isDev = !env.IS_PRODUCTION;
  res.status(error.statusCode).json(buildErrorResponse(error, req, isDev));
};
