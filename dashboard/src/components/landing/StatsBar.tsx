import React from 'react';
import { AnimatedNumber, Reveal } from './UIComponents';

const STATS = [
  { value: 5, label: 'AI Agents', suffix: '' },
  { value: 60, label: 'Seconds per Assessment', suffix: 's' },
  { value: 4, label: 'Products', suffix: '' },
  { value: 100, label: 'On-Chain Verification', suffix: '%' },
];

export const StatsBar: React.FC = () => {
  return (
    <section className="stats-bar">
      <div className="stats-bar__grid">
        {STATS.map((stat, i) => (
          <Reveal key={stat.label} delay={i * 0.1}>
            <div>
              <div className="stats-bar__value" style={{ color: 'var(--text-primary)' }}>
                <AnimatedNumber value={stat.value} suffix={stat.suffix} />
              </div>
              <div className="stats-bar__label">
                {stat.label}
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
};
