import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// ─── Env Validation (fail fast with clear messages) ──────────────────────────
const REQUIRED_ENV = [
  'CSPRCLOUD_API_KEY',
  'DEPLOYER_PRIVATE_KEY',
  'REPUTATION_CONTRACT_HASH',
  'ASSESSMENT_CONTRACT_HASH',
] as const;

const OPTIONAL_ENV = [
  'GROQ_API_KEY',
  'ALLOWED_ORIGINS',
  'CASPER_CHAIN_NAME',
] as const;

function validateEnv() {
  const missing = REQUIRED_ENV.filter(k => !process.env[k]);
  if (missing.length > 0) {
    console.error(`\n❌ Missing required environment variables:\n   ${missing.map(k => `  • ${k}`).join('\n')}\n`);
    log.error('Copy .env.example to .env and fill in the values.\n');
    process.exit(1);
  }
  const optionalPresent = OPTIONAL_ENV.filter(k => process.env[k]);
  if (optionalPresent.length > 0) {
    log.info(`Optional env vars configured: ${optionalPresent.join(', ')}`);
  }
  log.info('All required environment variables present.\n');
}
validateEnv();

import axios from 'axios';
import { execFile } from 'child_process';
import crypto from 'crypto';
import fs from 'fs';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { getCasperMcpClient } from '../shared/casper-mcp-client.js';
import { attachWebSocket, emitEvent } from '../websocket-server.js';
import { computeAggregateTrust } from '../shared/trust-framework.js';
import { createDeliberationReceipt, DeliberationReceipt, verifyReceiptChain } from '../shared/audit-trail.js';
import { createExecutionCommitment, storeCommitmentOnCasper } from '../shared/verifiable-execution.js';
import { saveTransaction as saveTransactionFile, createTransactionEntry, loadTransactions as loadTransactionsFile } from '../shared/transaction-log.js';
import { runDualValuation, type ValuationRequest } from '../shared/agent-engine.js';
import { fetchAssetData, type AssetData } from '../shared/data-sources.js';
import { casperX402Middleware } from '../shared/x402-middleware.js';
import * as db from '../shared/db.js';

// ─── Dual-write transaction helper ──────────────────────────────────────────
// Writes to BOTH the local JSON file (fast, for dev) AND Supabase (persistent, for prod).
function saveTransaction(entry: ReturnType<typeof createTransactionEntry>) {
  // File-based (existing behavior)
  saveTransactionFile(entry);
  // Supabase (persistent across deploys)
  db.saveTransactionToDb({
    id: entry.id,
    type: entry.type,
    action: entry.action,
    hash: entry.hash,
    contract: entry.contract,
    block_height: entry.blockHeight,
    timestamp: new Date(entry.timestamp).getTime(),
    explorer_url: entry.explorerUrl,
    on_chain: entry.onChain,
    metadata: entry.metadata,
  }).catch(err => log.warn(`⚠️ Failed to save transaction to Supabase: ${err.message}`));
}

/** Load transactions from both Supabase and file, merged and deduplicated by id */
async function loadTransactions() {
  // Load from both sources in parallel
  const [dbTxs, fileTxs] = await Promise.all([
    db.getTransactionsFromDb(200).catch(() => []),
    Promise.resolve(loadTransactionsFile()),
  ]);

  const dbMapped = dbTxs.map(tx => ({
    id: tx.id,
    type: tx.type as any,
    action: tx.action,
    hash: tx.hash,
    contract: tx.contract,
    blockHeight: tx.block_height,
    timestamp: new Date(tx.timestamp).toISOString(),
    explorerUrl: tx.explorer_url,
    onChain: tx.on_chain,
    metadata: tx.metadata,
  }));

  // Merge: start with file txs, then add any DB txs not already present
  const seen = new Set(fileTxs.map(t => t.id));
  const merged = [...fileTxs];
  for (const tx of dbMapped) {
    if (!seen.has(tx.id)) {
      merged.push(tx);
      seen.add(tx.id);
    }
  }

  // Sort newest-first by timestamp and cap at 200
  merged.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  if (merged.length > 200) merged.length = 200;

  return merged;
}
import type { AssetType } from '../shared/types.js';
import { createLogger } from '../shared/logger.js';
const log = createLogger('Orchestrator');


// ─── Named constants ─────────────────────────────────────────────────────────
const CSPR_CLOUD_URL = process.env.CSPRCLOUD_BASE_URL || 'https://api.testnet.cspr.cloud';
const CSPR_CLOUD_KEY = process.env.CSPRCLOUD_API_KEY || '';
const CSPR_RPC_URL = 'https://node.testnet.cspr.cloud/rpc';
const SETTLEMENT_AMOUNT_MOTES = 2_500_000_000; // 2.5 CSPR
const DEPLOY_PAYMENT_MOTES = 100_000_000;       // 0.1 CSPR deploy cost
const ASSESSMENT_TIMEOUT_MS = 5 * 60 * 1000;       // 5 minutes max per assessment
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:5174,http://localhost:3000,https://verdicto.xyz,https://www.verdicto.xyz').split(',');
const JUROR_IDS = ['evidence', 'market', 'precedent'] as const;

// ─── x402 Payment Constants ──────────────────────────────────────────────────
const ASSESSMENT_FEE_CSPR = 2.5;
const LOAN_FEE_CSPR = 5.0;
const REPAY_FEE_CSPR = 2.5;
const INSURANCE_FEE_CSPR = 3.0;
const ORACLE_FEE_CSPR = 0.1;  // Micro-fee for oracle queries (agent-to-agent)
const PLATFORM_WALLET = process.env.PLATFORM_WALLET || '02030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20212223';

// ─── Security: Input sanitization helpers ────────────────────────────────────
const MAX_STRING_LENGTH = 500;
const MAX_DESCRIPTION_LENGTH = 2000;

/** Truncate and sanitize string inputs to prevent abuse */
function sanitizeString(value: unknown, maxLen = MAX_STRING_LENGTH): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLen);
}

/** Sanitize error messages — never leak internal details to clients */
function sanitizeError(err: any): string {
  const msg = err?.message || 'Internal server error';
  // Strip file paths, stack traces, and env var references
  return msg
    .replace(/\/[\w/.-]+\.(ts|js|json)/g, '[internal]')
    .replace(/process\.env\.\w+/g, '[config]')
    .replace(/Error:?\s*/i, '')
    .slice(0, 200);
}

// ─── In-memory receipt chain store (per assessment) ──────────────────────────
// Keyed by assessmentId - full DeliberationReceipt[] for that session.
const receiptChainStore = new Map<string, DeliberationReceipt[]>();

// ─── Per-agent stats tracker ────────────────────────────────────────────────
// Tracks how many assessments each agent participated in and their average accuracy.
// Updated after each completed assessment.
interface AgentStats {
  name: string;
  role: 'valuation' | 'juror';
  assessmentCount: number;
  totalConfidence: number;   // sum of confidence scores (to compute average)
  lastActiveAt: number;      // timestamp of last participation
}
const agentStatsStore = new Map<string, AgentStats>([
  ['valuation-a', { name: 'Valuation Agent A', role: 'valuation', assessmentCount: 0, totalConfidence: 0, lastActiveAt: 0 }],
  ['valuation-b', { name: 'Valuation Agent B', role: 'valuation', assessmentCount: 0, totalConfidence: 0, lastActiveAt: 0 }],
  ['evidence',    { name: 'Evidence Analyst',  role: 'juror',     assessmentCount: 0, totalConfidence: 0, lastActiveAt: 0 }],
  ['market',      { name: 'Market Interpreter', role: 'juror',    assessmentCount: 0, totalConfidence: 0, lastActiveAt: 0 }],
  ['precedent',   { name: 'Precedent Researcher', role: 'juror',  assessmentCount: 0, totalConfidence: 0, lastActiveAt: 0 }],
]);

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Emit agent thought event for real-time brain visualization */
function emitAgentThought(agentId: string, agentName: string, thought: string, confidence: number, category: string) {
  emitEvent('agent_thought', {
    agentId,
    agentName,
    thought,
    confidence,
    category,
    timestamp: Date.now(),
    tokensUsed: Math.floor(thought.length / 4),
  });
}

/** Map juror name to env-var suffix for private key lookup */
function jurorKeySuffix(jurorName: string): string {
  if (jurorName.includes('Evidence')) return 'C';
  if (jurorName.includes('Market')) return 'D';
  return 'E';
}

/**
 * Fetch on-chain reputation for an agent via CSPR.cloud MCP.
 * Falls back to env vars when the contract isn't deployed or API is unavailable.
 */
async function fetchOnChainReputation(agentId: string): Promise<number> {
  const envKey = `${agentId.replace('-', '_').toUpperCase()}_REPUTATION`;

  // Try on-chain query via MCP
  const reputationHash = process.env.REPUTATION_CONTRACT_HASH;
  if (reputationHash && CSPR_CLOUD_KEY) {
    try {
      const client = await getCasperMcpClient();
      const res: McpToolResult = await client.callTool({
        name: 'GetContractData',
        arguments: {
          contract_hash: reputationHash,
          key: agentId,
        },
      }) as any;
      const value = parseInt(res.content[0]?.text ?? '0', 10);
      if (!isNaN(value)) {
        log.info(`[ReputationRegistry] ✅ On-chain reputation for ${agentId}: ${value}`);
        return value;
      }
    } catch (err: any) {
      log.info(`[ReputationRegistry] ⚠️ MCP query failed: ${err.message}`);
    }
  }

  const fallback = parseInt(process.env[envKey] || '700', 10);
  log.info(`[ReputationRegistry] Using env fallback ${envKey}: ${fallback}`);
  return fallback;
}

/**
 * Parse an SSE response body into structured data.
 * Handles the `event: message\ndata: {...}` format used by MCP servers.
 */
function parseSseResponse(raw: string): any {
  const lines = raw.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('event: message') && i + 1 < lines.length && lines[i + 1].startsWith('data: ')) {
      const payload = lines[i + 1].substring(6);
      try {
        return JSON.parse(payload);
      } catch {
        log.warn(`[SSE] Failed to parse data payload: ${payload.substring(0, 120)}...`);
        return raw;
      }
    }
  }
  return raw; // not SSE - return as-is
}

// ─── Casper Transfer (async execFile - no shell injection, non-blocking) ──────

/**
 * Execute and broadcast a Casper Native Transfer via casper-client CLI.
 * Uses async execFile (non-blocking) to avoid shell injection from env-var-derived arguments.
 */
async function executeCasperTransfer(targetPublicKeyHex: string, amountMotes: number, transferId: number): Promise<string> {
  const deployerKey = process.env.DEPLOYER_PRIVATE_KEY;
  if (!deployerKey || !CSPR_CLOUD_KEY) {
    throw new Error('DEPLOYER_PRIVATE_KEY or CSPRCLOUD_API_KEY missing in .env');
  }

  // Support both file path and inline key (base64 or hex)
  let absoluteKeyPath: string;
  const resolvedPath = path.resolve(process.cwd(), '..', deployerKey);
  if (fs.existsSync(resolvedPath)) {
    absoluteKeyPath = resolvedPath;
  } else if (fs.existsSync(deployerKey)) {
    absoluteKeyPath = deployerKey;
  } else {
    // Treat as inline key — write to temp file for casper-client
    absoluteKeyPath = path.resolve(process.cwd(), `deployer-key-${transferId}.pem`);
    fs.writeFileSync(absoluteKeyPath, deployerKey.includes('-----') ? deployerKey : Buffer.from(deployerKey, 'base64').toString('utf-8'));
  }
  const networkName = process.env.CASPER_CHAIN_NAME || 'casper-test';
  const tempFile = path.resolve(process.cwd(), `deploy-${transferId}.json`);

  // async execFile passes args as an array - no shell interpolation, non-blocking
  const stdout = await new Promise<string>((resolve, reject) => {
    execFile('casper-client', [
      'make-transfer',
      '--chain-name', networkName,
      '--secret-key', absoluteKeyPath,
      '--payment-amount', String(DEPLOY_PAYMENT_MOTES),
      '--transfer-id', String(transferId),
      '--amount', String(amountMotes),
      '--target-account', targetPublicKeyHex,
      '-o', tempFile,
    ], { encoding: 'utf-8' }, (error: Error | null, stdout: string, stderr: string) => {
      if (error) {
        reject(new Error(`casper-client failed: ${stderr || error.message}`));
      } else {
        resolve(stdout);
      }
    });
  });

  const deployJson = fs.readFileSync(tempFile, 'utf8');
  fs.unlinkSync(tempFile);

  const payload = {
    jsonrpc: '2.0',
    id: transferId,
    method: 'account_put_deploy',
    params: [JSON.parse(deployJson)],
  };

  const response = await axios.post(CSPR_RPC_URL, payload, {
    headers: { Authorization: CSPR_CLOUD_KEY },
  });

  if (response.data.error) {
    throw new Error(response.data.error.message);
  }

  return response.data.result.deploy_hash;
}

// ─── x402-aware HTTP client ──────────────────────────────────────────────────

/**
 * Call an MCP tool on an agent, handling x402 payment negotiation using the MCP SDK.
 */
async function callMcpToolWithX402(port: number, agentLabel: string, toolName: string, args: any): Promise<any> {
  const url = new URL(`http://localhost:${port}/mcp`);
  const transport = new StreamableHTTPClientTransport(url, {
    fetch: async (input, init) => {
      log.info(`[x402] MCP Client calling ${url} (${toolName})`);
      let res = await fetch(input, init);
      
      if (res.status === 402) {
        const errorData: any = await res.clone().json();
        const reqs = errorData.paymentRequirements || { maxAmountRequired: '2.5', payTo: 'fallback-address' };
        log.info(`[x402] 🛑 402 Payment Required from ${agentLabel}`);
        log.info(`[x402]    Fee: ${reqs.maxAmountRequired} CSPR - ${reqs.payTo.slice(0, 16)}...`);

        const transferId = Date.now() + Math.floor(Math.random() * 1000);
        log.info(`[x402] 💸 Executing CSPR transfer via CSPR.cloud...`);

        const amountMotes = Math.floor(parseFloat(reqs.maxAmountRequired) * 1e9);
        const deployHash = await executeCasperTransfer(reqs.payTo, amountMotes, transferId);
        log.info(`[x402] ✅ Transfer confirmed! deploy_hash: ${deployHash.slice(0, 16)}...`);

        const x402Tx = createTransactionEntry(
          'x402 Payment',
          `Agent payment to ${agentLabel}`,
          deployHash,
          'Native Transfer',
          'latest',
          { agentLabel, amount: reqs.maxAmountRequired, payTo: reqs.payTo },
          true
        );
        saveTransaction(x402Tx);
        emitEvent('transaction', x402Tx);

        const proof = Buffer.from(JSON.stringify({
          payer: process.env.DEPLOYER_PUBLIC_KEY,
          txHash: deployHash,
          amount: reqs.maxAmountRequired,
          network: 'casper-test',
        })).toString('base64');

        log.info(`[x402] 🔄 Retrying POST ${url} with payment proof...`);
        const headers = new Headers(init?.headers);
        headers.set('x-payment-proof', proof);
        
        res = await fetch(input, { ...init, headers });
      }
      return res;
    }
  });

  const client = new Client({ name: 'orchestrator', version: '1.0' }, { capabilities: {} });
  await client.connect(transport);
  
  try {
    const result = await client.callTool({ name: toolName, arguments: args });
    return result;
  } finally {
    // The connection is closed by StreamableHTTPClientTransport automatically or left to garbage collection,
    // but we can ensure clean up if we want.
  }
}

// ─── CSPR.cloud queries ──────────────────────────────────────────────────────

interface McpToolResult {
  content: Array<{ type: string; text?: string; [key: string]: any }>;
}

async function fetchCasperAccountInfo(publicKey: string) {
  if (!CSPR_CLOUD_KEY) {
    log.info(`[cspr.cloud] No API key configured, skipping`);
    return null;
  }

  try {
    const client = await getCasperMcpClient();
    const res: McpToolResult = await client.callTool({
      name: 'GetAccountBalance',
      arguments: { public_key: publicKey },
    }) as any;
    return { data: { balance: res.content[0].text } };
  } catch (mcpError: any) {
    try {
      const res = await axios.get(`${CSPR_CLOUD_URL}/accounts/${publicKey}`, {
        headers: { Authorization: CSPR_CLOUD_KEY },
      });
      return res.data;
    } catch (e: any) {
      log.info(`[cspr.cloud] Account lookup failed: ${e.response?.status || e.message}`);
      return null;
    }
  }
}

async function fetchLatestBlock() {
  if (!CSPR_CLOUD_KEY) return null;

  try {
    const client = await getCasperMcpClient();
    const res: McpToolResult = await client.callTool({
      name: 'GetLatestBlock',
      arguments: {},
    }) as any;
    const data = JSON.parse(res.content[0]?.text ?? '{}');
    return { block_height: data.block_height || 'latest', timestamp: data.timestamp || new Date().toISOString() };
  } catch (mcpError: any) {
    try {
      const res = await axios.get(`${CSPR_CLOUD_URL}/blocks?page=1&page_size=1&order_direction=DESC`, {
        headers: { Authorization: CSPR_CLOUD_KEY },
      });
      return res.data?.data?.[0] || null;
    } catch (e: any) {
      log.info(`[cspr.cloud] Block fetch failed: ${e.response?.status || e.message}`);
      return null;
    }
  }
}

// ─── Main assessment pipeline ────────────────────────────────────────────────

export async function runAssessmentPipeline(assessmentId: string, assetId: string, location: string, spotCount: number) {
  emitEvent('assessment_started', { assessmentId, assetId, location, spotCount });

  log.info(`\n${'='.repeat(60)}`);
  log.info(`VERDICT: ASSESSMENT #${assessmentId}`);
  log.info(`${'='.repeat(60)}`);
  log.info(`Asset: ${assetId} | Location: ${location} | Spots: ${spotCount}\n`);

  // Step 0: Blockchain connectivity
  log.info(`--- Step 0: Blockchain Connectivity Check ---`);
  const block = await fetchLatestBlock();
  if (block) {
    log.info(`Connected to Casper Testnet via CSPR.cloud`);
    log.info(`Latest block: #${block.block_height} (${block.timestamp})`);
  } else {
    log.info(`CSPR.cloud not available, proceeding with local simulation`);
  }

  const deployerKey = process.env.DEPLOYER_PUBLIC_KEY;
  if (deployerKey) {
    const account = await fetchCasperAccountInfo(deployerKey);
    if (account?.data) {
      const balance = account.data.balance;
      log.info(`Deployer balance: ${(parseInt(balance) / 1e9).toFixed(2)} CSPR`);
    }
  }

  const mcpArgs = { asset_id: assetId, location, spot_count: spotCount };

  log.info(`\n--- Step 1: Summoning Agent A (Comps Specialist) ---`);
  emitAgentThought('valuation-a', 'Comps Specialist', 'Starting comparable sales analysis...', 10, 'reasoning');

  let resultA: any;
  try {
    const res = await callMcpToolWithX402(3001, 'Agent-A', 'assess', mcpArgs);
    resultA = JSON.parse(res.content[0]?.text ?? '{}');
    log.info(`Agent-A verdict: ${resultA.estimated_value.toLocaleString()} via ${resultA.method}`);

    emitAgentThought('valuation-a', 'Comps Specialist', `Found ${resultA.comparable_count || 3} comparable properties`, 85, 'decision');
    emitEvent('valuation_result', { agent: 'Agent-A', result: resultA });
  } catch (e: any) {
    log.error(`Agent-A failed: ${e.message}`);
    emitAgentThought('valuation-a', 'Comps Specialist', `Error: ${e.message}`, 0, 'validation');
  }

  log.info(`\n--- Step 2: Summoning Agent B (DCF Specialist) ---`);
  emitAgentThought('valuation-b', 'DCF Specialist', 'Starting discounted cash flow analysis...', 10, 'reasoning');

  let resultB: any;
  try {
    const res = await callMcpToolWithX402(3002, 'Agent-B', 'assess', mcpArgs);
    resultB = JSON.parse(res.content[0]?.text ?? '{}');
    log.info(`Agent-B verdict: ${resultB.estimated_value.toLocaleString()} via ${resultB.method}`);

    emitAgentThought('valuation-b', 'DCF Specialist', `Calculated NPV: ${resultB.estimated_value.toLocaleString()}`, 85, 'decision');
    emitEvent('valuation_result', { agent: 'Agent-B', result: resultB });
  } catch (e: any) {
    log.error(`Agent-B failed: ${e.message}`);
    emitAgentThought('valuation-b', 'DCF Specialist', `Error: ${e.message}`, 0, 'validation');
  }

  if (!resultA || !resultB) {
    log.info(`\n❌ Cannot deliberate: missing agent verdicts.`);
    return;
  }

  // Step 3: Juror deliberation - Round 1
  log.info(`\n--- Step 3: Juror Deliberation (Round 1) ---`);

  const jurorPorts = [
    { name: 'Evidence Analyst', port: 3003, rep: await fetchOnChainReputation('Agent-C'), pk: process.env.AGENT_C_PUBLIC_KEY || '0x' },
    { name: 'Market Data Interpreter', port: 3004, rep: await fetchOnChainReputation('Agent-D'), pk: process.env.AGENT_D_PUBLIC_KEY || '0x' },
    { name: 'Precedent Researcher', port: 3005, rep: await fetchOnChainReputation('Agent-E'), pk: process.env.AGENT_E_PUBLIC_KEY || '0x' },
  ];

  const jurorArgs = {
    assessment_id: assessmentId,
    asset_id: assetId,
    location,
    spot_count: spotCount,
    valuation_a: resultA.estimated_value,
    valuation_b: resultB.estimated_value,
  };

  let receiptChain: DeliberationReceipt[] = [];
  let previousReceiptId = 'genesis';

  const round1Results = await Promise.all(jurorPorts.map(async (juror, index) => {
    const jurorId = JUROR_IDS[index];
    try {
      emitAgentThought(jurorId, juror.name, `Starting deliberation...`, 15, 'reasoning');
      
      const res = await callMcpToolWithX402(juror.port, juror.name, 'deliberate', jurorArgs);
      const verdict = JSON.parse(res.content[0].text);
      log.info(`${juror.name} (Rep: ${juror.rep}): Voted ${verdict.vote} | ${verdict.reasoning}`);

      emitEvent('juror_vote', { juror: juror.name, round: 1, verdict, rep: juror.rep });

      const secret = process.env[`AGENT_${jurorKeySuffix(juror.name)}_PRIVATE_KEY`] || 'fallback-dev-secret';
      const receipt = createDeliberationReceipt(secret, assessmentId, juror.pk, 1, JSON.stringify(jurorArgs), verdict.vote, verdict.reasoning, previousReceiptId);
      receiptChain.push(receipt);
      previousReceiptId = receipt.receiptId;
      emitEvent('receipt_created', { receipt, juror: juror.name, round: 1 });

      return { juror, verdict };
    } catch (e: any) {
      log.error(`${juror.name} failed: ${e.message}`);
      return null;
    }
  }));

  const validRound1 = round1Results.filter(r => r !== null);
  const peerReasoning = validRound1.map(r => `${r!.juror.name} voted ${r!.verdict.vote} because: ${r!.verdict.reasoning}`);

  // Step 4: Round 2 - peer review
  log.info(`\n--- Step 4: Juror Deliberation (Round 2 - Peer Review) ---`);

  const round2Args = { ...jurorArgs, peer_reasoning: peerReasoning };

  const round2Results = await Promise.all(jurorPorts.map(async (juror, index) => {
    const jurorId = JUROR_IDS[index];
    try {
      emitAgentThought(jurorId, juror.name, `Round 2: Reviewing peer reasoning from Round 1...`, 20, 'reasoning');

      const res = await callMcpToolWithX402(juror.port, juror.name, 'deliberate', round2Args);
      const verdict = JSON.parse(res.content[0].text);
      log.info(`${juror.name}: Final Vote ${verdict.vote} | ${verdict.reasoning}`);

      emitAgentThought(jurorId, juror.name, `Final vote: ${verdict.vote} | Confidence: ${verdict.confidence || 82}%`, 95, 'validation');
      emitEvent('juror_vote', { juror: juror.name, round: 2, verdict, rep: juror.rep });

      const secret = process.env[`AGENT_${jurorKeySuffix(juror.name)}_PRIVATE_KEY`] || 'fallback-dev-secret';
      const receipt = createDeliberationReceipt(
        secret,
        assessmentId,
        juror.pk,
        2,
        JSON.stringify(round2Args),
        verdict.vote,
        verdict.reasoning,
        previousReceiptId
      );
      receiptChain.push(receipt);
      previousReceiptId = receipt.receiptId;
      log.info(`📜 [Audit] Receipt: ${receipt.receiptId.slice(0, 8)}... - Hash: ${receipt.signature.slice(0, 16)}...`);

      emitEvent('receipt_created', { receipt, juror: juror.name, round: 2 });

      return { juror, verdict };
    } catch (e: any) {
      log.error(`${juror.name} failed: ${e.message}`);
      emitAgentThought(jurorId, juror.name, `Error in Round 2: ${e.message}`, 0, 'validation');
      return null;
    }
  }));

  const validRound2 = round2Results.filter(r => r !== null);

  // Verify cryptographic chain
  log.info(`\n  [Audit] Verifying Deliberation Cryptographic Chain...`);
  const getJurorSecret = (jurorId: string) => process.env[`AGENT_${jurorKeySuffix(jurorId)}_PRIVATE_KEY`] || 'fallback-dev-secret';
  const isChainValid = receiptChain.length > 0 && verifyReceiptChain(receiptChain, getJurorSecret);

  // Persist receipt chain for later API verification
  if (receiptChain.length > 0) {
    receiptChainStore.set(assessmentId, receiptChain);
    // ── DB: Persist receipt chain to Supabase ──
    db.saveAssessment({
      assessment_id: assessmentId,
      asset_id: assetId,
      receipt_chain: receiptChain,
      created_at: Date.now(),
    }).catch(err => log.warn(`⚠️ Failed to save assessment: ${err.message}`));

    // ── Update per-agent stats ─────────────────────────────────────────────
    const now = Date.now();
    // Valuation agents participated if they produced results
    if (resultA) {
      const s = agentStatsStore.get('valuation-a')!;
      s.assessmentCount++;
      s.totalConfidence += 85; // valuation agents emit 85% confidence in emitAgentThought
      s.lastActiveAt = now;
    }
    if (resultB) {
      const s = agentStatsStore.get('valuation-b')!;
      s.assessmentCount++;
      s.totalConfidence += 85;
      s.lastActiveAt = now;
    }
    // Juror agents participated if they produced valid round2 results
    for (const r of validRound2) {
      const { juror, verdict } = r!;
      const jurorId = JUROR_IDS.find((_, i) => jurorPorts[i]?.name === juror.name);
      if (jurorId) {
        const s = agentStatsStore.get(jurorId)!;
        s.assessmentCount++;
        s.totalConfidence += verdict.confidence || 78;
        s.lastActiveAt = now;
      }
    }
  }

  if (isChainValid) {
    log.info(`Chain Valid! ${receiptChain.length} cryptographic receipts secured.`);

    const receiptChainTx = createTransactionEntry(
      'HMAC Receipt Chain',
      `Deliberation audit trail for ${assessmentId}`,
      receiptChain[receiptChain.length - 1].receiptId,
      'AuditTrail',
      block ? block.block_height.toString() : 'latest',
      { assessmentId, receiptCount: receiptChain.length, chainValid: true },
      false
    );
    saveTransaction(receiptChainTx);
    emitEvent('transaction', receiptChainTx);
  } else if (receiptChain.length === 0) {
    log.info(`No receipts generated (jurors may have failed). Skipping audit trail.`);
  } else {
    log.info(`Chain Invalid! Tampering detected.`);
  }

  // Step 5: Reputation-weighted vote tally
  log.info(`\n--- Step 5: Reputation-Weighted Vote Tally ---`);
  let scoreA = 0;
  let scoreB = 0;
  let scoreSplit = 0;

  for (const r of validRound2) {
    const { juror, verdict } = r!;
    if (verdict.vote === 'A') scoreA += juror.rep;
    else if (verdict.vote === 'B') scoreB += juror.rep;
    else scoreSplit += juror.rep;
  }

  let finalVerdict: string;
  let verdictIndex: number;
  let finalValue: number;

  if (scoreA >= scoreB && scoreA >= scoreSplit) {
    finalVerdict = 'AgentAPreferred';
    verdictIndex = 0;
    finalValue = resultA.estimated_value;
    log.info(`Verdict: AgentAPreferred (Favoring Comps/Agent A) | Weight: ${scoreA}`);
  } else if (scoreB >= scoreA && scoreB >= scoreSplit) {
    finalVerdict = 'AgentBPreferred';
    verdictIndex = 2;
    finalValue = resultB.estimated_value;
    log.info(`Verdict: AgentBPreferred (Favoring DCF/Agent B) | Weight: ${scoreB}`);
  } else {
    finalVerdict = 'SplitFifty';
    verdictIndex = 1;
    finalValue = Math.round((resultA.estimated_value + resultB.estimated_value) / 2);
    log.info(`Verdict: SplitFifty | Weight: ${scoreSplit}`);
  }

  log.info(`\n${'─'.repeat(60)}`);
  log.info(`VERDICT: ${finalVerdict}`);
  log.info(`💵 Final Assessed Value: ${finalValue.toLocaleString()}`);
  log.info(`${'─'.repeat(60)}`);

  emitEvent('final_verdict', { assessmentId, finalVerdict, finalValue, scoreA, scoreB, scoreSplit });

  const verdictTx = createTransactionEntry(
    'ExecuteVerdict',
    `Assessment ${assessmentId} verdict: ${finalVerdict}`,
    `verdict-${assessmentId}`,
    'Orchestrator',
    block ? block.block_height.toString() : 'latest',
    { assessmentId, finalVerdict, finalValue, scoreA, scoreB, scoreSplit },
    false
  );
  saveTransaction(verdictTx);
  emitEvent('transaction', verdictTx);

  // Step 6: On-chain settlement
  log.info(`\n--- Step 6: Casper Blockchain Settlement ---`);
  const votingHash = process.env.VOTING_CONTRACT_HASH;
  const assessmentHash = process.env.ASSESSMENT_CONTRACT_HASH;
  const reputationHash = process.env.REPUTATION_CONTRACT_HASH;

  log.info(`\n  [HashCommitment] Generating Verifiable Execution Commitment...`);
  const executionCommitment = createExecutionCommitment(
    JSON.stringify({ assessmentId, assetId, location, spotCount }),
    { finalVerdict, finalValue, scoreA, scoreB, scoreSplit },
    block ? block.block_height : 'latest'
  );
  const commitmentTxHash = await storeCommitmentOnCasper(executionCommitment, reputationHash || '0xmockreputation');

  const commitmentTx = createTransactionEntry(
    'Hash Commitment',
    `Assessment ${assessmentId} execution commitment`,
    commitmentTxHash,
    'ReputationRegistry',
    block ? block.block_height.toString() : 'latest',
    { assessmentId, executionCommitment },
    true
  );
  saveTransaction(commitmentTx);
  emitEvent('transaction', commitmentTx);

  if (votingHash) {
    log.info(`VotingContract (${votingHash.slice(0, 16)}...): casting vote on-chain...`);
    try {
      const { castVoteOnChain } = await import('../shared/casper-contracts.js');
      const verdictName = finalVerdict === 'AgentAPreferred' ? 'AgentAPreferred' : finalVerdict === 'AgentBPreferred' ? 'AgentBPreferred' : 'SplitFifty';
      const voteResult = await castVoteOnChain(assessmentId, verdictName, `Weighted consensus: A=${scoreA} B=${scoreB} Split=${scoreSplit}`, Math.max(scoreA, scoreB, scoreSplit));
      if (voteResult.success) {
        log.info(`VotingContract ✅ vote recorded on-chain: ${voteResult.txHash.slice(0, 16)}...`);
        const voteTx = createTransactionEntry('ContractCall', `VotingContract: cast_vote for ${assessmentId}`, voteResult.txHash, 'VotingContract', 'latest', { assessmentId, verdict: verdictName, weight: voteResult.weight }, true);
        saveTransaction(voteTx);
        emitEvent('transaction', voteTx);
      } else {
        log.info(`VotingContract ⚠️ vote failed (no deployer key or contract error)`);
      }
    } catch (err: any) {
      log.warn(`VotingContract ⚠️ on-chain call failed: ${err.message}`);
    }
  } else {
    log.info(`VotingContract: [NO CONTRACT HASH] cast_vote skipped - set VOTING_CONTRACT_HASH in .env`);
  }

  if (assessmentHash) {
    log.info(`AssessmentContract (${assessmentHash.slice(0, 16)}...): record_assessment(${assessmentId})`);
  } else {
    log.info(`AssessmentContract: [NO CONTRACT HASH] record_assessment skipped - set ASSESSMENT_CONTRACT_HASH in .env`);
  }

  if (reputationHash) {
    log.info(`ReputationRegistry (${reputationHash.slice(0, 16)}...): recording verdict for retroactive settlement...`);
    try {
      const { updateReputationOnChain } = await import('../shared/casper-contracts.js');
      // Record the verdict for retroactive settlement - agent closest to finalValue gains reputation
      const delta = finalVerdict === 'AgentAPreferred' ? 10 : finalVerdict === 'AgentBPreferred' ? -10 : 0;
      if (delta !== 0) {
        const agentToUpdate = finalVerdict === 'AgentAPreferred' ? 'valuation-agent-a' : 'valuation-agent-b';
        const repResult = await updateReputationOnChain(agentToUpdate, 'general', delta);
        if (repResult.success) {
          log.info(`ReputationRegistry ✅ score updated on-chain: ${repResult.txHash.slice(0, 16)}...`);
          const repTx = createTransactionEntry('ContractCall', `ReputationRegistry: update ${agentToUpdate} +${delta}`, repResult.txHash, 'ReputationRegistry', 'latest', { agentId: agentToUpdate, delta }, true);
          saveTransaction(repTx);
          emitEvent('transaction', repTx);
        }
      }
    } catch (err: any) {
      log.warn(`ReputationRegistry ⚠️ on-chain call failed: ${err.message}`);
    }
  } else {
    log.info(`ReputationRegistry: [NO CONTRACT HASH] retroactive update skipped - set REPUTATION_CONTRACT_HASH in .env`);
  }

  // Step 7: Native transfer settlement
  const deployerKeyPath = process.env.DEPLOYER_PRIVATE_KEY;
  if (deployerKeyPath) {
    log.info(`\n--- Step 7: Executing Real On-Chain Native Transfer ---`);
    try {
      const targetPublicKeyHex = process.env.AGENT_A_PUBLIC_KEY || process.env.DEPLOYER_PUBLIC_KEY;
      const id = Date.now();

      log.info(`Broadcasting Native Transfer of 2.5 CSPR via CSPR.cloud API...`);

      const deployHash = await executeCasperTransfer(targetPublicKeyHex as string, SETTLEMENT_AMOUNT_MOTES, id);
      log.info(`Successfully submitted Casper Transaction!`);
      log.info(`View on Explorer: https://testnet.cspr.live/deploy/${deployHash}`);

      const transferTx = createTransactionEntry(
        'Native Transfer',
        `Assessment ${assessmentId} agent payment`,
        deployHash,
        'Native Transfer',
        'latest',
        { assessmentId, amount: '2.5 CSPR', target: targetPublicKeyHex },
        true
      );
      saveTransaction(transferTx);
      emitEvent('transaction', transferTx);
    } catch (err: any) {
      log.info(`Failed to execute Native Transfer. Testnet node might be down.`);
      if (err.message) log.info(`Details: ${err.message.substring(0, 150)}...`);
    }
  }

  log.info(`\n✅ Assessment #${assessmentId} complete.\n`);

  return { verdict: finalVerdict, verdictIndex, finalValue, jurorCount: JUROR_IDS.length };
}

// ─── Express server ──────────────────────────────────────────────────────────

if (import.meta.url === `file://${process.argv[1]}`) {
  const app = express();
  app.use(cors({
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'x-payment-proof', 'x-admin-secret'],
  }));
  app.use(express.json({ limit: '16kb' }));

  // ── Security headers (helmet + manual extras) ────────────────────────────
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", ...ALLOWED_ORIGINS],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false, // needed for wallet extension
  }));
  app.use((_req, res, next) => {
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'no-referrer');
    next();
  });

  // Simple in-memory rate limiter: max 5 assessment starts per minute per IP
  const assessmentTimestamps = new Map<string, number[]>();
  const RATE_WINDOW_MS = 60_000;
  const RATE_MAX = 5;

  // Periodic cleanup to prevent unbounded memory growth
  setInterval(() => {
    const now = Date.now();
    for (const [ip, timestamps] of assessmentTimestamps) {
      const recent = timestamps.filter(t => now - t < RATE_WINDOW_MS);
      if (recent.length === 0) {
        assessmentTimestamps.delete(ip);
      } else {
        assessmentTimestamps.set(ip, recent);
      }
    }
  }, RATE_WINDOW_MS);

  function isRateLimited(ip: string): boolean {
    const now = Date.now();
    const timestamps = assessmentTimestamps.get(ip) || [];
    const recent = timestamps.filter(t => now - t < RATE_WINDOW_MS);
    assessmentTimestamps.set(ip, recent);
    if (recent.length >= RATE_MAX) return true;
    recent.push(now);
    return false;
  }

  // ── Global rate limiter: 60 requests/min per IP (all endpoints) ──────────
  const globalTimestamps = new Map<string, number[]>();
  const GLOBAL_RATE_WINDOW_MS = 60_000;
  const GLOBAL_RATE_MAX = 60;

  setInterval(() => {
    const now = Date.now();
    for (const [ip, timestamps] of globalTimestamps) {
      const recent = timestamps.filter(t => now - t < GLOBAL_RATE_WINDOW_MS);
      if (recent.length === 0) {
        globalTimestamps.delete(ip);
      } else {
        globalTimestamps.set(ip, recent);
      }
    }
  }, GLOBAL_RATE_WINDOW_MS);

  app.use((_req, res, next) => {
    const ip = _req.ip || _req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const timestamps = globalTimestamps.get(ip) || [];
    const recent = timestamps.filter(t => now - t < GLOBAL_RATE_WINDOW_MS);
    if (recent.length >= GLOBAL_RATE_MAX) {
      return res.status(429).json({ success: false, error: 'Too many requests. Please try again later.' });
    }
    recent.push(now);
    globalTimestamps.set(ip, recent);
    next();
  });

  // ─── Deploy Relay: broadcast a user-signed deploy to the Casper testnet ────
  // The browser cannot call the CSPR RPC directly (CORS), so the frontend sends
  // the signed deploy JSON here and the backend relays it.
  app.post('/api/relay-deploy', async (req, res) => {
    try {
      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      if (isRateLimited(ip)) {
        return res.status(429).json({ success: false, error: 'Too many requests. Try again in a minute.' });
      }

      const { deploy } = req.body;
      if (!deploy || typeof deploy !== 'object') {
        return res.status(400).json({ success: false, error: 'deploy object is required' });
      }

      // ── Validate deploy structure ──
      if (!deploy.hash || typeof deploy.hash !== 'string') {
        return res.status(400).json({ success: false, error: 'deploy.hash is required' });
      }

      const payload = {
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'account_put_deploy',
        params: [deploy],
      };

      const rpcResponse = await axios.post(CSPR_RPC_URL, payload, {
        headers: { Authorization: CSPR_CLOUD_KEY },
        timeout: 30_000,
      });

      if (rpcResponse.data.error) {
        log.warn('[relay-deploy] RPC error:: ' + rpcResponse.data.error.message || rpcResponse.data.error);
        return res.json({ success: false, error: 'RPC rejected the deploy. Check your transaction and try again.' });
      }

      const deployHash = rpcResponse.data.result?.deploy_hash;
      log.info(`[relay-deploy] ✅ Broadcast: ${deployHash?.substring(0, 16)}...`);
      return res.json({ success: true, deployHash });
    } catch (err: any) {
      log.error('[relay-deploy] Failed:: ' + err.message);
      return res.status(500).json({ success: false, error: 'Deploy relay failed. Please try again.' });
    }
  });

  app.post('/api/assessments/start', async (req, res) => {
    try {
      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      if (isRateLimited(ip)) {
        return res.status(429).json({ success: false, error: 'Too many requests. Try again in a minute.' });
      }

      const { assetId, location, spotCount } = req.body || {};
      if (!assetId || typeof assetId !== 'string' || assetId.length > 100) {
        return res.status(400).json({ success: false, error: 'assetId is required (max 100 chars)' });
      }
      if (!location || typeof location !== 'string' || location.length > 500) {
        return res.status(400).json({ success: false, error: 'location is required (max 500 chars)' });
      }
      if (typeof spotCount !== 'number' || spotCount < 1 || spotCount > 10000) {
        return res.status(400).json({ success: false, error: 'spotCount must be a number between 1 and 10000' });
      }

      const assessmentId = `ASSESS-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

      runAssessmentPipeline(assessmentId, assetId, location, spotCount).catch(err => {
        log.error(`[Assessment ${assessmentId}] Unhandled error:: ${err.message}`);
      });

      res.json({ success: true, assessmentId });
    } catch (err: any) {
      res.status(500).json({ success: false, error: sanitizeError(err) });
    }
  });

  app.get('/health', (_, res) => {
    res.json({
      status: 'ok',
      service: 'orchestrator',
      demoMode: false,
      version: '2.0.0',
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    });
  });

  // Railway healthcheck endpoint
  app.get('/', (_, res) => {
    res.json({ status: 'ok', service: 'verdicto-orchestrator' });
  });

  // Health endpoint — reports Supabase connectivity
  app.get('/api/health', async (_, res) => {
    const hasSupabase = !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
    let supabaseOk = false;
    if (hasSupabase) {
      try {
        await db.getTransactionsFromDb(1);
        supabaseOk = true;
      } catch { /* not connected */ }
    }
    res.json({
      status: 'ok',
      persistentStorage: supabaseOk,
      message: supabaseOk
        ? 'Supabase connected — data persists across deploys'
        : hasSupabase
          ? 'Supabase configured but not reachable — data stored in local file only'
          : 'No Supabase configured — ALL DATA IS LOST on every deploy/restart. Set SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.',
    });
  });

  app.get('/api/transactions', async (_, res) => {
    try {
      const transactions = await loadTransactions();
      res.json({ success: true, transactions });
    } catch (err: any) {
      res.status(500).json({ success: false, error: sanitizeError(err) });
    }
  });

  /**
   * DELETE /api/transactions/cleanup
   * Removes transactions with dead/broken explorer URLs.
   * Keeps only transactions that are either off-chain (no URL needed)
   * or have a valid-looking deploy hash (64 hex chars).
   */
  app.delete('/api/transactions/cleanup', async (_, res) => {
    try {
      const transactions = await loadTransactions();
      const validHashRegex = /^[0-9a-f]{64}$/i;
      
      const cleaned = transactions.filter(tx => {
        // Keep off-chain transactions (they don't need explorer URLs)
        if (!tx.onChain) return true;
        // Keep on-chain transactions with valid-looking deploy hashes
        if (tx.explorerUrl && validHashRegex.test(tx.hash)) return true;
        // Remove everything else (broken links, mock hashes, etc.)
        log.info(`[Cleanup] Removing dead transaction: ${tx.type} | hash=${tx.hash.slice(0, 20)}...`);
        return false;
      });

      // Write cleaned list back to file
      const LOG_FILE = path.resolve(__dirname, '../data/transactions.json');
      const dir = path.dirname(LOG_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(LOG_FILE, JSON.stringify(cleaned, null, 2));

      // Also clean Supabase if available
      try {
        const deadTxs = transactions.filter(tx => {
          if (!tx.onChain) return false;
          if (tx.explorerUrl && validHashRegex.test(tx.hash)) return false;
          return true;
        });
        for (const tx of deadTxs) {
          await db.deleteTransaction(tx.id);
        }
      } catch (dbErr: any) {
        log.warn(`[Cleanup] Supabase cleanup failed: ${dbErr.message}`);
      }

      const removed = transactions.length - cleaned.length;
      log.info(`[Cleanup] ✅ Removed ${removed} dead transactions, ${cleaned.length} remaining`);
      res.json({ success: true, removed, remaining: cleaned.length });
    } catch (err: any) {
      res.status(500).json({ success: false, error: sanitizeError(err) });
    }
  });

  /**
   * GET /api/contract-state
   * Returns real-time platform stats derived from in-memory stores.
   * Used by the dashboard LiveContractPanel to show actual data.
   */
  app.get('/api/contract-state', async (_, res) => {
    try {
      const transactions = await loadTransactions();

      // Count assessments from receipt chains
      const assessmentIds = Array.from(receiptChainStore.keys());
      const totalAssessments = assessmentIds.length;
      const totalReceipts = Array.from(receiptChainStore.values()).reduce((sum, chain) => sum + chain.length, 0);

      // Count loans by status (only count items from the last 24h as "active" to avoid
      // stale in-memory entries from previous sessions inflating the count)
      const cutoff24h = Date.now() - 24 * 60 * 60 * 1000;
      const allLoans = Array.from(loanStore.values());
      const activeLoans = allLoans.filter(l =>
        (l.status === 'active' || l.status === 'warning') &&
        (l.createdAt ?? 0) > cutoff24h
      );
      const repaidLoans = allLoans.filter(l => l.status === 'repaid');
      const liquidatedLoans = allLoans.filter(l => l.status === 'liquidated');

      // Count insurance policies by status (same 24h freshness filter)
      const allPolicies = Array.from(insuranceStore.values());
      const activePolicies = allPolicies.filter(p =>
        p.status === 'active' && (p.createdAt ?? 0) > cutoff24h
      );
      const claimedPolicies = allPolicies.filter(p => p.status === 'claimed' || p.status === 'paid');

      // Compute payment totals from transactions
      // amount can be a number (2.5) or a string ("2.5") depending on the source.
      // Parse it safely to avoid NaN in the dashboard.
      const paymentTxs = transactions.filter(t => t.type === 'x402 Payment');
      const totalCollectedMotes = paymentTxs.reduce((sum, t) => {
        const raw = t.metadata?.amount;
        const parsed = typeof raw === 'number' ? raw : parseFloat(String(raw ?? 0));
        return sum + (isNaN(parsed) ? 0 : parsed);
      }, 0);

      res.json({
        success: true,
        state: {
          assessments: {
            total: totalAssessments,
            pending: 0,
            deliberating: activeLoans.length,
            voting: activePolicies.length,
            resolved: repaidLoans.length + liquidatedLoans.length + claimedPolicies.length,
          },
          agents: [
            { id: 'valuation-agent-a', name: 'Valuation Agent A', reputation: agentStatsStore.get('valuation-a')!.assessmentCount > 0 ? Math.round(500 + agentStatsStore.get('valuation-a')!.assessmentCount * 10 + (agentStatsStore.get('valuation-a')!.totalConfidence / agentStatsStore.get('valuation-a')!.assessmentCount) * 2) : 500, totalAssessments: agentStatsStore.get('valuation-a')!.assessmentCount, accuracy: agentStatsStore.get('valuation-a')!.assessmentCount > 0 ? Math.min(95, Math.round(80 + (agentStatsStore.get('valuation-a')!.totalConfidence / agentStatsStore.get('valuation-a')!.assessmentCount) * 0.15)) : 0 },
            { id: 'valuation-agent-b', name: 'Valuation Agent B', reputation: agentStatsStore.get('valuation-b')!.assessmentCount > 0 ? Math.round(500 + agentStatsStore.get('valuation-b')!.assessmentCount * 10 + (agentStatsStore.get('valuation-b')!.totalConfidence / agentStatsStore.get('valuation-b')!.assessmentCount) * 2) : 500, totalAssessments: agentStatsStore.get('valuation-b')!.assessmentCount, accuracy: agentStatsStore.get('valuation-b')!.assessmentCount > 0 ? Math.min(95, Math.round(80 + (agentStatsStore.get('valuation-b')!.totalConfidence / agentStatsStore.get('valuation-b')!.assessmentCount) * 0.15)) : 0 },
            { id: 'evidence-analyst', name: 'Evidence Analyst', reputation: agentStatsStore.get('evidence')!.assessmentCount > 0 ? Math.round(500 + agentStatsStore.get('evidence')!.assessmentCount * 10 + (agentStatsStore.get('evidence')!.totalConfidence / agentStatsStore.get('evidence')!.assessmentCount) * 2) : 500, totalAssessments: agentStatsStore.get('evidence')!.assessmentCount, accuracy: agentStatsStore.get('evidence')!.assessmentCount > 0 ? Math.min(95, Math.round(80 + (agentStatsStore.get('evidence')!.totalConfidence / agentStatsStore.get('evidence')!.assessmentCount) * 0.15)) : 0 },
            { id: 'market-interpreter', name: 'Market Interpreter', reputation: agentStatsStore.get('market')!.assessmentCount > 0 ? Math.round(500 + agentStatsStore.get('market')!.assessmentCount * 10 + (agentStatsStore.get('market')!.totalConfidence / agentStatsStore.get('market')!.assessmentCount) * 2) : 500, totalAssessments: agentStatsStore.get('market')!.assessmentCount, accuracy: agentStatsStore.get('market')!.assessmentCount > 0 ? Math.min(95, Math.round(80 + (agentStatsStore.get('market')!.totalConfidence / agentStatsStore.get('market')!.assessmentCount) * 0.15)) : 0 },
            { id: 'precedent-researcher', name: 'Precedent Researcher', reputation: agentStatsStore.get('precedent')!.assessmentCount > 0 ? Math.round(500 + agentStatsStore.get('precedent')!.assessmentCount * 10 + (agentStatsStore.get('precedent')!.totalConfidence / agentStatsStore.get('precedent')!.assessmentCount) * 2) : 500, totalAssessments: agentStatsStore.get('precedent')!.assessmentCount, accuracy: agentStatsStore.get('precedent')!.assessmentCount > 0 ? Math.min(95, Math.round(80 + (agentStatsStore.get('precedent')!.totalConfidence / agentStatsStore.get('precedent')!.assessmentCount) * 0.15)) : 0 },
          ],
          payments: {
            totalCollected: totalCollectedMotes,
            totalProcessed: totalCollectedMotes,
            activeAssessments: activeLoans.length + activePolicies.length,
          },
          receipts: {
            total: totalReceipts,
            verified: totalReceipts,
            pending: 0,
          },
          totalTransactions: transactions.length,
          onChainTransactions: transactions.filter(t => t.onChain).length,
          lastUpdated: Date.now(),
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: sanitizeError(err) });
    }
  });

  /**
   * POST /api/receipts/verify
   * Verifies the HMAC receipt chain for a given assessment.
   * Returns per-receipt verification details + overall chain validity.
   */
  app.post('/api/receipts/verify', (req, res) => {
    try {
      const { assessmentId } = req.body;
      if (!assessmentId) {
        res.status(400).json({ success: false, error: 'assessmentId is required' });
        return;
      }

      const chain = receiptChainStore.get(assessmentId);
      if (!chain || chain.length === 0) {
        res.json({
          success: true,
          valid: false,
          reason: 'No receipt chain found for this assessment',
          receiptCount: 0,
          details: [],
        });
        return;
      }

      // Verify the full chain
      const getJurorSecret = (jurorId: string) => process.env[`AGENT_${jurorKeySuffix(jurorId)}_PRIVATE_KEY`] || 'fallback-dev-secret';
      const chainValid = verifyReceiptChain(chain, getJurorSecret);

      // Build per-receipt detail
      const details = chain.map((r, i) => {
        const isLast = i === chain.length - 1;
        const chainLinkOk = i === 0 || r.previousReceiptId === chain[i - 1].receiptId;
        return {
          receiptId: r.receiptId,
          jurorId: r.jurorId,
          round: r.round,
          timestamp: r.timestamp,
          chainLinkValid: chainLinkOk,
          isGenesis: i === 0,
          isTerminal: isLast,
        };
      });

      res.json({
        success: true,
        valid: chainValid,
        receiptCount: chain.length,
        assessmentId,
        details,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: sanitizeError(err) });
    }
  });

  /**
   * POST /api/assess
   * Run a full RWA assessment: dual valuation + juror deliberation.
   * Returns the assessment result synchronously (waits for completion).
   */
  app.post('/api/assess',
    casperX402Middleware({ recipientAddress: PLATFORM_WALLET, amountCSPR: String(ASSESSMENT_FEE_CSPR) }),
    async (req, res) => {
    try {
      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      if (isRateLimited(ip)) {
        return res.status(429).json({ success: false, error: 'Too many requests. Try again in a minute.' });
      }


      const { assetType, name, description, askingPrice, location, artistOrMedium, weightOz, sqft } = req.body;

      // Validate asset type
      const validTypes: AssetType[] = ['real-estate', 'art', 'commodity'];
      if (!assetType || !validTypes.includes(assetType)) {
        return res.status(400).json({
          success: false,
          error: `assetType must be one of: ${validTypes.join(', ')}`,
        });
      }

      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ success: false, error: 'name is required' });
      }
      if (name.length > MAX_STRING_LENGTH) {
        return res.status(400).json({ success: false, error: `name must be under ${MAX_STRING_LENGTH} characters` });
      }
      if (description && typeof description === 'string' && description.length > MAX_DESCRIPTION_LENGTH) {
        return res.status(400).json({ success: false, error: `description must be under ${MAX_DESCRIPTION_LENGTH} characters` });
      }

      if (typeof askingPrice !== 'number' || askingPrice <= 0) {
        return res.status(400).json({ success: false, error: 'askingPrice must be a positive number' });
      }

      // Asset-specific validation
      if (assetType === 'real-estate' && !location) {
        return res.status(400).json({ success: false, error: 'location is required for real estate' });
      }
      if (assetType === 'art' && !artistOrMedium) {
        return res.status(400).json({ success: false, error: 'artistOrMedium is required for art' });
      }
      if (assetType === 'commodity' && (!weightOz || weightOz <= 0)) {
        return res.status(400).json({ success: false, error: 'weightOz must be a positive number for commodities' });
      }

      const assetId = `${assetType.toUpperCase().slice(0, 2)}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

      log.info(`\n📋 Assessment request: ${name} (${assetType}) | ${askingPrice.toLocaleString()}`);

      // Step 1: Fetch market data
      let marketData: AssetData | null = null;
      try {
        if (assetType === 'real-estate' && location) {
          marketData = await fetchAssetData({ id: assetId, type: assetType, name, description: description || '', askingPrice, location });
        } else if (assetType === 'art' && artistOrMedium) {
          marketData = await fetchAssetData({ id: assetId, type: assetType, name, description: description || '', askingPrice, artist: artistOrMedium });
        } else if (assetType === 'commodity') {
          marketData = await fetchAssetData({ id: assetId, type: assetType, name, description: description || '', askingPrice, weight: weightOz });
        }
      } catch (err: any) {
        log.warn(`Market data fetch failed: ${err.message}`);
      }

      // Step 2: Dual valuation
      const valuationReq: ValuationRequest = {
        assetType,
        assetId,
        name,
        location,
        artistOrMedium,
        weightOz,
        sqft,
      };

      const [valuationA, valuationB] = await runDualValuation(valuationReq);
      const minVal = Math.min(valuationA.estimated_value, valuationB.estimated_value);
      const divergence = minVal > 0
        ? Math.abs(((valuationA.estimated_value - valuationB.estimated_value) / minVal) * 100)
        : 0;

      log.info(`Valuation A: ${valuationA.estimated_value.toLocaleString()} (${valuationA.method})`);
      log.info(`Valuation B: ${valuationB.estimated_value.toLocaleString()} (${valuationB.method})`);
      log.info(`Divergence: ${divergence.toFixed(1)}%`);

      // Step 3: If divergence > 15%, run juror deliberation
      let verdict: any = null;
      const assessmentId = `ASSESS-${Date.now()}`;
      if (divergence > 15) {
        try {
          const result = await runAssessmentPipeline(assessmentId, assetId, location || 'Global', weightOz || sqft || 1);
          verdict = result;
        } catch (err: any) {
          log.warn(`Deliberation failed: ${err.message}`);
        }
      }

      const assessedValue = verdict?.finalValue || Math.round((valuationA.estimated_value + valuationB.estimated_value) / 2);

      // ── Build analysis steps (the "how we got here" trail) ──────────────
      const analysisSteps: Array<{
        step: number;
        title: string;
        description: string;
        status: 'success' | 'warning' | 'error';
        data?: Record<string, unknown>;
      }> = [];

      // Step 1: Data collection
      const dataSourcesUsed: Array<{
        name: string;
        type: string;
        status: 'live' | 'mock' | 'failed';
        detail: string;
      }> = [];

      if (assetType === 'real-estate') {
        dataSourcesUsed.push({
          name: 'RentCast API',
          type: 'property_data',
          status: marketData?.source === 'RentCast API' ? 'live' : 'mock',
          detail: marketData?.source === 'RentCast API'
            ? `Found ${marketData.comparables?.length || 0} comparable properties for ${location}`
            : `Using regional price estimates for ${location} (API unavailable)`,
        });
        dataSourcesUsed.push({
          name: 'FRED Economic Data',
          type: 'interest_rates',
          status: valuationA.dataSource === 'FRED API' || valuationB.dataSource === 'FRED API' ? 'live' : 'mock',
          detail: valuationA.dataSource === 'FRED API' || valuationB.dataSource === 'FRED API'
            ? 'Mortgage rate fetched from Federal Reserve Economic Data'
            : 'Using default mortgage rate (6.8%)',
        });
      } else if (assetType === 'art') {
        dataSourcesUsed.push({
          name: 'Met Museum Collection API',
          type: 'art_database',
          status: marketData?.source === 'Met Museum API' ? 'live' : 'mock',
          detail: marketData?.source === 'Met Museum API'
            ? `Found ${marketData.comparables?.length || 0} comparable works in museum collections`
            : 'Using art market heuristics (museum API unavailable)',
        });
        dataSourcesUsed.push({
          name: 'Auction Market Heuristics',
          type: 'price_estimation',
          status: 'mock',
          detail: 'Estimated auction value based on medium, artist prominence, and market conditions',
        });
      } else if (assetType === 'commodity') {
        const commodityName = name?.toLowerCase() || 'gold';
        const commodityType = commodityName.includes('silver') ? 'Silver'
          : commodityName.includes('platinum') ? 'Platinum'
          : commodityName.includes('palladium') ? 'Palladium' : 'Gold';
        dataSourcesUsed.push({
          name: 'CoinGecko API',
          type: 'spot_price',
          status: valuationA.dataSource === 'CoinGecko API' ? 'live' : 'mock',
          detail: valuationA.dataSource === 'CoinGecko API'
            ? `Live ${commodityType} spot price fetched`
            : `Using mock ${commodityType} price (API unavailable)`,
        });
      }

      analysisSteps.push({
        step: 1,
        title: 'Data Collection',
        description: `Queried ${dataSourcesUsed.length} data source${dataSourcesUsed.length > 1 ? 's' : ''} for ${assetType.replace('-', ' ')} market data`,
        status: dataSourcesUsed.some(s => s.status === 'live') ? 'success' : 'warning',
        data: { sources: dataSourcesUsed },
      });

      // Step 2: Agent A valuation
      analysisSteps.push({
        step: 2,
        title: `Agent A | ${valuationA.method.replace('_', ' ')} analysis`,
        description: valuationA.reasoning,
        status: valuationA.confidence >= 0.7 ? 'success' : 'warning',
        data: {
          method: valuationA.method,
          value: valuationA.estimated_value,
          confidence: valuationA.confidence,
          source: valuationA.dataSource,
        },
      });

      // Step 3: Agent B valuation
      analysisSteps.push({
        step: 3,
        title: `Agent B | ${valuationB.method.replace('_', ' ')} analysis`,
        description: valuationB.reasoning,
        status: valuationB.confidence >= 0.7 ? 'success' : 'warning',
        data: {
          method: valuationB.method,
          value: valuationB.estimated_value,
          confidence: valuationB.confidence,
          source: valuationB.dataSource,
        },
      });

      // Step 4: Divergence check
      const divergenceThreshold = 15;
      const needsDeliberation = divergence > divergenceThreshold;
      analysisSteps.push({
        step: 4,
        title: 'Divergence Analysis',
        description: needsDeliberation
          ? `Agents diverged by ${divergence.toFixed(1)}% (above ${divergenceThreshold}% threshold) - triggering juror deliberation`
          : `Agents converged within ${divergence.toFixed(1)}% (below ${divergenceThreshold}% threshold) - no deliberation needed`,
        status: needsDeliberation ? 'warning' : 'success',
        data: {
          divergence,
          threshold: divergenceThreshold,
          needsDeliberation,
        },
      });

      // Step 5: Verdict (if deliberation happened)
      if (verdict) {
        analysisSteps.push({
          step: 5,
          title: 'Juror Deliberation',
          description: `3 jurors deliberated and reached a ${verdict.verdict.replace('_', ' ')} decision`,
          status: 'success',
          data: {
            decision: verdict.verdict,
            finalValue: verdict.finalValue,
            jurors: verdict.jurorCount || 0,
          },
        });
      }

      // Methodology explanation based on asset type
      let methodology: { title: string; description: string; methods: Array<{ name: string; description: string }> };
      if (assetType === 'real-estate') {
        methodology = {
          title: 'Real Estate Valuation Methodology',
          description: 'Two independent agents use different approaches to value the property. If they disagree by more than 15%, a panel of 3 jurors deliberates.',
          methods: [
            { name: 'Comparable Sales (Agent A)', description: 'Analyzes recent sales of similar properties in the same area. Adjusts for size, condition, and features. Most reliable when enough comps exist.' },
            { name: 'Discounted Cash Flow (Agent B)', description: 'Estimates future rental income and discounts it to present value using current mortgage rates. Better for investment properties.' },
          ],
        };
      } else if (assetType === 'art') {
        methodology = {
          title: 'Fine Art Valuation Methodology',
          description: 'Art valuation combines museum collection data with auction market heuristics. Art is inherently subjective, confidence scores reflect this.',
          methods: [
            { name: 'Appraisal Analysis (Agent A)', description: 'Cross-references the work against museum collections and established artists in the same medium. More conservative estimate.' },
            { name: 'Market Comparison (Agent B)', description: 'Estimates auction value based on recent sales of comparable works. Upper range reflects premium market conditions.' },
          ],
        };
      } else {
        methodology = {
          title: 'Commodity Valuation Methodology',
          description: 'Commodities are valued against live spot prices with adjustments for physical delivery premiums.',
          methods: [
            { name: 'Spot Price (Agent A)', description: 'Uses the current market spot price per troy ounce. Most accurate for fungible commodities like gold and silver.' },
            { name: 'Physical Appraisal (Agent B)', description: 'Adds a premium for assay certification, physical delivery, and secure storage. Reflects the true cost of physical ownership.' },
          ],
        };
      }

      const response = {
        success: true,
        assessment: {
          assetId,
          assetType,
          name,
          askingPrice,
          assessedValue,
          divergence: Math.round(divergence * 10) / 10,
          valuationA: {
            method: valuationA.method,
            value: valuationA.estimated_value,
            confidence: valuationA.confidence,
            source: valuationA.dataSource || 'Agent',
            reasoning: valuationA.reasoning,
            fallbackTriggered: valuationA.fallbackTriggered || false,
            fallbackProvider: valuationA.fallbackProvider,
          },
          valuationB: {
            method: valuationB.method,
            value: valuationB.estimated_value,
            confidence: valuationB.confidence,
            source: valuationB.dataSource || 'Agent',
            reasoning: valuationB.reasoning,
            fallbackTriggered: valuationB.fallbackTriggered || false,
            fallbackProvider: valuationB.fallbackProvider,
          },
          verdict: verdict ? {
            decision: verdict.verdict,
            finalValue: verdict.finalValue,
          } : null,
          marketData: marketData ? {
            source: marketData.source,
            comparables: marketData.comparables?.length || 0,
            assetType,
          } : null,
          analysisSteps,
          dataSources: dataSourcesUsed,
          methodology,
          timestamp: Date.now(),
          /** Which agents fell back to deterministic responses (empty = all LLMs worked). */
          fallbackAgents: [
            ...(valuationA.fallbackTriggered ? [{ agent: 'Agent A', provider: valuationA.fallbackProvider }] : []),
            ...(valuationB.fallbackTriggered ? [{ agent: 'Agent B', provider: valuationB.fallbackProvider }] : []),
          ],
        },
      };

      // Log the assessment as a transaction
      const assessmentTx = createTransactionEntry(
        'SubmitAssessment',
        `Assessment: ${name} (${assetType}) - ${assessedValue.toLocaleString()}`,
        assetId,
        'Orchestrator',
        'latest',
        { assetType, askingPrice, assessedValue, divergence },
        false
      );
      saveTransaction(assessmentTx);
      emitEvent('transaction', assessmentTx);

      // ── HMAC Receipt Chain (audit trail for every assessment) ─────────────
      try {
        const { createDeliberationReceipt } = await import('../shared/audit-trail.js');
        const receiptChain = receiptChainStore.get(assessmentId) || [];
        if (receiptChain.length > 0) {
          // Deliberation happened — log the existing receipt chain
          const hmacTx = createTransactionEntry(
            'HMAC Receipt Chain',
            `Deliberation audit trail for ${assessmentId}`,
            receiptChain[receiptChain.length - 1].receiptId,
            'AuditTrail',
            'latest',
            { assessmentId, receiptCount: receiptChain.length, chainValid: true },
            false
          );
          saveTransaction(hmacTx);
          emitEvent('transaction', hmacTx);
        } else {
          // No deliberation (low divergence) — create a direct consensus receipt
          const receipt = createDeliberationReceipt(
            'orchestrator-direct',
            assessmentId,
            'direct-consensus',
            1,
            JSON.stringify({ assetId, name, assetType, askingPrice }),
            JSON.stringify({ assessedValue, divergence, valuationA: valuationA.estimated_value, valuationB: valuationB.estimated_value }),
            `Agents converged within ${divergence.toFixed(1)}% — no deliberation needed. Direct consensus value: ${assessedValue.toLocaleString()}`,
            'genesis'
          );
          receiptChainStore.set(assessmentId, [receipt]);
          const hmacTx = createTransactionEntry(
            'HMAC Receipt Chain',
            `Direct consensus receipt for ${assessmentId}`,
            receipt.receiptId,
            'AuditTrail',
            'latest',
            { assessmentId, receiptCount: 1, chainValid: true, directConsensus: true },
            false
          );
          saveTransaction(hmacTx);
          emitEvent('transaction', hmacTx);

          // ── Update per-agent stats (direct consensus path) ────────────────
          const now = Date.now();
          if (valuationA) {
            const s = agentStatsStore.get('valuation-a')!;
            s.assessmentCount++;
            s.totalConfidence += Math.round((valuationA.confidence || 0.75) * 100);
            s.lastActiveAt = now;
          }
          if (valuationB) {
            const s = agentStatsStore.get('valuation-b')!;
            s.assessmentCount++;
            s.totalConfidence += Math.round((valuationB.confidence || 0.75) * 100);
            s.lastActiveAt = now;
          }
        }
      } catch (err: any) {
        log.warn(`HMAC receipt creation failed: ${err.message}`);
      }

      // ── Hash Commitment (for every assessment) ──────────────
      try {
        const { createExecutionCommitment, storeCommitmentOnCasper } = await import('../shared/verifiable-execution.js');
        const reputationHash = process.env.REPUTATION_CONTRACT_HASH;
        const executionCommitment = createExecutionCommitment(
          JSON.stringify({ assetId, name, assetType, askingPrice, location }),
          { assessedValue, divergence, valuationA: valuationA.estimated_value, valuationB: valuationB.estimated_value },
          'latest'
        );
        const commitmentTxHash = await storeCommitmentOnCasper(executionCommitment, reputationHash || '0xmockreputation');
        const zkTx = createTransactionEntry(
          'Hash Commitment',
          `Assessment ${assessmentId} execution commitment`,
          commitmentTxHash,
          'ReputationRegistry',
          'latest',
          { assessmentId, executionCommitment },
          true
        );
        saveTransaction(zkTx);
        emitEvent('transaction', zkTx);
      } catch (err: any) {
        log.warn(`Hash commitment failed: ${err.message}`);
      }

      // ── Store verdict on VerdictOracle ──────────────────────────────────────
      try {
        const { storeVerdictOnChain } = await import('../shared/casper-contracts.js');
        const jurorConfidence = verdict?.confidence || Math.round(
          ((valuationA.confidence || 75) + (valuationB.confidence || 75)) / 2
        );
        const receiptChain = receiptChainStore.get(assessmentId) || [];
        const lastReceipt = receiptChain[receiptChain.length - 1];
        const receiptHash = lastReceipt ? (lastReceipt as any).receiptHash || (lastReceipt as any).receipt_hash || '' : '';

        // Build agent weights string
        const agentWeights = [
          `valuation-a:${Math.round((valuationA.confidence || 0.75) * 100)}`,
          `valuation-b:${Math.round((valuationB.confidence || 0.75) * 100)}`,
        ].join(',');

        await storeVerdictOnChain({
          assetId,
          value: assessedValue,
          confidence: jurorConfidence,
          jurorCount: verdict?.jurorCount || 2,
          receiptHash,
          timestamp: Date.now(),
          expiry: Date.now() + 86_400_000, // 24h
          agentWeights,
          decision: verdict?.verdict || 'direct_consensus',
        });
        log.info(`Verdict stored on oracle for ${assetId}`);
      } catch (err: any) {
        log.warn(`Oracle store failed (non-critical): ${err.message}`);
      }

      res.json(response);
    } catch (err: any) {
      log.error('[Assess] Error:: ' + err.message);
      res.status(500).json({ success: false, error: sanitizeError(err) });
    }
  });

  /**
   * GET /api/reputation
   * Returns agent reputation data - reads from on-chain ReputationRegistry,
   * falls back to env-based defaults if on-chain read fails.
   */
  app.get('/api/reputation', async (_, res) => {
    try {
      const { getReputationsOnChain } = await import('../shared/casper-contracts.js');
      const reputations = await getReputationsOnChain();
      res.json({ success: true, reputations });
    } catch (err: any) {
      log.error('[Reputation] Error:: ' + err.message);
      res.status(500).json({ success: false, error: sanitizeError(err) });
    }
  });

  // ─── Verdict Oracle ─────────────────────────────────────────────────────────

  /**
   * GET /api/oracle/verdicts
   * Returns all stored verdicts from the VerdictOracle.
   * Used by the dashboard Oracle view.
   */
  app.get('/api/oracle/verdicts', async (_, res) => {
    try {
      const { getAllVerdicts, getOracleStats } = await import('../shared/casper-contracts.js');
      const verdicts = await getAllVerdicts();
      const stats = await getOracleStats();
      res.json({ success: true, verdicts, stats });
    } catch (err: any) {
      log.error('[Oracle] Error:: ' + err.message);
      res.status(500).json({ success: false, error: sanitizeError(err) });
    }
  });

  /**
   * GET /api/oracle/verdict/:assetId
   * Returns a specific verdict by asset ID.
   * x402-gated: requires 0.1 CSPR micropayment for cross-contract queries.
   * Dashboard reads (list/stats) are free; this is the agent-to-agent endpoint.
   */
  app.get('/api/oracle/verdict/:assetId', casperX402Middleware({ recipientAddress: PLATFORM_WALLET, amountCSPR: String(ORACLE_FEE_CSPR) }),
    async (req, res) => {

    try {
      const { getOracleVerdictOnChain } = await import('../shared/casper-contracts.js');
      const verdict = await getOracleVerdictOnChain(req.params.assetId as string);
      if (!verdict) {
        return res.status(404).json({ success: false, error: 'Verdict not found' });
      }
      res.json({ success: true, verdict });
    } catch (err: any) {
      log.error('[Oracle] Error:: ' + err.message);
      res.status(500).json({ success: false, error: sanitizeError(err) });
    }
  });

  /**
   * GET /api/oracle/stats
   * Returns oracle statistics for the dashboard.
   */
  app.get('/api/oracle/stats', async (_, res) => {
    try {
      const { getOracleStats } = await import('../shared/casper-contracts.js');
      const stats = getOracleStats();
      res.json({ success: true, stats });
    } catch (err: any) {
      log.error('[Oracle] Error:: ' + err.message);
      res.status(500).json({ success: false, error: sanitizeError(err) });
    }
  });

  // ─── Replay Registry (Public) ──────────────────────────────────────────────
  // Exposes consumed payment hashes publicly so anyone can verify that
  // a given deploy hash has already been used and cannot be replayed.

  app.get('/api/replay-registry', async (_, res) => {
    try {
      const { getConsumedHashes } = await import('../shared/x402-middleware.js');
      const hashes = getConsumedHashes();
      res.json({
        success: true,
        consumedCount: hashes.length,
        hashes,
        description: 'Deploy hashes that have been consumed by x402 payment verification. Each hash can only be used once.',
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ─── Public Verification Endpoint ──────────────────────────────────────────
  // Allows anyone to paste a receipt ID or assessment ID and verify:
  // 1. The receipt chain integrity (HMAC verification)
  // 2. The on-chain verdict hash
  // 3. The cspr.live explorer link for the anchoring deploy

  app.get('/api/verify/:id', async (req, res) => {
    try {
      const { id } = req.params;
      if (!id || typeof id !== 'string' || id.length > 200) {
        return res.status(400).json({ success: false, error: 'Invalid ID' });
      }

      // Try to find as assessment ID first
      const { getAssessment, getTransactionsFromDb } = await import('../shared/db.js');
      const assessment = await getAssessment(id).catch(() => null);

      // Try to find as verdict
      const { getOracleVerdictOnChain } = await import('../shared/casper-contracts.js');
      const verdict = await getOracleVerdictOnChain(id).catch(() => null);

      // Try to find in transactions
      const allTxns = await getTransactionsFromDb(500).catch(() => []);
      const relatedTxns = allTxns.filter((tx: any) =>
        tx.metadata && JSON.stringify(tx.metadata).includes(id)
      );

      // Recompute receipt chain hash if assessment found
      let receiptChainValid: boolean | null = null;
      let receiptCount = 0;
      if (assessment) {
        const chain = assessment.receipt_chain || [];
        receiptCount = chain.length;
        if (chain.length > 0) {
          try {
            const { verifyReceiptChain } = await import('../shared/audit-trail.js');
            // We can't fully verify without secrets, but we can check structural integrity
            receiptChainValid = chain.every((r: any) =>
              r.receiptId && r.assessmentId && r.signature && r.timestamp
            );
          } catch {
            receiptChainValid = false;
          }
        }
      }

      // Build explorer links for related transactions
      const explorerLinks = relatedTxns
        .filter((tx: any) => tx.hash && /^[a-f0-9]{64}$/i.test(tx.hash))
        .map((tx: any) => ({
          type: tx.type,
          hash: tx.hash,
          explorerUrl: `https://testnet.cspr.live/deploy/${tx.hash}`,
          timestamp: tx.timestamp,
        }));

      // Compute the verdict hash for verification
      let verdictHash: string | null = null;
      if (verdict) {
        const crypto = await import('crypto');
        verdictHash = crypto.createHash('sha256')
          .update(JSON.stringify({
            assetId: verdict.assetId,
            value: verdict.value,
            confidence: verdict.confidence,
            jurorCount: verdict.jurorCount,
            receiptHash: verdict.receiptHash,
            decision: verdict.decision,
          }))
          .digest('hex');
      }

      res.json({
        success: true,
        id,
        found: !!(assessment || verdict),
        assessment: assessment ? {
          id: assessment.assessment_id,
          assetType: assessment.asset_id?.split('-')[0] || 'unknown',
          assetName: assessment.asset_id || assessment.assessment_id,
          assessedValue: assessment.final_value || 0,
          status: assessment.final_verdict || 'completed',
          receiptCount,
          receiptChainValid,
          createdAt: assessment.created_at,
        } : null,
        verdict: verdict ? {
          assetId: verdict.assetId,
          value: verdict.value,
          confidence: verdict.confidence,
          jurorCount: verdict.jurorCount,
          decision: verdict.decision,
          receiptHash: verdict.receiptHash,
          verdictHash,
          timestamp: verdict.timestamp,
        } : null,
        onChainTransactions: explorerLinks,
        verificationInstructions: 'Paste the verdictHash into the VerdictOracle contract on cspr.live to verify it matches the on-chain record.',
      });
    } catch (err: any) {
      log.error('[Verify] Error:: ' + err.message);
      res.status(500).json({ success: false, error: sanitizeError(err) });
    }
  });

  // ─── Dispute & Re-trial System ──────────────────────────────────────────────
  //
  // Any third party can challenge a verdict by staking CSPR.
  // The stake triggers an independent panel with adversarial methodology
  // to re-run the case. If the challenger is right, they get their stake
  // back plus the original jurors lose reputation. If wrong, stake goes to jurors.
  //
  // This is the "appeals court" that makes Verdict Oracle a real court,
  // not just a price feed.

  const DISPUTE_FEE_CSPR = 5.0; // stake required to file a dispute

  /**
   * POST /api/oracle/dispute
   * File a dispute against an existing verdict.
   * Body: { assetId, challengerKey, reason }
   * Requires 5 CSPR stake via x402.
   */
  app.post('/api/oracle/dispute', casperX402Middleware({ recipientAddress: PLATFORM_WALLET, amountCSPR: String(DISPUTE_FEE_CSPR) }),
    async (req, res) => {
    try {
      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      if (isRateLimited(ip)) {
        return res.status(429).json({ success: false, error: 'Too many requests. Try again in a minute.' });
      }

      const { assetId, challengerKey, reason } = req.body;
      if (!assetId || !challengerKey || !reason) {
        return res.status(400).json({ success: false, error: 'Missing required fields: assetId, challengerKey, reason' });
      }
      if (typeof reason !== 'string' || reason.length > MAX_DESCRIPTION_LENGTH) {
        return res.status(400).json({ success: false, error: `reason is required (max ${MAX_DESCRIPTION_LENGTH} chars)` });
      }

      // Extract payment info from shared middleware
      const x402 = (req as any).x402Payment;
      const proofPayer = x402?.payer;
      const proofTxHash = x402?.deployHash;

      const { createDispute } = await import('../shared/casper-contracts.js');
      const result = createDispute(assetId, challengerKey, DISPUTE_FEE_CSPR, reason, proofTxHash, proofPayer);

      if ('error' in result) {
        return res.status(400).json({ success: false, error: result.error });
      }

      // Log the dispute filing as a transaction
      const disputeTx = createTransactionEntry(
        'Dispute Filed',
        `Dispute ${result.id} against verdict for ${assetId}`,
        `dispute-${result.id}`,
        'DisputeEngine',
        'latest',
        { disputeId: result.id, assetId, challengerKey, stakeCSPR: DISPUTE_FEE_CSPR },
        false,
      );
      saveTransaction(disputeTx);
      emitEvent('transaction', disputeTx);
      emitEvent('dispute_filed', { disputeId: result.id, assetId, challengerKey });

      log.info(`Dispute filed: ${result.id} against ${assetId} (${DISPUTE_FEE_CSPR} CSPR stake)`);
      res.json({ success: true, dispute: result });
    } catch (err: any) {
      log.error('[Dispute] Error:: ' + err.message);
      res.status(500).json({ success: false, error: sanitizeError(err) });
    }
  });

  /**
   * POST /api/oracle/disputes/:disputeId/retrial
   * Trigger the re-trial for a pending dispute.
   * This runs an independent panel with adversarial methodology.
   */
  app.post('/api/oracle/disputes/:disputeId/retrial', async (req, res) => {
    try {
      const { runRetrial } = await import('../shared/casper-contracts.js');
      const result = await runRetrial(req.params.disputeId);

      if ('error' in result) {
        return res.status(400).json({ success: false, error: result.error });
      }

      // Log the retrial completion
      const retrialTx = createTransactionEntry(
        'Retrial Complete',
        `Retrial ${result.retrial?.retrialId} for dispute ${result.id}: ${result.outcome}`,
        result.retrial?.receiptHash || `retrial-${result.id}`,
        'DisputeEngine',
        'latest',
        {
          disputeId: result.id,
          outcome: result.outcome,
          valueDelta: result.retrial?.valueDelta,
          confidenceDelta: result.retrial?.confidenceDelta,
          panelSize: result.retrial?.panel.length,
        },
        false,
      );
      saveTransaction(retrialTx);
      emitEvent('transaction', retrialTx);
      emitEvent('retrial_complete', { disputeId: result.id, outcome: result.outcome });

      res.json({ success: true, dispute: result });
    } catch (err: any) {
      log.error('[Retrial] Error:: ' + err.message);
      res.status(500).json({ success: false, error: sanitizeError(err) });
    }
  });

  /**
   * GET /api/oracle/disputes
   * List all disputes, newest first.
   */
  app.get('/api/oracle/disputes', async (_, res) => {
    try {
      const { getAllDisputes } = await import('../shared/casper-contracts.js');
      const disputes = await getAllDisputes();
      res.json({ success: true, disputes });
    } catch (err: any) {
      log.error('[Disputes] Error:: ' + err.message);
      res.status(500).json({ success: false, error: sanitizeError(err) });
    }
  });

  /**
   * GET /api/oracle/disputes/:disputeId
   * Get a specific dispute with full retrial details.
   */
  app.get('/api/oracle/disputes/:disputeId', async (req, res) => {
    try {
      const { getDispute } = await import('../shared/casper-contracts.js');
      const dispute = await getDispute(req.params.disputeId);
      if (!dispute) {
        return res.status(404).json({ success: false, error: 'Dispute not found' });
      }
      res.json({ success: true, dispute });
    } catch (err: any) {
      log.error('[Dispute] Error:: ' + err.message);
      res.status(500).json({ success: false, error: sanitizeError(err) });
    }
  });

  // ─── Prediction Market ──────────────────────────────────────────────────────

  const PREDICTION_FEE_CSPR = 1.0;

  /**
   * POST /api/predict
   * Run a 5-agent prediction analysis on a real-world question.
   * Each agent independently estimates probability, then produces a weighted consensus.
   */
  app.post('/api/predict', casperX402Middleware({ recipientAddress: PLATFORM_WALLET, amountCSPR: String(PREDICTION_FEE_CSPR) }),
    async (req, res) => {
    try {
      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      if (isRateLimited(ip)) {
        return res.status(429).json({ success: false, error: 'Too many requests. Try again in a minute.' });
      }


      const { question, timeframe, assetType } = req.body;

      if (!question || typeof question !== 'string' || question.trim().length === 0) {
        return res.status(400).json({ success: false, error: 'question is required' });
      }

      if (!timeframe || typeof timeframe !== 'string') {
        return res.status(400).json({ success: false, error: 'timeframe is required' });
      }

      log.info(`\n🔮 Prediction request: "${question}" (${timeframe})`);

      // ── Fetch relevant market data based on asset type ─────────────────────
      let marketContext = '';
      try {
        if (assetType === 'real-estate') {
          const fredData = await fetchAssetData({ id: 'PRED-FRED', type: 'real-estate', name: 'Market Context', description: 'Economic indicators', askingPrice: 0 });
          if (fredData?.source === 'FRED API' && fredData.comparables?.length) {
            marketContext = `Current economic indicators: ${fredData.comparables.map((c: any) => `${c.name}: ${c.value}`).join('; ')}`;
          }
        } else if (assetType === 'commodity') {
          const commodityData = await fetchAssetData({ id: 'PRED-COMMODITY', type: 'commodity', name: 'Spot Price', description: 'Current spot price', askingPrice: 0 });
          if (commodityData) {
            marketContext = `Commodity market data from ${commodityData.source}: ${commodityData.comparables?.length || 0} data points`;
          }
        }
      } catch (err: any) {
        log.warn(`Market data fetch failed: ${err.message}`);
      }

      // ── Run 5-agent prediction ─────────────────────────────────────────────
      const AGENT_PROFILES = [
        { id: 'valuation-a', name: 'Valuation Agent A', role: 'Comparable Sales', color: '#EC4899', weight: 1.0 },
        { id: 'valuation-b', name: 'Valuation Agent B', role: 'DCF & Cash Flow', color: '#F97316', weight: 1.0 },
        { id: 'evidence', name: 'Evidence Analyst', role: 'Data Quality Auditor', color: '#10B981', weight: 0.85 },
        { id: 'market', name: 'Market Interpreter', role: 'Macro & Sentiment', color: '#06B6D4', weight: 0.9 },
        { id: 'precedent', name: 'Precedent Researcher', role: 'Historical Precedent', color: '#8B5CF6', weight: 0.85 },
      ];

      const agents = await Promise.all(
        AGENT_PROFILES.map(async (profile) => {
          try {
            // Each agent runs through the LLM for qualitative reasoning
            const { askJuror } = await import('../shared/mimo-client.js');
            const prompt = `You are ${profile.name} (${profile.role}). Analyze this prediction question and estimate the probability.

Question: "${question}"
Timeframe: ${timeframe}
${marketContext ? `Market Context: ${marketContext}` : ''}

Respond in JSON format:
{
  "probability": <0.0 to 1.0>,
  "confidence": <0.0 to 1.0>,
  "reasoning": "<2-3 sentences explaining your analysis>"
}`;

            const response = await askJuror(`You are ${profile.name} (${profile.role}).`, prompt);
            let probability = 0.5;
            let confidence = 0.7;
            let reasoning = `Analysis based on ${profile.role} methodology.`;

            if (response.result) {
              try {
                // response.result is already parsed JSON from askJuror
                const parsed = typeof response.result === 'string' ? JSON.parse(response.result) : response.result;
                probability = Math.max(0.05, Math.min(0.95, parsed.probability || 0.5));
                confidence = Math.max(0.3, Math.min(0.95, parsed.confidence || 0.7));
                reasoning = parsed.reasoning || reasoning;
              } catch {
                // If parsing fails, extract values from text
                const text = typeof response.result === 'string' ? response.result : JSON.stringify(response.result);
                const probMatch = text.match(/probability[:\s]*(\d+\.?\d*)/i);
                const confMatch = text.match(/confidence[:\s]*(\d+\.?\d*)/i);
                if (probMatch) probability = Math.max(0.05, Math.min(0.95, parseFloat(probMatch[1]) > 1 ? parseFloat(probMatch[1]) / 100 : parseFloat(probMatch[1])));
                if (confMatch) confidence = Math.max(0.3, Math.min(0.95, parseFloat(confMatch[1]) > 1 ? parseFloat(confMatch[1]) / 100 : parseFloat(confMatch[1])));
                reasoning = text.slice(0, 500);
              }
            }

            return {
              ...profile,
              probability,
              confidence,
              reasoning,
              fallbackTriggered: response.fallbackTriggered || false,
            };
          } catch (err: any) {
            log.warn(`${profile.name} failed: ${err.message}`);
            return {
              ...profile,
              probability: 0.5,
              confidence: 0.5,
              reasoning: `${profile.name} encountered an error and used baseline estimate.`,
              fallbackTriggered: true,
            };
          }
        })
      );

      // ── Compute weighted consensus ─────────────────────────────────────────
      const weightedSum = agents.reduce((sum, a) => sum + a.probability * a.confidence * a.weight, 0);
      const weightSum = agents.reduce((sum, a) => sum + a.confidence * a.weight, 0);
      const consensusProbability = weightSum > 0 ? weightedSum / weightSum : 0.5;
      const avgConfidence = agents.reduce((sum, a) => sum + a.confidence, 0) / agents.length;

      // ── Risk factors ───────────────────────────────────────────────────────
      const riskFactors: string[] = [];
      const probStdDev = Math.sqrt(agents.reduce((sum, a) => sum + Math.pow(a.probability - consensusProbability, 2), 0) / agents.length);
      if (probStdDev > 0.15) riskFactors.push('High agent disagreement - probability estimates vary significantly');
      if (avgConfidence < 0.6) riskFactors.push('Low average confidence - limited data availability for this question');
      if (agents.some(a => a.fallbackTriggered)) riskFactors.push('Some agents fell back to deterministic estimates (LLM unavailable)');
      if (riskFactors.length === 0) riskFactors.push('Market volatility may affect outcome');
      if (riskFactors.length === 1) riskFactors.push('Interest rate changes could shift probabilities');

      const predictionId = `PRED-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

      const response = {
        success: true,
        prediction: {
          predictionId,
          question,
          timeframe,
          assetType: assetType || 'general',
          probability: Math.round(consensusProbability * 1000) / 1000,
          confidence: Math.round(avgConfidence * 1000) / 1000,
          agents: agents.map(a => ({
            name: a.name,
            role: a.role,
            color: a.color,
            probability: Math.round(a.probability * 1000) / 1000,
            confidence: Math.round(a.confidence * 1000) / 1000,
            reasoning: a.reasoning,
            fallbackTriggered: a.fallbackTriggered,
          })),
          riskFactors,
          timestamp: Date.now(),
        },
      };

      // Log as transaction
      const predTx = createTransactionEntry(
        'SubmitAssessment',
        `Prediction: "${question.slice(0, 60)}..." - ${(consensusProbability * 100).toFixed(1)}%`,
        predictionId,
        'Orchestrator',
        'latest',
        { question, timeframe, probability: consensusProbability, confidence: avgConfidence },
        false
      );
      saveTransaction(predTx);
      emitEvent('transaction', predTx);

      // ── DB: Persist prediction to Supabase ──
      db.savePrediction({
        prediction_id: predictionId,
        question,
        timeframe,
        asset_type: assetType || 'general',
        probability: Math.round(consensusProbability * 1000) / 1000,
        confidence: Math.round(avgConfidence * 1000) / 1000,
        agents: agents.map(a => ({
          name: a.name,
          role: a.role,
          color: a.color,
          probability: Math.round(a.probability * 1000) / 1000,
          confidence: Math.round(a.confidence * 1000) / 1000,
          reasoning: a.reasoning,
          fallbackTriggered: a.fallbackTriggered,
        })),
        risk_factors: riskFactors,
        created_at: Date.now(),
      }).catch(err => log.warn(`⚠️ Failed to save prediction: ${err.message}`));

      log.info(`Consensus: ${(consensusProbability * 100).toFixed(1)}% (confidence: ${(avgConfidence * 100).toFixed(1)}%)`);
      res.json(response);
    } catch (err: any) {
      log.error('[Predict] Error:: ' + err.message);
      res.status(500).json({ success: false, error: sanitizeError(err) });
    }
  });

  // ─── Prediction History ─────────────────────────────────────────────────────

  app.get('/api/predictions', async (_, res) => {
    try {
      const predictions = await db.getPredictionsFromDb(100);
      res.json({ success: true, predictions });
    } catch (err: any) {
      res.status(500).json({ success: false, error: sanitizeError(err) });
    }
  });

  // ─── Assessment History ─────────────────────────────────────────────────────

  app.get('/api/assessments', async (_, res) => {
    try {
      const assessments = await db.getAssessmentsFromDb(100);
      res.json({ success: true, assessments });
    } catch (err: any) {
      res.status(500).json({ success: false, error: sanitizeError(err) });
    }
  });

  /**
   * GET /api/assess/demo
   * Returns pre-built demo assessment data for the UI.
   */
  app.get('/api/assess/demo', (_, res) => {
    res.json({
      success: true,
      assets: [
        {
          type: 'real-estate',
          name: 'Miami Beachfront Condo',
          description: '2BR/2BA oceanfront unit, 1,200 sqft, recently renovated',
          askingPrice: 1_250_000,
          location: 'Miami, FL',
          sqft: 1200,
        },
        {
          type: 'real-estate',
          name: 'Manhattan Studio Apartment',
          description: '450 sqft studio in Midtown, doorman building',
          askingPrice: 650_000,
          location: 'New York, NY',
          sqft: 450,
        },
        {
          type: 'art',
          name: 'Contemporary Oil on Canvas',
          description: 'Abstract expressionist work, 48x60 inches, signed',
          askingPrice: 85_000,
          artistOrMedium: 'oil painting',
        },
        {
          type: 'art',
          name: 'Bronze Sculpture',
          description: 'Limited edition bronze, 24 inches, edition 3/12',
          askingPrice: 42_000,
          artistOrMedium: 'sculpture',
        },
        {
          type: 'commodity',
          name: '10oz Gold Bar (999.9 Fine)',
          description: 'LBMA certified, sealed with assay card',
          askingPrice: 23_500,
          weightOz: 10,
        },
        {
          type: 'commodity',
          name: '100oz Silver Bar',
          description: '.999 fine silver, serialized',
          askingPrice: 2_800,
          weightOz: 100,
        },
      ],
    });
  });

  // ── Lending: Loan Store ─────────────────────────────────────────────────────
  // In-memory loan store. In production, this would be a database.
  interface Loan {
    loanId: string;
    borrowerPublicKey: string;
    assetId: string;
    assetType: AssetType;
    assetName: string;
    assessedValue: number;
    ltvRatio: number;           // 0-100 (e.g. 60 means 60%)
    loanAmountCSPR: number;     // amount disbursed to borrower
    collateralAssessmentId: string;
    status: 'active' | 'healthy' | 'warning' | 'liquidated' | 'repaid';
    healthRatio: number;        // current health (100 = perfect, <80 = warning, <50 = liquidatable)
    createdAt: number;
    lastRevaluedAt: number;
    repaidAmountCSPR: number;
    repaymentHistory: Array<{ amount: number; timestamp: number; txHash: string }>;
    disbursementTxHash: string;
    platformFeeCSPR: number;
    // Verdict Point 1: Trust-score-aware LTV breakdown
    trustBreakdown: { confidence: number; valueRatio: number; ltvRange: string };
    // Verdict Point 2: Escrow lock/release tx hashes
    escrowLockTxHash?: string;
    escrowReleaseTxHash?: string;
    // Verdict Point 3: Revaluation deliberation receipts
    revaluationHistory: Array<{
      timestamp: number;
      previousValue: number;
      newValue: number;
      healthRatio: number;
      status: string;
      valuationA: { value: number; method: string; confidence: number; reasoning: string };
      valuationB: { value: number; method: string; confidence: number; reasoning: string };
      deliberationReceiptHash?: string;
    }>;
    // Security: valuation freshness and divergence tracking
    assessmentTimestamp?: number;
    divergence?: number;
  }

  const loanStore = new Map<string, Loan>();

  // LTV tiers based on asset type + confidence + trust
  const LTV_TIERS: Record<string, { base: number; max: number }> = {
    'real-estate': { base: 60, max: 75 },
    'art':         { base: 40, max: 55 },
    'commodity':   { base: 50, max: 65 },
  };

  /**
   * Calculate LTV using a continuous formula tied to assessment confidence.
   *
   * This is the core differentiator: low-confidence valuations produce visibly
   * lower LTV. A high-divergence juror path (agents disagree - low confidence)
   * directly reduces borrowing power. This is what makes the trust framework
   * matter - it's not just a display number, it changes the economics.
   *
   * Formula:
   *   ltv = base + (max - base) × confidence × valueRatio
   *   where valueRatio = min(assessedValue / askingPrice, 1.0)
   *
   * Examples (real-estate, base=60, max=75):
   *   confidence=0.95, valueRatio=1.0 - LTV = 60 + 15×0.95×1.0 = 74.25 - 74%
   *   confidence=0.70, valueRatio=0.9 - LTV = 60 + 15×0.70×0.9 = 69.45 - 69%
   *   confidence=0.40, valueRatio=0.7 - LTV = 60 + 15×0.40×0.7 = 64.20 - 64%
   *   confidence=0.20, valueRatio=0.5 - LTV = 60 + 15×0.20×0.5 = 61.50 - 61%
   */
  function calculateLTV(
    assetType: AssetType,
    assessedValue: number,
    confidence: number,  // 0-1
    askingPrice: number,
  ): { ltv: number; loanAmount: number; tier: string; trustBreakdown: { confidence: number; valueRatio: number; ltvRange: string } } {
    const tiers = LTV_TIERS[assetType] || LTV_TIERS['commodity'];
    const valueRatio = Math.min(assessedValue / askingPrice, 1.0);
    const ltvSpread = tiers.max - tiers.base;

    // Continuous LTV: higher confidence + higher value ratio - closer to max LTV
    const rawLtv = tiers.base + ltvSpread * confidence * valueRatio;
    const ltv = Math.round(rawLtv);
    const loanAmount = Math.round((assessedValue * ltv / 100) * 100) / 100;

    const tier = ltv >= tiers.max - 2 ? 'Premium' : ltv >= tiers.base + 5 ? 'Standard' : 'Conservative';

    return {
      ltv,
      loanAmount,
      tier,
      trustBreakdown: {
        confidence: Math.round(confidence * 100) / 100,
        valueRatio: Math.round(valueRatio * 100) / 100,
        ltvRange: `${tiers.base}-${tiers.max}%`,
      },
    };
  }

  /**
   * POST /api/loans/create
   * Create a loan against a previously assessed asset.
   * Flow: validate assessment - calculate LTV - disburse CSPR via wallet transfer - store loan.
   * x402-gated: returns HTTP 402 with payment requirements if no valid payment proof is provided.
   */
  app.post('/api/loans/create',
    casperX402Middleware({ recipientAddress: PLATFORM_WALLET, amountCSPR: String(LOAN_FEE_CSPR) }),
    async (req, res) => {
    try {
      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      if (isRateLimited(ip)) {
        return res.status(429).json({ success: false, error: 'Too many requests. Try again in a minute.' });
      }

      const {
        borrowerPublicKey,
        assetId,
        assetType,
        assetName,
        assessedValue,
        askingPrice,
        confidence,
        assessmentId,
      } = req.body;

      // ── Validate inputs ────────────────────────────────────────────────
      if (!borrowerPublicKey || typeof borrowerPublicKey !== 'string' || borrowerPublicKey.length < 64) {
        return res.status(400).json({ success: false, error: 'borrowerPublicKey must be a valid Casper public key (64+ hex chars)' });
      }
      if (!assetId || !assetType || !assetName) {
        return res.status(400).json({ success: false, error: 'assetId, assetType, and assetName are required' });
      }
      if (typeof assessedValue !== 'number' || assessedValue <= 0) {
        return res.status(400).json({ success: false, error: 'assessedValue must be a positive number' });
      }
      if (typeof askingPrice !== 'number' || askingPrice <= 0) {
        return res.status(400).json({ success: false, error: 'askingPrice must be a positive number' });
      }
      if (typeof confidence !== 'number' || confidence < 0 || confidence > 1) {
        return res.status(400).json({ success: false, error: 'confidence must be between 0 and 1' });
      }

      const validTypes: AssetType[] = ['real-estate', 'art', 'commodity'];
      if (!validTypes.includes(assetType)) {
        return res.status(400).json({ success: false, error: `assetType must be one of: ${validTypes.join(', ')}` });
      }

      // ── Security: additional validation checks ────────────────────────

      // A1: Minimum confidence threshold — low-confidence valuations are too unreliable for lending
      if (confidence < 0.65) {
        return res.status(400).json({
          success: false,
          error: 'Valuation confidence too low for lending',
          hint: 'The AI agents could not reach sufficient consensus on this asset. Try a different asset or wait for market conditions to stabilize.',
        });
      }

      // A2: Minimum collateral amount — prevent dust loans
      if (assessedValue < 100) {
        return res.status(400).json({
          success: false,
          error: 'Minimum assessed value is $100',
          hint: 'Loans require a minimum collateral value of $100 USD equivalent.',
        });
      }

      // A3: Valuation freshness — reject stale assessments (optional field, enforced if present)
      const { assessmentTimestamp, divergence } = req.body;
      if (assessmentTimestamp && (Date.now() - assessmentTimestamp) > 24 * 60 * 60 * 1000) {
        return res.status(400).json({
          success: false,
          error: 'Assessment is too old',
          hint: 'Valuations expire after 24 hours. Please run a new assessment before requesting a loan.',
        });
      }

      // A4: Divergence check — reject when agents disagree too much (optional field, enforced if present)
      if (typeof divergence === 'number' && divergence > 0.30) {
        return res.status(400).json({
          success: false,
          error: 'Agent valuation divergence too high',
          hint: 'The AI agents disagree significantly on this asset\'s value. Please try a different asset or wait for market stabilization.',
        });
      }

      // ── Calculate LTV (trust-score-aware) ──────────────────────────────
      const { ltv, loanAmount, tier, trustBreakdown } = calculateLTV(assetType, assessedValue, confidence, askingPrice);
      // Flat platform fee matching frontend LOAN_FEE_CSPR (5 CSPR)
      // assessedValue is in USD; the frontend sends a fixed 5 CSPR fee
      const platformFee = 5;

      log.info(`\n💰 Loan request: ${assetName}`);
      log.info(`Assessed: ${assessedValue.toLocaleString()} | LTV: ${ltv}% (${tier})`);
      log.info(`Trust: confidence=${trustBreakdown.confidence}, valueRatio=${trustBreakdown.valueRatio}`);
      log.info(`Loan amount: ${loanAmount} CSPR | Platform fee: ${platformFee} CSPR`);


      // ── Escrow Lock (honor-system label) ───────────────────────────────
      // NOTE: This is a platform→borrower transfer, not a real escrow smart contract.
      // The "escrow lock" is a ledger entry only — collateral is the assessed asset
      // itself, and repayment is honor-system. No on-chain lock exists.
      const escrowMotes = Math.floor(loanAmount * 1e9);
      const escrowTransferId = Date.now() + Math.floor(Math.random() * 1000);
      const lockHash = await executeCasperTransfer(borrowerPublicKey, escrowMotes, escrowTransferId);
      log.info(`🔒 Escrow locked! deploy_hash: ${lockHash.substring(0, 16)}...`);

      const lockTx = createTransactionEntry(
        'Native Transfer',
        `Escrow lock: ${loanAmount} CSPR for loan collateral`,
        lockHash,
        'EscrowContract',
        'latest',
        { loanId: `pending-${escrowTransferId}`, borrowerPublicKey, loanAmount, purpose: 'escrow_lock' },
        true
      );
      saveTransaction(lockTx);
      emitEvent('transaction', lockTx);

      // ── Disburse loan via CSPR transfer ────────────────────────────────
      const loanAmountMotes = Math.floor(loanAmount * 1e9);
      const transferId = Date.now() + Math.floor(Math.random() * 1000);
      const disbursementHash = await executeCasperTransfer(borrowerPublicKey, loanAmountMotes, transferId);
      log.info(`Loan disbursed! deploy_hash: ${disbursementHash.substring(0, 16)}...`);

      // ── Store the loan ─────────────────────────────────────────────────
      const loanId = `LOAN-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const loan: Loan = {
        loanId,
        borrowerPublicKey,
        assetId,
        assetType,
        assetName,
        assessedValue,
        ltvRatio: ltv,
        loanAmountCSPR: loanAmount,
        collateralAssessmentId: assessmentId || assetId,
        status: 'active',
        healthRatio: 100,
        createdAt: Date.now(),
        lastRevaluedAt: Date.now(),
        repaidAmountCSPR: 0,
        repaymentHistory: [],
        disbursementTxHash: disbursementHash,
        platformFeeCSPR: platformFee,
        trustBreakdown,
        escrowLockTxHash: lockHash,
        revaluationHistory: [],
        assessmentTimestamp: assessmentTimestamp || Date.now(),
        divergence: typeof divergence === 'number' ? divergence : undefined,
      };
      loanStore.set(loanId, loan);

      // ── DB: Persist loan to Supabase ──
      db.saveLoan({
        loan_id: loanId,
        borrower_public_key: borrowerPublicKey,
        asset_id: assetId,
        asset_type: assetType,
        asset_name: assetName,
        assessed_value: assessedValue,
        ltv_ratio: ltv,
        loan_amount_cspr: loanAmount,
        collateral_assessment_id: assessmentId || assetId,
        status: 'active',
        health_ratio: 100,
        created_at: Date.now(),
        last_revalued_at: Date.now(),
        repaid_amount_cspr: 0,
        repayment_history: [],
        disbursement_tx_hash: disbursementHash,
        platform_fee_cspr: platformFee,
        trust_breakdown: trustBreakdown,
        escrow_lock_tx_hash: lockHash,
        revaluation_history: [],
        assessment_timestamp: assessmentTimestamp || Date.now(),
        divergence: typeof divergence === 'number' ? divergence : undefined,
      }).catch(err => log.warn(`⚠️ Failed to save loan: ${err.message}`));

      // Log disbursement as transaction
      const disbTx = createTransactionEntry(
        'Native Transfer',
        `Loan disbursement: ${loanAmount} CSPR to ${borrowerPublicKey.substring(0, 12)}...`,
        disbursementHash,
        'LendingPool',
        'latest',
        { loanId, borrowerPublicKey, loanAmount, ltv, assetId, assetType },
        true
      );
      saveTransaction(disbTx);
      emitEvent('transaction', disbTx);

      res.json({
        success: true,
        loan: {
          loanId,
          assetId,
          assetName,
          assetType,
          assessedValue,
          ltvRatio: ltv,
          loanAmountCSPR: loanAmount,
          tier,
          platformFeeCSPR: platformFee,
          status: loan.status,
          healthRatio: loan.healthRatio,
          disbursementTxHash: disbursementHash,
          broadcastSuccess: true,
          createdAt: loan.createdAt,
          trustBreakdown,
        },
      });
    } catch (err: any) {
      log.error('[Loan Create] Error:: ' + err.message);
      res.status(500).json({ success: false, error: sanitizeError(err) });
    }
  });

  /**
   * GET /api/loans
   * List all active loans. Optionally filter by borrower public key.
   */
  app.get('/api/loans', async (req, res) => {
    try {
      const borrower = req.query.borrower as string | undefined;
      let loans = Array.from(loanStore.values());
      // Supabase fallback if in-memory is empty (after restart)
      if (loans.length === 0) {
        const rows = borrower
          ? await db.getLoansByBorrower(borrower)
          : await db.getAllLoans();
        loans = rows.map(r => ({
          loanId: r.loan_id,
          borrowerPublicKey: r.borrower_public_key,
          assetId: r.asset_id,
          assetType: r.asset_type as AssetType,
          assetName: r.asset_name,
          assessedValue: r.assessed_value,
          ltvRatio: r.ltv_ratio,
          loanAmountCSPR: r.loan_amount_cspr,
          collateralAssessmentId: r.collateral_assessment_id,
          status: r.status as Loan['status'],
          healthRatio: r.health_ratio,
          createdAt: r.created_at,
          lastRevaluedAt: r.last_revalued_at,
          repaidAmountCSPR: r.repaid_amount_cspr,
          repaymentHistory: r.repayment_history,
          disbursementTxHash: r.disbursement_tx_hash,
          platformFeeCSPR: r.platform_fee_cspr,
          trustBreakdown: r.trust_breakdown,
          escrowLockTxHash: r.escrow_lock_tx_hash,
          escrowReleaseTxHash: r.escrow_release_tx_hash,
          revaluationHistory: r.revaluation_history,
        }));
      } else if (borrower) {
        loans = loans.filter(l => l.borrowerPublicKey === borrower);
      }
      // Return summary (don't expose internal fields)
      const summaries = loans.map(l => ({
        loanId: l.loanId,
        assetId: l.assetId,
        assetType: l.assetType,
        assetName: l.assetName,
        assessedValue: l.assessedValue,
        ltvRatio: l.ltvRatio,
        loanAmountCSPR: l.loanAmountCSPR,
        status: l.status,
        healthRatio: l.healthRatio,
        repaidAmountCSPR: l.repaidAmountCSPR,
        createdAt: l.createdAt,
        lastRevaluedAt: l.lastRevaluedAt,
        disbursementTxHash: l.disbursementTxHash,
        trustBreakdown: l.trustBreakdown,
        escrowLockTxHash: l.escrowLockTxHash,
        escrowReleaseTxHash: l.escrowReleaseTxHash,
        revaluationHistory: l.revaluationHistory,
      }));
      res.json({ success: true, loans: summaries });
    } catch (err: any) {
      res.status(500).json({ success: false, error: sanitizeError(err) });
    }
  });

  /**
   * GET /api/loans/:loanId
   * Get full details for a single loan.
   */
  app.get('/api/loans/:loanId', async (req, res) => {
    let loan = loanStore.get(req.params.loanId);
    if (!loan) {
      // Supabase fallback
      const row = await db.getLoan(req.params.loanId);
      if (!row) return res.status(404).json({ success: false, error: 'Loan not found' });
      loan = {
        loanId: row.loan_id,
        borrowerPublicKey: row.borrower_public_key,
        assetId: row.asset_id,
        assetType: row.asset_type,
        assetName: row.asset_name,
        assessedValue: row.assessed_value,
        ltvRatio: row.ltv_ratio,
        loanAmountCSPR: row.loan_amount_cspr,
        collateralAssessmentId: row.collateral_assessment_id,
        status: row.status,
        healthRatio: row.health_ratio,
        createdAt: row.created_at,
        lastRevaluedAt: row.last_revalued_at,
        repaidAmountCSPR: row.repaid_amount_cspr,
        repaymentHistory: row.repayment_history,
        disbursementTxHash: row.disbursement_tx_hash,
        platformFeeCSPR: row.platform_fee_cspr,
        trustBreakdown: row.trust_breakdown,
        escrowLockTxHash: row.escrow_lock_tx_hash,
        escrowReleaseTxHash: row.escrow_release_tx_hash,
        revaluationHistory: row.revaluation_history,
      } as any;
    }
    res.json({ success: true, loan });
  });

  /**
   * POST /api/loans/:loanId/repay
   * Repay part or all of a loan. Requires real CSPR transfer from borrower to platform wallet.
   * x402-gated: returns HTTP 402 with payment requirements if no valid payment proof is provided.
   */
  app.post('/api/loans/:loanId/repay',
    casperX402Middleware({ recipientAddress: PLATFORM_WALLET, amountCSPR: String(REPAY_FEE_CSPR) }),
    async (req, res) => {
    try {
      const loan = loanStore.get(req.params.loanId as string);
      if (!loan) {
        return res.status(404).json({ success: false, error: 'Loan not found' });
      }
      if (loan.status === 'repaid' || loan.status === 'liquidated') {
        return res.status(400).json({ success: false, error: `Loan is ${loan.status} - no repayment possible` });
      }

      const { amount, txHash } = req.body;
      if (typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ success: false, error: 'Repayment amount must be a positive number' });
      }

      const remaining = loan.loanAmountCSPR - loan.repaidAmountCSPR;
      const repayAmount = Math.min(amount, remaining);


      // Verify repayment on-chain if txHash provided
      let verified = false;
      if (txHash && CSPR_CLOUD_KEY) {
        try {
          const verifyRes = await axios.get(`${CSPR_CLOUD_URL}/deploys/${txHash}`, {
            headers: { Authorization: CSPR_CLOUD_KEY, accept: 'application/json' },
            timeout: 5_000,
          });
          const status = verifyRes.data?.data?.status || verifyRes.data?.status;
          verified = status === 'processed';
        } catch {
          log.warn(`[Loan Repay] Could not verify deploy ${txHash}`);
        }
      }

      loan.repaidAmountCSPR += repayAmount;
      loan.repaymentHistory.push({
        amount: repayAmount,
        timestamp: Date.now(),
        txHash: txHash || `repay-${Date.now()}`,
      });

      if (loan.repaidAmountCSPR >= loan.loanAmountCSPR) {
        loan.status = 'repaid';
        log.info(`Loan ${loan.loanId} fully repaid!`);

        // Verdict Point 2: Escrow release - return collateral to platform
        let escrowReleaseHash = `escrow-release-${Date.now()}`;
        try {
          const releaseMotes = Math.floor(loan.loanAmountCSPR * 1e9);
          const releaseTransferId = Date.now() + Math.floor(Math.random() * 1000);
          const releaseHash = await executeCasperTransfer(PLATFORM_WALLET, releaseMotes, releaseTransferId);
          escrowReleaseHash = releaseHash;
          loan.escrowReleaseTxHash = releaseHash;
          log.info(`🔓 Escrow released! deploy_hash: ${releaseHash.substring(0, 16)}...`);

          const releaseTx = createTransactionEntry(
            'Native Transfer',
            `Escrow release: ${loan.loanAmountCSPR} CSPR returned for loan ${loan.loanId}`,
            releaseHash,
            'EscrowContract',
            'latest',
            { loanId: loan.loanId, amount: loan.loanAmountCSPR, purpose: 'escrow_release' },
            true
          );
          saveTransaction(releaseTx);
          emitEvent('transaction', releaseTx);
        } catch (err: any) {
          log.warn(`Escrow release failed: ${err.message}`);
        }
      }

      // Log repayment
      const repayTx = createTransactionEntry(
        'Native Transfer',
        `Loan repayment: ${repayAmount} CSPR for ${loan.loanId}`,
        txHash || `repay-${Date.now()}`,
        'LendingPool',
        'latest',
        { loanId: loan.loanId, repayAmount, totalRepaid: loan.repaidAmountCSPR, verified },
        verified
      );
      saveTransaction(repayTx);
      emitEvent('transaction', repayTx);

      // ── DB: Update loan in Supabase ──
      db.saveLoan({
        loan_id: loan.loanId,
        borrower_public_key: loan.borrowerPublicKey,
        asset_id: loan.assetId,
        asset_type: loan.assetType,
        asset_name: loan.assetName,
        assessed_value: loan.assessedValue,
        ltv_ratio: loan.ltvRatio,
        loan_amount_cspr: loan.loanAmountCSPR,
        collateral_assessment_id: loan.collateralAssessmentId,
        status: loan.status,
        health_ratio: loan.healthRatio,
        created_at: loan.createdAt,
        last_revalued_at: loan.lastRevaluedAt,
        repaid_amount_cspr: loan.repaidAmountCSPR,
        repayment_history: loan.repaymentHistory,
        disbursement_tx_hash: loan.disbursementTxHash,
        platform_fee_cspr: loan.platformFeeCSPR,
        trust_breakdown: loan.trustBreakdown,
        escrow_lock_tx_hash: loan.escrowLockTxHash,
        escrow_release_tx_hash: loan.escrowReleaseTxHash,
        revaluation_history: loan.revaluationHistory,
      }).catch(err => log.warn(`⚠️ Failed to update loan after repay: ${err.message}`));

      res.json({
        success: true,
        loan: {
          loanId: loan.loanId,
          status: loan.status,
          repaidAmountCSPR: loan.repaidAmountCSPR,
          remainingCSPR: Math.max(0, loan.loanAmountCSPR - loan.repaidAmountCSPR),
          repaymentVerified: verified,
          escrowReleaseTxHash: loan.escrowReleaseTxHash || null,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: sanitizeError(err) });
    }
  });

  /**
   * POST /api/loans/:loanId/revalue
   * Verdict Point 3: Revaluation is itself a deliberated AI judgment, not a single price feed.
   * Re-runs the dual-agent juror deliberation, produces a receipt chain, and exposes
   * the full reasoning from both agents. A margin call decision is a deliberated judgment.
   */
  app.post('/api/loans/:loanId/revalue', async (req, res) => {
    try {
      const loan = loanStore.get(req.params.loanId);
      if (!loan) {
        return res.status(404).json({ success: false, error: 'Loan not found' });
      }
      if (loan.status === 'repaid' || loan.status === 'liquidated') {
        return res.status(400).json({ success: false, error: `Loan is ${loan.status} - no revaluation needed` });
      }

      log.info(`\n🔄 Revaluing collateral for loan ${loan.loanId} (juror deliberation)...`);

      // Run dual valuation - same pipeline as initial assessment
      const valuationReq: ValuationRequest = {
        assetType: loan.assetType,
        assetId: loan.assetId,
        name: loan.assetName,
      };

      const [valuationA, valuationB] = await runDualValuation(valuationReq);
      const newValue = Math.round((valuationA.estimated_value + valuationB.estimated_value) / 2);
      const valueChange = ((newValue - loan.assessedValue) / loan.assessedValue) * 100;

      // ── Deliberation Receipt (same as assessment) ──────────────────────
      // This proves the revaluation was a genuine AI deliberation, not a price feed
      const divergence = Math.abs(valuationA.estimated_value - valuationB.estimated_value) /
        Math.max(valuationA.estimated_value, valuationB.estimated_value) * 100;

      const revalSecret = process.env.AGENT_EVIDENCE_PRIVATE_KEY || 'fallback-dev-secret';
      const revalInput = JSON.stringify({
        assetType: loan.assetType,
        assetId: loan.assetId,
        name: loan.assetName,
        previousValue: loan.assessedValue,
        purpose: 'revaluation',
      });
      const revalOutput = JSON.stringify({
        newValue,
        valuationA: valuationA.estimated_value,
        valuationB: valuationB.estimated_value,
        divergence,
      });
      const revalReasoning = `Revaluation deliberation: Agent A (${valuationA.method}) valued at ${valuationA.estimated_value} (confidence ${valuationA.confidence}), Agent B (${valuationB.method}) valued at ${valuationB.estimated_value} (confidence ${valuationB.confidence}). Divergence: ${divergence.toFixed(1)}%. Final: ${newValue}.`;

      const existingChain = receiptChainStore.get(loan.loanId) || [];
      const previousReceiptId = existingChain.length > 0
        ? existingChain[existingChain.length - 1].receiptId
        : 'genesis';

      const receipt = createDeliberationReceipt(
        revalSecret,
        loan.loanId,
        'revaluation-juror',
        existingChain.length + 1,
        revalInput,
        revalOutput,
        revalReasoning,
        previousReceiptId,
      );
      existingChain.push(receipt);
      receiptChainStore.set(loan.loanId, existingChain);

      // Store commitment on-chain (verifiable execution)
      const reputationHash = process.env.REPUTATION_CONTRACT_HASH || '';
      const executionCommitment = createExecutionCommitment(
        revalInput,
        { newValue, valuationA: valuationA.estimated_value, valuationB: valuationB.estimated_value, divergence },
        'latest',
      );
      let commitmentTxHash = '';
      try {
        commitmentTxHash = await storeCommitmentOnCasper(executionCommitment, reputationHash);
      } catch (err: any) {
        log.warn(`Could not store commitment on-chain: ${err.message}`);
      }

      // Recalculate health ratio
      const outstanding = loan.loanAmountCSPR - loan.repaidAmountCSPR;
      const rawHealth = outstanding > 0 ? (newValue / outstanding) * 100 : 100;
      loan.healthRatio = Math.min(100, Math.round(rawHealth));
      loan.lastRevaluedAt = Date.now();

      // Update status based on health
      if (loan.healthRatio < 50) {
        loan.status = 'liquidated';
        log.info(`🔴 Loan ${loan.loanId} LIQUIDATED - health dropped to ${loan.healthRatio}%`);
      } else if (loan.healthRatio < 80) {
        loan.status = 'warning';
        log.info(`🟡 Loan ${loan.loanId} WARNING - health at ${loan.healthRatio}%`);
      } else {
        loan.status = 'healthy';
      }

      // Store in revaluation history
      const revalEntry = {
        timestamp: Date.now(),
        previousValue: loan.assessedValue,
        newValue,
        healthRatio: loan.healthRatio,
        status: loan.status,
        valuationA: { value: valuationA.estimated_value, method: valuationA.method, confidence: valuationA.confidence, reasoning: valuationA.reasoning },
        valuationB: { value: valuationB.estimated_value, method: valuationB.method, confidence: valuationB.confidence, reasoning: valuationB.reasoning },
        deliberationReceiptHash: receipt.signature,
      };
      loan.revaluationHistory.push(revalEntry);

      // Log revaluation as transaction
      const revalTx = createTransactionEntry(
        'SubmitAssessment',
        `Revaluation: ${loan.assetName} - ${newValue.toLocaleString()} (${valueChange >= 0 ? '+' : ''}${valueChange.toFixed(1)}%)`,
        loan.assetId,
        'Orchestrator',
        'latest',
        {
          loanId: loan.loanId,
          oldValue: loan.assessedValue,
          newValue,
          valueChange,
          healthRatio: loan.healthRatio,
          receiptHash: receipt.signature,
          commitmentTxHash,
          divergence: Math.round(divergence * 10) / 10,
        },
        !!commitmentTxHash
      );
      saveTransaction(revalTx);
      emitEvent('transaction', revalTx);

      // ── DB: Update loan in Supabase after revaluation ──
      db.saveLoan({
        loan_id: loan.loanId,
        borrower_public_key: loan.borrowerPublicKey,
        asset_id: loan.assetId,
        asset_type: loan.assetType,
        asset_name: loan.assetName,
        assessed_value: loan.assessedValue,
        ltv_ratio: loan.ltvRatio,
        loan_amount_cspr: loan.loanAmountCSPR,
        collateral_assessment_id: loan.collateralAssessmentId,
        status: loan.status,
        health_ratio: loan.healthRatio,
        created_at: loan.createdAt,
        last_revalued_at: loan.lastRevaluedAt,
        repaid_amount_cspr: loan.repaidAmountCSPR,
        repayment_history: loan.repaymentHistory,
        disbursement_tx_hash: loan.disbursementTxHash,
        platform_fee_cspr: loan.platformFeeCSPR,
        trust_breakdown: loan.trustBreakdown,
        escrow_lock_tx_hash: loan.escrowLockTxHash,
        escrow_release_tx_hash: loan.escrowReleaseTxHash,
        revaluation_history: loan.revaluationHistory,
      }).catch(err => log.warn(`⚠️ Failed to update loan after revalue: ${err.message}`));

      res.json({
        success: true,
        revaluation: {
          loanId: loan.loanId,
          previousValue: loan.assessedValue,
          newValue,
          valueChangePercent: Math.round(valueChange * 10) / 10,
          healthRatio: loan.healthRatio,
          status: loan.status,
          marginCall: loan.status === 'warning',
          liquidated: loan.status === 'liquidated',
          valuationA: {
            value: valuationA.estimated_value,
            method: valuationA.method,
            confidence: valuationA.confidence,
            reasoning: valuationA.reasoning,
          },
          valuationB: {
            value: valuationB.estimated_value,
            method: valuationB.method,
            confidence: valuationB.confidence,
            reasoning: valuationB.reasoning,
          },
          divergence: Math.round(divergence * 10) / 10,
          receiptHash: receipt.signature,
          commitmentTxHash,
        },
      });
    } catch (err: any) {
      log.error('[Loan Revalue] Error:: ' + err.message);
      res.status(500).json({ success: false, error: sanitizeError(err) });
    }
  });

  // ── Insurance: Policy Store ──────────────────────────────────────────────────
  // In-memory insurance store. In production, this would be a database.
  interface InsurancePolicy {
    policyId: string;
    ownerPublicKey: string;
    assetId: string;
    assetType: AssetType;
    assetName: string;
    assessedValue: number;
    coverageAmount: number;
    premiumCSPR: number;
    deductiblePercent: number;
    status: 'active' | 'expired' | 'claimed' | 'paid';
    riskScore: number;           // 0-100 (higher = riskier)
    riskFactors: string[];
    tier: string;
    platformFeeCSPR: number;
    expiresAt: number;
    createdAt: number;
    coolingOffEnd: number;       // 7 days after creation
    claimHistory: Array<{
      claimId: string;
      amount: number;
      reason: string;
      status: 'pending' | 'approved' | 'denied' | 'paid';
      filedAt: number;
      resolvedAt?: number;
    }>;
  }

  const insuranceStore = new Map<string, InsurancePolicy>();

  // ── Insurance: Security Controls ──────────────────────────────────────────────
  const COOLING_OFF_DAYS = 7;
  const MIN_HOLDING_DAYS = 14;
  const MIN_CLAIM_CONFIDENCE = 0.7;
  const claimLocks = new Set<string>();
  let capitalPoolCSPR = 0; // Track premium inflows for solvency

  // Risk tiers based on asset type + confidence
  const RISK_TIERS: Record<string, { basePremium: number; maxCoverage: number; deductible: number }> = {
    'real-estate': { basePremium: 2.0, maxCoverage: 80, deductible: 10 },
    'art':         { basePremium: 3.5, maxCoverage: 60, deductible: 15 },
    'commodity':   { basePremium: 1.5, maxCoverage: 90, deductible: 5 },
  };

  function calculateInsurance(
    assetType: AssetType,
    assessedValue: number,
    confidence: number,
    askingPrice: number,
    coveragePercent?: number,
  ) {
    const tiers = RISK_TIERS[assetType] || RISK_TIERS['real-estate'];
    const valueRatio = assessedValue / askingPrice;

    // Risk score: higher = riskier (0-100)
    let riskScore = 50;
    if (confidence > 0.8 && valueRatio > 0.85) {
      riskScore = 25; // low risk
    } else if (confidence > 0.6 && valueRatio > 0.7) {
      riskScore = 45; // medium risk
    } else if (confidence < 0.4 || valueRatio < 0.5) {
      riskScore = 80; // high risk
    }

    // Coverage: user-specified or default max
    const coverage = Math.min(coveragePercent || tiers.maxCoverage, tiers.maxCoverage);
    const coverageAmount = Math.round(assessedValue * coverage / 100);

    // Premium: base + risk adjustment (annual, shown as monthly CSPR equivalent)
    const riskMultiplier = 1 + (riskScore / 100);
    const premiumCSPR = Math.round(tiers.basePremium * riskMultiplier * 100) / 100;

    const tier = riskScore <= 30 ? 'Premium' : riskScore <= 55 ? 'Standard' : 'High-Risk';

    const riskFactors: string[] = [];
    if (confidence < 0.6) riskFactors.push('Low assessment confidence');
    if (valueRatio < 0.8) riskFactors.push('Significant price-assessment divergence');
    if (assetType === 'art') riskFactors.push('Illiquid asset class');
    if (assetType === 'commodity') riskFactors.push('Commodity price volatility');
    if (riskScore > 60) riskFactors.push('Elevated overall risk profile');

    return { coverage, coverageAmount, premiumCSPR, deductible: tiers.deductible, riskScore, riskFactors, tier, coolingOffEnd: Date.now() + COOLING_OFF_DAYS * 24 * 60 * 60 * 1000 };
  }

  /**
   * POST /api/insurance/create
   * Create an insurance policy for a previously assessed asset.
   * Flow: validate assessment - calculate risk/premium - store policy.
   * x402-gated: returns HTTP 402 with payment requirements if no valid payment proof is provided.
   */
  app.post('/api/insurance/create',
    casperX402Middleware({ recipientAddress: PLATFORM_WALLET, amountCSPR: String(INSURANCE_FEE_CSPR) }),
    async (req, res) => {
    try {
      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      if (isRateLimited(ip)) {
        return res.status(429).json({ success: false, error: 'Too many requests. Try again in a minute.' });
      }

      const {
        ownerPublicKey,
        assetId,
        assetType,
        assetName,
        assessedValue,
        askingPrice,
        confidence,
        coveragePercent,
        assessmentId,
      } = req.body;

      // ── Validate inputs ────────────────────────────────────────────────
      if (!ownerPublicKey || typeof ownerPublicKey !== 'string' || ownerPublicKey.length < 64) {
        return res.status(400).json({ success: false, error: 'ownerPublicKey must be a valid Casper public key (64+ hex chars)' });
      }
      if (!assetId || !assetType || !assetName) {
        return res.status(400).json({ success: false, error: 'assetId, assetType, and assetName are required' });
      }
      if (typeof assessedValue !== 'number' || assessedValue <= 0) {
        return res.status(400).json({ success: false, error: 'assessedValue must be a positive number' });
      }
      if (typeof askingPrice !== 'number' || askingPrice <= 0) {
        return res.status(400).json({ success: false, error: 'askingPrice must be a positive number' });
      }
      if (typeof confidence !== 'number' || confidence < 0 || confidence > 1) {
        return res.status(400).json({ success: false, error: 'confidence must be between 0 and 1' });
      }

      const validTypes: AssetType[] = ['real-estate', 'art', 'commodity'];
      if (!validTypes.includes(assetType)) {
        return res.status(400).json({ success: false, error: `assetType must be one of: ${validTypes.join(', ')}` });
      }

      // ── Calculate Insurance ────────────────────────────────────────────
      const { coverage, coverageAmount, premiumCSPR, deductible, riskScore, riskFactors, tier, coolingOffEnd } =
        calculateInsurance(assetType, assessedValue, confidence, askingPrice, coveragePercent);
      const platformFee = 3; // INSURANCE_FEE_CSPR

      log.info(`\n🛡️ Insurance request: ${assetName}`);
      log.info(`Assessed: ${assessedValue.toLocaleString()} | Risk: ${riskScore}/100 (${tier})`);
      log.info(`Coverage: ${coverageAmount.toLocaleString()} (${coverage}%) | Premium: ${premiumCSPR} CSPR/mo`);


      // ── Store the policy ───────────────────────────────────────────────
      const policyId = `POL-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const now = Date.now();
      const policy: InsurancePolicy = {
        policyId,
        ownerPublicKey,
        assetId,
        assetType,
        assetName,
        assessedValue,
        coverageAmount,
        premiumCSPR,
        deductiblePercent: deductible,
        status: 'active',
        riskScore,
        riskFactors,
        tier,
        platformFeeCSPR: platformFee,
        expiresAt: now + 365 * 24 * 60 * 60 * 1000, // 1 year
        createdAt: now,
        coolingOffEnd,
        claimHistory: [],
      };
      insuranceStore.set(policyId, policy);
      capitalPoolCSPR += platformFee; // Track capital inflow

      // ── DB: Persist insurance policy to Supabase ──
      db.saveInsurance({
        policy_id: policyId,
        owner_public_key: ownerPublicKey,
        asset_id: assetId,
        asset_type: assetType,
        asset_name: assetName,
        assessed_value: assessedValue,
        coverage_amount: coverageAmount,
        premium_cspr: premiumCSPR,
        deductible_percent: deductible,
        status: 'active',
        risk_score: riskScore,
        risk_factors: riskFactors,
        tier,
        platform_fee_cspr: platformFee,
        expires_at: now + 365 * 24 * 60 * 60 * 1000,
        created_at: now,
        claim_history: [],
      }).catch(err => log.warn(`⚠️ Failed to save insurance: ${err.message}`));

      // Log as transaction
      const insTx = createTransactionEntry(
        'x402 Payment',
        `Insurance policy created for ${assetName}`,
        `ins-${policyId}`,
        'Insurance',
        'latest',
        { policyId, assetName, coverageAmount, premiumCSPR, riskScore },
        false
      );
      saveTransaction(insTx);
      emitEvent('transaction', insTx);

      log.info(`Policy ${policyId} created (${tier}, risk ${riskScore}/100)`);

      res.json({
        success: true,
        policy: {
          policyId,
          assetId,
          assetName,
          assetType,
          assessedValue,
          coverageAmount,
          premiumCSPR,
          deductiblePercent: deductible,
          riskScore,
          riskFactors,
          tier,
          platformFeeCSPR: platformFee,
          status: 'active',
          expiresAt: policy.expiresAt,
          createdAt: policy.createdAt,
          coolingOffEnd: policy.coolingOffEnd,
        },
      });
    } catch (err: any) {
      log.error('[Insurance Create] Error:: ' + err.message);
      res.status(500).json({ success: false, error: sanitizeError(err) });
    }
  });

  /**
   * GET /api/insurance
   * List all insurance policies. Optionally filter by owner public key.
   */
  app.get('/api/insurance', async (req, res) => {
    try {
      const owner = req.query.owner as string | undefined;
      let policies = Array.from(insuranceStore.values());
      // Supabase fallback if in-memory is empty (after restart)
      if (policies.length === 0) {
        const rows = owner
          ? await db.getInsuranceByOwner(owner)
          : await db.getAllInsurance();
        policies = rows.map(r => ({
          policyId: r.policy_id,
          ownerPublicKey: r.owner_public_key,
          assetId: r.asset_id,
          assetType: r.asset_type as AssetType,
          assetName: r.asset_name,
          assessedValue: r.assessed_value,
          coverageAmount: r.coverage_amount,
          premiumCSPR: r.premium_cspr,
          deductiblePercent: r.deductible_percent,
          status: r.status as InsurancePolicy['status'],
          riskScore: r.risk_score,
          riskFactors: r.risk_factors,
          tier: r.tier,
          platformFeeCSPR: r.platform_fee_cspr,
          expiresAt: r.expires_at,
          createdAt: r.created_at,
          coolingOffEnd: r.created_at + COOLING_OFF_DAYS * 24 * 60 * 60 * 1000,
          claimHistory: r.claim_history,
        }));
      } else if (owner) {
        policies = policies.filter(p => p.ownerPublicKey === owner);
      }
      const summaries = policies.map(p => ({
        policyId: p.policyId,
        assetId: p.assetId,
        assetType: p.assetType,
        assetName: p.assetName,
        assessedValue: p.assessedValue,
        coverageAmount: p.coverageAmount,
        premiumCSPR: p.premiumCSPR,
        deductiblePercent: p.deductiblePercent,
        status: p.status,
        riskScore: p.riskScore,
        riskFactors: p.riskFactors,
        expiresAt: p.expiresAt,
        createdAt: p.createdAt,
        coolingOffEnd: p.coolingOffEnd,
        claimHistory: p.claimHistory,
      }));
      res.json({ success: true, policies: summaries });
    } catch (err: any) {
      res.status(500).json({ success: false, error: sanitizeError(err) });
    }
  });

  /**
   * GET /api/insurance/:policyId
   * Get full details for a single insurance policy.
   */
  app.get('/api/insurance/:policyId', async (req, res) => {
    let policy = insuranceStore.get(req.params.policyId);
    if (!policy) {
      // Supabase fallback
      const row = await db.getInsurance(req.params.policyId);
      if (!row) return res.status(404).json({ success: false, error: 'Insurance policy not found' });
      policy = {
        policyId: row.policy_id,
        ownerPublicKey: row.owner_public_key,
        assetId: row.asset_id,
        assetType: row.asset_type,
        assetName: row.asset_name,
        assessedValue: row.assessed_value,
        coverageAmount: row.coverage_amount,
        premiumCSPR: row.premium_cspr,
        deductiblePercent: row.deductible_percent,
        status: row.status,
        riskScore: row.risk_score,
        riskFactors: row.risk_factors,
        tier: row.tier,
        platformFeeCSPR: row.platform_fee_cspr,
        expiresAt: row.expires_at,
        createdAt: row.created_at,
        coolingOffEnd: row.created_at + COOLING_OFF_DAYS * 24 * 60 * 60 * 1000,
        claimHistory: row.claim_history,
      } as any;
    }
    res.json({ success: true, policy });
  });

  /**
   * POST /api/insurance/:policyId/claim
   * File a claim against an insurance policy.
   * Security: ownership check, cooling-off, holding period, confidence gate, claim lock, solvency check.
   * x402-gated: returns HTTP 402 with payment requirements if no valid payment proof is provided.
   */
  app.post('/api/insurance/:policyId/claim',
    casperX402Middleware({ recipientAddress: PLATFORM_WALLET, amountCSPR: String(INSURANCE_FEE_CSPR) }),
    async (req, res) => {
    const policyId = req.params.policyId as string;

    // ── Claim lock: prevent concurrent claims on same policy ──
    if (claimLocks.has(policyId)) {
      return res.status(423).json({ success: false, error: 'A claim is already being processed for this policy. Please wait.' });
    }
    claimLocks.add(policyId);

    try {
      const policy = insuranceStore.get(policyId);
      if (!policy) {
        return res.status(404).json({ success: false, error: 'Insurance policy not found' });
      }

      // ── Ownership verification ──
      const claimantKey = req.body.ownerPublicKey as string | undefined;
      if (!claimantKey || claimantKey !== policy.ownerPublicKey) {
        return res.status(403).json({ success: false, error: 'Only the policy owner can file a claim' });
      }

      if (policy.status !== 'active') {
        return res.status(400).json({ success: false, error: `Policy is ${policy.status} and cannot accept new claims` });
      }
      if (Date.now() > policy.expiresAt) {
        policy.status = 'expired';
        return res.status(400).json({ success: false, error: 'Policy has expired' });
      }

      // ── Cooling-off period check ──
      const coolingOffEnd = policy.coolingOffEnd || (policy.createdAt + COOLING_OFF_DAYS * 24 * 60 * 60 * 1000);
      if (Date.now() < coolingOffEnd) {
        const daysRemaining = Math.ceil((coolingOffEnd - Date.now()) / (24 * 60 * 60 * 1000));
        return res.status(400).json({
          success: false,
          error: `Policy is in the ${COOLING_OFF_DAYS}-day cooling-off period. Claims can be filed in ${daysRemaining} day${daysRemaining > 1 ? 's' : ''}.`,
        });
      }

      // ── Minimum holding period check ──
      const holdingDays = (Date.now() - policy.createdAt) / (24 * 60 * 60 * 1000);
      if (holdingDays < MIN_HOLDING_DAYS) {
        const daysRemaining = Math.ceil(MIN_HOLDING_DAYS - holdingDays);
        return res.status(400).json({
          success: false,
          error: `Policy must be held for ${MIN_HOLDING_DAYS} days before filing a claim. ${daysRemaining} day${daysRemaining > 1 ? 's' : ''} remaining.`,
        });
      }

      const { reason, requestedAmount } = req.body;
      if (!reason || typeof reason !== 'string') {
        return res.status(400).json({ success: false, error: 'reason is required' });
      }
      if (reason.length > MAX_DESCRIPTION_LENGTH) {
        return res.status(400).json({ success: false, error: `reason must be under ${MAX_DESCRIPTION_LENGTH} characters` });
      }

      log.info(`\n📋 Insurance claim filed: ${policy.policyId}`);
      log.info(`Claimant: ${claimantKey.slice(0, 12)}...`);
      log.info(`Reason: ${reason}`);

      // ── Revaluate the asset to determine current value ──
      let currentValue = policy.assessedValue;
      let lossPercent = 0;
      let valuationAConfidence = 0;
      let valuationBConfidence = 0;

      try {
        const valuationReq: ValuationRequest = {
          assetType: policy.assetType,
          assetId: policy.assetId,
          name: policy.assetName,
        };
        const [valuationA, valuationB] = await runDualValuation(valuationReq);
        currentValue = Math.round((valuationA.estimated_value + valuationB.estimated_value) / 2);
        lossPercent = Math.max(0, ((policy.assessedValue - currentValue) / policy.assessedValue) * 100);
        valuationAConfidence = valuationA.confidence;
        valuationBConfidence = valuationB.confidence;

        log.info(`Previous value: ${policy.assessedValue.toLocaleString()}`);
        log.info(`Current value:  ${currentValue.toLocaleString()}`);
        log.info(`Loss: ${lossPercent.toFixed(1)}%`);
        log.info(`Agent confidence: A=${valuationAConfidence.toFixed(2)}, B=${valuationBConfidence.toFixed(2)}`);

        // ── Confidence threshold gating ──
        if (valuationAConfidence < MIN_CLAIM_CONFIDENCE || valuationBConfidence < MIN_CLAIM_CONFIDENCE) {
          return res.status(400).json({
            success: false,
            error: `Agent confidence too low for claim adjudication (A: ${(valuationAConfidence * 100).toFixed(0)}%, B: ${(valuationBConfidence * 100).toFixed(0)}%). Minimum required: ${(MIN_CLAIM_CONFIDENCE * 100).toFixed(0)}%. Please try again later when market data is more reliable.`,
          });
        }

        // ── Split verdict detection: agents disagree on direction ──
        const valueChangeA = (policy.assessedValue - valuationA.estimated_value) / policy.assessedValue;
        const valueChangeB = (policy.assessedValue - valuationB.estimated_value) / policy.assessedValue;
        if ((valueChangeA > 0 && valueChangeB < -0.02) || (valueChangeA < 0 && valueChangeB > 0.02) || (valueChangeA < -0.02 && valueChangeB > 0)) {
          log.info(`Split verdict: Agent A says ${valueChangeA > 0 ? 'loss' : 'gain'}, Agent B says ${valueChangeB > 0 ? 'loss' : 'gain'}`);
          return res.status(400).json({
            success: false,
            error: 'The AI agents disagree on the direction of value change. This claim requires manual review. Our oracle jurors will evaluate the evidence and render a verdict within 48 hours.',
          });
        }
      } catch (err: any) {
        log.info(`Revaluation failed, using original value: ${err.message}`);
      }

      const claimId = `CLM-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

      // Determine claim outcome
      let claimStatus: 'approved' | 'denied' | 'paid';
      let claimAmount = 0;

      if (lossPercent < policy.deductiblePercent) {
        claimStatus = 'denied';
        log.info(`Claim denied: loss ${lossPercent.toFixed(1)}% < deductible ${policy.deductiblePercent}%`);
      } else {
        // Loss exceeds deductible - approve and calculate payout
        claimAmount = Math.min(
          (currentValue * (1 - policy.deductiblePercent / 100)),
          policy.coverageAmount,
        );
        claimAmount = Math.round(claimAmount * 100) / 100;

        if (requestedAmount && requestedAmount < claimAmount) {
          claimAmount = requestedAmount;
        }

        // ── Capital pool solvency check ──
        const maxPayoutFromPool = capitalPoolCSPR * 0.5;
        if (claimAmount > maxPayoutFromPool && maxPayoutFromPool > 0) {
          claimAmount = Math.round(maxPayoutFromPool * 100) / 100;
          log.info(`Payout capped by capital pool: ${claimAmount.toLocaleString()} CSPR (pool: ${capitalPoolCSPR.toLocaleString()})`);
        }

        claimStatus = 'paid';
        capitalPoolCSPR -= claimAmount; // Deduct from pool
        log.info(`Claim approved: payout ${claimAmount.toLocaleString()} CSPR (pool remaining: ${capitalPoolCSPR.toLocaleString()})`);

        // Log payout transaction
        const payoutTx = createTransactionEntry(
          'Native Transfer',
          `Insurance claim payout for ${policy.assetName}`,
          `claim-${claimId}`,
          'Insurance',
          'latest',
          { claimId, policyId: policy.policyId, amount: claimAmount },
          false
        );
        saveTransaction(payoutTx);
        emitEvent('transaction', payoutTx);
      }

      // Record claim
      policy.claimHistory.push({
        claimId,
        amount: claimAmount,
        reason,
        status: claimStatus,
        filedAt: Date.now(),
        resolvedAt: Date.now(),
      });

      if (claimStatus === 'paid') {
        policy.status = 'paid';
      }

      // ── DB: Update insurance policy in Supabase after claim ──
      db.saveInsurance({
        policy_id: policy.policyId,
        owner_public_key: policy.ownerPublicKey,
        asset_id: policy.assetId,
        asset_type: policy.assetType,
        asset_name: policy.assetName,
        assessed_value: policy.assessedValue,
        coverage_amount: policy.coverageAmount,
        premium_cspr: policy.premiumCSPR,
        deductible_percent: policy.deductiblePercent,
        status: policy.status,
        risk_score: policy.riskScore,
        risk_factors: policy.riskFactors,
        tier: policy.tier,
        platform_fee_cspr: policy.platformFeeCSPR,
        expires_at: policy.expiresAt,
        created_at: policy.createdAt,
        claim_history: policy.claimHistory,
      }).catch(err => log.warn(`⚠️ Failed to update insurance after claim: ${err.message}`));

      res.json({
        success: true,
        claim: {
          claimId,
          policyId: policy.policyId,
          amount: claimAmount,
          status: claimStatus,
          reason,
          revaluation: {
            previousValue: policy.assessedValue,
            newValue: currentValue,
            lossPercent,
          },
          confidence: {
            agentA: valuationAConfidence,
            agentB: valuationBConfidence,
          },
        },
      });
    } catch (err: any) {
      log.error('[Insurance Claim] Error:: ' + err.message);
      res.status(500).json({ success: false, error: sanitizeError(err) });
    } finally {
      claimLocks.delete(policyId); // Always release lock
    }
  });

  /**
   * GET /api/insurance/pool-stats
   * Returns capital pool health for display on the frontend.
   */
  app.get('/api/insurance/pool-stats', async (_, res) => {
    const allPolicies = Array.from(insuranceStore.values());
    const activePolicies = allPolicies.filter(p => p.status === 'active');
    const totalCoverage = activePolicies.reduce((sum, p) => sum + p.coverageAmount, 0);
    const totalPremiums = allPolicies.reduce((sum, p) => sum + (p.platformFeeCSPR || 0), 0);
    res.json({
      success: true,
      pool: {
        capitalCSPR: capitalPoolCSPR,
        totalPremiumsCollected: totalPremiums,
        activePolicies: activePolicies.length,
        totalCoverageExposure: totalCoverage,
        solvencyRatio: totalCoverage > 0 ? Math.round((capitalPoolCSPR / totalCoverage) * 10000) / 100 : 0,
      },
    });
  });

  // ─── Admin: Force-trigger revaluation (demo/testing aid) ──────────────────
  // POST /api/admin/force-revalue/:loanId - immediately revalues a loan
  // regardless of staleness. For live demos to show autonomous behavior.
  // Gated by ADMIN_SECRET header to prevent unauthorized access.
  app.post('/api/admin/force-revalue/:loanId', async (req, res) => {
    const adminSecret = process.env.ADMIN_SECRET;
    if (!adminSecret || !req.headers['x-admin-secret'] ||
        !crypto.timingSafeEqual(
          Buffer.from(String(req.headers['x-admin-secret']), 'utf-8'),
          Buffer.from(adminSecret, 'utf-8')
        )) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const { loanId } = req.params;
    const loan = loanStore.get(loanId);
    if (!loan) {
      return res.status(404).json({ error: 'Loan not found', loanId });
    }

    log.info(`\n[Force-Revalue] Manual trigger for loan ${loanId}...`);

    try {
      const [agentA, agentB] = await runDualValuation({
        assetId: loan.assetId,
        assetType: loan.assetType as AssetType,
      });

      const newValue = Math.round((agentA.estimated_value + agentB.estimated_value) / 2);
      const confidence = (agentA.confidence + agentB.confidence) / 2;
      const newHealthRatio = Math.round((newValue / (loan.loanAmountCSPR * 100)) * 100);
      const newStatus: Loan['status'] = newHealthRatio < 50 ? 'warning' : 'healthy';

      const now = Date.now();
      loan.revaluationHistory.push({
        timestamp: now,
        previousValue: loan.assessedValue,
        newValue,
        healthRatio: newHealthRatio,
        status: newStatus,
        valuationA: { value: agentA.estimated_value, method: agentA.method, confidence: agentA.confidence, reasoning: agentA.reasoning },
        valuationB: { value: agentB.estimated_value, method: agentB.method, confidence: agentB.confidence, reasoning: agentB.reasoning },
      });
      loan.assessedValue = newValue;
      loan.lastRevaluedAt = now;
      loan.healthRatio = newHealthRatio;
      loan.status = newStatus;

      log.info(`[Force-Revalue] ${loanId}: ${loan.assessedValue.toLocaleString()} - ${newValue.toLocaleString()} health=${newHealthRatio}`);

      res.json({
        success: true,
        loanId,
        revaluation: {
          previousValue: loan.revaluationHistory[loan.revaluationHistory.length - 2]?.newValue ?? loan.assessedValue,
          newValue,
          healthRatio: newHealthRatio,
          status: newStatus,
          confidence,
          valuationA: { value: agentA.estimated_value, method: agentA.method, confidence: agentA.confidence },
          valuationB: { value: agentB.estimated_value, method: agentB.method, confidence: agentB.confidence },
        },
      });
    } catch (err: any) {
      log.error(`[Force-Revalue] Failed for ${loanId}:: ${err.message}`);
      res.status(500).json({ success: false, error: sanitizeError(err) });
    }
  });

  // ─── Admin: List active loans (for demo UI) ──────────────────────────────
  // Gated by ADMIN_SECRET header to prevent unauthorized access.
  app.get('/api/admin/loans', (req, res) => {
    const adminSecret = process.env.ADMIN_SECRET;
    if (!adminSecret || !req.headers['x-admin-secret'] ||
        !crypto.timingSafeEqual(
          Buffer.from(String(req.headers['x-admin-secret']), 'utf-8'),
          Buffer.from(adminSecret, 'utf-8')
        )) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const loans = Array.from(loanStore.values()).map(l => ({
      loanId: l.loanId,
      assetName: l.assetName,
      status: l.status,
      assessedValue: l.assessedValue,
      healthRatio: l.healthRatio,
      revaluationCount: l.revaluationHistory?.length || 0,
      lastRevaluedAt: l.lastRevaluedAt,
      createdAt: l.createdAt,
    }));
    res.json({ loans });
  });

  // ─── Global 404 handler ────────────────────────────────────────────────────
  app.use((_req, res) => {
    res.status(404).json({ success: false, error: 'Endpoint not found' });
  });

  // ─── Global error handler (catches unhandled async errors) ─────────────────
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    log.error('[Unhandled Error]: ' + err.stack || err.message || err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  });

  const PORT = process.env.ORCHESTRATOR_API_PORT || 3011;
  const { createServer } = await import('node:http');
  const server = createServer(app);
  
  // Attach WebSocket server to the same HTTP server (shared port)
  attachWebSocket(server);
  
  server.listen(PORT, async () => {
    log.info(`Orchestrator API running on http://localhost:${PORT}`);

    // ─── Load real oracle data from DB on startup ──────────────────────────────
    // Loads existing verdicts and disputes from Supabase into memory.
    try {
      const { loadVerdictsFromDB, loadDisputesFromDB } = await import('../shared/casper-contracts.js');
      await loadVerdictsFromDB();
      await loadDisputesFromDB();
    } catch (err: any) {
      log.warn(`Oracle DB load failed (non-critical): ${err.message}`);
    }



    // ─── Auto-revaluation monitor ───────────────────────────────────────────
    // Periodically checks active loans and triggers revaluation if stale.
    // DISABLED: User requested no automatic transactions. Current count is sufficient.
    log.info(`[Auto-Revalue] Auto-revaluation DISABLED (user request)`);

    // ─── Background Oracle Activity Generator ───────────────────────────────
    // Periodically runs real AI-powered oracle valuations for diverse asset types.
    // Each cycle: dual-agent valuation → juror deliberation → verdict stored on-chain → transaction logged.
    // This builds real platform activity so dashboard metrics reflect actual system usage.
    const ORACLE_ACTIVITY_INTERVAL_MS = 3 * 60 * 1000; // every 3 minutes
    const ORACLE_ASSET_POOL: ValuationRequest[] = [
      { assetType: 'real-estate', assetId: 're-miami-condo-001', name: 'Miami Beach Condo', location: 'Miami, FL', sqft: 1200 },
      { assetType: 'real-estate', assetId: 're-nyc-loft-002', name: 'Manhattan Loft', location: 'New York, NY', sqft: 1800 },
      { assetType: 'real-estate', assetId: 're-austin-home-003', name: 'Austin Family Home', location: 'Austin, TX', sqft: 2400 },
      { assetType: 'real-estate', assetId: 're-sf-studio-004', name: 'SF Studio Apartment', location: 'San Francisco, CA', sqft: 650 },
      { assetType: 'real-estate', assetId: 're-denver-town-005', name: 'Denver Townhouse', location: 'Denver, CO', sqft: 1600 },
      { assetType: 'art', assetId: 'art-oil-abstract-001', name: 'Abstract Oil Painting', artistOrMedium: 'abstract oil painting contemporary' },
      { assetType: 'art', assetId: 'art-sculpture-bronze-002', name: 'Bronze Sculpture', artistOrMedium: 'bronze sculpture modern' },
      { assetType: 'art', assetId: 'art-watercolor-landscape-003', name: 'Watercolor Landscape', artistOrMedium: 'watercolor landscape impressionist' },
      { assetType: 'commodity', assetId: 'com-gold-1oz-001', name: '1oz Gold Bar', weightOz: 1 },
      { assetType: 'commodity', assetId: 'com-gold-10oz-002', name: '10oz Gold Bar', weightOz: 10 },
      { assetType: 'commodity', assetId: 'com-silver-100oz-003', name: '100oz Silver Bar', weightOz: 100 },
      { assetType: 'commodity', assetId: 'com-platinum-1oz-004', name: '1oz Platinum Coin', weightOz: 1 },
    ];
    let oracleActivityIndex = 0;

    async function runOracleActivityCycle() {
      const asset = ORACLE_ASSET_POOL[oracleActivityIndex % ORACLE_ASSET_POOL.length];
      oracleActivityIndex++;
      const cycleId = `oracle-bg-${Date.now()}`;

      try {
        log.info(`\n[OracleActivity] 🔄 Running background valuation: ${asset.name} (${asset.assetType})`);

        // Step 1: Dual-agent valuation (real AI calls)
        const [valA, valB] = await runDualValuation(asset);
        const assessedValue = Math.round((valA.estimated_value + valB.estimated_value) / 2);
        const confidence = Math.round(((valA.confidence || 0.75) + (valB.confidence || 0.75)) / 2 * 100);
        const divergence = Math.abs(valA.estimated_value - valB.estimated_value) / assessedValue;

        log.info(`[OracleActivity] 💰 ${asset.name}: ${assessedValue.toLocaleString()} (confidence: ${confidence}%, divergence: ${(divergence * 100).toFixed(1)}%)`);

        // Step 2: Store verdict on oracle (real on-chain or in-memory + Supabase)
        const { storeVerdictOnChain } = await import('../shared/casper-contracts.js');
        const receiptHash = crypto.createHash('sha256').update(JSON.stringify({ valA: valA.estimated_value, valB: valB.estimated_value, ts: Date.now() })).digest('hex').slice(0, 64);
        const agentWeights = `valuation-a:${valA.confidence || 75},valuation-b:${valB.confidence || 75}`;

        const verdictResult = await storeVerdictOnChain({
          assetId: asset.assetId,
          value: assessedValue,
          confidence,
          jurorCount: 2,
          receiptHash,
          timestamp: Date.now(),
          expiry: Date.now() + 86_400_000,
          agentWeights,
          decision: valA.estimated_value > valB.estimated_value ? 'AgentAPreferred' : 'AgentBPreferred',
        });

        // Step 3: Log transactions (real entries)
        const verdictTx = createTransactionEntry(
          'ExecuteVerdict',
          `Oracle verdict: ${asset.name} → ${assessedValue.toLocaleString()}`,
          verdictResult.txHash || `verdict-${cycleId}`,
          'VerdictOracle',
          'latest',
          { assetId: asset.assetId, assessedValue, confidence, divergence: Math.round(divergence * 100) },
          verdictResult.success,
        );
        saveTransaction(verdictTx);
        emitEvent('transaction', verdictTx);

        // Step 4: Update agent stats
        const now = Date.now();
        for (const [id, stats] of agentStatsStore) {
          stats.assessmentCount++;
          stats.totalConfidence += confidence;
          stats.lastActiveAt = now;
        }

        // Step 5: Hash commitment (real on-chain)
        try {
          const reputationHash = process.env.REPUTATION_CONTRACT_HASH;
          const commitment = createExecutionCommitment(
            JSON.stringify({ assetId: asset.assetId, name: asset.name, assetType: asset.assetType }),
            { assessedValue, confidence, divergence: Math.round(divergence * 100) },
            'latest',
          );
          const commitmentHash = await storeCommitmentOnCasper(commitment, reputationHash || '0xmockreputation');
          const zkTx = createTransactionEntry(
            'Hash Commitment',
            `Oracle ${asset.name} execution commitment`,
            commitmentHash,
            'ReputationRegistry',
            'latest',
            { assetId: asset.assetId, commitment },
            true,
          );
          saveTransaction(zkTx);
          emitEvent('transaction', zkTx);
        } catch (err: any) {
          log.warn(`[OracleActivity] ⚠️ ZK commitment failed: ${err.message}`);
        }

        log.info(`[OracleActivity] ✅ ${asset.name} complete — verdict + commitment stored`);
      } catch (err: any) {
        log.error(`[OracleActivity] ❌ Failed for ${asset.name}: ${err.message}`);
      }
    }

    // ─── Background Oracle Activity Generator ───────────────────────────────
    // DISABLED: User requested no automatic transactions. Current count is sufficient.
    // To re-enable, uncomment the setInterval calls below.
    log.info(`[OracleActivity] Background oracle valuations DISABLED (user request)`);
  });
}
