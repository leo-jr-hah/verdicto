import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Play, Activity, Scale, TrendingUp, Shield, Zap, ArrowRight, BarChart3, CheckCircle2, Wifi, WifiOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { fetchTransactions, createWebSocket, type TransactionEntry, type WSMessage } from '../services/api';

const AGENTS = [
  { name: 'Comps Specialist', color: '#EC4899', role: 'Valuation', method: 'Comparable Sales', initials: 'CS' },
  { name: 'Income Specialist', color: '#F97316', role: 'Valuation', method: 'DCF Analysis', initials: 'IS' },
  { name: 'Evidence Reviewer', color: '#10B981', role: 'Juror', method: 'Data Validation', initials: 'ER' },
  { name: 'Trend Analyst', color: '#06B6D4', role: 'Juror', method: 'Market Context', initials: 'TA' },
  { name: 'Case Researcher', color: '#8B5CF6', role: 'Juror', method: 'Precedent Search', initials: 'CR' },
];

const QUICK_ACTIONS = [
  { label: 'Value an Asset', sub: 'Dual-agent valuation', to: '/assess', icon: Scale, primary: true },
  { label: 'Run Demo', sub: 'See agents resolve a case', to: '/deliberation', icon: Play },
  { label: 'Meet the Agents', sub: 'Track performance', to: '/reputation', icon: Users },
  { label: 'View History', sub: 'All cases & transactions', to: '/transactions', icon: Activity },
];

export const DashboardView: React.FC = () => {
  const [transactions, setTransactions] = useState<TransactionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [wsConnected, setWsConnected] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const txs = await fetchTransactions();
      setTransactions(txs.slice(0, 10));
      setLoading(false);
    };
    load();

    let ws: WebSocket | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
    let reconnectDelay = 1000;
    let unmounted = false;

    function connect() {
      if (unmounted) return;
      ws = createWebSocket((msg: WSMessage) => {
        if (msg.type === 'transaction') {
          setTransactions(prev => [msg.payload as TransactionEntry, ...prev].slice(0, 10));
        }
      });
      ws.onopen = () => { setWsConnected(true); reconnectDelay = 1000; };
      ws.onclose = () => {
        setWsConnected(false);
        if (!unmounted) {
          reconnectTimeout = setTimeout(() => {
            reconnectDelay = Math.min(reconnectDelay * 2, 30000);
            connect();
          }, reconnectDelay);
        }
      };
    }
    connect();

    return () => {
      unmounted = true;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (ws && ws.readyState === WebSocket.OPEN) ws.close();
    };
  }, []);

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    const diffSec = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (diffSec < 60) return `${diffSec}s ago`;
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const totalCases = transactions.length;
  const onChainCount = transactions.filter(t => t.onChain).length;

  return (
    <>
      {/* ── Page Header ────────────────────────────────────────────────────── */}
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">Real-time overview of the Verdict dispute resolution protocol.</p>
          </div>
          <div className="page-header-actions">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: wsConnected ? 'var(--success)' : 'var(--text-tertiary)' }}>
              {wsConnected ? <Wifi size={14} /> : <WifiOff size={14} />}
              {wsConnected ? 'Live' : 'Offline'}
            </div>
            <Link to="/assess" className="btn btn-primary">
              <Scale size={15} />
              Value an Asset
            </Link>
          </div>
        </div>
      </div>

      {/* ── Stat Cards ─────────────────────────────────────────────────────── */}
      <div className="section">
        <div className="stat-grid">
          {[
            { label: 'Total Cases', value: totalCases, icon: BarChart3, color: 'var(--text-primary)', bg: 'var(--bg-surface-alt)' },
            { label: 'On-Chain', value: onChainCount, icon: CheckCircle2, color: 'var(--success)', bg: 'rgba(16, 185, 129, 0.08)' },
            { label: 'Active Agents', value: 5, icon: Zap, color: 'var(--purple)', bg: 'rgba(139, 92, 246, 0.08)' },
            { label: 'Data Sources', value: 3, icon: TrendingUp, color: 'var(--warning)', bg: 'rgba(245, 158, 11, 0.08)' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              className="stat-card"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <div className="stat-icon" style={{ background: stat.bg }}>
                <stat.icon size={18} color={stat.color} />
              </div>
              <div>
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Quick Actions ───────────────────────────────────────────────────── */}
      <div className="section">
        <div className="section-label">Quick Actions</div>
        <div className="grid-4">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.to}
              to={action.to}
              className="card card-hover"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                textDecoration: 'none',
                background: action.primary ? 'var(--primary)' : undefined,
                color: action.primary ? 'var(--text-inverse)' : undefined,
                border: action.primary ? 'none' : undefined,
                transition: 'transform 0.12s ease, box-shadow 0.12s ease',
              }}
            >
              <div style={{
                background: action.primary ? 'rgba(255,255,255,0.2)' : 'var(--bg-surface-alt)',
                padding: '10px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <action.icon size={18} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '14px', lineHeight: 1.3 }}>{action.label}</div>
                <div style={{ fontSize: '12px', opacity: action.primary ? 0.8 : 1, color: action.primary ? undefined : 'var(--text-tertiary)', marginTop: '2px' }}>{action.sub}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Main Content: Activity + Sidebar ────────────────────────────────── */}
      <div className="grid-main-sidebar">
        {/* Activity Feed */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="card-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', marginBottom: 0 }}>
            <div>
              <div className="card-title">Recent Activity</div>
              <div className="card-subtitle">Latest cases and transactions</div>
            </div>
            <Link to="/transactions" className="btn btn-ghost btn-sm">
              View All <ArrowRight size={14} />
            </Link>
          </div>
          <div style={{ maxHeight: '480px', overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: '20px' }}>
                {[1, 2, 3, 4, 5].map(i => <div key={i} className="skeleton" style={{ marginBottom: '8px', height: '56px' }} />)}
              </div>
            ) : transactions.length === 0 ? (
              <div className="empty-state" style={{ padding: '48px 24px' }}>
                <Activity size={32} color="var(--text-tertiary)" />
                <div className="empty-state-title" style={{ marginTop: '12px' }}>No activity yet</div>
                <p className="empty-state-text">Run a dispute resolution to see activity here.</p>
              </div>
            ) : (
              transactions.map((tx, i) => (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 20px',
                    borderBottom: '1px solid var(--border-color-subtle)',
                    cursor: 'pointer',
                    transition: 'background 0.12s ease',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-surface)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: 'var(--bg-surface-alt)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <Shield size={14} color="var(--text-tertiary)" />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '320px' }}>
                        {tx.type}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '1px' }}>
                        {tx.action}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                    {tx.onChain && (
                      <span style={{ fontSize: '11px', color: 'var(--success)', fontWeight: 500 }}>On-chain</span>
                    )}
                    <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>
                      {formatTime(tx.timestamp)}
                    </span>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--content-gap)' }}>
          {/* System Status */}
          <div className="card">
            <div className="card-title" style={{ marginBottom: '16px' }}>System Status</div>
            {[
              { label: 'Orchestrator', status: 'online', detail: 'Port 3011' },
              { label: 'WebSocket', status: wsConnected ? 'online' : 'offline', detail: wsConnected ? 'Connected' : 'Disconnected' },
              { label: 'Casper Network', status: 'online', detail: 'Testnet' },
            ].map((item, i) => (
              <div key={item.label} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 0',
                borderBottom: i < 2 ? '1px solid var(--border-color-subtle)' : 'none',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div className={`status-dot status-dot-${item.status}`} />
                  <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{item.label}</span>
                </div>
                <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{item.detail}</span>
              </div>
            ))}
          </div>

          {/* Agent Overview */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div className="card-title">Agents</div>
              <Link to="/reputation" className="btn btn-ghost btn-sm">
                Details <ArrowRight size={14} />
              </Link>
            </div>
            {AGENTS.map((agent, i) => (
              <div key={agent.name} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 0',
                borderBottom: i < AGENTS.length - 1 ? '1px solid var(--border-color-subtle)' : 'none',
              }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '7px',
                  background: `${agent.color}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  fontWeight: 700,
                  color: agent.color,
                  flexShrink: 0,
                }}>
                  {agent.initials}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{agent.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{agent.method}</div>
                </div>
                <div className="status-dot status-dot-online" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};
