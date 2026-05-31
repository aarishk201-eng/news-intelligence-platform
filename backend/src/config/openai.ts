/**
 * @module config/openai
 * @description Production OpenAI client with connection management,
 * token tracking, cost estimation, and availability guard.
 */
import OpenAI from 'openai';
import { env } from './env';
import { createLogger } from '../utils/logger';

const log = createLogger('OpenAI');

// ─── Client singleton ─────────────────────────────────────────────────────────
export const openaiClient = new OpenAI({
  apiKey:     env.OPENROUTER_API_KEY || 'placeholder',
  baseURL:    'https://openrouter.ai/api/v1',
  maxRetries: 0,          // We handle retries ourselves for fine-grained control
  timeout:    30_000,
});

// ─── Model definitions with cost per 1M tokens (USD, as of 2024) ──────────────
export const MODELS = {
  MINI:    'meta-llama/llama-3.3-70b-instruct:free',   
  STANDARD:'google/gemma-4-31b-it:free',        
  FAST:    'meta-llama/llama-3.2-3b-instruct:free',   
} as const;

export type ModelId = typeof MODELS[keyof typeof MODELS];

interface ModelCost {
  inputPer1M:  number;  // USD
  outputPer1M: number;  // USD
}

export const MODEL_COSTS: Record<string, ModelCost> = {
  'meta-llama/llama-3.3-70b-instruct:free': { inputPer1M: 0.00,  outputPer1M: 0.00  }, // Free Tier
  'meta-llama/llama-3.2-3b-instruct:free':  { inputPer1M: 0.00,  outputPer1M: 0.00  }, // Free Tier
  'google/gemma-4-31b-it:free':             { inputPer1M: 0.00,  outputPer1M: 0.00 }, // Free Tier
};

// ─── AI Config (validated from env) ──────────────────────────────────────────
export const AI_CONFIG = {
  model:       (env.OPENAI_MODEL as ModelId) || MODELS.MINI,
  maxTokens:   env.OPENAI_MAX_TOKENS,
  temperature: env.OPENAI_TEMPERATURE,
  enabled:     !!env.OPENROUTER_API_KEY && env.ENABLE_AI,
} as const;

// ─── Token + cost estimation ──────────────────────────────────────────────────
/**
 * Rough token counter: ~4 chars per token for English text.
 * Use for pre-flight checks — not billing accuracy.
 */
export const estimateTokens = (text: string): number =>
  Math.ceil(text.length / 4);

/**
 * Estimates cost of a single API call in USD cents.
 */
export const estimateCostCents = (
  inputTokens: number,
  outputTokens: number,
  model: string = AI_CONFIG.model
): number => {
  const costs = MODEL_COSTS[model] ?? MODEL_COSTS['gpt-4o-mini'];
  return (
    (inputTokens  / 1_000_000) * costs.inputPer1M  * 100 +
    (outputTokens / 1_000_000) * costs.outputPer1M * 100
  );
};

// ─── Usage tracker (in-memory, resets on restart) ────────────────────────────
interface UsageStats {
  totalInputTokens:  number;
  totalOutputTokens: number;
  totalCalls:        number;
  totalCostCents:    number;
  errors:            number;
}

const usageStats: UsageStats = {
  totalInputTokens: 0, totalOutputTokens: 0,
  totalCalls: 0, totalCostCents: 0, errors: 0,
};

export const trackUsage = (
  inputTokens: number,
  outputTokens: number,
  model: string = AI_CONFIG.model
): void => {
  usageStats.totalInputTokens  += inputTokens;
  usageStats.totalOutputTokens += outputTokens;
  usageStats.totalCalls++;
  usageStats.totalCostCents += estimateCostCents(inputTokens, outputTokens, model);

  log.debug(`Token usage — in:${inputTokens} out:${outputTokens} ` +
    `cost:$${(estimateCostCents(inputTokens, outputTokens, model) / 100).toFixed(5)}`);
};

export const trackError = (): void => { usageStats.errors++; };

export const getUsageStats = (): Readonly<UsageStats & { totalCostUsd: number }> => ({
  ...usageStats,
  totalCostUsd: usageStats.totalCostCents / 100,
});

export const resetUsageStats = (): void => {
  Object.assign(usageStats, {
    totalInputTokens: 0, totalOutputTokens: 0,
    totalCalls: 0, totalCostCents: 0, errors: 0,
  });
};

// ─── Guard ─────────────────────────────────────────────────────────────────────
export const assertAiEnabled = (): void => {
  if (!AI_CONFIG.enabled) {
    throw new Error('AI features are disabled. Set OPENAI_API_KEY and ENABLE_AI=true.');
  }
};
