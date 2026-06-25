import React from 'react';
import { Link } from 'react-router-dom';
import verdictLogo from '../../assets/logo.jpeg';

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

            {/* Social */}
            <div className="landing-footer-full__column">
              <h4>Social</h4>
              <div className="landing-footer-full__links">
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="footer-link">Twitter / X</a>
                <a href="https://discord.gg" target="_blank" rel="noopener noreferrer" className="footer-link">Discord</a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="landing-footer-full__bottom">
          <span className="landing-footer-full__copyright">© 2026 Verdicto. Built on Casper.</span>
          <span>Testnet only — not financial advice</span>
        </div>
      </div>
    </footer>
  );
};
