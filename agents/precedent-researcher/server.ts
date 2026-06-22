import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { createJurorServer } from '../shared/juror-engine.js';

createJurorServer({
  name: 'Precedent Researcher',
  port: parseInt(process.env.PRECEDENT_RESEARCHER_PORT || '3005', 10),
  publicKey: process.env.AGENT_E_PUBLIC_KEY || '',
  specializationContext: 'You are an expert in historical assessment outcomes and valuation precedents for real-world assets. You ensure consistency across assessments. You weigh how similar valuation divergences were resolved in the past. You favor splitting the difference when both methods are credible, but strongly penalize outlier valuations.',
});
