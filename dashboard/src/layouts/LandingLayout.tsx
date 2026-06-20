import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Scale, Menu, X } from 'lucide-react';

export const LandingLayout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const location = useLocation();

  const navLinks = [
    { label: 'How It Works', href: '/#how-it-works' },
    { label: 'Agents', href: '/#agents' },
    { label: 'Roadmap', href: '/roadmap' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)' }}>
      {/* ── Top Navigation ── */}
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
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, #FF3B3B 0%, #FF6B6B 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 12px rgba(255,59,59,0.3)',
          }}>
            <Scale size={16} color="#fff" />
          </div>
          <span style={{
            fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)',
            letterSpacing: '-0.03em', fontFamily: 'var(--font-display)',
          }}>
            Verdict
          </span>
        </Link>

        {/* Desktop nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            {navLinks.map(link => (
              <Link
                key={link.label}
                to={link.href}
                style={{
                  fontSize: '0.85rem', fontWeight: 500,
                  color: location.pathname === link.href ? 'var(--text-primary)' : 'var(--text-secondary)',
                  textDecoration: 'none',
                  transition: 'color 0.15s ease',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <Link
            to="/assess"
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
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          style={{
            display: 'none',
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-primary)', padding: '0.5rem',
          }}
          className="landing-mobile-toggle"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </motion.nav>

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          style={{
            position: 'fixed', top: 64, left: 0, right: 0,
            background: 'var(--bg-elevated)',
            borderBottom: '1px solid var(--border-color)',
            padding: '1rem 2rem',
            display: 'flex', flexDirection: 'column', gap: '1rem',
            zIndex: 999,
          }}
        >
          {navLinks.map(link => (
            <Link
              key={link.label}
              to={link.href}
              onClick={() => setMobileOpen(false)}
              style={{
                fontSize: '0.95rem', fontWeight: 500,
                color: 'var(--text-secondary)', textDecoration: 'none',
              }}
            >
              {link.label}
            </Link>
          ))}
          <Link
            to="/assess"
            onClick={() => setMobileOpen(false)}
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
              background: '#FF3B3B', color: '#fff',
              padding: '0.75rem 1.25rem',
              borderRadius: 8, fontWeight: 700, fontSize: '0.9rem',
              textDecoration: 'none',
            }}
          >
            Open App →
          </Link>
        </motion.div>
      )}

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
          <div style={{
            width: 24, height: 24, borderRadius: 6,
            background: 'linear-gradient(135deg, #FF3B3B 0%, #FF6B6B 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Scale size={12} color="#fff" />
          </div>
          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Verdict
          </span>
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', margin: 0 }}>
          Autonomous RWA Assessment on Casper Blockchain
        </p>
        <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', margin: '0.5rem 0 0', opacity: 0.6 }}>
          Built for the Casper Hackathon · Testnet
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
