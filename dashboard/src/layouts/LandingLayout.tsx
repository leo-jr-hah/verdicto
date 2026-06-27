import React, { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import verdictoLogo from '../assets/newlogo.png';
import { HeroSection } from '../components/landing/HeroSection';

export const LandingLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="landing-page-wrapper">
      {/* ── Hero (renders first, ~85vh) ── */}
      <HeroSection />

      {/* ── Sticky Navigation (sits below hero, locks on scroll) ── */}
      <nav className="landing-nav">
        <div className="landing-nav__inner">
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
        </div>
      </nav>

      {/* ── Rest of the page content ── */}
      <main className="landing-main">
        <Outlet />
      </main>
    </div>
  );
};
