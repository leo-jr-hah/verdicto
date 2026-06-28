import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';
import type { IncomingMessage } from 'http';

const clients = new Set<WebSocket>();

let connectionCallback: (() => void) | null = null;

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:5174,http://localhost:3000,https://verdicto.xyz,https://www.verdicto.xyz').split(',').map(s => s.trim());

function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return false;
  return ALLOWED_ORIGINS.includes(origin);
}

/**
 * Attach WebSocket server to an existing HTTP server.
 * This allows WS and HTTP to share the same port (required for Railway deployment).
 */
export function attachWebSocket(server: Server) {
  const wss = new WebSocketServer({
    server,
    path: '/ws',
    verifyClient: (info: { origin: string; req: IncomingMessage }, callback) => {
      const origin = info.origin || info.req.headers.origin;
      if (!isAllowedOrigin(origin)) {
        callback(false, 403, 'Forbidden: invalid origin');
        return;
      }
      callback(true);
    },
  });

  wss.on('connection', (ws) => {
    console.log('[WebSocket] Dashboard client connected');
    clients.add(ws);
    if (connectionCallback) {
      connectionCallback();
      connectionCallback = null;
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

  console.log('[WebSocket] Attached to HTTP server on /ws');
}

export function waitForConnection(callback: () => void) {
  if (clients.size > 0) {
    callback();
  } else {
    connectionCallback = callback;
    console.log('[WebSocket] Waiting for dashboard client to connect...');
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
