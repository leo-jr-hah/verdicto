import React from 'react';
import { AnimatedNumber, Reveal } from './UIComponents';

const STATS = [
  { value: 5, label: 'AI Analysts', suffix: '', color: '#3B82F6' },
  { value: 60, label: 'Second Assessment', suffix: 's', color: '#10B981' },
  { value: 3, label: 'Asset Classes', suffix: '', color: '#8B5CF6' },
  { value: 100, label: 'On-Chain Record', suffix: '%', color: '#FF3B3B' },
];

export const StatsBar: React.FC = () => {
  return (
    <section id="stats" style={{
      borderTop: '1px solid var(--border-color)',
      borderBottom: '1px solid var(--border-color)',
      padding: '2.5rem 2rem',
      background: 'var(--bg-surface)',
    }}>
      <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1.5rem', textAlign: 'center' }}>
        {STATS.map((stat, i) => (
          <Reveal key={stat.label} delay={i * 0.1}>
            <div>
              <div style={{
                fontSize: '2.5rem', fontWeight: 800, color: stat.color,
                fontFamily: 'var(--font-display)', letterSpacing: '-0.04em', lineHeight: 1,
              }}>
                <AnimatedNumber value={stat.value} suffix={stat.suffix} />
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: '0.4rem', fontWeight: 500 }}>
                {stat.label}
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
};
