import React, { useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { Upload, BarChart3, Users, ShieldCheck, Landmark, Shield, TrendingUp } from 'lucide-react';

const STEPS = [
  {
    num: '01',
    title: 'Connect Your Wallet',
    color: '#FF3B3B',
    icon: Upload,
    description: 'Connect your Casper Wallet in one click. Your wallet handles all payments and receives all disbursements. No accounts, no passwords, no email.',
    detail: 'Casper Wallet via CSPRClick SDK',
  },
  {
    num: '02',
    title: 'Choose Your Product',
    color: '#3B82F6',
    icon: BarChart3,
    description: 'Pick what you need: Assess an asset for its market value, Borrow against it, Insure it against loss, or run a Confidence Analysis on a real-world outcome. Each product uses the same multi-agent AI engine.',
    detail: 'Assess, Borrow, Insure, or Confidence',
  },
  {
    num: '03',
    title: 'AI Agents Analyze',
    color: '#8B5CF6',
    icon: Users,
    description: 'Five independent AI agents work in parallel. Each queries real market data, selects its own methodology, and produces a result with full reasoning. If agents disagree, three jurors deliberate across two rounds with peer review.',
    detail: '5 Agents, 2 Rounds, Peer Review',
  },
  {
    num: '04',
    title: 'Stored in the Verdict Oracle',
    color: '#10B981',
    icon: ShieldCheck,
    description: 'The consensus valuation is committed to the Verdict Oracle, an on-chain smart contract. Our Borrow, Insure, and Confidence products query it directly. An HMAC receipt chain ensures nothing was altered after the fact.',
    detail: 'Composable On-Chain Primitive',
  },
  {
    num: '05',
    title: 'Borrow or Insure',
    color: '#F59E0B',
    icon: Landmark,
    description: 'With an on-chain assessment, you can borrow against your asset at AI-calculated LTV ratios, or protect it with AI-powered insurance. CSPR flows directly to and from your wallet.',
    detail: 'Real CSPR Disbursement and Claims',
  },
  {
    num: '06',
    title: 'Autonomous Monitoring',
    color: '#EF4444',
    icon: Shield,
    description: 'Background keepers watch your collateral health and insurance policies around the clock. Margin calls, liquidation alerts, and claim processing happen automatically with no human in the loop.',
    detail: '24/7 Collateral and Policy Monitoring',
  },
  {
    num: '07',
    title: 'Confidence Analysis',
    color: '#6366F1',
    icon: TrendingUp,
    description: 'Ask any yes-or-no question about the real world. Five agents independently estimate probabilities and produce a weighted confidence score. Results feed into Oracle verdicts.',
    detail: '5-Agent Confidence Scoring',
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
              <ShieldCheck size={14} />
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
            From wallet to verdict
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxWidth: 560, margin: '0 auto', lineHeight: 1.7 }}>
            Connect your wallet, pick a product, and let five AI agents produce a cryptographically signed, on-chain result.
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
