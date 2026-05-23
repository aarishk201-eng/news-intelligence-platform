/**
 * @module jobs/aiAnalysis.job
 * @description Background AI analysis catch-up job.
 *
 * Purpose: Runs independently of ingestion to ensure all articles
 * eventually get analyzed, even if the ingestion job skipped AI
 * (e.g. due to rate limits or disabled AI during off-peak hours).
 *
 * Schedule: every hour (offset from ingestion)
 * Timeout:  15 minutes
 */

import Article          from '../models/Article.model';
import { batchAnalyzeArticles } from '../services/ai.service';
import { AI_CONFIG }    from '../config/openai';
import { env }          from '../config/env';
import { createLogger } from '../utils/logger';
import type { JobResult } from './scheduler';

const log = createLogger('AiAnalysisJob');

export const aiAnalysisHandler = async (): Promise<JobResult> => {
  if (!AI_CONFIG.enabled) {
    log.info('AI disabled — skipping analysis job');
    return { analyzed: 0, skipped: 0, errors: ['AI not enabled'] };
  }

  // Find unanalyzed articles, oldest first (catch-up order)
  const unanalyzed = await Article.find({
    'aiAnalysis.analyzedAt': null,
    status: 'published',
  })
    .sort({ publishedAt: 1 })  // oldest first — ensure all articles get analyzed eventually
    .limit(100)
    .select('_id title description content')
    .lean();

  if (unanalyzed.length === 0) {
    log.info('All articles are analyzed — nothing to do');
    return { analyzed: 0, skipped: 0 };
  }

  log.info(`Analyzing ${unanalyzed.length} pending articles...`);

  const results = await batchAnalyzeArticles(
    unanalyzed.map((a) => ({
      id:          a._id.toString(),
      title:       a.title,
      description: a.description,
      content:     a.content,
    })),
    5  // Higher concurrency for dedicated catch-up job
  );

  const succeeded = results.filter((r) => r.analysis);
  const failed    = results.filter((r) => r.error);

  // Bulk-write AI results back to articles
  const updates = succeeded.map((r) =>
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
      tags: [...new Set([...r.analysis!.keywords, ...r.analysis!.topics])].slice(0, 30),
    }, { runValidators: false })
  );

  const updateResults = await Promise.allSettled(updates);
  const dbFailed = updateResults.filter((r) => r.status === 'rejected').length;

  log.info(`Analysis complete: ${succeeded.length} analyzed, ${failed.length} AI errors, ${dbFailed} DB errors`);

  return {
    analyzed: succeeded.length,
    skipped:  0,
    errors:   [
      ...failed.map((r) => `${r.articleId}: ${r.error}`),
      ...(dbFailed > 0 ? [`${dbFailed} DB update failures`] : []),
    ],
  };
};
