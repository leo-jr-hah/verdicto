import React, { useRef, useLayoutEffect } from 'react';
import { motion } from 'motion/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { BlockchainRecord } from './BlockchainRecord';

gsap.registerPlugin(ScrollTrigger);

export const HowItWorks: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!containerRef.current || !trackRef.current) return;

    const ctx = gsap.context(() => {
      // Horizontal scroll
      gsap.to(trackRef.current, {
        xPercent: -66.66,
        ease: 'none',
        scrollTrigger: {
          trigger: containerRef.current,
          pin: true,
          scrub: 1,
          end: '+=300%',
        }
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="how-it-works" ref={containerRef} style={{ height: '300vh', position: 'relative', background: 'var(--bg-main)' }}>
      <div style={{
        position: 'sticky',
        top: 0,
        height: '100vh',
        width: '100%',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
      }}>
        <div ref={trackRef} style={{
          display: 'flex',
          width: '300vw',
          height: '100%',
        }}>
          
          {/* Panel 1: Submit */}
          <div style={{ width: '100vw', height: '100%', display: 'flex', padding: '0 5vw', alignItems: 'center' }}>
            <div style={{ flex: 1, paddingRight: '4rem' }}>
              <div style={{ color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', marginBottom: '1rem' }}>01</div>
              <h2 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '1.5rem', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>File the Dispute</h2>
              <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 480 }}>
                Connect your Casper wallet and submit a real-world asset dispute. The Orchestrator Agent locks a 0.1 CSPR filing fee in the Escrow contract and begins coordination.
              </p>
            </div>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
              <div className="card" style={{ width: '100%', maxWidth: 400, boxShadow: '0 20px 40px rgba(0,0,0,0.05)' }}>
                <div style={{ width: '100%', height: 40, background: 'var(--bg-surface)', borderRadius: 8, marginBottom: 16 }} />
                <div style={{ width: '100%', height: 80, background: 'var(--bg-surface)', borderRadius: 8, marginBottom: 24 }} />
                <div className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                  Submit Dispute (0.1 CSPR)
                </div>
              </div>
            </div>
          </div>

          {/* Panel 2: Analyze */}
          <div style={{ width: '100vw', height: '100%', display: 'flex', padding: '0 5vw', alignItems: 'center' }}>
            <div style={{ flex: 1, paddingRight: '4rem' }}>
              <div style={{ color: '#3B82F6', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', marginBottom: '1rem' }}>02</div>
              <h2 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '1.5rem', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>Agent Deliberation</h2>
              <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 480 }}>
                Five independent AI agents receive the dispute data through isolated channels. Each agent pulls live market data, selects its methodology autonomously, and produces a valuation. No agent sees another's work.
              </p>
            </div>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', position: 'relative', height: 400 }}>
              <div className="card" style={{
                position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)',
                width: 60, height: 60, borderRadius: '50%', border: '2px solid var(--primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, padding: 0
              }}>
                <span style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-primary)' }}>ORCH</span>
              </div>
              {[
                { angle: 180, color: '#F59E0B' },
                { angle: 216, color: '#10B981' },
                { angle: 252, color: '#3B82F6' },
                { angle: 288, color: '#06B6D4' },
                { angle: 324, color: '#8B5CF6' }
              ].map((agent, i) => {
                const r = 140;
                const rad = agent.angle * (Math.PI / 180);
                const x = `calc(50% + ${Math.cos(rad) * r}px)`;
                const y = `calc(100% - 40px + ${Math.sin(rad) * r}px)`;
                return (
                  <motion.div key={i}
                    animate={{ boxShadow: [`0 0 0 rgba(0,0,0,0)`, `0 0 20px ${agent.color}`, `0 0 0 rgba(0,0,0,0)`] }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }}
                    className="card"
                    style={{
                      position: 'absolute', left: x, top: y, transform: 'translate(-50%, -50%)',
                      width: 48, height: 48, borderRadius: '50%', border: `2px solid ${agent.color}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0
                    }}
                  >
                    <span style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-primary)' }}>A{i+1}</span>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Panel 3: Settle */}
          <div style={{ width: '100vw', height: '100%', display: 'flex', padding: '0 5vw', alignItems: 'center' }}>
            <div style={{ flex: 1, paddingRight: '4rem' }}>
              <div style={{ color: '#10B981', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', marginBottom: '1rem' }}>03</div>
              <h2 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '1.5rem', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>On-Chain Verdict</h2>
              <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 480 }}>
                Juror agents deliberate and vote. The ReputationRegistry weights each vote by historical accuracy. The final verdict writes to the VotingContract on Casper testnet with an immutable deploy hash.
              </p>
            </div>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
              <BlockchainRecord />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
