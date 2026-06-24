/**
 * Shared Transaction Log - records all on-chain transactions for the dashboard.
 * Persists to a JSON file so data survives across orchestrator restarts.
 *
 * Writes are serialized through a promise queue to prevent race conditions
 * when multiple agents log transactions concurrently.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_FILE = path.resolve(__dirname, '../../data/transactions.json');
const MAX_ENTRIES = 200;

export interface TransactionEntry {
  id: string;
  type: 'ZK-Lite Commitment' | 'Native Transfer' | 'HMAC Receipt Chain' | 'ExecuteVerdict' | 'UpdateReputation' | 'SubmitAssessment' | 'x402 Payment' | 'ContractCall';
  action: string;
  hash: string;
  contract: string;
  blockHeight: string;
  timestamp: string; // ISO 8601
  explorerUrl: string;
  onChain: boolean; // true = real Casper deploy hash; false = off-chain logical event
  metadata?: Record<string, unknown>;
}

function ensureDataDir() {
  const dir = path.dirname(LOG_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function loadTransactions(): TransactionEntry[] {
  ensureDataDir();
  if (!fs.existsSync(LOG_FILE)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(LOG_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

// Write queue - serializes concurrent save calls so reads and writes don't clobber each other
let writeQueue: Promise<void> = Promise.resolve();

export function saveTransaction(entry: TransactionEntry): void {
  writeQueue = writeQueue.then(() => {
    const transactions = loadTransactions();
    transactions.unshift(entry); // newest first
    if (transactions.length > MAX_ENTRIES) {
      transactions.length = MAX_ENTRIES;
    }
    ensureDataDir();
    fs.writeFileSync(LOG_FILE, JSON.stringify(transactions, null, 2));
  }).catch((err: Error) => {
    console.error('[TransactionLog] Write failed:', err.message);
  });
}

export function createTransactionEntry(
  type: TransactionEntry['type'],
  action: string,
  hash: string,
  contract: string,
  blockHeight: string = 'latest',
  metadata?: Record<string, unknown>,
  onChain: boolean = false
): TransactionEntry {
  const explorerUrl = onChain
    ? `https://testnet.cspr.live/transaction/${hash}`
    : '';
  return {
    id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    action,
    hash,
    contract,
    blockHeight,
    timestamp: new Date().toISOString(),
    explorerUrl,
    onChain,
    metadata,
  };
}
