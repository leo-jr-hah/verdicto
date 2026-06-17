import Groq from 'groq-sdk';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// shared/ is agents/shared/, .env is at casper-rwa-court/.env (3 levels up)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

/**
 * Maximum time (ms) to wait for the LLM before falling back.
 * In a hackathon demo, a 15-second hang looks broken.
 */
const LLM_TIMEOUT_MS = 15_000;

/**
 * Ask the LLM juror a question and get a structured JSON response.
 *
 * Falls back to a deterministic heuristic response if:
 *  - Groq API key is missing
 *  - Network timeout
 *  - Any API error (rate limit, 5xx, etc.)
 *
 * The fallback response is clearly flagged with `"fallback": true` so
 * downstream code can distinguish real LLM reasoning from heuristic defaults.
 */
export async function askJuror(systemPrompt: string, userPrompt: string) {
  // If no API key, skip the call entirely
  if (!process.env.GROQ_API_KEY) {
    console.warn('[LLM] ⚠️  No GROQ_API_KEY — using heuristic fallback');
    return buildFallbackResponse(userPrompt);
  }

  try {
    const chatCompletion = await Promise.race([
      groq.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        model: 'llama-3.3-70b-versatile',
        response_format: { type: 'json_object' },
        temperature: 0.2,
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('LLM_TIMEOUT')), LLM_TIMEOUT_MS)
      ),
    ]);

    const content = chatCompletion.choices[0]?.message?.content || '{}';
    if (process.env.DEBUG) {
      console.log(`[DEBUG Groq] Content: >>>${content}<<<`);
    }

    try {
      return JSON.parse(content);
    } catch (err: any) {
      console.error(`[LLM] JSON parse error: ${err.message}`);
      return buildFallbackResponse(userPrompt);
    }
  } catch (err: any) {
    const reason = err?.message || String(err);
    console.warn(`[LLM] ⚠️  Call failed (${reason}) — using heuristic fallback`);
    return buildFallbackResponse(userPrompt);
  }
}

/**
 * Deterministic fallback when the LLM is unavailable.
 * Returns a conservative "needs more evidence" response so the system
 * continues operating without crashing the demo.
 */
function buildFallbackResponse(userPrompt: string) {
  // Parse the user prompt to extract any claim value if present
  const valueMatch = userPrompt.match(/\$?([\d,]+(?:\.\d{2})?)/);
  const claimedValue = valueMatch ? parseFloat(valueMatch[1].replace(/,/g, '')) : 0;

  return {
    fallback: true,
    fallbackReason: 'LLM unavailable — heuristic response',
    valuation: claimedValue > 0 ? claimedValue : 0,
    confidence: 0.3,
    riskLevel: 'medium',
    recommendation: 'MANUAL_REVIEW',
    reasoning: 'Automated analysis unavailable. The claim has been logged and requires manual review by a human analyst.',
    evidenceGaps: [
      'Automated evidence analysis was not available at this time',
      'Manual verification recommended before settlement'
    ],
    suggestedEvidence: [
      'Bank statements',
      'Revenue reports',
      'Third-party appraisals'
    ],
  };
}
