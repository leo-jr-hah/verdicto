import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap,
  ArrowRight,
  Clock,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { createWebSocket, type WSMessage } from '../services/api';

// ─── Types ───────────────────────────────────────────────────────────────────

interface PaymentEvent {
  id: string;
  from: string;
  to: string;
  amount: number;
  tool: string;
  txHash: string;
  timestamp: number;
  status: 'pending' | 'confirmed' | 'failed';
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCSPR(motes: number): string {
  return `${(motes / 1_000_000_000).toFixed(2)} CSPR`;
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

// ─── Demo Payments ───────────────────────────────────────────────────────────

const DEMO_PAYMENTS: PaymentEvent[] = [];

// ─── Sub-components ──────────────────────────────────────────────────────────

const PaymentRow: React.FC<{ payment: PaymentEvent; index: number }> = ({ payment, index }) => {
  const statusColor = {
    pending: '#f59e0b',
    confirmed: '#10b981',
    failed: '#ef4444',
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.75rem 1rem',
        borderBottom: '1px solid var(--border-color)',
        background: index === 0 ? 'rgba(139, 92, 246, 0.03)' : 'transparent',
      }}
    >
      {/* Status dot */}
      <div style={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: statusColor[payment.status],
        boxShadow: payment.status === 'pending' ? `0 0 8px ${statusColor[payment.status]}60` : 'none',
        animation: payment.status === 'pending' ? 'pulse-dot 1.5s infinite' : 'none',
        flexShrink: 0,
      }} />

      {/* From → To */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{payment.from}</span>
          <ArrowRight size={12} color="var(--text-tertiary)" />
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{payment.to}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.15rem' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>{payment.tool}</span>
        </div>
      </div>

      {/* Amount */}
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#8b5cf6' }}>
          {formatCSPR(payment.amount)}
        </div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
          {formatTime(payment.timestamp)}
        </div>
      </div>
    </motion.div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────

export const X402PaymentStream: React.FC = () => {
  const [payments, setPayments] = useState<PaymentEvent[]>(DEMO_PAYMENTS);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    try {
      const ws = createWebSocket((msg: WSMessage) => {
        if (msg.type === 'transaction' && msg.payload?.type === 'x402 Payment') {
          const newPayment: PaymentEvent = {
            id: `pay-${Date.now()}`,
            from: msg.payload.from || 'Unknown',
            to: msg.payload.to || 'Unknown',
            amount: msg.payload.amount || 0,
            tool: msg.payload.tool || 'x402 Payment',
            txHash: msg.payload.hash || '',
            timestamp: msg.timestamp || Date.now(),
            status: 'confirmed',
          };
          setPayments(prev => [newPayment, ...prev].slice(0, 50));
        }
      });
      wsRef.current = ws;
      ws.onopen = () => setConnected(true);
      ws.onclose = () => setConnected(false);
      ws.onerror = () => { /* WS is optional */ };
      return () => { try { ws.close(); } catch { /* ignore */ } };
    } catch {
      // WebSocket not available — skip silently
    }
  }, []);

  const totalVolume = payments.reduce((sum, p) => sum + p.amount, 0);
  const confirmedCount = payments.filter(p => p.status === 'confirmed').length;
  const pendingCount = payments.filter(p => p.status === 'pending').length;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Zap size={20} color="#8b5cf6" />
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Payment Activity
          </h2>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.3rem',
            padding: '0.2rem 0.6rem', borderRadius: '4px',
            background: connected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(107, 114, 128, 0.1)',
            color: connected ? '#10b981' : '#6b7280',
            fontSize: '0.7rem', fontWeight: 600,
          }}>
            {connected ? <Wifi size={12} /> : <WifiOff size={12} />}
            {connected ? 'Live' : 'Offline'}
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{
          background: 'var(--bg-surface)', borderRadius: '10px', border: '1px solid var(--border-color)',
          padding: '1rem', textAlign: 'center',
        }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#8b5cf6' }}>
            {formatCSPR(totalVolume)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Total Volume</div>
        </div>
        <div style={{
          background: 'var(--bg-surface)', borderRadius: '10px', border: '1px solid var(--border-color)',
          padding: '1rem', textAlign: 'center',
        }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10b981' }}>
            {confirmedCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Confirmed</div>
        </div>
        <div style={{
          background: 'var(--bg-surface)', borderRadius: '10px', border: '1px solid var(--border-color)',
          padding: '1rem', textAlign: 'center',
        }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f59e0b' }}>
            {pendingCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Pending</div>
        </div>
      </div>

      {/* Payment stream */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          background: 'var(--bg-surface)',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          overflow: 'hidden',
        }}
      >
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)',
        }}>
          <Zap size={14} color="#8b5cf6" />
          <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Recent Payments</span>
          <span style={{
            marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--text-tertiary)',
            padding: '0.15rem 0.5rem', borderRadius: '4px', background: 'var(--bg-surface-alt)',
          }}>
            {payments.length} transactions
          </span>
        </div>

        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {payments.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
              No payments yet. Payments will appear here as assessments and services are used.
            </div>
          ) : (
          <AnimatePresence>
            {payments.map((payment, i) => (
              <PaymentRow key={payment.id} payment={payment} index={i} />
            ))}
          </AnimatePresence>
          )}
        </div>
      </motion.div>

      {/* Info note */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.4rem',
        marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-tertiary)',
      }}>
        <Clock size={12} />
        Updates arrive automatically
      </div>

      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
};

export default X402PaymentStream;
