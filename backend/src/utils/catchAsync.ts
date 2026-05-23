import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * @function catchAsync
 * @description Wraps an async Express route handler and forwards any thrown error
 * to Express's next(err) — eliminating try/catch boilerplate in every controller.
 *
 * @example
 *   router.get('/articles', catchAsync(async (req, res) => {
 *     const articles = await Article.find();
 *     res.json({ data: articles });
 *   }));
 */
export const catchAsync = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
};

/**
 * @function catchAsyncTyped
 * @description Typed variant for controllers that use custom request interfaces.
 *
 * @example
 *   import type { AuthRequest } from '../middleware/auth.middleware';
 *   export const getMe = catchAsyncTyped<AuthRequest>(async (req, res) => { ... });
 */
export const catchAsyncTyped = <TReq extends Request = Request>(
  fn: (req: TReq, res: Response, next: NextFunction) => Promise<void>
): ((req: TReq, res: Response, next: NextFunction) => void) => {
  return (req: TReq, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
};

/**
 * @function withTimeout
 * @description Wraps a promise with a configurable timeout. Throws AppError on expiry.
 *
 * @example
 *   const data = await withTimeout(fetchNews(), 10_000, 'News API');
 */
export const withTimeout = <T>(
  promise: Promise<T>,
  ms: number,
  label = 'Operation'
): Promise<T> => {
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`${label} timed out after ${ms}ms`));
    }, ms);
  });
  return Promise.race([promise, timeout]);
};

/**
 * @function retryAsync
 * @description Retries an async function up to `maxRetries` times with exponential backoff.
 *
 * @example
 *   const result = await retryAsync(() => openai.chat.completions.create(...), 3);
 */
export const retryAsync = async <T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelayMs = 500
): Promise<T> => {
  let lastError: Error = new Error('Unknown error');
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err as Error;
      if (attempt < maxRetries) {
        const delay = baseDelayMs * Math.pow(2, attempt);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  throw lastError;
};
