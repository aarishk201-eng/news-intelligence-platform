import { Router, Request, Response, NextFunction } from 'express';
import Article from '../models/Article.model';
import { sendSuccess } from '../utils/apiResponse';

const router = Router();

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q, limit = '10' } = req.query as { q?: string; limit?: string };
    if (!q) { sendSuccess(res, { data: [], message: 'Query required' }); return; }

    const results = await Article.find(
      { $text: { $search: q }, language: 'en' },
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' }, publishedAt: -1 })
      .limit(parseInt(limit, 10))
      .populate('category', 'name slug')
      .lean();

    sendSuccess(res, { data: results, message: `${results.length} results found` });
  } catch (err) { next(err); }
});

export default router;
