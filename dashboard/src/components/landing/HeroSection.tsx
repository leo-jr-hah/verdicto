import React from 'react';
import { motion } from 'motion/react';
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
  return (
    <section className="hero-section-new">
      <FacetedBackground />

      <div className="hero-content-new">
        <motion.h1
          className="hero-headline-new"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          Verdicts you can{' '}
          <motion.span style={{ position: 'relative', display: 'inline-block' }}>
            <span style={{ opacity: 0 }}>verify.</span>
            
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.4, duration: 0.01 }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                color: 'var(--accent)',
                zIndex: 1,
                display: 'inline-block',
                width: '100%'
              }}
            >
              verify.
            </motion.span>

            <motion.div
              initial={{ clipPath: 'inset(0 100% 0 0)' }}
              animate={{ 
                clipPath: ['inset(0 100% 0 0)', 'inset(0 0% 0 0)', 'inset(0 0% 0 100%)'] 
              }}
              transition={{ 
                delay: 1.0, 
                duration: 0.8, 
                times: [0, 0.5, 1], 
                ease: [0.77, 0, 0.175, 1] 
              }}
              style={{
                position: 'absolute',
                top: '0.1em',
                bottom: '0.1em',
                left: 0,
                right: 0,
                backgroundColor: 'var(--accent)',
                zIndex: 2
              }}
            />
          </motion.span>
        </motion.h1>

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
