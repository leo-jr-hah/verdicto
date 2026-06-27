import React, { useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { Link } from 'react-router-dom';

const ROW1 = [
  {
    title: 'HMAC Receipt Chains',
    desc: 'Every juror signs each deliberation round with HMAC-SHA256. Receipts chain together, each linking to the previous via previousReceiptId. Tamper with one receipt and the entire chain breaks.',
    cta: 'Read the Docs',
    href: '/architecture',
  },
  {
    title: 'ZK-Lite Commitments',
    desc: 'After every assessment, a SHA-256 commitment of the full execution state is anchored on-chain. Anyone can verify the agents ran correctly without re-executing.',
    cta: 'View on-chain',
    href: '/transactions',
  },
];

const ROW2 = [
  {
    title: 'Adversarial Deliberation',
    desc: 'Two analysts produce independent valuations. Three jurors evaluate credibility, weighted by on-chain trust scores. Disagreements trigger multi-round peer review, not a simple average.',
    cta: 'See an Assessment',
    href: '/assess',
  },
  {
    title: 'x402 Pay-Per-Query',
    desc: 'Each oracle query is a native CSPR transfer signed by the user wallet. No API keys, no accounts, just a micropayment with cryptographic proof of authorization.',
    cta: 'Try it Live',
    href: '/dashboard',
  },
];

interface PanelData {
  title: string;
  desc: string;
  cta: string;
  href: string;
}

const Panel: React.FC<{ panel: PanelData; index: number }> = ({ panel, index }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : {}}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="primitive-panel"
    >
      <h3 className="primitive-panel__title">{panel.title}</h3>
      <p className="primitive-panel__desc">{panel.desc}</p>
      <Link to={panel.href} className="primitive-panel__cta">{panel.cta} →</Link>
    </motion.div>
  );
};

export const OracleSection: React.FC = () => {
  return (
    <section className="primitive-section landing-blueprint">
      <div className="primitive-row">
        {ROW1.map((panel, i) => (
          <Panel key={panel.title} panel={panel} index={i} />
        ))}
      </div>
      <div className="primitive-row">
        {ROW2.map((panel, i) => (
          <Panel key={panel.title} panel={panel} index={i} />
        ))}
      </div>
    </section>
  );
};
