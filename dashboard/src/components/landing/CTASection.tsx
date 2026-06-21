import React from 'react';
import { Link } from 'react-router-dom';
import { Reveal } from './UIComponents';

export const CTASection: React.FC = () => {
  return (
    <section style={{
      position: 'relative',
      width: '100%',
      padding: '120px 32px',
      textAlign: 'center',
      overflow: 'hidden'
    }}>
      {/* Background Gradient Orb */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 800,
        height: 800,
        background: 'radial-gradient(circle, rgba(255,59,59,0.1) 0%, rgba(139,92,246,0.05) 50%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(80px)',
        zIndex: 0,
        pointerEvents: 'none'
      }} />

      <div style={{ position: 'relative', zIndex: 10, maxWidth: 800, margin: '0 auto' }}>
        <Reveal direction="up" duration={0.6}>
          <h2 style={{
            fontSize: 'clamp(2rem, 4vw, 3.5rem)', fontWeight: 800, color: 'var(--text-primary)',
            marginBottom: '24px', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em'
          }}>
            Ready to get your first valuation?
          </h2>
          
          <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '40px' }}>
            Connect your Casper wallet and submit an asset in under 2 minutes. Two valuation agents and three jurors will analyze, deliberate, and deliver a verdict.
          </p>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/assess" className="btn btn-primary" style={{ padding: '16px 32px', fontSize: '1rem' }}>
              Start Assessment
            </Link>
            <Link to="/dashboard" className="btn" style={{ padding: '16px 32px', fontSize: '1rem', background: 'transparent' }}>
              View the Dashboard
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
};
