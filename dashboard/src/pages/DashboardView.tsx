import React from 'react';
import { Users, FileText, BarChart3, Server } from 'lucide-react';

export const DashboardView: React.FC = () => {
  const metrics = [
    { title: 'Total Value Assessed', value: '$14.2M', change: '+12%', icon: BarChart3 },
    { title: 'Active Agents', value: '12', change: 'Stable', icon: Users },
    { title: 'Disputes Resolved', value: '1,429', change: '+34', icon: FileText },
    { title: 'Network Uptime', value: '99.99%', change: 'Casper Testnet', icon: Server },
  ];

  return (
    <div className="container" style={{ padding: '3rem 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>System Overview</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Aggregated metrics across the Verdict network.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
        {metrics.map((m, i) => (
          <div key={i} className="enterprise-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div style={{ padding: '0.5rem', background: 'var(--bg-surface-alt)', borderRadius: '6px', color: 'var(--text-secondary)' }}>
                <m.icon size={20} />
              </div>
              <span style={{ fontSize: '0.85rem', color: m.change.includes('+') ? '#10B981' : 'var(--text-tertiary)', fontWeight: 500 }}>{m.change}</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.25rem' }}>{m.value}</div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{m.title}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        <div className="enterprise-card">
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>Recent Disputes</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
                <th style={{ padding: '1rem 0', fontWeight: 500 }}>ID</th>
                <th style={{ padding: '1rem 0', fontWeight: 500 }}>Asset Type</th>
                <th style={{ padding: '1rem 0', fontWeight: 500 }}>Value</th>
                <th style={{ padding: '1rem 0', fontWeight: 500 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                { id: 'DSP-8892', type: 'Commercial Real Estate', val: '$2.4M', status: 'Settled' },
                { id: 'DSP-8891', type: 'Tokenized Treasury', val: '$500K', status: 'Settled' },
                { id: 'DSP-8890', type: 'Industrial Parking', val: '$1.2M', status: 'Settled' },
              ].map((d, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem 0', fontWeight: 500 }}>{d.id}</td>
                  <td style={{ padding: '1rem 0', color: 'var(--text-secondary)' }}>{d.type}</td>
                  <td style={{ padding: '1rem 0' }}>{d.val}</td>
                  <td style={{ padding: '1rem 0' }}><span className="badge badge-neutral">{d.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="enterprise-card">
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>System Health</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>RPC Node Connection</span>
                <span style={{ color: '#10B981', fontWeight: 600 }}>Healthy</span>
              </div>
              <div style={{ height: '4px', background: '#10B981', borderRadius: '2px', width: '100%' }}></div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Agent Orchestrator</span>
                <span style={{ color: '#10B981', fontWeight: 600 }}>Online</span>
              </div>
              <div style={{ height: '4px', background: '#10B981', borderRadius: '2px', width: '100%' }}></div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Odra Contract State</span>
                <span style={{ color: '#10B981', fontWeight: 600 }}>Synced</span>
              </div>
              <div style={{ height: '4px', background: '#10B981', borderRadius: '2px', width: '100%' }}></div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>RentCast API (Comps)</span>
                <span style={{ color: '#10B981', fontWeight: 600 }}>Active</span>
              </div>
              <div style={{ height: '4px', background: '#10B981', borderRadius: '2px', width: '100%' }}></div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>FRED API (Mortgage Rates)</span>
                <span style={{ color: '#10B981', fontWeight: 600 }}>Active</span>
              </div>
              <div style={{ height: '4px', background: '#10B981', borderRadius: '2px', width: '100%' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
