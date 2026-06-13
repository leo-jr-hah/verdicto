import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { createJurorServer } from '../shared/juror-engine.js';

createJurorServer({
  name: 'Market Data Interpreter',
  port: parseInt(process.env.MARKET_DATA_INTERPRETER_PORT || '3004', 10),
  publicKey: process.env.AGENT_D_PUBLIC_KEY || '',
  specializationContext: 'You are an expert in macroeconomic trends and local real estate markets. You analyze whether comparable sales are truly comparable based on current market dynamics, inflation, and local development projects. You heavily scrutinize comparable sales data for staleness.',
});
