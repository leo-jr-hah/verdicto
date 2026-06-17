import { WebSocketServer, WebSocket } from 'ws';

const PORT = 3010;
const wss = new WebSocketServer({ port: PORT });

const clients = new Set<WebSocket>();

let connectionCallback: (() => void) | null = null;

wss.on('connection', (ws) => {
  console.log('[WebSocket] Dashboard client connected');
  clients.add(ws);
  if (connectionCallback) {
    connectionCallback();
    connectionCallback = null; // Only run once
  }

  ws.on('error', (err) => {
    console.error('[WebSocket] Client error:', err.message);
    clients.delete(ws);
  });

  ws.on('close', () => {
    console.log('[WebSocket] Dashboard client disconnected');
    clients.delete(ws);
  });
});

export function waitForConnection(callback: () => void) {
  if (clients.size > 0) {
    callback();
  } else {
    connectionCallback = callback;
    console.log('[WebSocket] Waiting for dashboard client to connect on http://localhost:5173 ...');
  }
}

export function emitEvent(type: string, payload: any) {
  const message = JSON.stringify({ type, timestamp: Date.now(), payload });
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

console.log(`[WebSocket] Server running on ws://localhost:${PORT}`);
