import express from 'express';
import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { simulatedX402Middleware } from './x402-middleware.js';
import { askJuror } from './llm.js';

export interface JurorConfig {
  name: string;
  port: number;
  publicKey: string;
  specializationContext: string;
}

export function createJurorServer(config: JurorConfig) {
  const app = express();
  app.use(express.json());

  app.use('/mcp', simulatedX402Middleware({
    recipientAddress: config.publicKey,
    amountCSPR: '2.5',
  }));

  app.post('/mcp', async (req, res) => {
    try {
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
          location: z.string(),
          spot_count: z.number(),
          valuation_a: z.number(),
          valuation_b: z.number(),
          peer_reasoning: z.array(z.string()).optional(),
        },
        async ({ dispute_id, asset_id, location, spot_count, valuation_a, valuation_b, peer_reasoning }) => {
          const isRound2 = peer_reasoning && peer_reasoning.length > 0;
          
          const systemPrompt = `You are ${config.name}, a specialized juror in the Casper RWA Court.
Your specialization: ${config.specializationContext}
You must analyze the evidence and choose which valuation is more credible: 'A', 'B', or 'split'.
Respond ONLY as a JSON object in this format: {"vote": "A"|"B"|"split", "confidence": 0.0-1.0, "reasoning": "2-3 sentences explaining why"}`;

          let userPrompt = `Dispute: ${dispute_id} | Asset: ${asset_id} | Location: ${location} | Spots: ${spot_count}
Valuation A (Comparable Sales): $${valuation_a}
Valuation B (DCF): $${valuation_b}
Analyze the evidence from your perspective.`;

          if (config.name === 'Precedent Researcher') {
            const { queryPrecedents } = await import('../precedent-researcher/rag.js');
            const precedents = await queryPrecedents(location, asset_id);
            userPrompt += `\n\n${precedents}`;
          }

          if (isRound2) {
            userPrompt += `\n\nThis is ROUND 2 of deliberation. Here is what your peers said in Round 1:\n${peer_reasoning.join('\n')}\nGiven your peers' reasoning, do you maintain your position or shift your vote? Explain why.`;
          }

          console.log(`[${config.name}] 🤔 Reasoning about dispute ${dispute_id} (Round ${isRound2 ? 2 : 1})...`);
          const llmResponse = await askJuror(systemPrompt, userPrompt);
          console.log(`[${config.name}] ✅ Reached verdict: ${llmResponse.vote}`);
          
          return {
            content: [{ type: 'text', text: JSON.stringify(llmResponse, null, 2) }],
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
    res.json({ status: 'ok', agent: config.name, role: 'juror' });
  });

  app.listen(config.port, () => {
    console.log(`⚖️  ${config.name} (Juror) running on :${config.port}`);
  });

  return app;
}
