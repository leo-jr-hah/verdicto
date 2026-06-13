import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
import { createAgentServer } from '../shared/agent-engine.js';

// Agent B specializes in DCF (income-based) valuation.
// It will use comps only if explicitly configured and data is strong.
createAgentServer({
  name: 'Agent-B',
  port: parseInt(process.env.VALUATION_B_PORT || '3002'),
  publicKey: process.env.AGENT_B_PUBLIC_KEY || '',
  methodPreference: 'dcf',
});
