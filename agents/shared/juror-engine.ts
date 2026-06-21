/**
 * Juror Engine — MCP server for juror agents
 *
 * Each juror specializes in one dimension:
 *   - Evidence Analyst: document quality, proof strength
 *   - Market Data Interpreter: market trends, pricing signals
 *   - Precedent Researcher: historical case outcomes
 *
 * Supports all asset types with tailored prompts.
 */

import express from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { casperX402Middleware } from './x402-middleware.js';
import { askJuror, sanitizeForPrompt } from './mimo-client.js';
import type { AssetType } from './types.js';

export interface JurorConfig {
  name: string;
  port: number;
  publicKey: string;
  specializationContext: string;
}

function buildJurorSystemPrompt(config: JurorConfig, assetType: AssetType): string {
  const assetContext: Record<AssetType, string> = {
    'real-estate': 'This is a real estate dispute. Consider property condition, location desirability, comparable sales, rental income potential, and macroeconomic factors like interest rates.',
    'art': 'This is a fine art dispute. Consider artist provenance, exhibition history, medium, condition, comparable auction results, and current market demand for the artist\'s work.',
    'commodity': 'This is a commodity dispute. Consider spot prices, purity/weight verification, storage costs, market volatility, and physical delivery premiums.',
  };

  return `You are ${config.name}, a specialized juror in the Casper RWA Court.
Your specialization: ${config.specializationContext}
Asset context: ${assetContext[assetType] || assetContext['real-estate']}

You must analyze the evidence and choose which valuation is more credible: 'A', 'B', or 'split'.
Respond ONLY as a JSON object in this format: {"vote": "A"|"B"|"split", "confidence": 0.0-1.0, "reasoning": "2-3 sentences explaining why"}`;
}

export function createJurorServer(config: JurorConfig) {
  const app = express();
  app.use(express.json({ limit: '16kb' }));

  // ── CORS — restrict to known origins ─────────────────────────────────────
  const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3000').split(',');
  app.use((req, res, next) => {
    const origin = req.headers.origin || '';
    if (ALLOWED_ORIGINS.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, payment-signature, x-payment-proof');
    res.setHeader('Access-Control-Max-Age', '86400');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
    next();
  });

  // ── Security headers ─────────────────────────────────────────────────────
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'no-referrer');
    next();
  });

  // ── Rate limiting ────────────────────────────────────────────────────────
  // 30 requests per minute per IP on MCP endpoint (LLM calls are expensive)
  const mcpLimiter = rateLimit({
    windowMs: 60_000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later' },
  });

  // 100 requests per minute on health endpoint
  const healthLimiter = rateLimit({
    windowMs: 60_000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use('/mcp', mcpLimiter);
  app.use('/health', healthLimiter);

  app.use('/mcp', casperX402Middleware({
    recipientAddress: config.publicKey,
    amountCSPR: '2.5',
  }));

  const mcpServer = new McpServer({
    name: config.name,
    version: '1.0.0',
  });

  mcpServer.tool(
    'deliberate',
    'Assess evidence and provide a verdict recommendation for a dispute',
    {
      dispute_id: z.string(),
      asset_id: z.string(),
      asset_type: z.enum(['real-estate', 'art', 'commodity']).optional(),
      location: z.string(),
      spot_count: z.number(),
      valuation_a: z.number(),
      valuation_b: z.number(),
      peer_reasoning: z.array(z.string()).optional(),
    },
    async ({ dispute_id, asset_id, asset_type, location, spot_count, valuation_a, valuation_b, peer_reasoning }) => {
      const resolvedAssetType: AssetType = asset_type || 'real-estate';
      const isRound2 = peer_reasoning && peer_reasoning.length > 0;

      const systemPrompt = buildJurorSystemPrompt(config, resolvedAssetType);

      let userPrompt = `Dispute: ${sanitizeForPrompt(dispute_id)} | Asset: ${sanitizeForPrompt(asset_id)} | Type: ${resolvedAssetType} | Location: ${sanitizeForPrompt(location)} | Units: ${spot_count}
Valuation A (Comparable/Appraisal): ${valuation_a.toLocaleString()}
Valuation B (DCF/Market): ${valuation_b.toLocaleString()}
Divergence: ${Math.abs(((valuation_a - valuation_b) / Math.min(valuation_a, valuation_b)) * 100).toFixed(1)}%
Analyze the evidence from your perspective.`;

      if (config.name === 'Precedent Researcher') {
        try {
          const { queryPrecedents } = await import('../precedent-researcher/rag.js');
          const precedents = await queryPrecedents(location, asset_id);
          userPrompt += `\n\n${precedents}`;
        } catch {
          userPrompt += `\n\nNo precedent data available for this asset type.`;
        }
      }

      if (isRound2) {
        const sanitizedReasoning = peer_reasoning.map(r => sanitizeForPrompt(r)).join('\n');
        userPrompt += `\n\nThis is ROUND 2 of deliberation. Here is what your peers said in Round 1:\n${sanitizedReasoning}\nGiven your peers' reasoning, do you maintain your position or shift your vote? Explain why.`;
      }

      console.log(`[${config.name}] 🤔 Reasoning about dispute ${dispute_id} (${resolvedAssetType}, Round ${isRound2 ? 2 : 1})...`);
      const llmResponse = await askJuror(systemPrompt, userPrompt);
      console.log(`[${config.name}] ✅ Reached verdict: ${llmResponse.vote}`);

      return {
        content: [{ type: 'text', text: JSON.stringify(llmResponse, null, 2) }],
      };
    }
  );

  // MCP endpoint
  app.post('/mcp', async (req, res) => {
    try {
      const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
      await mcpServer.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (err: any) {
      console.error(`[Express] Error in /mcp: ${err.message}`, err);
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/health', (_, res) => {
    res.json({ status: 'ok', agent: config.name, role: 'juror' });
  });

  app.listen(config.port, () => {
    console.log(`⚖️  ${config.name} (Juror) running on :${config.port}`);
  });

  return app;
}
