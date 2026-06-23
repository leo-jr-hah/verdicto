/**
 * Casper Smart Contract Interactions
 * 
 * Real on-chain calls to deployed Odra contracts:
 * - VotingContract: cast_vote, get_verdict, get_tally
 * - ReputationRegistry: register_agent, get_agent, update_parking_score
 * 
 * Uses casper-client CLI + CSPR.cloud RPC for contract calls.
 * Same pattern as executeCasperTransfer in orchestrator.
 * Falls back gracefully if contracts are unavailable.
 */

import { execFile } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const CSPR_CLOUD_KEY = process.env.CSPRCLOUD_API_KEY;
const CSPR_CLOUD_URL = process.env.CSPR_CLOUD_URL || 'https://api.testnet.casper.cloud/v1';
const CSPR_RPC_URL = process.env.CASPER_RPC_URL || 'https://node.testnet.casper.network/rpc';

const VOTING_CONTRACT_HASH = process.env.VOTING_CONTRACT_HASH;
const REPUTATION_CONTRACT_HASH = process.env.REPUTATION_CONTRACT_HASH;

const DEPLOY_PAYMENT_MOTES = 500_000_000; // 0.5 CSPR — session deploys cost more than transfers
const CHAIN_NAME = process.env.CASPER_CHAIN_NAME || 'casper-test';

// ─── Shared Helpers ──────────────────────────────────────────────────────────

function getDeployerKeyPath(): string {
  const deployerKeyPath = process.env.DEPLOYER_PRIVATE_KEY;
  if (!deployerKeyPath) throw new Error('DEPLOYER_PRIVATE_KEY not configured');
  const absoluteKeyPath = path.resolve(process.cwd(), '..', deployerKeyPath);
  if (!fs.existsSync(absoluteKeyPath)) throw new Error(`Key file not found: ${absoluteKeyPath}`);
  return absoluteKeyPath;
}

/**
 * Execute a session deploy (smart contract call) via casper-client + CSPR.cloud.
 * 
 * For Odra contracts, we use `casper-client put-deploy` with:
 *   --session-hash <contract_hash>
 *   --session-entry-point <entry_point>
 *   --session-arg <arg_name:type:value>
 */
async function executeContractCall(
  contractHash: string,
  entryPoint: string,
  sessionArgs: string[],
  deployId: number,
): Promise<string> {
  const keyPath = getDeployerKeyPath();
  const tempFile = path.resolve(process.cwd(), `contract-deploy-${deployId}.json`);

  // Build casper-client args
  const args = [
    'put-deploy',
    '--chain-name', CHAIN_NAME,
    '--secret-key', keyPath,
    '--payment-amount', String(DEPLOY_PAYMENT_MOTES),
    '--session-hash', contractHash,
    '--session-entry-point', entryPoint,
    '-o', tempFile,
    ...sessionArgs.flatMap(a => ['--session-arg', a]),
  ];

  const stdout = await new Promise<string>((resolve, reject) => {
    execFile('casper-client', args, { encoding: 'utf-8' }, (error, stdout, stderr) => {
      if (error) reject(new Error(`casper-client failed: ${stderr || error.message}`));
      else resolve(stdout);
    });
  });

  const deployJson = fs.readFileSync(tempFile, 'utf8');
  fs.unlinkSync(tempFile);

  const payload = {
    jsonrpc: '2.0',
    id: deployId,
    method: 'account_put_deploy',
    params: [JSON.parse(deployJson)],
  };

  const response = await axios.post(CSPR_RPC_URL, payload, {
    headers: { Authorization: CSPR_CLOUD_KEY },
    timeout: 15_000,
  });

  if (response.data.error) {
    throw new Error(response.data.error.message);
  }

  return response.data.result.deploy_hash;
}

// ─── VotingContract Calls ────────────────────────────────────────────────────

export interface CastVoteResult {
  success: boolean;
  txHash: string;
  assessmentId: string;
  verdictIndex: number;
  weight: number;
}

/**
 * Cast a vote on the VotingContract.
 * Maps verdict string to contract enum index: AgentAPreferred=0, SplitFifty=1, AgentBPreferred=2
 * 
 * Contract entry point: cast_vote(assessment_id: u64, verdict: VerdictOption, reasoning: String, weight: u32)
 */
export async function castVoteOnChain(
  assessmentId: string,
  verdict: 'AgentAPreferred' | 'SplitFifty' | 'AgentBPreferred',
  reasoning: string,
  weight: number,
): Promise<CastVoteResult> {
  if (!VOTING_CONTRACT_HASH) {
    console.log(`  📝 VotingContract: [NO CONTRACT HASH] cast_vote skipped`);
    return { success: false, txHash: '', assessmentId, verdictIndex: 0, weight };
  }

  try {
    const { createHash } = await import('crypto');
    const assessmentNum = parseInt(createHash('sha256').update(assessmentId).digest('hex').slice(0, 15), 16);
    const verdictIndex = verdict === 'AgentAPreferred' ? 0 : verdict === 'SplitFifty' ? 1 : 2;

    // Odra VerdictOption is an enum: AgentAPreferred=0, SplitFifty=1, AgentBPreferred=2
    // casper-client session-arg format: "name:type:value"
    const sessionArgs = [
      `assessment_id:u64:${assessmentNum}`,
      `verdict:u32:${verdictIndex}`,
      `reasoning:string:"${reasoning.slice(0, 200).replace(/"/g, '\\"')}"`,
      `weight:u32:${weight}`,
    ];

    const deployId = Date.now() + Math.floor(Math.random() * 1000);
    const txHash = await executeContractCall(VOTING_CONTRACT_HASH, 'cast_vote', sessionArgs, deployId);

    console.log(`  📝 VotingContract ✅ cast_vote → ${txHash.slice(0, 16)}...`);
    return { success: true, txHash, assessmentId, verdictIndex, weight };
  } catch (err: any) {
    console.warn(`  ⚠️ VotingContract cast_vote failed: ${err.message}`);
    return { success: false, txHash: '', assessmentId, verdictIndex: 0, weight };
  }
}

/**
 * Read verdict from VotingContract via CSPR.cloud state query.
 */
export async function getVerdictOnChain(assessmentId: string): Promise<{ verdict: number; tally: number[] } | null> {
  if (!VOTING_CONTRACT_HASH || !CSPR_CLOUD_KEY) return null;

  try {
    const response = await axios.get(
      `${CSPR_CLOUD_URL}/contracts/${VOTING_CONTRACT_HASH}/state`,
      { headers: { Authorization: CSPR_CLOUD_KEY }, timeout: 10_000 }
    );
    return response.data?.data || null;
  } catch (err: any) {
    console.warn(`  ⚠️ VotingContract read failed: ${err.message}`);
    return null;
  }
}

// ─── ReputationRegistry Calls ────────────────────────────────────────────────

export interface OnChainReputation {
  agentId: string;
  parkingScore: number;
  realEstateScore: number;
  reliabilityScore: number;
  assessmentCount: number;
}

/**
 * Update an agent's parking score on the ReputationRegistry.
 * 
 * Contract entry point: update_parking_score(agent_id: Address, delta: i32)
 */
export async function updateReputationOnChain(
  agentId: string,
  domain: 'parking' | 'real_estate',
  delta: number,
): Promise<{ success: boolean; txHash: string }> {
  if (!REPUTATION_CONTRACT_HASH) {
    console.log(`  🏆 ReputationRegistry: [NO CONTRACT HASH] update_score skipped`);
    return { success: false, txHash: '' };
  }

  try {
    // For Odra Address type, we use the deployer's own address as the agent_id
    // since agents are registered by the deployer (admin)
    const deployerKeyPath = getDeployerKeyPath();
    const pemContent = fs.readFileSync(deployerKeyPath, 'utf8');
    
    // Extract public key from PEM for the agent address
    // Odra Address is the account hash (blake2b of public key)
    // For simplicity, use the deployer's account as the agent address
    const { PrivateKey, KeyAlgorithm } = await import('casper-js-sdk');
    const privateKey = PrivateKey.fromPem(pemContent, KeyAlgorithm.ED25519);
    const publicKey = privateKey.publicKey;
    const accountHash = publicKey.accountHash().toString();

    const entryPoint = 'update_parking_score';
    const sessionArgs = [
      `agent_id:key_account-hash:${accountHash}`,
      `delta:i32:${delta}`,
    ];

    const deployId = Date.now() + Math.floor(Math.random() * 1000);
    const txHash = await executeContractCall(REPUTATION_CONTRACT_HASH, entryPoint, sessionArgs, deployId);

    console.log(`  🏆 ReputationRegistry ✅ ${entryPoint} → ${txHash.slice(0, 16)}...`);
    return { success: true, txHash };
  } catch (err: any) {
    console.warn(`  ⚠️ ReputationRegistry update failed: ${err.message}`);
    return { success: false, txHash: '' };
  }
}

/**
 * Read all agent reputations from the ReputationRegistry via CSPR.cloud.
 * Falls back to env-based defaults if on-chain read fails.
 */
export async function getReputationsOnChain(): Promise<OnChainReputation[]> {
  if (!REPUTATION_CONTRACT_HASH || !CSPR_CLOUD_KEY) {
    return getDefaultReputations();
  }

  try {
    const response = await axios.get(
      `${CSPR_CLOUD_URL}/contracts/${REPUTATION_CONTRACT_HASH}/state`,
      { headers: { Authorization: CSPR_CLOUD_KEY }, timeout: 10_000 }
    );
    const state = response.data?.data;
    if (state?.cards) {
      return Object.entries(state.cards).map(([agentId, card]: [string, any]) => ({
        agentId,
        parkingScore: card.parking_score || 700,
        realEstateScore: card.real_estate_score || 700,
        reliabilityScore: card.reliability_score || 700,
        assessmentCount: card.assessment_count || 0,
      }));
    }
    return getDefaultReputations();
  } catch (err: any) {
    console.warn(`  ⚠️ ReputationRegistry read failed: ${err.message}`);
    return getDefaultReputations();
  }
}

/**
 * Default reputations from env vars (fallback when on-chain read fails).
 */
function getDefaultReputations(): OnChainReputation[] {
  return [
    {
      agentId: 'valuation-agent-a',
      parkingScore: parseInt(process.env.AGENT_A_REPUTATION || '750', 10),
      realEstateScore: 750,
      reliabilityScore: 735,
      assessmentCount: 156,
    },
    {
      agentId: 'valuation-agent-b',
      parkingScore: parseInt(process.env.AGENT_B_REPUTATION || '780', 10),
      realEstateScore: 780,
      reliabilityScore: 745,
      assessmentCount: 142,
    },
    {
      agentId: 'evidence-analyst',
      parkingScore: parseInt(process.env.AGENT_EVIDENCE_REPUTATION || '820', 10),
      realEstateScore: 820,
      reliabilityScore: 805,
      assessmentCount: 189,
    },
    {
      agentId: 'market-interpreter',
      parkingScore: parseInt(process.env.AGENT_MARKET_REPUTATION || '790', 10),
      realEstateScore: 790,
      reliabilityScore: 775,
      assessmentCount: 174,
    },
    {
      agentId: 'precedent-researcher',
      parkingScore: parseInt(process.env.AGENT_PRECEDENT_REPUTATION || '810', 10),
      realEstateScore: 810,
      reliabilityScore: 795,
      assessmentCount: 168,
    },
  ];
}
