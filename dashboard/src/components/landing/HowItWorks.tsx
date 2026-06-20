import React from 'react';
import { motion, useInView } from 'motion/react';
import { useRef } from 'react';
import { Wallet, Cpu, Scale, Shield, CheckCircle2 } from 'lucide-react';

const STEPS = [
  {
    num: '01',
    title: 'File the Dispute',
    color: 'var(--primary)',
    icon: Wallet,
    description: 'Connect your Casper wallet and submit a real-world asset dispute. The Orchestrator locks a 0.1 CSPR filing fee in the Escrow contract and begins coordination.',
    detail: 'Submit Dispute (0.1 CSPR)',
  },
  {
    num: '02',
    title: 'Dual Valuation',
    color: '#3B82F6',
    icon: Cpu,
    description: 'The Orchestrator fetches live data from RentCast, Met Museum, CoinGecko, or FRED — then dispatches two valuation agents that independently estimate fair market value using different methodologies.',
    detail: 'Comparable Sales + DCF Analysis',
  },
  {
    num: '03',
    title: 'Jury Deliberation',
    color: '#8B5CF6',
    icon: Scale,
    description: 'Three specialized jurors — Evidence Analyst, Market Data Interpreter, and Precedent Researcher — evaluate both valuations, cross-check data, and cast reputation-weighted votes.',
    detail: '3 Jurors · Reputation-Weighted',
  },
  {
    num: '04',
    title: 'Verdict & Settlement',
    color: '#10B981',
    icon: Shield,
    description: 'The winning verdict is recorded on-chain via the VotingContract. The Escrow contract routes CSPR to agents, and trust scores update in the ReputationRegistry.',
    detail: 'Recorded on Casper Testnet',
  },
];

const StepCard: React.FC<{ step: typeof STEPS[0]; index: number }> = ({ step, index }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const Icon = step.icon;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '3rem',
        alignItems: 'center',
        padding: '3rem 0',
        borderTop: index > 0 ? '1px solid var(--border-color)' : 'none',
      }}
      className="hiw-step-row"
    >
      {/* Left: text */}
      <div style={{ order: index % 2 === 0 ? 0 : 1 }}>
        <div style={{ color: step.color, fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', marginBottom: '0.75rem' }}>
          {step.num}
        </div>
        <h3 style={{
          fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 800, marginBottom: '1rem',
          fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', color: 'var(--text-primary)',
        }}>
          {step.title}
        </h3>
        <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 480 }}>
          {step.description}
        </p>
      </div>

      {/* Right: visual card */}
      <div style={{ order: index % 2 === 0 ? 1 : 0, display: 'flex', justifyContent: 'center' }}>
        <div className="card" style={{
          width: '100%', maxWidth: 360,
          boxShadow: '0 12px 40px rgba(0,0,0,0.06)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem',
          padding: '2rem',
          textAlign: 'center',
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: `${step.color}15`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: step.color,
          }}>
            <Icon size={22} />
          </div>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            {step.detail}
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            fontSize: '0.7rem', color: step.color, fontWeight: 600,
          }}>
            <CheckCircle2 size={14} />
            Verified on-chain
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export const HowItWorks: React.FC = () => {
  return (
    <section id="how-it-works" style={{
      padding: '6rem 2rem',
      background: 'var(--bg-main)',
      borderTop: '1px solid var(--border-color)',
    }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {/* Section header */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div className="badge" style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            background: 'var(--primary-bg)',
            border: '1px solid rgba(255, 59, 59, 0.15)',
            marginBottom: '1.5rem',
          }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              How It Works
            </span>
          </div>
          <h2 style={{
            fontSize: 'clamp(1.8rem, 4vw, 3rem)',
            fontWeight: 800, lineHeight: 1.1,
            letterSpacing: '-0.03em',
            color: 'var(--text-primary)',
            marginBottom: '1rem',
          }}>
            Four steps to a trustless verdict
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxWidth: 560, margin: '0 auto', lineHeight: 1.7 }}>
            From filing to settlement, every step is coordinated by AI agents and recorded on the Casper blockchain.
          </p>
        </div>

        {/* Steps */}
        {STEPS.map((step, i) => (
          <StepCard key={step.num} step={step} index={i} />
        ))}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .hiw-step-row {
            grid-template-columns: 1fr !important;
          }
          .hiw-step-row > * {
            order: unset !important;
          }
        }
      `}</style>
    </section>
  );
};
