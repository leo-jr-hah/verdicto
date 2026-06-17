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
      console.log('[TransactionsView] Loaded', data.length, 'transactions');
      setTransactions(data);
      setLastUpdate(new Date());
    } catch (err: any) {
      console.error('[TransactionsView] Failed to load transactions:', err);
      setError(err.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTransactions();

    // Connect WebSocket for live updates
    const ws = createWebSocket((msg: WSMessage) => {
      if (msg.type === 'transaction') {
        setTransactions(prev => [msg.payload as TransactionEntry, ...prev]);
        setLastUpdate(new Date());
      }
    });

    ws.onopen = () => setWsConnected(true);
    ws.onclose = () => setWsConnected(false);

    return () => ws.close();
  }, [loadTransactions]);

  // Calculate stats
  const stats = {
    total: transactions.length,
    zkLite: transactions.filter(t => t.type === 'ZK-Lite Commitment').length,
    hmac: transactions.filter(t => t.type === 'HMAC Receipt Chain').length,
    payments: transactions.filter(t => t.type === 'x402 Payment').length,
    verdicts: transactions.filter(t => t.type === 'ExecuteVerdict').length
  };

  const filteredTransactions = filterType === 'all' 
    ? transactions 
    : transactions.filter(t => {
        const typeLower = t.type.toLowerCase();
        const filterLower = filterType.toLowerCase();
        // Map filter names to transaction types
        if (filterLower === 'zk-lite') return typeLower.includes('zk-lite');
        if (filterLower === 'hmac') return typeLower.includes('hmac');
        if (filterLower === 'payment') return typeLower.includes('payment') || typeLower.includes('x402');
        if (filterLower === 'verdict') return typeLower.includes('verdict') || typeLower.includes('execute');
        return typeLower.includes(filterLower);
      });

  return (
    <div className="container" style={{ padding: '3rem 0' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <Shield size={24} color="var(--text-secondary)" />
            <h2 style={{ fontSize: '2rem', margin: 0 }}>Cryptographic Audit Ledger</h2>
          </div>
          <p style={{ color: 'var(--text-secondary)' }}>
            Immutable ZK-Lite execution commitments and HMAC-chained receipts on Casper Testnet.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: wsConnected ? '#10B981' : 'var(--text-tertiary)' }}>
            {wsConnected ? <Wifi size={16} /> : <WifiOff size={16} />}
            {wsConnected ? 'Live' : 'Offline'}
          </div>
          {lastUpdate && (
            <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
              Updated {formatTime(lastUpdate.toISOString())}
            </span>
          )}
          <button
            onClick={loadTransactions}
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              background: 'var(--bg-surface)', border: '1px solid var(--border-color)',
              borderRadius: '6px', padding: '0.5rem 1rem', cursor: loading ? 'wait' : 'pointer',
              color: 'var(--text-secondary)', fontSize: '0.85rem',
            }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="transactions-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'Total', value: stats.total, color: 'var(--text-primary)', icon: BarChart3 },
          { label: 'ZK-Lite', value: stats.zkLite, color: '#8B5CF6', icon: Shield },
          { label: 'HMAC', value: stats.hmac, color: '#3B82F6', icon: Hash },
          { label: 'Payments', value: stats.payments, color: '#F59E0B', icon: TrendingUp },
          { label: 'Verdicts', value: stats.verdicts, color: '#10B981', icon: Clock }
        ].map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            style={{
              background: 'var(--bg-surface)',
              borderRadius: '8px',
              padding: '1rem',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}
          >
            <div style={{ 
              width: '36px', 
              height: '36px', 
              borderRadius: '8px', 
              background: `${stat.color}22`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <stat.icon size={18} color={stat.color} />
            </div>
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
                {stat.label}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        {['all', 'zk-lite', 'hmac', 'payment', 'verdict'].map((filter) => (
          <button
            key={filter}
            onClick={() => setFilterType(filter)}
            style={{
              padding: '0.5rem 1rem',
              background: filterType === filter ? 'var(--bg-surface)' : 'transparent',
              border: `1px solid ${filterType === filter ? 'var(--border-color)' : 'transparent'}`,
              borderRadius: '6px',
              color: filterType === filter ? 'var(--text-primary)' : 'var(--text-tertiary)',
              cursor: 'pointer',
              fontSize: '0.85rem',
              textTransform: 'capitalize'
            }}
          >
            {filter}
          </button>
        ))}
      </div>

      {filteredTransactions.length === 0 && !loading && !error && (
        <div className="enterprise-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <Shield size={48} color="var(--text-tertiary)" style={{ marginBottom: '1rem' }} />
          <div style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
            No transactions yet
          </div>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Run a dispute resolution to see on-chain transactions appear here in real time.
          </p>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>
            Make sure the orchestrator backend is running on port 3011.
          </p>
        </div>
      )}

      {error && (
        <div className="enterprise-card" style={{ textAlign: 'center', padding: '4rem 2rem', border: '2px solid #EF4444' }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem', color: '#EF4444' }}>
            ⚠️ Error Loading Transactions
          </div>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            {error}
          </p>
          <button 
            onClick={loadTransactions}
            style={{
              background: 'var(--primary)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '0.5rem 1rem',
              cursor: 'pointer',
              fontSize: '0.85rem',
            }}
          >
            Retry
          </button>
        </div>
      )}

      {filteredTransactions.length > 0 && (
        <div className="transactions-main-grid" style={{ display: 'grid', gridTemplateColumns: selectedTx ? '2fr 1fr' : '1fr', gap: '1.5rem' }}>
          {/* Transaction Table */}
          <div className="enterprise-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '600px' }}>
            <div style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-color)' }}>
              <table className="responsive-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Action</th>
                    <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Transaction Hash</th>
                    <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Target</th>
                    <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Block Height</th>
                    <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Timestamp</th>
                    <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Explorer</th>
                  </tr>
                </thead>
              </table>
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              <table className="responsive-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <tbody>
                  {filteredTransactions.map((tx, idx) => (
                    <motion.tr 
                      key={tx.id} 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    style={{ 
                      borderBottom: '1px solid var(--border-color)', 
                      fontFamily: "'JetBrains Mono', monospace", 
                      fontSize: '0.85rem',
                      background: selectedTx?.id === tx.id ? 'var(--bg-surface-alt)' : 'transparent',
                      cursor: 'pointer'
                    }}
                    onClick={() => setSelectedTx(selectedTx?.id === tx.id ? null : tx)}
                  >
                    <td data-label="Action" style={{ padding: '1.25rem 1.5rem', fontWeight: 600, fontFamily: 'var(--font-sans)' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: typeColor(tx.type), flexShrink: 0 }} />
                        <span style={{ color: 'var(--text-primary)' }}>{tx.type}</span>
                      </span>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.25rem', fontFamily: 'var(--font-sans)' }}>
                        {tx.action}
                      </div>
                    </td>
                    <td data-label="Transaction Hash" style={{ padding: '1.25rem 1.5rem', color: 'var(--primary)', cursor: 'pointer' }}
                        title={tx.hash}
                        onClick={(e) => { e.stopPropagation(); window.open(tx.explorerUrl, '_blank'); }}>
                      {truncateHash(tx.hash)}
                    </td>
                    <td data-label="Target" style={{ padding: '1.25rem 1.5rem', color: 'var(--text-secondary)' }}>{tx.contract}</td>
                    <td data-label="Block Height" style={{ padding: '1.25rem 1.5rem' }}>{tx.blockHeight}</td>
                    <td data-label="Timestamp" style={{ padding: '1.25rem 1.5rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)' }}>{formatTime(tx.timestamp)}</td>
                    <td data-label="Explorer" style={{ padding: '1.25rem 1.5rem' }}>
                      <a
                        href={tx.explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--primary)', fontSize: '0.85rem', textDecoration: 'none' }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        View <ExternalLink size={14} />
                      </a>
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
              className="enterprise-card"
              style={{ padding: '1.5rem', height: 'fit-content', position: 'sticky', top: '100px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Transaction Details
                </h3>
                <button 
                  onClick={() => setSelectedTx(null)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ 
                  padding: '0.75rem', 
                  background: 'var(--bg-surface)', 
                  borderRadius: '6px',
                  border: `1px solid ${typeColor(selectedTx.type)}33`
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: typeColor(selectedTx.type) }} />
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selectedTx.type}</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{selectedTx.action}</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>Transaction Hash</div>
                  <div style={{ 
                    fontFamily: 'monospace', 
                    fontSize: '0.8rem', 
                    color: 'var(--primary)',
                    wordBreak: 'break-all',
                    background: 'var(--bg-surface)',
                    padding: '0.5rem',
                    borderRadius: '4px'
                  }}>
                    {selectedTx.hash}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Target</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{selectedTx.contract}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Block</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{selectedTx.blockHeight}</div>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Timestamp</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                    {new Date(selectedTx.timestamp).toLocaleString()}
                  </div>
                </div>

                {selectedTx.metadata && Object.keys(selectedTx.metadata).length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '0.5rem' }}>Metadata</div>
                    <div style={{ 
                      background: 'var(--bg-surface)', 
                      borderRadius: '4px', 
                      padding: '0.75rem',
                      fontSize: '0.8rem',
                      fontFamily: 'monospace',
                      color: 'var(--text-secondary)',
                      maxHeight: '150px',
                      overflowY: 'auto'
                    }}>
                      {JSON.stringify(selectedTx.metadata, null, 2)}
                    </div>
                  </div>
                )}

                <a
                  href={selectedTx.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem',
                    background: 'var(--primary)',
                    color: 'white',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    textDecoration: 'none'
                  }}
                >
                  View on Explorer <ExternalLink size={14} />
                </a>
              </div>
            </motion.div>
          )}
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
};
