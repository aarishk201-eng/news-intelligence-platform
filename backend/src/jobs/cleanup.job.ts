/**
 * @module jobs/cleanup.job
 * @description Database and cache maintenance job.
 *
 * Tasks per run:
 *  1. Archive articles older than 90 days (status → archived)
 *  2. Recalculate trendScore for articles with stale engagement
 *  3. Mark flagged duplicates as archived
 *  4. Flush stale Redis cache keys
 *
 * Schedule: daily at 02:00 UTC
 * Timeout:  5 minutes
 */

import Article          from '../models/Article.model';
import { cacheFlushPattern } from '../config/redis';
import { createLogger } from '../utils/logger';
import type { JobResult } from './scheduler';

const log = createLogger('CleanupJob');

export const cleanupHandler = async (): Promise<JobResult> => {
  let archived = 0;
  let cleaned  = 0;
  const errors: string[] = [];

  // ── Task 1: Archive old articles ──────────────────────────────────────────
  try {
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const archiveResult = await Article.updateMany(
      { publishedAt: { $lt: ninetyDaysAgo }, status: 'published' },
      { $set: { status: 'archived' } }
    );
    archived = archiveResult.modifiedCount;
    if (archived > 0) log.info(`Archived ${archived} articles older than 90 days`);
  } catch (err) {
    errors.push(`Archive task failed: ${(err as Error).message}`);
    log.error('Archive task failed:', err);
  }

  // ── Task 2: Archive confirmed duplicates ──────────────────────────────────
  try {
    const dupResult = await Article.updateMany(
      { isDuplicate: true, status: 'published' },
      { $set: { status: 'archived' } }
    );
    if (dupResult.modifiedCount > 0) {
      log.info(`Archived ${dupResult.modifiedCount} duplicate articles`);
      cleaned += dupResult.modifiedCount;
    }
  } catch (err) {
    errors.push(`Duplicate archive failed: ${(err as Error).message}`);
  }

  // ── Task 3: Flush stale Redis caches ──────────────────────────────────────
  try {
    await cacheFlushPattern('articles:*');
    await cacheFlushPattern('ai:v2:briefing:*');
    log.info('Flushed stale Redis caches');
  } catch (err) {
    // Non-fatal — cache flush failure is acceptable
    log.warn('Cache flush failed (non-fatal):', err);
  }

  log.info(`Cleanup done: archived=${archived} dupes_cleaned=${cleaned} errors=${errors.length}`);

  return { archived, cleaned, errors };
};
