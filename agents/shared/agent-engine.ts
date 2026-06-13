import express from 'express';
import { z } from 'zod';
import { simulatedX402Middleware } from './x402-middleware.js';
import type { ValuationResult } from './types.js';

// Mock market data that each agent instance can query
const COMPARABLE_SALES = [
  { location: 'Miami', area: 'downtown', spots: 95, price_per_spot: 24500, date: '2025-11' },
  { location: 'Miami', area: 'downtown', spots: 120, price_per_spot: 22800, date: '2025-09' },
  { location: 'Miami', area: 'brickell', spots: 80, price_per_spot: 28000, date: '2026-01' },
  { location: 'Miami', area: 'midtown', spots: 60, price_per_spot: 19500, date: '2025-10' },
  { location: 'NYC', area: 'midtown', spots: 200, price_per_spot: 85000, date: '2022-12' },
  { location: 'LA', area: 'beverly', spots: 75, price_per_spot: 58000, date: '2026-02' },
];

const DCF_DATA: Record<string, { daily_rate: number; occupancy: number; operating_expenses: number; cap_rate: number }> = {
  'miami': { daily_rate: 25, occupancy: 0.75, operating_expenses: 50000, cap_rate: 0.065 },
  'nyc': { daily_rate: 65, occupancy: 0.85, operating_expenses: 120000, cap_rate: 0.045 },
  'la': { daily_rate: 40, occupancy: 0.80, operating_expenses: 80000, cap_rate: 0.055 },
};

export function calcCompsValue(agentName: string, assetId: string, location: string, spotCount: number): ValuationResult {
  const city = location.toLowerCase().split(',')[0].trim();
  const comps = COMPARABLE_SALES.filter(c => c.location.toLowerCase() === city);

  if (comps.length === 0) {
    throw new Error(`No comparable sales data for ${city}`);
  }

  const avgPps = comps.reduce((sum, c) => sum + c.price_per_spot, 0) / comps.length;
  const estimated = Math.round(avgPps * spotCount);

  return {
    agent: agentName,
    method: 'comparable_sales',
    asset_id: assetId,
    estimated_value: estimated,
    confidence: Math.min(0.92, 0.70 + comps.length * 0.05),
    per_spot_value: Math.round(avgPps),
    reasoning: `Analyzed ${comps.length} comparable sales in ${city}. Avg price/spot: $${Math.round(avgPps)}. Est: ${spotCount} spots × $${Math.round(avgPps)} = $${estimated}.`,
    timestamp: Date.now(),
  };
}

export function calcDcfValue(agentName: string, assetId: string, location: string, spotCount: number): ValuationResult {
  const city = location.toLowerCase().split(',')[0].trim();
  const data = DCF_DATA[city] || DCF_DATA['miami'];

  const annualRevenue = data.daily_rate * spotCount * data.occupancy * 365;
  const noi = annualRevenue - data.operating_expenses;
  const estimated = Math.round(noi / data.cap_rate);

  return {
    agent: agentName,
    method: 'dcf',
    asset_id: assetId,
    estimated_value: estimated,
    confidence: 0.78,
    per_spot_value: Math.round(estimated / spotCount),
    reasoning: `DCF analysis: daily rate $${data.daily_rate}, occupancy ${data.occupancy * 100}%, NOI $${Math.round(noi)}, cap rate ${data.cap_rate * 100}%. Valuation: $${estimated}.`,
    timestamp: Date.now(),
  };
}

// The autonomous method router — this is what makes each agent "intelligent"
export function autonomousRoute(agentName: string, preference: 'comps' | 'dcf', assetId: string, location: string, spotCount: number): ValuationResult {
  const city = location.toLowerCase().split(',')[0].trim();
  const comps = COMPARABLE_SALES.filter(c => c.location.toLowerCase() === city);
  const hasRecentComps = comps.some(c => {
    const year = parseInt(c.date.split('-')[0]);
    return year >= 2025;
  });

  let chosenMethod: string;
  let result: ValuationResult;

  if (preference === 'comps' && hasRecentComps) {
    chosenMethod = 'comparable_sales (data available)';
    result = calcCompsValue(agentName, assetId, location, spotCount);
  } else if (preference === 'comps' && !hasRecentComps) {
    chosenMethod = 'dcf (comps data stale, pivoting)';
    result = calcDcfValue(agentName, assetId, location, spotCount);
  } else {
    chosenMethod = 'dcf (preferred method)';
    result = calcDcfValue(agentName, assetId, location, spotCount);
  }

  console.log(`[${agentName}] Autonomy decision: ${chosenMethod}`);
  return result;
}

// Config for spinning up an agent instance
export interface AgentConfig {
  name: string;
  port: number;
  publicKey: string;
  methodPreference: 'comps' | 'dcf';
}

export function createAgentServer(config: AgentConfig) {
  const app = express();
  app.use(express.json());

  // x402 payment gate
  app.use('/mcp', simulatedX402Middleware({
    recipientAddress: config.publicKey,
    amountCSPR: '0.01',
  }));

  // MCP JSON-RPC endpoint
  app.post('/mcp', async (req, res) => {
    const { method, params, id } = req.body;

    if (method === 'tools/call' && params?.name === 'assess_asset_autonomously') {
      const { asset_id, location, spot_count } = params.arguments;
      const result = autonomousRoute(config.name, config.methodPreference, asset_id, location, spot_count);

      return res.json({
        jsonrpc: '2.0',
        id,
        result: { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] },
      });
    }

    if (method === 'tools/list') {
      return res.json({
        jsonrpc: '2.0',
        id,
        result: {
          tools: [{
            name: 'assess_asset_autonomously',
            description: 'Autonomously assess a parking asset using the best available method',
            inputSchema: {
              type: 'object',
              properties: {
                asset_id: { type: 'string' },
                location: { type: 'string' },
                spot_count: { type: 'number' },
              },
              required: ['asset_id', 'location', 'spot_count'],
            },
          }],
        },
      });
    }

    return res.status(404).json({ jsonrpc: '2.0', id, error: { code: -32601, message: 'Method not found' } });
  });

  app.get('/health', (_, res) => {
    res.json({ status: 'ok', agent: config.name, method_preference: config.methodPreference });
  });

  app.listen(config.port, () => {
    console.log(`🤖 ${config.name} running on :${config.port}`);
    console.log(`💰 x402 gate active (0.01 CSPR to ${config.publicKey.slice(0, 12)}...)`);
    console.log(`🧠 Method preference: ${config.methodPreference}`);
  });

  return app;
}
