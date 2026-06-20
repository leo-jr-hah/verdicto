import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronDown } from 'lucide-react';

export const HeroSection: React.FC = () => {
  return (
    <section style={{
      minHeight: '100vh',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '6rem 2rem 4rem',
      position: 'relative',
      textAlign: 'center',
    }}>
      {/* Eyebrow badge */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="badge"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
          background: 'var(--primary-bg)',
          border: '1px solid rgba(255, 59, 59, 0.15)',
          padding: '0.375rem 1rem',
          marginBottom: '2rem',
        }}
      >
        <motion.div
          animate={{ opacity: [1, 0.4, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--primary)' }}
        />
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Live on Casper Testnet
        </span>
      </motion.div>

      {/* Headline */}
      <motion.h1
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        style={{
          fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
          fontWeight: 800, lineHeight: 1.08,
          letterSpacing: '-0.04em',
          color: 'var(--text-primary)',
          maxWidth: 800,
          margin: '0 auto 1.5rem',
          fontFamily: 'var(--font-display)',
        }}
      >
        AI-Powered Asset{' '}
        <span style={{ color: 'var(--primary)' }}>Assessment</span>{' '}
        on Chain
      </motion.h1>

      {/* Subheadline */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.25 }}
        style={{
          fontSize: '1.15rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.65,
          maxWidth: 560,
          margin: '0 auto 2.5rem',
        }}
      >
        Two valuation agents and three specialized jurors analyze real market data,
        cross-validate methodologies, and deliver a trust-weighted verdict,
        cryptographically recorded on the Casper blockchain in 60 seconds.
      </motion.p>

      {/* CTAs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '4rem' }}
      >
        <Link to="/assess" className="btn btn-primary" style={{ padding: '0.875rem 1.75rem', fontSize: '0.95rem' }}>
          Value an Asset <ArrowRight size={16} />
        </Link>
        <button
          onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
          className="btn"
          style={{ padding: '0.875rem 1.75rem', fontSize: '0.95rem', background: 'var(--bg-elevated)' }}
        >
          How It Works
        </button>
      </motion.div>

      {/* Scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        style={{ position: 'absolute', bottom: '2rem', left: '50%', transform: 'translateX(-50%)' }}
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          style={{ color: 'var(--text-tertiary)', cursor: 'pointer' }}
          onClick={() => document.getElementById('stats')?.scrollIntoView({ behavior: 'smooth' })}
        >
          <ChevronDown size={22} />
        </motion.div>
      </motion.div>
    </section>
  );
};
