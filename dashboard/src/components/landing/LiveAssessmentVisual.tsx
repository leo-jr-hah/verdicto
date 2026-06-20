import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Globe, Activity, CheckCircle2 } from 'lucide-react';

export const LiveAssessmentVisual: React.FC = () => {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 800),
      setTimeout(() => setPhase(2), 2000),
      setTimeout(() => setPhase(3), 3500),
      setTimeout(() => setPhase(4), 5000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: 520, margin: '0 auto' }}>
      {/* Asset card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-color)',
          borderRadius: 16,
          padding: '1.25rem 1.5rem',
          boxShadow: '0 20px 60px rgba(0,0,0,0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #3B82F6 0%, #06B6D4 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Globe size={16} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Miami Beachfront Condo
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
              Real Estate · 2 bed / 2 bath · 1,450 sqft
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Asking Price</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-display)', letterSpacing: '-0.03em' }}>
              $1,250,000
            </div>
          </div>
          <motion.div
            animate={{ opacity: phase >= 1 ? 1 : 0 }}
            style={{
              fontSize: '0.65rem', fontWeight: 700,
              color: '#10B981', background: 'rgba(16,185,129,0.1)',
              padding: '0.25rem 0.6rem', borderRadius: 6,
              display: 'flex', alignItems: 'center', gap: '0.3rem',
            }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              <Activity size={10} />
            </motion.div>
            Analyzing
          </motion.div>
        </div>
      </motion.div>

      {/* Agent analysis cards, appear one by one */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.75rem' }}>
        {[
          { label: 'Comparable Sales', value: '$1,280,000', confidence: 87, color: '#F59E0B', delay: 1.2 },
          { label: 'DCF Analysis', value: '$1,195,000', confidence: 74, color: '#10B981', delay: 1.6 },
          { label: 'Market Context', value: '↑ Trending', confidence: 91, color: '#06B6D4', delay: 2.0 },
          { label: 'Data Validation', value: '3 Sources ✓', confidence: 95, color: '#3B82F6', delay: 2.4 },
        ].map((item) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={phase >= 2 ? { opacity: 1, scale: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: item.delay - 1.2, ease: [0.16, 1, 0.3, 1] }}
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-color)',
              borderRadius: 12,
              padding: '0.875rem',
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            }}
          >
            <div style={{ fontSize: '0.6rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>
              {item.label}
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: item.color, fontFamily: 'var(--font-mono)' }}>
              {item.value}
            </div>
            <div style={{ marginTop: '0.4rem', height: 3, background: 'var(--bg-surface)', borderRadius: 2, overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={phase >= 2 ? { width: `${item.confidence}%` } : {}}
                transition={{ duration: 1, delay: item.delay - 0.5, ease: 'easeOut' }}
                style={{ height: '100%', background: item.color, borderRadius: 2 }}
              />
            </div>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)', marginTop: '0.2rem' }}>
              {item.confidence}% confidence
            </div>
          </motion.div>
        ))}
      </div>

      {/* Final verdict */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={phase >= 4 ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{
          marginTop: '0.75rem',
          padding: '1rem 1.25rem',
          background: 'rgba(16, 185, 129, 0.06)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          borderRadius: 14,
          display: 'flex', alignItems: 'center', gap: '0.75rem',
        }}
      >
        <CheckCircle2 size={18} color="#10B981" />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#10B981', letterSpacing: '0.04em' }}>
            ASSESSMENT COMPLETE
          </div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', marginTop: '0.1rem' }}>
            Fair Value: <strong style={{ color: 'var(--text-primary)' }}>$1,240,000</strong> · 87% consensus · Recorded on Casper
          </div>
        </div>
        <div style={{
          fontSize: '0.6rem', fontFamily: 'var(--font-mono)', color: '#10B981',
          background: 'rgba(16,185,129,0.1)', padding: '0.2rem 0.5rem', borderRadius: 4,
        }}>
          0x3bc2…89b7
        </div>
      </motion.div>
    </div>
  );
};
