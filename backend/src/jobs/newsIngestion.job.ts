/**
 * @module jobs/newsIngestion.job
 * @description News fetching + AI analysis cron job handler.
 *
 * Pipeline per run:
 *  1. Fetch articles from NewsData.io (paginated, deduplicated)
 *  2. Store new articles in MongoDB
 *  3. Trigger AI analysis on freshly inserted articles
 *  4. Flush Redis article caches
 *
 * Schedule: every 30 minutes (configurable via NEWS_INGEST_CRON)
 * Timeout:  12 minutes (fetch can take time on large batches)
 * Circuit:  opens after 5 consecutive failures
 */

import { newsIngestionService } from '../services/newsIngestion.service';
import { batchAnalyzeArticles }  from '../services/ai.service';
import Article                   from '../models/Article.model';
import { AI_CONFIG }             from '../config/openai';
import { env }                   from '../config/env';
import { createLogger }          from '../utils/logger';
import type { JobResult }        from './scheduler';

const log = createLogger('IngestionJob');

export const newsIngestionHandler = async (): Promise<JobResult> => {
  log.info('Phase 1/2 — Fetching and storing news articles...');

  // ── Phase 1: Fetch + store ─────────────────────────────────────────────────
  const ingestionResult = await newsIngestionService.fetchAndStoreNews();

  log.info(`Phase 1 done: +${ingestionResult.total} articles `+
    `(newsdata:${ingestionResult.newsdataArticles} rss:${ingestionResult.rssArticles})`);

  // ── Phase 2: AI analysis on unanalyzed articles ───────────────────────────
  let analyzed = 0;
  if (AI_CONFIG.enabled && ingestionResult.total > 0) {
    log.info('Phase 2/2 — Running AI analysis on new articles...');

    const unanalyzed = await Article.find({ 'aiAnalysis.analyzedAt': null })
      .sort({ publishedAt: -1 })
      .limit(50)  // Process up to 50 per run — avoid spending too much per cron tick
      .select('_id title description content')
      .lean();

    if (unanalyzed.length > 0) {
      const results = await batchAnalyzeArticles(
        unanalyzed.map((a) => ({
          id:          a._id.toString(),
          title:       a.title,
          description: a.description,
          content:     a.content,
        })),
        3  // 3 concurrent AI calls — respects rate limits
      );

      // Persist AI results back to each article
      const updates = results
        .filter((r) => r.analysis)
        .map((r) =>
          Article.findByIdAndUpdate(r.articleId, {
            'aiAnalysis.summary':           r.analysis!.summary,
            'aiAnalysis.keyPoints':         r.analysis!.keyPoints,
            'aiAnalysis.keyInsights':       r.analysis!.keyInsights,
            'aiAnalysis.extractedKeywords': r.analysis!.keywords,
            'aiAnalysis.readingTime':       r.analysis!.readingTime,
            'aiAnalysis.complexity':        r.analysis!.complexity,
            'aiAnalysis.credibilityScore':  r.analysis!.credibilityScore,
            'aiAnalysis.bias':              r.analysis!.bias,
            'aiAnalysis.analyzedAt':        new Date(),
            'aiAnalysis.modelVersion':      env.OPENAI_MODEL,
            sentiment:                      r.analysis!.sentiment,
            tags: [
              ...new Set([
                ...(r.analysis!.keywords ?? []),
                ...(r.analysis!.topics   ?? []),
              ]),
            ].slice(0, 30),
          }, { runValidators: false })
        );

      await Promise.allSettled(updates);
      analyzed = updates.length;
      log.info(`Phase 2 done: ${analyzed}/${unanalyzed.length} articles analyzed`);
    } else {
      log.info('Phase 2: No unanalyzed articles — skipping');
    }
  } else if (!AI_CONFIG.enabled) {
    log.debug('Phase 2: AI disabled — skipping analysis');
  }

  return {
    fetched:  ingestionResult.newsdataArticles + ingestionResult.rssArticles,
    inserted: ingestionResult.total,
    analyzed,
    skipped:  0,
    errors:   ingestionResult.errors,
  };
};
