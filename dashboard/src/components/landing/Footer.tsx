import React from 'react';
import { Link } from 'react-router-dom';
import verdictLogo from '../../assets/logo.jpeg';

export const Footer: React.FC = () => {
  return (
    <footer style={{ width: '100%', borderTop: '1px solid var(--border-color)', background: 'var(--bg-main)', padding: '48px 32px 32px' }}>
      <div style={{ maxWidth: 1440, margin: '0 auto' }}>
        {/* Top row: Logo + columns */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '40px' }}>
          {/* Brand */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '240px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img src={verdictLogo} alt="Verdicto" style={{ width: '28px', height: '28px', borderRadius: '6px', objectFit: 'cover' }} />
              <span style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>Verdicto</span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              AI-powered RWA oracle on Casper blockchain.
            </p>
          </div>

          {/* Link columns */}
          <div style={{ display: 'flex', gap: '48px', flexWrap: 'wrap' }}>
            {/* Product */}
            <div>
              <h4 style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '16px' }}>Product</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <Link to="/assess" className="footer-link" style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.15s ease' }}>Value Asset</Link>
                <Link to="/oracle" className="footer-link" style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.15s ease' }}>Oracle</Link>
                <Link to="/borrow" className="footer-link" style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.15s ease' }}>Borrow</Link>
                <Link to="/insure" className="footer-link" style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.15s ease' }}>Insure</Link>
                <Link to="/predict" className="footer-link" style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.15s ease' }}>Predict</Link>
                <Link to="/reputation" className="footer-link" style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.15s ease' }}>Agents</Link>
                <Link to="/transactions" className="footer-link" style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.15s ease' }}>History</Link>
              </div>
            </div>

            {/* Resources */}
            <div>
              <h4 style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '16px' }}>Resources</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <Link to="/architecture" className="footer-link" style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.15s ease' }}>Architecture</Link>
                <Link to="/roadmap" className="footer-link" style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.15s ease' }}>Roadmap</Link>
                <a href="https://docs.casper.network" target="_blank" rel="noopener noreferrer" className="footer-link" style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.15s ease' }}>Casper Docs</a>
              </div>
            </div>

            {/* Connect */}
            <div>
              <h4 style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '16px' }}>Connect</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <a href="https://github.com/leo-jr-hah/casper-rwa-court" target="_blank" rel="noopener noreferrer" className="footer-link" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.15s ease' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.03c3.15-.38 6.5-1.4 6.5-7.17A5.04 5.04 0 0 0 19 4.81 4.3 4.3 0 0 0 19 1a5.04 5.04 0 0 0-5 2.19 14.1 14.1 0 0 0-4 0A5.04 5.04 0 0 0 5 1a4.3 4.3 0 0 0 0 3.81 5.04 5.04 0 0 0-1.5 2.97c0 5.76 3.35 6.78 6.5 7.16A4.8 4.8 0 0 0 9 18v4"></path></svg>
                  GitHub
                </a>
                <a href="https://testnet.cspr.live" target="_blank" rel="noopener noreferrer" className="footer-link" style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.15s ease' }}>Testnet Explorer</a>
              </div>
            </div>
          </div>
        </div>


      </div>
    </footer>
  );
};
