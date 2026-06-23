/**
 * Casper Smart Contract Interactions
 * 
 * Real on-chain calls to deployed Odra contracts:
 * - VotingContract: cast_vote, get_verdict, get_tally
 * - ReputationRegistry: register_agent, get_agent, update_parking_score
 * 
 * Uses casper-js-sdk v5.x for RPC calls via CSPR.cloud.
 * Falls back gracefully if contracts are unavailable.
 */

import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const CSPR_RPC_URL = process.env.CASPER_RPC_URL || 'https://node.testnet.casper.network/rpc';
const CSPR_CLOUD_KEY = process.env.CSPRCLOUD_API_KEY;
const CSPR_CLOUD_URL = process.env.CSPR_CLOUD_URL || 'https://api.testnet.casper.cloud/v1';

const VOTING_CONTRACT_HASH = process.env.VOTING_CONTRACT_HASH;
const REPUTATION_CONTRACT_HASH = process.env.REPUTATION_CONTRACT_HASH;

const DEPLOY_PAYMENT_MOTES = 100_000_000; // 0.1 CSPR
const DEPLOY_TTL_MS = 1_800_000;          // 30 minutes

// ─── Shared Helpers ──────────────────────────────────────────────────────────

async function loadDeployerKey() {
  const { PrivateKey, KeyAlgorithm } = await import('casper-js-sdk');
  const fs = await import('fs');

  const deployerKeyPath = process.env.DEPLOYER_PRIVATE_KEY;
  if (!deployerKeyPath) throw new Error('DEPLOYER_PRIVATE_KEY not configured');

  const absoluteKeyPath = path.resolve(__dirname, '../../..', deployerKeyPath);
  if (!fs.existsSync(absoluteKeyPath)) throw new Error(`Key file not found: ${absoluteKeyPath}`);

  const pemContent = fs.readFileSync(absoluteKeyPath, 'utf8');
  return PrivateKey.fromPem(pemContent, KeyAlgorithm.ED25519);
}

/**
 * Submit a session_put_deploy to call a smart contract entry point.
 * This is a WRITE call — it costs CSPR and produces a deploy hash.
 */
async function callContractEntryPoint(
  contractHash: string,
  entryPoint: string,
  args: Array<{ clType: string; bytes: string }>,
  deployerKey: any,
): Promise<string> {
  const { CasperNetwork } = await import('casper-js-sdk');

  const rpcUrl = process.env.CASPER_RPC_URL || 'https://node.testnet.casper.network/rpc';
  const { HttpHandler, RpcClient } = await import('casper-js-sdk');
  const httpHandler = new HttpHandler(rpcUrl);
  const rpcClient = new RpcClient(httpHandler);
  const casperNetwork = await CasperNetwork.create(rpcClient);

  const publicKey = deployerKey.publicKey;
  const chainName = process.env.CASPER_CHAIN_NAME || 'casper-test';

  // Build the session module bytes for a stored contract call
  // Format: module bytes = contract hash (32 bytes) + entry point name length (1 byte) + entry point name
  const contractHashBytes = Buffer.from(contractHash.replace('hash-', ''), 'hex');
  const entryPointBytes = Buffer.from(entryPoint, 'utf8');
  const entryPointLen = Buffer.from([entryPointBytes.length]);

  const moduleBytes = Buffer.concat([contractHashBytes, entryPointLen, entryPointBytes]);

  // Create a deploy with session bytes
  const tx = casperNetwork.createTransaction(
    publicKey,
    chainName,
    DEPLOY_PAYMENT_MOTES,
    DEPLOY_TTL_MS,
    Date.now(),
    {
      Stored: {
        by_hash: contractHash.replace('hash-', ''),
        version: null,
        entry_point: entryPoint,
        args: args.reduce((acc, arg) => {
          acc[arg.clType] = { bytes: arg.bytes, clType: arg.clType };
          return acc;
        }, {} as Record<string, any>),
      },
    } as any,
  );

  tx.sign(deployerKey);

  const result = await casperNetwork.putTransaction(tx);
  const txHash = 'transactionHash' in result
    ? JSON.parse(JSON.stringify(result.transactionHash))
    : 'hash' in result && typeof result.hash === 'string'
      ? result.hash
      : 'unknown';

  return txHash;
}

/**
 * Read a value from contract state via CSPR.cloud REST API.
 * This is a READ call — no CSPR cost, no deploy needed.
 */
async function readContractState(
  contractHash: string,
  keyPath: string,
): Promise<any> {
  if (!CSPR_CLOUD_KEY) {
    throw new Error('CSPRCLOUD_API_KEY not configured');
  }

  try {
    const response = await axios.get(
      `${CSPR_CLOUD_URL}/contracts/${contractHash}/state`,
      {
        headers: { Authorization: CSPR_CLOUD_KEY },
        timeout: 10_000,
      }
    );
    return response.data;
  } catch (err: any) {
    throw new Error(`Failed to read contract state: ${err.message}`);
  }
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
    const deployerKey = await loadDeployerKey();

    // Convert assessment ID string to u64 (use hash of string as numeric ID)
    const { createHash } = await import('crypto');
    const assessmentNum = parseInt(createHash('sha256').update(assessmentId).digest('hex').slice(0, 15), 16);

    const verdictIndex = verdict === 'AgentAPreferred' ? 0 : verdict === 'SplitFifty' ? 1 : 2;

    // CL types for cast_vote(assessment_id: u64, verdict: VerdictOption, reasoning: String, weight: u32)
    const args = [
      { clType: 'U64', bytes: assessmentNum.toString(16).padStart(16, '0') },
      { clType: 'U32', bytes: verdictIndex.toString(16).padStart(8, '0') },
      { clType: 'String', bytes: Buffer.from(reasoning.slice(0, 200), 'utf8').toString('hex') },
      { clType: 'U32', bytes: weight.toString(16).padStart(8, '0') },
    ];

    const txHash = await callContractEntryPoint(VOTING_CONTRACT_HASH, 'cast_vote', args, deployerKey);

    console.log(`  📝 VotingContract (${VOTING_CONTRACT_HASH.slice(0, 16)}...): cast_vote → ${txHash.slice(0, 16)}...`);
    return { success: true, txHash, assessmentId, verdictIndex, weight };
  } catch (err: any) {
    console.warn(`  ⚠️ VotingContract cast_vote failed: ${err.message}`);
    return { success: false, txHash: '', assessmentId, verdictIndex: 0, weight };
  }
}

/**
 * Read verdict from VotingContract state.
 */
export async function getVerdictOnChain(assessmentId: string): Promise<{ verdict: number; tally: number[] } | null> {
  if (!VOTING_CONTRACT_HASH) return null;

  try {
    const state = await readContractState(VOTING_CONTRACT_HASH, '');
    // Parse the contract state to extract verdict and tally
    // The exact structure depends on Odra's state serialization
    return state?.data?.verdicts ? { verdict: state.data.verdicts, tally: state.data.tally || [] } : null;
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
 * Register an agent on the ReputationRegistry.
 */
export async function registerAgentOnChain(
  agentId: string,
  initialParking: number,
  initialRealEstate: number,
): Promise<{ success: boolean; txHash: string }> {
  if (!REPUTATION_CONTRACT_HASH) {
    console.log(`  🏆 ReputationRegistry: [NO CONTRACT HASH] register_agent skipped`);
    return { success: false, txHash: '' };
  }

  try {
    const deployerKey = await loadDeployerKey();

    // CL types for register_agent(agent_id: Address, initial_parking: u32, initial_real_estate: u32)
    const args = [
      { clType: 'Key', bytes: Buffer.from(agentId, 'hex').toString('hex') },
      { clType: 'U32', bytes: initialParking.toString(16).padStart(8, '0') },
      { clType: 'U32', bytes: initialRealEstate.toString(16).padStart(8, '0') },
    ];

    const txHash = await callContractEntryPoint(REPUTATION_CONTRACT_HASH, 'register_agent', args, deployerKey);

    console.log(`  🏆 ReputationRegistry (${REPUTATION_CONTRACT_HASH.slice(0, 16)}...): register_agent → ${txHash.slice(0, 16)}...`);
    return { success: true, txHash };
  } catch (err: any) {
    console.warn(`  ⚠️ ReputationRegistry register_agent failed: ${err.message}`);
    return { success: false, txHash: '' };
  }
}

/**
 * Update an agent's parking score on the ReputationRegistry.
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
    const deployerKey = await loadDeployerKey();

    const entryPoint = domain === 'parking' ? 'update_parking_score' : 'update_parking_score'; // Both use same pattern
    const deltaBytes = (delta >= 0 ? delta : (0xFFFFFFFF + delta + 1)).toString(16).padStart(8, '0');

    const args = [
      { clType: 'Key', bytes: Buffer.from(agentId, 'hex').toString('hex') },
      { clType: 'I32', bytes: deltaBytes },
    ];

    const txHash = await callContractEntryPoint(REPUTATION_CONTRACT_HASH, entryPoint, args, deployerKey);

    console.log(`  🏆 ReputationRegistry (${REPUTATION_CONTRACT_HASH.slice(0, 16)}...): ${entryPoint} → ${txHash.slice(0, 16)}...`);
    return { success: true, txHash };
  } catch (err: any) {
    console.warn(`  ⚠️ ReputationRegistry update_score failed: ${err.message}`);
    return { success: false, txHash: '' };
  }
}

/**
 * Read all agent reputations from the ReputationRegistry.
 * Falls back to env-based defaults if on-chain read fails.
 */
export async function getReputationsOnChain(): Promise<OnChainReputation[]> {
  if (!REPUTATION_CONTRACT_HASH) {
    return getDefaultReputations();
  }

  try {
    const state = await readContractState(REPUTATION_CONTRACT_HASH, '');
    // Parse Odra contract state — cards mapping
    if (state?.data?.cards) {
      return Object.entries(state.data.cards).map(([agentId, card]: [string, any]) => ({
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
 * These match the AGENT_SEED_SCORES in shared/types.ts.
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
