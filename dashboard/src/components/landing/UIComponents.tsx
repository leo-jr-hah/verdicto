import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView, useScroll, useTransform } from 'motion/react';
import { useScramble } from 'use-scramble';

// ═══════════════════════════════════════════════════════════════════════════════
// ANIMATED NUMBER COUNTER
// ═══════════════════════════════════════════════════════════════════════════════

export const AnimatedNumber: React.FC<{ value: number; suffix?: string }> = ({ value, suffix = '' }) => {
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

export const ScrambleText: React.FC<{
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

export const Reveal: React.FC<{ children: React.ReactNode; delay?: number; direction?: 'up' | 'left' | 'right'; duration?: number }> = ({
  children, delay = 0, direction = 'up', duration = 0.7,
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
      transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// FLOATING CARD (parallax on scroll)
// ═══════════════════════════════════════════════════════════════════════════════

export const FloatingCard: React.FC<{ children: React.ReactNode; speed?: number; style?: React.CSSProperties }> = ({
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
