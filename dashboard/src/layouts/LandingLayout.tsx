import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import verdictoLogo from '../assets/logo.jpeg';

export const LandingLayout: React.FC = () => {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)' }}>
      {/* ── Top Navigation - Logo + Open App only ── */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 2rem',
          background: 'rgba(var(--bg-main-rgb, 255,255,255), 0.8)',
          backdropFilter: 'blur(16px) saturate(180%)',
          WebkitBackdropFilter: 'blur(16px) saturate(180%)',
          borderBottom: '1px solid var(--border-color)',
          zIndex: 1000,
        }}
      >
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' }}>
          <img src={verdictoLogo} alt="Verdicto" style={{ width: '32px', height: '32px', borderRadius: '8px', objectFit: 'cover' }} />
          <span style={{
            fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)',
            letterSpacing: '-0.03em', fontFamily: 'var(--font-display)',
          }}>
            Verdicto
          </span>
        </Link>

        {/* Open App button only */}
        <Link
          to="/dashboard"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            background: '#FF3B3B', color: '#fff',
            padding: '0.5rem 1.25rem',
            borderRadius: 8, fontWeight: 700, fontSize: '0.85rem',
            textDecoration: 'none',
            boxShadow: '0 2px 12px rgba(255,59,59,0.25)',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(255,59,59,0.35)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = '';
            e.currentTarget.style.boxShadow = '0 2px 12px rgba(255,59,59,0.25)';
          }}
        >
          Open App →
        </Link>
      </motion.nav>

      {/* Page content */}
      <main style={{ paddingTop: 64 }}>
        <Outlet />
      </main>

      {/* ── Footer ── */}
      <footer style={{
        borderTop: '1px solid var(--border-color)',
        padding: '3rem 2rem',
        textAlign: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <img src={verdictoLogo} alt="Verdicto" style={{ width: '24px', height: '24px', borderRadius: '6px', objectFit: 'cover' }} />
          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Verdicto
          </span>
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', margin: 0 }}>
          Autonomous RWA Assessment on Casper Blockchain
        </p>
      </footer>

      {/* Mobile responsive styles */}
      <style>{`
        @media (max-width: 768px) {
          .landing-mobile-toggle { display: block !important; }
          .landing-nav-links { display: none !important; }
          .landing-nav-cta { display: none !important; }
        }
      `}</style>
    </div>
  );
};
