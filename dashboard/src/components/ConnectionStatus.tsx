import React, { useState, useEffect, useRef } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { ORCHESTRATOR_URL } from '../services/api';

/**
 * Pings the orchestrator's /api/contract-state endpoint every 30s
 * to determine if the backend is reachable.
 */
export const ConnectionStatus: React.FC = () => {
  const [online, setOnline] = useState<boolean | null>(null); // null = unknown (first check pending)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkConnection = async () => {
    try {
      const res = await fetch(`${ORCHESTRATOR_URL}/api/contract-state`, {
        method: 'GET',
        signal: AbortSignal.timeout(8000), // 8s timeout
      });
      setOnline(res.ok);
    } catch {
      setOnline(false);
    }
  };

  useEffect(() => {
    // Check immediately on mount
    checkConnection();

    // Then every 30 seconds
    intervalRef.current = setInterval(checkConnection, 30_000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const isOnline = online === true;
  const label = online === null ? 'Checking…' : isOnline ? 'Network Online' : 'Network Offline';

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.5rem 1rem',
      fontSize: '0.85rem',
      fontWeight: 600,
      color: isOnline ? 'rgba(255,255,255,0.70)' : 'rgba(255,255,255,0.40)',
      background: 'rgba(255,255,255,0.06)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '999px'
    }}>
      {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
      {label}
    </div>
  );
};
