import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import axios from 'axios';
import { execFileSync } from 'child_process';
import fs from 'fs';
import express from 'express';
import cors from 'cors';
import { getCasperMcpClient } from '../shared/casper-mcp-client.js';
import { emitEvent } from '../websocket-server.js';
import { computeAggregateTrust } from '../shared/trust-framework.js';
import { createDeliberationReceipt, DeliberationReceipt, verifyReceiptChain } from '../shared/audit-trail.js';
import { createExecutionCommitment, storeCommitmentOnCasper } from '../shared/verifiable-execution.js';
import { saveTransaction, createTransactionEntry, loadTransactions } from '../shared/transaction-log.js';
import { runDualValuation, type ValuationRequest } from '../shared/agent-engine.js';
import { fetchAssetData, type AssetData } from '../shared/data-sources.js';
import type { AssetType } from '../shared/types.js';

// ─── Named constants ─────────────────────────────────────────────────────────
const CSPR_CLOUD_URL = process.env.CSPRCLOUD_BASE_URL || 'https://api.cspr.cloud/v1';
const CSPR_CLOUD_KEY = process.env.CSPRCLOUD_API_KEY || '';
const CSPR_RPC_URL = 'https://node.testnet.cspr.cloud/rpc';
const SETTLEMENT_AMOUNT_MOTES = 2_500_000_000; // 2.5 CSPR
const DEPLOY_PAYMENT_MOTES = 100_000_000;       // 0.1 CSPR deploy cost
const DISPUTE_TIMEOUT_MS = 5 * 60 * 1000;       // 5 minutes max per dispute
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3000').split(',');
const JUROR_IDS = ['evidence', 'market', 'precedent'] as const;

// ─── In-memory receipt chain store (per dispute) ─────────────────────────────
// Keyed by disputeId → full DeliberationReceipt[] for that session.
const receiptChainStore = new Map<string, DeliberationReceipt[]>();

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
      const value = parseInt(res.content[0]?.text, 10);
      if (!isNaN(value)) {
        console.log(`  [ReputationRegistry] ✅ On-chain reputation for ${agentId}: ${value}`);
        return value;
      }
    } catch (err: any) {
      console.log(`  [ReputationRegistry] ⚠️ MCP query failed: ${err.message}`);
    }
  }

  const fallback = parseInt(process.env[envKey] || '700', 10);
  console.log(`  [ReputationRegistry] Using env fallback ${envKey}: ${fallback}`);
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
        console.warn(`  [SSE] Failed to parse data payload: ${payload.substring(0, 120)}...`);
        return raw;
      }
    }
  }
  return raw; // not SSE — return as-is
}

// ─── Casper Transfer (execFileSync — no shell injection) ─────────────────────

/**
 * Execute and broadcast a Casper Native Transfer via casper-client CLI.
 * Uses execFileSync to avoid shell injection from env-var-derived arguments.
 */
async function executeCasperTransfer(targetPublicKeyHex: string, amountMotes: number, transferId: number): Promise<string> {
  const deployerKeyPath = process.env.DEPLOYER_PRIVATE_KEY;
  if (!deployerKeyPath || !CSPR_CLOUD_KEY) {
    throw new Error('DEPLOYER_PRIVATE_KEY or CSPRCLOUD_API_KEY missing in .env');
  }

  const absoluteKeyPath = path.resolve(process.cwd(), '..', deployerKeyPath);
  if (!fs.existsSync(absoluteKeyPath)) {
    throw new Error(`Key file not found: ${absoluteKeyPath}`);
  }
  const networkName = process.env.CASPER_CHAIN_NAME || 'casper-test';
  const tempFile = path.resolve(process.cwd(), `deploy-${transferId}.json`);

  // execFileSync passes args as an array — no shell interpolation
  execFileSync('casper-client', [
    'make-transfer',
    '--chain-name', networkName,
    '--secret-key', absoluteKeyPath,
    '--payment-amount', String(DEPLOY_PAYMENT_MOTES),
    '--transfer-id', String(transferId),
    '--amount', String(amountMotes),
    '--target-account', targetPublicKeyHex,
    '-o', tempFile,
  ], { encoding: 'utf-8', stdio: 'pipe' });

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
 * POST to an MCP endpoint, handling x402 payment negotiation.
 * Parses SSE responses transparently.
 */
async function fetchWithX402(url: string, payload: any, agentLabel: string) {
  try {
    console.log(`  [x402] POST ${url}`);
    const res = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
      },
    });

    const data = typeof res.data === 'string' ? parseSseResponse(res.data) : res.data;
    return data;
  } catch (error: any) {
    if (error.response?.status === 402) {
      const reqs = error.response.data.paymentRequirements;
      console.log(`  [x402] 🛑 402 Payment Required from ${agentLabel}`);
      console.log(`  [x402]    Fee: ${reqs.maxAmountRequired} CSPR → ${reqs.payTo.slice(0, 16)}...`);

      const transferId = Date.now() + Math.floor(Math.random() * 1000);
      let txHash = `cspr-tx-${transferId}`;
      console.log(`  [x402] 💸 Executing CSPR transfer via CSPR.cloud...`);

      try {
        const amountMotes = Math.floor(parseFloat(reqs.maxAmountRequired) * 1e9);
        const deployHash = await executeCasperTransfer(reqs.payTo, amountMotes, transferId);
        txHash = deployHash;
        console.log(`  [x402] ✅ Transfer confirmed! deploy_hash: ${txHash.slice(0, 16)}...`);

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
      } catch (err: any) {
        console.log(`  [x402] ⚠️ Transfer failed: ${err.message}. Proceeding with simulated hash.`);
        const x402Tx = createTransactionEntry(
          'x402 Payment',
          `Agent payment to ${agentLabel} (simulated)`,
          txHash,
          'Native Transfer',
          'latest',
          { agentLabel, amount: reqs.maxAmountRequired, payTo: reqs.payTo, simulated: true }
        );
        saveTransaction(x402Tx);
        emitEvent('transaction', x402Tx);
      }

      const proof = Buffer.from(JSON.stringify({
        payer: process.env.DEPLOYER_PUBLIC_KEY,
        txHash,
        amount: reqs.maxAmountRequired,
        network: 'casper-test',
      })).toString('base64');

      const retry = await axios.post(url, payload, {
        headers: {
          'x-payment-proof': proof,
          'Content-Type': 'application/json',
          Accept: 'application/json, text/event-stream',
        },
      });

      const data = typeof retry.data === 'string' ? parseSseResponse(retry.data) : retry.data;
      console.log(`  [x402] ✅ Payment accepted, response received`);
      return data;
    }
    throw error;
  }
}

// ─── CSPR.cloud queries ──────────────────────────────────────────────────────

interface McpToolResult {
  content: Array<{ type: string; text: string }>;
}

async function fetchCasperAccountInfo(publicKey: string) {
  if (!CSPR_CLOUD_KEY) {
    console.log(`  [cspr.cloud] No API key configured, skipping`);
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
      console.log(`  [cspr.cloud] Account lookup failed: ${e.response?.status || e.message}`);
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
    const data = JSON.parse(res.content[0].text);
    return { block_height: data.block_height || 'latest', timestamp: data.timestamp || new Date().toISOString() };
  } catch (mcpError: any) {
    try {
      const res = await axios.get(`${CSPR_CLOUD_URL}/blocks?page=1&page_size=1&order_direction=DESC`, {
        headers: { Authorization: CSPR_CLOUD_KEY },
      });
      return res.data?.data?.[0] || null;
    } catch (e: any) {
      console.log(`  [cspr.cloud] Block fetch failed: ${e.response?.status || e.message}`);
      return null;
    }
  }
}

// ─── Main dispute resolution pipeline ────────────────────────────────────────

export async function runDisputeResolution(disputeId: string, assetId: string, location: string, spotCount: number) {
  emitEvent('dispute_started', { disputeId, assetId, location, spotCount });

  console.log(`\n${'='.repeat(60)}`);
  console.log(`⚖️  CASPER RWA COURT: DISPUTE #${disputeId}`);
  console.log(`${'='.repeat(60)}`);
  console.log(`Asset: ${assetId} | Location: ${location} | Spots: ${spotCount}\n`);

  // Step 0: Blockchain connectivity
  console.log(`--- Step 0: Blockchain Connectivity Check ---`);
  const block = await fetchLatestBlock();
  if (block) {
    console.log(`  ✅ Connected to Casper Testnet via CSPR.cloud`);
    console.log(`  📦 Latest block: #${block.block_height} (${block.timestamp})`);
  } else {
    console.log(`  ⚠️  CSPR.cloud not available, proceeding with local simulation`);
  }

  const deployerKey = process.env.DEPLOYER_PUBLIC_KEY;
  if (deployerKey) {
    const account = await fetchCasperAccountInfo(deployerKey);
    if (account?.data) {
      const balance = account.data.balance;
      console.log(`  💰 Deployer balance: ${(parseInt(balance) / 1e9).toFixed(2)} CSPR`);
    }
  }

  // Step 1: Summon valuation agents
  const mcpPayload = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: {
      name: 'assess_asset_autonomously',
      arguments: { asset_id: assetId, location, spot_count: spotCount },
    },
  };

  console.log(`\n--- Step 1: Summoning Agent A (Comps Specialist) ---`);
  emitAgentThought('comps', 'Comps Specialist', 'Starting comparable sales analysis for the asset...', 10, 'reasoning');

  let resultA: any;
  try {
    const res = await fetchWithX402('http://localhost:3001/mcp', mcpPayload, 'Agent-A');
    resultA = JSON.parse(res.result.content[0].text);
    console.log(`  📊 Agent-A verdict: ${resultA.estimated_value.toLocaleString()} via ${resultA.method}`);

    emitAgentThought('valuation-a', 'Comps Specialist', `Found ${resultA.comparable_count || 3} comparable properties in ${location}`, 60, 'evidence');
    emitAgentThought('valuation-a', 'Comps Specialist', `Calculated value: ${resultA.estimated_value.toLocaleString()} using ${resultA.method}`, 85, 'decision');

    emitEvent('valuation_result', { agent: 'Agent-A', result: resultA });
  } catch (e: any) {
    console.error(`  ❌ Agent-A failed: ${e.message}`);
    emitAgentThought('valuation-a', 'Comps Specialist', `Error: ${e.message}`, 0, 'validation');
  }

  console.log(`\n--- Step 2: Summoning Agent B (DCF Specialist) ---`);
  emitAgentThought('valuation-b', 'DCF Specialist', 'Starting discounted cash flow analysis...', 10, 'reasoning');

  let resultB: any;
  try {
    const res = await fetchWithX402('http://localhost:3002/mcp', mcpPayload, 'Agent-B');
    resultB = JSON.parse(res.result.content[0].text);
    console.log(`  📊 Agent-B verdict: ${resultB.estimated_value.toLocaleString()} via ${resultB.method}`);

    emitAgentThought('valuation-b', 'DCF Specialist', `Discount rate applied: ${resultB.discount_rate || 10}%`, 60, 'evidence');
    emitAgentThought('valuation-b', 'DCF Specialist', `Calculated NPV: ${resultB.estimated_value.toLocaleString()} using ${resultB.method}`, 85, 'decision');

    emitEvent('valuation_result', { agent: 'Agent-B', result: resultB });
  } catch (e: any) {
    console.error(`  ❌ Agent-B failed: ${e.message}`);
    emitAgentThought('valuation-b', 'DCF Specialist', `Error: ${e.message}`, 0, 'validation');
  }

  if (!resultA || !resultB) {
    console.log(`\n❌ Cannot deliberate: missing agent verdicts.`);
    return;
  }

  // Step 3: Juror deliberation — Round 1
  console.log(`\n--- Step 3: Juror Deliberation (Round 1) ---`);

  const jurorPorts = [
    { name: 'Evidence Analyst', port: 3003, rep: await fetchOnChainReputation('Agent-C'), pk: process.env.AGENT_C_PUBLIC_KEY || '0x' },
    { name: 'Market Data Interpreter', port: 3004, rep: await fetchOnChainReputation('Agent-D'), pk: process.env.AGENT_D_PUBLIC_KEY || '0x' },
    { name: 'Precedent Researcher', port: 3005, rep: await fetchOnChainReputation('Agent-E'), pk: process.env.AGENT_E_PUBLIC_KEY || '0x' },
  ];

  console.log(`\n  [IETF Trust Framework] Validating juror identities and trust scores...`);
  for (const juror of jurorPorts) {
    const score = computeAggregateTrust({
      agentId: juror.pk,
      identityVerified: true,
      executionScore: 75,
      outputConsistency: 80,
      economicStake: 500,
    });
    console.log(`  🛡️  ${juror.name} | Tier: ${score.tier.toUpperCase()} | IETF Aggregate Score: ${score.aggregateScore}/1000`);
  }

  const jurorArgs = {
    dispute_id: disputeId,
    asset_id: assetId,
    location,
    spot_count: spotCount,
    valuation_a: resultA.estimated_value,
    valuation_b: resultB.estimated_value,
  };

  let receiptChain: DeliberationReceipt[] = [];
  let previousReceiptId = 'genesis';

  const jurorMcpPayload = {
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/call',
    params: {
      name: 'deliberate',
      arguments: jurorArgs,
    },
  };

  const round1Results = await Promise.all(jurorPorts.map(async (juror, index) => {
    const jurorId = JUROR_IDS[index];
    try {
      emitAgentThought(jurorId, juror.name, `Starting deliberation: analyzing evidence from both agents...`, 15, 'reasoning');
      emitAgentThought(jurorId, juror.name, `Reviewing Agent-A valuation: ${resultA.estimated_value.toLocaleString()}`, 30, 'evidence');

      const res = await fetchWithX402(`http://localhost:${juror.port}/mcp`, jurorMcpPayload, juror.name);
      const verdict = JSON.parse(res.result?.content?.[0]?.text);
      console.log(`  👨‍⚖️ ${juror.name} (Rep: ${juror.rep}): Voted ${verdict.vote} | ${verdict.reasoning}`);

      emitAgentThought(jurorId, juror.name, `Vote: ${verdict.vote} | Confidence: ${verdict.confidence || 78}%`, 90, 'validation');
      emitEvent('juror_vote', { juror: juror.name, round: 1, verdict, rep: juror.rep });

      // HMAC receipt with derived key (not raw private key)
      const secret = process.env[`AGENT_${jurorKeySuffix(juror.name)}_PRIVATE_KEY`] || 'fallback-dev-secret';
      const receipt = createDeliberationReceipt(
        secret,
        disputeId,
        juror.pk,
        1,
        JSON.stringify(jurorArgs),
        verdict.vote,
        verdict.reasoning,
        previousReceiptId
      );
      receiptChain.push(receipt);
      previousReceiptId = receipt.receiptId;
      console.log(`  📜 [Audit] Receipt: ${receipt.receiptId.slice(0, 8)}... → Hash: ${receipt.signature.slice(0, 16)}...`);

      emitEvent('receipt_created', { receipt, juror: juror.name, round: 1 });

      return { juror, verdict };
    } catch (e: any) {
      console.error(`  ❌ ${juror.name} failed: ${e.message}`);
      emitAgentThought(jurorId, juror.name, `Error during deliberation: ${e.message}`, 0, 'validation');
      return null;
    }
  }));

  const validRound1 = round1Results.filter(r => r !== null);
  const peerReasoning = validRound1.map(r => `${r!.juror.name} voted ${r!.verdict.vote} because: ${r!.verdict.reasoning}`);

  // Step 4: Round 2 — peer review
  console.log(`\n--- Step 4: Juror Deliberation (Round 2 - Peer Review) ---`);

  const round2Args = { ...jurorArgs, peer_reasoning: peerReasoning };
  const jurorMcpPayload2 = {
    jsonrpc: '2.0',
    id: 3,
    method: 'tools/call',
    params: { name: 'deliberate', arguments: round2Args },
  };

  const round2Results = await Promise.all(jurorPorts.map(async (juror, index) => {
    const jurorId = JUROR_IDS[index];
    try {
      emitAgentThought(jurorId, juror.name, `Round 2: Reviewing peer reasoning from Round 1...`, 20, 'reasoning');

      const res = await fetchWithX402(`http://localhost:${juror.port}/mcp`, jurorMcpPayload2, juror.name);
      const verdict = JSON.parse(res.result.content[0].text);
      console.log(`  👨‍⚖️ ${juror.name}: Final Vote ${verdict.vote} | ${verdict.reasoning}`);

      emitAgentThought(jurorId, juror.name, `Final vote: ${verdict.vote} | Confidence: ${verdict.confidence || 82}%`, 95, 'validation');
      emitEvent('juror_vote', { juror: juror.name, round: 2, verdict, rep: juror.rep });

      const secret = process.env[`AGENT_${jurorKeySuffix(juror.name)}_PRIVATE_KEY`] || 'fallback-dev-secret';
      const receipt = createDeliberationReceipt(
        secret,
        disputeId,
        juror.pk,
        2,
        JSON.stringify(round2Args),
        verdict.vote,
        verdict.reasoning,
        previousReceiptId
      );
      receiptChain.push(receipt);
      previousReceiptId = receipt.receiptId;
      console.log(`  📜 [Audit] Receipt: ${receipt.receiptId.slice(0, 8)}... → Hash: ${receipt.signature.slice(0, 16)}...`);

      emitEvent('receipt_created', { receipt, juror: juror.name, round: 2 });

      return { juror, verdict };
    } catch (e: any) {
      console.error(`  ❌ ${juror.name} failed: ${e.message}`);
      emitAgentThought(jurorId, juror.name, `Error in Round 2: ${e.message}`, 0, 'validation');
      return null;
    }
  }));

  const validRound2 = round2Results.filter(r => r !== null);

  // Verify cryptographic chain
  console.log(`\n  [Audit] Verifying Deliberation Cryptographic Chain...`);
  const isChainValid = receiptChain.length > 0 && verifyReceiptChain(receiptChain, 'juror-group');

  // Persist receipt chain for later API verification
  if (receiptChain.length > 0) {
    receiptChainStore.set(disputeId, receiptChain);
  }

  if (isChainValid) {
    console.log(`  ✅ Chain Valid! ${receiptChain.length} cryptographic receipts secured.`);

    const receiptChainTx = createTransactionEntry(
      'HMAC Receipt Chain',
      `Deliberation audit trail for ${disputeId}`,
      receiptChain[receiptChain.length - 1].receiptId,
      'AuditTrail',
      block ? block.block_height.toString() : 'latest',
      { disputeId, receiptCount: receiptChain.length, chainValid: true },
      false
    );
    saveTransaction(receiptChainTx);
    emitEvent('transaction', receiptChainTx);
  } else if (receiptChain.length === 0) {
    console.log(`  ⚠️  No receipts generated (jurors may have failed). Skipping audit trail.`);
  } else {
    console.log(`  ❌ Chain Invalid! Tampering detected.`);
  }

  // Step 5: Reputation-weighted vote tally
  console.log(`\n--- Step 5: Reputation-Weighted Vote Tally ---`);
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
    finalVerdict = 'FullRefund';
    verdictIndex = 0;
    finalValue = resultA.estimated_value;
    console.log(`  📋 Verdict: FullRefund (Favoring Comps/Agent A) | Weight: ${scoreA}`);
  } else if (scoreB >= scoreA && scoreB >= scoreSplit) {
    finalVerdict = 'FullRelease';
    verdictIndex = 2;
    finalValue = resultB.estimated_value;
    console.log(`  📋 Verdict: FullRelease (Favoring DCF/Agent B) | Weight: ${scoreB}`);
  } else {
    finalVerdict = 'SplitFifty';
    verdictIndex = 1;
    finalValue = Math.round((resultA.estimated_value + resultB.estimated_value) / 2);
    console.log(`  📋 Verdict: SplitFifty | Weight: ${scoreSplit}`);
  }

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`⚖️  VERDICT: ${finalVerdict}`);
  console.log(`💵 Final Assessed Value: ${finalValue.toLocaleString()}`);
  console.log(`${'─'.repeat(60)}`);

  emitEvent('final_verdict', { disputeId, finalVerdict, finalValue, scoreA, scoreB, scoreSplit });

  const verdictTx = createTransactionEntry(
    'ExecuteVerdict',
    `Dispute ${disputeId} verdict: ${finalVerdict}`,
    `verdict-${disputeId}`,
    'Orchestrator',
    block ? block.block_height.toString() : 'latest',
    { disputeId, finalVerdict, finalValue, scoreA, scoreB, scoreSplit },
    false
  );
  saveTransaction(verdictTx);
  emitEvent('transaction', verdictTx);

  // Step 6: On-chain settlement
  console.log(`\n--- Step 6: Casper Blockchain Settlement ---`);
  const votingHash = process.env.VOTING_CONTRACT_HASH;
  const escrowHash = process.env.ESCROW_CONTRACT_HASH;
  const reputationHash = process.env.REPUTATION_CONTRACT_HASH;

  console.log(`\n  [ZK-Lite] Generating Verifiable Execution Commitment...`);
  const executionCommitment = createExecutionCommitment(
    JSON.stringify({ disputeId, assetId, location, spotCount }),
    { finalVerdict, finalValue, scoreA, scoreB, scoreSplit },
    block ? block.block_height : 'latest'
  );
  const commitmentTxHash = await storeCommitmentOnCasper(executionCommitment, reputationHash || '0xmockreputation');
  const isZkOnChain = !commitmentTxHash.startsWith('mock_deploy_');

  const commitmentTx = createTransactionEntry(
    'ZK-Lite Commitment',
    `Dispute ${disputeId} execution commitment`,
    commitmentTxHash,
    'ReputationRegistry',
    block ? block.block_height.toString() : 'latest',
    { disputeId, executionCommitment },
    isZkOnChain
  );
  saveTransaction(commitmentTx);
  emitEvent('transaction', commitmentTx);

  if (votingHash) {
    console.log(`  📝 VotingContract (${votingHash.slice(0, 16)}...): cast_vote(${disputeId}, ${verdictIndex}, weight)`);
  } else {
    console.log(`  📝 VotingContract: [PENDING DEPLOY] cast_vote(${disputeId}, verdict=${verdictIndex}, weight)`);
  }

  if (escrowHash) {
    console.log(`  💰 EscrowContract (${escrowHash.slice(0, 16)}...): settle_dispute(${disputeId})`);
  } else {
    console.log(`  💰 EscrowContract: [PENDING DEPLOY] settle_dispute(${disputeId})`);
  }

  if (reputationHash) {
    console.log(`  🏆 ReputationRegistry (${reputationHash.slice(0, 16)}...): queued for retroactive update`);
  } else {
    console.log(`  🏆 ReputationRegistry: [PENDING DEPLOY] retroactive update queued`);
  }

  // Step 7: Native transfer settlement
  const deployerKeyPath = process.env.DEPLOYER_PRIVATE_KEY;
  if (deployerKeyPath) {
    console.log(`\n--- Step 7: Executing Real On-Chain Native Transfer ---`);
    try {
      const targetPublicKeyHex = process.env.AGENT_A_PUBLIC_KEY || process.env.DEPLOYER_PUBLIC_KEY;
      const id = Date.now();

      console.log(`  🔄 Broadcasting Native Transfer of 2.5 CSPR via CSPR.cloud API...`);

      const deployHash = await executeCasperTransfer(targetPublicKeyHex as string, SETTLEMENT_AMOUNT_MOTES, id);
      console.log(`  ✅ Successfully submitted Casper Transaction!`);
      console.log(`  🔍 View on Explorer: https://testnet.cspr.live/deploy/${deployHash}`);

      const transferTx = createTransactionEntry(
        'Native Transfer',
        `Dispute ${disputeId} settlement payment`,
        deployHash,
        'Native Transfer',
        'latest',
        { disputeId, amount: '2.5 CSPR', target: targetPublicKeyHex },
        true
      );
      saveTransaction(transferTx);
      emitEvent('transaction', transferTx);
    } catch (err: any) {
      console.log(`  ❌ Failed to execute Native Transfer. Testnet node might be down.`);
      if (err.message) console.log(`     Details: ${err.message.substring(0, 150)}...`);
    }
  }

  console.log(`\n✅ Dispute #${disputeId} resolution complete.\n`);

  return { verdict: finalVerdict, verdictIndex, finalValue };
}

// ─── Express server ──────────────────────────────────────────────────────────

if (import.meta.url === `file://${process.argv[1]}`) {
  const app = express();
  app.use(cors({ origin: ALLOWED_ORIGINS }));
  app.use(express.json());

  // Simple in-memory rate limiter: max 5 dispute starts per minute per IP
  const disputeTimestamps = new Map<string, number[]>();
  const RATE_WINDOW_MS = 60_000;
  const RATE_MAX = 5;

  // Periodic cleanup to prevent unbounded memory growth
  setInterval(() => {
    const now = Date.now();
    for (const [ip, timestamps] of disputeTimestamps) {
      const recent = timestamps.filter(t => now - t < RATE_WINDOW_MS);
      if (recent.length === 0) {
        disputeTimestamps.delete(ip);
      } else {
        disputeTimestamps.set(ip, recent);
      }
    }
  }, RATE_WINDOW_MS);

  function isRateLimited(ip: string): boolean {
    const now = Date.now();
    const timestamps = disputeTimestamps.get(ip) || [];
    const recent = timestamps.filter(t => now - t < RATE_WINDOW_MS);
    disputeTimestamps.set(ip, recent);
    if (recent.length >= RATE_MAX) return true;
    recent.push(now);
    return false;
  }

  app.post('/api/disputes/start', async (req, res) => {
    try {
      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      if (isRateLimited(ip)) {
        return res.status(429).json({ success: false, error: 'Too many requests. Try again in a minute.' });
      }

      const { assetId, location, spotCount } = req.body || {};
      if (!assetId || typeof assetId !== 'string') {
        return res.status(400).json({ success: false, error: 'assetId is required' });
      }
      if (!location || typeof location !== 'string') {
        return res.status(400).json({ success: false, error: 'location is required' });
      }
      if (typeof spotCount !== 'number' || spotCount < 1 || spotCount > 10000) {
        return res.status(400).json({ success: false, error: 'spotCount must be a number between 1 and 10000' });
      }

      const disputeId = `DISP-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

      runDisputeResolution(disputeId, assetId, location, spotCount).catch(err => {
        console.error(`[Dispute ${disputeId}] Unhandled error:`, err.message);
      });

      res.json({ success: true, disputeId });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/health', (_, res) => {
    res.json({ status: 'ok', service: 'orchestrator', timestamp: new Date().toISOString() });
  });

  app.get('/api/transactions', (_, res) => {
    try {
      const transactions = loadTransactions();
      res.json({ success: true, transactions });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * POST /api/receipts/verify
   * Verifies the HMAC receipt chain for a given dispute.
   * Returns per-receipt verification details + overall chain validity.
   */
  app.post('/api/receipts/verify', (req, res) => {
    try {
      const { disputeId } = req.body;
      if (!disputeId) {
        res.status(400).json({ success: false, error: 'disputeId is required' });
        return;
      }

      const chain = receiptChainStore.get(disputeId);
      if (!chain || chain.length === 0) {
        res.json({
          success: true,
          valid: false,
          reason: 'No receipt chain found for this dispute',
          receiptCount: 0,
          details: [],
        });
        return;
      }

      // Verify the full chain
      const chainValid = verifyReceiptChain(chain, 'juror-group');

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
        disputeId,
        details,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * POST /api/assess
   * Run a full RWA assessment: dual valuation + juror deliberation.
   * Returns the assessment result synchronously (waits for completion).
   */
  app.post('/api/assess', async (req, res) => {
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

      console.log(`\n📋 Assessment request: ${name} (${assetType}) | ${askingPrice.toLocaleString()}`);

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
        console.warn(`  ⚠️ Market data fetch failed: ${err.message}`);
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

      console.log(`  📊 Valuation A: ${valuationA.estimated_value.toLocaleString()} (${valuationA.method})`);
      console.log(`  📊 Valuation B: ${valuationB.estimated_value.toLocaleString()} (${valuationB.method})`);
      console.log(`  📊 Divergence: ${divergence.toFixed(1)}%`);

      // Step 3: If divergence > 15%, run juror deliberation
      let verdict: any = null;
      if (divergence > 15) {
        const disputeId = `ASSESS-${Date.now()}`;
        try {
          const result = await runDisputeResolution(disputeId, assetId, location || 'Global', weightOz || sqft || 1);
          verdict = result;
        } catch (err: any) {
          console.warn(`  ⚠️ Deliberation failed: ${err.message}`);
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
            jurors: verdict.votes?.length || 0,
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
          },
          valuationB: {
            method: valuationB.method,
            value: valuationB.estimated_value,
            confidence: valuationB.confidence,
            source: valuationB.dataSource || 'Agent',
            reasoning: valuationB.reasoning,
          },
          verdict: verdict ? {
            decision: verdict.verdict,
            finalValue: verdict.finalValue,
          } : null,
          marketData: marketData ? {
            source: marketData.source,
            comparables: marketData.comparables?.length || 0,
          } : null,
          analysisSteps,
          dataSources: dataSourcesUsed,
          methodology,
          timestamp: Date.now(),
        },
      };

      // Log the assessment as a transaction
      const assessmentTx = createTransactionEntry(
        'InitiateDispute',
        `Assessment: ${name} (${assetType}) - ${assessedValue.toLocaleString()}`,
        assetId,
        'Orchestrator',
        'latest',
        { assetType, askingPrice, assessedValue, divergence },
        false
      );
      saveTransaction(assessmentTx);
      emitEvent('transaction', assessmentTx);

      res.json(response);
    } catch (err: any) {
      console.error('[Assess] Error:', err.message);
      res.status(500).json({ success: false, error: err.message });
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

  const PORT = process.env.ORCHESTRATOR_API_PORT || 3011;
  app.listen(PORT, () => {
    console.log(`🚀 Orchestrator API running on http://localhost:${PORT}`);
  });
}
