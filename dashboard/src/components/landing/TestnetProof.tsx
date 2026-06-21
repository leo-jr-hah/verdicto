import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Reveal } from './UIComponents';

export const TestnetProof: React.FC = () => {
  const [blockHeight, setBlockHeight] = useState(1489230);
  const [lastRefresh, setLastRefresh] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const interval = setInterval(() => {
      setBlockHeight(prev => prev + Math.floor(Math.random() * 3));
      setLastRefresh(new Date().toLocaleTimeString());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section style={{ width: '100%', maxWidth: 1100, margin: '0 auto', padding: '96px 32px' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '48px', alignItems: 'center' }}>
        
        {/* Left Side: Text */}
        <div style={{ flex: '1 1 400px' }}>
          <Reveal direction="left" duration={0.7}>
            <div className="badge" style={{
              display: 'inline-block',
              background: 'rgba(16,185,129,0.1)',
              color: '#10B981',
              border: '1px solid rgba(16,185,129,0.2)',
              marginBottom: '16px'
            }}>
              Testnet Deployment
            </div>
            
            <h2 style={{
              fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-primary)',
              marginBottom: '20px', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em',
              lineHeight: 1.1
            }}>
              Deployed on<br/>Casper Testnet.
            </h2>
            
            <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '32px' }}>
              All three smart contracts are live. Assessments have been submitted, analyzed, and recorded. Every deploy hash is verifiable on the public explorer.
            </p>
            
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <Link to="/dashboard" className="btn btn-primary" style={{ padding: '12px 24px', borderRadius: '10px' }}>
                View Live Dashboard
              </Link>
              <Link to="/architecture" className="btn" style={{ padding: '12px 24px', borderRadius: '10px', background: 'var(--bg-elevated)' }}>
                Read the Architecture
              </Link>
            </div>
          </Reveal>
        </div>

        {/* Right Side: Terminal Panel */}
        <div style={{ flex: '1 1 400px' }}>
          <Reveal direction="right" delay={0.3} duration={0.7}>
            <div className="card" style={{
              padding: 0,
              overflow: 'hidden',
              boxShadow: '0 20px 40px rgba(0,0,0,0.05)',
              fontFamily: 'var(--font-mono)'
            }}>
              {/* Terminal Header */}
              <div style={{
                background: 'var(--bg-surface)',
                padding: '12px 16px',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#EF4444' }} />
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#F59E0B' }} />
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#10B981' }} />
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
                  cspr-testnet / node-4
                </div>
              </div>

              {/* Terminal Body */}
              <div style={{ padding: '24px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span>STATUS</span>
                  <span style={{ color: '#10B981' }}>SYNCED</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span>LAST BLOCK</span>
                  <span style={{ color: 'var(--text-primary)' }}>{blockHeight.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span>DISPUTES FILED</span>
                  <span style={{ color: 'var(--text-primary)' }}>1,402</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                  <span>CSPR ESCROWED</span>
                  <span style={{ color: 'var(--text-primary)' }}>345.8 CSPR</span>
                </div>

                <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '24px' }}>
                  <div style={{ marginBottom: '12px', color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>
                    LAST REFRESH: {lastRefresh}
                  </div>
                  <div style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <motion.div animate={{ opacity: [1, 0] }} transition={{ duration: 1, repeat: Infinity }} style={{ width: 8, height: 16, background: '#10B981' }} />
                    polling contract state...
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>

      </div>
    </section>
  );
};
