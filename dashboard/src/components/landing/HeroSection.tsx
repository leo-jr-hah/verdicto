import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'motion/react';
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

/* ── Text Scramble Effect (runs once on mount, under 800ms) ──────────── */
const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&';

const useScramble = (text: string, duration = 700, delay = 0) => {
  const [display, setDisplay] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const start = performance.now();
      const chars = text.split('');
      const revealed = new Array(chars.length).fill(false);

      const step = () => {
        const elapsed = performance.now() - start;
        const progress = Math.min(elapsed / duration, 1);
        const revealCount = Math.floor(progress * chars.length);

        for (let i = 0; i < revealCount; i++) revealed[i] = true;

        const result = chars.map((ch, i) => {
          if (ch === ' ') return ' ';
          if (revealed[i]) return ch;
          return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
        }).join('');

        setDisplay(result);

        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          setDisplay(text);
          setDone(true);
        }
      };
      requestAnimationFrame(step);
    }, delay);

    return () => clearTimeout(timeout);
  }, [text, duration, delay]);

  return { display, done };
};

/* ── Scramble Headline ──────────────────────────────────────────────── */
const ScrambleHeadline: React.FC = () => {
  const line1 = 'The Oracle for';
  const line2 = 'Tokenized Equity';
  const { display: d1, done: done1 } = useScramble(line1, 500, 200);
  const { display: d2, done: done2 } = useScramble(line2, 700, 400);

  return (
    <h1 className="hero-headline">
      {done1 ? line1 : d1}{' '}
      <span className="hero-rotating-word">
        {done2 ? (
          <RotatingWord />
        ) : (
          <span style={{ color: 'var(--accent-strong)' }}>{d2}</span>
        )}
      </span>
    </h1>
  );
};

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

/* ── Animated Count-Up (scroll-triggered, under 1s) ─────────────────── */
const AnimatedNumber: React.FC<{ value: number; suffix?: string; prefix?: string }> = ({
  value,
  suffix = '',
  prefix = '',
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const start = performance.now();
    const duration = 800;

    const step = () => {
      const elapsed = performance.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplay(Math.round(eased * value));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [isInView, value]);

  return (
    <span ref={ref}>
      {prefix}{display}{suffix}
    </span>
  );
};

/* ── Agent Terminal Panel ────────────────────────────────────────────── */
const TERMINAL_LINES = [
  { type: 'system', text: 'consensus-engine v2.4.1 initialized' },
  { type: 'system', text: 'connecting to casper-testnet...' },
  { type: 'divider' },
  { type: 'agent', name: 'analyst-alpha', status: 'online', text: 'valuation model loaded' },
  { type: 'agent', name: 'analyst-beta', status: 'online', text: 'market data synced' },
  { type: 'agent', name: 'analyst-gamma', status: 'online', text: 'risk model calibrated' },
  { type: 'divider' },
  { type: 'label', text: 'incoming assessment' },
  { type: 'data', label: 'asset', value: 'Manhattan Loft, 2BR/2BA' },
  { type: 'data', label: 'type', value: 'residential_real_estate' },
  { type: 'data', label: 'source', value: 'zillow, redfin, mls' },
  { type: 'divider' },
  { type: 'verdict', score: 94, label: 'consensus confidence' },
];

const AgentTerminal: React.FC = () => {
  const [visibleCount, setVisibleCount] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const delays = [0, 120, 240, 380, 500, 620, 740, 860, 960, 1060, 1160, 1280, 1400, 1500];
    const timers = delays.map((d, i) =>
      setTimeout(() => setVisibleCount(i + 1), d + 800)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="hero-terminal">
      <div className="hero-terminal__header">
        <div className="hero-terminal__dot" style={{ background: '#EF4444' }} />
        <div className="hero-terminal__dot" style={{ background: '#F59E0B' }} />
        <div className="hero-terminal__dot" style={{ background: '#22C55E' }} />
        <span className="hero-terminal__title">consensus-engine</span>
      </div>
      <div className="hero-terminal__body">
        {TERMINAL_LINES.map((line, i) => {
          if (i >= visibleCount) return null;

          if (line.type === 'divider') {
            return <hr key={i} className="hero-terminal__divider" />;
          }

          if (line.type === 'system') {
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
                className="hero-terminal__line"
              >
                <span className="hero-terminal__prompt">{'>'}</span>
                <span className="hero-terminal__text--dim">{line.text}</span>
              </motion.div>
            );
          }

          if (line.type === 'agent') {
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
                className="hero-terminal__line"
              >
                <span className="hero-terminal__text--success">●</span>
                <span className="hero-terminal__text--accent">{line.name}</span>
                <span className="hero-terminal__text--dim">{line.text}</span>
              </motion.div>
            );
          }

          if (line.type === 'label') {
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.15 }}
                className="hero-terminal__line"
              >
                <span className="hero-terminal__text--dim">── {line.text} ──</span>
              </motion.div>
            );
          }

          if (line.type === 'data') {
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
                className="hero-terminal__line"
              >
                <span className="hero-terminal__text--dim">{line.label}:</span>
                <span className="hero-terminal__text">{line.value}</span>
              </motion.div>
            );
          }

          if (line.type === 'verdict') {
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="hero-terminal__score"
              >
                <div>
                  <div className="hero-terminal__score-label">{line.label}</div>
                  <div className="hero-terminal__score-value">{line.score}%</div>
                </div>
                <div className="hero-terminal__score-bar">
                  <motion.div
                    className="hero-terminal__score-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${line.score}%` }}
                    transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
              </motion.div>
            );
          }

          return null;
        })}
      </div>
    </div>
  );
};

/* ── Stats Strip ────────────────────────────────────────────────────── */
const STATS = [
  { value: 3, suffix: '', label: 'AI Agents' },
  { value: 4, suffix: '', label: 'Products' },
  { value: 100, suffix: '%', label: 'On-Chain' },
  { value: 24, suffix: '/7', label: 'Verifiable' },
];

const StatsStrip: React.FC = () => (
  <div className="hero-stats-strip">
    {STATS.map((stat) => (
      <div key={stat.label} className="hero-stats-strip__cell">
        <div className="hero-stats-strip__value">
          <AnimatedNumber value={stat.value} suffix={stat.suffix} />
        </div>
        <div className="hero-stats-strip__label">{stat.label}</div>
      </div>
    ))}
  </div>
);

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
    : {
        background: 'transparent',
        color: 'var(--text-primary)',
        border: '2px solid var(--border-strong)',
        boxShadow: 'inset 0 0 0 0 var(--accent-soft)',
      };

  const hoveredStyle: React.CSSProperties = isPrimary
    ? { background: 'var(--accent-hover)', color: 'var(--text-inverse)', border: '2px solid var(--accent-hover)', boxShadow: '0 0 20px var(--accent-glow)' }
    : {
        background: 'var(--accent-soft)',
        color: 'var(--accent-strong)',
        border: '2px solid var(--accent)',
        boxShadow: '0 0 16px var(--accent-glow)',
      };

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
        transition: 'all 180ms ease-out',
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
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

      {/* Left: content */}
      <div className="hero-headline-wrapper">
        {/* Eyebrow badge */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="landing-badge landing-badge--red"
          style={{ marginBottom: 'var(--space-8)' }}
        >
          <motion.div
            animate={{ opacity: [1, 0.35, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)' }}
          />
          <span>Live on Casper Testnet</span>
        </motion.div>

        {/* Main Headline with scramble */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <ScrambleHeadline />
        </motion.div>

        {/* Tagline */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="hero-tagline"
        >
          <TypewriterText
            text="Multi-agent AI consensus valuations, stored on-chain as a composable primitive. Assess, Borrow, Insure — powered by verifiable AI."
            delay={1200}
          />
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.1 }}
          className="hero-cta-row"
        >
          <FlipButton to="/oracle" variant="primary" className="btn btn-primary btn-lg">
            Explore the Oracle <ArrowRight size={16} />
          </FlipButton>
          <FlipButton to="/assess" variant="secondary" className="btn btn-lg">
            Value an Asset <ArrowRight size={16} />
          </FlipButton>
          <FlipButton to="/#how-it-works" variant="secondary" className="btn btn-lg">
            How It Works
          </FlipButton>
        </motion.div>

        {/* Scroll cue */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.2 }}
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

      {/* Right: agent terminal */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="hero-right-panel"
      >
        <AgentTerminal />
      </motion.div>

      {/* Bottom: stats strip (spans full width) */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1.4 }}
        style={{ gridColumn: '1 / -1' }}
      >
        <StatsStrip />
      </motion.div>
    </section>
  );
};
