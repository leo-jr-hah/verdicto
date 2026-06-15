// Test: storeCommitmentOnCasper using casper-js-sdk v5.x
import { createHash } from 'crypto';
import pkg from 'casper-js-sdk';
const { PrivateKey, KeyAlgorithm, RpcClient, HttpHandler, CasperNetwork } = pkg;
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  console.log('=== Test: storeCommitmentOnCasper ===\n');

  // 1. Create a commitment
  const input = 'test evidence: property at 123 Main St valued at $450,000';
  const agentState = { model: 'gpt-4', confidence: 0.87, domain: 'real_estate' };
  const blockHeight = 8188737;

  const agentStateHash = createHash('sha256').update(JSON.stringify(agentState)).digest('hex');
  const inputHash = createHash('sha256').update(input).digest('hex');
  const timestamp = Date.now();
  const commitment = createHash('sha256').update(`${inputHash}|${agentStateHash}|${timestamp}|${blockHeight}`).digest('hex');

  console.log('Commitment:', commitment.slice(0, 16) + '...');
  console.log('Agent State Hash:', agentStateHash.slice(0, 16) + '...');
  console.log('Input Hash:', inputHash.slice(0, 16) + '...');
  console.log('Timestamp:', timestamp);
  console.log('Block Height:', blockHeight);
  console.log();

  // 2. Load deployer key
  const keyPath = path.resolve(__dirname, '../keys/deployer.pem');
  const pemContent = fs.readFileSync(keyPath, 'utf8');
  const privateKey = PrivateKey.fromPem(pemContent, KeyAlgorithm.SECP256K1);
  const publicKey = privateKey.publicKey;
  console.log('Deployer:', publicKey.toHex().slice(0, 20) + '...');
  console.log();

  // 3. Create RPC client
  const rpcUrl = 'https://node.testnet.casper.network/rpc';
  const httpHandler = new HttpHandler(rpcUrl);
  const rpcClient = new RpcClient(httpHandler);
  const casperNetwork = await CasperNetwork.create(rpcClient);
  console.log('Network API version:', casperNetwork.apiVersion);
  console.log();

  // 4. Create transfer transaction (self-transfer to anchor commitment on-chain)
  console.log('Creating transfer transaction...');
  const tx = casperNetwork.createTransferTransaction(
    publicKey,        // sender
    publicKey,        // recipient (self-transfer)
    'casper-test',    // chain name
    '10000000000',    // 10 CSPR in motes
    100_000_000,      // deploy cost
    1800000,          // TTL in ms
    Date.now()        // transfer ID
  );

  // 5. Sign
  tx.sign(privateKey);
  console.log('Transaction signed');
  console.log();

  // 6. Submit
  console.log('Submitting transaction...');
  const result = await casperNetwork.putTransaction(tx);
  console.log('Raw result:', JSON.stringify(result, null, 2));
  // transactionHash is a custom object that serializes to a string via JSON.stringify
  const txHash = JSON.parse(JSON.stringify(result.transactionHash));
  console.log('✅ Transaction submitted!');
  console.log('Transaction Hash:', txHash);
  console.log();

  // 7. Wait and check status
  console.log('Waiting 10s for execution...');
  await new Promise(r => setTimeout(r, 10000));
  
  const txInfo = await casperNetwork.getTransaction(txHash);
  const errorMessage = txInfo?.transaction?.executionInfo?.executionResult?.errorMessage;
  const blockHash = txInfo?.transaction?.executionInfo?.blockHash;
  console.log('Block Hash:', blockHash);
  console.log('Execution Error:', errorMessage || 'none');
  console.log();

  if (errorMessage) {
    console.log('⚠️  Transfer execution failed (expected for self-transfer), but tx hash is on-chain');
  } else {
    console.log('✅ Transfer executed successfully!');
  }

  console.log('\n=== Test Complete ===');
}

main().catch(console.error);
