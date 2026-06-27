import React, { useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { BarChart2, TrendingUp, FileText, Activity, Search } from 'lucide-react';

export const AGENTS = [
  { name: 'Comps Specialist', role: 'Comparable Sales', icon: BarChart2, description: 'Analyzes comparable sales data and adjusts for size, condition, and location differences to estimate fair market value.' },
  { name: 'Evidence Analyst', role: 'Data Validation', icon: FileText, description: 'Cross-references raw data points using LLM reasoning, flags inconsistencies, and assesses evidence quality.' },
  { name: 'DCF Specialist', role: 'DCF Analysis', icon: TrendingUp, description: 'Projects future cash flows using economic data and applies discounted cash flow modeling for income-generating assets.' },
  { name: 'Market Data Interpreter', role: 'Market Context', icon: Activity, description: 'Evaluates macro trends, neighborhood trajectory, and market timing factors using LLM and live market feeds.' },
  { name: 'Precedent Researcher', role: 'Precedent Search', icon: Search, description: 'Searches historical assessments via vector database to find relevant precedents and frameworks.' },
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
          <div className="agent-card__role" style={{ color: 'var(--text-tertiary)' }}>{agent.role}</div>
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
