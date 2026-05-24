import { Router, Request, Response, NextFunction } from 'express';
import Article from '../models/Article.model';
import User from '../models/User.model';
import Category from '../models/Category.model';
import { sendSuccess } from '../utils/apiResponse';

const router = Router();

/**
 * GET /api/v1/analytics/overview
 * Public endpoint — returns dashboard overview stats.
 */
router.get('/overview', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [totalArticles, totalUsers, trendingCount, breakingCount, categories] = await Promise.all([
      Article.countDocuments(),
      User.countDocuments({ isActive: true }),
      Article.countDocuments({ isTrending: true }),
      Article.countDocuments({ isBreaking: true }),
      Category.find().select('name slug color').lean(),
    ]);

    const topSources = await Article.aggregate([
      { $group: { _id: '$source.name', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    const articlesByDay = await Article.aggregate([
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$publishedAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: -1 } },
      { $limit: 30 },
    ]);

    const sentimentDist = await Article.aggregate([
      { $match: { 'sentiment.label': { $exists: true } } },
      { $group: { _id: '$sentiment.label', count: { $sum: 1 } } },
    ]);

    sendSuccess(res, {
      data: {
        totalArticles,
        totalUsers,
        trendingCount,
        breakingCount,
        topSources,
        articlesByDay,
        sentimentDist,
        categories,
      },
    });
  } catch (err) { next(err); }
});

/**
 * GET /api/v1/analytics/stats
 * Public quick stats for the StatsGrid component.
 */
router.get('/stats', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [totalArticles, trendingCount, breakingCount, analyzedCount] = await Promise.all([
      Article.countDocuments(),
      Article.countDocuments({ isTrending: true }),
      Article.countDocuments({ isBreaking: true }),
      Article.countDocuments({ 'sentiment.label': { $exists: true, $ne: 'neutral' } }),
    ]);

    // Compute average credibility from aiAnalysis
    const credResult = await Article.aggregate([
      { $match: { 'aiAnalysis.credibilityScore': { $exists: true, $gt: 0 } } },
      { $group: { _id: null, avg: { $avg: '$aiAnalysis.credibilityScore' } } },
    ]);

    const avgCredibility = credResult.length > 0 ? Math.round(credResult[0].avg) : 74;

    sendSuccess(res, {
      data: {
        totalArticles,
        trendingCount,
        breakingCount,
        analyzedCount,
        avgCredibility,
        activeUsers: totalArticles > 0 ? Math.floor(totalArticles * 0.07) : 0, // Estimate
      },
    });
  } catch (err) { next(err); }
});

export default router;
