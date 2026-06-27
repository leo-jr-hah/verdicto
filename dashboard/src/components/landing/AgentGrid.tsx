import React from 'react';
import { AgentCard, AGENTS } from './AgentCard';
import { Reveal } from './UIComponents';
import { GradientOrb } from './Backgrounds';

export const AgentGrid: React.FC = () => {
  return (
    <section id="agents" className="landing-section" style={{ borderTop: '1px solid var(--border)', position: 'relative' }}>
      <GradientOrb color1="rgba(6,182,212,0.06)" color2="rgba(59,130,246,0.04)" size={400} x="15%" y="40%" delay={2} />

      <div className="landing-section__container" style={{ position: 'relative', zIndex: 1 }}>
        <Reveal>
          <div className="landing-section__header">
            <div className="landing-badge landing-badge--cyan">
              <span>The Agents</span>
            </div>
            <h2 className="landing-section__title">
              Two valuations. Three jurors.<br />
              <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Every analysis formed independently.</span>
            </h2>
            <p className="landing-section__subtitle">
              Two valuation agents produce independent estimates using different methodologies.
              Three specialized jurors then evaluate which is more credible, weighted by on-chain trust scores.
            </p>
          </div>
        </Reveal>

        {/* Single 5-column grid */}
        <div className="agent-grid">
          {AGENTS.map((agent, i) => (
            <AgentCard key={agent.name} agent={agent} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
};
