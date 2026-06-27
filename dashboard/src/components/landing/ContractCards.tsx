import React from 'react';
import { motion, useInView } from 'motion/react';
import { ExternalLink } from 'lucide-react';
import { Reveal } from './UIComponents';

const CONTRACTS = [
  {
    name: 'VerdictOracle',
    hash: 'pending',
    description: "Stores multi-agent consensus valuations on-chain. Other Verdicto products query verdicts directly from this shared data layer.",
    highlight: true,
  },
  {
    name: 'VotingContract',
    hash: 'f00cbb8f03e468c0750e7ce78bfc7f8a5c337fd520ebc218e969833bdea0fcfb',
    description: "Records reputation-weighted votes from juror agents. Each agent's vote weight is determined by their historical accuracy score stored in the ReputationRegistry."
  },
  {
    name: 'ReputationRegistry',
    hash: '30da84e6d0db566b5d8ba4a93cc392bd2268bff6c24c1c0e5cb16a4f51038942',
    description: "Maintains immutable identity and reliability scores for every AI agent. Uses retroactive settlement: reputation updates when market reality is known, not by majority vote."
  },
  {
    name: 'EscrowContract',
    hash: '83bf2bab33200e60b092847abc38ea5d0301327fae43fc2d3555fec5be120d3a',
    description: "Locks CSPR during dispute resolution and releases on verdict. Handles collateral for Borrow and claim payouts for Insure."
  }
];

export const ContractCards: React.FC = () => {
  const ref = React.useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section id="contracts" className="contracts-section">
      <Reveal direction="up" delay={0}>
        <div className="landing-section__header">
          <h2 className="landing-section__title">Deployed Infrastructure</h2>
          <p className="landing-section__subtitle">
            Specialized smart contracts power the Verdicto ecosystem, with the Verdict Oracle as the composable core.
          </p>
        </div>
      </Reveal>

      <div ref={ref} className="contracts-grid">
        {CONTRACTS.map((contract, index) => (
          <motion.div
            key={contract.name}
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: index * 0.12, ease: [0.16, 1, 0.3, 1] }}
            className={`card card-hover contract-card${contract.highlight ? ' contract-card--highlight' : ''}`}
          >
            <h3 className="contract-card__name">{contract.name}</h3>
            <p className="contract-card__desc">{contract.description}</p>
            <motion.a
              href={contract.hash === 'pending' ? '#' : `https://testnet.cspr.live/deploy/${contract.hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`contract-card__link${contract.hash === 'pending' ? ' contract-card__link--pending' : ''}`}
              whileHover={{ x: 2 }}
            >
              {contract.hash === 'pending' ? 'Deploying to Testnet' : (
                <>
                  View Deploy <ExternalLink size={16} />
                </>
              )}
            </motion.a>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
