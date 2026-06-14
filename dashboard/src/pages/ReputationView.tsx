import React from 'react';
import { Shield } from 'lucide-react';

export const ReputationView: React.FC = () => {
  return (
    <div className="container" style={{ padding: '3rem 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Agent Reputation Registry</h2>
          <p style={{ color: 'var(--text-secondary)' }}>On-chain reliability metrics governing agent selection probability.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', marginBottom: '3rem' }}>
        <div className="enterprise-card" style={{ background: 'var(--text-primary)', color: 'white' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Top Performing Juror</div>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Evidence Analyst</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
            <Shield size={16} /> 98/100 Trust Score
          </div>
        </div>
        <div className="enterprise-card">
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Slashing Events</div>
          <h3 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>0</h3>
          <div style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>Network behaves honestly</div>
        </div>
        <div className="enterprise-card">
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Avg Resolution Time</div>
          <h3 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>14s</h3>
          <div style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>Block finality</div>
        </div>
      </div>

      <div className="enterprise-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-tertiary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Agent Identity</th>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Role</th>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>IETF Tier</th>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Exec Determinism</th>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>IETF Trust Score</th>
            </tr>
          </thead>
          <tbody>
            {[
              { id: 'Evidence Analyst', role: 'Juror (LLM)', tier: 'Platinum', det: '99%', rep: 980 },
              { id: 'Precedent Researcher', role: 'Juror (LLM+RAG)', tier: 'Platinum', det: '96%', rep: 965 },
              { id: 'Market Data Interpreter', role: 'Juror (LLM)', tier: 'Platinum', det: '95%', rep: 950 },
              { id: 'Comps Specialist', role: 'Valuation', tier: 'Gold', det: '98%', rep: 890 },
              { id: 'DCF Specialist', role: 'Valuation', tier: 'Gold', det: '99%', rep: 885 },
            ].map((a, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '1.25rem 1.5rem', fontWeight: 500 }}>{a.id}</td>
                <td style={{ padding: '1.25rem 1.5rem', color: 'var(--text-secondary)' }}>{a.role}</td>
                <td style={{ padding: '1.25rem 1.5rem' }}>
                  <span style={{ padding: '4px 8px', background: a.tier === 'Platinum' ? 'rgba(229, 231, 235, 0.1)' : 'rgba(252, 211, 77, 0.1)', color: a.tier === 'Platinum' ? '#E5E7EB' : '#FCD34D', borderRadius: '4px', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>{a.tier}</span>
                </td>
                <td style={{ padding: '1.25rem 1.5rem', color: 'var(--text-secondary)' }}>{a.det}</td>
                <td style={{ padding: '1.25rem 1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '100px', height: '6px', background: 'var(--bg-surface-alt)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${(a.rep / 1000) * 100}%`, height: '100%', background: 'var(--primary)' }}></div>
                    </div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{a.rep}/1000</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
