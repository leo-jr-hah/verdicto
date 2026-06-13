import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import express from 'express';
import axios from 'axios';

const app = express();
app.use(express.json());
const mcpServer = new McpServer({ name: 'Test', version: '1.0' });
mcpServer.tool('test', 'test tool', {}, async () => ({ content: [{ type: 'text', text: 'hello' }] }));

const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
mcpServer.connect(transport);
app.post('/mcp', async (req, res) => await transport.handleRequest(req, res, req.body));

const server = app.listen(4001, async () => {
  try {
    const res = await axios.post('http://localhost:4001/mcp', {
      jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'test', arguments: {} }
    }, { headers: { Accept: 'application/json, text/event-stream' } });
    console.log('Status:', res.status);
    console.log('Headers:', res.headers);
    console.log('Data:', res.data);
  } catch (e: any) {
    console.error('Error:', e.response?.status, e.response?.data);
  }
  server.close();
});
