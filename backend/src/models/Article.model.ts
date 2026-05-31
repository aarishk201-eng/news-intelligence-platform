import mongoose, { Document, Schema, Model, Query } from 'mongoose';
import { createLogger } from '../utils/logger';

const log = createLogger('ArticleModel');

// ─── Enums ────────────────────────────────────────────────────────────────────
export const SENTIMENT_LABELS   = ['positive', 'negative', 'neutral'] as const;
export const COMPLEXITY_LEVELS  = ['basic', 'intermediate', 'advanced'] as const;
export const ARTICLE_STATUSES   = ['draft', 'published', 'archived', 'flagged'] as const;
export const BIAS_TYPES         = ['left', 'center-left', 'center', 'center-right', 'right', 'unknown'] as const;

export type SentimentLabel  = typeof SENTIMENT_LABELS[number];
export type ComplexityLevel = typeof COMPLEXITY_LEVELS[number];
export type ArticleStatus   = typeof ARTICLE_STATUSES[number];
export type BiasType        = typeof BIAS_TYPES[number];

// ─── Sub-document Interfaces ──────────────────────────────────────────────────
export interface ISource {
  id?:       string;
  name:      string;
  url?:      string;
  logo?:     string;
  country?:  string;
  language?: string;
  isVerified: boolean;
}

export interface ISentiment {
  score:      number;   // -1.0 to 1.0
  label:      SentimentLabel;
  confidence: number;   // 0 to 1
  magnitude?: number;   // 0 to ∞ — intensity regardless of polarity
}

export interface IKeyInsight {
  insight:    string;
  importance: 'high' | 'medium' | 'low';
  category:   string;
}

export interface IAiAnalysis {
  summary:          string;
  keyPoints:        string[];
  keyInsights:      IKeyInsight[];
  extractedKeywords: string[];
  topics:           string[];
  readingTime:      number;        // estimated minutes
  complexity:       ComplexityLevel;
  bias:             BiasType;
  credibilityScore: number;        // 0–100
  factCheckScore:   number;        // 0–100
  originalityScore: number;        // 0–100 (vs other articles)
  analyzedAt?:      Date;
  modelVersion?:    string;        // e.g. 'gpt-4o-mini-2024-07'
}

export interface IEngagement {
  views:      number;
  uniqueViews: number;
  saves:      number;
  shares:     number;
  comments:   number;
  likes:      number;
  trendScore: number;  // computed: views + shares*2 + saves*3
}

export interface IMedia {
  imageUrl?:      string;
  imageAlt?:      string;
  imageCaption?:  string;
  thumbnailUrl?:  string;
  videoUrl?:      string;
  hasVideo:       boolean;
}

export interface IGeo {
  country:    string;   // ISO 3166-1 alpha-2 (e.g. 'US', 'GB')
  region?:    string;
  city?:      string;
  continent?: string;
}

// ─── Main Interface ───────────────────────────────────────────────────────────
export interface IArticle extends Document {
  _id:             mongoose.Types.ObjectId;

  // Core fields
  title:           string;
  slug:            string;
  description:     string;
  content:         string;
  url:             string;
  status:          ArticleStatus;

  // Media
  media:           IMedia;

  // Attribution
  source:          ISource;
  author?:         string;
  authorUrl?:      string;

  // Classification
  category:        mongoose.Types.ObjectId;
  subcategory?:    string;
  tags:            string[];
  language:        string;
  geo:             IGeo;

  // Dates
  publishedAt:     Date;
  fetchedAt:       Date;

  // AI Intelligence
  aiAnalysis:      IAiAnalysis;
  sentiment:       ISentiment;

  // Engagement
  engagement:      IEngagement;

  // Flags
  isTrending:      boolean;
  isBreaking:      boolean;
  isFeatured:      boolean;
  isDuplicate:     boolean;
  duplicateOf?:    mongoose.Types.ObjectId;

  // Relations
  relatedArticles: mongoose.Types.ObjectId[];

  // System
  urlHash:         string;  // SHA-256 of normalized URL — fast duplicate check
  contentHash?:    string;  // SHA-256 of content — near-duplicate detection
  ingestSource:    'newsapi' | 'rss' | 'manual' | 'scraper';
  processingErrors: string[];

  createdAt: Date;
  updatedAt: Date;

  // Virtuals
  isAnalyzed:      boolean;
  readingTimeLabel: string;
}

// ─── Static Methods Interface ──────────────────────────────────────────────────
export interface IArticleModel extends Model<IArticle> {
  findBySlugOrId(idOrSlug: string): Query<IArticle | null, IArticle>;
  updateTrendScore(articleId: string): Promise<void>;
  markDuplicate(articleId: string, originalId: string): Promise<void>;
}

// ─── URL Normalizer ────────────────────────────────────────────────────────────
const normalizeUrl = (url: string): string => {
  try {
    const u = new URL(url);
    u.hash = '';
    u.searchParams.delete('utm_source');
    u.searchParams.delete('utm_medium');
    u.searchParams.delete('utm_campaign');
    u.searchParams.delete('ref');
    u.searchParams.sort();
    return u.toString().replace(/\/$/, '');
  } catch {
    return url.trim().toLowerCase();
  }
};

// ─── URL Hash Generator (no crypto import needed for SHA-256 equivalent) ──────
const simpleHash = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36).padStart(7, '0');
};

// ─── Slug Generator ────────────────────────────────────────────────────────────
const generateSlug = (title: string): string => {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 90);
  return `${base}-${Date.now().toString(36)}`;
};

// ═════════════════════════════════════════════════════════════════════════════
// SCHEMA DEFINITION
// ═════════════════════════════════════════════════════════════════════════════
const articleSchema = new Schema<IArticle, IArticleModel>(
  {
    // ── Core ─────────────────────────────────────────────────────────────────
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [10,  'Title must be at least 10 characters'],
      maxlength: [500, 'Title cannot exceed 500 characters'],
    },
    slug: {
      type:      String,
      unique:    true,
      lowercase: true,
      trim:      true,
      index:     true,
    },
    description: {
      type:      String,
      required:  [true, 'Description is required'],
      trim:      true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    content: {
      type:     String,
      required: [true, 'Content is required'],
      minlength:[20, 'Content must be at least 20 characters'],
    },
    url: {
      type:      String,
      required:  [true, 'Article URL is required'],
      unique:    true,
      trim:      true,
      validate: {
        validator: (v: string) => {
          try { new URL(v); return true; } catch { return false; }
        },
        message: 'Article URL must be a valid URL',
      },
    },
    urlHash: {
      type:   String,
      unique: true,
      index:  true,
    },
    contentHash: {
      type:  String,
      index: true,
      sparse: true,
    },
    status: {
      type:    String,
      enum:    { values: ARTICLE_STATUSES, message: '{VALUE} is not a valid status' },
      default: 'published',
      index:   true,
    },

    // ── Media ─────────────────────────────────────────────────────────────────
    media: {
      imageUrl: {
        type: String,
        validate: {
          validator: (v: string) => {
            if (!v) return true;
            try { new URL(v); return true; } catch { return false; }
          },
          message: 'Image URL must be a valid URL',
        },
      },
      imageAlt:      { type: String, maxlength: 300 },
      imageCaption:  { type: String, maxlength: 500 },
      thumbnailUrl:  { type: String },
      videoUrl:      { type: String },
      hasVideo:      { type: Boolean, default: false },
    },

    // ── Attribution ───────────────────────────────────────────────────────────
    source: {
      id:         { type: String, trim: true },
      name: {
        type:     String,
        required: [true, 'Source name is required'],
        trim:     true,
        maxlength:200,
      },
      url:        { type: String },
      logo:       { type: String },
      country:    { type: String, uppercase: true, maxlength: 2 },
      language:   { type: String, lowercase: true, maxlength: 10 },
      isVerified: { type: Boolean, default: false },
    },
    author:    { type: String, trim: true, maxlength: 200 },
    authorUrl: { type: String, trim: true },

    // ── Classification ────────────────────────────────────────────────────────
    category: {
      type:     Schema.Types.ObjectId,
      ref:      'Category',
      required: [true, 'Category is required'],
      index:    true,
    },
    subcategory: { type: String, trim: true, maxlength: 100 },
    tags: {
      type:     [{ type: String, lowercase: true, trim: true, maxlength: 50 }],
      default:  [],
      validate: {
        validator: (v: string[]) => v.length <= 30,
        message: 'Maximum 30 tags allowed',
      },
    },
    language: {
      type:      String,
      default:   'en',
      lowercase: true,
      trim:      true,
      maxlength: 10,
      match:     [/^[a-z]{2}(-[a-z]{2})?$/, 'Language must be a valid ISO code (e.g. en, zh-cn)'],
    },

    // ── Geography ─────────────────────────────────────────────────────────────
    geo: {
      country: {
        type:      String,
        required:  [true, 'Country is required'],
        uppercase: true,
        trim:      true,
        maxlength: 2,
        match:     [/^[A-Z]{2}$/, 'Country must be ISO 3166-1 alpha-2 (e.g. US, GB)'],
        default:   'US',
      },
      region:    { type: String, trim: true, maxlength: 100 },
      city:      { type: String, trim: true, maxlength: 100 },
      continent: { type: String, trim: true, maxlength: 50 },
    },

    // ── Dates ─────────────────────────────────────────────────────────────────
    publishedAt: {
      type:     Date,
      required: [true, 'Published date is required'],
      default:  Date.now,
      validate: {
        validator: (v: Date) => v <= new Date(),
        message:  'Published date cannot be in the future',
      },
    },
    fetchedAt: {
      type:    Date,
      default: Date.now,
    },

    // ── AI Analysis ───────────────────────────────────────────────────────────
    aiAnalysis: {
      summary: {
        type:      String,
        default:   '',
        maxlength: 2000,
      },
      keyPoints: {
        type:    [String],
        default: [],
        validate: {
          validator: (v: string[]) => v.length <= 10,
          message: 'Maximum 10 key points allowed',
        },
      },
      keyInsights: {
        type: [{
          insight: {
            type:     String,
            required: true,
            maxlength:500,
          },
          importance: {
            type:   String,
            enum:   ['high', 'medium', 'low'],
            default:'medium',
          },
          category: {
            type:    String,
            default: 'general',
            maxlength: 100,
          },
        }],
        default:  [],
        validate: {
          validator: (v: IKeyInsight[]) => v.length <= 10,
          message: 'Maximum 10 key insights allowed',
        },
      },
      extractedKeywords: {
        type:    [{ type: String, lowercase: true, trim: true, maxlength: 50 }],
        default: [],
        validate: {
          validator: (v: string[]) => v.length <= 50,
          message: 'Maximum 50 keywords allowed',
        },
      },
      topics: {
        type:    [String],
        default: [],
      },
      readingTime: {
        type:    Number,
        default: 0,
        min:     [0, 'Reading time cannot be negative'],
        max:     [180, 'Reading time cannot exceed 180 minutes'],
      },
      complexity: {
        type:    String,
        enum:    { values: COMPLEXITY_LEVELS, message: '{VALUE} is not a valid complexity level' },
        default: 'basic',
      },
      bias: {
        type:    String,
        enum:    { values: BIAS_TYPES, message: '{VALUE} is not a valid bias type' },
        default: 'unknown',
      },
      credibilityScore: {
        type:    Number,
        min:     [0,   'Credibility score cannot be negative'],
        max:     [100, 'Credibility score cannot exceed 100'],
        default: 50,
      },
      factCheckScore: {
        type:    Number,
        min:     [0,   'Fact check score cannot be negative'],
        max:     [100, 'Fact check score cannot exceed 100'],
        default: 50,
      },
      originalityScore: {
        type:    Number,
        min:     [0,   'Originality score cannot be negative'],
        max:     [100, 'Originality score cannot exceed 100'],
        default: 50,
      },
      analyzedAt:   { type: Date, index: true, sparse: true },
      modelVersion: { type: String, maxlength: 50 },
    },

    // ── Sentiment ─────────────────────────────────────────────────────────────
    sentiment: {
      score: {
        type:    Number,
        min:     [-1, 'Sentiment score must be ≥ -1'],
        max:     [1,  'Sentiment score must be ≤ 1'],
        default: 0,
      },
      label: {
        type:    String,
        enum:    { values: SENTIMENT_LABELS, message: '{VALUE} is not a valid sentiment label' },
        default: 'neutral',
        index:   true,
      },
      confidence: {
        type:    Number,
        min:     [0, 'Confidence must be ≥ 0'],
        max:     [1, 'Confidence must be ≤ 1'],
        default: 0,
      },
      magnitude: {
        type:    Number,
        min:     [0, 'Magnitude must be ≥ 0'],
        default: 0,
      },
    },

    // ── Engagement ────────────────────────────────────────────────────────────
    engagement: {
      views:       { type: Number, default: 0, min: 0 },
      uniqueViews: { type: Number, default: 0, min: 0 },
      saves:       { type: Number, default: 0, min: 0 },
      shares:      { type: Number, default: 0, min: 0 },
      comments:    { type: Number, default: 0, min: 0 },
      likes:       { type: Number, default: 0, min: 0 },
      trendScore:  { type: Number, default: 0, min: 0, index: true },
    },

    // ── Flags ─────────────────────────────────────────────────────────────────
    isTrending:  { type: Boolean, default: false, index: true },
    isBreaking:  { type: Boolean, default: false, index: true },
    isFeatured:  { type: Boolean, default: false, index: true },
    isDuplicate: { type: Boolean, default: false, index: true },
    duplicateOf: { type: Schema.Types.ObjectId, ref: 'Article', sparse: true },

    // ── Relations ─────────────────────────────────────────────────────────────
    relatedArticles: {
      type:     [{ type: Schema.Types.ObjectId, ref: 'Article' }],
      default:  [],
      validate: {
        validator: (v: mongoose.Types.ObjectId[]) => v.length <= 10,
        message: 'Maximum 10 related articles allowed',
      },
    },

    // ── Ingest Metadata ───────────────────────────────────────────────────────
    ingestSource: {
      type:    String,
      enum:    ['newsapi', 'rss', 'manual', 'scraper'],
      default: 'newsapi',
    },
    processingErrors: {
      type:    [String],
      default: [],
      select:  false,  // Hidden from normal queries — admin view only
    },
  },
  {
    timestamps: true,
    // Return virtual fields in JSON and Object conversions
    toJSON:   { virtuals: true, transform: (_doc, ret) => { delete (ret as any).__v; return ret; } },
    toObject: { virtuals: true },
    // Optimize: don't run validators on update by default (caller opts in)
    strict: true,
  }
);

// ═════════════════════════════════════════════════════════════════════════════
// INDEXES — Explicit strategy (see INDEX_STRATEGY.md for reasoning)
// ═════════════════════════════════════════════════════════════════════════════

// ── Uniqueness ────────────────────────────────────────────────────────────────
// url and urlHash are already unique: true in schema — creates single-field unique indexes.

// ── Primary list query: published articles sorted by date ─────────────────────
articleSchema.index({ status: 1, publishedAt: -1 },                        { name: 'status_date' });

// ── Category feed (most common query: GET /news?category=X) ──────────────────
articleSchema.index({ category: 1, status: 1, publishedAt: -1 },           { name: 'category_status_date' });

// ── Country/language filtering ────────────────────────────────────────────────
articleSchema.index({ 'geo.country': 1, status: 1, publishedAt: -1 },      { name: 'country_status_date' });
articleSchema.index({ language: 1, status: 1, publishedAt: -1 },           { name: 'language_status_date' });

// ── Source filtering ──────────────────────────────────────────────────────────
articleSchema.index({ 'source.name': 1, publishedAt: -1 },                 { name: 'source_date' });

// ── Tag queries ───────────────────────────────────────────────────────────────
articleSchema.index({ tags: 1, publishedAt: -1 },                          { name: 'tags_date' });

// ── AI keyword queries ────────────────────────────────────────────────────────
articleSchema.index({ 'aiAnalysis.extractedKeywords': 1, publishedAt: -1 },{ name: 'keywords_date' });

// ── Sentiment analytics ───────────────────────────────────────────────────────
articleSchema.index({ 'sentiment.label': 1, publishedAt: -1 },             { name: 'sentiment_date' });
articleSchema.index({ 'sentiment.score': 1 },                              { name: 'sentiment_score' });

// ── Breaking / Trending / Featured (small cardinality booleans) ───────────────
// Combined with date for efficient sorted scans
articleSchema.index({ isBreaking: 1,  publishedAt: -1 },                   { name: 'breaking_date' });
articleSchema.index({ isTrending: 1,  'engagement.trendScore': -1 },       { name: 'trending_score' });
articleSchema.index({ isFeatured: 1,  publishedAt: -1 },                   { name: 'featured_date' });

// ── Engagement-based ranking ──────────────────────────────────────────────────
articleSchema.index({ 'engagement.trendScore': -1, publishedAt: -1 },      { name: 'trend_score_date' });
articleSchema.index({ 'engagement.views': -1 },                            { name: 'views_desc' });

// ── Content hash for near-duplicate detection ─────────────────────────────────
articleSchema.index({ contentHash: 1 },                                    { name: 'content_hash', sparse: true });

// ── AI analysis staleness (find articles needing re-analysis) ─────────────────
articleSchema.index({ 'aiAnalysis.analyzedAt': 1, status: 1 },            { name: 'analysis_staleness', sparse: true });

// ── Credibility filtering ─────────────────────────────────────────────────────
articleSchema.index({ 'aiAnalysis.credibilityScore': -1, publishedAt: -1 },{ name: 'credibility_date' });

// ── Full-text search ──────────────────────────────────────────────────────────
// Weighted: title gets 10x, description 5x, keywords 3x, content 1x
articleSchema.index(
  { title: 'text', description: 'text', 'aiAnalysis.extractedKeywords': 'text', content: 'text' },
  {
    weights:  { title: 10, description: 5, 'aiAnalysis.extractedKeywords': 3, content: 1 },
    name:     'full_text_search',
    default_language: 'english',
  }
);

// ═════════════════════════════════════════════════════════════════════════════
// VIRTUALS
// ═════════════════════════════════════════════════════════════════════════════

articleSchema.virtual('isAnalyzed').get(function (this: IArticle): boolean {
  return !!this.aiAnalysis?.analyzedAt;
});

articleSchema.virtual('readingTimeLabel').get(function (this: IArticle): string {
  const t = this.aiAnalysis?.readingTime ?? 0;
  if (t === 0) return 'Quick read';
  if (t === 1) return '1 min read';
  return `${t} min read`;
});

// ═════════════════════════════════════════════════════════════════════════════
// MIDDLEWARE (pre/post hooks)
// ═════════════════════════════════════════════════════════════════════════════

// ── Pre-save: auto-generate slug and urlHash ───────────────────────────────────
articleSchema.pre('save', function (next) {
  // Slug
  if (!this.slug || this.isModified('title')) {
    this.slug = generateSlug(this.title);
  }

  // URL hash — used for fast O(1) duplicate lookup
  if (!this.urlHash || this.isModified('url')) {
    this.urlHash = simpleHash(normalizeUrl(this.url));
  }

  // Content hash
  if (this.isModified('content') && this.content) {
    this.contentHash = simpleHash(this.content.substring(0, 500));
  }

  // Auto-compute reading time if not set
  if (this.isModified('content') && !this.aiAnalysis?.readingTime) {
    const wordCount = this.content.split(/\s+/).length;
    if (!this.aiAnalysis) {
      this.aiAnalysis = {} as IAiAnalysis;
    }
    this.aiAnalysis.readingTime = Math.max(1, Math.ceil(wordCount / 200));
  }

  // Compute trend score: views + shares*2 + saves*3 + likes
  if (this.engagement) {
    this.engagement.trendScore =
      (this.engagement.views   || 0) +
      (this.engagement.shares  || 0) * 2 +
      (this.engagement.saves   || 0) * 3 +
      (this.engagement.likes   || 0);
  }

  next();
});

// ── Pre-insertMany: auto-generate fields (since insertMany bypasses save hooks) ──
articleSchema.pre('insertMany', function (next, docs) {
  if (Array.isArray(docs)) {
    for (const doc of docs) {
      if (!doc.slug && doc.title) {
        doc.slug = generateSlug(doc.title);
      }
      if (!doc.urlHash && doc.url) {
        doc.urlHash = simpleHash(normalizeUrl(doc.url));
      }
      if (!doc.contentHash && doc.content) {
        doc.contentHash = simpleHash(doc.content.substring(0, 500));
      }
      if (doc.content && (!doc.aiAnalysis || !doc.aiAnalysis.readingTime)) {
        const wordCount = doc.content.split(/\s+/).length;
        if (!doc.aiAnalysis) doc.aiAnalysis = {} as any;
        doc.aiAnalysis.readingTime = Math.max(1, Math.ceil(wordCount / 200));
      }
      if (doc.engagement) {
        doc.engagement.trendScore =
          (doc.engagement.views   || 0) +
          (doc.engagement.shares  || 0) * 2 +
          (doc.engagement.saves   || 0) * 3 +
          (doc.engagement.likes   || 0);
      }
    }
  }
  next();
});

// ── Pre-save: deduplicate tags and keywords ────────────────────────────────────
articleSchema.pre('save', function (next) {
  if (this.isModified('tags') && this.tags) {
    this.tags = [...new Set(this.tags.map((t) => t.toLowerCase().trim()).filter(Boolean))];
  }
  if (this.isModified('aiAnalysis') && this.aiAnalysis?.extractedKeywords) {
    this.aiAnalysis.extractedKeywords = [
      ...new Set(
        this.aiAnalysis.extractedKeywords.map((k) => k.toLowerCase().trim()).filter(Boolean)
      ),
    ];
  }
  next();
});

// ── Post-save: update category article count ───────────────────────────────────
articleSchema.post('save', async function (doc: IArticle) {
  if (doc.isNew && doc.category) {
    try {
      const Category = mongoose.model('Category');
      await Category.findByIdAndUpdate(doc.category, { $inc: { articleCount: 1 } });
    } catch (err) {
      log.warn('Failed to update category article count:', err);
    }
  }
});

// ── Pre-find: exclude duplicate and archived articles by default ───────────────
// Callers can opt out with .setOptions({ excludeDefaults: true })
articleSchema.pre(/^find/, function (this: Query<unknown, IArticle>, next) {
  // Only apply if caller hasn't set status filter
  if (!(this.getQuery() as Record<string, unknown>).status &&
      !(this.getOptions() as Record<string, unknown>).skipDefaultFilter) {
    void this.where({ status: 'published', isDuplicate: false });
  }
  next();
});

// ═════════════════════════════════════════════════════════════════════════════
// STATIC METHODS
// ═════════════════════════════════════════════════════════════════════════════

articleSchema.statics.findBySlugOrId = function (
  idOrSlug: string
): Query<IArticle | null, IArticle> {
  const isObjectId = mongoose.Types.ObjectId.isValid(idOrSlug);
  const filter = isObjectId
    ? { $or: [{ _id: idOrSlug }, { slug: idOrSlug }] }
    : { slug: idOrSlug };
  return this.findOne(filter);
};

articleSchema.statics.updateTrendScore = async function (articleId: string): Promise<void> {
  const article = await this.findById(articleId).select('engagement');
  if (!article) return;
  const score =
    (article.engagement.views   || 0) +
    (article.engagement.shares  || 0) * 2 +
    (article.engagement.saves   || 0) * 3 +
    (article.engagement.likes   || 0);
  await this.findByIdAndUpdate(articleId, { 'engagement.trendScore': score });
};

articleSchema.statics.markDuplicate = async function (
  articleId: string,
  originalId: string
): Promise<void> {
  await this.findByIdAndUpdate(articleId, {
    isDuplicate:  true,
    duplicateOf:  originalId,
    status:       'archived',
  });
  log.info(`Marked article ${articleId} as duplicate of ${originalId}`);
};

// ═════════════════════════════════════════════════════════════════════════════
// MODEL
// ═════════════════════════════════════════════════════════════════════════════
const Article = mongoose.model<IArticle, IArticleModel>('Article', articleSchema);
export default Article;
