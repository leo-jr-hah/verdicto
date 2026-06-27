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
        <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center' }}>
          <a href="https://x.com/Verdictoxyz" target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>X</a>
          <a href="https://github.com/leo-jr-hah/verdicto" target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>GitHub</a>
          <span>© 2026 Verdicto</span>
        </div>
      </div>
    </div>
  </footer>
);
