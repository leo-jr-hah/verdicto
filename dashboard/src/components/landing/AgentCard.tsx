import React, { useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { BarChart2, TrendingUp, FileText, Activity, Search } from 'lucide-react';

export const AGENTS = [
  { name: 'Analyst Alpha', role: 'Valuation Agent #1', icon: BarChart2, description: 'Produces an independent asset valuation using comparable sales, market data, and LLM reasoning. Every input and output is recorded for the ZK-Lite commitment.' },
  { name: 'Analyst Beta', role: 'Valuation Agent #2', icon: TrendingUp, description: 'Produces a second independent valuation using a different methodology (DCF, precedent, or hybrid). Disagreement with Alpha triggers juror deliberation.' },
  { name: 'Juror: Credibility', role: 'Peer Review', icon: FileText, description: 'Evaluates which analyst\'s methodology is more credible for this asset class. Signs an HMAC receipt for every deliberation round, creating a tamper-proof audit trail.' },
  { name: 'Juror: Evidence', role: 'Data Validation', icon: Activity, description: 'Cross-references raw data points, flags inconsistencies, and assesses evidence quality. Each judgment is cryptographically chained to the previous receipt.' },
  { name: 'Juror: Consensus', role: 'Arbiter', icon: Search, description: 'Weighs the credibility and evidence scores from the other two jurors. Produces the final consensus verdict with a confidence score. The full chain is anchored on-chain via ZK-Lite.' },
];

export const AgentCard: React.FC<{ agent: typeof AGENTS[0]; index: number }> = ({ agent, index }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const Icon = agent.icon;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -4, borderColor: 'var(--red-600)' }}
      className="agent-card"
    >
      {/* Accent bar */}
      <div className="agent-card__accent-bar" style={{ background: 'var(--border)' }} />

      <div className="agent-card__header">
        <motion.div
          animate={
            index === 0 ? { scale: [1, 1.1, 1], rotate: [0, -3, 3, 0] } :
            index === 1 ? { y: [0, -3, 0], scale: [1, 1.05, 1] } :
            index === 2 ? { rotate: [0, 5, -5, 0] } :
            index === 3 ? { scale: [1, 1.15, 1], opacity: [1, 0.8, 1] } :
            { rotate: [0, 360] }
          }
          transition={{
            duration: index === 4 ? 6 : 2.5,
            repeat: Infinity,
            ease: index === 4 ? 'linear' : 'easeInOut',
            repeatDelay: index === 4 ? 0 : 0.5,
          }}
          className="agent-card__icon"
          style={{ background: 'var(--bg-sunken)', color: 'var(--text-secondary)' }}
        >
          {/* Pulsing glow ring */}
          <motion.div
            animate={{ scale: [1, 1.6, 1], opacity: [0.3, 0, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeOut', delay: index * 0.3 }}
            className="agent-card__icon-ring"
            style={{ borderColor: 'var(--border)' }}
          />
          <Icon size={18} />
        </motion.div>
        <div>
          <div className="agent-card__name">{agent.name}</div>
          <div className="agent-card__role">{agent.role}</div>
        </div>
      </div>

      <p className="agent-card__desc">{agent.description}</p>

      {/* Thinking dots */}
      <div className="agent-card__dots">
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
            transition={{ duration: 1.2, delay: i * 0.2, repeat: Infinity, ease: 'easeInOut' }}
            className="agent-card__dot"
            style={{ background: 'var(--text-tertiary)' }}
          />
        ))}
        <span className="agent-card__dots-label">Independent analysis</span>
      </div>
    </motion.div>
  );
};
