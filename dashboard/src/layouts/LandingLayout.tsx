import React, { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Menu, X, ArrowRight } from 'lucide-react';
import verdictoLogo from '../assets/newlogo.png';
import { HeroSection } from '../components/landing/HeroSection';

export const LandingLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="landing-page-wrapper">
      {/* ── Hero (full viewport minus nav height) ── */}
      <HeroSection />

      {/* ── Sticky Navigation (locks to top on scroll) ── */}
      <nav className="landing-nav">
        <div className="landing-nav__inner">
          {/* Logo */}
          <Link to="/" className="landing-nav-logo">
            <img src={verdictoLogo} alt="Verdicto" className="logo-img logo-img--md" />
            <span className="landing-nav-logo-text">Verdicto</span>
          </Link>

          {/* Nav links (desktop + mobile) */}
          <div className={`landing-nav-links${mobileMenuOpen ? ' landing-nav-links--open' : ''}`}>
            <a href="#problem" className="landing-nav-link" onClick={() => setMobileMenuOpen(false)}>The Problem</a>
            <a href="#platform" className="landing-nav-link" onClick={() => setMobileMenuOpen(false)}>Products</a>
            <a href="#technology" className="landing-nav-link" onClick={() => setMobileMenuOpen(false)}>Technology</a>
            <a href="#audience" className="landing-nav-link" onClick={() => setMobileMenuOpen(false)}>Who It's For</a>
            <Link to="/dashboard" className="landing-cta-btn" onClick={() => setMobileMenuOpen(false)}>
              Open App <ArrowRight size={18} style={{ marginLeft: '4px' }} />
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
