import React, { useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { Upload, BarChart3, Users, ShieldCheck, CheckCircle2, Landmark, Shield } from 'lucide-react';

const STEPS = [
  {
    num: '01',
    title: 'Submit Your Asset',
    color: '#FF3B3B',
    icon: Upload,
    description: 'Tell Verdict what you want valued. Choose from Real Estate, Fine Art, or Commodities. Provide the asset details and your asking price. A 2.5 CSPR assessment fee is collected via x402 micropayment.',
    detail: 'Real Estate, Art, Commodities',
  },
  {
    num: '02',
    title: 'Independent Dual Valuation',
    color: '#3B82F6',
    icon: BarChart3,
    description: 'Two AI agents each produce a full valuation using different methodologies. The Comps Specialist analyzes comparable sales. The DCF Specialist projects future cash flows. Their results are compared for divergence.',
    detail: 'Comps Specialist + DCF Specialist',
  },
  {
    num: '03',
    title: 'Juror Deliberation',
    color: '#8B5CF6',
    icon: Users,
    description: 'If the two valuations diverge beyond a threshold, three jurors (Evidence Analyst, Market Data Interpreter, Precedent Researcher) deliberate across two rounds. In Round 2, each juror reviews peer reasoning and may revise their vote.',
    detail: '3 Jurors, 2 Rounds, Peer Review',
  },
  {
    num: '04',
    title: 'Verdict and On-Chain Record',
    color: '#10B981',
    icon: ShieldCheck,
    description: 'Votes are weighted by each juror\'s on-chain trust score. The final verdict, along with every juror\'s reasoning and confidence, is committed to the Casper blockchain. An HMAC receipt chain ensures no reasoning was altered after the fact.',
    detail: 'Immutable On-Chain Certificate',
  },
  {
    num: '05',
    title: 'Borrow Against Your Asset',
    color: '#F59E0B',
    icon: Landmark,
    description: 'Once your asset is valued and recorded on-chain, you can borrow against it instantly. The AI-calculated LTV ratio (60–85% depending on asset type and confidence) determines your loan amount. CSPR is disbursed directly to your wallet via a real on-chain transfer.',
    detail: 'AI-Calculated LTV · Real CSPR Disbursement',
  },
  {
    num: '06',
    title: 'Insure Your Asset',
    color: '#8B5CF6',
    icon: Shield,
    description: 'Protect your asset against value loss with AI-powered insurance. The risk engine evaluates market volatility, asset liquidity, and assessment confidence to calculate your premium and coverage. File claims anytime — the AI revalues your asset and pays out if the loss exceeds your deductible.',
    detail: 'AI Risk Assessment · On-Chain Claims',
  },
];

const StepCard: React.FC<{ step: typeof STEPS[0]; index: number }> = ({ step, index }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const Icon = step.icon;
  const isEven = index % 2 === 0;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : {}}
      transition={{ duration: 0.6, delay: index * 0.1 }}
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
      <motion.div
        initial={{ opacity: 0, x: isEven ? -60 : 60 }}
        animate={inView ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 0.7, delay: index * 0.12, ease: [0.16, 1, 0.3, 1] }}
        style={{ order: isEven ? 0 : 1 }}
      >
        {/* Animated step number */}
        <motion.div
          style={{
            fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em',
            marginBottom: '0.75rem', color: step.color,
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
          }}
        >
          <motion.span
            animate={inView ? {
              textShadow: [
                `0 0 0px ${step.color}`,
                `0 0 12px ${step.color}`,
                `0 0 0px ${step.color}`,
              ],
            } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            style={{ fontSize: '1.5rem', fontWeight: 900, fontFamily: 'var(--font-display)' }}
          >
            {step.num}
          </motion.span>
          <motion.span
            animate={inView ? { width: [0, 40, 40, 0] } : {}}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: index * 0.3 }}
            style={{
              height: 2, background: step.color, display: 'block',
            }}
          />
        </motion.div>

        <h3 style={{
          fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 800, marginBottom: '1rem',
          fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', color: 'var(--text-primary)',
        }}>
          {step.title}
        </h3>
        <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 480 }}>
          {step.description}
        </p>
      </motion.div>

      {/* Right: visual card */}
      <motion.div
        initial={{ opacity: 0, x: isEven ? 60 : -60, scale: 0.95 }}
        animate={inView ? { opacity: 1, x: 0, scale: 1 } : {}}
        transition={{ duration: 0.7, delay: index * 0.12 + 0.15, ease: [0.16, 1, 0.3, 1] }}
        style={{ order: isEven ? 1 : 0, display: 'flex', justifyContent: 'center' }}
      >
        <motion.div
          className="card hiw-card"
          whileHover={{ y: -4, boxShadow: '0 20px 60px rgba(0,0,0,0.1)' }}
          transition={{ duration: 0.3 }}
          style={{
            width: '100%', maxWidth: 360,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem',
            padding: '2rem', textAlign: 'center',
            position: 'relative', overflow: 'hidden',
          }}
        >
          {/* Animated border glow */}
          <motion.div
            animate={inView ? { opacity: [0.3, 0.7, 0.3] } : {}}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: index * 0.4 }}
            style={{
              position: 'absolute', inset: 0, borderRadius: 'inherit',
              border: `1.5px solid ${step.color}`,
              pointerEvents: 'none',
            }}
          />

          {/* Icon with rotating glow ring */}
          <div style={{ position: 'relative', width: 56, height: 56 }}>
            <motion.div
              animate={inView ? { rotate: 360 } : {}}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              style={{
                position: 'absolute', inset: -4, borderRadius: '50%',
                border: `2px dashed ${step.color}40`,
              }}
            />
            <motion.div
              animate={inView ? {
                boxShadow: [
                  `0 0 0 0px ${step.color}00`,
                  `0 0 20px 6px ${step.color}30`,
                  `0 0 0 0px ${step.color}00`,
                ],
              } : {}}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                width: 56, height: 56, borderRadius: 14,
                background: `${step.color}12`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: step.color, position: 'relative',
              }}
            >
              <motion.div
                animate={inView ? { y: [0, -3, 0] } : {}}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: index * 0.2 }}
              >
                <Icon size={24} />
              </motion.div>
            </motion.div>
          </div>

          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            {step.detail}
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            fontSize: '0.7rem', color: step.color, fontWeight: 600,
          }}>
            <motion.div
              animate={inView ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <CheckCircle2 size={14} />
            </motion.div>
            Verified on-chain
          </div>
        </motion.div>
      </motion.div>
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
            From asset to verifiable verdict
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxWidth: 560, margin: '0 auto', lineHeight: 1.7 }}>
            Submit any real-world asset and get a cryptographically signed, on-chain valuation backed by multiple AI agents.
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
