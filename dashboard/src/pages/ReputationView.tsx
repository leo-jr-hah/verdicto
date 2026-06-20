import React, { useState } from 'react';
import { Shield, TrendingUp, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/** Simple inline sparkline for per-agent score history */
const MiniSparkline: React.FC<{ data: number[]; color?: string; height?: number }> = ({
  data,
  color = '#60a5fa',
  height = 60,
}) => {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 280;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 8) - 4;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`spark-${color.replace('#', '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon
        points={`0,${height} ${points} ${width},${height}`}
        fill={`url(#spark-${color.replace('#', '')})`}
      />
      <polyline points={points} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

interface AgentReputation {
  agentId: string;
  agentName: string;
  description: string;
  currentScore: number;
  previousScore: number;
  history: { timestamp: number; score: number; reason?: string }[];
  rank: number;
  totalAssessments: number;
  successRate: number;
  methodology: string;
  strengths: string[];
}

const AGENTS: AgentReputation[] = [
  {
    agentId: 'evidence',
    agentName: 'Evidence Reviewer',
    currentScore: 850,
    previousScore: 820,
    history: [
      { timestamp: Date.now() - 3600000, score: 820, reason: 'Assessment #123 completed' },
      { timestamp: Date.now() - 7200000, score: 835, reason: 'Assessment #122 completed' },
      { timestamp: Date.now() - 10800000, score: 850, reason: 'Assessment #121 completed' },
    ],
    rank: 1,
    totalAssessments: 156,
    successRate: 94,
    description: 'Validates raw data points and cross-references sources for accuracy.',
    methodology: 'Multi-source verification with confidence scoring',
    strengths: ['Data validation', 'Source cross-referencing', 'Outlier detection'],
  },
  {
    agentId: 'precedent',
    agentName: 'Case Researcher',
    currentScore: 790,
    previousScore: 780,
    history: [
      { timestamp: Date.now() - 3600000, score: 780, reason: 'Assessment #123 completed' },
      { timestamp: Date.now() - 7200000, score: 785, reason: 'Assessment #122 completed' },
      { timestamp: Date.now() - 10800000, score: 790, reason: 'Assessment #121 completed' },
    ],
    rank: 2,
    totalAssessments: 142,
    successRate: 91,
    description: 'Searches historical comparable assets using RAG-powered retrieval.',
    methodology: 'Retrieval-Augmented Generation with historical precedent matching',
    strengths: ['Case law research', 'Historical comparisons', 'RAG-powered retrieval'],
  },
  {
    agentId: 'market',
    agentName: 'Trend Analyst',
    currentScore: 760,
    previousScore: 755,
    history: [
      { timestamp: Date.now() - 3600000, score: 755, reason: 'Assessment #123 completed' },
      { timestamp: Date.now() - 7200000, score: 758, reason: 'Assessment #122 completed' },
      { timestamp: Date.now() - 10800000, score: 760, reason: 'Assessment #121 completed' },
    ],
    rank: 3,
    totalAssessments: 128,
    successRate: 89,
    description: 'Provides macro-economic context and market trend interpretation.',
    methodology: 'Time-series analysis with macro-economic indicators',
    strengths: ['Market trends', 'Economic indicators', 'Price forecasting'],
  },
  {
    agentId: 'valuation-a',
    agentName: 'Comps Specialist',
    currentScore: 720,
    previousScore: 710,
    history: [
      { timestamp: Date.now() - 3600000, score: 710, reason: 'Assessment #123 completed' },
      { timestamp: Date.now() - 7200000, score: 715, reason: 'Assessment #122 completed' },
      { timestamp: Date.now() - 10800000, score: 720, reason: 'Assessment #121 completed' },
    ],
    rank: 4,
    totalAssessments: 98,
    successRate: 87,
    description: 'Analyzes comparable sales and market listings to estimate asset value.',
    methodology: 'Comparable sales analysis with adjustment factors',
    strengths: ['Sales comparisons', 'Market listings', 'Value estimation'],
  },
  {
    agentId: 'valuation-b',
    agentName: 'Income Specialist',
    currentScore: 710,
    previousScore: 705,
    history: [
      { timestamp: Date.now() - 3600000, score: 705, reason: 'Assessment #123 completed' },
      { timestamp: Date.now() - 7200000, score: 708, reason: 'Assessment #122 completed' },
      { timestamp: Date.now() - 10800000, score: 710, reason: 'Assessment #121 completed' },
    ],
    rank: 5,
    totalAssessments: 87,
    successRate: 85,
    description: 'Projects future cash flows and applies discounted cash flow (DCF) analysis.',
    methodology: 'Discounted Cash Flow (DCF) with risk-adjusted discount rates',
    strengths: ['Cash flow projection', 'DCF analysis', 'Risk assessment'],
  },
];

const AgentTab: React.FC<{
  agent: AgentReputation;
  isSelected: boolean;
  onClick: () => void;
}> = ({ agent, isSelected, onClick }) => {
  const scoreDelta = agent.currentScore - agent.previousScore;
  const scoreColor = scoreDelta > 0 ? '#22c55e' : scoreDelta < 0 ? '#ef4444' : 'var(--text-tertiary)';
  const scoreIcon = scoreDelta > 0 ? '▲' : scoreDelta < 0 ? '▼' : '—';

  return (
    <div
      onClick={onClick}
      style={{
        background: isSelected ? 'rgba(59, 130, 246, 0.1)' : 'rgba(20, 20, 30, 0.6)',
        border: `1px solid ${isSelected ? 'rgba(59, 130, 246, 0.4)' : 'rgba(255,255,255,0.06)'}`,
        borderRadius: 12,
        padding: '16px 20px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
    >
      {/* Tab Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: isSelected ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Shield size={20} color={isSelected ? '#60a5fa' : 'var(--text-tertiary)'} />
          </div>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
              {agent.agentName}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
              Rank #{agent.rank} • {agent.totalAssessments} assessments
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Score */}
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {agent.currentScore}
            </div>
            <div style={{ fontSize: '0.75rem', color: scoreColor, fontWeight: 600 }}>
              {scoreIcon} {Math.abs(scoreDelta)} pts
            </div>
          </div>

          {/* Success Rate */}
          <div style={{
            padding: '4px 10px',
            borderRadius: 8,
            background: agent.successRate >= 90 ? 'rgba(34, 197, 94, 0.15)' : 'rgba(234, 179, 8, 0.15)',
            color: agent.successRate >= 90 ? '#22c55e' : '#eab308',
            fontSize: '0.8rem',
            fontWeight: 600,
          }}>
            {agent.successRate}%
          </div>

          {/* Expand Icon */}
          {isSelected ? (
            <ChevronUp size={18} color="var(--text-tertiary)" />
          ) : (
            <ChevronDown size={18} color="var(--text-tertiary)" />
          )}
        </div>
      </div>

      {/* Expandable Explanation */}
      <AnimatePresence>
        {isSelected && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              marginTop: 16,
              paddingTop: 16,
              borderTop: '1px solid rgba(255,255,255,0.06)',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 16,
            }}>
              {/* Description */}
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: 4, fontWeight: 600 }}>
                  ROLE
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {agent.description}
                </div>
              </div>

              {/* Methodology */}
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: 4, fontWeight: 600 }}>
                  METHODOLOGY
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {agent.methodology}
                </div>
              </div>

              {/* Strengths */}
              <div style={{ gridColumn: 'span 2' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: 8, fontWeight: 600 }}>
                  STRENGTHS
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {agent.strengths.map((s, i) => (
                    <span key={i} style={{
                      padding: '4px 10px',
                      borderRadius: 6,
                      background: 'rgba(255,255,255,0.05)',
                      color: 'var(--text-secondary)',
                      fontSize: '0.8rem',
                    }}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Score History */}
              <div style={{ gridColumn: 'span 2' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: 8, fontWeight: 600 }}>
                  SCORE HISTORY
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <MiniSparkline
                      data={[...agent.history].reverse().map(h => h.score)}
                      color={scoreDelta >= 0 ? '#22c55e' : '#ef4444'}
                      height={60}
                    />
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>
                    {agent.history.length} data points
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const ReputationView: React.FC = () => {
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  return (
    <div style={{ padding: '32px', maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
          AI Agents
        </h1>
        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.95rem' }}>
          Click on any agent to view their methodology, strengths, and reputation history.
        </p>
      </div>

      {/* Stats Bar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 16,
        marginBottom: 32,
      }}>
        {[
          { label: 'Total Agents', value: AGENTS.length, icon: <Shield size={18} /> },
          { label: 'Avg Score', value: Math.round(AGENTS.reduce((s, a) => s + a.currentScore, 0) / AGENTS.length), icon: <TrendingUp size={18} /> },
          { label: 'Avg Success', value: `${Math.round(AGENTS.reduce((s, a) => s + a.successRate, 0) / AGENTS.length)}%`, icon: <CheckCircle2 size={18} /> },
        ].map((stat, i) => (
          <div key={i} style={{
            background: 'rgba(20, 20, 30, 0.6)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 12,
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: 'rgba(59, 130, 246, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#60a5fa',
            }}>
              {stat.icon}
            </div>
            <div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                {stat.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Agent Tabs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {AGENTS.map((agent) => (
          <AgentTab
            key={agent.agentId}
            agent={agent}
            isSelected={selectedAgentId === agent.agentId}
            onClick={() => setSelectedAgentId(
              selectedAgentId === agent.agentId ? null : agent.agentId
            )}
          />
        ))}
      </div>
    </div>
  );
};
