import React from 'react';
import { Reveal } from './UIComponents';

const METRICS = [
  { label: 'HMAC Receipt Chains', detail: 'Every AI deliberation step cryptographically signed — tamper-proof audit trail' },
  { label: 'ZK-Lite Commitments', detail: 'Execution proofs anchored to Casper L1 — verify the agents ran correctly' },
  { label: 'Multi-Agent Adversarial', detail: '2 analysts + 3 jurors with peer review — no single point of failure' },
  { label: 'x402 Micropayments', detail: 'Pay-per-use with wallet-signed CSPR transfers — no accounts, no API keys' },
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
