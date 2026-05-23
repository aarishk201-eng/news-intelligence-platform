/**
 * @model Source
 * @description Standalone source registry — denormalizes trusted source metadata
 * so Article.source embeds a snapshot while this collection tracks the canonical record.
 * Enables source-level analytics, credibility tracking, and RSS feed management.
 */
import mongoose, { Document, Schema } from 'mongoose';

export interface ISource extends Document {
  _id:         mongoose.Types.ObjectId;
  name:        string;
  slug:        string;
  url:         string;
  apiId?:      string;       // NewsAPI source ID
  logo?:       string;
  country:     string;
  language:    string;
  category:    mongoose.Types.ObjectId;
  isActive:    boolean;
  isVerified:  boolean;
  isTrusted:   boolean;
  credibilityScore: number; // 0–100, manually reviewed
  bias:        string;
  rssFeeds:    string[];    // RSS URLs to poll
  fetchInterval: number;   // minutes between fetches
  lastFetchedAt?: Date;
  totalArticles:  number;
  stats: {
    avgCredibility: number;
    avgSentimentScore: number;
    articlesLast30Days: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const sourceSchema = new Schema<ISource>(
  {
    name: {
      type:      String,
      required:  [true, 'Source name is required'],
      unique:    true,
      trim:      true,
      maxlength: 200,
    },
    slug: { type: String, unique: true, lowercase: true, trim: true },
    url: {
      type:     String,
      required: [true, 'Source URL is required'],
      unique:   true,
      validate: {
        validator: (v: string) => { try { new URL(v); return true; } catch { return false; } },
        message: 'Source URL must be a valid URL',
      },
    },
    apiId:    { type: String, trim: true, sparse: true, index: true },
    logo:     { type: String },
    country: {
      type:      String,
      required:  [true, 'Country is required'],
      uppercase: true,
      maxlength: 2,
      default:   'US',
    },
    language: { type: String, lowercase: true, default: 'en', maxlength: 10 },
    category: { type: Schema.Types.ObjectId, ref: 'Category', index: true },
    isActive:   { type: Boolean, default: true, index: true },
    isVerified: { type: Boolean, default: false },
    isTrusted:  { type: Boolean, default: false, index: true },
    credibilityScore: {
      type: Number, min: 0, max: 100, default: 50,
    },
    bias: {
      type: String,
      enum: ['left', 'center-left', 'center', 'center-right', 'right', 'unknown'],
      default: 'unknown',
    },
    rssFeeds:      { type: [String], default: [] },
    fetchInterval: { type: Number, default: 30, min: 5 }, // minutes
    lastFetchedAt: { type: Date, index: true, sparse: true },
    totalArticles: { type: Number, default: 0 },
    stats: {
      avgCredibility:      { type: Number, default: 0 },
      avgSentimentScore:   { type: Number, default: 0 },
      articlesLast30Days:  { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, transform: (_doc, ret) => { delete (ret as any).__v; return ret; } },
  }
);

sourceSchema.index({ country: 1, isActive: 1 },   { name: 'country_active' });
sourceSchema.index({ language: 1, isActive: 1 },  { name: 'lang_active' });
sourceSchema.index({ credibilityScore: -1 },       { name: 'credibility_desc' });
sourceSchema.index({ lastFetchedAt: 1, isActive: 1, fetchInterval: 1 }, { name: 'fetch_due' });

sourceSchema.pre('save', function (next) {
  if (!this.slug || this.isModified('name')) {
    this.slug = this.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }
  next();
});

const Source = mongoose.model<ISource>('Source', sourceSchema);
export default Source;
