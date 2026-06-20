import React, { useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { BarChart2, TrendingUp, FileText, Activity, Search } from 'lucide-react';

export const AGENTS = [
  { name: 'Valuation Agent A', role: 'Comparable Sales', icon: BarChart2, color: '#EC4899', description: 'Pulls comparable sales from RentCast and adjusts for size, condition, and location differences to estimate fair market value.' },
  { name: 'Evidence Analyst', role: 'Data Validation', icon: FileText, color: '#10B981', description: 'Cross-references raw data points using MiMo LLM reasoning, flags inconsistencies, and assesses evidence quality.' },
  { name: 'Valuation Agent B', role: 'DCF (Discounted Cash Flow) Analysis', icon: TrendingUp, color: '#F97316', description: 'Projects future cash flows using FRED economic data and applies discounted cash flow modeling for income-generating assets.' },
  { name: 'Market Data Interpreter', role: 'Market Context', icon: Activity, color: '#06B6D4', description: 'Evaluates macro trends, neighborhood trajectory, and market timing factors using MiMo LLM and live market feeds.' },
  { name: 'Precedent Researcher', role: 'Precedent Search', icon: Search, color: '#8B5CF6', description: 'Searches historical disputes via Vectra vector database to find relevant precedents and legal frameworks.' },
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
      whileHover={{ y: -4, borderColor: agent.color }}
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-color)',
        borderRadius: 16,
        padding: '1.5rem',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'default',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
      }}
    >
      {/* Accent bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: agent.color }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
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
          style={{
            width: 40, height: 40, borderRadius: 10,
            background: `${agent.color}15`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: agent.color,
            position: 'relative',
          }}
        >
          {/* Pulsing glow ring */}
          <motion.div
            animate={{ scale: [1, 1.6, 1], opacity: [0.3, 0, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeOut', delay: index * 0.3 }}
            style={{
              position: 'absolute', inset: -4,
              borderRadius: 14,
              border: `2px solid ${agent.color}`,
              pointerEvents: 'none',
            }}
          />
          <Icon size={18} />
        </motion.div>
        <div>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>{agent.name}</div>
          <div style={{ fontSize: '0.7rem', fontWeight: 600, color: agent.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{agent.role}</div>
        </div>
      </div>

      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
        {agent.description}
      </p>

      {/* Thinking dots */}
      <div style={{ display: 'flex', gap: 4, marginTop: '1rem', alignItems: 'center' }}>
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
            transition={{ duration: 1.2, delay: i * 0.2, repeat: Infinity, ease: 'easeInOut' }}
            style={{ width: 4, height: 4, borderRadius: '50%', background: agent.color }}
          />
        ))}
        <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', marginLeft: '0.3rem' }}>
          Independent analysis
        </span>
      </div>
    </motion.div>
  );
};
