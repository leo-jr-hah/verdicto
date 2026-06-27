import React from 'react';
import { Link } from 'react-router-dom';
import verdictLogo from '../../assets/logo.jpeg';

/* ── SVG Icons (inline, no deps) ──────────────────────────────────── */
const XIcon: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const GitHubIcon: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

export const Footer: React.FC = () => {
  return (
    <footer className="landing-footer-full">
      <div className="landing-footer-full__container">
        {/* Top row: Logo + columns */}
        <div className="landing-footer-full__top">
          {/* Brand */}
          <div className="landing-footer-full__brand">
            <div className="landing-footer-full__brand-row">
              <img src={verdictLogo} alt="Verdicto" className="logo-img logo-img--sm" />
              <span className="landing-footer-full__brand-name">Verdicto</span>
            </div>
            <p className="landing-footer-full__brand-desc">
              AI-powered RWA oracle on Casper blockchain.
            </p>

            {/* Social icons row */}
            <div className="footer-social-row">
              <a
                href="https://x.com/Verdictoxyz"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-social-icon"
                aria-label="Follow on X"
              >
                <XIcon size={16} />
              </a>
              <a
                href="https://github.com/leo-jr-hah/verdicto"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-social-icon"
                aria-label="View on GitHub"
              >
                <GitHubIcon size={16} />
              </a>
            </div>
          </div>

          {/* Link columns */}
          <div className="landing-footer-full__columns">
            {/* Product */}
            <div className="landing-footer-full__column">
              <h4>Product</h4>
              <div className="landing-footer-full__links">
                <Link to="/assess" className="footer-link">Value Asset</Link>
                <Link to="/oracle" className="footer-link">Oracle</Link>
                <Link to="/borrow" className="footer-link">Borrow</Link>
                <Link to="/insure" className="footer-link">Insure</Link>
                <Link to="/confidence" className="footer-link">Confidence</Link>
                <Link to="/reputation" className="footer-link">Agents</Link>
                <Link to="/transactions" className="footer-link">History</Link>
              </div>
            </div>

            {/* Resources */}
            <div className="landing-footer-full__column">
              <h4>Resources</h4>
              <div className="landing-footer-full__links">
                <Link to="/architecture" className="footer-link">Architecture</Link>
                <Link to="/roadmap" className="footer-link">Roadmap</Link>
                <a href="https://docs.casper.network" target="_blank" rel="noopener noreferrer" className="footer-link">Casper Docs</a>
                <a href="https://github.com/leo-jr-hah/verdicto" target="_blank" rel="noopener noreferrer" className="footer-link">GitHub</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
