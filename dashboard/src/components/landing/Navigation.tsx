import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import verdictLogo from '../../assets/logo.jpeg';

export const Navigation: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 80);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '64px',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: scrolled ? 'var(--bg-main)' : 'transparent',
        opacity: scrolled ? 0.9 : 1,
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: `1px solid ${scrolled ? 'var(--border-color)' : 'transparent'}`,
        transition: 'background 0.3s ease, border-color 0.3s ease, backdrop-filter 0.3s ease',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '1440px',
          padding: '0 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <img src={verdictLogo} alt="Verdicto" style={{ width: '32px', height: '32px', borderRadius: '6px', objectFit: 'cover' }} />
          <span style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>Verdicto</span>
        </Link>

        {/* Nav Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <a
            href="#oracle"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById('oracle')?.scrollIntoView({ behavior: 'smooth' });
            }}
            style={{
              fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)',
              textDecoration: 'none', transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => { (e.target as HTMLElement).style.color = 'var(--text-primary)'; }}
            onMouseLeave={(e) => { (e.target as HTMLElement).style.color = 'var(--text-secondary)'; }}
          >
            Oracle
          </a>
          <a
            href="#contracts"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById('contracts')?.scrollIntoView({ behavior: 'smooth' });
            }}
            style={{
              fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)',
              textDecoration: 'none', transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => { (e.target as HTMLElement).style.color = 'var(--text-primary)'; }}
            onMouseLeave={(e) => { (e.target as HTMLElement).style.color = 'var(--text-secondary)'; }}
          >
            Contracts
          </a>

          {/* Open App */}
          <motion.div whileHover={{ y: -1, boxShadow: '0 8px 32px rgba(255,59,59,0.35)' }} transition={{ duration: 0.12 }}>
            <Link to="/dashboard" className="btn btn-primary" style={{ padding: '10px 20px', borderRadius: '8px', fontSize: '0.9rem' }}>
              Open App →
            </Link>
          </motion.div>
        </div>
      </div>
    </motion.nav>
  );
};
