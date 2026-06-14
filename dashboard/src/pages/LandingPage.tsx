import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Calculator, Users, CheckSquare, Award, Shield } from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div style={{ paddingBottom: '4rem' }}>
      {/* Section 1 - Hero */}
      <section className="container" style={{ paddingTop: '8rem', paddingBottom: '6rem', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-surface)', padding: '0.5rem 1rem', borderRadius: '999px', marginBottom: '2rem', border: '1px solid var(--border-color)' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--primary)', display: 'inline-block' }}></span>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Casper Testnet Live</span>
        </div>
        <h1 style={{ fontSize: '4.5rem', maxWidth: '900px', margin: '0 auto', lineHeight: 1.1, marginBottom: '1.5rem', letterSpacing: '-0.03em' }}>
          Agentic Trust Infrastructure<br />for Real World Assets
        </h1>
        <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', maxWidth: '650px', margin: '0 auto 3rem', lineHeight: 1.6 }}>
          Autonomous agents verify, evaluate, deliberate, and certify tokenized assets natively on the Casper Network.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Link to="/deliberation" className="btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>Launch Demo</Link>
          <Link to="/architecture" className="btn-secondary" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>View Architecture</Link>
        </div>

      </section>

      {/* Section 2 - Problem */}
      <section className="container" style={{ padding: '6rem 0', borderTop: '1px solid var(--border-color)' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>The Trust Bottleneck</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>Why autonomous agents cannot trust Real World Assets today.</p>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          <div className="enterprise-card" style={{ background: 'var(--bg-surface)' }}>
            <h3 style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--text-tertiary)' }}></div>
              Current State
            </h3>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <li style={{ padding: '1rem', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-secondary)' }}>Centralized Oracle Dependency</li>
              <li style={{ padding: '1rem', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-secondary)' }}>Opaque Valuation Methodologies</li>
              <li style={{ padding: '1rem', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-secondary)' }}>Manual Dispute Resolution</li>
            </ul>
          </div>
          <div className="enterprise-card" style={{ border: '1px solid var(--primary)' }}>
            <h3 style={{ color: 'var(--primary)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--primary)' }}></div>
              Casper RWA Court
            </h3>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <li style={{ padding: '1rem', background: 'rgba(255, 59, 59, 0.05)', border: '1px solid rgba(255, 59, 59, 0.2)', borderRadius: '6px', fontWeight: 500 }}>Multi-Agent Validation Swarms</li>
              <li style={{ padding: '1rem', background: 'rgba(255, 59, 59, 0.05)', border: '1px solid rgba(255, 59, 59, 0.2)', borderRadius: '6px', fontWeight: 500 }}>Transparent On-Chain Reasoning</li>
              <li style={{ padding: '1rem', background: 'rgba(255, 59, 59, 0.05)', border: '1px solid rgba(255, 59, 59, 0.2)', borderRadius: '6px', fontWeight: 500 }}>Autonomous Cryptoeconomic Settlement</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Section 3 - How It Works */}
      <section style={{ background: 'var(--text-primary)', color: 'white', padding: '6rem 0' }}>
        <div className="container">
          <h2 style={{ fontSize: '2.5rem', marginBottom: '4rem', textAlign: 'center' }}>Protocol Flow</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1.5rem' }}>
            {[
              { step: '01', title: 'Asset Submitted', icon: FileText },
              { step: '02', title: 'Agents Evaluate', icon: Calculator },
              { step: '03', title: 'Jurors Deliberate', icon: Users },
              { step: '04', title: 'Verdict Recorded', icon: CheckSquare },
              { step: '05', title: 'Reputation Updated', icon: Award }
            ].map((item, idx) => (
              <div key={idx} style={{ position: 'relative' }}>
                <div style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '1rem' }}>STEP {item.step}</div>
                <item.icon size={32} style={{ color: 'var(--primary)', marginBottom: '1.5rem' }} />
                <h4 style={{ fontSize: '1.1rem', fontWeight: 500 }}>{item.title}</h4>
                {idx < 4 && <div style={{ position: 'absolute', top: '3rem', right: '-1rem', width: '2rem', height: '1px', background: 'rgba(255,255,255,0.2)' }}></div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 4 - Agent Network */}
      <section className="container" style={{ padding: '6rem 0', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem' }}>
          <div>
            <h2 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Active Agents</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Live registry of autonomous participants.</p>
          </div>
          <Link to="/reputation" className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>View All Agents</Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
          {[
            { name: 'Comps Specialist', type: 'Valuation', rep: 98, status: 'Online' },
            { name: 'DCF Specialist', type: 'Valuation', rep: 95, status: 'Online' },
            { name: 'Evidence Analyst', type: 'Juror (LLM)', rep: 92, status: 'Deliberating' }
          ].map((agent, i) => (
            <div key={i} className="enterprise-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div className="badge badge-neutral">{agent.type}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: agent.status === 'Online' ? 'var(--text-secondary)' : 'var(--primary)' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: agent.status === 'Online' ? '#10B981' : 'var(--primary)' }}></span>
                  {agent.status}
                </div>
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{agent.name}</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                <Shield size={14} /> Reputation Score: {agent.rep}/100
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Combine remaining sections into clear CTA areas for brevity in Landing Page */}
      <section className="container" style={{ padding: '6rem 0', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2.5rem', marginBottom: '1.5rem' }}>Experience the Infrastructure</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto 3rem' }}>
          Explore the live deliberation courtroom, view on-chain settlement, or dive into the technical architecture.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Link to="/deliberation" className="btn-primary">View Live Deliberation</Link>
          <Link to="/transactions" className="btn-secondary">View On-Chain Ledger</Link>
        </div>
      </section>
    </div>
  );
};
