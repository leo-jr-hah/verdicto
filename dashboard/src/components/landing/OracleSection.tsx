import React, { useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { Radio, Zap, Shield, Globe, ArrowRight, Code, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

const FEATURES = [
  {
    icon: <Radio size={22} />,
    title: 'Cross-Contract Composable',
    desc: 'Any Casper smart contract can query the Verdict Oracle via cross-contract call. No off-chain API, no middleware, no trust assumptions beyond the blockchain itself.',
    color: '#8B5CF6',
  },
  {
    icon: <Zap size={22} />,
    title: '0.1 CSPR Per Query',
    desc: 'Agent-to-agent micropayment. No API keys, no subscriptions, no rate limits. Pay per query, on-chain, verifiable.',
    color: '#F59E0B',
  },
  {
    icon: <Shield size={22} />,
    title: 'Multi-Agent Consensus',
    desc: 'Each verdict is the output of 5 independent AI agents: 2 valuation specialists and 3 jurors, with cryptographic receipt chains proving nothing was altered.',
    color: '#10B981',
  },
  {
    icon: <Globe size={22} />,
    title: '24h Freshness Guarantee',
    desc: 'Every verdict has an expiry timestamp. Smart contracts can check `is_expired()` before using a price. Stale data is automatically rejected.',
    color: '#06B6D4',
  },
];

const USE_CASES = [
  { label: 'Lending Protocols', desc: 'Query asset value → calculate LTV → disburse loan', icon: <TrendingUp size={16} /> },
  { label: 'DAO Treasuries', desc: 'Verify RWA collateral before governance votes', icon: <Shield size={16} /> },
  { label: 'Insurance Contracts', desc: 'Price policies against oracle valuations', icon: <Shield size={16} /> },
  { label: 'Prediction Markets', desc: 'Resolve RWA-based markets with oracle data', icon: <TrendingUp size={16} /> },
];

const CODE_SNIPPET = `// Cross-contract call from any Casper dApp
let verdict = oracle.get_verdict("ASSESS-1719000000000");

// Enforce staleness: expired verdicts rejected contract-side
if oracle.is_expired(asset_id) {
    revert("Verdict expired - request fresh assessment");
}

if verdict.confidence >= 80 {
    let ltv = calculate_ltv(verdict.value, loan_amount);
    disburse_loan(loan_amount, collateral);
}`;

export const OracleSection: React.FC = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section
      ref={ref}
      id="oracle"
      style={{
        padding: '6rem 2rem',
        maxWidth: 1200,
        margin: '0 auto',
      }}
    >
      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7 }}
        style={{ textAlign: 'center', marginBottom: '4rem' }}
      >
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
          background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)',
          padding: '0.375rem 1rem', borderRadius: '999px', marginBottom: '1.5rem',
        }}>
          <Radio size={14} style={{ color: '#8B5CF6' }} />
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#8B5CF6', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Composable Primitive
          </span>
        </div>
        <h2 style={{
          fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, lineHeight: 1.1,
          letterSpacing: '-0.03em', color: 'var(--text-primary)', margin: '0 0 1rem',
          fontFamily: 'var(--font-display)',
        }}>
          The GPS for Asset Prices
        </h2>
        <p style={{
          fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: 1.65,
          maxWidth: 600, margin: '0 auto',
        }}>
          Verdict Oracle stores multi-agent consensus valuations on-chain.
          We built it and are our own first integrator, powering Borrow and Insure.
          Any future dApp can compose with the same data.
        </p>
      </motion.div>

      {/* Feature Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '1.25rem',
        marginBottom: '3.5rem',
      }}>
        {FEATURES.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 + i * 0.08 }}
            className="card"
            style={{
              padding: '1.5rem',
              display: 'flex', flexDirection: 'column', gap: '0.75rem',
            }}
          >
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: `${f.color}12`, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              color: f.color,
            }}>
              {f.icon}
            </div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              {f.title}
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0 }}>
              {f.desc}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Code + Use Cases Row */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, delay: 0.4 }}
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1.5rem',
          marginBottom: '3rem',
        }}
        className="oracle-bottom-grid"
      >
        {/* Code Snippet */}
        <div className="card" style={{ padding: '1.5rem', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Code size={16} style={{ color: '#8B5CF6' }} />
            <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
              Query the Oracle
            </span>
          </div>
          <pre style={{
            margin: 0, padding: '1rem', borderRadius: 8,
            background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
            fontSize: '0.8rem', lineHeight: 1.6, overflow: 'auto',
            color: 'var(--text-primary)', fontFamily: "'SF Mono', 'Fira Code', monospace",
          }}>
            {CODE_SNIPPET}
          </pre>
        </div>

        {/* Use Cases */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Globe size={16} style={{ color: '#06B6D4' }} />
            <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
              Use Cases
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {USE_CASES.map((uc) => (
              <div key={uc.label} style={{
                display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                padding: '0.75rem', borderRadius: 8,
                background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
              }}>
                <div style={{ color: '#8B5CF6', marginTop: 2, flexShrink: 0 }}>{uc.icon}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: 2 }}>
                    {uc.label}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {uc.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5, delay: 0.6 }}
        style={{ textAlign: 'center' }}
      >
        <Link
          to="/oracle"
          className="btn btn-primary"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.875rem 1.75rem', fontSize: '0.95rem',
            textDecoration: 'none',
          }}
        >
          Explore the Oracle Dashboard <ArrowRight size={16} />
        </Link>
      </motion.div>
    </section>
  );
};
