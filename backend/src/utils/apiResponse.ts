import { Response } from 'express';

// ─── Types ─────────────────────────────────────────────────────────────────────
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface SuccessOptions {
  statusCode?: number;
  message?: string;
  data?: unknown;
  meta?: PaginationMeta;
  [key: string]: unknown;
}

// ─── Standard envelope shape ───────────────────────────────────────────────────
//  { success, message, data, meta?, timestamp }

/**
 * @function sendSuccess
 * 200 OK with optional data and pagination meta.
 */
export const sendSuccess = (res: Response, options: SuccessOptions = {}): Response => {
  const { statusCode = 200, message = 'Success', data, meta, ...extra } = options;
  return res.status(statusCode).json({
    success: true,
    message,
    ...(data !== undefined && { data }),
    ...(meta && { meta }),
    ...extra,
    timestamp: new Date().toISOString(),
  });
};

/**
 * @function sendCreated
 * 201 Created shorthand.
 */
export const sendCreated = (
  res: Response,
  data: unknown,
  message = 'Created successfully'
): Response => sendSuccess(res, { statusCode: 201, message, data });

/**
 * @function sendNoContent
 * 204 No Content — for DELETE operations.
 */
export const sendNoContent = (res: Response): Response => res.status(204).send();

/**
 * @function sendPaginated
 * 200 with full pagination envelope. Automatically computes derived fields.
 */
export const sendPaginated = (
  res: Response,
  data: unknown[],
  total: number,
  page: number,
  limit: number,
  message = 'Data retrieved successfully'
): Response => {
  const totalPages = Math.ceil(total / limit);
  const meta: PaginationMeta = {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
  return sendSuccess(res, { message, data, meta });
};

/**
 * @function sendError
 * Standardized error envelope — normally called by the global error handler,
 * but exposed for edge cases (e.g. stream failures).
 */
export const sendError = (
  res: Response,
  statusCode: number,
  message: string,
  errors?: unknown[]
): Response => {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(errors && errors.length > 0 && { errors }),
    timestamp: new Date().toISOString(),
  });
};
