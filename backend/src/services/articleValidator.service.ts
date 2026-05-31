/**
 * @module services/articleValidator.service
 * @description Validates and transforms raw NewsData.io articles into
 * the shape expected by the Article Mongoose model.
 *
 * Validation rules:
 *  - title must be non-empty, ≥ 10 chars, not "[Removed]" or gibberish
 *  - link must be a parseable valid URL
 *  - description or content must be present (not both empty)
 *  - pubDate must be parseable and not in the future
 *  - article must not be flagged as duplicate by NewsData.io itself
 *  - language must be present and supported
 */

import Category from '../models/Category.model';
import { NewsDataArticleRaw } from '../config/newsdata';
import { createLogger } from '../utils/logger';

const log = createLogger('ArticleValidator');

// ─── Supported Languages ──────────────────────────────────────────────────────
const SUPPORTED_LANGUAGES = new Set([
  'en', 'english', 'ar', 'de', 'es', 'fr', 'he', 'it', 'nl', 'no', 'pt', 'ru', 'se', 'zh',
]);

// ─── Junk Title Patterns ─────────────────────────────────────────────────────
const JUNK_TITLE_PATTERNS = [
  /^\[removed\]$/i,
  /^\[deleted\]$/i,
  /^undefined$/i,
  /^null$/i,
  /^\s*$/, // blank
  /^(.)\1{10,}$/, // repeated character spam (aaaaaaaa)
];

// ─── Category Keyword Map ─────────────────────────────────────────────────────
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Technology:    ['ai', 'tech', 'software', 'crypto', 'cyber', 'robot', 'digital', 'startup', 'app', 'cloud', 'data', 'machine learning', 'silicon', 'semiconductor', 'openai', 'google', 'apple', 'microsoft', 'meta'],
  Politics:      ['election', 'president', 'congress', 'senate', 'government', 'policy', 'law', 'parliament', 'democrat', 'republican', 'vote', 'minister', 'legislation', 'campaign', 'ballot'],
  Business:      ['market', 'stock', 'economy', 'trade', 'company', 'ceo', 'finance', 'bank', 'investment', 'revenue', 'profit', 'merger', 'acquisition', 'startup', 'ipo', 'nasdaq', 'dow'],
  Science:       ['research', 'study', 'climate', 'space', 'nasa', 'discovery', 'scientist', 'physics', 'biology', 'chemistry', 'experiment', 'fossil', 'species', 'gene'],
  Health:        ['health', 'medical', 'disease', 'hospital', 'vaccine', 'cancer', 'covid', 'medicine', 'drug', 'treatment', 'fda', 'clinical', 'mental health', 'wellness', 'surgery'],
  Sports:        ['football', 'basketball', 'soccer', 'olympics', 'championship', 'athlete', 'nba', 'nfl', 'fifa', 'tennis', 'cricket', 'baseball', 'league', 'tournament', 'medal'],
  Entertainment: ['movie', 'music', 'celebrity', 'film', 'award', 'netflix', 'streaming', 'album', 'box office', 'oscar', 'grammy', 'concert', 'actor', 'singer'],
  World:         ['international', 'war', 'conflict', 'treaty', 'foreign', 'global', 'nato', 'un ', 'united nations', 'sanctions', 'diplomat', 'ambassador', 'refugee'],
};

// ─── Category cache (avoid repeated DB queries in a single run) ───────────────
const categoryIdCache = new Map<string, string>();

const getCategoryId = async (name: string): Promise<string | null> => {
  if (categoryIdCache.has(name)) return categoryIdCache.get(name)!;
  const cat = await Category.findOne({ name, isActive: true }).select('_id').lean();
  if (cat) {
    categoryIdCache.set(name, cat._id.toString());
    return cat._id.toString();
  }
  return null;
};

// ─── Auto-categorization ─────────────────────────────────────────────────────
const detectCategoryId = async (
  title: string,
  description: string,
  newsdataCategories: string[] | null | undefined
): Promise<string> => {
  // 1. Trust NewsData.io's own category hint first
  if (newsdataCategories && newsdataCategories.length > 0) {
    for (const hint of newsdataCategories) {
      const normalized = hint.charAt(0).toUpperCase() + hint.slice(1).toLowerCase();
      const id = await getCategoryId(normalized);
      if (id) return id;
    }
  }

  // 2. Keyword match against title + description
  const text = `${title} ${description}`.toLowerCase();
  for (const [categoryName, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => text.includes(kw))) {
      const id = await getCategoryId(categoryName);
      if (id) return id;
    }
  }

  // 3. Fallback to General
  const generalId = await getCategoryId('General');
  return generalId ?? '';
};

// ─── Validation Result ────────────────────────────────────────────────────────
export interface ValidationResult {
  isValid:  boolean;
  reason?:  string;
}

// ─── Transformed Article Shape ────────────────────────────────────────────────
export interface TransformedArticle {
  title:       string;
  description: string;
  content:     string;
  url:         string;
  media: {
    imageUrl?:   string;
    videoUrl?:   string;
    hasVideo:    boolean;
  };
  source: {
    id?:       string;
    name:      string;
    url?:      string;
    logo?:     string;
    isVerified: boolean;
  };
  author?:     string;
  category:    string;  // ObjectId string
  tags:        string[];
  language:    string;
  geo: {
    country: string;
  };
  publishedAt: Date;
  fetchedAt:   Date;
  sentiment: {
    score:      number;
    label:      'positive' | 'negative' | 'neutral';
    confidence: number;
  };
  ingestSource: 'newsapi';
}

// ─── Validate Raw Article ─────────────────────────────────────────────────────
export const validateRawArticle = (raw: NewsDataArticleRaw): ValidationResult => {
  // Must have a URL
  if (!raw.link) return { isValid: false, reason: 'missing_url' };

  // URL must be valid
  try { new URL(raw.link); } catch {
    return { isValid: false, reason: 'invalid_url' };
  }

  // Must have a title
  if (!raw.title || raw.title.trim().length < 10) {
    return { isValid: false, reason: 'title_too_short' };
  }

  // Check junk title patterns
  if (JUNK_TITLE_PATTERNS.some((p) => p.test(raw.title!.trim()))) {
    return { isValid: false, reason: 'junk_title' };
  }

  // Title must not exceed schema limit
  if (raw.title.length > 500) return { isValid: false, reason: 'title_too_long' };

  // Need at least description or content
  const hasBody = (raw.description && raw.description.trim().length > 0)
               || (raw.content     && raw.content.trim().length > 0);
  if (!hasBody) return { isValid: false, reason: 'no_body_content' };

  // NewsData.io already flagged as duplicate
  if (raw.duplicate === true) return { isValid: false, reason: 'api_flagged_duplicate' };

  // Language check (allow unknown/null — we default to 'en')
  if (raw.language && !SUPPORTED_LANGUAGES.has(raw.language)) {
    return { isValid: false, reason: `unsupported_language:${raw.language}` };
  }

  // pubDate: must be parseable
  if (raw.pubDate) {
    const d = new Date(raw.pubDate);
    if (isNaN(d.getTime())) return { isValid: false, reason: 'invalid_date' };
    // Must not be in the future (allow 5-minute clock skew)
    if (d.getTime() > Date.now() + 5 * 60 * 1000) {
      return { isValid: false, reason: 'future_date' };
    }
  }

  return { isValid: true };
};

// ─── Map NewsData.io sentiment ────────────────────────────────────────────────
const mapSentiment = (
  label?: string | null,
  stats?: { positive?: number; negative?: number; neutral?: number } | null
): TransformedArticle['sentiment'] => {
  const safeLabel = (label?.toLowerCase() ?? 'neutral') as 'positive' | 'negative' | 'neutral';
  const normalized = ['positive', 'negative', 'neutral'].includes(safeLabel) ? safeLabel : 'neutral';

  // Map label to score
  const scoreMap: Record<string, number> = { positive: 0.6, negative: -0.6, neutral: 0 };
  const score = stats
    ? (stats.positive ?? 0) - (stats.negative ?? 0)
    : scoreMap[normalized] ?? 0;

  const confidence = stats
    ? Math.max(stats.positive ?? 0, stats.negative ?? 0, stats.neutral ?? 0)
    : 0;

  return {
    score:      Math.max(-1, Math.min(1, score)),
    label:      normalized,
    confidence: Math.max(0, Math.min(1, confidence)),
  };
};

// ─── Transform Raw → Article Document ────────────────────────────────────────
export const transformArticle = async (
  raw: NewsDataArticleRaw
): Promise<TransformedArticle | null> => {
  try {
    const categoryId = await detectCategoryId(
      raw.title ?? '',
      raw.description ?? '',
      raw.category
    );

    if (!categoryId) {
      log.warn(`No category resolved for article: ${raw.link ?? ''}`);
      return null;
    }

    const country = (raw.country?.[0] ?? 'US').toUpperCase().substring(0, 2);
    const description = (raw.description ?? raw.content ?? raw.title ?? '').substring(0, 1000).trim();
    const content     = raw.content || raw.description || raw.title || '';
    const tags        = (raw.keywords ?? []).map((k) => k.toLowerCase().trim()).filter(Boolean).slice(0, 30);

    return {
      title:       raw.title!.trim().substring(0, 500),
      description,
      content,
      url:         raw.link!,
      media: {
        imageUrl:  raw.image_url ?? undefined,
        videoUrl:  raw.video_url ?? undefined,
        hasVideo:  !!raw.video_url,
      },
      source: {
        id:         raw.source_id,
        name:       (raw.source_name ?? raw.source_id ?? 'Unknown').substring(0, 200),
        url:        raw.source_url,
        logo:       raw.source_icon,
        isVerified: (raw.source_priority ?? 999) <= 10, // top-priority = verified
      },
      author:      raw.creator?.[0] ?? undefined,
      category:    categoryId,
      tags,
      language:    raw.language ?? 'en',
      geo:         { country },
      publishedAt: raw.pubDate ? new Date(raw.pubDate) : new Date(),
      fetchedAt:   new Date(),
      sentiment:   mapSentiment(raw.sentiment, raw.sentiment_stats),
      ingestSource: 'newsapi' as const,
    };
  } catch (err) {
    log.warn(`Transform failed for ${raw.link ?? 'unknown'}: ${(err as Error).message}`);
    return null;
  }
};

// ─── Warm up the category cache ───────────────────────────────────────────────
export const warmCategoryCache = async (): Promise<void> => {
  const categories = await Category.find({ isActive: true }).select('name _id').lean();
  categories.forEach((c) => categoryIdCache.set(c.name, c._id.toString()));
  log.debug(`Category cache warmed: ${categoryIdCache.size} entries`);
};
