import React, { useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { Link } from 'react-router-dom';
import { IconReceiptChain, IconCommitment, IconDeliberation, IconMicropayment } from './VerdictoIcons';

const HERO = {
  num: '01',
  title: 'HMAC Receipt Chains',
  desc: 'Every juror signs each deliberation round with HMAC-SHA256. Receipts chain together, each linking to the previous via previousReceiptId. Tamper with one receipt and the entire chain breaks. The full audit trail is publicly verifiable — not by trusting the operator, but by checking the math.',
  cta: 'Read the Architecture',
  href: '/architecture',
};

const MINORS = [
  {
    title: 'ZK-Lite Commitments',
    desc: 'SHA-256 of execution state anchored on-chain. Verify agents ran correctly without re-executing.',
    cta: 'View on-chain',
    href: '/transactions',
    Icon: IconCommitment,
  },
  {
    title: 'Adversarial Deliberation',
    desc: 'Two analysts, three jurors. Disagreements trigger multi-round peer review, not a simple average.',
    cta: 'See an Assessment',
    href: '/assess',
    Icon: IconDeliberation,
  },
  {
    title: 'x402 Pay-Per-Query',
    desc: 'Each query is a native CSPR transfer signed by the user wallet. No API keys, no accounts.',
    cta: 'Try it Live',
    href: '/dashboard',
    Icon: IconMicropayment,
  },
];

export const OracleSection: React.FC = () => {
  const sectionRef = useRef(null);
  const inView = useInView(sectionRef, { once: true, margin: '-60px' });

  return (
    <section ref={sectionRef} className="rb-section rb-primitives">
      <div className="rb-inner">
        {/* Section header */}
        <div style={{ marginBottom: 48 }}>
          <div className="rb-tag">Verification Primitives</div>
          <h2 className="rb-title">Four layers between you and "trust us"</h2>
          <p className="rb-subtitle">
            Every AI assessment produces cryptographic receipts, on-chain commitments,
            and adversarial deliberation records. Here's how each layer works.
          </p>
        </div>

        {/* Asymmetric layout: hero left, minors right */}
        <div className="rb-primitives__layout">
          {/* Left: hero feature */}
          <motion.div
            className="rb-hero-feature"
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="rb-hero-feature__num">{HERO.num}</div>
            <IconReceiptChain size={48} className="rb-hero-feature__icon" />
            <h3 className="rb-hero-feature__title">{HERO.title}</h3>
            <p className="rb-hero-feature__desc">{HERO.desc}</p>

            {/* Visual: receipt chain diagram */}
            <div className="rb-hero-feature__diagram">
              <div><span className="rb-dia-highlight">receipt_0</span> ← <span className="rb-dia-link">analyst_a_valuation</span></div>
              <div><span className="rb-dia-highlight">receipt_1</span> ← <span className="rb-dia-link">analyst_b_valuation</span> + <span className="rb-dia-highlight">receipt_0</span></div>
              <div><span className="rb-dia-highlight">receipt_2</span> ← <span className="rb-dia-link">juror_deliberation</span> + <span className="rb-dia-highlight">receipt_1</span></div>
              <div><span className="rb-dia-highlight">receipt_3</span> ← <span className="rb-dia-link">consensus_verdict</span> + <span className="rb-dia-highlight">receipt_2</span></div>
              <div style={{ marginTop: 8, color: 'rgba(255,255,255,0.2)' }}>─────────────────────────────</div>
              <div><span className="rb-dia-link">chain_hash</span> = SHA-256(receipt_0 ‖ receipt_1 ‖ receipt_2 ‖ receipt_3)</div>
            </div>

            <Link to={HERO.href} className="rb-hero-feature__link">{HERO.cta} →</Link>
          </motion.div>

          {/* Right: minor features list */}
          <div className="rb-minor-features">
            {MINORS.map((m, i) => (
              <motion.div
                key={m.title}
                className="rb-minor-feature"
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="rb-minor-feature__head">
                  <m.Icon size={20} className="rb-minor-feature__icon" />
                  <span className="rb-minor-feature__title">{m.title}</span>
                </div>
                <p className="rb-minor-feature__desc">{m.desc}</p>
                <Link to={m.href} className="rb-minor-feature__link">{m.cta} →</Link>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
