import React, { useRef, useEffect } from 'react';
import { motion, useInView } from 'motion/react';
import { BarChart2, TrendingUp, FileText, Activity, Search } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const AGENTS = [
  { name: 'Comparable Sales Analyst', role: 'Primary Valuator #1', icon: BarChart2, description: 'Produces an independent asset valuation using comparable sales, market data, and LLM reasoning. Every input and output is recorded for the ZK-Lite commitment.', method: 'Market comparables with property-level adjustments' },
  { name: 'Cash Flow Analyst', role: 'Primary Valuator #2', icon: TrendingUp, description: 'Produces a second independent valuation using a different methodology (DCF, precedent, or hybrid). Disagreement with Alpha triggers juror deliberation.', method: 'Discounted cash flow with risk-adjusted rates' },
  { name: 'Evidence Analyst', role: 'Juror', icon: FileText, description: 'Evaluates which analyst\'s methodology is more credible for this asset class. Signs an HMAC receipt for every deliberation round, creating a tamper-proof audit trail.', method: 'Data quality validation and source cross-referencing' },
  { name: 'Market Interpreter', role: 'Juror', icon: Activity, description: 'Cross-references raw data points, flags inconsistencies, and assesses evidence quality. Each judgment is cryptographically chained to the previous receipt.', method: 'Macro trend analysis and timing assessment' },
  { name: 'Precedent Researcher', role: 'Juror', icon: Search, description: 'Weighs the credibility and evidence scores from the other two jurors. Produces the final consensus verdict with a confidence score. The full chain is anchored on-chain.', method: 'Historical analogy search and pattern matching' },
];

const AgentTerminalCard: React.FC<{ agent: typeof AGENTS[0]; index: number }> = ({ agent, index }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const Icon = agent.icon;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
      className="agent-terminal-card"
    >
      <div className="agent-terminal-card__accent" />
      <div className="agent-terminal-card__header">
        <div className="agent-terminal-card__icon">
          <Icon size={16} strokeWidth={1.5} />
        </div>
        <div>
          <div className="agent-terminal-card__name">{agent.name}</div>
          <div className="agent-terminal-card__role">{agent.role}</div>
        </div>
      </div>
      <p className="agent-terminal-card__desc">{agent.description}</p>
      <div className="agent-terminal-card__meta">
        <div className="agent-terminal-card__meta-dot" />
        <span className="agent-terminal-card__meta-text">{agent.method}</span>
      </div>
    </motion.div>
  );
};

export const AgentGrid: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const stackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mm = gsap.matchMedia();

    mm.add('(min-width: 769px)', () => {
      if (!stackRef.current) return;
      const cards = stackRef.current.querySelectorAll('.agent-terminal-card');
      if (cards.length < 2) return;

      // Sticky card stack: each card slides up and overlaps
      cards.forEach((card, i) => {
        if (i === 0) return;
        gsap.fromTo(card,
          { y: 60 * i, opacity: 0.7, scale: 0.97 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: sectionRef.current,
              start: `top+=${120 * i} top`,
              end: `top+=${120 * (i + 1)} top`,
              scrub: 0.5,
            },
          }
        );
      });
    });

    return () => mm.revert();
  }, []);

  return (
    <section ref={sectionRef} id="agents" className="landing-section-dark landing-section-dark--b landing-blueprint">
      <div className="landing-section-dark__inner">
        <div className="landing-dark-header">
          <div className="landing-dark-header__tag">
            <span>The Agents</span>
          </div>
          <h2 className="landing-dark-header__title">
            Two analysts. Three jurors.<br />
            <span style={{ color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>Every step cryptographically signed.</span>
          </h2>
          <p className="landing-dark-header__subtitle">
            Two valuation agents produce independent estimates using different methodologies.
            Three specialized jurors evaluate credibility, validate evidence, and reach consensus,
            each signing HMAC receipts that chain into a tamper-proof audit trail.
          </p>
        </div>

        <div ref={stackRef} className="agent-stack">
          {AGENTS.map((agent, i) => (
            <AgentTerminalCard key={agent.name} agent={agent} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
};
