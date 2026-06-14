import React from 'react';

export const DisputesView: React.FC = () => {
  return (
    <div className="container" style={{ padding: '3rem 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Active Disputes</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Comprehensive ledger of all RWA valuation conflicts.</p>
        </div>
        <button className="btn-primary">File New Dispute</button>
      </div>

      <div className="enterprise-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-tertiary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Dispute ID</th>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Asset Class</th>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Date Filed</th>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Valuation Range</th>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {[
              { id: 'DSP-8893', type: 'Commercial Real Estate', date: 'Oct 24, 2023', val: '$2.1M - $2.4M', status: 'Deliberating' },
              { id: 'DSP-8892', type: 'Industrial Parking Facility', date: 'Oct 23, 2023', val: '$1.2M - $1.3M', status: 'Settled' },
              { id: 'DSP-8891', type: 'Tokenized Treasury Bond', date: 'Oct 21, 2023', val: '$500K - $505K', status: 'Settled' },
              { id: 'DSP-8890', type: 'Residential Portfolio', date: 'Oct 19, 2023', val: '$4.5M - $4.8M', status: 'Settled' },
              { id: 'DSP-8889', type: 'Commercial Real Estate', date: 'Oct 15, 2023', val: '$1.1M - $1.4M', status: 'Settled' },
            ].map((d, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '1.25rem 1.5rem', fontWeight: 500 }}>{d.id}</td>
                <td style={{ padding: '1.25rem 1.5rem', color: 'var(--text-secondary)' }}>{d.type}</td>
                <td style={{ padding: '1.25rem 1.5rem', color: 'var(--text-secondary)' }}>{d.date}</td>
                <td style={{ padding: '1.25rem 1.5rem' }}>{d.val}</td>
                <td style={{ padding: '1.25rem 1.5rem' }}>
                  <span className={`badge ${d.status === 'Deliberating' ? 'badge-active' : 'badge-neutral'}`}>
                    {d.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
