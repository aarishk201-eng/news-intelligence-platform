import { Router, Request, Response } from 'express';
import { protect, authorize } from '../middleware/auth.middleware';
import { sendSuccess } from '../utils/apiResponse';
import { catchAsync } from '../utils/catchAsync';
import { newsIngestionService } from '../services/newsIngestion.service';
import { adminLimiter } from '../middleware/rateLimiter.middleware';
import { AppError } from '../utils/AppError';
import { env } from '../config/env';

/**
 * @router /api/v1/feeds
 *
 * POST /ingest           — Manually trigger full ingestion (admin)
 * POST /ingest/newsdata  — Trigger NewsData.io only (admin)
 * GET  /status           — Ingestion service status (admin)
 */
const router = Router();

// ── POST /feeds/ingest — Full ingestion (NewsData.io + RSS) ──────────────────
router.post(
  '/ingest',
  protect,
  authorize('admin'),
  adminLimiter,
  catchAsync(async (_req: Request, res: Response) => {
    if (newsIngestionService.running) {
      throw AppError.conflict('Ingestion is already running. Please wait for it to complete.');
    }

    // Fire-and-forget for long-running ingestion (responds immediately)
    void newsIngestionService.fetchAndStoreNews();

    sendSuccess(res, {
      message: 'News ingestion started in background',
      data: { startedAt: new Date().toISOString() },
    });
  })
);

// ── POST /feeds/ingest/sync — Synchronous ingestion (waits for completion) ───
router.post(
  '/ingest/sync',
  protect,
  authorize('admin'),
  adminLimiter,
  catchAsync(async (_req: Request, res: Response) => {
    if (newsIngestionService.running) {
      throw AppError.conflict('Ingestion already running.');
    }

    const result = await newsIngestionService.fetchAndStoreNews();
    sendSuccess(res, {
      message: 'News ingestion completed',
      data: result,
    });
  })
);

// ── GET /feeds/status ─────────────────────────────────────────────────────────
router.get(
  '/status',
  protect,
  authorize('admin'),
  catchAsync(async (_req: Request, res: Response) => {
    sendSuccess(res, {
      data: {
        isRunning:        newsIngestionService.running,
        cronExpression:   env.NEWS_INGEST_CRON,
        cronEnabled:      env.ENABLE_CRON,
        newsdataConfigured: !!env.NEWSDATA_API_KEY,
        targetArticles:   env.NEWSDATA_TARGET_COUNT,
        concurrency:      env.NEWSDATA_CONCURRENCY,
      },
    });
  })
);

export default router;
