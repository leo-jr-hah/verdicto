import React from 'react';
import { motion } from 'motion/react';
import { Reveal } from './UIComponents';
import { CheckCircle2 } from 'lucide-react';

export const X402PaymentFlow: React.FC = () => {
  return (
    <section style={{ width: '100%', background: 'var(--bg-main)', padding: '96px 32px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '48px', alignItems: 'center' }}>
        
        {/* Left Side: Text */}
        <div style={{ flex: '1 1 400px' }}>
          <Reveal direction="left" duration={0.7}>
            <div className="badge" style={{
              background: 'rgba(255,59,59,0.1)',
              color: 'var(--primary)',
              border: '1px solid rgba(255,59,59,0.2)',
              marginBottom: '16px'
            }}>
              x402 Protocol
            </div>
            
            <h2 style={{
              fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-primary)',
              marginBottom: '20px', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em',
              lineHeight: 1.1
            }}>
              Real CSPR.<br/>Real Agents.<br/>Real Payments.
            </h2>
            
            <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '24px' }}>
              The Orchestrator creates native CSPR transfer deploys for every agent request. Each agent validates the cryptographic proof before responding. No credits. No promises. On-chain settlement for every API call.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                '0.03 CSPR per juror per dispute',
                'HMAC-signed receipt chain',
                'Verifiable on testnet.cspr.live'
              ].map((text, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <CheckCircle2 size={18} color="var(--primary)" />
                  <span style={{ fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: 500 }}>{text}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>

        {/* Right Side: Animated Diagram */}
        <div style={{ flex: '1 1 400px', display: 'flex', justifyContent: 'center' }}>
          <Reveal direction="right" delay={0.3} duration={0.7}>
            <div className="card" style={{
              position: 'relative',
              width: 320,
              height: 440,
              padding: '32px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.05)',
            }}>
              {/* Central connecting line */}
              <div style={{ position: 'absolute', left: '50%', top: 60, bottom: 60, width: 2, background: 'var(--border-color)', transform: 'translateX(-50%)' }} />

              <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 10 }}>
                {/* Traveling CSPR Coin (Down) */}
                <motion.g
                  animate={{ y: [60, 180, 300, 60] }}
                  transition={{ duration: 6, times: [0, 0.33, 0.66, 1], repeat: Infinity, ease: 'easeInOut' }}
                >
                  <circle cx="160" cy="0" r="10" fill="var(--primary)" />
                  <text x="160" y="3" fontSize="10" fill="white" textAnchor="middle" dominantBaseline="middle" fontWeight="bold">C</text>
                </motion.g>

                {/* Traveling Data Packet (Up) */}
                <motion.g
                  animate={{ y: [300, 180, 60, 300] }}
                  transition={{ duration: 6, times: [0, 0.33, 0.66, 1], repeat: Infinity, ease: 'easeInOut' }}
                >
                  <rect x="152" y="-8" width="16" height="16" rx="4" fill="#3B82F6" />
                  <path d="M156 0 L164 0 M156 4 L162 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                </motion.g>
              </svg>

              {/* Nodes */}
              <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', zIndex: 5 }}>
                {[
                  { label: 'User Wallet', color: '#9CA3AF' },
                  { label: 'Orchestrator', color: 'var(--primary)' },
                  { label: 'Agent MCP Server', color: '#3B82F6' },
                  { label: 'Agent Response', color: '#10B981' }
                ].map((node, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'center' }}>
                    <div className="card" style={{
                      border: `2px solid ${node.color}`,
                      padding: '10px 20px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      minWidth: 160,
                      textAlign: 'center'
                    }}>
                      {node.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>

      </div>
    </section>
  );
};
