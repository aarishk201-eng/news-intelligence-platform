/**
 * @module utils/duplicateDetector
 * @description Detects duplicate and near-duplicate articles before insertion.
 *
 * Three-tier detection strategy:
 *  1. Exact URL match   — O(1) via urlHash unique index
 *  2. Normalized URL    — strips UTM params, trailing slash, etc.
 *  3. Near-duplicate    — content fingerprint match (first 500 chars)
 */
import Article from '../models/Article.model';
import { createLogger } from './logger';

const log = createLogger('DuplicateDetector');

const normalizeUrl = (url: string): string => {
  try {
    const u = new URL(url);
    u.hash = '';
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'ref', 'source'].forEach((p) =>
      u.searchParams.delete(p)
    );
    u.searchParams.sort();
    return u.toString().replace(/\/$/, '').toLowerCase();
  } catch {
    return url.trim().toLowerCase();
  }
};

const simpleHash = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
};

export interface DuplicateCheckResult {
  isDuplicate:    boolean;
  duplicateType?: 'exact_url' | 'normalized_url' | 'content_hash';
  originalId?:    string;
  originalTitle?: string;
}

/**
 * Checks whether an article is a duplicate before inserting.
 *
 * @example
 *   const check = await checkDuplicate(articleUrl, articleContent);
 *   if (check.isDuplicate) {
 *     await Article.markDuplicate(newId, check.originalId!);
 *   }
 */
export const checkDuplicate = async (
  url: string,
  content: string
): Promise<DuplicateCheckResult> => {
  const normalizedUrl  = normalizeUrl(url);
  const urlHashValue   = simpleHash(normalizedUrl);
  const contentHashVal = simpleHash(content.substring(0, 500));

  // Tier 1: Exact URL hash (fastest — uses unique index)
  const byUrlHash = await Article.findOne({ urlHash: urlHashValue })
    .select('_id title')
    .setOptions({ skipDefaultFilter: true })
    .lean();

  if (byUrlHash) {
    log.debug(`Duplicate detected (exact URL): ${url}`);
    return {
      isDuplicate:    true,
      duplicateType:  'exact_url',
      originalId:     byUrlHash._id.toString(),
      originalTitle:  byUrlHash.title,
    };
  }

  // Tier 2: Normalized URL (catches UTM variants)
  const byNormalizedUrl = await Article.findOne({ url: normalizedUrl })
    .select('_id title')
    .setOptions({ skipDefaultFilter: true })
    .lean();

  if (byNormalizedUrl) {
    log.debug(`Duplicate detected (normalized URL): ${url}`);
    return {
      isDuplicate:    true,
      duplicateType:  'normalized_url',
      originalId:     byNormalizedUrl._id.toString(),
      originalTitle:  byNormalizedUrl.title,
    };
  }

  // Tier 3: Content fingerprint (near-duplicates)
  const byContentHash = await Article.findOne({ contentHash: contentHashVal })
    .select('_id title')
    .setOptions({ skipDefaultFilter: true })
    .lean();

  if (byContentHash) {
    log.debug(`Near-duplicate detected (content hash): ${url}`);
    return {
      isDuplicate:    true,
      duplicateType:  'content_hash',
      originalId:     byContentHash._id.toString(),
      originalTitle:  byContentHash.title,
    };
  }

  return { isDuplicate: false };
};

/**
 * Batch duplicate check for ingestion pipelines.
 * Returns a Set of URL hashes that already exist.
 */
export const batchCheckUrls = async (urls: string[]): Promise<Set<string>> => {
  const hashes = urls.map((u) => simpleHash(normalizeUrl(u)));

  const existing = await Article.find({ urlHash: { $in: hashes } })
    .select('urlHash')
    .setOptions({ skipDefaultFilter: true })
    .lean();

  return new Set(existing.map((a) => a.urlHash));
};
