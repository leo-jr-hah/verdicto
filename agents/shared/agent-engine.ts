import express from 'express';
import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { simulatedX402Middleware } from './x402-middleware.js';
import { getComparableSales } from './rentcast-client.js';
import { getMortgageRate } from './fred-client.js';
import type { ValuationResult } from './types.js';

// Mock market data that each agent instance can query
const COMPARABLE_SALES = [
  { location: 'Miami', area: 'downtown', spots: 95, price_per_spot: 24500, date: '2025-11' },
  { location: 'Miami', area: 'downtown', spots: 120, price_per_spot: 22800, date: '2025-09' },
  { location: 'Miami', area: 'brickell', spots: 80, price_per_spot: 28000, date: '2026-01' },
  { location: 'Miami', area: 'midtown', spots: 60, price_per_spot: 19500, date: '2025-10' },
  { location: 'Miami', area: 'wynwood', spots: 110, price_per_spot: 21500, date: '2026-02' },
  { location: 'Miami', area: 'coralgables', spots: 45, price_per_spot: 31000, date: '2025-12' },
  { location: 'Miami', area: 'downtown', spots: 150, price_per_spot: 23500, date: '2026-03' },
  { location: 'Miami', area: 'brickell', spots: 90, price_per_spot: 29500, date: '2025-08' },
  { location: 'Miami', area: 'wynwood', spots: 75, price_per_spot: 20000, date: '2026-01' },
  { location: 'NYC', area: 'midtown', spots: 200, price_per_spot: 95000, date: '2026-01' },
  { location: 'LA', area: 'beverly', spots: 75, price_per_spot: 58000, date: '2026-02' },
];

const DCF_DATA: Record<string, { daily_rate: number; occupancy: number; operating_expenses: number; cap_rate: number }> = {
  'miami': { daily_rate: 25, occupancy: 0.75, operating_expenses: 50000, cap_rate: 0.065 },
  'nyc': { daily_rate: 65, occupancy: 0.85, operating_expenses: 120000, cap_rate: 0.045 },
  'la': { daily_rate: 40, occupancy: 0.80, operating_expenses: 80000, cap_rate: 0.055 },
};

export async function calcCompsValue(agentName: string, assetId: string, location: string, spotCount: number): Promise<ValuationResult> {
  const city = location.toLowerCase().split(',')[0].trim();
  const comps = COMPARABLE_SALES.filter(c => c.location.toLowerCase() === city);

  if (comps.length === 0) {
    throw new Error(`No comparable sales data for ${city}`);
  }

  let avgPps: number;
  let dataSource = 'Mock Data';
  let compsCount = comps.length;

  try {
    const realComps = await getComparableSales(city);
    if (realComps && realComps.length > 0) {
      // RentCast property price avg. (Assuming price / 100 for a single spot equivalent for demo)
      const avgPrice = realComps.reduce((sum: number, c: any) => sum + (c.price || 0), 0) / realComps.length;
      avgPps = avgPrice > 0 ? (avgPrice / 20) : (comps.reduce((sum, c) => sum + c.price_per_spot, 0) / comps.length); // fallback heuristics
      dataSource = 'RentCast API';
      compsCount = realComps.length;
    } else {
      avgPps = comps.reduce((sum, c) => sum + c.price_per_spot, 0) / comps.length;
    }
  } catch (err: any) {
    console.log(`[${agentName}] RentCast API unavailable or rate limited, falling back to mock data.`);
    avgPps = comps.reduce((sum, c) => sum + c.price_per_spot, 0) / comps.length;
  }

  const estimated = Math.round(avgPps * spotCount);

  return {
    agent: agentName,
    method: 'comparable_sales',
    asset_id: assetId,
    estimated_value: estimated,
    confidence: Math.min(0.92, 0.70 + compsCount * 0.05),
    per_spot_value: Math.round(avgPps),
    reasoning: `Analyzed ${compsCount} comparable sales in ${city} (Source: ${dataSource}). Avg price/spot: $${Math.round(avgPps)}. Est: ${spotCount} spots × $${Math.round(avgPps)} = $${estimated}.`,
    timestamp: Date.now(),
  };
}

export async function calcDcfValue(agentName: string, assetId: string, location: string, spotCount: number): Promise<ValuationResult> {
  const city = location.toLowerCase().split(',')[0].trim();
  const data = DCF_DATA[city] || DCF_DATA['miami'];

  let capRate = data.cap_rate;
  let dataSource = 'Mock Data';

  try {
    const mortgageRate = await getMortgageRate();
    // Asset cap rate = mortgage rate + 2% risk spread
    capRate = mortgageRate + 0.02;
    dataSource = 'FRED API';
  } catch (err: any) {
    console.log(`[${agentName}] FRED API unavailable, falling back to mock cap rate.`);
  }

  const annualRevenue = data.daily_rate * spotCount * data.occupancy * 365;
  const noi = annualRevenue - data.operating_expenses;
  const estimated = Math.round(noi / capRate);

  return {
    agent: agentName,
    method: 'dcf',
    asset_id: assetId,
    estimated_value: estimated,
    confidence: 0.78,
    per_spot_value: Math.round(estimated / spotCount),
    reasoning: `DCF analysis (Source: ${dataSource}): daily rate $${data.daily_rate}, occupancy ${data.occupancy * 100}%, NOI $${Math.round(noi)}, cap rate ${(capRate * 100).toFixed(2)}%. Valuation: $${estimated}.`,
    timestamp: Date.now(),
  };
}

// The autonomous method router — this is what makes each agent "intelligent"
export async function autonomousRoute(agentName: string, preference: 'comps' | 'dcf', assetId: string, location: string, spotCount: number): Promise<ValuationResult> {
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
    result = await calcCompsValue(agentName, assetId, location, spotCount);
  } else if (preference === 'comps' && !hasRecentComps) {
    chosenMethod = 'dcf (comps data stale, pivoting)';
    result = await calcDcfValue(agentName, assetId, location, spotCount);
  } else {
    chosenMethod = 'dcf (preferred method)';
    result = await calcDcfValue(agentName, assetId, location, spotCount);
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

  // MCP endpoint setup via SDK
  app.post('/mcp', async (req, res) => {
    try {
      const mcpServer = new McpServer({
        name: config.name,
        version: '1.0.0',
      });

      mcpServer.tool(
        'assess_asset_autonomously',
        'Autonomously assess a parking asset using the best available method',
        {
          asset_id: z.string(),
          location: z.string(),
          spot_count: z.number(),
        },
        async ({ asset_id, location, spot_count }) => {
          const result = await autonomousRoute(config.name, config.methodPreference, asset_id, location, spot_count);
          return {
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
          };
        }
      );

      const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
      await mcpServer.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (err: any) {
      console.error(`[Express] Error in /mcp: ${err.message}`, err);
      res.status(500).json({ error: err.message });
    }
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
