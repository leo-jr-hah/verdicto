import React, { useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { Upload, BarChart3, Users, ShieldCheck } from 'lucide-react';

const STEPS = [
  {
    num: '01',
    title: 'Connect Your Wallet',
    icon: Upload,
    description: 'Connect your Casper Wallet in one click. Your wallet handles all payments and receives all disbursements. No account creation needed.',
    detail: 'Casper Wallet via CSPRClick SDK',
  },
  {
    num: '02',
    title: 'Choose Your Product',
    icon: BarChart3,
    description: 'Pick what you need: Assess an asset for its market value, Borrow against it, Insure it against loss, or run a Confidence Analysis. Each product uses the same multi-agent AI engine.',
    detail: 'Assess, Borrow, Insure, or Predict',
  },
  {
    num: '03',
    title: 'AI Agents Analyze',
    icon: Users,
    description: 'Multiple independent AI agents work in parallel. Each queries real market data, selects its own methodology, and produces a result with full reasoning. If agents disagree, jurors deliberate with peer review.',
    detail: 'Multi-Agent Analysis with Peer Review',
  },
  {
    num: '04',
    title: 'Result On-Chain',
    icon: ShieldCheck,
    description: 'Consensus verdict stored in the Oracle. Borrow, insure, or verify against it. Autonomous keepers monitor collateral health and insurance policies 24/7 with no human in the loop.',
    detail: 'Composable On-Chain Primitive',
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
      className="hiw-step-row"
    >
      {/* Left: text */}
      <motion.div
        initial={{ opacity: 0, x: isEven ? -60 : 60 }}
        animate={inView ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 0.7, delay: index * 0.12, ease: [0.16, 1, 0.3, 1] }}
        style={{ order: isEven ? 0 : 1 }}
        className="hiw-step-text"
      >
        <div className="hiw-step-num" style={{ color: 'var(--red-600)' }}>
          <motion.span
            className="hiw-step-num__value"
            animate={inView ? {
              textShadow: [
                '0 0 0px var(--red-600)',
                '0 0 12px var(--red-600)',
                '0 0 0px var(--red-600)',
              ],
            } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            {step.num}
          </motion.span>
          <motion.span
            className="hiw-step-num__line"
            animate={inView ? { width: [0, 40, 40, 0] } : {}}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: index * 0.3 }}
            style={{ background: 'var(--red-600)' }}
          />
        </div>

        <h3 className="hiw-step-title">{step.title}</h3>
        <p className="hiw-step-desc">{step.description}</p>
      </motion.div>

      {/* Right: visual card */}
      <motion.div
        initial={{ opacity: 0, x: isEven ? 60 : -60, scale: 0.95 }}
        animate={inView ? { opacity: 1, x: 0, scale: 1 } : {}}
        transition={{ duration: 0.7, delay: index * 0.12 + 0.15, ease: [0.16, 1, 0.3, 1] }}
        style={{ order: isEven ? 1 : 0, display: 'flex', justifyContent: 'center' }}
        className="hiw-step-visual"
      >
        <motion.div
          className="card hiw-card"
          whileHover={{ y: -4, boxShadow: '0 20px 60px var(--nm-shadow-dark)' }}
          transition={{ duration: 0.3 }}
        >
          {/* Animated border glow — neutral */}
          <motion.div
            animate={inView ? { opacity: [0.3, 0.7, 0.3] } : {}}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: index * 0.4 }}
            style={{
              position: 'absolute', inset: 0, borderRadius: 'inherit',
              border: '1.5px solid var(--border-default)',
              pointerEvents: 'none',
            }}
          />

          {/* Icon with rotating glow ring — neutral */}
          <div className="hiw-card__icon-wrap">
            <motion.div
              className="hiw-card__icon-glow"
              animate={inView ? { rotate: 360 } : {}}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              style={{ border: '2px dashed var(--border-subtle)' }}
            />
            <motion.div
              className="hiw-card__icon-box"
              animate={inView ? {
                boxShadow: [
                  '0 0 0 0px rgba(230,46,46,0)',
                  '0 0 20px 6px rgba(230,46,46,0.08)',
                  '0 0 0 0px rgba(230,46,46,0)',
                ],
              } : {}}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              style={{ background: 'var(--primary-bg)', color: 'var(--red-600)' }}
            >
              <motion.div
                animate={inView ? { y: [0, -3, 0] } : {}}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: index * 0.2 }}
              >
                <Icon size={24} />
              </motion.div>
            </motion.div>
          </div>

          <div className="hiw-card__detail">{step.detail}</div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export const HowItWorks: React.FC = () => {
  return (
    <section id="how-it-works" className="landing-section" style={{ background: 'var(--bg-main)', borderTop: '1px solid var(--border-color)' }}>
      <div className="landing-section__container">
        {/* Section header */}
        <div className="landing-section__header">
          <div className="landing-badge landing-badge--red">
            <span>How It Works</span>
          </div>
          <h2 className="landing-section__title">From wallet to verdict</h2>
          <p className="landing-section__subtitle">
            Connect your wallet, pick a product, and let multiple AI agents produce a cryptographically signed, on-chain result.
          </p>
        </div>

        {/* Steps */}
        {STEPS.map((step, i) => (
          <StepCard key={step.num} step={step} index={i} />
        ))}

        {/* Single trust bar */}
        <div className="hiw-trust-bar">
          <ShieldCheck size={16} />
          <span>Every step produces a cryptographically signed receipt on the Casper blockchain</span>
        </div>
      </div>
    </section>
  );
};
