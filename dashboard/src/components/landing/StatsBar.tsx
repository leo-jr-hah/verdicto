import React from 'react';
import { Reveal } from './UIComponents';

const METRICS = [
  { label: 'Multi-Agent Consensus', detail: 'Three independent AI analysts reach agreement' },
  { label: 'Sub-Minute Analysis', detail: 'Full asset valuation in under a minute' },
  { label: 'Fully On-Chain', detail: 'Verifiable receipts stored on Casper' },
  { label: 'Composable Primitives', detail: 'Assessments power Borrow, Insure & Predict' },
];

export const StatsBar: React.FC = () => {
  return (
    <section className="stats-bar">
      <div className="stats-bar__grid">
        {METRICS.map((metric, i) => (
          <Reveal key={metric.label} delay={i * 0.1}>
            <div className="stats-bar__metric">
              <div className="stats-bar__label" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                {metric.label}
              </div>
              <div className="stats-bar__detail">
                {metric.detail}
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
};
