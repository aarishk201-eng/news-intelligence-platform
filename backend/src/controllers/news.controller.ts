
import Article from '../models/Article.model';
import { AppError } from '../utils/AppError';
import { catchAsyncTyped } from '../utils/catchAsync';
import { ApiFeatures } from '../utils/ApiFeatures';
import { sendSuccess, sendCreated, sendNoContent, sendPaginated } from '../utils/apiResponse';
import { cacheGet, cacheSet, cacheDel, cacheFlushPattern } from '../config/redis';
import { analyzeArticle } from '../services/ai.service';
import type { AuthRequest, ArticleQueryString } from '../types';
import { createLogger } from '../utils/logger';
import { IArticle } from '../models/Article.model';

const log = createLogger('NewsController');

// ─── GET /news ─────────────────────────────────────────────────────────────────
export const getArticles = catchAsyncTyped<AuthRequest>(async (req, res) => {
  const qs = { ...req.query } as ArticleQueryString;

  // Custom filter mapping
  if (req.query.keyword) {
    qs.tags = { $in: [req.query.keyword] } as any;
    delete qs.keyword;
  }
  if (req.query.sentiment) {
    qs['sentiment.label'] = req.query.sentiment as string;
    delete qs.sentiment;
  }

  const cacheKey = `articles:${JSON.stringify(qs)}`;
  const cached = await cacheGet<{ data: IArticle[]; total: number }>(cacheKey);
  if (cached) {
    const features = new ApiFeatures(Article.find(), qs);
    sendPaginated(res, cached.data, cached.total, features.currentPage, features.currentLimit);
    return;
  }

  const features = new ApiFeatures(Article.find(), qs)
    .search()
    .filter()
    .sort()
    .limitFields()
    .paginate()
    .lean(); // Skip Mongoose hydration — 3-5x faster reads

  // Apply default projection if no ?fields= specified — skip heavy content/meta fields
  if (!qs.fields) {
    features.query = features.query.select(
      'title slug description source publishedAt media tags sentiment aiAnalysis.summary aiAnalysis.keyInsights aiAnalysis.readingTime category isBreaking isTrending engagement.views'
    ) as any;
  }

  // Populate category after building query
  features.query = features.query.populate('category', 'name slug color icon') as any;

  const [articles, total] = await Promise.all([
    features.query.lean() as any,
    features.countQuery,
  ]);

  await cacheSet(cacheKey, { data: articles, total }, 120);

  const p = features.currentPage;
  const l = features.currentLimit;
  sendPaginated(res, articles, total, p, l);
});

// ─── GET /news/analytics ───────────────────────────────────────────────────────
export const getNewsAnalytics = catchAsyncTyped<AuthRequest>(async (_req, res) => {
  const cacheKey = 'articles:analytics';
  const cached = await cacheGet(cacheKey);
  if (cached) {
    sendSuccess(res, { data: cached });
    return;
  }

  const [totalArticles, topCategories, sentimentDist, topKeywords, topSources] = await Promise.all([
    Article.countDocuments({ status: 'published' }),
    Article.aggregate([
      { $match: { status: 'published' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'catDetails' } },
      { $unwind: '$catDetails' },
      { $project: { _id: 0, category: '$catDetails.name', count: 1 } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]),
    Article.aggregate([
      { $match: { status: 'published' } },
      { $group: { _id: '$sentiment.label', count: { $sum: 1 } } },
      { $project: { _id: 0, label: '$_id', count: 1 } }
    ]),
    Article.aggregate([
      { $match: { status: 'published' } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $project: { _id: 0, keyword: '$_id', count: 1 } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]),
    Article.aggregate([
      { $match: { status: 'published' } },
      { $group: {
          _id: '$source.name',
          count: { $sum: 1 },
          trust: { $avg: '$aiAnalysis.credibilityScore' },
          category: { $first: '$category' },
          isVerified: { $first: '$source.isVerified' }
      }},
      { $lookup: { from: 'categories', localField: 'category', foreignField: '_id', as: 'catDetails' } },
      { $unwind: { path: '$catDetails', preserveNullAndEmptyArrays: true } },
      { $project: {
          _id: 0,
          name: '$_id',
          count: 1,
          trust: { $ifNull: [{ $round: ['$trust', 0] }, 85] },
          category: { $ifNull: ['$catDetails.name', 'Global News'] },
          status: { $cond: [{ $eq: ['$isVerified', true] }, 'Verified', 'Active'] }
      }},
      { $sort: { count: -1 } },
      { $limit: 15 }
    ])
  ]);

  const result = {
    totalArticles,
    topCategories,
    sentimentDist,
    topKeywords,
    topSources
  };

  await cacheSet(cacheKey, result, 300); // Cache for 5 mins
  sendSuccess(res, { data: result, message: 'News analytics retrieved' });
});

// ─── GET /news/:id ─────────────────────────────────────────────────────────────
export const getArticle = catchAsyncTyped<AuthRequest>(async (req, res, next) => {
  const { id } = req.params;
  const cacheKey = `article:${id}`;
  const cached = await cacheGet(cacheKey);
  if (cached) {
    sendSuccess(res, { data: cached });
    return;
  }

  // Support lookup by _id OR slug
  const article = await Article.findOne({ $or: [{ _id: id }, { slug: id }] })
    .populate('category', 'name slug color icon')
    .populate('relatedArticles', 'title slug urlToImage publishedAt source sentiment');

  if (!article) return next(AppError.notFound('Article'));

  // Increment view count (fire-and-forget)
  void Article.findByIdAndUpdate(article._id, { $inc: { 'engagement.views': 1 } });

  await cacheSet(cacheKey, article.toJSON(), 300);
  sendSuccess(res, { data: article });
});

// ─── POST /news (admin/editor only) ───────────────────────────────────────────
export const createArticle = catchAsyncTyped<AuthRequest>(async (req, res, next) => {
  // Check for duplicate URL
  const existing = await Article.findOne({ url: (req.body as { url: string }).url });
  if (existing) return next(AppError.conflict('An article with this URL already exists'));

  const article = await Article.create({ ...(req.body as Record<string, unknown>) });
  await cacheFlushPattern('articles:*');

  log.info(`Article created: ${article._id.toString()} by user ${req.user?._id.toString() ?? 'unknown'}`);
  sendCreated(res, article, 'Article created successfully');
});

// ─── PUT /news/:id ─────────────────────────────────────────────────────────────
export const updateArticle = catchAsyncTyped<AuthRequest>(async (req, res, next) => {
  const article = await Article.findByIdAndUpdate(
    req.params.id,
    { ...(req.body as Record<string, unknown>) },
    { new: true, runValidators: true }
  ).populate('category', 'name slug');

  if (!article) return next(AppError.notFound('Article'));

  await Promise.all([cacheDel(`article:${req.params.id}`), cacheFlushPattern('articles:*')]);
  sendSuccess(res, { data: article, message: 'Article updated successfully' });
});

// ─── DELETE /news/:id ─────────────────────────────────────────────────────────
export const deleteArticle = catchAsyncTyped<AuthRequest>(async (req, res, next) => {
  const article = await Article.findByIdAndDelete(req.params.id);
  if (!article) return next(AppError.notFound('Article'));

  await Promise.all([cacheDel(`article:${req.params.id}`), cacheFlushPattern('articles:*')]);
  log.info(`Article deleted: ${req.params.id} by ${req.user?._id.toString() ?? 'unknown'}`);
  sendNoContent(res);
});

// ─── POST /news/:id/analyze ────────────────────────────────────────────────────
export const analyzeArticleById = catchAsyncTyped<AuthRequest>(async (req, res, next) => {
  const article = await Article.findById(req.params.id);
  if (!article) return next(AppError.notFound('Article'));

  // Return cached analysis if it exists and is recent (< 24h)
  if (article.aiAnalysis?.analyzedAt) {
    const ageHours = (Date.now() - new Date(article.aiAnalysis.analyzedAt).getTime()) / 3_600_000;
    if (ageHours < 24) {
      sendSuccess(res, { data: article.aiAnalysis, message: 'Using cached AI analysis' });
      return;
    }
  }

  const analysis = await analyzeArticle(article.title, article.description || '', article.content);

  const updated = await Article.findByIdAndUpdate(
    article._id,
    {
      aiAnalysis: {
        summary:          analysis.summary,
        keyPoints:        analysis.keyPoints,
        readingTime:      analysis.readingTime,
        complexity:       analysis.complexity,
        bias:             analysis.bias,
        credibilityScore: analysis.credibilityScore,
        analyzedAt:       new Date(),
      },
      sentiment: analysis.sentiment,
      tags: [...new Set([...article.tags, ...analysis.keywords])],
    },
    { new: true }
  );

  await cacheDel(`article:${req.params.id}`);
  sendSuccess(res, { data: updated?.aiAnalysis, message: 'Article analyzed successfully' });
});

// ─── POST /news/:id/save ───────────────────────────────────────────────────────
export const toggleSaveArticle = catchAsyncTyped<AuthRequest>(async (req, res, next) => {
  const article = await Article.findById(req.params.id);
  if (!article) return next(AppError.notFound('Article'));

  const User = (await import('../models/User.model')).default;
  const user = await User.findById(req.user?._id);
  if (!user) return next(AppError.notFound('User'));

  const isSaved = user.savedArticles.some((a) => a.toString() === req.params.id);
  const userUpdate  = isSaved ? { $pull:     { savedArticles: req.params.id } }
                               : { $addToSet: { savedArticles: req.params.id } };
  const engUpdate = { $inc: { 'engagement.saves': isSaved ? -1 : 1 } };

  await Promise.all([
    User.findByIdAndUpdate(req.user?._id, userUpdate),
    Article.findByIdAndUpdate(req.params.id, engUpdate),
  ]);

  sendSuccess(res, {
    message: isSaved ? 'Article removed from saved' : 'Article saved',
    data: { saved: !isSaved },
  });
});

// ─── GET /news/saved ───────────────────────────────────────────────────────────
export const getSavedArticles = catchAsyncTyped<AuthRequest>(async (req, res, next) => {
  const User = (await import('../models/User.model')).default;
  const user = await User.findById(req.user?._id).populate({
    path: 'savedArticles',
    populate: { path: 'category', select: 'name slug color icon' }
  });

  if (!user) return next(AppError.notFound('User'));

  // Sort them by most recently added? The array preserves insertion order, so we can reverse it
  const articles = [...user.savedArticles].reverse();

  sendSuccess(res, { data: articles, message: 'Saved articles retrieved' });
});

// ─── GET /news/trending ────────────────────────────────────────────────────────
export const getTrendingArticles = catchAsyncTyped<AuthRequest>(async (_req, res) => {
  const cacheKey = 'articles:trending';
  const cached = await cacheGet(cacheKey);
  if (cached) { sendSuccess(res, { data: cached }); return; }

  const articles = await Article.find({ isTrending: true })
    .sort({ 'engagement.views': -1, publishedAt: -1 })
    .limit(20)
    .populate('category', 'name slug color')
    .lean();

  await cacheSet(cacheKey, articles, 300);
  sendSuccess(res, { data: articles, message: 'Trending articles retrieved' });
});

// ─── GET /news/breaking ────────────────────────────────────────────────────────
export const getBreakingNews = catchAsyncTyped<AuthRequest>(async (_req, res) => {
  const cacheKey = 'articles:breaking';
  const cached = await cacheGet(cacheKey);
  if (cached) { sendSuccess(res, { data: cached }); return; }

  const articles = await Article.find({ isBreaking: true })
    .sort({ publishedAt: -1 })
    .limit(10)
    .populate('category', 'name slug color')
    .lean();

  await cacheSet(cacheKey, articles, 60); // Short cache for breaking news
  sendSuccess(res, { data: articles, message: 'Breaking news retrieved' });
});
