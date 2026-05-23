/**
 * @model SavedSearch
 * @description Persists user-defined search queries with optional alert settings.
 * Powers the "Saved Searches" and "News Alerts" features.
 */
import mongoose, { Document, Schema } from 'mongoose';

export interface ISavedSearch extends Document {
  _id:     mongoose.Types.ObjectId;
  user:    mongoose.Types.ObjectId;
  name:    string;
  query: {
    text?:       string;
    categories?: mongoose.Types.ObjectId[];
    tags?:       string[];
    sources?:    string[];
    countries?:  string[];
    language?:   string;
    sentiment?:  'positive' | 'negative' | 'neutral';
    dateRange?: {
      from?: Date;
      to?:   Date;
    };
  };
  alert: {
    enabled:     boolean;
    frequency:   'realtime' | 'hourly' | 'daily' | 'weekly';
    lastAlertAt?: Date;
    nextAlertAt?: Date;
  };
  resultCount:  number;
  lastRunAt?:   Date;
  isActive:     boolean;
  createdAt:    Date;
  updatedAt:    Date;
}

const savedSearchSchema = new Schema<ISavedSearch>(
  {
    user: {
      type:     Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'User is required'],
      index:    true,
    },
    name: {
      type:      String,
      required:  [true, 'Search name is required'],
      trim:      true,
      maxlength: 100,
    },
    query: {
      text:       { type: String, trim: true, maxlength: 500 },
      categories: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
      tags:       [{ type: String, lowercase: true, trim: true }],
      sources:    [{ type: String }],
      countries:  [{ type: String, uppercase: true, maxlength: 2 }],
      language:   { type: String, lowercase: true, maxlength: 10 },
      sentiment:  { type: String, enum: ['positive', 'negative', 'neutral'] },
      dateRange: {
        from: { type: Date },
        to:   { type: Date },
      },
    },
    alert: {
      enabled:     { type: Boolean, default: false },
      frequency:   { type: String, enum: ['realtime', 'hourly', 'daily', 'weekly'], default: 'daily' },
      lastAlertAt: { type: Date },
      nextAlertAt: { type: Date, index: true, sparse: true },
    },
    resultCount: { type: Number, default: 0 },
    lastRunAt:   { type: Date, index: true, sparse: true },
    isActive:    { type: Boolean, default: true, index: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, transform: (_doc, ret) => { delete (ret as any).__v; return ret; } },
  }
);

// Per-user search list
savedSearchSchema.index({ user: 1, isActive: 1, createdAt: -1 }, { name: 'user_searches' });
// Alert scheduler: find due alerts efficiently
savedSearchSchema.index({ 'alert.enabled': 1, 'alert.nextAlertAt': 1 }, { name: 'alert_due', sparse: true });
// Duplicate name prevention per user
savedSearchSchema.index({ user: 1, name: 1 }, { name: 'user_name_unique', unique: true });

const SavedSearch = mongoose.model<ISavedSearch>('SavedSearch', savedSearchSchema);
export default SavedSearch;
