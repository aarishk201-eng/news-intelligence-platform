/**
 * @module types/index
 * @description Shared TypeScript types and interfaces used across the backend.
 */

import { Request } from 'express';
import { IUser } from '../models/User.model';
import mongoose from 'mongoose';

// ─── Auth ──────────────────────────────────────────────────────────────────────
export interface AuthRequest extends Request {
  user?: IUser;
  requestId?: string;
}

// ─── Pagination ────────────────────────────────────────────────────────────────
export interface PaginationOptions {
  page: number;
  limit: number;
  skip: number;
}

export interface PaginationResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// ─── Query ────────────────────────────────────────────────────────────────────
export interface BaseQueryString {
  page?: string;
  limit?: string;
  sort?: string;
  fields?: string;
  search?: string;
  language?: string;
  [key: string]: string | undefined;
}

export interface ArticleQueryString extends BaseQueryString {
  category?: string;
  source?: string;
  tags?: string;
  isTrending?: string;
  isBreaking?: string;
  isFeatured?: string;
  'sentiment.label'?: string;
}

// ─── API Response ─────────────────────────────────────────────────────────────
export interface ApiSuccessResponse<T = unknown> {
  success: true;
  message: string;
  data?: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    hasNextPage?: boolean;
    hasPrevPage?: boolean;
  };
  timestamp: string;
}

export interface ApiErrorResponse {
  success: false;
  status: 'fail' | 'error';
  message: string;
  requestId?: string;
  errors?: { field: string; message: string }[];
  stack?: string;
  timestamp: string;
}

// ─── Service Layer ─────────────────────────────────────────────────────────────
export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ─── AI Types ─────────────────────────────────────────────────────────────────
export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ArticleAnalysisResult {
  summary: string;
  keyPoints: string[];
  sentiment: {
    score: number;
    label: 'positive' | 'negative' | 'neutral';
    confidence: number;
  };
  readingTime: number;
  complexity: 'basic' | 'intermediate' | 'advanced';
  credibilityScore: number;
  bias?: string;
  tags: string[];
}

// ─── Mongoose Helpers ─────────────────────────────────────────────────────────
export type MongoId = mongoose.Types.ObjectId;
export type WithId<T> = T & { _id: MongoId };

// ─── JWT Payload ──────────────────────────────────────────────────────────────
export interface JwtPayload {
  id: string;
  role: string;
  iat: number;
  exp: number;
}

export interface JwtRefreshPayload {
  id: string;
  iat: number;
  exp: number;
}

// ─── News Ingestion ───────────────────────────────────────────────────────────
export interface NewsApiArticleRaw {
  title?: string;
  description?: string;
  content?: string;
  url?: string;
  urlToImage?: string;
  author?: string;
  publishedAt?: string;
  source?: { id?: string; name?: string };
}

export interface IngestionResult {
  apiArticles: number;
  rssArticles: number;
  total: number;
  errors: string[];
}

// ─── Redis ────────────────────────────────────────────────────────────────────
export interface CacheOptions {
  ttl?: number;    // seconds
  compress?: boolean;
}

// ─── User Preferences ─────────────────────────────────────────────────────────
export interface UserPreferences {
  categories: string[];
  sources: string[];
  language: string;
  darkMode: boolean;
  emailDigest: 'daily' | 'weekly' | 'never';
}
