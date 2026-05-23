import { Router } from 'express';
import {
  getArticles, getArticle, createArticle, updateArticle, deleteArticle,
  analyzeArticleById, toggleSaveArticle, getTrendingArticles, getBreakingNews, getNewsAnalytics,
  getSavedArticles,
} from '../controllers/news.controller';
import { protect, authorize, optionalAuth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  createArticleValidator, getArticlesValidator, articleIdValidator,
} from '../validators/news.validators';

/**
 * @router /api/v1/news
 *
 * GET    /             — List articles (public, optional auth for personalization)
 * GET    /trending     — Trending articles (public)
 * GET    /breaking     — Breaking news (public)
 * GET    /:id          — Single article (public, optional auth)
 * POST   /             — Create article (editor, admin)
 * PUT    /:id          — Update article (editor, admin)
 * DELETE /:id          — Delete article (admin only)
 * POST   /:id/analyze  — Trigger AI analysis (authenticated)
 * POST   /:id/save     — Toggle save (authenticated)
 */
const router = Router();

// ── Public routes ──────────────────────────────────────────────────────────────
router.get('/trending', getTrendingArticles);
router.get('/breaking', getBreakingNews);
router.get('/analytics', protect, authorize('admin', 'editor'), getNewsAnalytics);

router
  .route('/')
  .get(optionalAuth, getArticlesValidator, validate, getArticles)
  .post(protect, authorize('editor', 'admin'), createArticleValidator, validate, createArticle);

router
  .route('/:id')
  .get(optionalAuth, articleIdValidator, validate, getArticle)
  .put(protect, authorize('editor', 'admin'), articleIdValidator, validate, updateArticle)
  .delete(protect, authorize('admin'), articleIdValidator, validate, deleteArticle);

// ── Authenticated routes ───────────────────────────────────────────────────────
router.get('/saved',        protect, getSavedArticles);
router.post('/:id/analyze', protect, articleIdValidator, validate, analyzeArticleById);
router.post('/:id/save',    protect, articleIdValidator, validate, toggleSaveArticle);

export default router;
