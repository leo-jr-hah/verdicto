/**
 * Shared Transaction Log — records all on-chain transactions for the dashboard.
 * Persists to a JSON file so data survives across orchestrator restarts.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_FILE = path.resolve(__dirname, '../../data/transactions.json');

export interface TransactionEntry {
  id: string;
  type: 'ZK-Lite Commitment' | 'Native Transfer' | 'HMAC Receipt Chain' | 'ExecuteVerdict' | 'UpdateReputation' | 'InitiateDispute' | 'x402 Payment';
  action: string;
  hash: string;
  contract: string;
  blockHeight: string;
  timestamp: string; // ISO 8601
  explorerUrl: string;
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

export function saveTransaction(entry: TransactionEntry): void {
  const transactions = loadTransactions();
  transactions.unshift(entry); // newest first
  // Keep last 200 entries
  if (transactions.length > 200) {
    transactions.length = 200;
  }
  ensureDataDir();
  fs.writeFileSync(LOG_FILE, JSON.stringify(transactions, null, 2));
}

export function createTransactionEntry(
  type: TransactionEntry['type'],
  action: string,
  hash: string,
  contract: string,
  blockHeight: string = 'latest',
  metadata?: Record<string, unknown>
): TransactionEntry {
  const explorerUrl = `https://testnet.cspr.live/transaction/${hash}`;
  return {
    id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    action,
    hash,
    contract,
    blockHeight,
    timestamp: new Date().toISOString(),
    explorerUrl,
    metadata,
  };
}
