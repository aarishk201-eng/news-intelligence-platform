/**
 * @module services/newsIngestion.service
 * @description Top-level orchestrator that coordinates NewsData.io and RSS fetching.
 *
 * Pipeline:
 *  1. Primary:  NewsData.io (production-grade, AI-tagged, paginated)
 *  2. Fallback: RSS feeds (runs even if NewsData.io fails or has no key)
 *
 * Exposes:
 *  - fetchAndStoreNews() — called by cron job and manual API trigger
 *  - startScheduler()    — registers cron task
 */

import RssParser from 'rss-parser';
import * as cron from 'node-cron';
import Article from '../models/Article.model';
import { fetchNews, FetchResult } from './newsFetcher.service';
import { batchCheckUrls } from '../utils/duplicateDetector';
import { validateRawArticle, transformArticle, warmCategoryCache } from './articleValidator.service';
import { cacheFlushPattern } from '../config/redis';
import { env } from '../config/env';
import { createLogger } from '../utils/logger';
import { withRetry } from '../utils/retryHandler';

const log = createLogger('NewsIngestion');

// ─── RSS Feed Registry ────────────────────────────────────────────────────────
const RSS_FEEDS: Array<{ url: string; sourceName: string; country: string }> = [
  { url: 'https://feeds.bbci.co.uk/news/rss.xml',               sourceName: 'BBC News',   country: 'GB' },
  { url: 'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml', sourceName: 'NYT', country: 'US' },
  { url: 'https://feeds.reuters.com/reuters/topNews',           sourceName: 'Reuters',    country: 'GB' },
  { url: 'https://www.theguardian.com/world/rss',               sourceName: 'The Guardian',country: 'GB' },
  { url: 'https://rss.cnn.com/rss/edition.rss',                 sourceName: 'CNN',        country: 'US' },
  { url: 'https://feeds.washingtonpost.com/rss/national',       sourceName: 'Washington Post', country: 'US' },
  { url: 'https://techcrunch.com/feed/',                        sourceName: 'TechCrunch', country: 'US' },
  { url: 'https://www.wired.com/feed/rss',                      sourceName: 'Wired',      country: 'US' },
];

const rssParser = new RssParser({ timeout: 10_000 });

// ─── Final ingestion result ───────────────────────────────────────────────────
export interface IngestionResult {
  newsdataArticles: number;
  rssArticles:      number;
  total:            number;
  durationMs:       number;
  errors:           string[];
  stats?: Partial<FetchResult>;
}

// ─── RSS Feed Fetcher ─────────────────────────────────────────────────────────
const fetchFromRss = async (): Promise<{ inserted: number; errors: string[] }> => {
  await warmCategoryCache();

  let totalInserted = 0;
  const errors: string[] = [];

  for (const feed of RSS_FEEDS) {
    try {
      log.debug(`Fetching RSS: ${feed.url}`);

      const parsed = await withRetry(
        () => rssParser.parseURL(feed.url),
        { maxRetries: 2, baseDelayMs: 1500 }
      );

      const items = parsed.items ?? [];
      if (items.length === 0) continue;

      // Batch dedup check for all URLs in this feed
      const urls = items.map((i) => i.link).filter((u): u is string => !!u);
      await batchCheckUrls(urls);

      // Filter items with no URL or already-existing URL
      // (existingHashes contains hashes; we pass URLs — batchCheckUrls returns hashes of existing)
      // We insert all and rely on ordered:false + duplicate key error handling
      const docsToInsert: unknown[] = [];

      for (const item of items) {
        if (!item.link || !item.title) continue;

        // Build a minimal NewsData-like raw object for the shared validator
        const pseudoRaw = {
          article_id:  item.link,
          title:       item.title,
          link:        item.link,
          description: item.contentSnippet ?? item.summary ?? null,
          content:     item.content ?? item.contentSnippet ?? null,
          pubDate:     item.pubDate ?? null,
          image_url:   (item as { image?: { url?: string } }).image?.url ?? null,
          source_name: feed.sourceName,
          source_url:  parsed.link,
          country:     [feed.country],
          language:    'en',
          duplicate:   false,
        };

        const validation = validateRawArticle(pseudoRaw as never);
        if (!validation.isValid) {
          log.debug(`RSS skip [${validation.reason}]: ${item.link}`);
          continue;
        }

        const transformed = await transformArticle(pseudoRaw as never);
        if (transformed) {
          docsToInsert.push({
            ...transformed,
            ingestSource: 'rss',
          });
        }
      }

      if (docsToInsert.length === 0) continue;

      try {
        const result = await Article.insertMany(docsToInsert, {
          ordered: false,
          rawResult: true,
        });
        const count = (result as unknown as { insertedCount?: number }).insertedCount ?? 0;
        totalInserted += count;
        log.info(`RSS [${feed.sourceName}]: +${count} articles`);
      } catch (err: unknown) {
        const bulkErr = err as { name?: string; insertedDocs?: unknown[]; writeErrors?: Array<{ code: number }> };
        if (bulkErr.name === 'BulkWriteError' || bulkErr.name === 'MongoBulkWriteError') {
          const count = bulkErr.insertedDocs?.length ?? 0;
          totalInserted += count;
          log.debug(`RSS [${feed.sourceName}]: +${count} inserted (some dupes skipped)`);
        } else {
          throw err;
        }
      }
    } catch (err) {
      const msg = `RSS [${feed.sourceName}] failed: ${(err as Error).message}`;
      errors.push(msg);
      log.warn(msg);
    }
  }

  return { inserted: totalInserted, errors };
};

// ─── Orchestrator ─────────────────────────────────────────────────────────────
class NewsIngestionService {
  private isRunning = false;
  private cronTask: cron.ScheduledTask | null = null;

  async fetchAndStoreNews(): Promise<IngestionResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let newsdataArticles = 0;
    let rssArticles = 0;
    let newsdataStats: Partial<FetchResult> | undefined;

    log.info('━'.repeat(60));
    log.info('🔄 Starting full news ingestion...');

    // ── 1. Primary: NewsData.io ──────────────────────────────────────────────
    try {
      const result = await fetchNews();
      newsdataArticles = result.inserted;
      newsdataStats = result;
      errors.push(...result.errors);
    } catch (err) {
      const msg = `NewsData.io ingestion failed: ${(err as Error).message}`;
      errors.push(msg);
      log.error(msg, err);
    }

    // ── 2. Fallback / Supplemental: RSS ──────────────────────────────────────
    try {
      const rssResult = await fetchFromRss();
      rssArticles = rssResult.inserted;
      errors.push(...rssResult.errors);
    } catch (err) {
      const msg = `RSS ingestion failed: ${(err as Error).message}`;
      errors.push(msg);
      log.error(msg, err);
    }

    // ── 3. Flush article caches ───────────────────────────────────────────────
    try {
      await cacheFlushPattern('articles:*');
    } catch (err) {
      log.warn('Cache flush failed (non-fatal):', err);
    }

    const durationMs = Date.now() - startTime;
    const total = newsdataArticles + rssArticles;

    log.info(`✅ Ingestion complete: ${total} articles (newsdata:${newsdataArticles} rss:${rssArticles}) in ${(durationMs / 1000).toFixed(1)}s`);
    log.info('━'.repeat(60));

    return { newsdataArticles, rssArticles, total, durationMs, errors, stats: newsdataStats };
  }

  startScheduler(): void {
    if (this.cronTask) {
      log.warn('Scheduler already running');
      return;
    }

    if (!cron.validate(env.NEWS_INGEST_CRON)) {
      log.error(`Invalid cron expression: "${env.NEWS_INGEST_CRON}" — scheduler not started`);
      return;
    }

    this.cronTask = cron.schedule(
      env.NEWS_INGEST_CRON,
      async () => {
        if (this.isRunning) {
          log.warn('Previous ingestion still running — skipping this tick');
          return;
        }
        this.isRunning = true;
        try {
          await this.fetchAndStoreNews();
        } catch (err) {
          log.error('Scheduled ingestion failed:', err);
        } finally {
          this.isRunning = false;
        }
      },
      { timezone: 'UTC' }
    );

    log.info(`📅 Ingestion scheduler registered: "${env.NEWS_INGEST_CRON}" (UTC)`);
  }

  stopScheduler(): void {
    this.cronTask?.stop();
    this.cronTask = null;
    log.info('Ingestion scheduler stopped');
  }

  get running(): boolean {
    return this.isRunning;
  }
}

export const newsIngestionService = new NewsIngestionService();
