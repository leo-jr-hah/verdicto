import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Play, Activity, Clock } from 'lucide-react';
import { fetchTransactions, type TransactionEntry } from '../services/api';

export const DashboardView: React.FC = () => {
  const [transactions, setTransactions] = useState<TransactionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const txs = await fetchTransactions();
      setTransactions(txs.slice(0, 5)); // Just get latest 5 for the dashboard
      setLoading(false);
    };
    load();
    const interval = setInterval(load, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    const diffSec = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (diffSec < 60) return `${diffSec}s ago`;
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    return `${Math.floor(diffSec / 3600)}h ago`;
  };

  return (
    <div className="container" style={{ padding: '3rem 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Welcome back. Here's what's happening.</h2>
          <p style={{ color: 'var(--text-secondary)' }}>System overview and recent network activity.</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
        <Link to="/deliberation" className="enterprise-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', textDecoration: 'none', background: 'var(--primary)', color: 'white', border: 'none' }}>
          <div style={{ background: 'rgba(255,255,255,0.2)', padding: '0.75rem', borderRadius: '8px' }}>
            <Play size={24} />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>Start New Case</div>
            <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>Launch a demo dispute</div>
          </div>
        </Link>
        <Link to="/deliberation" className="enterprise-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', textDecoration: 'none', background: 'var(--bg-surface)' }}>
          <div style={{ background: 'var(--bg-surface-alt)', padding: '0.75rem', borderRadius: '8px', color: 'var(--text-secondary)' }}>
            <Activity size={24} />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '1.1rem', color: 'var(--text-primary)' }}>Watch Live Session</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Observe current deliberations</div>
          </div>
        </Link>
        <Link to="/reputation" className="enterprise-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', textDecoration: 'none', background: 'var(--bg-surface)' }}>
          <div style={{ background: 'var(--bg-surface-alt)', padding: '0.75rem', borderRadius: '8px', color: 'var(--text-secondary)' }}>
            <Users size={24} />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '1.1rem', color: 'var(--text-primary)' }}>View Agent Health</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Check network participation</div>
          </div>
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
        {/* Recent Activity */}
        <div className="enterprise-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)' }}>Recent Activity</h3>
            <Link to="/transactions" style={{ fontSize: '0.85rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>View All Activity →</Link>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {loading && [1, 2, 3].map(i => (
              <div key={i} style={{ height: '48px', background: 'var(--bg-surface-alt)', borderRadius: '6px', animation: 'pulse 1.5s infinite ease-in-out', opacity: 0.6 }} />
            ))}
            
            {!loading && transactions.length === 0 && (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-tertiary)' }}>
                <Clock size={24} style={{ margin: '0 auto 1rem' }} />
                No recent activity. Start a new case to see events.
              </div>
            )}
            
            {!loading && transactions.map(tx => (
              <div key={tx.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg-surface)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)' }} />
                  <div>
                    <div style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{tx.action}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{tx.type} • {tx.contract}</div>
                  </div>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>
                  {formatTime(tx.timestamp)}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Network Health */}
        <div className="enterprise-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>Network Health</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flexGrow: 1 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Agent Availability</span>
                <span style={{ color: '#10B981', fontWeight: 600 }}>5/5 Online</span>
              </div>
              <div style={{ height: '6px', background: 'var(--bg-surface-alt)', borderRadius: '3px', width: '100%', overflow: 'hidden' }}>
                <div style={{ height: '100%', background: '#10B981', width: '100%' }}></div>
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>RPC Node Connection</span>
                <span style={{ color: '#10B981', fontWeight: 600 }}>Connected</span>
              </div>
              <div style={{ height: '6px', background: 'var(--bg-surface-alt)', borderRadius: '3px', width: '100%', overflow: 'hidden' }}>
                <div style={{ height: '100%', background: '#10B981', width: '100%' }}></div>
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>API Data Sources (RentCast, FRED)</span>
                <span style={{ color: '#10B981', fontWeight: 600 }}>Active</span>
              </div>
              <div style={{ height: '6px', background: 'var(--bg-surface-alt)', borderRadius: '3px', width: '100%', overflow: 'hidden' }}>
                <div style={{ height: '100%', background: '#10B981', width: '100%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Agent Performance (Sparkline Placeholders) */}
      <div className="enterprise-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)' }}>Agent Performance This Week</h3>
          <Link to="/reputation" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textDecoration: 'none' }}>Detailed View →</Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem' }}>
          {['Market Analyst', 'Income Analyst', 'Evidence Reviewer', 'Trend Analyst', 'Case Researcher'].map((agent, i) => (
            <div key={i} style={{ padding: '1rem', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>{agent}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10B981', marginBottom: '0.5rem' }}>{100 - (i*2)}%</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Consensus Rate</div>
              {/* Fake Sparkline */}
              <svg viewBox="0 0 100 20" style={{ width: '100%', height: '30px', marginTop: '0.5rem' }}>
                <polyline points="0,15 20,10 40,12 60,5 80,8 100,2" fill="none" stroke="#10B981" strokeWidth="2" />
              </svg>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
