/**
 * Agent Engine: LLM-powered valuation agents for all asset types
 *
 * Each agent is a genuine AI agent that:
 *   1. Fetches real market data from APIs
 *   2. Reasons independently about the data using LLM (Groq + fallback)
 *   3. Has a unique specialization that shapes its analysis
 *   4. Can genuinely disagree with the other agent
 *
 * Agent A (Comps Specialist): focuses on market comparisons, recent transactions,
 *   price per sqft, auction results, spot prices. Favors data-driven approaches.
 *
 * Agent B (Fundamentals Analyst): focuses on DCF, intrinsic value, macro context,
 *   income potential, risk factors, supply/demand dynamics. Favors theory-driven approaches.
 *
 * If LLM is unavailable, falls back to deterministic calculations.
 */

import http from 'http';
import { getMortgageRate } from './fred-client.js';
import {
  getRealEstateData,
  getArtData,
  getCommodityData,
  getMacroContext,
} from './data-sources.js';
import { askValuationAgent, sanitizeForPrompt } from './mimo-client.js';
import type { ValuationResult, AssetType } from './types.js';
import { createLogger } from './logger.js';
const log = createLogger('AgentEngine');


// ─── Agent Specialization Prompts ────────────────────────────────────────────
// Each agent has a distinct personality and analytical framework.
// This is what makes them GENUINELY disagree, not just different formulas.

const AGENT_A_SYSTEM = `You are Agent A, a Comps Specialist valuation agent in the Verdict autonomous assessment system.
Your analytical philosophy: MARKET DATA IS KING. You believe the best predictor of value is what comparable assets actually sold for recently. You are skeptical of theoretical models. Cap rates, DCF projections, and income approaches are useful but secondary to real transaction data.

Your approach:
- Prioritize comparable sales, recent transactions, and market signals
- Weight price-per-sqft, auction results, and spot prices heavily
- Flag when comps are thin or unreliable, adjust confidence accordingly
- Be direct and data-driven. Cite specific numbers from the evidence.
- If data is strong, be confident. If data is weak, say so and widen your range.

You MUST respond as a JSON object:
{"estimated_value": <number>, "confidence": <0.0-1.0>, "reasoning": "<2-4 sentences citing specific data points>", "methodology": "<brief description of your approach>", "data_quality": "<strong|moderate|weak>", "risk_factors": ["<factor1>", "<factor2>"]}`;

const AGENT_B_SYSTEM = `You are Agent B, a Fundamentals Analyst valuation agent in the Verdict autonomous assessment system.
Your analytical philosophy: INTRINSIC VALUE MATTERS. You believe market prices can be irrational: bubbles, panic, and illiquidity distort real value. You focus on what an asset is WORTH based on its fundamental characteristics, not just what the market says today.

Your approach:
- Prioritize income potential, replacement cost, and intrinsic value metrics
- Use DCF analysis, cap rates, and risk-adjusted returns
- Consider macroeconomic context: interest rates, inflation, market cycles
- Be willing to disagree with market consensus if fundamentals justify it
- Flag overvaluation or undervaluation relative to fundamentals

You MUST respond as a JSON object:
{"estimated_value": <number>, "confidence": <0.0-1.0>, "reasoning": "<2-4 sentences explaining your fundamental analysis>", "methodology": "<brief description of your approach>", "intrinsic_vs_market": "<undervalued|fair|overvalued>", "risk_factors": ["<factor1>", "<factor2>"]}`;

// ─── Mock Data (fallback when APIs are unavailable) ──────────────────────────

const MOCK_REAL_ESTATE_COMPS: Record<string, { avgPricePerSqft: number; avgPrice: number }> = {
  'miami':       { avgPricePerSqft: 485, avgPrice: 620_000 },
  'new york':    { avgPricePerSqft: 1_120, avgPrice: 1_850_000 },
  'los angeles': { avgPricePerSqft: 780, avgPrice: 1_200_000 },
  'san francisco': { avgPricePerSqft: 1_050, avgPrice: 1_650_000 },
  'chicago':     { avgPricePerSqft: 320, avgPrice: 420_000 },
  'austin':      { avgPricePerSqft: 410, avgPrice: 550_000 },
  'denver':      { avgPricePerSqft: 390, avgPrice: 520_000 },
  'seattle':     { avgPricePerSqft: 620, avgPrice: 880_000 },
};

const MOCK_ART_ESTIMATES: Record<string, { low: number; mid: number; high: number }> = {
  'oil painting':  { low: 15_000, mid: 45_000, high: 120_000 },
  'sculpture':     { low: 8_000,  mid: 35_000, high: 90_000 },
  'photography':   { low: 2_000,  mid: 12_000, high: 45_000 },
  'print':         { low: 500,    mid: 5_000,  high: 25_000 },
  'mixed media':   { low: 3_000,  mid: 20_000, high: 65_000 },
};

const MOCK_COMMODITY_PRICES: Record<string, number> = {
  gold: 3_300,
  silver: 32,
  platinum: 1_020,
  palladium: 980,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normalizeLocation(location: string): string {
  return location.toLowerCase().split(',')[0].trim();
}

function jitter(base: number, range: number): number {
  return Math.round(base * (1 + (Math.random() - 0.5) * range));
}

function detectCommodity(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('silver')) return 'silver';
  if (lower.includes('platinum')) return 'platinum';
  if (lower.includes('palladium')) return 'palladium';
  return 'gold';
}

// ─── LLM Response Parser ─────────────────────────────────────────────────────

/**
 * Safely extract a numeric field from an LLM response, with fallback.
 */
function extractNumber(llmResult: any, field: string, fallback: number): number {
  const val = llmResult[field];
  if (typeof val === 'number' && val > 0) return Math.round(val);
  return fallback;
}

function extractConfidence(llmResult: any, fallback: number): number {
  const val = llmResult.confidence;
  if (typeof val === 'number') return Math.max(0.3, Math.min(0.95, val));
  return fallback;
}

// ─── Real Estate Valuation (LLM-Powered) ────────────────────────────────────

async function gatherRealEstateData(location: string, sqft?: number): Promise<{
  dataContext: string;
  dataSource: string;
  fallbackValue: number;
}> {
  const city = normalizeLocation(location);
  let dataContext = '';
  let dataSource = 'Mock Data';
  let fallbackValue: number;

  try {
    const [data, macro, rate] = await Promise.allSettled([
      getRealEstateData(location),
      getMacroContext(),
      getMortgageRate(),
    ]);

    const estateData = data.status === 'fulfilled' ? data.value : null;
    const macroData = macro.status === 'fulfilled' ? macro.value : null;
    const mortgageRate = rate.status === 'fulfilled' && rate.value > 0 ? rate.value : 0.068;

    if (estateData && estateData.comparables.length > 0) {
      dataSource = 'RentCast API + FRED';
      const comps = estateData.comparables;
      const avgPrice = comps.reduce((sum: number, c: any) => sum + (c.price || 0), 0) / comps.length;
      const avgPricePerSqft = comps.reduce((sum: number, c: any) => sum + (c.pricePerSqft || 0), 0) / comps.length;

      const compLines = comps.slice(0, 8).map((c: any, i: number) =>
        `  ${i + 1}. ${c.address || 'N/A'} - ${(c.price || 0).toLocaleString()} (${c.sqft || 0} sqft, ${c.pricePerSqft || 0}/sqft, ${c.daysOnMarket || 0} days on market)`
      ).join('\n');

      dataContext = [
        `PROPERTY DATA (${location}):`,
        `- Estimated value from API: ${estateData.priceData.estimatedValue ? '$' + estateData.priceData.estimatedValue.toLocaleString() : 'N/A'}`,
        `- Square footage: ${estateData.priceData.sqft || sqft || 'N/A'}`,
        `- Bedrooms: ${estateData.priceData.bedrooms || 'N/A'}`,
        `- Bathrooms: ${estateData.priceData.bathrooms || 'N/A'}`,
        `- Year built: ${estateData.priceData.yearBuilt || 'N/A'}`,
        `- Property type: ${estateData.priceData.propertyType || 'Unknown'}`,
        '',
        `COMPARABLE SALES (${comps.length} properties):`,
        compLines,
        `- Average price: $${Math.round(avgPrice).toLocaleString()}`,
        `- Average price/sqft: $${Math.round(avgPricePerSqft)}`,
        '',
        'MACRO CONTEXT:',
        `- Mortgage rate: ${(mortgageRate * 100).toFixed(2)}%`,
        macroData ? `- CPI: ${macroData.cpi || 'N/A'}, Fed Funds: ${macroData.fedFundsRate || 'N/A'}%` : '',
      ].join('\n');

      fallbackValue = Math.round(avgPrice);
    } else {
      throw new Error('No comparable data');
    }
  } catch {
    const mock = MOCK_REAL_ESTATE_COMPS[city] || MOCK_REAL_ESTATE_COMPS['miami'];
    fallbackValue = sqft ? Math.round(mock.avgPricePerSqft * sqft) : jitter(mock.avgPrice, 0.15);
    dataContext = [
      `PROPERTY DATA (${location}):`,
      `- Square footage: ${sqft || 'N/A'}`,
      `- Market: ${city}`,
      '',
      'COMPARABLE SALES (estimated market averages):',
      `- Average price/sqft: $${mock.avgPricePerSqft}`,
      `- Average price: $${mock.avgPrice.toLocaleString()}`,
      '',
      'NOTE: Live API data unavailable. Using market estimates.',
    ].join('\n');
  }

  return { dataContext, dataSource, fallbackValue };
}

export async function calcRealEstateComps(
  agentName: string,
  assetId: string,
  location: string,
  sqft?: number
): Promise<ValuationResult> {
  const { dataContext, dataSource, fallbackValue } = await gatherRealEstateData(location, sqft);

  const userPrompt = [
    `You are valuing a real estate asset using COMPARABLE SALES analysis.`,
    '',
    `ASSET: ${assetId}`,
    `LOCATION: ${sanitizeForPrompt(location)}`,
    sqft ? `SIZE: ${sqft} sqft` : '',
    '',
    dataContext,
    '',
    'Analyze this data as a comps specialist. What is the fair market value?',
  ].filter(Boolean).join('\n');

  try {
    const { result: llmResult, provider: llmProvider, fallbackTriggered } = await askValuationAgent(AGENT_A_SYSTEM, userPrompt);
    const estimatedValue = extractNumber(llmResult, 'estimated_value', fallbackValue);
    const confidence = extractConfidence(llmResult, 0.65);

    return {
      agent: agentName,
      method: 'comparable_sales',
      asset_id: assetId,
      estimated_value: estimatedValue,
      confidence,
      per_spot_value: estimatedValue,
      reasoning: llmResult.reasoning || `Comparable sales analysis for ${location}. Data source: ${dataSource}.`,
      timestamp: Date.now(),
      dataSource,
      fallbackTriggered,
      fallbackProvider: fallbackTriggered ? (llmProvider as 'groq' | 'heuristic') : undefined,
    };
  } catch {
    return {
      agent: agentName,
      method: 'comparable_sales',
      asset_id: assetId,
      estimated_value: fallbackValue,
      confidence: 0.60,
      per_spot_value: fallbackValue,
      reasoning: `Comparable sales analysis for ${location}. Data source: ${dataSource}. (Deterministic fallback: LLM unavailable)`,
      timestamp: Date.now(),
      dataSource,
      fallbackTriggered: true,
      fallbackProvider: 'heuristic',
    };
  }
}

export async function calcRealEstateDCF(
  agentName: string,
  assetId: string,
  location: string,
  sqft?: number
): Promise<ValuationResult> {
  const { dataContext, dataSource, fallbackValue } = await gatherRealEstateData(location, sqft);

  let mortgageRate = 0.068;
  try {
    const rate = await getMortgageRate();
    if (rate > 0) mortgageRate = rate;
  } catch { /* use default */ }

  const monthlyRent = fallbackValue * 0.006;
  const annualRent = monthlyRent * 12;
  const capRate = 0.05 + (mortgageRate - 0.065) * 0.5;
  const dcfFallback = Math.round(annualRent / Math.max(capRate, 0.03));

  const userPrompt = [
    `You are valuing a real estate asset using FUNDAMENTAL / DCF analysis.`,
    '',
    `ASSET: ${assetId}`,
    `LOCATION: ${sanitizeForPrompt(location)}`,
    sqft ? `SIZE: ${sqft} sqft` : '',
    '',
    dataContext,
    '',
    'DCF PARAMETERS:',
    `- Current mortgage rate: ${(mortgageRate * 100).toFixed(2)}%`,
    `- Estimated monthly rent: $${Math.round(monthlyRent).toLocaleString()}`,
    `- Estimated annual rent: $${Math.round(annualRent).toLocaleString()}`,
    `- Calculated cap rate: ${(capRate * 100).toFixed(1)}%`,
    `- DCF formula value: $${dcfFallback.toLocaleString()}`,
    '',
    'Analyze this data as a fundamentals analyst. Consider income potential, risk factors, and macro environment. What is the intrinsic value?',
  ].filter(Boolean).join('\n');

  try {
    const { result: llmResult, provider: llmProvider, fallbackTriggered } = await askValuationAgent(AGENT_B_SYSTEM, userPrompt);
    const estimatedValue = extractNumber(llmResult, 'estimated_value', dcfFallback);
    const confidence = extractConfidence(llmResult, 0.72);

    return {
      agent: agentName,
      method: 'dcf',
      asset_id: assetId,
      estimated_value: estimatedValue,
      confidence,
      per_spot_value: estimatedValue,
      reasoning: llmResult.reasoning || `DCF analysis for ${location}. Mortgage rate: ${(mortgageRate * 100).toFixed(2)}%. Cap rate: ${(capRate * 100).toFixed(1)}%.`,
      timestamp: Date.now(),
      dataSource,
      fallbackTriggered,
      fallbackProvider: fallbackTriggered ? (llmProvider as 'groq' | 'heuristic') : undefined,
    };
  } catch {
    return {
      agent: agentName,
      method: 'dcf',
      asset_id: assetId,
      estimated_value: jitter(dcfFallback, 0.08),
      confidence: 0.68,
      per_spot_value: jitter(dcfFallback, 0.08),
      reasoning: `DCF analysis for ${location}. Mortgage rate: ${(mortgageRate * 100).toFixed(2)}%. Cap rate: ${(capRate * 100).toFixed(1)}%. (Deterministic fallback: LLM unavailable)`,
      timestamp: Date.now(),
      dataSource,
      fallbackTriggered: true,
      fallbackProvider: 'heuristic',
    };
  }
}

// ─── Art Valuation (LLM-Powered) ─────────────────────────────────────────────

async function gatherArtData(artistOrMedium: string): Promise<{
  dataContext: string;
  dataSource: string;
  fallbackValue: number;
}> {
  const medium = artistOrMedium.toLowerCase();
  const mock = MOCK_ART_ESTIMATES[medium] || MOCK_ART_ESTIMATES['oil painting'];
  let dataContext = '';
  let dataSource = 'Mock Data';
  let fallbackValue = jitter(mock.mid, 0.2);

  try {
    const data = await getArtData(artistOrMedium);
    if (data.comparables.length > 0) {
      dataSource = 'Met Museum API';
      const compsCount = data.comparables.length;
      const prominenceMultiplier = Math.min(1.5, 1 + compsCount * 0.05);
      fallbackValue = Math.round(jitter(mock.mid, 0.2) * prominenceMultiplier);

      const compLines = data.comparables.slice(0, 8).map((c: any, i: number) =>
        `  ${i + 1}. "${c.title || 'Untitled'}" - ${c.artist || 'Unknown artist'}, ${c.medium || 'N/A'}, ${c.date || 'N/A'}`
      ).join('\n');

      dataContext = [
        `ARTWORK DATA (${sanitizeForPrompt(artistOrMedium)}):`,
        `- Medium: ${artistOrMedium}`,
        `- Museum collection matches: ${compsCount} comparable works found`,
        `- Artist prominence multiplier: ${prominenceMultiplier.toFixed(2)}x`,
        '',
        'COMPARABLE WORKS (from Met Museum collection):',
        compLines,
        '',
        `MARKET ESTIMATES (${medium}):`,
        `- Low: $${mock.low.toLocaleString()}`,
        `- Mid: $${mock.mid.toLocaleString()}`,
        `- High: $${mock.high.toLocaleString()}`,
      ].join('\n');
    } else {
      throw new Error('No comparable artworks');
    }
  } catch {
    dataContext = [
      `ARTWORK DATA (${sanitizeForPrompt(artistOrMedium)}):`,
      `- Medium: ${artistOrMedium}`,
      '',
      `MARKET ESTIMATES (${medium}):`,
      `- Low: $${mock.low.toLocaleString()}`,
      `- Mid: $${mock.mid.toLocaleString()}`,
      `- High: $${mock.high.toLocaleString()}`,
      '',
      'NOTE: Live museum data unavailable. Using market estimates.',
    ].join('\n');
  }

  return { dataContext, dataSource, fallbackValue };
}

export async function calcArtAppraisal(
  agentName: string,
  assetId: string,
  artistOrMedium: string
): Promise<ValuationResult> {
  const { dataContext, dataSource, fallbackValue } = await gatherArtData(artistOrMedium);

  const userPrompt = [
    `You are appraising a fine art piece using COMPARABLE SALES analysis.`,
    '',
    `ASSET: ${assetId}`,
    `ARTWORK: ${sanitizeForPrompt(artistOrMedium)}`,
    '',
    dataContext,
    '',
    'Analyze this data as a comps specialist. Consider artist prominence, medium, and market demand. What is the fair market value?',
  ].filter(Boolean).join('\n');

  try {
    const { result: llmResult, provider: llmProvider, fallbackTriggered } = await askValuationAgent(AGENT_A_SYSTEM, userPrompt);
    const estimatedValue = extractNumber(llmResult, 'estimated_value', fallbackValue);
    const confidence = extractConfidence(llmResult, 0.60);

    return {
      agent: agentName,
      method: 'appraisal',
      asset_id: assetId,
      estimated_value: estimatedValue,
      confidence,
      per_spot_value: estimatedValue,
      reasoning: llmResult.reasoning || `Art appraisal for "${artistOrMedium}". Data source: ${dataSource}.`,
      timestamp: Date.now(),
      dataSource,
      fallbackTriggered,
      fallbackProvider: fallbackTriggered ? (llmProvider as 'groq' | 'heuristic') : undefined,
    };
  } catch {
    return {
      agent: agentName,
      method: 'appraisal',
      asset_id: assetId,
      estimated_value: fallbackValue,
      confidence: 0.55,
      per_spot_value: fallbackValue,
      reasoning: `Art appraisal for "${artistOrMedium}". Data source: ${dataSource}. (Deterministic fallback: LLM unavailable)`,
      timestamp: Date.now(),
      dataSource,
      fallbackTriggered: true,
      fallbackProvider: 'heuristic',
    };
  }
}

export async function calcArtMarketComparison(
  agentName: string,
  assetId: string,
  artistOrMedium: string
): Promise<ValuationResult> {
  const { dataContext, dataSource, fallbackValue } = await gatherArtData(artistOrMedium);
  const medium = artistOrMedium.toLowerCase();
  const mock = MOCK_ART_ESTIMATES[medium] || MOCK_ART_ESTIMATES['oil painting'];
  const dcfFallback = jitter(mock.high * 0.7, 0.15);

  const userPrompt = [
    `You are valuing a fine art piece using FUNDAMENTAL / INTRINSIC analysis.`,
    '',
    `ASSET: ${assetId}`,
    `ARTWORK: ${sanitizeForPrompt(artistOrMedium)}`,
    '',
    dataContext,
    '',
    'Consider: Is the market price justified by the artist\'s significance, the work\'s quality, and long-term collectibility?',
    'Or is it inflated by speculation? What is the intrinsic value?',
  ].filter(Boolean).join('\n');

  try {
    const { result: llmResult, provider: llmProvider, fallbackTriggered } = await askValuationAgent(AGENT_B_SYSTEM, userPrompt);
    const estimatedValue = extractNumber(llmResult, 'estimated_value', dcfFallback);
    const confidence = extractConfidence(llmResult, 0.58);

    return {
      agent: agentName,
      method: 'market_price',
      asset_id: assetId,
      estimated_value: estimatedValue,
      confidence,
      per_spot_value: estimatedValue,
      reasoning: llmResult.reasoning || `Market comparison for "${artistOrMedium}". Data source: ${dataSource}.`,
      timestamp: Date.now(),
      dataSource,
      fallbackTriggered,
      fallbackProvider: fallbackTriggered ? (llmProvider as 'groq' | 'heuristic') : undefined,
    };
  } catch {
    return {
      agent: agentName,
      method: 'market_price',
      asset_id: assetId,
      estimated_value: dcfFallback,
      confidence: 0.55,
      per_spot_value: dcfFallback,
      reasoning: `Market comparison for "${artistOrMedium}". Data source: ${dataSource}. (Deterministic fallback: LLM unavailable)`,
      timestamp: Date.now(),
      dataSource,
      fallbackTriggered: true,
      fallbackProvider: 'heuristic',
    };
  }
}

// ─── Commodity Valuation (LLM-Powered) ───────────────────────────────────────

async function gatherCommodityData(weightOz: number, commodityName?: string): Promise<{
  dataContext: string;
  dataSource: string;
  fallbackValue: number;
  pricePerOz: number;
}> {
  const commodity = detectCommodity(commodityName || 'gold');
  let pricePerOz = MOCK_COMMODITY_PRICES[commodity] || MOCK_COMMODITY_PRICES['gold'];
  let dataSource = 'Mock Data';

  try {
    const data = await getCommodityData(commodity);
    if (data.priceData.pricePerOz) {
      pricePerOz = data.priceData.pricePerOz;
      dataSource = 'CoinGecko API';
    }
  } catch {
    // use mock price
  }

  const fallbackValue = Math.round(pricePerOz * weightOz);

  const dataContext = [
    `COMMODITY DATA (${commodity}):`,
    `- Current spot price: $${pricePerOz.toLocaleString()} per oz`,
    `- Weight: ${weightOz} oz`,
    `- Total spot value: $${fallbackValue.toLocaleString()}`,
    `- Data source: ${dataSource}`,
    '',
    `PHYSICAL PREMIUMS:`,
    `- Assay certification: typically 1-2%`,
    `- Secure storage: typically 0.5-1% annually`,
    `- Physical delivery: typically 1-3%`,
    `- Total premium range: 3-7% above spot`,
  ].join('\n');

  return { dataContext, dataSource, fallbackValue, pricePerOz };
}

export async function calcCommoditySpot(
  agentName: string,
  assetId: string,
  weightOz: number,
  commodityName?: string
): Promise<ValuationResult> {
  const { dataContext, dataSource, fallbackValue, pricePerOz } = await gatherCommodityData(weightOz, commodityName);
  const commodity = detectCommodity(commodityName || 'gold');

  const userPrompt = [
    `You are valuing a commodity using SPOT PRICE analysis.`,
    '',
    `ASSET: ${assetId}`,
    `COMMODITY: ${commodity}`,
    '',
    dataContext,
    '',
    'Analyze this data as a comps specialist. What is the fair market value based on current spot prices and market conditions?',
  ].filter(Boolean).join('\n');

  try {
    const { result: llmResult, provider: llmProvider, fallbackTriggered } = await askValuationAgent(AGENT_A_SYSTEM, userPrompt);
    const estimatedValue = extractNumber(llmResult, 'estimated_value', fallbackValue);
    const confidence = extractConfidence(llmResult, 0.85);

    return {
      agent: agentName,
      method: 'market_price',
      asset_id: assetId,
      estimated_value: estimatedValue,
      confidence,
      per_spot_value: Math.round(pricePerOz),
      reasoning: llmResult.reasoning || `Spot price valuation for ${weightOz}oz ${commodity}. Price per oz: ${pricePerOz.toLocaleString()} (${dataSource}).`,
      timestamp: Date.now(),
      dataSource,
      fallbackTriggered,
      fallbackProvider: fallbackTriggered ? (llmProvider as 'groq' | 'heuristic') : undefined,
    };
  } catch {
    return {
      agent: agentName,
      method: 'market_price',
      asset_id: assetId,
      estimated_value: fallbackValue,
      confidence: 0.82,
      per_spot_value: Math.round(pricePerOz),
      reasoning: `Spot price valuation for ${weightOz}oz ${commodity}. Price per oz: ${pricePerOz.toLocaleString()} (${dataSource}). (Deterministic fallback: LLM unavailable)`,
      timestamp: Date.now(),
      dataSource,
      fallbackTriggered: true,
      fallbackProvider: 'heuristic',
    };
  }
}

export async function calcCommodityAppraisal(
  agentName: string,
  assetId: string,
  weightOz: number,
  commodityName?: string
): Promise<ValuationResult> {
  const { dataContext, dataSource, fallbackValue, pricePerOz } = await gatherCommodityData(weightOz, commodityName);
  const commodity = detectCommodity(commodityName || 'gold');
  const premium = 1.03 + Math.random() * 0.04;
  const dcfFallback = Math.round(pricePerOz * weightOz * premium);

  const userPrompt = [
    `You are valuing a commodity using FUNDAMENTAL / PHYSICAL APPRAISAL analysis.`,
    '',
    `ASSET: ${assetId}`,
    `COMMODITY: ${commodity}`,
    '',
    dataContext,
    '',
    'Consider: physical premiums, storage costs, assay certification, delivery logistics.',
    'Is spot price fair, or should physical premiums be higher/lower? What is the intrinsic value?',
  ].filter(Boolean).join('\n');

  try {
    const { result: llmResult, provider: llmProvider, fallbackTriggered } = await askValuationAgent(AGENT_B_SYSTEM, userPrompt);
    const estimatedValue = extractNumber(llmResult, 'estimated_value', dcfFallback);
    const confidence = extractConfidence(llmResult, 0.78);

    return {
      agent: agentName,
      method: 'appraisal',
      asset_id: assetId,
      estimated_value: estimatedValue,
      confidence,
      per_spot_value: Math.round(pricePerOz * premium),
      reasoning: llmResult.reasoning || `Physical appraisal for ${weightOz}oz ${commodity}. Includes premium for assay, delivery, and storage.`,
      timestamp: Date.now(),
      dataSource: 'Physical Appraisal',
      fallbackTriggered,
      fallbackProvider: fallbackTriggered ? (llmProvider as 'groq' | 'heuristic') : undefined,
    };
  } catch {
    return {
      agent: agentName,
      method: 'appraisal',
      asset_id: assetId,
      estimated_value: dcfFallback,
      confidence: 0.75,
      per_spot_value: Math.round(pricePerOz * premium),
      reasoning: `Physical appraisal for ${weightOz}oz ${commodity}. Includes ${(premium * 100 - 100).toFixed(1)}% premium for assay, delivery, and storage. (Deterministic fallback: LLM unavailable)`,
      timestamp: Date.now(),
      dataSource: 'Physical Appraisal',
      fallbackTriggered: true,
      fallbackProvider: 'heuristic',
    };
  }
}

// ─── Unified Valuation Dispatcher ────────────────────────────────────────────

export interface ValuationRequest {
  assetType: AssetType;
  assetId: string;
  name?: string;
  location?: string;
  artistOrMedium?: string;
  weightOz?: number;
  sqft?: number;
}

/**
 * Dispatches valuation to the correct method based on asset type.
 * Returns two independent valuations (Agent A and Agent B).
 */
export async function runDualValuation(request: ValuationRequest): Promise<[ValuationResult, ValuationResult]> {
  const { assetType, assetId, location, artistOrMedium, weightOz, sqft } = request;

  switch (assetType) {
    case 'real-estate': {
      const loc = location || 'Miami, FL';
      const [a, b] = await Promise.all([
        calcRealEstateComps('valuation-agent-a', assetId, loc, sqft),
        calcRealEstateDCF('valuation-agent-b', assetId, loc, sqft),
      ]);
      return [a, b];
    }

    case 'art': {
      const query = artistOrMedium || 'oil painting';
      const [a, b] = await Promise.all([
        calcArtAppraisal('valuation-agent-a', assetId, query),
        calcArtMarketComparison('valuation-agent-b', assetId, query),
      ]);
      return [a, b];
    }

    case 'commodity': {
      const oz = weightOz || 1;
      const [a, b] = await Promise.all([
        calcCommoditySpot('valuation-agent-a', assetId, oz, request.name),
        calcCommodityAppraisal('valuation-agent-b', assetId, oz, request.name),
      ]);
      return [a, b];
    }

    default:
      throw new Error(`Unsupported asset type: ${assetType}`);
  }
}

// ─── Agent HTTP Server ───────────────────────────────────────────────────────

interface AgentServerConfig {
  name: string;
  port: number;
  publicKey: string;
  methodPreference: 'comps' | 'dcf' | 'auto';
}

/** Simple in-memory rate limiter (per-IP, sliding window) */
function createRateLimiter(maxRequests: number, windowMs: number) {
  const hits = new Map<string, number[]>();
  
  // Periodic cleanup to prevent memory leak
  setInterval(() => {
    const now = Date.now();
    for (const [ip, timestamps] of hits) {
      const recent = timestamps.filter(t => now - t < windowMs);
      if (recent.length === 0) hits.delete(ip);
      else hits.set(ip, recent);
    }
  }, windowMs);
  
  return (ip: string): boolean => {
    const now = Date.now();
    const timestamps = (hits.get(ip) || []).filter(t => now - t < windowMs);
    if (timestamps.length >= maxRequests) return false; // rate limited
    timestamps.push(now);
    hits.set(ip, timestamps);
    return true;
  };
}

const agentRateLimiter = createRateLimiter(30, 60_000); // 30 req/min per IP
const MAX_BODY_BYTES = 16 * 1024; // 16KB max request body

/**
 * Creates a standalone HTTP server for a single valuation agent.
 * The orchestrator POSTs a ValuationRequest; this server runs
 * the appropriate method and returns a ValuationResult.
 */
export function createAgentServer(config: AgentServerConfig): void {
  const server = http.createServer(async (req, res) => {
    // Health check
    if (req.method === 'GET' && req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', agent: config.name }));
      return;
    }

    // Only accept POST /valuate
    if (req.method !== 'POST' || req.url !== '/valuate') {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
      return;
    }

    // Rate limit
    const clientIp = req.socket.remoteAddress || 'unknown';
    if (!agentRateLimiter(clientIp)) {
      res.writeHead(429, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Too many requests' }));
      return;
    }

    try {
      let body = '';
      let totalBytes = 0;
      for await (const chunk of req) {
        totalBytes += chunk.length;
        if (totalBytes > MAX_BODY_BYTES) {
          res.writeHead(413, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Request body too large' }));
          return;
        }
        body += chunk;
      }

      const request = JSON.parse(body) as {
        assetType: AssetType;
        assetId: string;
        name?: string;
        location?: string;
        artistOrMedium?: string;
        weightOz?: number;
        sqft?: number;
      };

      log.info(`[${config.name}] Received valuation request:: ${request}`);

      // Run the appropriate single-agent method
      let result: ValuationResult;

      switch (request.assetType) {
        case 'real-estate':
          result = config.methodPreference === 'dcf'
            ? await calcRealEstateDCF(config.name, request.assetId, request.location || 'Miami, FL', request.sqft)
            : await calcRealEstateComps(config.name, request.assetId, request.location || 'Miami, FL', request.sqft);
          break;
        case 'art':
          result = config.methodPreference === 'dcf'
            ? await calcArtMarketComparison(config.name, request.assetId, request.artistOrMedium || 'oil painting')
            : await calcArtAppraisal(config.name, request.assetId, request.artistOrMedium || 'oil painting');
          break;
        case 'commodity':
          result = config.methodPreference === 'dcf'
            ? await calcCommodityAppraisal(config.name, request.assetId, request.weightOz || 1, request.name)
            : await calcCommoditySpot(config.name, request.assetId, request.weightOz || 1, request.name);
          break;
        default:
          throw new Error(`Unsupported asset type: ${request.assetType}`);
      }

      log.info(`[${config.name}] Valuation complete: ${result.estimated_value.toLocaleString()}`);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    } catch (err) {
      log.error(`[${config.name}] Error:: ${err}`);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: (err as Error).message }));
    }
  });

  server.listen(config.port, () => {
    log.info(`[${config.name}] Listening on port ${config.port}`);
  });
}
