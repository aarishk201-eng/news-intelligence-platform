
import { catchAsyncTyped } from '../utils/catchAsync';
import { sendSuccess } from '../utils/apiResponse';
import { AppError } from '../utils/AppError';
import { AI_CONFIG, getUsageStats } from '../config/openai';
import {
  generateBriefing,
  chatWithNewsAI,
  extractTrendingTopics,
  batchAnalyzeArticles,
  ChatMessage,
} from '../services/ai.service';
import Article from '../models/Article.model';
import type { AuthRequest } from '../types';
import { createLogger } from '../utils/logger';

const log = createLogger('AiController');

// ─── AI Chat ──────────────────────────────────────────────────────────────────
export const chat = catchAsyncTyped<AuthRequest>(async (req, res, next) => {
  if (!AI_CONFIG.enabled) {
    const mockReply = "I am currently running in offline demo mode. In a full production environment with an OpenAI API key, I would use advanced context awareness to analyze the articles you're reading and answer your questions intelligently!";
    return sendSuccess(res, { data: { reply: mockReply, timestamp: new Date().toISOString() } });
  }

  const { message, conversationHistory = [], articleId } = req.body as {
    message: string;
    conversationHistory?: ChatMessage[];
    articleId?: string;
  };

  // Build context efficiently — avoid fetching unnecessary data
  let context: string | undefined;
  if (articleId) {
    const article = await Article.findById(articleId)
      .select('title description aiAnalysis.summary content')
      .lean();
    if (article) {
      const summary = article.aiAnalysis?.summary || article.description;
      const excerpt = article.content?.substring(0, 1200) ?? '';
      context = `Article: ${article.title}\nSummary: ${summary}\nExcerpt: ${excerpt}`;
    }
  } else {
    const recent = await Article.find()
      .sort({ publishedAt: -1 })
      .limit(10)
      .select('title')
      .lean();
    if (recent.length > 0) {
      context = 'Recent headlines:\n' + recent.map((a) => `- ${a.title}`).join('\n');
    }
  }

  const reply = await chatWithNewsAI(message, conversationHistory, context);
  sendSuccess(res, { data: { reply, timestamp: new Date().toISOString() } });
});

// ─── Daily Briefing ───────────────────────────────────────────────────────────
export const getDailyBriefing = catchAsyncTyped<AuthRequest>(async (req, res, next) => {
  if (!AI_CONFIG.enabled) {
    return sendSuccess(res, {
      data: {
        briefing: "### Executive Briefing (Demo Mode)\n\n**Key Developments:**\n1. **AI Safety Frameworks:** Global regulatory discussions are intensifying around AI deployment.\n2. **Market Shifts:** Tech and renewable energy sectors see significant momentum this quarter.\n3. **Local News Focus:** With regional data streams active, local elections and municipal policies are taking center stage.\n\n**Actionable Insights:**\n- Ensure compliance with upcoming tech regulations.\n- Monitor local market trends for emerging opportunities.",
        articleCount: 12,
        generatedAt: new Date().toISOString()
      },
      message: 'Daily briefing generated (Demo Mode)'
    });
  }

  const userCategories = req.user?.preferences?.categories ?? [];
  const filter = userCategories.length > 0 ? { category: { $in: userCategories } } : {};

  const articles = await Article.find(filter)
    .sort({ publishedAt: -1 })
    .limit(15)
    .populate('category', 'name')
    .select('title description aiAnalysis.summary category')
    .lean();

  if (articles.length === 0) {
    sendSuccess(res, { data: { briefing: 'No recent articles found for your preferences.' } });
    return;
  }

  let briefing: string;
  try {
    briefing = await generateBriefing(
      articles.map((a) => ({
        title:       a.title,
        description: a.aiAnalysis?.summary || a.description,
        category:    (a.category as { name?: string } | null)?.name,
      }))
    );
  } catch (err) {
    log.warn('Failed to generate briefing due to AI error:', err);
    briefing = "⚠️ **AI Briefing Unavailable**\n\nThe AI system is currently experiencing high load (API rate limits). Please try again in a few minutes.";
  }

  sendSuccess(res, {
    data: { briefing, articleCount: articles.length, generatedAt: new Date().toISOString() },
    message: 'Daily briefing generated',
  });
});

// ─── Trending Topics ──────────────────────────────────────────────────────────
export const getTrending = catchAsyncTyped<AuthRequest>(async (_req, res, next) => {
  if (!AI_CONFIG.enabled) {
    const mockTopics = [
      { topic: 'Tech Innovation', count: 24, sentiment: 'positive' },
      { topic: 'Global Economics', count: 18, sentiment: 'neutral' },
      { topic: 'Renewable Energy', count: 12, sentiment: 'positive' },
      { topic: 'Local Policies', count: 8, sentiment: 'negative' }
    ];
    return sendSuccess(res, { data: { topics: mockTopics, count: mockTopics.length }, message: 'Trending topics extracted (Demo Mode)' });
  }

  const articles = await Article.find()
    .sort({ publishedAt: -1, 'engagement.trendScore': -1 })
    .limit(60)
    .select('title')
    .lean();

  let topics: string[];
  try {
    topics = await extractTrendingTopics(articles.map((a) => a.title));
  } catch (err) {
    log.warn('Failed to extract trending topics due to AI error:', err);
    topics = []; // Frontend will gracefully fallback to mock topics if empty
  }
  sendSuccess(res, { data: { topics, count: topics.length }, message: 'Trending topics extracted' });
});

// ─── Batch Analysis (admin) ───────────────────────────────────────────────────
export const triggerBatchAnalysis = catchAsyncTyped<AuthRequest>(async (req, res, next) => {
  if (!AI_CONFIG.enabled) return next(AppError.serviceUnavailable('AI'));

  const { limit = 20, concurrency = 3 } = req.query as { limit?: string; concurrency?: string };
  const batchLimit = Math.min(100, parseInt(String(limit), 10) || 20);
  const batchConcurrency = Math.min(10, parseInt(String(concurrency), 10) || 3);

  // Find articles without AI analysis
  const unanalyzed = await Article.find({ 'aiAnalysis.analyzedAt': null })
    .sort({ publishedAt: -1 })
    .limit(batchLimit)
    .select('_id title description content')
    .lean();

  if (unanalyzed.length === 0) {
    sendSuccess(res, { data: { processed: 0, message: 'All articles are already analyzed' } });
    return;
  }

  log.info(`Starting batch analysis: ${unanalyzed.length} articles, concurrency: ${batchConcurrency}`);

  // Run batch asynchronously for large batches — respond immediately
  if (unanalyzed.length > 10) {
    void (async () => {
      try {
        const results = await batchAnalyzeArticles(
          unanalyzed.map((a) => ({
            id: a._id.toString(), title: a.title,
            description: a.description, content: a.content,
          })),
          batchConcurrency
        );

        // Persist results to DB
        const updates = results
          .filter((r) => r.analysis)
          .map((r) =>
            Article.findByIdAndUpdate(r.articleId, {
              'aiAnalysis.summary':          r.analysis!.summary,
              'aiAnalysis.keyPoints':        r.analysis!.keyPoints,
              'aiAnalysis.keyInsights':      r.analysis!.keyInsights,
              'aiAnalysis.extractedKeywords':r.analysis!.keywords,
              'aiAnalysis.readingTime':      r.analysis!.readingTime,
              'aiAnalysis.complexity':       r.analysis!.complexity,
              'aiAnalysis.credibilityScore': r.analysis!.credibilityScore,
              'aiAnalysis.bias':             r.analysis!.bias,
              'aiAnalysis.analyzedAt':       new Date(),
              sentiment: r.analysis!.sentiment,
              tags: r.analysis!.keywords,
            })
          );
        await Promise.allSettled(updates);
        log.info(`Batch analysis DB update: ${updates.length} articles updated`);
      } catch (err) {
        log.error('Background batch analysis failed:', err);
      }
    })();

    sendSuccess(res, {
      message: `Batch analysis started for ${unanalyzed.length} articles`,
      data: { queued: unanalyzed.length, concurrency: batchConcurrency, async: true },
    });
  } else {
    // Small batch — do synchronously
    const results = await batchAnalyzeArticles(
      unanalyzed.map((a) => ({
        id: a._id.toString(), title: a.title,
        description: a.description, content: a.content,
      })),
      batchConcurrency
    );

    sendSuccess(res, {
      data: {
        processed: results.filter((r) => r.analysis).length,
        failed:    results.filter((r) => r.error).length,
        fromCache: results.filter((r) => r.fromCache).length,
      },
      message: 'Batch analysis complete',
    });
  }
});

// ─── AI Usage Stats (admin) ───────────────────────────────────────────────────
export const getUsage = catchAsyncTyped<AuthRequest>(async (_req, res) => {
  const stats = getUsageStats();
  sendSuccess(res, {
    data: {
      model:              AI_CONFIG.model,
      enabled:            AI_CONFIG.enabled,
      totalCalls:         stats.totalCalls,
      totalInputTokens:   stats.totalInputTokens,
      totalOutputTokens:  stats.totalOutputTokens,
      estimatedCostUsd:   Number(stats.totalCostUsd.toFixed(6)),
      errors:             stats.errors,
    },
  });
});
