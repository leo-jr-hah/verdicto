import React from 'react';
import { Link } from 'react-router-dom';

const FOOTER_LINKS = [
  { label: 'Assess', to: '/assess' },
  { label: 'Borrow', to: '/borrow' },
  { label: 'Insure', to: '/insure' },
  { label: 'Oracle', to: '/oracle' },
  { label: 'How It Works', to: '/how-it-works' },
];

export const Footer: React.FC = () => (
  <footer className="site-footer">
    <div className="footer-inner">
      <div className="footer-main">
        <span className="footer-brand">VERDICTO</span>
        <nav className="footer-nav">
          {FOOTER_LINKS.map((link) => (
            <Link key={link.to} to={link.to}>{link.label}</Link>
          ))}
        </nav>
      </div>
      <div className="footer-bottom">
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
