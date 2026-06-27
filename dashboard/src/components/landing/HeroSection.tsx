import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronDown } from 'lucide-react';

/* ── Flip Button - color inverts on hover (red↔white) ────────────── */
const FlipButton: React.FC<{
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  to?: string;
  variant?: 'primary' | 'secondary';
}> = ({ children, className = '', style, onClick, to, variant = 'primary' }) => {
  const [isHovered, setIsHovered] = useState(false);
  const btnRef = useRef<HTMLButtonElement & HTMLAnchorElement>(null);

  const isPrimary = variant === 'primary';

  const normalStyle: React.CSSProperties = isPrimary
    ? { background: 'var(--accent)', color: 'var(--text-inverse)', border: '2px solid var(--accent)' }
    : { background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '2px solid var(--border)' };

  const hoveredStyle: React.CSSProperties = isPrimary
    ? { background: 'var(--text-inverse)', color: 'var(--accent)', border: '2px solid var(--accent)', boxShadow: '0 0 24px var(--accent-glow)' }
    : { background: 'var(--accent)', color: '#FFFFFF', border: '2px solid var(--accent)', boxShadow: '0 0 24px var(--accent-glow)' };

  const Tag = to ? Link : 'button';
  const tagProps = to ? { to } : { onClick };

  return (
    // @ts-expect-error polymorphic tag
    <Tag
      ref={btnRef}
      {...tagProps}
      className={className}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        ...style,
        ...(isHovered ? hoveredStyle : normalStyle),
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        transform: isHovered ? 'translateY(-2px) scale(1.03)' : 'translateY(0) scale(1)',
        cursor: 'pointer',
      }}
    >
      {children}
    </Tag>
  );
};

/* ── Hero Section ─────────────────────────────────────────────────── */
export const HeroSection: React.FC = () => {
  return (
    <section className="hero-section">
      <div className="hero-headline-wrapper">
        {/* Eyebrow badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="landing-badge landing-badge--red"
        >
          <motion.div
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }}
          />
          <span>Live on Casper Testnet</span>
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
            margin: '0 0 1.5rem',
          }}
        >
          The On-Chain Oracle{' '}
          <span style={{ color: 'var(--accent)' }}>for Real-World Assets</span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="text-lg"
          style={{
            color: 'var(--text-secondary)',
            lineHeight: 1.65,
            maxWidth: 560,
            margin: '0 0 2.5rem',
          }}
        >
          Multi-agent AI consensus valuations, stored on-chain as a composable
          primitive. Verdicto powers its own Borrow and Insure products using the same data.
          Any Casper dApp can query the Oracle directly.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex gap-4"
          style={{ flexWrap: 'wrap', marginBottom: '2rem', pointerEvents: 'auto' }}
        >
          <FlipButton to="/oracle" variant="primary" className="btn btn-primary btn-lg">
            Explore the Oracle <ArrowRight size={16} />
          </FlipButton>
          <FlipButton to="/assess" variant="secondary" className="btn btn-lg">
            Value an Asset <ArrowRight size={16} />
          </FlipButton>
          <FlipButton
            variant="secondary"
            className="btn btn-lg"
            onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
          >
            How It Works
          </FlipButton>
        </motion.div>

        {/* Social Proof Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="hero-proof-bar"
        >
          <span className="hero-proof-bar__item">
            <span className="hero-proof-bar__dot" />
            Live on Casper Testnet
          </span>
          <span>·</span>
          <span>Multi-Agent AI Consensus</span>
          <span>·</span>
          <span>On-Chain Verifiable</span>
        </motion.div>

        {/* Scroll cue */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          style={{ position: 'relative', marginTop: '2rem' }}
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ChevronDown size={20} style={{ color: 'var(--text-tertiary)' }} />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
