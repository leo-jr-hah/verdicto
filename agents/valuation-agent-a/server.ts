import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
import { createAgentServer } from '../shared/agent-engine.js';

// Agent A specializes in comparable sales analysis.
// When market data is thin, it autonomously pivots to DCF.
createAgentServer({
  name: 'Agent-A',
  port: parseInt(process.env.VALUATION_A_PORT || '3001'),
  publicKey: process.env.AGENT_A_PUBLIC_KEY || '',
  methodPreference: 'comps',
});
