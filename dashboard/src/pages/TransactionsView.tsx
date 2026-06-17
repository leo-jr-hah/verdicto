import React, { useState, useEffect, useCallback } from 'react';
import { ExternalLink, RefreshCw, Wifi, WifiOff, Shield, Hash, Clock, BarChart3, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { fetchTransactions, createWebSocket, type TransactionEntry, type WSMessage } from '../services/api';

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);

  if (diffSec < 10) return 'Just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function truncateHash(hash: string): string {
  if (hash.length <= 16) return hash;
  return `${hash.slice(0, 8)}…${hash.slice(-8)}`;
}

function typeColor(type: string): string {
  switch (type) {
    case 'ZK-Lite Commitment': return '#8B5CF6';
    case 'HMAC Receipt Chain': return '#3B82F6';
    case 'Native Transfer': return '#10B981';
    case 'x402 Payment': return '#F59E0B';
    case 'ExecuteVerdict': return '#EF4444';
    case 'UpdateReputation': return '#06B6D4';
    case 'InitiateDispute': return '#F97316';
    default: return 'var(--text-secondary)';
  }
}

const FILTER_TABS = ['all', 'zk-lite', 'hmac', 'payment', 'verdict'] as const;

function matchesFilter(type: string, filter: string): boolean {
  if (filter === 'all') return true;
  const lower = type.toLowerCase();
  switch (filter) {
    case 'zk-lite': return lower.includes('zk-lite');
    case 'hmac': return lower.includes('hmac');
    case 'payment': return lower.includes('payment') || lower.includes('x402');
    case 'verdict': return lower.includes('verdict') || lower.includes('execute');
    default: return lower.includes(filter);
  }
}

const STATS = [
  { key: 'total' as const, label: 'Total', color: 'var(--text-primary)', icon: BarChart3 },
  { key: 'zkLite' as const, label: 'ZK-Lite', color: '#8B5CF6', icon: Shield },
  { key: 'hmac' as const, label: 'HMAC', color: '#3B82F6', icon: Hash },
  { key: 'payments' as const, label: 'Payments', color: '#F59E0B', icon: TrendingUp },
  { key: 'verdicts' as const, label: 'Verdicts', color: '#10B981', icon: Clock },
];

export const TransactionsView: React.FC = () => {
  const [transactions, setTransactions] = useState<TransactionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [selectedTx, setSelectedTx] = useState<TransactionEntry | null>(null);
  const [filterType, setFilterType] = useState<string>('all');

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTransactions();
      setTransactions(data);
      setLastUpdate(new Date());
    } catch (err: any) {
      setError(err.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTransactions();

    let ws: WebSocket | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
    let reconnectDelay = 1000;
    const MAX_RECONNECT_DELAY = 30_000;
    let unmounted = false;

    function connect() {
      if (unmounted) return;
      ws = createWebSocket((msg: WSMessage) => {
        if (msg.type === 'transaction') {
          setTransactions(prev => [msg.payload as TransactionEntry, ...prev]);
          setLastUpdate(new Date());
        }
      });

      ws.onopen = () => {
        setWsConnected(true);
        reconnectDelay = 1000;
      };
      ws.onclose = () => {
        setWsConnected(false);
        if (!unmounted) {
          reconnectTimeout = setTimeout(() => {
            reconnectDelay = Math.min(reconnectDelay * 2, MAX_RECONNECT_DELAY);
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
  }, [loadTransactions]);

  const stats = {
    total: transactions.length,
    zkLite: transactions.filter(t => t.type === 'ZK-Lite Commitment').length,
    hmac: transactions.filter(t => t.type === 'HMAC Receipt Chain').length,
    payments: transactions.filter(t => t.type === 'x402 Payment').length,
    verdicts: transactions.filter(t => t.type === 'ExecuteVerdict').length,
  };

  const filtered = filterType === 'all' ? transactions : transactions.filter(t => matchesFilter(t.type, filterType));

  return (
    <div className="container" style={{ padding: '3rem 0' }}>
      {/* Header */}
      <div className="tx-header">
        <div>
          <div className="tx-header-title">
            <Shield size={24} color="var(--text-secondary)" />
            <h2>Cryptographic Audit Ledger</h2>
          </div>
          <p style={{ color: 'var(--text-secondary)' }}>
            Immutable ZK-Lite execution commitments and HMAC-chained receipts on Casper Testnet.
          </p>
        </div>
        <div className="tx-header-controls">
          <div className={`tx-ws-status ${wsConnected ? 'connected' : 'disconnected'}`}>
            {wsConnected ? <Wifi size={16} /> : <WifiOff size={16} />}
            {wsConnected ? 'Live' : 'Offline'}
          </div>
          {lastUpdate && (
            <span className="tx-last-update">
              Updated {formatTime(lastUpdate.toISOString())}
            </span>
          )}
          <button onClick={loadTransactions} disabled={loading} className="tx-refresh-btn">
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="tx-stats-grid">
        {STATS.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              className="tx-stat-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <div className="tx-stat-icon" style={{ background: `${stat.color}22` }}>
                <Icon size={18} color={stat.color} />
              </div>
              <div>
                <div className="tx-stat-value">{stats[stat.key]}</div>
                <div className="tx-stat-label">{stat.label}</div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        {FILTER_TABS.map(filter => (
          <button
            key={filter}
            onClick={() => setFilterType(filter)}
            className={`filter-tab ${filterType === filter ? 'active' : ''}`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Empty State */}
      {filtered.length === 0 && !loading && !error && (
        <div className="enterprise-card empty-state">
          <Shield size={48} color="var(--text-tertiary)" className="empty-state-icon" />
          <div className="empty-state-title">No transactions yet</div>
          <p className="empty-state-text">
            Run a dispute resolution to see on-chain transactions appear here in real time.
          </p>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>
            Make sure the orchestrator backend is running on port 3011.
          </p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="enterprise-card tx-error-card">
          <div className="tx-error-title">⚠️ Error Loading Transactions</div>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{error}</p>
          <button onClick={loadTransactions} className="tx-retry-btn">Retry</button>
        </div>
      )}

      {/* Transaction Table */}
      {filtered.length > 0 && (
        <div className={`tx-main-grid ${selectedTx ? 'with-detail' : 'full'}`}>
          <div className="enterprise-card tx-table-wrap">
            <div className="tx-table-header">
              <table className="responsive-table data-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Action</th>
                    <th>Transaction Hash</th>
                    <th>Target</th>
                    <th>Block Height</th>
                    <th>Timestamp</th>
                    <th>Explorer</th>
                  </tr>
                </thead>
              </table>
            </div>
            <div className="tx-table-scroll">
              <table className="responsive-table data-table" style={{ width: '100%' }}>
                <tbody>
                  {filtered.map((tx, idx) => (
                    <motion.tr
                      key={tx.id}
                      className={`tx-row ${selectedTx?.id === tx.id ? 'selected' : ''}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => setSelectedTx(selectedTx?.id === tx.id ? null : tx)}
                    >
                      <td className="tx-cell-action">
                        <span className="tx-type-label">
                          <span className="tx-type-dot" style={{ background: typeColor(tx.type) }} />
                          <span>{tx.type}</span>
                        </span>
                        <div className="tx-action-sub">{tx.action}</div>
                      </td>
                      <td
                        className="tx-hash-cell"
                        title={tx.hash}
                        onClick={(e) => { e.stopPropagation(); if (tx.onChain && tx.explorerUrl) window.open(tx.explorerUrl, '_blank'); }}
                        style={!tx.onChain ? { cursor: 'default', opacity: 0.6 } : undefined}
                      >
                        {truncateHash(tx.hash)}
                        {!tx.onChain && (
                          <span style={{ display: 'inline-block', marginLeft: '0.4rem', fontSize: '0.65rem', padding: '0.1rem 0.35rem', borderRadius: '4px', background: 'rgba(255,255,255,0.08)', color: 'var(--text-tertiary)', verticalAlign: 'middle' }}>
                            off-chain
                          </span>
                        )}
                      </td>
                      <td className="tx-cell" style={{ color: 'var(--text-secondary)' }}>{tx.contract}</td>
                      <td className="tx-cell">{tx.blockHeight}</td>
                      <td className="tx-cell" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)' }}>
                        {formatTime(tx.timestamp)}
                      </td>
                      <td className="tx-cell">
                        {tx.onChain && tx.explorerUrl ? (
                          <a
                            href={tx.explorerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="tx-link"
                            onClick={(e) => e.stopPropagation()}
                          >
                            View <ExternalLink size={14} />
                          </a>
                        ) : (
                          <span style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>Off-chain</span>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detail Panel */}
          {selectedTx && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="enterprise-card tx-detail"
            >
              <div className="tx-detail-header">
                <h3>Transaction Details</h3>
                <button onClick={() => setSelectedTx(null)} className="tx-detail-close">✕</button>
              </div>

              <div className="tx-detail-fields">
                <div className="tx-detail-type-badge" style={{ border: `1px solid ${typeColor(selectedTx.type)}33` }}>
                  <div className="tx-detail-type-header">
                    <span className="tx-type-dot" style={{ background: typeColor(selectedTx.type) }} />
                    <span className="tx-detail-type-name">{selectedTx.type}</span>
                  </div>
                  <div className="tx-detail-type-action">{selectedTx.action}</div>
                </div>

                <div>
                  <div className="tx-detail-label">Transaction Hash</div>
                  <div className="tx-detail-hash">{selectedTx.hash}</div>
                </div>

                <div className="tx-detail-grid">
                  <div>
                    <div className="tx-detail-label">Target</div>
                    <div className="tx-detail-value">{selectedTx.contract}</div>
                  </div>
                  <div>
                    <div className="tx-detail-label">Block</div>
                    <div className="tx-detail-value">{selectedTx.blockHeight}</div>
                  </div>
                  <div>
                    <div className="tx-detail-label">Timestamp</div>
                    <div className="tx-detail-value">{new Date(selectedTx.timestamp).toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="tx-detail-label">Network</div>
                    <div className="tx-detail-value">Casper Testnet</div>
                  </div>
                  <div>
                    <div className="tx-detail-label">Location</div>
                    <div className="tx-detail-value" style={{ color: selectedTx.onChain ? '#10B981' : '#F59E0B' }}>
                      {selectedTx.onChain ? '⛓️ On-chain (Casper)' : '📋 Off-chain (logical event)'}
                    </div>
                  </div>
                </div>

                {selectedTx.onChain && selectedTx.explorerUrl ? (
                  <a
                    href={selectedTx.explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tx-detail-explorer"
                  >
                    View on cspr.live <ExternalLink size={14} />
                  </a>
                ) : (
                  <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', fontSize: '0.85rem', color: '#F59E0B' }}>
                    ℹ️ This is an off-chain logical event — no on-chain deploy hash to view on cspr.live.
                  </div>
                )}

                {selectedTx.metadata && (
                  <div>
                    <div className="tx-detail-label">Metadata</div>
                    <pre className="tx-detail-meta">
                      {JSON.stringify(selectedTx.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
};
