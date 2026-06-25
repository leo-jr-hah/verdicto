import React from 'react';
import { AnimatedNumber, Reveal } from './UIComponents';

const STATS = [
  { value: 5, label: 'AI Analysts', suffix: '', color: '#3B82F6' },
  { value: 60, label: 'Seconds per Assessment', suffix: 's', color: '#10B981' },
  { value: 3, label: 'Asset Classes', suffix: '', color: '#8B5CF6' },
  { value: 100, label: 'On-Chain Verification', suffix: '%', color: '#FF3B3B' },
];

export const StatsBar: React.FC = () => {
  return (
    <section className="stats-bar">
      <div className="stats-bar__grid">
        {STATS.map((stat, i) => (
          <Reveal key={stat.label} delay={i * 0.1}>
            <div>
              <div className="stats-bar__value" style={{ color: stat.color }}>
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
