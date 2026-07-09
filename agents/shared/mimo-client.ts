/**
 * MiMo AI Client: Primary LLM for Verdict
 * 
 * Uses Xiaomi MiMo V2 API (OpenAI-compatible endpoint).
 * Falls back to Groq if MiMo fails.
 * Falls back to heuristic if both fail.
 * 
 * Model hierarchy (low to high consumption):
 *   1. mimo-v2-pro      - best reasoning, most tokens
 *   2. mimo-v2           - balanced
 *   3. mimo-v2.5         - newer, good reasoning
 *   4. mimo-v2.5-pro     - newest, best quality
 * 
 * We use mimo-v2 as the low-consumption default.
 */

import Groq from 'groq-sdk';
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// ─── Config ──────────────────────────────────────────────────────────────────

const MIMO_API_KEY = process.env.MIMO_API_KEY;
const MIMO_BASE_URL = 'https://api.mimo-v2.com/v1/chat/completions';
const MIMO_MODEL = process.env.MIMO_MODEL || 'mimo-v2'; // low consumption default

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = 'llama-3.3-70b-versatile';

const LLM_TIMEOUT_MS = 15_000;

// ─── Input Sanitization (Prompt Injection Defense) ──────────────────────────

/**
 * Maximum allowed length for any user-supplied field injected into LLM prompts.
 * Prevents prompt flooding / context window exhaustion attacks.
 */
const MAX_FIELD_LENGTH = 500;

/**
 * Characters that are dangerous in LLM prompt contexts.
 * Strips instruction-injection markers while preserving readable content.
 */
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above|earlier)\s+(instructions?|prompts?|rules?)/gi,
  /you\s+are\s+now\s+/gi,
  /system\s*:\s*/gi,
  /new\s+instructions?\s*:/gi,
  /disregard\s+(all\s+)?(previous|prior)/gi,
  /act\s+as\s+if\s+you\s+are/gi,
  /\[INST\]/gi,
  /\[\/INST\]/gi,
  /<\|im_start\|>/gi,
  /<\|im_end\|>/gi,
];

/**
 * Sanitize a user-supplied value before embedding it in an LLM prompt.
 * - Truncates to MAX_FIELD_LENGTH
 * - Strips known prompt-injection patterns
 * - Removes null bytes and control characters
 */
export function sanitizeForPrompt(value: string): string {
  if (typeof value !== 'string') return String(value);
  
  let clean = value
    // Remove null bytes and control chars (except newline/tab)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Truncate
    .slice(0, MAX_FIELD_LENGTH);
  
  // Strip known injection patterns
  for (const pattern of INJECTION_PATTERNS) {
    clean = clean.replace(pattern, '[FILTERED]');
  }
  
  return clean;
}

/**
 * Wrap user-supplied values in delimiters so the LLM treats them as data, not instructions.
 * This is the primary defense against prompt injection.
 */
function delimit(value: string): string {
  return `<<<USER_DATA_START>>>\n${value}\n<<<USER_DATA_END>>>`;
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface LLMResponse {
  content: string;
  provider: 'mimo' | 'groq' | 'fallback';
  model: string;
  tokensUsed?: number;
}

// ─── MiMo API Call ───────────────────────────────────────────────────────────

async function callMiMo(systemPrompt: string, userPrompt: string): Promise<LLMResponse> {
  if (!MIMO_API_KEY) {
    throw new Error('MIMO_API_KEY not set');
  }

  const response = await axios.post(
    MIMO_BASE_URL,
    {
      model: MIMO_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2,
      max_completion_tokens: 1024,
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'api-key': MIMO_API_KEY,
      },
      timeout: LLM_TIMEOUT_MS,
    }
  );

  const data = response.data;
  const content = data.choices?.[0]?.message?.content || '{}';
  const tokensUsed = data.usage?.total_tokens || 0;

  return {
    content,
    provider: 'mimo',
    model: MIMO_MODEL,
    tokensUsed,
  };
}

// ─── Groq API Call (Fallback) ────────────────────────────────────────────────

async function callGroq(systemPrompt: string, userPrompt: string): Promise<LLMResponse> {
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY not set');
  }

  const groq = new Groq({ apiKey: GROQ_API_KEY });

  const chatCompletion = await Promise.race([
    groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      model: GROQ_MODEL,
      response_format: { type: 'json_object' },
      temperature: 0.2,
    }),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('GROQ_TIMEOUT')), LLM_TIMEOUT_MS)
    ),
  ]);

  const content = chatCompletion.choices[0]?.message?.content || '{}';
  const tokensUsed = chatCompletion.usage?.total_tokens || 0;

  return {
    content,
    provider: 'groq',
    model: GROQ_MODEL,
    tokensUsed,
  };
}

// ─── Heuristic Fallback ─────────────────────────────────────────────────────

function buildFallbackResponse(userPrompt: string): any {
  const valueMatch = userPrompt.match(/\$?([\d,]+(?:\.\d{2})?)/);
  const claimedValue = valueMatch ? parseFloat(valueMatch[1].replace(/,/g, '')) : 0;

  return {
    fallback: true,
    fallbackReason: 'Both MiMo and Groq unavailable. Using heuristic response',
    valuation: claimedValue > 0 ? claimedValue : 0,
    confidence: 0.3,
    riskLevel: 'medium',
    recommendation: 'MANUAL_REVIEW',
    reasoning: 'Automated analysis unavailable. The claim has been logged and requires manual review by a human analyst.',
    evidenceGaps: [
      'Automated evidence analysis was not available at this time',
      'Manual verification recommended before settlement',
    ],
    suggestedEvidence: [
      'Bank statements',
      'Revenue reports',
      'Third-party appraisals',
    ],
  };
}

// ─── Demo Mode LLM Response ──────────────────────────────────────────────────
// Returns realistic-looking LLM JSON without hitting any API.

function buildDemoLLMResponse(systemPrompt: string, userPrompt: string): any {
  // Detect asset type from prompt content
  const isRealEstate = userPrompt.includes('real estate') || userPrompt.includes('PROPERTY DATA');
  const isArt = userPrompt.includes('art') || userPrompt.includes('artwork') || userPrompt.includes('ARTIST');
  const isCommodity = userPrompt.includes('commodity') || userPrompt.includes('gold') || userPrompt.includes('silver');

  // Detect agent type from system prompt
  const isCompsAgent = systemPrompt.includes('Comps Specialist') || systemPrompt.includes('MARKET DATA IS KING');
  const isFundamentalsAgent = systemPrompt.includes('Fundamentals Analyst') || systemPrompt.includes('INTRINSIC VALUE');

  // Extract the asking price from the prompt — look for "asking price" or "ASSET:" context
  // Fall back to a reasonable default based on asset type
  let hintValue = 500_000;

  // Try to find asking price explicitly mentioned
  const askingMatch = userPrompt.match(/asking\s*(?:price)?:?\s*\$?([\d,]+)/i);
  if (askingMatch) {
    hintValue = parseFloat(askingMatch[1].replace(/,/g, ''));
  } else {
    // Look for "Estimated value from API" or "Average price" in the data context
    const estMatch = userPrompt.match(/(?:estimated value|average price)[^:]*:\s*\$?([\d,]+)/i);
    if (estMatch) {
      hintValue = parseFloat(estMatch[1].replace(/,/g, ''));
    } else {
      // Last resort: find the largest reasonable number (between 10K and 10M)
      const allNumbers = [...userPrompt.matchAll(/\$?([\d,]{5,})/g)]
        .map(m => parseFloat(m[1].replace(/,/g, '')))
        .filter(n => n >= 10_000 && n <= 10_000_000);
      if (allNumbers.length > 0) {
        hintValue = allNumbers[0];
      }
    }
  }

  // Generate a realistic value with some variance
  const variance = isCompsAgent ? 0.05 : 0.08; // Comps agent is tighter
  const estimatedValue = Math.round(hintValue * (1 + (Math.random() - 0.5) * variance * 2));
  const confidence = isCompsAgent ? 0.72 + Math.random() * 0.15 : 0.65 + Math.random() * 0.15;

  if (isRealEstate) {
    return isCompsAgent ? {
      estimated_value: estimatedValue,
      confidence: Math.round(confidence * 100) / 100,
      reasoning: `Based on comparable sales data in the area, properties of similar size and condition have transacted within a tight range. The median price per square foot supports this valuation, with adjustments for market conditions and property features.`,
      methodology: 'Comparable Sales Analysis',
      data_quality: 'strong',
      risk_factors: ['Market volatility', 'Interest rate sensitivity', 'Local inventory levels'],
    } : {
      estimated_value: estimatedValue,
      confidence: Math.round(confidence * 100) / 100,
      reasoning: `Discounted cash flow analysis using current mortgage rates and projected rental yields indicates this property's intrinsic value. Cap rate adjustments and replacement cost analysis provide additional support for this estimate.`,
      methodology: 'DCF / Fundamental Analysis',
      intrinsic_vs_market: 'fair',
      risk_factors: ['Cap rate compression risk', 'Maintenance cost escalation', 'Regulatory changes'],
    };
  }

  if (isArt) {
    return isCompsAgent ? {
      estimated_value: estimatedValue,
      confidence: Math.round(confidence * 100) / 100,
      reasoning: `Auction results for comparable works by artists of similar stature and medium support this valuation. Recent market trends in the contemporary art segment show stable demand for this category.`,
      methodology: 'Auction Comparable Analysis',
      market_trend: 'stable',
      risk_factors: ['Market taste shifts', 'Authentication concerns', 'Condition issues'],
    } : {
      estimated_value: estimatedValue,
      confidence: Math.round(confidence * 100) / 100,
      reasoning: `Intrinsic value assessment based on the artist's career trajectory, exhibition history, and institutional recognition. Provenance and condition reports factor into this fundamental valuation approach.`,
      methodology: 'Fundamental Art Valuation',
      intrinsic_vs_market: 'fair',
      risk_factors: ['Artist market saturation', 'Economic downturn impact on luxury goods'],
    };
  }

  // Commodity
  return isCompsAgent ? {
    estimated_value: estimatedValue,
    confidence: Math.round(confidence * 100) / 100,
    reasoning: `Spot price analysis using current market data indicates this commodity's fair value. Recent trading volumes and price action support this assessment with consideration for purity and form factors.`,
    methodology: 'Spot Price Analysis',
    spot_price_used: Math.round(estimatedValue / (parseFloat(userPrompt.match(/(\d+)\s*oz/i)?.[1] || '1'))),
    risk_factors: ['Price volatility', 'Supply chain disruptions', 'Currency fluctuations'],
  } : {
    estimated_value: estimatedValue,
    confidence: Math.round(confidence * 100) / 100,
    reasoning: `Fundamental analysis of supply-demand dynamics, industrial usage trends, and macroeconomic factors supports this valuation. Storage costs and liquidity premiums have been factored into the intrinsic value calculation.`,
    methodology: 'Fundamental Commodity Analysis',
    intrinsic_vs_market: 'fair',
    risk_factors: ['Geopolitical supply risks', 'Substitution effects', 'Central bank policy changes'],
  };
}

// ─── Main Export: askJuror (with MiMo - Groq - Fallback chain) ──────────────

/**
 * Ask the LLM juror a question and get a structured JSON response.
 * 
 * Chain: MiMo - Groq - Heuristic Fallback
 * 
 * Each step has a 15s timeout. If MiMo fails, Groq is tried.
 * If Groq fails, a deterministic heuristic response is returned.
 */
export interface JurorResponse {
  /** The parsed JSON response from the LLM (or heuristic fallback). */
  result: any;
  /** Which provider actually produced the response. */
  provider: 'mimo' | 'groq' | 'heuristic';
  /** True if the primary LLM (MiMo) was unavailable. */
  fallbackTriggered: boolean;
}

export async function askJuror(systemPrompt: string, userPrompt: string): Promise<JurorResponse> {
  // Step 1: Try MiMo
  try {
    console.log(`[LLM] 🤖 Trying MiMo (${MIMO_MODEL})...`);
    const result = await callMiMo(systemPrompt, userPrompt);
    console.log(`[LLM] ✅ MiMo responded (${result.tokensUsed} tokens)`);

    try {
      return { result: JSON.parse(result.content), provider: 'mimo', fallbackTriggered: false };
    } catch {
      console.warn(`[LLM] ⚠️  MiMo returned non-JSON, trying Groq...`);
    }
  } catch (mimoErr: any) {
    console.warn(`[LLM] ⚠️  MiMo failed: ${mimoErr.message} - trying Groq...`);
  }

  // Step 2: Try Groq
  try {
    console.log(`[LLM] 🤖 Trying Groq (${GROQ_MODEL})...`);
    const result = await callGroq(systemPrompt, userPrompt);
    console.log(`[LLM] ✅ Groq responded (${result.tokensUsed} tokens)`);

    try {
      return { result: JSON.parse(result.content), provider: 'groq', fallbackTriggered: false };
    } catch {
      console.warn(`[LLM] ⚠️  Groq returned non-JSON, using fallback`);
      return { result: buildFallbackResponse(userPrompt), provider: 'heuristic', fallbackTriggered: true };
    }
  } catch (groqErr: any) {
    console.warn(`[LLM] ⚠️  Groq failed: ${groqErr.message} - using fallback`);
  }

  // Step 3: Heuristic fallback
  console.log(`[LLM] 🔄 Using heuristic fallback`);
  return { result: buildFallbackResponse(userPrompt), provider: 'heuristic', fallbackTriggered: true };
}

/**
 * Ask the LLM for a valuation analysis (used by agent-engine).
 * Same chain: MiMo - Groq - Fallback
 */
export async function askValuationAgent(systemPrompt: string, userPrompt: string): Promise<JurorResponse> {
  return askJuror(systemPrompt, userPrompt);
}
