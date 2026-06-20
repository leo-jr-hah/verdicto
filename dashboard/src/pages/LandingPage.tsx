import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, useSpring, useInView } from 'framer-motion';
import { useScramble } from 'use-scramble';
import {
  ArrowRight, Shield, Lock, Zap, ChevronDown,
  Search, FileText, BarChart2, TrendingUp, Globe,
  Layers, Eye, Cpu, CheckCircle2, Activity,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const AGENTS = [
  { name: 'Comps Specialist', role: 'Comparable Sales', icon: BarChart2, color: '#F59E0B', description: 'Analyzes comparable sales data and market listings to estimate fair value using real transaction data.' },
  { name: 'Income Specialist', role: 'DCF Analysis', icon: TrendingUp, color: '#10B981', description: 'Projects future cash flows and applies discounted cash flow modeling for income-generating assets.' },
  { name: 'Evidence Reviewer', role: 'Data Validation', icon: FileText, color: '#3B82F6', description: 'Validates raw data integrity and cross-references multiple sources for accuracy and consistency.' },
  { name: 'Trend Analyst', role: 'Market Context', icon: Activity, color: '#06B6D4', description: 'Provides macro-economic context, market trends, and timing factors that affect asset valuation.' },
  { name: 'Case Researcher', role: 'Comparable Research', icon: Search, color: '#8B5CF6', description: 'Searches historical assessments and precedent data using retrieval-augmented generation.' },
];

const FEATURES = [
  { icon: Zap, title: '60-Second Assessment', description: 'From submission to verdict, five AI agents analyze your asset in parallel and deliver a consensus valuation in under a minute.', color: '#FF3B3B' },
  { icon: Shield, title: 'Cryptographic Audit Trail', description: 'Every assessment produces HMAC-signed receipts and execution commitments recorded permanently on the Casper blockchain.', color: '#10B981' },
  { icon: Globe, title: 'Real Market Data', description: 'Agents pull live data from RentCast, Met Museum, CoinGecko, and FRED, not synthetic benchmarks or stale indexes.', color: '#3B82F6' },
  { icon: Layers, title: 'Multi-Methodology', description: 'Comparable sales, DCF, market price, and appraisal methods. Agents autonomously select the best approach for each asset.', color: '#8B5CF6' },
  { icon: Eye, title: 'Isolated Analysis', description: 'Each agent operates independently with no coordination, preventing groupthink and ensuring genuinely independent opinions.', color: '#06B6D4' },
  { icon: Cpu, title: 'On-Chain Verification', description: 'Assessment results are anchored to Casper testnet with deploy hashes, block heights, and verifiable execution commitments.', color: '#F59E0B' },
];

const STATS = [
  { value: 5, label: 'AI Analysts', suffix: '', color: '#3B82F6' },
  { value: 60, label: 'Second Assessment', suffix: 's', color: '#10B981' },
  { value: 3, label: 'Asset Classes', suffix: '', color: '#8B5CF6' },
  { value: 100, label: 'On-Chain Record', suffix: '%', color: '#FF3B3B' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// ANIMATED BACKGROUND, Floating particles
// ═══════════════════════════════════════════════════════════════════════════════

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  hue: number;
}

const ParticleField: React.FC<{ count?: number }> = ({ count = 40 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Init particles
    particlesRef.current = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      size: Math.random() * 2 + 1,
      opacity: Math.random() * 0.3 + 0.1,
      hue: Math.random() > 0.5 ? 0 : 220, // red or blue
    }));

    const handleMouse = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handleMouse);

    const animate = () => {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const particles = particlesRef.current;
      const mouse = mouseRef.current;

      for (const p of particles) {
        // Mouse repulsion
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150) {
          const force = (150 - dist) / 150 * 0.02;
          p.vx += (dx / dist) * force;
          p.vy += (dy / dist) * force;
        }

        p.x += p.vx;
        p.y += p.vy;

        // Damping
        p.vx *= 0.99;
        p.vy *= 0.99;

        // Wrap
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        // Draw
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 80%, 60%, ${p.opacity})`;
        ctx.fill();
      }

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(255, 59, 59, ${0.08 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      animRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouse);
    };
  }, [count]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed', top: 0, left: 0,
        width: '100%', height: '100%',
        pointerEvents: 'none', zIndex: 0,
      }}
    />
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// ANIMATED GRADIENT ORB
// ═══════════════════════════════════════════════════════════════════════════════

const GradientOrb: React.FC<{ delay?: number; color1?: string; color2?: string; size?: number; x?: string; y?: string }> = ({
  delay = 0, color1 = 'rgba(255,59,59,0.12)', color2 = 'rgba(139,92,246,0.08)', size = 500, x = '50%', y = '30%',
}) => (
  <motion.div
    initial={{ scale: 0.8, opacity: 0 }}
    animate={{
      scale: [0.8, 1.1, 0.9, 1],
      opacity: [0, 0.6, 0.4, 0.6],
    }}
    transition={{
      duration: 8,
      delay,
      repeat: Infinity,
      repeatType: 'reverse',
      ease: 'easeInOut',
    }}
    style={{
      position: 'absolute',
      width: size, height: size,
      borderRadius: '50%',
      background: `radial-gradient(circle, ${color1} 0%, ${color2} 40%, transparent 70%)`,
      filter: 'blur(60px)',
      left: x, top: y,
      transform: 'translate(-50%, -50%)',
      pointerEvents: 'none',
    }}
  />
);

// ═══════════════════════════════════════════════════════════════════════════════
// ANIMATED NUMBER COUNTER
// ═══════════════════════════════════════════════════════════════════════════════

const AnimatedNumber: React.FC<{ value: number; suffix?: string }> = ({ value, suffix = '' }) => {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = value / 50;
    const timer = setInterval(() => {
      start += step;
      if (start >= value) { setDisplay(value); clearInterval(timer); }
      else setDisplay(Math.floor(start));
    }, 20);
    return () => clearInterval(timer);
  }, [inView, value]);

  return <span ref={ref}>{display}{suffix}</span>;
};

// ═══════════════════════════════════════════════════════════════════════════════
// SCRAMBLE TEXT (use-scramble hook)
// ═══════════════════════════════════════════════════════════════════════════════

const ScrambleText: React.FC<{
  text: string;
  speed?: number;
  delay?: number;
  style?: React.CSSProperties;
  className?: string;
}> = ({ text, speed = 0.35, delay = 0, style, className }) => {
  const { ref, replay } = useScramble({
    text,
    speed,
    tick: 1,
    scramble: 8,
    seed: 3,
    chance: 1,
    range: [65, 125],
    overdrive: false,
  });

  useEffect(() => {
    const t = setTimeout(() => {
      replay();
    }, delay);
    return () => clearTimeout(t);
  }, [delay, replay]);

  return <span ref={ref} style={style} className={className} />;
};

// ═══════════════════════════════════════════════════════════════════════════════
// SCROLL REVEAL WRAPPER
// ═══════════════════════════════════════════════════════════════════════════════

const Reveal: React.FC<{ children: React.ReactNode; delay?: number; direction?: 'up' | 'left' | 'right' }> = ({
  children, delay = 0, direction = 'up',
}) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const initial = direction === 'up' ? { opacity: 0, y: 50 }
    : direction === 'left' ? { opacity: 0, x: -50 }
    : { opacity: 0, x: 50 };

  return (
    <motion.div
      ref={ref}
      initial={initial}
      animate={inView ? { opacity: 1, y: 0, x: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// FLOATING CARD (parallax on scroll)
// ═══════════════════════════════════════════════════════════════════════════════

const FloatingCard: React.FC<{ children: React.ReactNode; speed?: number; style?: React.CSSProperties }> = ({
  children, speed = 0.5, style,
}) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [speed * -60, speed * 60]);

  return (
    <motion.div ref={ref} style={{ ...style, y }}>
      {children}
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// HERO, LIVE ASSESSMENT VISUAL
// ═══════════════════════════════════════════════════════════════════════════════

const LiveAssessmentVisual: React.FC = () => {
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

// ═══════════════════════════════════════════════════════════════════════════════
// AGENT CARD
// ═══════════════════════════════════════════════════════════════════════════════

const AgentCard: React.FC<{ agent: typeof AGENTS[0]; index: number }> = ({ agent, index }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const Icon = agent.icon;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -4, borderColor: agent.color }}
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-color)',
        borderRadius: 16,
        padding: '1.5rem',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'default',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
      }}
    >
      {/* Accent bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: agent.color }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: `${agent.color}15`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: agent.color,
        }}>
          <Icon size={18} />
        </div>
        <div>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>{agent.name}</div>
          <div style={{ fontSize: '0.7rem', fontWeight: 600, color: agent.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{agent.role}</div>
        </div>
      </div>

      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
        {agent.description}
      </p>

      {/* Thinking dots */}
      <div style={{ display: 'flex', gap: 4, marginTop: '1rem', alignItems: 'center' }}>
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
            transition={{ duration: 1.2, delay: i * 0.2, repeat: Infinity, ease: 'easeInOut' }}
            style={{ width: 4, height: 4, borderRadius: '50%', background: agent.color }}
          />
        ))}
        <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', marginLeft: '0.3rem' }}>
          Independent analysis
        </span>
      </div>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// BLOCKCHAIN RECORD VISUAL
// ═══════════════════════════════════════════════════════════════════════════════

const BlockchainRecord: React.FC = () => {
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
          style={{ width: 10, height: 10, borderRadius: '50%', background: '#10B981' }}
        />
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
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
            background: 'rgba(16, 185, 129, 0.04)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: 8,
          }}
        >
          <div style={{ fontSize: '0.6rem', color: '#10B981', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem', fontFamily: 'var(--font-sans)' }}>
            Transaction Hash
          </div>
          <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
            {hashParts.map((part, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0 }}
                animate={inView ? { opacity: 1 } : {}}
                transition={{ duration: 0.3, delay: 0.9 + i * 0.1 }}
                style={{ fontSize: '0.8rem', color: '#10B981' }}
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

// ═══════════════════════════════════════════════════════════════════════════════
// CURSOR GLOW, follows mouse with a subtle radial gradient
// ═══════════════════════════════════════════════════════════════════════════════

const CursorGlow: React.FC = () => {
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (glowRef.current) {
        glowRef.current.style.left = `${e.clientX}px`;
        glowRef.current.style.top = `${e.clientY}px`;
      }
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  return (
    <div
      ref={glowRef}
      style={{
        position: 'fixed',
        width: 600,
        height: 600,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,59,59,0.04) 0%, rgba(139,92,246,0.02) 40%, transparent 70%)',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        zIndex: 0,
        transition: 'left 0.15s ease-out, top 0.15s ease-out',
      }}
    />
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// STICKY HORIZONTAL SCROLL SECTION
// ═══════════════════════════════════════════════════════════════════════════════

const StickyScrollSection: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  const x = useTransform(scrollYProgress, [0, 1], ['0%', '-66.66%']);

  const steps = [
    {
      num: '01',
      title: 'Submit',
      desc: 'Connect your Casper wallet and submit an asset for assessment. Real estate, art, or commodities.',
      color: '#3B82F6',
      icon: FileText,
    },
    {
      num: '02',
      title: 'Analyze',
      desc: 'Five independent AI agents pull live market data and analyze using different methodologies.',
      color: '#8B5CF6',
      icon: Cpu,
    },
    {
      num: '03',
      title: 'Verify',
      desc: 'The consensus valuation is recorded on Casper testnet with HMAC receipts and execution commitments.',
      color: '#10B981',
      icon: Shield,
    },
  ];

  return (
    <div ref={containerRef} style={{ height: '250vh', position: 'relative' }}>
      <div style={{
        position: 'sticky',
        top: 0,
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
      }}>
        <motion.div style={{ x, display: 'flex', gap: '2rem', padding: '0 4rem', width: '300%' }}>
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                style={{
                  width: 'calc(33.33vw - 1.33rem)',
                  minWidth: 340,
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 20,
                  padding: '3rem',
                  position: 'relative',
                  overflow: 'hidden',
                  flexShrink: 0,
                }}
              >
                {/* Large background number */}
                <div style={{
                  position: 'absolute', top: -20, right: -10,
                  fontSize: '8rem', fontWeight: 900,
                  color: 'var(--text-primary)', opacity: 0.03,
                  lineHeight: 1, fontFamily: 'var(--font-display)',
                }}>
                  {step.num}
                </div>

                <div style={{
                  width: 56, height: 56, borderRadius: 14,
                  background: `${step.color}15`,
                  border: `1px solid ${step.color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '1.5rem',
                }}>
                  <Icon size={24} color={step.color} />
                </div>

                <div style={{
                  fontSize: '0.7rem', fontWeight: 700, color: step.color,
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                  marginBottom: '0.75rem',
                }}>
                  Step {step.num}
                </div>

                <h3 style={{
                  fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)',
                  letterSpacing: '-0.03em', marginBottom: '1rem',
                  fontFamily: 'var(--font-display)',
                }}>
                  {step.title}
                </h3>

                <p style={{
                  fontSize: '1rem', color: 'var(--text-secondary)',
                  lineHeight: 1.7, maxWidth: 360,
                }}>
                  {step.desc}
                </p>
              </div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN LANDING PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export const LandingPage: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  return (
    <div ref={containerRef} style={{ position: 'relative', overflowX: 'hidden' }}>
      {/* Animated background */}
      <ParticleField count={35} />
      <CursorGlow />

      {/* Scroll progress bar */}
      <motion.div
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, height: 2,
          background: 'linear-gradient(90deg, #FF3B3B, #8B5CF6)',
          scaleX, transformOrigin: '0%', zIndex: 100,
        }}
      />

      {/* ═══════════════════════════════════════════════════
          HERO
         ═══════════════════════════════════════════════════ */}
      <section style={{
        minHeight: '100vh',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '6rem 2rem 4rem',
        position: 'relative',
        textAlign: 'center',
      }}>
        {/* Gradient orbs */}
        <GradientOrb color1="rgba(255,59,59,0.1)" color2="rgba(139,92,246,0.06)" size={700} x="30%" y="20%" delay={0} />
        <GradientOrb color1="rgba(59,130,246,0.08)" color2="rgba(6,182,212,0.05)" size={500} x="70%" y="60%" delay={2} />

        {/* Eyebrow badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            background: 'rgba(255, 59, 59, 0.06)',
            border: '1px solid rgba(255, 59, 59, 0.15)',
            borderRadius: '999px',
            padding: '0.375rem 1rem',
            marginBottom: '2rem',
            position: 'relative', zIndex: 1,
          }}
        >
          <motion.div
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ width: 6, height: 6, borderRadius: '50%', background: '#FF3B3B' }}
          />
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#FF3B3B', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
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
            position: 'relative', zIndex: 1,
          }}
        >
          <ScrambleText text="AI-Powered Asset" delay={400} speed={0.4} /><br />
          <span style={{ color: '#FF3B3B' }}>
            <ScrambleText text="Assessment" delay={700} speed={0.35} />
          </span>
          {' '}
          <ScrambleText text="on Chain" delay={1000} speed={0.4} />
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
            position: 'relative', zIndex: 1,
          }}
        >
          Five independent AI agents analyze real market data, cross-validate
          methodologies, and deliver a consensus valuation, cryptographically
          recorded on the Casper blockchain in 60 seconds.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '4rem', position: 'relative', zIndex: 1 }}
        >
          <Link
            to="/assess"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              background: '#FF3B3B', color: '#fff',
              padding: '0.875rem 1.75rem',
              borderRadius: 10, fontWeight: 700, fontSize: '0.95rem',
              textDecoration: 'none',
              boxShadow: '0 4px 24px rgba(255,59,59,0.3)',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(255,59,59,0.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 24px rgba(255,59,59,0.3)'; }}
          >
            Value an Asset <ArrowRight size={16} />
          </Link>
          <button
            onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              background: 'var(--bg-elevated)', color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              padding: '0.875rem 1.75rem',
              borderRadius: 10, fontWeight: 600, fontSize: '0.95rem',
              cursor: 'pointer', fontFamily: 'inherit',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--text-tertiary)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; }}
          >
            How It Works
          </button>
        </motion.div>

        {/* Live assessment visual */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.6 }}
          style={{ width: '100%', maxWidth: 520, position: 'relative', zIndex: 1 }}
        >
          <LiveAssessmentVisual />
        </motion.div>

        {/* Scroll cue */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3 }}
          style={{ position: 'absolute', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', zIndex: 1 }}
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

      {/* ═══════════════════════════════════════════════════
          STATS BAR
         ═══════════════════════════════════════════════════ */}
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

      {/* ═══════════════════════════════════════════════════
          HOW IT WORKS, Sticky Horizontal Scroll
         ═══════════════════════════════════════════════════ */}
      <section id="how-it-works">
        <StickyScrollSection />
      </section>

      {/* ═══════════════════════════════════════════════════
          FEATURES
         ═══════════════════════════════════════════════════ */}
      <section style={{ padding: '8rem 2rem', background: 'var(--bg-surface)', borderTop: '1px solid var(--border-color)', position: 'relative' }}>
        <GradientOrb color1="rgba(255,59,59,0.06)" color2="rgba(245,158,11,0.04)" size={500} x="20%" y="50%" delay={3} />

        <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
              <h2 style={{
                fontSize: 'clamp(1.8rem, 4vw, 3rem)',
                fontWeight: 800, lineHeight: 1.1,
                letterSpacing: '-0.03em',
                color: 'var(--text-primary)',
                marginBottom: '1rem',
              }}>
                Built for trust.
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: 500, margin: '0 auto', lineHeight: 1.7 }}>
                Every layer is designed for transparency, verifiability, and speed.
              </p>
            </div>
          </Reveal>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
            {FEATURES.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <Reveal key={feature.title} delay={i * 0.08}>
                  <motion.div
                    whileHover={{ y: -3, borderColor: feature.color }}
                    style={{
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 14,
                      padding: '1.5rem',
                      transition: 'border-color 0.2s ease',
                      height: '100%',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: `${feature.color}12`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: feature.color, flexShrink: 0,
                      }}>
                        <Icon size={16} />
                      </div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {feature.title}
                      </div>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                      {feature.description}
                    </p>
                  </motion.div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          AGENTS
         ═══════════════════════════════════════════════════ */}
      <section id="agents" style={{ padding: '8rem 2rem', borderTop: '1px solid var(--border-color)', position: 'relative' }}>
        <GradientOrb color1="rgba(6,182,212,0.06)" color2="rgba(59,130,246,0.04)" size={400} x="15%" y="40%" delay={2} />

        <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                background: 'rgba(6, 182, 212, 0.06)',
                border: '1px solid rgba(6, 182, 212, 0.15)',
                borderRadius: '999px',
                padding: '0.375rem 1rem',
                marginBottom: '1.5rem',
              }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#06B6D4', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  The Agents
                </span>
              </div>
              <h2 style={{
                fontSize: 'clamp(1.8rem, 4vw, 3rem)',
                fontWeight: 800, lineHeight: 1.1,
                letterSpacing: '-0.03em',
                color: 'var(--text-primary)',
                marginBottom: '1rem',
              }}>
                Five specialists. No coordination.<br />
                <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Every analysis formed independently.</span>
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: 560, margin: '0 auto', lineHeight: 1.7 }}>
                Each agent is given the same data but operates in isolation, preventing
                groupthink and ensuring genuinely independent valuations.
              </p>
            </div>
          </Reveal>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {AGENTS.map((agent, i) => (
              <AgentCard key={agent.name} agent={agent} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          ON-CHAIN PROOF
         ═══════════════════════════════════════════════════ */}
      <section style={{
        padding: '8rem 2rem',
        borderTop: '1px solid var(--border-color)',
        background: 'var(--bg-surface)',
        position: 'relative',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5rem', alignItems: 'center', position: 'relative', zIndex: 1 }}>
          <Reveal direction="left">
            <div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                background: 'rgba(16, 185, 129, 0.06)',
                border: '1px solid rgba(16, 185, 129, 0.15)',
                borderRadius: '999px',
                padding: '0.375rem 1rem',
                marginBottom: '1.5rem',
              }}>
                <Lock size={12} color="#10B981" />
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10B981', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  On-Chain Proof
                </span>
              </div>
              <h2 style={{
                fontSize: 'clamp(1.8rem, 3.5vw, 2.75rem)',
                fontWeight: 800, lineHeight: 1.1,
                letterSpacing: '-0.03em',
                color: 'var(--text-primary)',
                marginBottom: '1.5rem',
              }}>
                Every assessment is<br />
                <span style={{ color: '#10B981' }}>permanently recorded.</span>
              </h2>
              <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '2rem' }}>
                HMAC-signed receipt chains, SHA-256 execution commitments, and deploy hashes
                on the Casper testnet. No assessment can be altered, deleted, or disputed
                after the fact.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[
                  'HMAC-SHA256 deliberation receipts',
                  'Verifiable execution commitments',
                  'Deploy hashes on Casper testnet',
                  'Reputation-weighted consensus',
                ].map((item, i) => (
                  <Reveal key={item} delay={i * 0.1} direction="left">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <CheckCircle2 size={14} color="#10B981" />
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{item}</span>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal direction="right">
            <FloatingCard speed={0.3}>
              <BlockchainRecord />
            </FloatingCard>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          CTA
         ═══════════════════════════════════════════════════ */}
      <section style={{
        padding: '8rem 2rem',
        borderTop: '1px solid var(--border-color)',
        textAlign: 'center',
        position: 'relative',
      }}>
        <GradientOrb color1="rgba(255,59,59,0.1)" color2="rgba(139,92,246,0.06)" size={600} x="50%" y="50%" delay={0} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <Reveal>
            <h2 style={{
              fontSize: 'clamp(2rem, 5vw, 3.5rem)',
              fontWeight: 800, lineHeight: 1.1,
              letterSpacing: '-0.04em',
              color: 'var(--text-primary)',
              marginBottom: '1.5rem',
              fontFamily: 'var(--font-display)',
            }}>
              Ready to assess?
            </h2>
            <p style={{
              fontSize: '1.1rem',
              color: 'var(--text-secondary)',
              maxWidth: 480,
              margin: '0 auto 2.5rem',
              lineHeight: 1.65,
            }}>
              Connect your Casper wallet and get a consensus valuation from five independent AI agents, in 60 seconds.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link
                to="/assess"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                  background: '#FF3B3B', color: '#fff',
                  padding: '1rem 2rem',
                  borderRadius: 12, fontWeight: 700, fontSize: '1.05rem',
                  textDecoration: 'none',
                  boxShadow: '0 4px 24px rgba(255,59,59,0.3)',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(255,59,59,0.4)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 24px rgba(255,59,59,0.3)'; }}
              >
                Value an Asset <ArrowRight size={18} />
              </Link>
              <Link
                to="/predict"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                  background: 'var(--bg-elevated)', color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  padding: '1rem 2rem',
                  borderRadius: 12, fontWeight: 600, fontSize: '1.05rem',
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--text-tertiary)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; }}
              >
                Make a Prediction
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
};
