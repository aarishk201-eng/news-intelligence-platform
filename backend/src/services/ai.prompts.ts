/**
 * @module services/ai/prompts
 * @description Central prompt library.
 *
 * Design principles:
 *  1. System prompt is reusable across calls — short, role-focused.
 *  2. User prompt is minimal — only the variable data.
 *  3. JSON schema is specified in the system prompt, not repeated per call.
 *  4. Content is pre-truncated before prompt assembly to control input tokens.
 *  5. All prompts are tested against the token budget.
 */

// ─── Token budgets per operation ──────────────────────────────────────────────
export const TOKEN_BUDGETS = {
  // Input token allocation per field (approximate)
  SYSTEM_PROMPT:  250,  // Fixed overhead
  TITLE:          100,  // ~80 chars = ~20 tokens; budget for long titles
  DESCRIPTION:    200,  // ~300 chars
  CONTENT:       1500,  // Truncated body

  // Max output tokens per operation
  ANALYSIS_OUTPUT:  600,
  BRIEFING_OUTPUT:  350,
  TRENDING_OUTPUT:  200,
  CHAT_OUTPUT:      800,

  // Content truncation lengths (characters, not tokens)
  MAX_CONTENT_CHARS:     4000,   // ~1000 tokens
  MAX_DESCRIPTION_CHARS:  600,   // ~150 tokens
  MAX_TITLE_CHARS:         300,
} as const;

// ─── System Prompts ───────────────────────────────────────────────────────────
/**
 * Article analysis system prompt.
 * Single prompt covers: summary, sentiment, insights, keywords, reading time,
 * complexity, credibility, bias — one API call for everything.
 */
export const ANALYSIS_SYSTEM_PROMPT = `You are an expert news intelligence analyst. Analyze articles and respond ONLY with minified JSON matching this exact schema (no extra fields, no markdown):

{
  "summary": "1-2 sentence factual summary",
  "sentiment": {
    "score": <float -1.0 to 1.0>,
    "label": <"positive"|"negative"|"neutral">,
    "confidence": <float 0.0 to 1.0>
  },
  "keyInsights": [
    {"insight": "<concise insight>", "importance": <"high"|"medium"|"low">, "category": "<topic area>"}
  ],
  "keywords": ["keyword1","keyword2","keyword3","keyword4","keyword5"],
  "keyPoints": ["point1","point2","point3"],
  "readingTime": <integer minutes>,
  "complexity": <"basic"|"intermediate"|"advanced">,
  "credibilityScore": <integer 0-100>,
  "bias": <"left"|"center-left"|"center"|"center-right"|"right"|"unknown">,
  "topics": ["topic1","topic2"]
}

Rules:
- keyInsights: exactly 3-5 items
- keywords: exactly 5-8 lowercase items
- keyPoints: exactly 3-4 items
- credibilityScore: base on source quality, citation style, factual claims
- bias: political/ideological lean of the reporting angle, not the topic itself`;

/**
 * Briefing system prompt — short because briefings are stateless.
 */
export const BRIEFING_SYSTEM_PROMPT =
  'You are a senior news editor writing executive briefings. Be concise, factual, and structured. No filler phrases.';

/**
 * Chat system prompt — injected once per conversation.
 */
export const CHAT_SYSTEM_PROMPT =
  `You are NewsAI, an intelligent news assistant. Help users understand current events, analyze trends, and get balanced perspectives. Be concise, factual, and cite uncertainty when present. Never fabricate facts.`;

/**
 * Trending topics system prompt.
 */
export const TRENDING_SYSTEM_PROMPT =
  'You extract trending topics from news headlines. Respond ONLY with a JSON array of strings. No other text.';

// ─── Prompt Builders ──────────────────────────────────────────────────────────

/**
 * Builds the user message for article analysis.
 * Pre-truncates all inputs to control token spend.
 */
export const buildAnalysisPrompt = (
  title: string,
  description: string,
  content: string
): string => {
  const t = title.substring(0, TOKEN_BUDGETS.MAX_TITLE_CHARS).trim();
  const d = description.substring(0, TOKEN_BUDGETS.MAX_DESCRIPTION_CHARS).trim();
  const c = content.substring(0, TOKEN_BUDGETS.MAX_CONTENT_CHARS).trim();

  // Omit empty fields entirely — saves tokens
  const parts: string[] = [`TITLE: ${t}`];
  if (d && d !== t) parts.push(`DESCRIPTION: ${d}`);
  if (c && c !== d) parts.push(`CONTENT:\n${c}`);

  return parts.join('\n\n');
};

/**
 * Briefing prompt — takes pre-formatted article list.
 * Caller trims to fit token budget.
 */
export const buildBriefingPrompt = (
  articleLines: string[],
  maxArticles = 15
): string => {
  const lines = articleLines.slice(0, maxArticles);
  return `Write a 120-150 word executive news briefing covering these top stories. Professional tone, no bullet points:\n\n${lines.join('\n')}`;
};

/**
 * Trending topics prompt.
 */
export const buildTrendingPrompt = (headlines: string[]): string =>
  `Extract the 10 most significant trending topics from these headlines as short phrases (2-4 words). Return JSON array only:\n\n${
    headlines.slice(0, 50).map((h, i) => `${i + 1}. ${h}`).join('\n')
  }`;

/**
 * Chat prompt with optional article or headlines context.
 */
export const buildChatSystemPrompt = (context?: string): string => {
  if (!context) return CHAT_SYSTEM_PROMPT;
  // Truncate context to avoid ballooning system prompt
  const trimmedContext = context.substring(0, 2000);
  return `${CHAT_SYSTEM_PROMPT}\n\nCurrent context:\n${trimmedContext}`;
};
