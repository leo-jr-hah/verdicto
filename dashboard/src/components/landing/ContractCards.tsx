import React from 'react';
import { motion, useInView } from 'motion/react';
import { ExternalLink } from 'lucide-react';
import { Reveal } from './UIComponents';

const CONTRACTS = [
  {
    name: 'VerdictOracle',
    hash: 'pending',
    description: "Stores multi-agent consensus valuations as a composable on-chain primitive. Any Casper dApp can query verdicts via cross-contract call and pay 0.1 CSPR per query.",
    highlight: true,
  },
  {
    name: 'VotingContract',
    hash: 'f00cbb8f...',
    description: "Records reputation-weighted votes from juror agents. Each agent's vote weight is determined by their historical accuracy score stored in the ReputationRegistry."
  },
  {
    name: 'ReputationRegistry',
    hash: '30da84e6...',
    description: "Maintains immutable identity and reliability scores for every AI agent. Uses retroactive settlement: reputation updates when market reality is known, not by majority vote."
  }
];

export const ContractCards: React.FC = () => {
  const ref = React.useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section id="contracts" style={{
      width: '100%', maxWidth: 1100, margin: '0 auto', padding: '96px 32px'
    }}>
      <Reveal direction="up" delay={0}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2 style={{
            fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-primary)',
            marginBottom: '16px', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em'
          }}>
            Deployed Infrastructure
          </h2>
          <p style={{
            fontSize: '1.1rem', color: 'var(--text-secondary)', maxWidth: 600, margin: '0 auto', lineHeight: 1.6
          }}>
            Three specialized Odra contracts power the Verdicto ecosystem, with the Verdict Oracle as the composable core.
          </p>
        </div>
      </Reveal>

      <div ref={ref} style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px',
      }}>
        {CONTRACTS.map((contract, index) => (
          <motion.div
            key={contract.name}
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: index * 0.12, ease: [0.16, 1, 0.3, 1] }}
            className="card card-hover"
            style={{
              display: 'flex', flexDirection: 'column',
              ...(contract as any).highlight ? { border: '1.5px solid rgba(139,92,246,0.3)', background: 'linear-gradient(135deg, rgba(139,92,246,0.04) 0%, transparent 100%)' } : {},
            }}
          >
            <h3 style={{
              fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)',
              fontFamily: 'var(--font-mono)', marginBottom: '16px'
            }}>
              {contract.name}
            </h3>
            
            <p style={{
              fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, flex: 1, marginBottom: '24px'
            }}>
              {contract.description}
            </p>

            <motion.a
              href={contract.hash === 'pending' ? '#' : `https://testnet.cspr.live/deploy/${contract.hash}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                fontSize: '0.8rem', fontWeight: 600,
                color: contract.hash === 'pending' ? 'var(--text-tertiary)' : 'var(--text-primary)',
                textDecoration: 'none',
              }}
              whileHover={{ x: 2 }}
            >
              {contract.hash === 'pending' ? 'Deploying to Testnet' : 'View on Explorer'} <ExternalLink size={14} />
            </motion.a>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
