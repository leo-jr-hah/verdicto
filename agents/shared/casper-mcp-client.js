import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
let casperMcpClient = null;
export async function getCasperMcpClient() {
    if (casperMcpClient) {
        return casperMcpClient;
    }
    const transport = new SSEClientTransport(new URL('https://mcp.testnet.cspr.cloud/mcp'), {
        eventSourceInit: {
            headers: { Authorization: process.env.CSPRCLOUD_API_KEY || '' }
        },
        requestInit: {
            headers: { Authorization: process.env.CSPRCLOUD_API_KEY || '' }
        }
    });
    const client = new Client({
        name: 'casper-rwa-court-orchestrator',
        version: '1.0.0',
    }, {
        capabilities: {},
    });
    await client.connect(transport);
    casperMcpClient = client;
    return client;
}
