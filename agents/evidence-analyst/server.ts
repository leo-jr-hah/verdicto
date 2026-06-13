import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { createJurorServer } from '../shared/juror-engine.js';

createJurorServer({
  name: 'Evidence Analyst',
  port: parseInt(process.env.EVIDENCE_ANALYST_PORT || '3003', 10),
  publicKey: process.env.AGENT_C_PUBLIC_KEY || '',
  specializationContext: 'You are an expert in real estate evidence verification. You look closely at on-chain property records, proof of title, and physical property condition metrics. You heavily scrutinize DCF parameters for realism.',
});
