/**
 * @module services/ai.validator
 * @description Validates and normalizes raw JSON responses from the OpenAI API.
 *
 * Strategy:
 *  1. Parse JSON (handles markdown-wrapped responses, truncated JSON)
 *  2. Field-by-field type validation with coercion where safe
 *  3. Constraint enforcement (ranges, enum values, array lengths)
 *  4. Safe defaults for missing optional fields
 *  5. Returns a fully-typed, guaranteed-safe object — callers never need to null-check
 */

export interface ArticleAnalysisResult {
  summary:          string;
  sentiment: {
    score:      number;   // -1 to 1
    label:      'positive' | 'negative' | 'neutral';
    confidence: number;   // 0 to 1
  };
  keyInsights: Array<{
    insight:    string;
    importance: 'high' | 'medium' | 'low';
    category:   string;
  }>;
  keywords:     string[];   // 5-8 lowercase
  keyPoints:    string[];   // 3-4 items
  readingTime:  number;     // minutes
  complexity:   'basic' | 'intermediate' | 'advanced';
  credibilityScore: number; // 0-100
  bias:         'left' | 'center-left' | 'center' | 'center-right' | 'right' | 'unknown';
  topics:       string[];
}

export interface ValidationError {
  field:   string;
  issue:   string;
  fixed:   boolean;   // true = we auto-corrected, false = field dropped/defaulted
}

export interface ValidationResult<T> {
  data:    T;
  errors:  ValidationError[];
  isValid: boolean;   // false = critical fields missing, result should be discarded
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const clamp = (v: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, v));

const isNonEmptyString = (v: unknown): v is string =>
  typeof v === 'string' && v.trim().length > 0;

const safeString = (v: unknown, maxLen: number): string =>
  isNonEmptyString(v) ? String(v).trim().substring(0, maxLen) : '';

const safeStringArray = (v: unknown, maxLen: number, maxItems: number): string[] => {
  if (!Array.isArray(v)) return [];
  return v
    .filter(isNonEmptyString)
    .map((s: string) => s.trim().substring(0, maxLen))
    .slice(0, maxItems);
};

const SENTIMENT_LABELS  = new Set(['positive', 'negative', 'neutral']);
const COMPLEXITY_LEVELS = new Set(['basic', 'intermediate', 'advanced']);
const BIAS_TYPES        = new Set(['left', 'center-left', 'center', 'center-right', 'right', 'unknown']);
const IMPORTANCE_LEVELS = new Set(['high', 'medium', 'low']);

// ─── JSON Extractor ───────────────────────────────────────────────────────────
/**
 * Handles cases where the model wraps JSON in markdown code fences,
 * adds trailing text, or returns truncated JSON.
 */
export const extractJson = (raw: string): unknown => {
  if (!raw || raw.trim().length === 0) throw new Error('Empty response');

  let text = raw.trim();

  // Strip markdown code fences: ```json ... ``` or ``` ... ```
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '');

  // Try direct parse first
  try { return JSON.parse(text); } catch { /* fall through */ }

  // Find outermost JSON object
  const start = text.indexOf('{');
  const end   = text.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    try { return JSON.parse(text.substring(start, end + 1)); } catch { /* fall through */ }
  }

  // Attempt to fix truncated JSON by appending closing characters
  // (happens when output token limit is hit mid-stream)
  const truncatedFix = text + '"}]}';
  try { return JSON.parse(truncatedFix); } catch { /* fall through */ }

  throw new Error(`Cannot parse JSON from response: ${text.substring(0, 100)}...`);
};

// ─── Article Analysis Validator ───────────────────────────────────────────────
export const validateAnalysisResponse = (
  raw: unknown
): ValidationResult<ArticleAnalysisResult> => {
  const errors: ValidationError[] = [];
  const obj = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;

  const addError = (field: string, issue: string, fixed: boolean) =>
    errors.push({ field, issue, fixed });

  // ── summary (critical) ────────────────────────────────────────────────────
  let summary = safeString(obj.summary, 500);
  if (!summary) {
    addError('summary', 'Missing or empty', false);
    summary = 'Summary not available.';
  } else if (summary.length < 20) {
    addError('summary', 'Too short (< 20 chars)', true);
  }

  // ── sentiment ─────────────────────────────────────────────────────────────
  const rawSentiment = (obj.sentiment ?? {}) as Record<string, unknown>;
  let sentScore = typeof rawSentiment.score === 'number' ? rawSentiment.score : 0;
  let sentLabel = safeString(rawSentiment.label, 10).toLowerCase();
  let sentConf  = typeof rawSentiment.confidence === 'number' ? rawSentiment.confidence : 0;

  if (!SENTIMENT_LABELS.has(sentLabel)) {
    addError('sentiment.label', `Invalid: "${sentLabel}"`, true);
    sentLabel = 'neutral';
  }
  sentScore = clamp(sentScore, -1, 1);
  sentConf  = clamp(sentConf,  0, 1);

  // Sanity-check: if label is positive but score is negative, trust label
  if (sentLabel === 'positive' && sentScore < 0) { sentScore = Math.abs(sentScore); addError('sentiment.score', 'Sign mismatch with label — corrected', true); }
  if (sentLabel === 'negative' && sentScore > 0) { sentScore = -sentScore;          addError('sentiment.score', 'Sign mismatch with label — corrected', true); }

  // ── keyInsights ────────────────────────────────────────────────────────────
  const rawInsights = Array.isArray(obj.keyInsights) ? obj.keyInsights : [];
  const keyInsights: ArticleAnalysisResult['keyInsights'] = [];

  for (const item of rawInsights.slice(0, 5)) {
    if (typeof item !== 'object' || !item) continue;
    const i = item as Record<string, unknown>;
    const insight = safeString(i.insight, 300);
    if (!insight) continue;

    const imp = safeString(i.importance, 10).toLowerCase();
    keyInsights.push({
      insight,
      importance: IMPORTANCE_LEVELS.has(imp) ? imp as 'high' | 'medium' | 'low' : 'medium',
      category:   safeString(i.category, 100) || 'general',
    });
  }

  if (keyInsights.length === 0) {
    addError('keyInsights', 'No valid insights found', false);
  } else if (keyInsights.length < 3) {
    addError('keyInsights', `Only ${keyInsights.length} insights (expected 3-5)`, true);
  }

  // ── keywords ───────────────────────────────────────────────────────────────
  let keywords = safeStringArray(obj.keywords, 60, 10).map((k) => k.toLowerCase());
  if (keywords.length === 0) {
    addError('keywords', 'Missing keywords', false);
    keywords = [];
  }
  keywords = [...new Set(keywords)]; // deduplicate

  // ── keyPoints ──────────────────────────────────────────────────────────────
  const keyPoints = safeStringArray(obj.keyPoints, 300, 5);
  if (keyPoints.length === 0) {
    addError('keyPoints', 'Missing key points', false);
  }

  // ── readingTime ────────────────────────────────────────────────────────────
  let readingTime = typeof obj.readingTime === 'number'
    ? Math.round(obj.readingTime)
    : parseInt(String(obj.readingTime ?? '0'), 10);
  if (isNaN(readingTime) || readingTime <= 0) {
    addError('readingTime', 'Invalid or missing', true);
    readingTime = 1;
  }
  readingTime = clamp(readingTime, 1, 180);

  // ── complexity ─────────────────────────────────────────────────────────────
  let complexity = safeString(obj.complexity, 20).toLowerCase();
  if (!COMPLEXITY_LEVELS.has(complexity)) {
    addError('complexity', `Invalid: "${complexity}"`, true);
    complexity = 'basic';
  }

  // ── credibilityScore ───────────────────────────────────────────────────────
  let credScore = typeof obj.credibilityScore === 'number'
    ? Math.round(obj.credibilityScore)
    : parseInt(String(obj.credibilityScore ?? '50'), 10);
  if (isNaN(credScore)) { addError('credibilityScore', 'Not a number', true); credScore = 50; }
  credScore = clamp(credScore, 0, 100);

  // ── bias ───────────────────────────────────────────────────────────────────
  let bias = safeString(obj.bias, 20).toLowerCase().replace(/\s+/g, '-');
  if (!BIAS_TYPES.has(bias)) {
    addError('bias', `Invalid: "${bias}"`, true);
    bias = 'unknown';
  }

  // ── topics ─────────────────────────────────────────────────────────────────
  const topics = safeStringArray(obj.topics, 80, 5);

  // ── Critical validity check ────────────────────────────────────────────────
  const criticalErrors = errors.filter((e) => !e.fixed);
  const isValid = criticalErrors.length === 0 || summary !== 'Summary not available.';

  return {
    isValid,
    errors,
    data: {
      summary,
      sentiment: {
        score:      sentScore,
        label:      sentLabel as 'positive' | 'negative' | 'neutral',
        confidence: sentConf,
      },
      keyInsights,
      keywords,
      keyPoints,
      readingTime,
      complexity:       complexity as 'basic' | 'intermediate' | 'advanced',
      credibilityScore: credScore,
      bias:             bias as ArticleAnalysisResult['bias'],
      topics,
    },
  };
};

// ─── Trending Topics Validator ─────────────────────────────────────────────────
export const validateTrendingResponse = (raw: unknown): string[] => {
  // Model may return ["t1","t2"] or {"topics": ["t1","t2"]}
  if (Array.isArray(raw)) {
    return raw.filter(isNonEmptyString).slice(0, 12);
  }
  if (typeof raw === 'object' && raw !== null) {
    const obj = raw as Record<string, unknown>;
    const arr = obj.topics ?? obj.trending ?? obj.results ?? obj.data;
    if (Array.isArray(arr)) return arr.filter(isNonEmptyString).slice(0, 12);
  }
  return [];
};
