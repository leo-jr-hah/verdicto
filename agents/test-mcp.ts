import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import * as dotenv from 'dotenv';
dotenv.config({path: '../.env'});

async function run() {
  const transport = new SSEClientTransport(new URL('https://mcp.testnet.cspr.cloud/sse'), {
    eventSourceInit: { headers: { Authorization: process.env.CSPRCLOUD_API_KEY || '' } } as any,
    requestInit: { headers: { Authorization: process.env.CSPRCLOUD_API_KEY || '' } }
  });
  const client = new Client({ name: 'test', version: '1.0' }, { capabilities: {} });
  
  await client.connect(transport);
  console.log(await client.listTools());
  process.exit(0);
}
run().catch(console.error);
