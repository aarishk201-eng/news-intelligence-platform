/**
 * @module services/ai.service
 * @description Production AI service — single source of truth for all OpenAI calls.
 *
 * Architecture:
 *  ┌─────────────────────────────────────────────────────────────────────┐
 *  │  analyzeArticle()      — Full intelligence pipeline (1 API call)    │
 *  │  generateBriefing()    — Personalized executive briefing            │
 *  │  chatWithNewsAI()      — Conversational assistant                   │
 *  │  extractTrendingTopics()— Trending topic extraction                 │
 *  │  batchAnalyzeArticles()— Process multiple articles efficiently      │
 *  └─────────────────────────────────────────────────────────────────────┘
 *
 * Cost optimizations:
 *  - Cache-aside: SHA-256 keyed, 24h TTL for analysis, 1h for trending
 *  - Content pre-truncation before API call (enforced by prompt library)
 *  - Minimal system prompt reuse across conversation turns
 *  - gpt-4o-mini by default (~40× cheaper than gpt-4o with 90%+ quality)
 *  - response_format: json_object eliminates JSON explanation tokens
 *  - Token tracking on every call for cost visibility
 */

import crypto from 'crypto';
import OpenAI from 'openai';
import { openaiClient, AI_CONFIG, assertAiEnabled, trackUsage, trackError } from '../config/openai';
import { cacheGet, cacheSet } from '../config/redis';
import { withRetry } from '../utils/retryHandler';
import { createLogger } from '../utils/logger';
import { AppError } from '../utils/AppError';
import {
  ANALYSIS_SYSTEM_PROMPT,
  BRIEFING_SYSTEM_PROMPT,
  TRENDING_SYSTEM_PROMPT,
  buildAnalysisPrompt,
  buildBriefingPrompt,
  buildTrendingPrompt,
  buildChatSystemPrompt,
  TOKEN_BUDGETS,
} from './ai.prompts';
import {
  extractJson,
  validateAnalysisResponse,
  validateTrendingResponse,
  ArticleAnalysisResult,
} from './ai.validator';

const log = createLogger('AiService');

// ─── Cache TTLs ────────────────────────────────────────────────────────────────
const CACHE_TTL = {
  ANALYSIS:  86_400,     // 24 hours — analysis is stable
  BRIEFING:  1_800,      // 30 minutes — briefings should be fresh-ish
  TRENDING:  3_600,      // 1 hour
  CHAT:      0,          // No caching for conversational context
} as const;

// ─── Content fingerprint for cache keys ───────────────────────────────────────
const fingerprint = (text: string): string =>
  crypto.createHash('sha256').update(text).digest('hex').substring(0, 20);

// ─── Core OpenAI caller ───────────────────────────────────────────────────────
interface CallOptions {
  systemPrompt:  string;
  userPrompt:    string;
  maxTokens:     number;
  temperature:   number;
  jsonMode?:     boolean;   // response_format: json_object
  operationName: string;    // for logs
}

const callOpenAI = async (opts: CallOptions): Promise<string> => {
  assertAiEnabled();

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: opts.systemPrompt },
    { role: 'user',   content: opts.userPrompt   },
  ];

  const response = await withRetry(
    () => openaiClient.chat.completions.create({
      model:       AI_CONFIG.model,
      messages,
      max_tokens:  opts.maxTokens,
      temperature: opts.temperature,
      ...(opts.jsonMode && { response_format: { type: 'json_object' } }),
    }),
    {
      maxRetries:  3,
      baseDelayMs: 1_000,
      maxDelayMs:  15_000,
      jitterFactor: 0.4,
      shouldRetry: (err) => {
        // Retry on rate limit and server errors; abort on auth/billing/context errors
        const status = (err as { status?: number }).status;
        if (status === 400) return false;  // Bad request (e.g. context length exceeded)
        if (status === 401) return false;  // Invalid API key
        if (status === 402) return false;  // Billing issue
        if (status === 403) return false;  // Forbidden
        if (status === 429) return true;   // Rate limit — retry with backoff
        if (status && status >= 500) return true;  // OpenAI server error
        if ((err as { code?: string }).code === 'ECONNABORTED') return true; // Timeout
        return true;
      },
      onRetry: (attempt, delay, err) => {
        log.warn(`[${opts.operationName}] retry #${attempt} in ${delay}ms — ${(err as Error).message}`);
        trackError();
      },
    }
  );

  const usage = response.usage;
  if (usage) {
    trackUsage(usage.prompt_tokens, usage.completion_tokens);
  }

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('OpenAI returned empty content');

  log.debug(`[${opts.operationName}] tokens: ${usage?.prompt_tokens ?? '?'}in / ${usage?.completion_tokens ?? '?'}out`);

  return content;
};

// ═════════════════════════════════════════════════════════════════════════════
// 1. ARTICLE ANALYSIS
// ═════════════════════════════════════════════════════════════════════════════
/**
 * Analyzes a news article using a single optimized prompt.
 *
 * Returns: summary, sentiment, keyInsights, keywords, keyPoints,
 *          readingTime, complexity, credibilityScore, bias, topics
 *
 * Cost: ~$0.0004 per article at gpt-4o-mini pricing.
 * Cached: 24 hours by content fingerprint.
 */
export const analyzeArticle = async (
  title: string,
  description: string,
  content: string
): Promise<ArticleAnalysisResult> => {
  // Cache key = fingerprint of first 1000 chars of combined input
  const cacheKey = `ai:v2:analysis:${fingerprint(title + content.substring(0, 1000))}`;
  const cached = await cacheGet<ArticleAnalysisResult>(cacheKey);
  if (cached) {
    log.debug(`Cache hit: article analysis [${title.substring(0, 40)}...]`);
    return cached;
  }

  const userPrompt   = buildAnalysisPrompt(title, description, content);
  const rawContent   = await callOpenAI({
    systemPrompt: ANALYSIS_SYSTEM_PROMPT,
    userPrompt,
    maxTokens:    TOKEN_BUDGETS.ANALYSIS_OUTPUT,
    temperature:  0.2,   // Low temperature for factual extraction
    jsonMode:     true,
    operationName: 'analyzeArticle',
  });

  // Parse + validate
  const parsed     = extractJson(rawContent);
  const validation = validateAnalysisResponse(parsed);

  if (!validation.isValid) {
    log.warn(`Analysis validation failed for "${title.substring(0, 60)}" — using degraded result`, {
      errors: validation.errors.filter((e) => !e.fixed),
    });
  } else if (validation.errors.length > 0) {
    log.debug(`Analysis auto-corrected ${validation.errors.filter((e) => e.fixed).length} field(s)`, {
      title: title.substring(0, 60),
    });
  }

  const result = validation.data;
  await cacheSet(cacheKey, result, CACHE_TTL.ANALYSIS);

  return result;
};

// ═════════════════════════════════════════════════════════════════════════════
// 2. DAILY BRIEFING
// ═════════════════════════════════════════════════════════════════════════════
/**
 * Generates a personalized executive news briefing from recent article metadata.
 * Does NOT pass full article content — uses title + AI summary only (cost saving).
 * Falls back to a local summary if the AI API is unavailable (rate limit, etc).
 */

// Build a smart local briefing from article titles when AI is unavailable
const buildLocalBriefing = (
  articles: Array<{ title: string; description: string; category?: string }>
): string => {
  const byCategory: Record<string, string[]> = {};
  for (const a of articles.slice(0, 15)) {
    const cat = a.category ?? 'General';
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(a.title);
  }
  const categories = Object.entries(byCategory).slice(0, 4);
  const now = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  let briefing = `### Executive Briefing — ${now}\n\n**Key Developments:**\n\n`;
  categories.forEach(([cat, titles], i) => {
    briefing += `${i + 1}. **${cat}:** ${titles[0]}`;
    if (titles[1]) briefing += `. Also: ${titles[1]}`;
    briefing += '.\n';
  });
  briefing += `\n**Today's Snapshot:** ${articles.length} articles tracked across ${Object.keys(byCategory).length} categories.`;
  return briefing;
};

export const generateBriefing = async (
  articles: Array<{ title: string; description: string; category?: string }>
): Promise<string> => {
  if (articles.length === 0) return 'No recent articles available for briefing.';

  const cacheKey = `ai:v2:briefing:${fingerprint(articles.map((a) => a.title).join('|'))}`;
  const cached = await cacheGet<string>(cacheKey);
  if (cached) return cached;

  const articleLines = articles
    .slice(0, 15)
    .map((a, i) => {
      const cat = a.category ? ` [${a.category}]` : '';
      return `${i + 1}.${cat} ${a.title}: ${a.description.substring(0, 150).trim()}`;
    });

  const userPrompt = buildBriefingPrompt(articleLines);

  try {
    const briefing = await callOpenAI({
      systemPrompt:  BRIEFING_SYSTEM_PROMPT,
      userPrompt,
      maxTokens:     TOKEN_BUDGETS.BRIEFING_OUTPUT,
      temperature:   0.5,
      jsonMode:      false,
      operationName: 'generateBriefing',
    });
    const cleaned = briefing.trim();
    await cacheSet(cacheKey, cleaned, CACHE_TTL.BRIEFING);
    return cleaned;
  } catch (err) {
    // AI unavailable (rate limit / key issue) — generate a smart local briefing
    log.warn('AI briefing failed — using local fallback:', (err as Error).message);
    const fallback = buildLocalBriefing(articles);
    await cacheSet(cacheKey, fallback, 600); // cache 10 min, retry AI sooner
    return fallback;
  }
};

// Backward-compat alias used by existing controller
export const generateNewsSummary = generateBriefing;

// ═════════════════════════════════════════════════════════════════════════════
// 3. CONVERSATIONAL CHAT
// ═════════════════════════════════════════════════════════════════════════════
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Conversational AI assistant with news context injection.
 *
 * Context injection strategy:
 *  - If articleId context → inject article summary + excerpt (≤1500 chars)
 *  - Otherwise → inject last 10 recent headlines only (minimal tokens)
 */
export const chatWithNewsAI = async (
  message: string,
  history: ChatMessage[],
  context?: string
): Promise<string> => {
  const systemPrompt = buildChatSystemPrompt(context);

  // Trim history: keep last 10 messages to limit context window cost
  const trimmedHistory = history.slice(-10).map((m) => ({
    role:    m.role as 'user' | 'assistant',
    content: m.content.substring(0, 1000), // Cap per-message length
  }));

  assertAiEnabled();

  const response = await withRetry(
    () => openaiClient.chat.completions.create({
      model:       AI_CONFIG.model,
      messages: [
        { role: 'system', content: systemPrompt },
        ...trimmedHistory,
        { role: 'user',   content: message.substring(0, 2000) },
      ],
      max_tokens:  TOKEN_BUDGETS.CHAT_OUTPUT,
      temperature: 0.6,
    }),
    {
      maxRetries:   2,
      baseDelayMs:  800,
      shouldRetry:  (err) => (err as { status?: number }).status === 429,
      operationName: 'chat',
    } as Parameters<typeof withRetry>[1]
  );

  const usage = response.usage;
  if (usage) trackUsage(usage.prompt_tokens, usage.completion_tokens);

  return response.choices[0]?.message?.content?.trim()
    ?? 'I could not generate a response. Please try again.';
};

// ═════════════════════════════════════════════════════════════════════════════
// 4. TRENDING TOPICS
// ═════════════════════════════════════════════════════════════════════════════
/**
 * Extracts trending topics from recent article headlines.
 * Deduplicated and cached for 1 hour.
 */
export const extractTrendingTopics = async (headlines: string[]): Promise<string[]> => {
  if (headlines.length === 0) return [];

  const cacheKey = `ai:v2:trending:${fingerprint(headlines.slice(0, 50).join(''))}`;
  const cached = await cacheGet<string[]>(cacheKey);
  if (cached) return cached;

  const userPrompt = buildTrendingPrompt(headlines);

  const rawContent = await callOpenAI({
    systemPrompt:  TRENDING_SYSTEM_PROMPT,
    userPrompt,
    maxTokens:     TOKEN_BUDGETS.TRENDING_OUTPUT,
    temperature:   0.15,
    jsonMode:      true,
    operationName: 'extractTrendingTopics',
  });

  let topics: string[] = [];
  try {
    const parsed = extractJson(rawContent);
    topics = validateTrendingResponse(parsed);
  } catch (err) {
    log.warn('Trending topics parse failed — returning empty list:', err);
    return [];
  }

  await cacheSet(cacheKey, topics, CACHE_TTL.TRENDING);
  return topics;
};

// Backward-compat alias
export const getTrendingTopics = extractTrendingTopics;

// ═════════════════════════════════════════════════════════════════════════════
// 5. BATCH ANALYSIS
// ═════════════════════════════════════════════════════════════════════════════
export interface BatchAnalysisResult {
  articleId:    string;
  analysis?:    ArticleAnalysisResult;
  error?:       string;
  fromCache:    boolean;
  durationMs:   number;
}

/**
 * Analyzes multiple articles with controlled concurrency.
 * Designed for post-ingestion processing — not for real-time requests.
 *
 * Concurrency: 3 simultaneous calls (respects 3 RPM on free tier,
 * increase to 10 for Tier 1 and above).
 */
export const batchAnalyzeArticles = async (
  articles: Array<{ id: string; title: string; description: string; content: string }>,
  concurrency = 3
): Promise<BatchAnalysisResult[]> => {
  if (!AI_CONFIG.enabled) {
    log.warn('AI disabled — skipping batch analysis');
    return articles.map((a) => ({
      articleId: a.id, error: 'AI disabled', fromCache: false, durationMs: 0,
    }));
  }

  const results: BatchAnalysisResult[] = [];
  const queue   = [...articles];

  const worker = async (): Promise<void> => {
    while (queue.length > 0) {
      const article = queue.shift();
      if (!article) break;

      const start   = Date.now();
      let fromCache = false;

      try {
        // Check cache first without making an API call
        const ck = `ai:v2:analysis:${fingerprint(article.title + article.content.substring(0, 1000))}`;
        const cached = await cacheGet<ArticleAnalysisResult>(ck);
        if (cached) { fromCache = true; }

        const analysis = cached ?? await analyzeArticle(
          article.title, article.description, article.content
        );

        results.push({ articleId: article.id, analysis, fromCache, durationMs: Date.now() - start });
      } catch (err) {
        const msg = (err as Error).message;
        log.warn(`Batch analysis failed for ${article.id}: ${msg}`);
        results.push({ articleId: article.id, error: msg, fromCache: false, durationMs: Date.now() - start });

        // If we're getting auth/billing errors, abort remaining queue
        if ((err as AppError).statusCode === 401 || (err as AppError).statusCode === 402) {
          log.error('Fatal API error — aborting batch analysis');
          queue.length = 0;
        }
      }

      // Small delay between requests to avoid rate limit bursting
      if (queue.length > 0) await new Promise<void>((r) => setTimeout(r, 250));
    }
  };

  const workers = Array.from({ length: concurrency }, worker);
  await Promise.all(workers);

  const success  = results.filter((r) => r.analysis).length;
  const cached   = results.filter((r) => r.fromCache).length;
  const failed   = results.filter((r) => r.error).length;
  log.info(`Batch analysis: ${success} done (${cached} from cache), ${failed} failed`);

  return results;
};
