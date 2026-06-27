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
      <Users size={16} color="var(--text-accent)" />
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
      color: agent.reputation >= 800 ? 'var(--success)' : agent.reputation >= 600 ? 'var(--warning)' : 'var(--error)',
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
          assessments: { total: 0, pending: 0, deliberating: 0, voting: 0, resolved: 0 },
          agents: [
            { id: 'valuation-agent-a', name: 'Valuation Agent A', reputation: 0, totalAssessments: 0, accuracy: 0 },
            { id: 'valuation-agent-b', name: 'Valuation Agent B', reputation: 0, totalAssessments: 0, accuracy: 0 },
            { id: 'evidence-analyst', name: 'Evidence Analyst', reputation: 0, totalAssessments: 0, accuracy: 0 },
            { id: 'market-interpreter', name: 'Market Interpreter', reputation: 0, totalAssessments: 0, accuracy: 0 },
            { id: 'precedent-researcher', name: 'Precedent Researcher', reputation: 0, totalAssessments: 0, accuracy: 0 },
          ],
          payments: { totalCollected: 0, totalProcessed: 0, activeAssessments: 0 },
          receipts: { total: 0, verified: 0, pending: 0 },
          lastUpdated: Date.now(),
        });
        setConnected(false);
      }
    } catch (err) {
      setError('Couldn\'t load data');
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
        <span style={{ marginLeft: '0.75rem', color: 'var(--text-secondary)' }}>Loading…</span>
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
        <AlertCircle size={24} color="var(--error)" style={{ marginBottom: '0.5rem' }} />
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
            Protocol Overview
          </h2>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.3rem',
            padding: '0.2rem 0.6rem', borderRadius: '4px',
            background: connected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(107, 114, 128, 0.1)',
            color: connected ? 'var(--success)' : 'var(--text-tertiary)',
            fontSize: '0.7rem', fontWeight: 600,
          }}>
            {connected ? <Wifi size={12} /> : <WifiOff size={12} />}
            {connected ? 'Live' : 'Offline'}
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
          label="Total Assessments"
          value={state.assessments.total}
          color="var(--text-accent)"
          subtext={`${state.assessments.pending} pending • ${state.assessments.resolved} resolved`}
          index={0}
        />
        <StatCard
          icon={<Shield size={16} />}
          label="Records"
          value={state.receipts.total}
          color="var(--success)"
          subtext={`${state.receipts.verified} verified • ${state.receipts.pending} pending`}
          index={1}
        />
        <StatCard
          icon={<TrendingUp size={16} />}
          label="Total Collected"
          value={formatCSPR(state.payments.totalCollected)}
          color="var(--warning)"
          subtext={`${formatCSPR(state.payments.totalProcessed)} processed`}
          index={2}
        />
        <StatCard
          icon={<Activity size={16} />}
          label="In Progress"
          value={state.assessments.deliberating + state.assessments.voting}
          color="var(--error)"
          subtext={`${state.assessments.deliberating} in review • ${state.assessments.voting} finalizing`}
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
          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Agent Reputation</span>
          <span style={{
            marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--text-tertiary)',
            padding: '0.15rem 0.5rem', borderRadius: '4px', background: 'var(--bg-surface-alt)',
          }}>
            Verified on Casper
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
        Refreshes automatically
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
