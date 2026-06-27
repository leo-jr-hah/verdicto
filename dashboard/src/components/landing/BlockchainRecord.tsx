import React, { useRef } from 'react';
import { motion, useInView } from 'motion/react';

export const BlockchainRecord: React.FC = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const hashParts = ['3bc286c4', '20a5fcb4', 'e71adcca', '6472573d', 'ab89b77e'];

  return (
    <div ref={ref} style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-color)',
      borderRadius: 16,
      padding: '2rem',
      fontFamily: 'var(--font-mono)',
      maxWidth: 520,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--text-tertiary)' }}
        />
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Casper Testnet, Block Confirmed
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {[
          { label: 'Assessment ID', value: '#ASM-3847' },
          { label: 'Asset', value: 'Miami Beachfront Condo' },
          { label: 'Fair Value', value: '$1,240,000' },
          { label: 'Consensus', value: '87.3% Weighted' },
        ].map((row, i) => (
          <motion.div
            key={row.label}
            initial={{ opacity: 0, x: -20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '0.5rem 0.75rem',
              background: 'var(--bg-main)',
              borderRadius: 8,
              border: '1px solid var(--border-color-subtle, var(--border-color))',
            }}
          >
            <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-sans)' }}>{row.label}</span>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>{row.value}</span>
          </motion.div>
        ))}

        {/* Hash */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.8 }}
          style={{
            padding: '0.75rem',
            background: 'var(--success-soft)',
            border: '1px solid rgba(16,185,129,0.2)',
            borderRadius: 8,
          }}
        >
          <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem', fontFamily: 'var(--font-sans)' }}>
            Transaction Hash
          </div>
          <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
            {hashParts.map((part, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0 }}
                animate={inView ? { opacity: 1 } : {}}
                transition={{ duration: 0.3, delay: 0.9 + i * 0.1 }}
                style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}
              >
                {part}
              </motion.span>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};
