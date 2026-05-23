import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.middleware';
import { catchAsyncTyped }    from '../utils/catchAsync';
import { sendSuccess }        from '../utils/apiResponse';
import { AppError }           from '../utils/AppError';
import { adminLimiter }       from '../middleware/rateLimiter.middleware';
import { scheduler }          from '../jobs';
import JobRun                 from '../models/JobRun.model';
import { newsIngestionService } from '../services/newsIngestion.service';
import { env }                from '../config/env';
import type { AuthRequest }   from '../types';

/**
 * @router /api/v1/jobs
 *
 * GET  /              — List all jobs + live status
 * GET  /history       — Execution history (paginated)
 * POST /:name/trigger — Manually trigger a job
 * POST /:name/reset   — Reset circuit breaker
 * GET  /:name/history — History for specific job
 */
const router = Router();

// All routes require admin
router.use(protect, authorize('admin'));

// ── GET /jobs ──────────────────────────────────────────────────────────────────
router.get('/', catchAsyncTyped<AuthRequest>(async (_req, res) => {
  const snapshot = scheduler.getStatus();
  sendSuccess(res, {
    data: {
      jobs:      snapshot,
      cronEnabled: env.ENABLE_CRON,
    },
  });
}));

// ── GET /jobs/history ─────────────────────────────────────────────────────────
router.get('/history', catchAsyncTyped<AuthRequest>(async (req, res) => {
  const page   = Math.max(1, parseInt(String(req.query.page  ?? 1), 10));
  const limit  = Math.min(100, parseInt(String(req.query.limit ?? 20), 10));
  const status = req.query.status as string | undefined;
  const job    = req.query.job    as string | undefined;

  const filter: Record<string, unknown> = {};
  if (status) filter.status  = status;
  if (job)    filter.jobName = job;

  const [runs, total] = await Promise.all([
    JobRun.find(filter)
      .sort({ startedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    JobRun.countDocuments(filter),
  ]);

  sendSuccess(res, {
    data: runs,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit), hasNextPage: page < Math.ceil(total / limit), hasPrevPage: page > 1 },
  });
}));

// ── GET /jobs/:name/history ───────────────────────────────────────────────────
router.get('/:name/history', catchAsyncTyped<AuthRequest>(async (req, res) => {
  const { name } = req.params;
  const limit = Math.min(50, parseInt(String(req.query.limit ?? 20), 10));

  const runs = await JobRun.find({ jobName: name })
    .sort({ startedAt: -1 })
    .limit(limit)
    .lean();

  // Compute aggregate stats
  const success  = runs.filter((r) => r.status === 'success').length;
  const failed   = runs.filter((r) => r.status === 'failed').length;
  const avgDuration = runs
    .filter((r) => r.durationMs)
    .reduce((sum, r, _, arr) => sum + (r.durationMs ?? 0) / arr.length, 0);

  sendSuccess(res, {
    data: {
      runs,
      stats: {
        total: runs.length,
        success,
        failed,
        successRate: runs.length > 0 ? Math.round((success / runs.length) * 100) : 0,
        avgDurationMs: Math.round(avgDuration),
      },
    },
  });
}));

// ── POST /jobs/:name/trigger ───────────────────────────────────────────────────
router.post('/:name/trigger', adminLimiter, catchAsyncTyped<AuthRequest>(async (req, res) => {
  const { name } = req.params;

  const snapshot = scheduler.getStatus();
  const job      = snapshot.find((j) => j.name === name);
  if (!job) throw AppError.notFound(`Job "${name}"`);
  if (job.isRunning) throw AppError.conflict(`Job "${name}" is already running`);

  // Fire-and-forget for long jobs
  void scheduler.trigger(name);

  sendSuccess(res, {
    message: `Job "${name}" triggered`,
    data:    { triggeredAt: new Date().toISOString(), async: true },
  });
}));

// ── POST /jobs/:name/reset ─────────────────────────────────────────────────────
router.post('/:name/reset', catchAsyncTyped<AuthRequest>(async (req, res) => {
  const { name } = req.params;
  scheduler.resetCircuit(name);
  sendSuccess(res, {
    message: `Circuit breaker reset for job "${name}"`,
    data:    { name, resetAt: new Date().toISOString() },
  });
}));

// ── POST /feeds/ingest/sync (kept for backward compat) ────────────────────────
router.post('/ingest', adminLimiter, catchAsyncTyped<AuthRequest>(async (_req, res) => {
  if (newsIngestionService.running) throw AppError.conflict('Ingestion already running');
  void newsIngestionService.fetchAndStoreNews();
  sendSuccess(res, { message: 'Ingestion started', data: { startedAt: new Date().toISOString() } });
}));

export default router;
