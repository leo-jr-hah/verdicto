import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronDown } from 'lucide-react';

/* ── Rotating Words ─────────────────────────────────────────────────── */
const ROTATING_WORDS = [
  'Real Estate',
  'Fine Art',
  'Commodities',
  'IP & Patents',
  'Collectibles',
  'Tokenized Equity',
  'Carbon Credits',
  'Private Credit',
];

const RotatingWord: React.FC = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % ROTATING_WORDS.length);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className="hero-rotating-word">
      <AnimatePresence mode="wait">
        <motion.span
          key={ROTATING_WORDS[index]}
          initial={{ y: 12, opacity: 0, filter: 'blur(4px)' }}
          animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
          exit={{ y: -12, opacity: 0, filter: 'blur(4px)' }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          style={{ display: 'inline-block' }}
        >
          {ROTATING_WORDS[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
};

/* ── Grid Background ────────────────────────────────────────────────── */
const GridBackground: React.FC = () => (
  <div className="hero-grid-bg" aria-hidden="true">
    <div className="hero-grid-lines" />
    <div className="hero-grid-glow" />
  </div>
);

/* ── Typewriter Subheadline ──────────────────────────────────────────── */
const TypewriterText: React.FC<{ text: string; delay?: number }> = ({ text, delay = 0 }) => {
  const [displayed, setDisplayed] = useState('');
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    let i = 0;
    const interval = setInterval(() => {
      setDisplayed(text.slice(0, i + 1));
      i++;
      if (i >= text.length) clearInterval(interval);
    }, 18);
    return () => clearInterval(interval);
  }, [started, text]);

  return (
    <span className="hero-typewriter">
      {displayed}
      {started && displayed.length < text.length && <span className="hero-cursor">|</span>}
    </span>
  );
};

/* ── Flip Button ────────────────────────────────────────────────────── */
const FlipButton: React.FC<{
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  to?: string;
  variant?: 'primary' | 'secondary';
}> = ({ children, className = '', style, onClick, to, variant = 'primary' }) => {
  const [isHovered, setIsHovered] = useState(false);

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

/* ── Hero Section ───────────────────────────────────────────────────── */
export const HeroSection: React.FC = () => {
  return (
    <section className="hero-section">
      <GridBackground />

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

        {/* Main Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="hero-headline"
        >
          The Oracle for{' '}
          <RotatingWord />
        </motion.h1>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="hero-tagline"
        >
          <TypewriterText
            text="Multi-agent AI consensus valuations, stored on-chain as a composable primitive. Assess, Borrow, Insure — powered by verifiable AI."
            delay={600}
          />
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="hero-cta-row"
        >
          <FlipButton to="/oracle" variant="primary" className="btn btn-primary btn-lg">
            Explore the Oracle <ArrowRight size={16} />
          </FlipButton>
          <FlipButton to="/assess" variant="secondary" className="btn btn-lg">
            Value an Asset <ArrowRight size={16} />
          </FlipButton>
        </motion.div>

        {/* Scroll cue */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8 }}
          className="hero-scroll-cue"
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
