/**
 * @module utils/dbIndexManager
 * @description Programmatic index management for MongoDB Atlas.
 *
 * Run this on application startup (dev) or as a dedicated migration script (prod).
 * In production use: npm run indexes:sync
 *
 * Atlas M0 (free tier) limits: max 3 collections with text indexes.
 * Atlas M10+: unlimited indexes.
 */
import mongoose from 'mongoose';
import { createLogger } from './logger';

const log = createLogger('IndexManager');

interface IndexReport {
  collection: string;
  created:    number;
  existing:   number;
  errors:     string[];
}

/**
 * Syncs all model indexes to MongoDB.
 * Idempotent — safe to run multiple times.
 */
export const syncIndexes = async (): Promise<IndexReport[]> => {
  const models = Object.values(mongoose.models);
  const reports: IndexReport[] = [];

  for (const model of models) {
    const report: IndexReport = {
      collection: model.collection.collectionName,
      created: 0,
      existing: 0,
      errors: [],
    };

    try {
      // syncIndexes() creates missing, leaves existing untouched
      await model.syncIndexes();
      const indexes = await model.listIndexes();
      report.existing = indexes.length;
      log.info(`✅ ${report.collection}: ${report.existing} indexes synced`);
    } catch (err) {
      const msg = (err as Error).message;
      report.errors.push(msg);
      log.error(`❌ ${report.collection} index sync failed: ${msg}`);
    }

    reports.push(report);
  }

  return reports;
};

/**
 * Lists all indexes for a collection with their sizes.
 * Useful for monitoring index bloat.
 */
export const listIndexStats = async (collectionName: string): Promise<unknown[]> => {
  const db = mongoose.connection.db;
  if (!db) throw new Error('Database not connected');

  const stats = await db
    .collection(collectionName)
    .aggregate([{ $indexStats: {} }])
    .toArray();

  return stats;
};

/**
 * Drops a specific index by name.
 * Use with caution in production — drops cause query plan cache invalidation.
 */
export const dropIndex = async (collectionName: string, indexName: string): Promise<void> => {
  const db = mongoose.connection.db;
  if (!db) throw new Error('Database not connected');
  await db.collection(collectionName).dropIndex(indexName);
  log.info(`Dropped index "${indexName}" from "${collectionName}"`);
};

/**
 * Validates that critical indexes exist on the Article collection.
 * Call on startup in production to catch missing indexes early.
 */
export const validateCriticalIndexes = async (): Promise<boolean> => {
  const REQUIRED_INDEXES = [
    'url_1',              // unique — prevents duplicate URLs
    'urlHash_1',          // unique — fast duplicate lookup
    'status_date',        // primary list query
    'category_status_date', // category feed
    'full_text_search',   // text search
  ];

  try {
    const Article = mongoose.model('Article');
    const indexes = await Article.listIndexes();
    const indexNames = indexes.map((i: { name: string }) => i.name);

    const missing = REQUIRED_INDEXES.filter((name) => !indexNames.includes(name));

    if (missing.length > 0) {
      log.error(`Missing critical Article indexes: ${missing.join(', ')}`);
      return false;
    }

    log.info(`✅ All ${REQUIRED_INDEXES.length} critical indexes verified`);
    return true;
  } catch (err) {
    log.error('Index validation failed:', err);
    return false;
  }
};
