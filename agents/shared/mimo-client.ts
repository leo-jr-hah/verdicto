/**
 * MiMo AI Client — Primary LLM for CASPER RWA Court
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
export async function askJuror(systemPrompt: string, userPrompt: string) {
  // Step 1: Try MiMo
  try {
    console.log(`[LLM] 🤖 Trying MiMo (${MIMO_MODEL})...`);
    const result = await callMiMo(systemPrompt, userPrompt);
    console.log(`[LLM] ✅ MiMo responded (${result.tokensUsed} tokens)`);

    try {
      return JSON.parse(result.content);
    } catch (parseErr: any) {
      console.warn(`[LLM] ⚠️  MiMo returned non-JSON, trying Groq...`);
      // Fall through to Groq
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
      return JSON.parse(result.content);
    } catch (parseErr: any) {
      console.warn(`[LLM] ⚠️  Groq returned non-JSON, using fallback`);
      return buildFallbackResponse(userPrompt);
    }
  } catch (groqErr: any) {
    console.warn(`[LLM] ⚠️  Groq failed: ${groqErr.message} — using fallback`);
  }

  // Step 3: Heuristic fallback
  console.log(`[LLM] 🔄 Using heuristic fallback`);
  return buildFallbackResponse(userPrompt);
}

/**
 * Ask the LLM for a valuation analysis (used by agent-engine).
 * Same chain: MiMo → Groq → Fallback
 */
export async function askValuationAgent(systemPrompt: string, userPrompt: string) {
  return askJuror(systemPrompt, userPrompt);
}
