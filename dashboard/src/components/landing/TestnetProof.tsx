import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Reveal } from './UIComponents';
import { fetchContractState, type ContractState } from '../../services/api';
import { Shield, Scale, TrendingUp, Zap } from 'lucide-react';

const CAPABILITIES = [
  {
    icon: <Scale size={20} />,
    title: 'HMAC Receipt Chains',
    desc: 'Every juror deliberation round is signed with HMAC-SHA256. Receipts chain together — each links to the previous via `previousReceiptId`. Tamper with one and the entire chain breaks.',
  },
  {
    icon: <Shield size={20} />,
    title: 'ZK-Lite Commitments',
    desc: 'After every assessment, a SHA-256 commitment of the execution state (input, agent state, Casper block height) is anchored on-chain. Verify the agents ran correctly without re-executing.',
  },
  {
    icon: <TrendingUp size={20} />,
    title: 'Adversarial Deliberation',
    desc: 'Two analysts produce independent valuations. Three jurors evaluate credibility with peer review. Disagreements trigger multi-round deliberation — not a simple average.',
  },
  {
    icon: <Zap size={20} />,
    title: 'x402 Micropayments',
    desc: 'Each product is gated by a native CSPR transfer signed by the user wallet. No API keys, no accounts — just cryptographic proof of payment.',
  },
];

export const TestnetProof: React.FC = () => {
  const [state, setState] = useState<ContractState | null>(null);
  const [loading, setLoading] = useState(true);

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

  const assessments = state?.assessments?.total ?? 0;
  const receipts = state?.receipts?.total ?? 0;

  return (
    <section className="testnet-section">
      <div className="testnet-layout">
        {/* Left Side: Text */}
        <div className="testnet-text">
          <Reveal direction="left" duration={0.7}>
            <div className="landing-badge landing-badge--green">
              Live on Testnet
            </div>
            <h2 className="landing-section__title" style={{ textAlign: 'left', marginBottom: '20px' }}>
              Every Assessment.<br/>Cryptographically Proven.
            </h2>
            <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '32px' }}>
              Not "trust us" — verify it. Every AI assessment produces HMAC receipt chains
              and ZK-Lite commitments anchored to Casper L1. Tamper with any step and the
              cryptographic proof breaks. Four products, one verification layer.
            </p>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <Link to="/dashboard" className="btn btn-primary" style={{ padding: '12px 24px', borderRadius: '10px' }}>
                View Dashboard
              </Link>
              <Link to="/architecture" className="btn" style={{ padding: '12px 24px', borderRadius: '10px', background: 'var(--bg-elevated)' }}>
                Architecture
              </Link>
            </div>
          </Reveal>
        </div>

        {/* Right Side: Capabilities Grid */}
        <div className="testnet-terminal-wrap">
          <Reveal direction="right" delay={0.3} duration={0.7}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {CAPABILITIES.map((cap, i) => (
                <motion.div
                  key={cap.title}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 + i * 0.1 }}
                  className="card"
                  style={{
                    padding: '1.25rem',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-elevated)',
                  }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: '8px',
                    background: 'var(--accent-soft)', color: 'var(--red-600)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: '0.75rem',
                  }}>
                    {cap.icon}
                  </div>
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
                    {cap.title}
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                    {cap.desc}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* Live stats bar */}
            <div style={{
              marginTop: '12px', padding: '12px 16px',
              background: 'var(--bg-sunken)', borderRadius: '10px',
              border: '1px solid var(--border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              fontSize: '0.78rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: loading ? 'var(--text-tertiary)' : 'var(--success)',
                }} />
                <span style={{ color: 'var(--text-tertiary)' }}>
                  {loading ? 'Connecting...' : 'Synced to testnet'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '16px', color: 'var(--text-secondary)' }}>
                <span>{loading ? '—' : assessments} assessments</span>
                <span>{loading ? '—' : receipts} receipts</span>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
};
