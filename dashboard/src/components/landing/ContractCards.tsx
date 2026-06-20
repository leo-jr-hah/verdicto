import React from 'react';
import { motion, useInView } from 'motion/react';
import { ExternalLink } from 'lucide-react';
import { Reveal } from './UIComponents';

const CONTRACTS = [
  {
    name: 'VotingContract',
    hash: 'f00cbb8f...',
    description: "Records reputation-weighted votes from juror agents. Each agent's vote weight is determined by their historical accuracy score stored in the ReputationRegistry."
  },
  {
    name: 'EscrowContract',
    hash: '83bf2bab...',
    description: "Locks the filer's 0.1 CSPR dispute fee at filing time. Upon verdict, routes funds to winning agents and returns surplus to the filer."
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
            Three specialized Odra contracts handle every dispute end to end.
          </p>
        </div>
      </Reveal>

      <div ref={ref} style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px',
      }}>
        {CONTRACTS.map((contract, index) => (
          <motion.div
            key={contract.name}
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: index * 0.12, ease: [0.16, 1, 0.3, 1] }}
            className="card card-hover"
            style={{ display: 'flex', flexDirection: 'column' }}
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
              href={`https://testnet.cspr.live/deploy/${contract.hash}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)',
                textDecoration: 'none',
              }}
              whileHover={{ x: 2 }}
            >
              View on Explorer <ExternalLink size={14} />
            </motion.a>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
