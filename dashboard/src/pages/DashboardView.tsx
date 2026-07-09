import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Activity, Scale, TrendingUp, Shield, Zap, ArrowRight, BarChart3, CheckCircle2, Wifi, WifiOff, Landmark, Radio } from 'lucide-react';
import { fetchTransactions, fetchOracleStats, createWebSocket, type TransactionEntry, type WSMessage, type OracleStats } from '../services/api';
import { LiveContractPanel } from '../components/LiveContractPanel';
import { X402PaymentStream } from '../components/X402PaymentStream';

const AGENTS = [
  { name: 'Valuation Agent A', role: 'Valuation', method: 'Market Comparables', initials: 'VA' },
  { name: 'Valuation Agent B', role: 'Valuation', method: 'Income Analysis', initials: 'VB' },
  { name: 'Evidence Analyst', role: 'Analysis', method: 'Document Review', initials: 'EA' },
  { name: 'Market Interpreter', role: 'Analysis', method: 'Market Context', initials: 'MI' },
  { name: 'Precedent Researcher', role: 'Analysis', method: 'Case Research', initials: 'PR' },
];

const QUICK_ACTIONS = [
  { label: 'Value an Asset', sub: 'Dual-agent valuation', to: '/assess', icon: Scale, primary: true },
  { label: 'Borrow Against Asset', sub: 'AI-secured lending', to: '/borrow', icon: Landmark },
  { label: 'Insure an Asset', sub: 'AI risk assessment', to: '/insure', icon: Shield },
  { label: 'Verdict Oracle', sub: 'On-chain price feed', to: '/oracle', icon: Radio },
  { label: 'Meet the Agents', sub: 'Track performance', to: '/reputation', icon: Users },
  { label: 'View History', sub: 'All assessments & transactions', to: '/transactions', icon: Activity },
];

export const DashboardView: React.FC = () => {
  const [transactions, setTransactions] = useState<TransactionEntry[]>([]);
  const [oracleStats, setOracleStats] = useState<OracleStats>({ totalVerdicts: 0, freshVerdicts: 0, avgConfidence: 0, totalQueries: 0, activeDisputes: 0, overturnedVerdicts: 0 });
  const [loading, setLoading] = useState(true);
  const [wsConnected, setWsConnected] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const txs = await fetchTransactions();
      setTransactions(txs.slice(0, 10));
      const os = await fetchOracleStats();
      setOracleStats(os);
      setLoading(false);
    };
    load();

    // Periodic refresh for oracle stats (WebSocket only pushes transactions)
    const refreshInterval = setInterval(async () => {
      try {
        const txs = await fetchTransactions();
        if (!unmounted) setTransactions(txs.slice(0, 10));
        const os = await fetchOracleStats();
        if (!unmounted) setOracleStats(os);
      } catch { /* silent */ }
    }, 30_000); // every 30s

    let ws: WebSocket | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
    let reconnectDelay = 1000;
    let reconnectAttempts = 0;
    const MAX_RECONNECT_ATTEMPTS = 3;
    let unmounted = false;

    function connect() {
      if (unmounted) return;
      try {
        ws = createWebSocket((msg: WSMessage) => {
          if (msg.type === 'transaction') {
            setTransactions(prev => [msg.payload as TransactionEntry, ...prev].slice(0, 10));
          }
        });
        ws.onopen = () => { setWsConnected(true); reconnectDelay = 1000; reconnectAttempts = 0; };
        ws.onclose = () => {
          setWsConnected(false);
          if (!unmounted && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            reconnectAttempts++;
            reconnectTimeout = setTimeout(() => {
              reconnectDelay = Math.min(reconnectDelay * 2, 30000);
              connect();
            }, reconnectDelay);
          }
        };
        ws.onerror = () => {
          // Silently handle — WS is optional
        };
      } catch {
        // WebSocket URL invalid or unsupported — skip silently
      }
    }
    connect();

    return () => {
      unmounted = true;
      clearInterval(refreshInterval);
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
            <p className="page-subtitle">Real-time overview of your Verdicto platform activity.</p>
          </div>
          <div className="page-header-actions">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: wsConnected ? 'var(--text-secondary)' : 'var(--text-tertiary)' }}>
              {wsConnected ? <Wifi size={14} /> : <WifiOff size={14} />}
              {wsConnected ? 'Live' : 'Offline'}
            </div>
          </div>
        </div>
      </div>

      {/* ── Stat Cards ─────────────────────────────────────────────────────── */}
      <div className="section">
        <div className="stat-grid">
          {[
            { label: 'Total Cases', value: totalCases, icon: BarChart3, color: 'var(--text-primary)', bg: 'var(--bg-sunken)' },
            { label: 'Verified', value: onChainCount, icon: CheckCircle2, color: 'var(--text-secondary)', bg: 'var(--success-soft)' },
            { label: 'Oracle Verdicts', value: oracleStats.totalVerdicts, icon: Radio, color: 'var(--text-secondary)', bg: 'var(--bg-inset)' },
            { label: 'Active Agents', value: 5, icon: Zap, color: 'var(--text-secondary)', bg: 'var(--bg-inset)' },
            { label: 'Live Feeds', value: 3, icon: TrendingUp, color: 'var(--text-tertiary)', bg: 'var(--warning-soft)' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="stat-card"
            >
              <div className="stat-icon" style={{ background: stat.bg }}>
                <stat.icon size={18} color={stat.color} />
              </div>
              <div>
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Protocol Overview ──────────────────────────────────────────────────── */}
      <div className="section">
        <LiveContractPanel />
      </div>

      {/* ── Payment Activity ──────────────────────────────────────────────────── */}
      <div className="section">
        <X402PaymentStream />
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
                background: action.primary ? 'var(--accent)' : undefined,
                color: action.primary ? 'var(--text-inverse)' : undefined,
                border: action.primary ? 'none' : undefined,
                transition: 'transform 0.12s ease, box-shadow 0.12s ease',
              }}
            >
              <div style={{
                background: action.primary ? 'rgba(255,255,255,0.2)' : 'var(--bg-sunken)',
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
          <div className="card-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', marginBottom: 0 }}>
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
                <p className="empty-state-text">Run an assessment to see activity here.</p>
              </div>
            ) : (
              transactions.map((tx) => (
                <div
                  key={tx.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 20px',
                    borderBottom: '1px solid var(--border-weak)',
                    cursor: 'pointer',
                    transition: 'background 0.12s ease',
                  }}
                  onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                  onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: 'var(--bg-sunken)',
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
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>On-chain</span>
                    )}
                    <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>
                      {formatTime(tx.timestamp)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--content-gap)' }}>
          {/* Platform Status */}
          <div className="card">
            <div className="card-title" style={{ marginBottom: '16px' }}>Platform Status</div>
            {[
              { label: 'Engine', status: 'online', detail: 'Connected' },
              { label: 'Live Updates', status: wsConnected ? 'online' : 'offline', detail: wsConnected ? 'Connected' : 'Disconnected' },
              { label: 'Casper Network', status: 'online', detail: 'Testnet' },
            ].map((item, i) => (
              <div key={item.label} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 0',
                borderBottom: i < 2 ? '1px solid var(--border-weak)' : 'none',
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
                borderBottom: i < AGENTS.length - 1 ? '1px solid var(--border-weak)' : 'none',
              }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '7px',
                  background: 'var(--bg-sunken)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
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
