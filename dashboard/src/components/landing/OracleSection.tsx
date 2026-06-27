import React, { useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { Radio, Zap, Shield, Globe, TrendingUp } from 'lucide-react';

const FEATURES = [
  {
    icon: <Radio size={22} />,
    title: 'Shared Data Layer',
    desc: 'Any Casper smart contract can query the Verdict Oracle directly. Fully on-chain, no external dependencies.',
  },
  {
    icon: <Zap size={22} />,
    title: '0.1 CSPR Per Query',
    desc: 'Micropayment per query, signed by the user wallet. Pay per query, on-chain, verifiable.',
  },
  {
    icon: <Shield size={22} />,
    title: 'Multi-Agent Consensus',
    desc: 'Each verdict is the output of multiple independent AI agents: valuation specialists and jurors, with cryptographic receipt chains proving nothing was altered.',
  },
  {
    icon: <Globe size={22} />,
    title: '24h Freshness Guarantee',
    desc: 'Every verdict has an expiry timestamp. Smart contracts can check `is_expired()` before using a price. Stale data is automatically rejected.',
  },
];

const USE_CASES = [
  { label: 'Lending Protocols', desc: 'Query asset value → calculate LTV → disburse loan', icon: <TrendingUp size={16} /> },
  { label: 'DAO Treasuries', desc: 'Verify RWA collateral before governance votes', icon: <Shield size={16} /> },
  { label: 'Insurance Contracts', desc: 'Price policies against oracle valuations', icon: <Shield size={16} /> },
  { label: 'Confidence Analysis', desc: 'Run multi-agent confidence scoring for RWA outcomes', icon: <TrendingUp size={16} /> },
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
    <section ref={ref} id="oracle" className="oracle-section">
      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7 }}
        className="landing-section__header"
      >
        <div className="landing-badge landing-badge--red">
          <Radio size={14} style={{ color: 'var(--red-600)' }} />
          <span>Composable Primitive</span>
        </div>
        <h2 className="landing-section__title">The Oracle for Real-World Assets</h2>
        <p className="landing-section__subtitle">
          Verdict Oracle stores multi-agent consensus valuations on-chain.
          Verdicto powers its own Borrow and Insure products using the same data.
          Any Casper dApp can query the Oracle directly.
        </p>
      </motion.div>

      {/* Feature Grid */}
      <div className="oracle-features-grid">
        {FEATURES.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 + i * 0.08 }}
            className="card oracle-feature-card"
          >
            <div className="oracle-feature-icon" style={{ background: 'var(--primary-bg)', color: 'var(--red-600)' }}>
              {f.icon}
            </div>
            <h3 className="oracle-feature-title">{f.title}</h3>
            <p className="oracle-feature-desc">{f.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* Use Cases */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="oracle-use-cases"
      >
        <h3 className="oracle-use-cases__title">Who Uses the Oracle?</h3>
        <div className="oracle-use-cases__grid">
          {USE_CASES.map((uc, i) => (
            <motion.div
              key={uc.label}
              initial={{ opacity: 0, y: 10 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.5 + i * 0.08 }}
              className="oracle-use-case"
            >
              <div className="oracle-use-case__icon">{uc.icon}</div>
              <div>
                <div className="oracle-use-case__label">{uc.label}</div>
                <div className="oracle-use-case__desc">{uc.desc}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Code Snippet */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="oracle-code-card"
      >
        <div className="oracle-code-card__header">
          <span className="oracle-code-card__dot" />
          <span className="oracle-code-card__dot" />
          <span className="oracle-code-card__dot" />
          <span className="oracle-code-card__filename">oracle_query.rs</span>
        </div>
        <pre className="oracle-code-card__pre">
          <code>{CODE_SNIPPET}</code>
        </pre>
      </motion.div>
    </section>
  );
};
