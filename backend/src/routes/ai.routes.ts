import { Router } from 'express';
import {
  chat,
  getDailyBriefing,
  getTrending,
  triggerBatchAnalysis,
  getUsage,
} from '../controllers/ai.controller';
import { protect, authorize, optionalAuth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { aiLimiter, adminLimiter } from '../middleware/rateLimiter.middleware';
import { chatMessageValidator } from '../validators/news.validators';

/**
 * @router /api/v1/ai
 *
 * POST /chat              — Conversational assistant (auth + AI rate limit)
 * GET  /briefing          — Personalized daily briefing (public/optional auth)
 * GET  /trending          — AI-extracted trending topics (public)
 * POST /analyze/batch     — Bulk analyze unanalyzed articles (admin)
 * GET  /usage             — Token usage + cost stats (admin)
 */
const router = Router();

router.post('/chat',            optionalAuth, aiLimiter, chatMessageValidator, validate, chat);
router.get( '/briefing',        optionalAuth, aiLimiter, getDailyBriefing);
router.get( '/trending',        aiLimiter, getTrending);

// Admin-only AI management
router.post('/analyze/batch',   protect, authorize('admin'), adminLimiter, triggerBatchAnalysis);
router.get( '/usage',           protect, authorize('admin'), getUsage);

export default router;
