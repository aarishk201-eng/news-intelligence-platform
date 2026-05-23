import { Router, Request, Response, NextFunction } from 'express';
import Article from '../models/Article.model';
import User from '../models/User.model';
import { sendSuccess } from '../utils/apiResponse';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.get('/overview', protect, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [totalArticles, totalUsers, trendingCount, breakingCount] = await Promise.all([
      Article.countDocuments(),
      User.countDocuments({ isActive: true }),
      Article.countDocuments({ isTrending: true }),
      Article.countDocuments({ isBreaking: true }),
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
      { $group: { _id: '$sentiment.label', count: { $sum: 1 } } },
    ]);

    sendSuccess(res, {
      data: { totalArticles, totalUsers, trendingCount, breakingCount, topSources, articlesByDay, sentimentDist },
    });
  } catch (err) { next(err); }
});

export default router;
