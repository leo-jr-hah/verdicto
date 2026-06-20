import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';

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

export const ParticleField: React.FC<{ count?: number }> = ({ count = 40 }) => {
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

export const GradientOrb: React.FC<{ delay?: number; color1?: string; color2?: string; size?: number; x?: string; y?: string }> = ({
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
// CURSOR GLOW
// ═══════════════════════════════════════════════════════════════════════════════

export const CursorGlow: React.FC = () => {
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
