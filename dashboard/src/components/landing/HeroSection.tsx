import React, { useRef, useEffect, useCallback, useState } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronDown } from 'lucide-react';

/* ── Mouse-following particle canvas ─────────────────────────────── */
const ParticleField: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: -999, y: -999 });
  const particles = useRef<Array<{
    x: number; y: number; vx: number; vy: number;
    baseX: number; baseY: number; size: number; opacity: number;
    type: 'node' | 'link' | 'verdict';
  }>>([]);
  const animFrame = useRef(0);

  const initParticles = useCallback((w: number, h: number) => {
    // ~250 particles, but skip the center "safe zone" where text lives
    const count = Math.min(Math.floor((w * h) / 4000), 280);
    // Safe zone: center 50% width × 55% height — where headline, subtitle, buttons sit
    const safeLeft = w * 0.25;
    const safeRight = w * 0.75;
    const safeTop = h * 0.22;
    const safeBottom = h * 0.77;
    const arr: typeof particles.current = [];
    let attempts = 0;
    while (arr.length < count && attempts < count * 4) {
      attempts++;
      const x = Math.random() * w;
      const y = Math.random() * h;
      // Skip particles inside the safe zone
      if (x > safeLeft && x < safeRight && y > safeTop && y < safeBottom) continue;
      const typeRoll = Math.random();
      arr.push({
        x, y, baseX: x, baseY: y,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        size: typeRoll < 0.12 ? 4 : typeRoll < 0.28 ? 2.5 : 1.5,
        opacity: 0.5 + Math.random() * 0.5,
        type: typeRoll < 0.12 ? 'verdict' : typeRoll < 0.28 ? 'link' : 'node',
      });
    }
    particles.current = arr;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let w = canvas.parentElement!.clientWidth;
    let h = canvas.parentElement!.clientHeight;
    canvas.width = w;
    canvas.height = h;
    initParticles(w, h);

    const handleResize = () => {
      w = canvas.parentElement!.clientWidth;
      h = canvas.parentElement!.clientHeight;
      canvas.width = w;
      canvas.height = h;
      initParticles(w, h);
    };
    window.addEventListener('resize', handleResize);

    const handleMouse = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    canvas.addEventListener('mousemove', handleMouse);
    canvas.addEventListener('mouseleave', () => { mouse.current = { x: -999, y: -999 }; });

    // Safe zone bounds (same proportions as initParticles)
    const safeLeft = w * 0.25;
    const safeRight = w * 0.75;
    const safeTop = h * 0.22;
    const safeBottom = h * 0.77;

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const mx = mouse.current.x;
      const my = mouse.current.y;
      const ps = particles.current;

      for (let i = 0; i < ps.length; i++) {
        const p = ps[i];

        // Mouse attraction — wider radius, stronger pull
        const dx = mx - p.x;
        const dy = my - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 300 && dist > 0) {
          const force = (300 - dist) / 300;
          p.vx += (dx / dist) * force * 0.15;
          p.vy += (dy / dist) * force * 0.15;
        }

        // Return to base position gently
        p.vx += (p.baseX - p.x) * 0.004;
        p.vy += (p.baseY - p.y) * 0.004;

        // Damping
        p.vx *= 0.96;
        p.vy *= 0.96;

        p.x += p.vx;
        p.y += p.vy;

        // Push particles out of the safe zone
        if (p.x > safeLeft && p.x < safeRight && p.y > safeTop && p.y < safeBottom) {
          const distLeft = p.x - safeLeft;
          const distRight = safeRight - p.x;
          const distTop = p.y - safeTop;
          const distBottom = safeBottom - p.y;
          const minDist = Math.min(distLeft, distRight, distTop, distBottom);
          if (minDist === distLeft) { p.x = safeLeft - 2; p.vx = -Math.abs(p.vx) * 0.5; }
          else if (minDist === distRight) { p.x = safeRight + 2; p.vx = Math.abs(p.vx) * 0.5; }
          else if (minDist === distTop) { p.y = safeTop - 2; p.vy = -Math.abs(p.vy) * 0.5; }
          else { p.y = safeBottom + 2; p.vy = Math.abs(p.vy) * 0.5; }
        }

        // Draw particle — boosted opacity
        ctx.beginPath();
        if (p.type === 'verdict') {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(Math.PI / 4);
          ctx.rect(-p.size, -p.size, p.size * 2, p.size * 2);
          ctx.restore();
          ctx.fillStyle = `rgba(255, 59, 59, ${Math.min(p.opacity * 1.2, 1)})`;
        } else if (p.type === 'link') {
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 120, 120, ${Math.min(p.opacity * 0.9, 1)})`;
        } else {
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(p.opacity * 0.6, 1)})`;
        }
        ctx.fill();

        // Draw connections to nearby particles — skip if line crosses safe zone
        for (let j = i + 1; j < ps.length; j++) {
          const q = ps[j];
          const ddx = p.x - q.x;
          const ddy = p.y - q.y;
          const dd = Math.sqrt(ddx * ddx + ddy * ddy);
          if (dd < 140) {
            // Skip connection if midpoint is inside safe zone
            const midX = (p.x + q.x) / 2;
            const midY = (p.y + q.y) / 2;
            if (midX > safeLeft && midX < safeRight && midY > safeTop && midY < safeBottom) continue;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            const alpha = (1 - dd / 140) * 0.2;
            ctx.strokeStyle = p.type === 'verdict' || q.type === 'verdict'
              ? `rgba(255, 59, 59, ${alpha * 2.5})`
              : `rgba(255, 255, 255, ${alpha * 1.5})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      // Draw lines from mouse to nearby particles — much more visible
      if (mx > 0 && my > 0) {
        for (const p of ps) {
          const d = Math.sqrt((mx - p.x) ** 2 + (my - p.y) ** 2);
          if (d < 220) {
            ctx.beginPath();
            ctx.moveTo(mx, my);
            ctx.lineTo(p.x, p.y);
            const alpha = (1 - d / 220) * 0.4;
            ctx.strokeStyle = `rgba(255, 59, 59, ${alpha})`;
            ctx.lineWidth = 1.2;
            ctx.stroke();
          }
        }
      }

      animFrame.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animFrame.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [initParticles]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'auto',
        zIndex: 0,
      }}
    />
  );
};

/* ── Flip Button — color inverts on hover (red↔white) ────────────── */
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

  // Primary: red bg → white bg on hover
  // Secondary: dark bg → red bg on hover
  const normalStyle: React.CSSProperties = isPrimary
    ? { background: 'var(--primary)', color: '#fff', border: '2px solid var(--primary)' }
    : { background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '2px solid var(--border-color)' };

  const hoveredStyle: React.CSSProperties = isPrimary
    ? { background: '#fff', color: 'var(--primary)', border: '2px solid var(--primary)', boxShadow: '0 0 24px rgba(255,59,59,0.3)' }
    : { background: 'var(--primary)', color: '#fff', border: '2px solid var(--primary)', boxShadow: '0 0 24px rgba(255,59,59,0.3)' };

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
    <section style={{
      minHeight: '100vh',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '6rem 2rem 4rem',
      position: 'relative',
      textAlign: 'center',
      overflow: 'hidden',
    }}>
      {/* Particle canvas behind everything */}
      <ParticleField />

      {/* Content above particles — pointer-events: none so canvas gets mouse, buttons get pointer-events: auto */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'none' }}>
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
          <span style={{ color: 'var(--primary)' }}>Valuation & Lending</span>{' '}
          on Chain
        </motion.h1>

        {/* Subheadline — qualitative */}
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
          Get a fair, transparent valuation of any real-world asset — then borrow
          against it or insure it instantly. Powered by independent AI agents that analyze,
          cross-check, and record every assessment on the Casper blockchain.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '4rem', pointerEvents: 'auto' }}
        >
          <FlipButton
            to="/assess"
            variant="primary"
            className="btn btn-primary"
            style={{ padding: '0.875rem 1.75rem', fontSize: '0.95rem' }}
          >
            Value an Asset <ArrowRight size={16} />
          </FlipButton>
          <FlipButton
            to="/borrow"
            variant="secondary"
            className="btn"
            style={{ padding: '0.875rem 1.75rem', fontSize: '0.95rem' }}
          >
            Borrow Against Asset <ArrowRight size={16} />
          </FlipButton>
          <FlipButton
            to="/insure"
            variant="secondary"
            className="btn"
            style={{ padding: '0.875rem 1.75rem', fontSize: '0.95rem' }}
          >
            Insure Your Asset <ArrowRight size={16} />
          </FlipButton>
          <FlipButton
            variant="secondary"
            className="btn"
            style={{ padding: '0.875rem 1.75rem', fontSize: '0.95rem' }}
            onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
          >
            How It Works
          </FlipButton>
        </motion.div>

        {/* Scroll cue */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          style={{ position: 'relative' }}
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
