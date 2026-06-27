import React, { useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { Radio, Zap, Shield, Globe, TrendingUp } from 'lucide-react';

const FEATURES = [
  {
    icon: <Radio size={20} />,
    title: 'HMAC Receipt Chains',
    desc: 'Every juror signs each deliberation round with HMAC-SHA256. Receipts chain together — each links to the previous via `previousReceiptId`. Tamper with one receipt and the entire chain breaks.',
  },
  {
    icon: <Zap size={20} />,
    title: 'ZK-Lite Commitments',
    desc: 'After every assessment, a SHA-256 commitment of the full execution state (input, agent state, Casper block height) is anchored on-chain. Anyone can verify the agents ran correctly without re-executing.',
  },
  {
    icon: <Shield size={20} />,
    title: 'Adversarial Deliberation',
    desc: 'Two analysts produce independent valuations. Three jurors evaluate credibility, weighted by on-chain trust scores. Disagreements trigger multi-round peer review — not a simple average.',
  },
  {
    icon: <Globe size={20} />,
    title: 'x402 Pay-Per-Query',
    desc: 'Each oracle query is a native CSPR transfer signed by the user wallet. No API keys, no accounts — just a micropayment with cryptographic proof of authorization.',
  },
];

const USE_CASES = [
  { label: 'Lending Protocols', desc: 'Query verified valuation → calculate LTV → disburse loan', icon: <TrendingUp size={16} /> },
  { label: 'DAO Treasuries', desc: 'Verify RWA collateral with tamper-proof receipts', icon: <Shield size={16} /> },
  { label: 'Insurance Contracts', desc: 'Price policies against cryptographically committed valuations', icon: <Shield size={16} /> },
  { label: 'Dispute Resolution', desc: 'Challenge verdicts — re-trials produce new HMAC chains', icon: <TrendingUp size={16} /> },
];

const CODE_SNIPPET = `// Every assessment produces a verifiable receipt chain
let verdict = oracle.get_verdict("ASSESS-1719000000000");

// Verify HMAC chain integrity — each receipt links to the previous
for receipt in verdict.receipts {
    assert(verify_hmac(receipt, juror_key));
    assert(receipt.prev == prev_receipt_id);
}

// Verify ZK-Lite commitment matches on-chain anchor
let commitment = sha256(verdict.input + verdict.agent_state
    + verdict.block_height + verdict.timestamp);
assert(commitment == oracle.get_commitment(asset_id));

// Now safe to use — agents ran correctly, nothing was altered
let ltv = calculate_ltv(verdict.value, loan_amount);`;

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
          <Radio size={16} style={{ color: 'var(--red-600)' }} />
          <span>Composable Primitive</span>
        </div>
        <h2 className="landing-section__title">Cryptographically Verifiable AI</h2>
        <p className="landing-section__subtitle">
          Every assessment produces HMAC receipt chains and ZK-Lite commitments.
          Not "trust us" — verify it yourself on Casper.
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
            <div className="oracle-feature-icon" style={{ background: 'var(--accent-soft)', color: 'var(--red-600)' }}>
              {f.icon}
            </div>
            <h3 className="oracle-feature-title">{f.title}</h3>
            <p className="oracle-feature-desc">{f.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* Use Cases + Code — side by side */}
      <div className="oracle-bottom-grid">
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
          transition={{ duration: 0.6, delay: 0.5 }}
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
      </div>
    </section>
  );
};
