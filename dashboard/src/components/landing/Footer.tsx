import React from 'react';
import { Link } from 'react-router-dom';
import verdictLogo from '../../assets/Verdict logo.jpeg';

export const Footer: React.FC = () => {
  return (
    <footer style={{ width: '100%', borderTop: '1px solid var(--border-color)', background: 'var(--bg-main)', padding: '48px 32px' }}>
      <div className="footer-grid" style={{ maxWidth: 1440, margin: '0 auto', display: 'grid', gap: '48px' }}>
        
        {/* Brand */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <img
              src={verdictLogo}
              alt="Verdict"
              style={{ width: '28px', height: '28px', borderRadius: '6px', objectFit: 'cover' }}
            />
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
              Verdict
            </span>
          </div>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '16px' }}>
            Autonomous dispute resolution for tokenized Real World Assets.
          </p>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
            Built for the Casper Agentic Buildathon 2026
          </div>
        </div>

        {/* Product */}
        <div>
          <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '20px' }}>Product</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {['/assess', '/predict', '/reputation', '/transactions'].map((path) => (
              <Link key={path} to={path} className="footer-link" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.15s ease' }}>
                {path.replace('/', '').charAt(0).toUpperCase() + path.slice(2)}
              </Link>
            ))}
          </div>
        </div>

        {/* Resources */}
        <div>
          <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '20px' }}>Resources</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Link to="/architecture" className="footer-link" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.15s ease' }}>Architecture</Link>
            <Link to="/roadmap" className="footer-link" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.15s ease' }}>Roadmap</Link>
            <a href="https://docs.casper.network" target="_blank" rel="noopener noreferrer" className="footer-link" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.15s ease' }}>Casper Docs</a>
          </div>
        </div>

        {/* Connect */}
        <div>
          <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '20px' }}>Connect</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <a href="https://github.com/casper-network" target="_blank" rel="noopener noreferrer" className="footer-link" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.15s ease' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.03c3.15-.38 6.5-1.4 6.5-7.17A5.04 5.04 0 0 0 19 4.81 4.3 4.3 0 0 0 19 1a5.04 5.04 0 0 0-5 2.19 14.1 14.1 0 0 0-4 0A5.04 5.04 0 0 0 5 1a4.3 4.3 0 0 0 0 3.81 5.04 5.04 0 0 0-1.5 2.97c0 5.76 3.35 6.78 6.5 7.16A4.8 4.8 0 0 0 9 18v4"></path></svg> GitHub
            </a>
            <a href="https://testnet.cspr.live" target="_blank" rel="noopener noreferrer" className="footer-link" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.15s ease' }}>Testnet Explorer</a>
            <a href="https://dorahacks.io/hackathon/casper-agentic-buildathon" target="_blank" rel="noopener noreferrer" className="footer-link" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.15s ease' }}>DoraHacks</a>
          </div>
        </div>

      </div>
    </footer>
  );
};
