import { createHash } from 'crypto';

export interface ExecutionCommitment {
  commitment: string; // SHA-256 of (input + agentState + timestamp)
  agentStateHash: string; // Hash of agent's internal state
  inputHash: string; // Hash of input evidence
  timestamp: number;
  blockHeight: number; // Casper block height for temporal binding
}

/**
 * Creates a lightweight cryptographic commitment (hash chain) that provides 
 * verifiable evidence of agent execution without full ZK-SNARKs overhead.
 */
export function createExecutionCommitment(
  input: string,
  agentState: object,
  blockHeight: number | string
): ExecutionCommitment {
  const parsedBlockHeight = typeof blockHeight === 'string' && blockHeight === 'latest' ? 0 : Number(blockHeight);
  
  const agentStateHash = createHash('sha256')
    .update(JSON.stringify(agentState))
    .digest('hex');
    
  const inputHash = createHash('sha256')
    .update(input)
    .digest('hex');
    
  const timestamp = Date.now();
  
  const commitment = createHash('sha256')
    .update(`${inputHash}|${agentStateHash}|${timestamp}|${parsedBlockHeight}`)
    .digest('hex');
    
  return { 
    commitment, 
    agentStateHash, 
    inputHash, 
    timestamp, 
    blockHeight: parsedBlockHeight 
  };
}

export async function storeCommitmentOnCasper(
  commitment: ExecutionCommitment,
  contractHash: string
) {
  // In a production environment, this would call casperClient.deploy
  // to invoke 'store_execution_commitment' on the ReputationRegistry contract
  console.log(`  🔗 [ZK-Lite] Anchoring commitment ${commitment.commitment.slice(0, 16)}... to Casper (Contract: ${contractHash.slice(0, 10)}...)`);
  
  // Simulated success
  return `mock_deploy_${commitment.commitment.substring(0, 8)}`;
}
