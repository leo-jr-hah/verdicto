import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Shield, Zap, Users, TrendingUp } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { fetchContractState, type ContractState } from '../../services/api';

gsap.registerPlugin(ScrollTrigger);

const CAPABILITIES = [
  { title: 'HMAC Receipt Chains', desc: 'Every juror deliberation round is signed with HMAC-SHA256. Tamper with one receipt and the entire chain breaks.', icon: Shield },
  { title: 'ZK-Lite Commitments', desc: 'SHA-256 commitment of execution state anchored on-chain. Verify agents ran correctly without re-executing.', icon: Zap },
  { title: 'Adversarial Deliberation', desc: 'Two analysts, three jurors. Disagreements trigger multi-round peer review, not a simple average.', icon: Users },
  { title: 'x402 Micropayments', desc: 'Each product gated by a native CSPR transfer signed by the user wallet. Cryptographic proof of payment.', icon: TrendingUp },
];

export const TestnetProof: React.FC = () => {
  const [state, setState] = useState<ContractState | null>(null);
  const [loading, setLoading] = useState(true);
  const headlineRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      const data = await fetchContractState();
      setState(data);
      setLoading(false);
    };
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // GSAP text-reveal on the CTA headline
  useEffect(() => {
    if (!headlineRef.current) return;
    const words = headlineRef.current.querySelectorAll('.cta-word');
    if (words.length === 0) return;

    gsap.fromTo(words,
      { y: 20, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        stagger: 0.08,
        duration: 0.6,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: headlineRef.current,
          start: 'top 80%',
          once: true,
        },
      }
    );
  }, []);

  const assessments = state?.assessments?.total ?? 0;
  const receipts = state?.receipts?.total ?? 0;

  return (
    <section className="landing-section-dark landing-section-dark--d landing-blueprint">
      {/* CTA Terminal */}
      <div className="cta-terminal">
        <h2 ref={headlineRef} className="cta-terminal__headline">
          <span className="cta-word">Every</span>{' '}
          <span className="cta-word">Assessment.</span>{' '}
          <span className="cta-word">Cryptographically</span>{' '}
          <span className="cta-word">Proven.</span>
        </h2>
        <p className="cta-terminal__sub">
          Not "trust us" — verify it. Every AI assessment produces HMAC receipt chains
          and ZK-Lite commitments anchored to Casper L1. Four products, one verification layer.
        </p>
        <div className="cta-terminal__actions">
          <Link to="/dashboard" className="btn-primary" style={{ padding: '14px 28px', fontSize: 15 }}>
            Open Dashboard →
          </Link>
          <Link to="/architecture" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '14px 28px', fontSize: 15, fontWeight: 600,
            color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.12)',
            background: 'transparent', textDecoration: 'none',
            transition: 'all 0.2s',
          }}>
            Architecture
          </Link>
        </div>
      </div>

      {/* Live terminal + capabilities */}
      <div className="landing-section-dark__inner" style={{ paddingTop: 0 }}>
        <div className="testnet-dark">
          {/* Left: text + stats */}
          <div className="testnet-dark__text">
            <div className="landing-dark-header__tag" style={{ marginBottom: 'var(--space-4)' }}>
              <span>Live on Testnet</span>
            </div>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.55)', lineHeight: 1.65, margin: '0 0 var(--space-6)' }}>
              Every assessment, loan, and insurance policy is recorded on-chain with cryptographic receipts.
              The system runs autonomously — no human intervention required.
            </p>

            <div className="testnet-dark__caps">
              {CAPABILITIES.map((cap, i) => {
                const Icon = cap.icon;
                return (
                  <motion.div
                    key={cap.title}
                    className="testnet-dark__cap"
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.08 }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <Icon size={14} strokeWidth={1.5} style={{ color: 'var(--accent)' }} />
                      <div className="testnet-dark__cap-title">{cap.title}</div>
                    </div>
                    <p className="testnet-dark__cap-desc">{cap.desc}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Right: terminal */}
          <div className="testnet-dark__terminal">
            <div className="testnet-dark__terminal-box">
              <div className="testnet-dark__terminal-header">
                <div className="testnet-dark__terminal-dots">
                  <div className="testnet-dark__terminal-dot" />
                  <div className="testnet-dark__terminal-dot" />
                  <div className="testnet-dark__terminal-dot" />
                </div>
                <span className="testnet-dark__terminal-label">verdicto — live state</span>
              </div>
              <div className="testnet-dark__terminal-body">
                <div className="testnet-dark__terminal-row">
                  <span className="testnet-dark__terminal-label-col">network</span>
                  <span className="testnet-dark__terminal-value">casper-testnet</span>
                </div>
                <div className="testnet-dark__terminal-row">
                  <span className="testnet-dark__terminal-label-col">contracts</span>
                  <span className="testnet-dark__terminal-value">4 deployed</span>
                </div>
                <div className="testnet-dark__terminal-row">
                  <span className="testnet-dark__terminal-label-col">assessments</span>
                  <span className="testnet-dark__terminal-value">{loading ? '...' : assessments}</span>
                </div>
                <div className="testnet-dark__terminal-row">
                  <span className="testnet-dark__terminal-label-col">receipts</span>
                  <span className="testnet-dark__terminal-value">{loading ? '...' : receipts}</span>
                </div>
                <div className="testnet-dark__terminal-row">
                  <span className="testnet-dark__terminal-label-col">status</span>
                  <span className="testnet-dark__terminal-value">operational</span>
                </div>
                <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10 }}>
                    $ verdicto verify --all --receipts
                  </span>
                  <br />
                  <span style={{ color: 'var(--accent)', fontSize: 10 }}>
                    ✓ all receipts valid · chain intact · 0 tampered
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
