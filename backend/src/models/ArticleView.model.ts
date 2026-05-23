/**
 * @model ArticleView
 * @description Time-series collection tracking individual article view events.
 * Kept separate from Article to avoid high-write contention on the main collection.
 * Aggregated periodically into Article.engagement via a background job.
 *
 * Design: Write-optimized — minimal fields, no complex hooks.
 */
import mongoose, { Document, Schema } from 'mongoose';

export interface IArticleView extends Document {
  article:   mongoose.Types.ObjectId;
  user?:     mongoose.Types.ObjectId;     // null for anonymous
  sessionId: string;                       // fingerprint anonymous sessions
  ip?:       string;
  userAgent?: string;
  referrer?:  string;
  country?:   string;
  duration?:  number;                      // seconds spent on article
  isUnique:   boolean;                     // first view in 24h from this sessionId
  viewedAt:   Date;
}

const articleViewSchema = new Schema<IArticleView>(
  {
    article:   { type: Schema.Types.ObjectId, ref: 'Article', required: true, index: true },
    user:      { type: Schema.Types.ObjectId, ref: 'User',    index: true,    sparse: true },
    sessionId: { type: String, required: true, maxlength: 128 },
    ip:        { type: String, select: false },  // PII — not returned by default
    userAgent: { type: String, maxlength: 500, select: false },
    referrer:  { type: String, maxlength: 500 },
    country:   { type: String, uppercase: true, maxlength: 2 },
    duration:  { type: Number, min: 0 },
    isUnique:  { type: Boolean, default: false, index: true },
    viewedAt:  { type: Date,   default: Date.now, index: true },
  },
  {
    timestamps: false,   // Use viewedAt instead of createdAt/updatedAt
    versionKey: false,   // No __v — high write volume
    // TTL: auto-delete raw view events after 90 days (aggregated data stays in Article)
  }
);

// ── Indexes ────────────────────────────────────────────────────────────────────
articleViewSchema.index({ article: 1, viewedAt: -1 },          { name: 'article_views_time' });
articleViewSchema.index({ article: 1, isUnique: 1, viewedAt: -1 }, { name: 'article_unique_views' });
articleViewSchema.index({ viewedAt: 1 },                        { name: 'ttl_cleanup', expireAfterSeconds: 90 * 24 * 3600 });
articleViewSchema.index({ article: 1, sessionId: 1, viewedAt: -1 }, { name: 'dedup_check', unique: false });

const ArticleView = mongoose.model<IArticleView>('ArticleView', articleViewSchema);
export default ArticleView;
