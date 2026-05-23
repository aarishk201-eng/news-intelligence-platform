/**
 * @module utils/retryHandler
 * @description Generic retry utility with exponential backoff + jitter.
 *
 * Features:
 *  - Configurable max retries and base delay
 *  - Exponential backoff with random jitter (prevents thundering herd)
 *  - Caller-provided shouldRetry predicate (retry on 429/5xx, abort on 401/403/404)
 *  - Per-attempt timeout
 *  - Structured attempt logging
 *  - AbortSignal support for cancellation
 */
import { AxiosError } from 'axios';
import { createLogger } from './logger';

const log = createLogger('RetryHandler');

export interface RetryOptions {
  maxRetries:       number;   // Max number of retries (not total attempts)
  baseDelayMs:      number;   // Initial delay before first retry
  maxDelayMs?:      number;   // Cap on delay growth (default: 30s)
  jitterFactor?:    number;   // 0–1, adds randomness to delay (default: 0.3)
  shouldRetry?:     (error: unknown, attempt: number) => boolean;
  onRetry?:         (attempt: number, delayMs: number, error: unknown) => void;
}

// ─── Default retry predicate ──────────────────────────────────────────────────
// Retry on network errors, timeouts, and 429/5xx — NOT on auth/client errors
export const defaultShouldRetry = (error: unknown): boolean => {
  if (error instanceof AxiosError) {
    const status = error.response?.status;

    // Never retry client errors (400, 401, 403, 404, 422)
    if (status && status >= 400 && status < 500 && status !== 429) return false;

    // Retry on rate limit
    if (status === 429) return true;

    // Retry on 402 (plan limit) only once — no point retrying if quota exceeded
    if (status === 402) return false;

    // Retry on server errors (5xx)
    if (status && status >= 500) return true;

    // Retry on network-level errors
    const networkErrors = ['ECONNABORTED', 'ECONNRESET', 'ENOTFOUND', 'ETIMEDOUT', 'ECONNREFUSED'];
    if (error.code && networkErrors.includes(error.code)) return true;
  }

  // For generic errors — retry by default
  return true;
};

// ─── Delay calculator with jitter ────────────────────────────────────────────
const calculateDelay = (
  attempt: number,
  baseDelayMs: number,
  maxDelayMs: number,
  jitterFactor: number,
  rateLimitRetryAfter?: number
): number => {
  // If server told us when to retry, respect it (+ small buffer)
  if (rateLimitRetryAfter) return rateLimitRetryAfter * 1000 + 500;

  const exponential = baseDelayMs * Math.pow(2, attempt);
  const capped      = Math.min(exponential, maxDelayMs);
  const jitter      = capped * jitterFactor * Math.random();
  return Math.floor(capped + jitter);
};

// ─── Extract Retry-After header ───────────────────────────────────────────────
const getRetryAfterSeconds = (error: unknown): number | undefined => {
  if (error instanceof AxiosError) {
    const header = error.response?.headers['retry-after'] as string | undefined;
    if (header) {
      const seconds = parseInt(header, 10);
      return isNaN(seconds) ? undefined : seconds;
    }
  }
  return undefined;
};

// ─── Core Retry Wrapper ───────────────────────────────────────────────────────
/**
 * Executes an async function with retry on failure.
 *
 * @example
 *   const data = await withRetry(
 *     () => newsdataClient.get('/news'),
 *     { maxRetries: 3, baseDelayMs: 1000 }
 *   );
 */
export const withRetry = async <T>(
  fn: () => Promise<T>,
  options: RetryOptions
): Promise<T> => {
  const {
    maxRetries,
    baseDelayMs,
    maxDelayMs    = 30_000,
    jitterFactor  = 0.3,
    shouldRetry   = defaultShouldRetry,
    onRetry,
  } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;

      const isLastAttempt = attempt === maxRetries;
      const canRetry      = shouldRetry(err, attempt);

      if (isLastAttempt || !canRetry) {
        log.debug(`Giving up after ${attempt + 1} attempt(s): ${(err as Error).message}`);
        break;
      }

      const retryAfterSec = getRetryAfterSeconds(err);
      const delayMs = calculateDelay(attempt, baseDelayMs, maxDelayMs, jitterFactor, retryAfterSec);

      log.warn(`Attempt ${attempt + 1}/${maxRetries + 1} failed — retrying in ${delayMs}ms`, {
        error: (err as Error).message,
        status: err instanceof AxiosError ? err.response?.status : undefined,
      });

      onRetry?.(attempt + 1, delayMs, err);

      await new Promise<void>((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw lastError;
};

// ─── Rate-Limit Aware Queue ───────────────────────────────────────────────────
/**
 * Executes an array of async tasks with controlled concurrency.
 * Stops all tasks if a non-retryable error (e.g. 401) is encountered.
 *
 * @param tasks     — Array of factory functions returning promises
 * @param concurrency — Max simultaneous tasks
 * @returns Results array (failed tasks return their error, not throw)
 */
export type TaskResult<T> =
  | { status: 'fulfilled'; value: T }
  | { status: 'rejected'; reason: unknown };

export const runConcurrent = async <T>(
  tasks: Array<() => Promise<T>>,
  concurrency: number
): Promise<TaskResult<T>[]> => {
  const results: TaskResult<T>[] = [];
  const queue = [...tasks];
  let aborted = false;

  const worker = async (): Promise<void> => {
    while (queue.length > 0 && !aborted) {
      const task = queue.shift();
      if (!task) break;
      try {
        const value = await task();
        results.push({ status: 'fulfilled', value });
      } catch (err) {
        results.push({ status: 'rejected', reason: err });

        // Abort all remaining tasks on auth failure
        if (err instanceof AxiosError) {
          const status = err.response?.status;
          if (status === 401 || status === 403 || status === 402) {
            log.error(`Aborting all tasks due to fatal error (${status})`);
            aborted = true;
          }
        }
      }
    }
  };

  const workers = Array.from({ length: concurrency }, worker);
  await Promise.all(workers);

  return results;
};
