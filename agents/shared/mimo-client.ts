/**
 * MiMo AI Client — Primary LLM for Verdict
 * 
 * Uses Xiaomi MiMo V2 API (OpenAI-compatible endpoint).
 * Falls back to Groq if MiMo fails.
 * Falls back to heuristic if both fail.
 * 
 * Model hierarchy (low → high consumption):
 *   1. mimo-v2-pro      — best reasoning, most tokens
 *   2. mimo-v2           — balanced
 *   3. mimo-v2.5         — newer, good reasoning
 *   4. mimo-v2.5-pro     — newest, best quality
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

// ─── Main Export: askJuror (with MiMo → Groq → Fallback chain) ──────────────

/**
 * Ask the LLM juror a question and get a structured JSON response.
 * 
 * Chain: MiMo → Groq → Heuristic Fallback
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
    console.warn(`[LLM] ⚠️  MiMo failed: ${mimoErr.message} — trying Groq...`);
  }

  // Step 2: Try Groq
  try {
    console.log(`[LLM] 🤖 Trying Groq (${GROQ_MODEL})...`);
    const result = await callGroq(systemPrompt, userPrompt);
    console.log(`[LLM] ✅ Groq responded (${result.tokensUsed} tokens)`);

    try {
      return { result: JSON.parse(result.content), provider: 'groq', fallbackTriggered: true };
    } catch {
      console.warn(`[LLM] ⚠️  Groq returned non-JSON, using fallback`);
      return { result: buildFallbackResponse(userPrompt), provider: 'heuristic', fallbackTriggered: true };
    }
  } catch (groqErr: any) {
    console.warn(`[LLM] ⚠️  Groq failed: ${groqErr.message} — using fallback`);
  }

  // Step 3: Heuristic fallback
  console.log(`[LLM] 🔄 Using heuristic fallback`);
  return { result: buildFallbackResponse(userPrompt), provider: 'heuristic', fallbackTriggered: true };
}

/**
 * Ask the LLM for a valuation analysis (used by agent-engine).
 * Same chain: MiMo → Groq → Fallback
 */
export async function askValuationAgent(systemPrompt: string, userPrompt: string): Promise<JurorResponse> {
  return askJuror(systemPrompt, userPrompt);
}
