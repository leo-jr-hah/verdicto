import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { createWebSocket } from '../services/api';

export const ConnectionStatus: React.FC = () => {
  const [wsConnected, setWsConnected] = useState(false);

  useEffect(() => {
    const ws = createWebSocket(() => {});
    
    ws.onopen = () => setWsConnected(true);
    ws.onclose = () => setWsConnected(false);
    
    return () => ws.close();
  }, []);

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '0.5rem', 
      padding: '0.5rem 1rem', 
      fontSize: '0.85rem',
      fontWeight: 600,
      color: wsConnected ? '#10B981' : 'var(--text-tertiary)',
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-color)',
      borderRadius: '999px'
    }}>
      {wsConnected ? <Wifi size={14} /> : <WifiOff size={14} />}
      {wsConnected ? 'Network Online' : 'Network Offline'}
    </div>
  );
};
