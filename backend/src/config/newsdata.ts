/**
 * @module config/newsdata
 * @description Axios instance pre-configured for the NewsData.io REST API.
 *
 * Handles:
 *  - Base URL and default params
 *  - Request / response interceptors
 *  - Automatic API-key injection
 *  - Rate-limit response detection (402, 429)
 *  - Structured request logging
 */

import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from 'axios';
import { env } from './env';
import { createLogger } from '../utils/logger';

const log = createLogger('NewsDataClient');

// ─── Axios Instance ────────────────────────────────────────────────────────────
export const newsdataClient: AxiosInstance = axios.create({
  baseURL: env.NEWSDATA_BASE_URL,
  timeout: env.NEWSDATA_TIMEOUT_MS,
  headers: {
    'Accept':       'application/json',
    'Content-Type': 'application/json',
    'User-Agent':   'NewsIntel/1.0 (+https://github.com/newsintel)',
  },
  // Keep-alive for connection reuse across paginated requests
  httpAgent:  new (require('http').Agent)({ keepAlive: true }),
  httpsAgent: new (require('https').Agent)({ keepAlive: true }),
});

// ─── Request Interceptor ──────────────────────────────────────────────────────
// Auto-injects API key as query param (NewsData.io uses ?apikey= not Bearer)
newsdataClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    config.params = {
      apikey: env.NEWSDATA_API_KEY,
      ...config.params,
    };

    log.debug(`→ ${config.method?.toUpperCase() ?? 'GET'} ${config.url ?? ''}`, {
      params: { ...config.params, apikey: '***' }, // mask key in logs
    });

    // Attach request start time for duration logging
    (config as InternalAxiosRequestConfig & { _startTime?: number })._startTime = Date.now();
    return config;
  },
  (error: AxiosError) => {
    log.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// ─── Response Interceptor ─────────────────────────────────────────────────────
newsdataClient.interceptors.response.use(
  (response: AxiosResponse) => {
    const cfg = response.config as InternalAxiosRequestConfig & { _startTime?: number };
    const duration = cfg._startTime ? Date.now() - cfg._startTime : 0;

    log.debug(`← ${response.status} ${response.config.url ?? ''} (${duration}ms)`, {
      resultsCount: (response.data as { totalResults?: number }).totalResults,
    });

    return response;
  },
  (error: AxiosError) => {
    const status   = error.response?.status;
    const data     = error.response?.data as Record<string, unknown> | undefined;
    const message  = (data?.message as string | undefined) ?? error.message;

    // ── Classify the error for caller to act on ─────────────────────────────
    if (status === 401 || status === 403) {
      log.error(`NewsData.io auth failure (${status}): ${message} — check NEWSDATA_API_KEY`);
    } else if (status === 402) {
      log.warn('NewsData.io plan limit reached (402) — upgrade required or wait for reset');
    } else if (status === 429) {
      const retryAfter = error.response?.headers['retry-after'] as string | undefined;
      log.warn(`NewsData.io rate limited (429) — retry after ${retryAfter ?? 'unknown'} seconds`);
    } else if (status && status >= 500) {
      log.error(`NewsData.io server error (${status}): ${message}`);
    } else if (error.code === 'ECONNABORTED') {
      log.warn(`NewsData.io timeout after ${env.NEWSDATA_TIMEOUT_MS}ms`);
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      log.error(`NewsData.io unreachable: ${error.code}`);
    } else {
      log.warn(`NewsData.io request failed: ${message}`);
    }

    return Promise.reject(error);
  }
);

// ─── NewsData.io API Response Types ───────────────────────────────────────────
export interface NewsDataArticleRaw {
  article_id:       string;
  title?:           string;
  link?:            string;
  keywords?:        string[] | null;
  creator?:         string[] | null;
  video_url?:       string | null;
  description?:     string | null;
  content?:         string | null;
  pubDate?:         string | null;
  image_url?:       string | null;
  source_id?:       string;
  source_name?:     string;
  source_url?:      string;
  source_icon?:     string;
  source_priority?: number;
  country?:         string[] | null;
  category?:        string[] | null;
  language?:        string | null;
  ai_tag?:          string | null;
  sentiment?:       string | null;
  sentiment_stats?: {
    positive?: number;
    negative?: number;
    neutral?:  number;
  } | null;
  ai_region?:       string | null;
  ai_org?:          string[] | null;
  duplicate?:       boolean;
}

export interface NewsDataResponse {
  status:        'success' | 'error';
  totalResults?: number;
  results?:      NewsDataArticleRaw[];
  nextPage?:     string | null;   // cursor token for pagination
  code?:         string;
  message?:      string;
}

export interface NewsDataFetchParams {
  language?:  string;       // 'en', 'ar', etc.
  country?:   string;       // 'us', 'gb', etc.
  category?:  string;       // 'top', 'technology', 'business', etc.
  q?:         string;       // keyword search
  page?:      string;       // cursor (nextPage token)
  timeframe?: number;       // hours back to fetch (1–48)
  size?:      number;       // results per page (max 10 on free, 50 on paid)
  prioritydomain?: 'top' | 'medium' | 'low';
  excludedomain?:  string;  // comma-separated domains to exclude
  domainurl?:      string;  // filter by domain
}
