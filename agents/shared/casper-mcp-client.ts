import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';

let casperMcpClient: Client | null = null;

// Contract hashes from .env
const REPUTATION_CONTRACT_HASH = process.env.REPUTATION_CONTRACT_HASH || '';
const ASSESSMENT_CONTRACT_HASH = process.env.ASSESSMENT_CONTRACT_HASH || '';
const VOTING_CONTRACT_HASH = process.env.VOTING_CONTRACT_HASH || '';

export async function getCasperMcpClient(): Promise<Client> {
  if (casperMcpClient) {
    return casperMcpClient;
  }

  const transport = new SSEClientTransport(new URL('https://mcp.testnet.cspr.cloud/mcp'), {
    eventSourceInit: {
      headers: { Authorization: process.env.CSPRCLOUD_API_KEY || '' }
    } as any,
    requestInit: {
      headers: { Authorization: process.env.CSPRCLOUD_API_KEY || '' }
    }
  });

  const client = new Client(
    {
      name: 'verdict-orchestrator',
      version: '1.0.0',
    },
    {
      capabilities: {},
    }
  );

  await client.connect(transport);
  casperMcpClient = client;
  return client;
}

// Helper to get contract hash for a specific contract
export function getContractHash(contractName: 'reputation' | 'assessment' | 'voting'): string {
  switch (contractName) {
    case 'reputation':
      return REPUTATION_CONTRACT_HASH;
    case 'assessment':
      return ASSESSMENT_CONTRACT_HASH;
    case 'voting':
      return VOTING_CONTRACT_HASH;
    default:
      throw new Error(`Unknown contract: ${contractName}`);
  }
}
