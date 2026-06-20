import React from 'react';
import { AgentCard, AGENTS } from './AgentCard';
import { Reveal } from './UIComponents';
import { GradientOrb } from './Backgrounds';

export const AgentGrid: React.FC = () => {
  return (
    <section id="agents" style={{ padding: '8rem 2rem', borderTop: '1px solid var(--border-color)', position: 'relative' }}>
      <GradientOrb color1="rgba(6,182,212,0.06)" color2="rgba(59,130,246,0.04)" size={400} x="15%" y="40%" delay={2} />

      <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <Reveal>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <div className="badge" style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              background: 'rgba(6, 182, 212, 0.06)',
              border: '1px solid rgba(6, 182, 212, 0.15)',
              marginBottom: '1.5rem',
            }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#06B6D4', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                The Agents
              </span>
            </div>
            <h2 style={{
              fontSize: 'clamp(1.8rem, 4vw, 3rem)',
              fontWeight: 800, lineHeight: 1.1,
              letterSpacing: '-0.03em',
              color: 'var(--text-primary)',
              marginBottom: '1rem',
            }}>
              Two valuations. Three jurors.<br />
              <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Every analysis formed independently.</span>
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: 560, margin: '0 auto', lineHeight: 1.7 }}>
              Two valuation agents produce independent estimates using different methodologies.
              Three specialized jurors then evaluate which is more credible, weighted by on-chain trust scores.
            </p>
          </div>
        </Reveal>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {AGENTS.map((agent, i) => (
            <AgentCard key={agent.name} agent={agent} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
};
