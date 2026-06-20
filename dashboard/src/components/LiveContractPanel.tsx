import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  Users,
  Scale,
  Shield,
  RefreshCw,
  Wifi,
  WifiOff,
  TrendingUp,
  Clock,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { fetchContractState, type ContractState } from '../services/api';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-US').format(n);
}

function formatCSPR(motes: number): string {
  return `${(motes / 1_000_000_000).toFixed(2)} CSPR`;
}

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
  subtext?: string;
  index: number;
}> = ({ icon, label, value, color, subtext, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay: index * 0.1 }}
    style={{
      background: 'var(--bg-surface)',
      borderRadius: '12px',
      border: '1px solid var(--border-color)',
      padding: '1.25rem',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
      <div style={{
        width: 32,
        height: 32,
        borderRadius: '8px',
        background: `${color}15`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color,
      }}>
        {icon}
      </div>
      <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>{label}</span>
    </div>
    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
      {typeof value === 'number' ? formatNumber(value) : value}
    </div>
    {subtext && (
      <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.4rem' }}>
        {subtext}
      </div>
    )}
  </motion.div>
);

const AgentRow: React.FC<{
  agent: ContractState['agents'][0];
  index: number;
}> = ({ agent, index }) => (
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
    }}
  >
    <div style={{
      width: 36,
      height: 36,
      borderRadius: '8px',
      background: 'rgba(99, 102, 241, 0.1)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <Users size={16} color="#6366f1" />
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
        {agent.name}
      </div>
      <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
        {agent.totalAssessments} assessments • {agent.accuracy}% accuracy
      </div>
    </div>
    <div style={{
      padding: '0.3rem 0.7rem',
      borderRadius: '6px',
      background: agent.reputation >= 800
        ? 'rgba(16, 185, 129, 0.15)'
        : agent.reputation >= 600
          ? 'rgba(245, 158, 11, 0.15)'
          : 'rgba(239, 68, 68, 0.15)',
      color: agent.reputation >= 800 ? '#10b981' : agent.reputation >= 600 ? '#f59e0b' : '#ef4444',
      fontSize: '0.85rem',
      fontWeight: 700,
    }}>
      {agent.reputation}
    </div>
  </motion.div>
);

// ─── Main Component ──────────────────────────────────────────────────────────

export const LiveContractPanel: React.FC = () => {
  const [state, setState] = useState<ContractState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<number>(Date.now());

  const loadState = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchContractState();
      if (data) {
        setState(data);
        setConnected(true);
      } else {
        // Use mock data when API unavailable
        setState({
          disputes: { total: 47, pending: 3, deliberating: 2, voting: 1, resolved: 41 },
          agents: [
            { id: 'valuation-agent-a', name: 'Valuation Agent A', reputation: 847, totalAssessments: 156, accuracy: 92 },
            { id: 'valuation-agent-b', name: 'Valuation Agent B', reputation: 812, totalAssessments: 143, accuracy: 89 },
            { id: 'evidence-analyst', name: 'Evidence Analyst', reputation: 891, totalAssessments: 167, accuracy: 94 },
            { id: 'market-interpreter', name: 'Market Interpreter', reputation: 778, totalAssessments: 134, accuracy: 87 },
            { id: 'precedent-researcher', name: 'Precedent Researcher', reputation: 856, totalAssessments: 152, accuracy: 91 },
          ],
          escrow: { totalStaked: 125_000_000_000, totalSettled: 98_500_000_000, activeDisputes: 6 },
          receipts: { total: 234, verified: 228, pending: 6 },
          lastUpdated: Date.now(),
        });
        setConnected(false);
      }
    } catch (err) {
      setError('Failed to load contract state');
      setConnected(false);
    } finally {
      setLoading(false);
      setLastRefresh(Date.now());
    }
  }, []);

  useEffect(() => {
    loadState();
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadState, 30_000);
    return () => clearInterval(interval);
  }, [loadState]);

  if (loading && !state) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem' }}>
        <Loader2 size={24} color="var(--primary)" className="animate-spin" />
        <span style={{ marginLeft: '0.75rem', color: 'var(--text-secondary)' }}>Loading contract state...</span>
      </div>
    );
  }

  if (error && !state) {
    return (
      <div style={{
        background: 'rgba(239, 68, 68, 0.05)',
        borderRadius: '12px',
        border: '1px solid rgba(239, 68, 68, 0.2)',
        padding: '2rem',
        textAlign: 'center',
      }}>
        <AlertCircle size={24} color="#ef4444" style={{ marginBottom: '0.5rem' }} />
        <p style={{ color: 'var(--text-secondary)' }}>{error}</p>
        <button onClick={loadState} style={{
          marginTop: '1rem', padding: '0.5rem 1rem', borderRadius: '6px',
          border: '1px solid var(--border-color)', background: 'var(--bg-surface)',
          cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-secondary)',
        }}>
          Retry
        </button>
      </div>
    );
  }

  if (!state) return null;

  return (
    <div>
      {/* Header with connection status */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Activity size={20} color="var(--primary)" />
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Live Contract State
          </h2>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.3rem',
            padding: '0.2rem 0.6rem', borderRadius: '4px',
            background: connected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
            color: connected ? '#10b981' : '#f59e0b',
            fontSize: '0.7rem', fontWeight: 600,
          }}>
            {connected ? <Wifi size={12} /> : <WifiOff size={12} />}
            {connected ? 'Live' : 'Demo'}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
            Updated {formatTimeAgo(lastRefresh)}
          </span>
          <button
            onClick={loadState}
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.3rem',
              padding: '0.4rem 0.8rem', borderRadius: '6px',
              border: '1px solid var(--border-color)', background: 'var(--bg-surface)',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '0.8rem', color: 'var(--text-secondary)',
              opacity: loading ? 0.6 : 1,
            }}
          >
            <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <StatCard
          icon={<Scale size={16} />}
          label="Total Disputes"
          value={state.disputes.total}
          color="#6366f1"
          subtext={`${state.disputes.pending} pending • ${state.disputes.resolved} resolved`}
          index={0}
        />
        <StatCard
          icon={<Shield size={16} />}
          label="Receipts"
          value={state.receipts.total}
          color="#10b981"
          subtext={`${state.receipts.verified} verified • ${state.receipts.pending} pending`}
          index={1}
        />
        <StatCard
          icon={<TrendingUp size={16} />}
          label="Total Staked"
          value={formatCSPR(state.escrow.totalStaked)}
          color="#f59e0b"
          subtext={`${formatCSPR(state.escrow.totalSettled)} settled`}
          index={2}
        />
        <StatCard
          icon={<Activity size={16} />}
          label="Active Disputes"
          value={state.disputes.deliberating + state.disputes.voting}
          color="#ef4444"
          subtext={`${state.disputes.deliberating} deliberating • ${state.disputes.voting} voting`}
          index={3}
        />
      </div>

      {/* Agent reputation table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        style={{
          background: 'var(--bg-surface)',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          overflow: 'hidden',
        }}
      >
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)',
        }}>
          <Users size={16} color="var(--primary)" />
          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Agent Reputation Scores</span>
          <span style={{
            marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--text-tertiary)',
            padding: '0.15rem 0.5rem', borderRadius: '4px', background: 'var(--bg-surface-alt)',
          }}>
            On-chain via ReputationRegistry
          </span>
        </div>

        {state.agents.map((agent, i) => (
          <AgentRow key={agent.id} agent={agent} index={i} />
        ))}
      </motion.div>

      {/* Auto-refresh indicator */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: '0.4rem', marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-tertiary)',
      }}>
        <Clock size={12} />
        Auto-refreshes every 30 seconds
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LiveContractPanel;
