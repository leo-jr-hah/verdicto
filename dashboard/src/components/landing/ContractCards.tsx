import React, { useRef, useEffect } from 'react';
import { motion, useInView } from 'motion/react';
import { ExternalLink, Lock, CheckCircle2, Wallet, Cpu, FileCode, Coins } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const CONTRACTS = [
  {
    name: 'VerdictOracle',
    hash: 'pending',
    description: 'Stores multi-agent consensus valuations on-chain. Every verdict includes HMAC receipt chains and ZK-Lite commitments — not just a number, but a cryptographically verifiable proof of how it was derived.',
    highlight: true,
  },
  {
    name: 'VotingContract',
    hash: 'f00cbb8f03e468c0750e7ce78bfc7f8a5c337fd520ebc218e969833bdea0fcfb',
    description: 'Records reputation-weighted votes from juror agents. Each juror signs HMAC receipts for every deliberation round, creating a tamper-proof chain that proves consensus was reached honestly.',
  },
  {
    name: 'ReputationRegistry',
    hash: '30da84e6d0db566b5d8ba4a93cc392bd2268bff6c24c1c0e5cb16a4f51038942',
    description: 'Maintains immutable identity and reliability scores for every AI agent. Uses retroactive settlement: reputation updates when market reality is known, not by majority vote.',
  },
  {
    name: 'EscrowContract',
    hash: '83bf2bab33200e60b092847abc38ea5d0301327fae43fc2d3555fec5be120d3a',
    description: 'Locks CSPR during dispute resolution and releases on verdict. Handles collateral for Borrow and claim payouts for Insure. All transfers are x402 micropayments with wallet signatures.',
  },
];

const X402_FEATURES = [
  { icon: Wallet, text: 'Native CSPR transfers signed by the user wallet — no stored payment methods or API keys.' },
  { icon: Cpu, text: 'Cryptographic proof of payment validated server-side before any action executes.' },
  { icon: Coins, text: 'Assessment: 2.5 CSPR · Confidence: 1 CSPR · Loan: 5 CSPR · Insurance: 3 CSPR' },
  { icon: FileCode, text: 'Every payment produces a verifiable receipt anchored on-chain with the transaction hash.' },
];

export const ContractCards: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mm = gsap.matchMedia();

    mm.add('(min-width: 769px)', () => {
      if (!lineRef.current || !sectionRef.current) return;

      gsap.fromTo(lineRef.current,
        { height: '0%' },
        {
          height: '100%',
          ease: 'none',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 70%',
            end: 'bottom 50%',
            scrub: true,
          },
        }
      );
    });

    return () => mm.revert();
  }, []);

  return (
    <section ref={sectionRef} id="contracts" className="landing-section-dark landing-section-dark--c landing-blueprint">
      <div className="landing-section-dark__inner">
        <div className="landing-dark-header">
          <div className="landing-dark-header__tag">
            <span>Infrastructure & Payments</span>
          </div>
          <h2 className="landing-dark-header__title">
            X402 Protocol & Deployed Contracts
          </h2>
          <p className="landing-dark-header__subtitle">
            Every action is gated by a wallet-signed micropayment. Four smart contracts on Casper Testnet
            handle verdicts, voting, reputation, and escrow — all publicly verifiable.
          </p>
        </div>

        <div className="arch-layout">
          {/* Left: X402 explanation */}
          <div className="arch-text">
            <h3 style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 20,
              fontWeight: 700,
              color: '#fff',
              margin: '0 0 var(--space-4)',
            }}>
              Pay-Per-Query Micropayments
            </h3>
            <p style={{
              fontSize: 14,
              color: 'rgba(255,255,255,0.5)',
              lineHeight: 1.65,
              margin: '0 0 var(--space-6)',
            }}>
              Each assessment, loan, and insurance policy is gated by a small CSPR micropayment,
              signed directly by the user's wallet. No subscriptions, no stored payment methods.
              The cryptographic proof is validated server-side before any action executes.
            </p>

            <div className="arch-feature-list">
              {X402_FEATURES.map((feat, i) => {
                const Icon = feat.icon;
                return (
                  <motion.div
                    key={i}
                    className="arch-feature-item"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.08 }}
                  >
                    <Icon size={16} strokeWidth={1.5} className="arch-feature-item__icon" />
                    <span>{feat.text}</span>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Right: Contract nodes with tracing line */}
          <div className="arch-diagram">
            <div ref={lineRef} className="arch-trace-line" />
            {CONTRACTS.map((contract, i) => (
              <motion.div
                key={contract.name}
                className="arch-contract-node"
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <div className="arch-contract-node__dot" />
                <div className={`arch-contract-node__content${contract.highlight ? ' arch-contract-node__content--highlight' : ''}`}>
                  <div className="arch-contract-node__name">{contract.name}</div>
                  <p className="arch-contract-node__desc">{contract.description}</p>
                  <div className="arch-contract-node__hash">
                    {contract.hash === 'pending' ? (
                      <>
                        <Lock size={11} />
                        <span>Deploying to Testnet</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={11} />
                        <a
                          href={`https://testnet.cspr.live/deploy/${contract.hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {contract.hash.slice(0, 12)}…
                        </a>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
