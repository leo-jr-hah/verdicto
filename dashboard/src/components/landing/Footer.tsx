import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => (
  <footer className="site-footer">
    <div className="footer-inner">
      <div className="footer-main">
        <span className="footer-brand">VERDICTO</span>
        <nav className="footer-nav">
          <Link to="/assess">Assess</Link>
          <Link to="/borrow">Borrow</Link>
          <Link to="/insure">Insure</Link>
          <Link to="/oracle">Oracle</Link>
          <Link to="/how-it-works">How It Works</Link>
        </nav>
      </div>
      <div className="footer-meta">
        <span>Live on Casper Testnet</span>
        <span>© 2026 Verdicto</span>
      </div>
    </div>
  </footer>
);
