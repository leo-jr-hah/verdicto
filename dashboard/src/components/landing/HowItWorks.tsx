import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { IconVerify } from './VerdictoIcons';

const STEPS = [
  {
    num: '01',
    title: 'Connect & Pay',
    description: 'Connect your Casper Wallet. Pay 2.5 CSPR via a native transfer — the wallet signs it, producing a cryptographic payment proof. No accounts, no API keys, no stored payment methods.',
    meta: 'x402 micropayment · wallet signature',
  },
  {
    num: '02',
    title: 'Multi-Agent Analysis',
    description: 'Two independent AI analysts produce separate valuations using different methodologies. Each agent\'s input, state, and output are recorded for the ZK-Lite commitment.',
    meta: '2 independent analysts · different methods',
  },
  {
    num: '03',
    title: 'Juror Deliberation',
    description: 'Three specialized jurors evaluate which analysis is more credible. Every deliberation round is signed with HMAC-SHA256, each receipt chains to the previous. If agents disagree, multi-round peer review kicks in.',
    meta: 'HMAC receipt chains · tamper-proof',
  },
  {
    num: '04',
    title: 'On-Chain Commitment',
    description: 'A ZK-Lite commitment — SHA-256 of execution state plus Casper block height — is anchored on-chain. The verdict, receipts, and commitment are all independently verifiable.',
    meta: 'ZK-Lite proof · anchored to Casper L1',
  },
];

export const HowItWorks: React.FC = () => {
  const sectionRef = useRef(null);

  return (
    <section ref={sectionRef} className="rb-section rb-process">
      <div className="rb-inner">
        <div className="rb-process__header">
          <div className="rb-tag">How It Works</div>
          <h2 className="rb-title">From wallet to verdict</h2>
          <p className="rb-subtitle">
            Connect your wallet, pick a product, and let multiple AI agents produce
            a cryptographically signed, on-chain result.
          </p>
        </div>

        <div className="rb-process-steps">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.num}
              className="rb-step"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="rb-step__num">{step.num}</div>
              <div className="rb-step__body">
                <div className="rb-step__text">
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </div>
                <div className="rb-step__meta">{step.meta}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Trust bar */}
        <motion.div
          className="rb-trust-bar"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <IconVerify size={16} className="rb-trust-bar__icon" />
          <span>Every step produces a cryptographically signed receipt on the Casper blockchain</span>
        </motion.div>
      </div>
    </section>
  );
};
