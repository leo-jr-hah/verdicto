import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform, useMotionTemplate } from 'motion/react';
import { Link } from 'react-router-dom';

/* ── Faceted Geometric Background ────────────────────────────────────────
   Multiple overlapping clip-path polygons with teal→navy gradients.
   Pure CSS, no images needed. ─────────────────────────────────────────── */
const FacetedBackground: React.FC = () => (
  <div className="hero-facets" aria-hidden="true">
    {/* Base dark layer */}
    <div className="hero-facet hero-facet--base" />

    {/* Large angular shard — top-left to center */}
    <div className="hero-facet hero-facet--1" />

    {/* Medium shard — center-right */}
    <div className="hero-facet hero-facet--2" />

    {/* Small accent shard — bottom-left */}
    <div className="hero-facet hero-facet--3" />

    {/* Subtle highlight shard — top-right */}
    <div className="hero-facet hero-facet--4" />

    {/* Noise/grain overlay for texture */}
    <div className="hero-facet hero-facet--noise" />
  </div>
);

/* ── Hero Section ─────────────────────────────────────────────────────── */
export const HeroSection: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Interactive Mouse Parallax Values
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth springs for high-end feel
  const smoothX = useSpring(mouseX, { stiffness: 150, damping: 25, mass: 0.5 });
  const smoothY = useSpring(mouseY, { stiffness: 150, damping: 25, mass: 0.5 });

  // Map mouse movement to physical tilt and brutalist text shadow
  const rotateX = useTransform(smoothY, [-1, 1], [8, -8]);
  const rotateY = useTransform(smoothX, [-1, 1], [-8, 8]);
  
  const shadowX = useTransform(smoothX, [-1, 1], [-12, 12]);
  const shadowY = useTransform(smoothY, [-1, 1], [-12, 12]);
  const textShadow = useMotionTemplate`${shadowX}px ${shadowY}px 0px rgba(212, 175, 55, 0.25)`;

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    mouseX.set((e.clientX - centerX) / (rect.width / 2));
    mouseY.set((e.clientY - centerY) / (rect.height / 2));
  };
  
  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <section className="hero-section-new">
      <FacetedBackground />

      <div className="hero-content-new">
        {/* Intro Animation Wrapper */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          style={{ perspective: 1000 }}
        >
          {/* Interactive Hover Target */}
          <motion.div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ 
              rotateX, 
              rotateY,
              textShadow,
              display: 'inline-block',
              cursor: 'default',
              transformStyle: 'preserve-3d'
            }}
            whileHover={{ scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          >
            <h1 className="hero-headline-new" style={{ margin: 0 }}>
              Verdicts you can <span style={{ color: 'var(--accent)' }}>verify.</span>
            </h1>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <Link to="/oracle" className="hero-cta-new">
            Explore the Oracle
            <span className="hero-cta-new__arrow">→</span>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};
