import React, { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import verdictoLogo from '../assets/newlogo.png';

export const LandingLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="landing-page-wrapper">
      {/* ── Top Navigation ── */}
      <motion.nav
        className="landing-nav"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Logo */}
        <Link to="/" className="landing-nav-logo">
          <img src={verdictoLogo} alt="Verdicto" className="logo-img logo-img--md" />
          <span className="landing-nav-logo-text">Verdicto</span>
        </Link>

        {/* Nav links (desktop + mobile) */}
        <div className={`landing-nav-links${mobileMenuOpen ? ' landing-nav-links--open' : ''}`}>
          <a href="#how-it-works" className="landing-nav-link" onClick={() => setMobileMenuOpen(false)}>How It Works</a>
          <a href="#agents" className="landing-nav-link" onClick={() => setMobileMenuOpen(false)}>Agents</a>
          <a href="#oracle" className="landing-nav-link" onClick={() => setMobileMenuOpen(false)}>Oracle</a>
          <a href="#contracts" className="landing-nav-link" onClick={() => setMobileMenuOpen(false)}>Contracts</a>
          <Link to="/dashboard" className="landing-cta-btn" onClick={() => setMobileMenuOpen(false)}>
            Open App →
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="landing-nav__mobile-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </motion.nav>

      {/* Page content */}
      <main className="landing-main">
        <Outlet />
      </main>
    </div>
  );
};
