import React, { useRef } from 'react';
import { motion, useInView } from 'motion/react';

const ROW1 = [
  {
    num: '// 01',
    title: 'HMAC Receipt Chains',
    desc: 'Every juror signs each deliberation round with HMAC-SHA256. Receipts chain together, each linking to the previous via previousReceiptId. Tamper with one receipt and the entire chain breaks.',
  },
  {
    num: '// 02',
    title: 'ZK-Lite Commitments',
    desc: 'After every assessment, a SHA-256 commitment of the full execution state — input, agent state, Casper block height — is anchored on-chain. Anyone can verify the agents ran correctly without re-executing.',
  },
];

const ROW2 = [
  {
    num: '// 03',
    title: 'Adversarial Deliberation',
    desc: 'Two analysts produce independent valuations. Three jurors evaluate credibility, weighted by on-chain trust scores. Disagreements trigger multi-round peer review, not a simple average.',
  },
  {
    num: '// 04',
    title: 'x402 Pay-Per-Query',
    desc: 'Each oracle query is a native CSPR transfer signed by the user wallet. No API keys, no accounts, just a micropayment with cryptographic proof of authorization.',
  },
];

interface CardData {
  num: string;
  title: string;
  desc: string;
}

const FeatureCard: React.FC<{ card: CardData; index: number; row: number }> = ({ card, index, row }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.12 }}
      className={`oracle-stack-card oracle-stack-card--row${row}`}
    >
      <span className="oracle-stack-card__num">{card.num}</span>
      <h3 className="oracle-stack-card__title">{card.title}</h3>
      <p className="oracle-stack-card__desc">{card.desc}</p>
    </motion.div>
  );
};

export const OracleSection: React.FC = () => {
  const headerRef = useRef(null);
  const headerInView = useInView(headerRef, { once: true, margin: '-100px' });

  return (
    <section className="oracle-stack-section">
      {/* Section Header */}
      <motion.div
        ref={headerRef}
        initial={{ opacity: 0, y: 30 }}
        animate={headerInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7 }}
        className="oracle-stack-header"
      >
        <span className="oracle-stack-header__eyebrow">Composable Primitive</span>
        <h2 className="oracle-stack-header__title">Cryptographically Verifiable AI</h2>
        <p className="oracle-stack-header__subtitle">
          Every assessment produces HMAC receipt chains and ZK-Lite commitments.
          Not &ldquo;trust us&rdquo;, verify it yourself on Casper.
        </p>
      </motion.div>

      {/* Sticky Stack: Row 1 */}
      <div className="oracle-stack-spacer">
        <div className="oracle-stack-row oracle-stack-row--1">
          {ROW1.map((card, i) => (
            <FeatureCard key={card.title} card={card} index={i} row={1} />
          ))}
        </div>
      </div>

      {/* Sticky Stack: Row 2 — overlays Row 1 */}
      <div className="oracle-stack-spacer oracle-stack-spacer--last">
        <div className="oracle-stack-row oracle-stack-row--2">
          {ROW2.map((card, i) => (
            <FeatureCard key={card.title} card={card} index={i} row={2} />
          ))}
        </div>
      </div>
    </section>
  );
};
