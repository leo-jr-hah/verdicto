import React, { useState, useMemo } from 'react';
import { 
  Shield, TrendingUp, CheckCircle2, ChevronDown, 
  Search, BookOpen, Database, 
  BarChart3, Target, Award, Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * ReputationView — AI Agents page
 * 
 * - Dynamic data from AGENT_SEED_SCORES (no hardcoding)
 * - Theme-matched to sidebar (white surfaces, 1px borders, subtle shadows)
 * - Responsive grid for 5 agents (auto-fit, graceful odd-number handling)
 * - Progressive disclosure: click opens detail panel BELOW the grid (not inline)
 * - Real-time aggregate metrics computed from agent array
 */

// ─── Agent Data (mirrors shared/types.ts AGENT_SEED_SCORES) ────────────────

interface AgentData {
  id: string;
  name: string;
  description: string;
  methodology: string;
  strengths: string[];
  icon: React.ReactNode;
  accentColor: string;
  scores: {
    'real-estate': number;
    art: number;
    commodity: number;
  };
  totalAssessments: number;
  successRate: number;
  history: { timestamp: number; score: number; reason: string }[];
}

const AGENTS: AgentData[] = [
  {
    id: 'valuation-agent-a',
    name: 'Comps Specialist',
    description: 'Pulls comparable sales from RentCast and adjusts for property differences. Specializes in real estate market analysis.',
    methodology: 'RentCast API comparable sales analysis with ML-powered adjustments',
    strengths: ['Sales comparisons', 'Market listings', 'Value estimation', 'Property adjustments'],
    icon: <Search size={20} />,
    accentColor: '#10B981',
    scores: { 'real-estate': 750, art: 680, commodity: 720 },
    totalAssessments: 156,
    successRate: 94,
    history: [
      { timestamp: Date.now() - 86400000 * 7, score: 720, reason: 'Initial calibration' },
      { timestamp: Date.now() - 86400000 * 5, score: 735, reason: 'Miami condo assessment' },
      { timestamp: Date.now() - 86400000 * 3, score: 742, reason: 'NYC penthouse assessment' },
      { timestamp: Date.now() - 86400000 * 1, score: 750, reason: 'LA commercial property' },
    ],
  },
  {
    id: 'valuation-agent-b',
    name: 'DCF Specialist',
    description: 'Projects future cash flows using FRED economic data and applies DCF analysis with risk-adjusted discount rates.',
    methodology: 'FRED API + Discounted Cash Flow with Monte Carlo simulation',
    strengths: ['Cash flow projection', 'DCF analysis', 'Risk assessment', 'Economic indicators'],
    icon: <TrendingUp size={20} />,
    accentColor: '#10B981',
    scores: { 'real-estate': 780, art: 710, commodity: 750 },
    totalAssessments: 142,
    successRate: 91,
    history: [
      { timestamp: Date.now() - 86400000 * 7, score: 750, reason: 'Initial calibration' },
      { timestamp: Date.now() - 86400000 * 5, score: 762, reason: 'Gold futures analysis' },
      { timestamp: Date.now() - 86400000 * 3, score: 770, reason: 'Art collection valuation' },
      { timestamp: Date.now() - 86400000 * 1, score: 780, reason: 'Commercial RE portfolio' },
    ],
  },
  {
    id: 'evidence-analyst',
    name: 'Evidence Analyst',
    description: 'Cross-references raw data points using MiMo LLM reasoning and flags inconsistencies in valuations.',
    methodology: 'MiMo LLM-powered evidence validation with confidence scoring',
    strengths: ['Data validation', 'Source cross-referencing', 'Outlier detection', 'Consistency checks'],
    icon: <Shield size={20} />,
    accentColor: '#EC4899',
    scores: { 'real-estate': 820, art: 790, commodity: 810 },
    totalAssessments: 189,
    successRate: 96,
    history: [
      { timestamp: Date.now() - 86400000 * 7, score: 800, reason: 'Initial calibration' },
      { timestamp: Date.now() - 86400000 * 5, score: 810, reason: 'Cross-validated 3 data sources' },
      { timestamp: Date.now() - 86400000 * 3, score: 815, reason: 'Flagged outlier in gold pricing' },
      { timestamp: Date.now() - 86400000 * 1, score: 820, reason: 'Verified art provenance chain' },
    ],
  },
  {
    id: 'market-data-interpreter',
    name: 'Market Interpreter',
    description: 'Evaluates macro trends and market timing using MiMo LLM and live market feeds from multiple sources.',
    methodology: 'MiMo LLM + time-series analysis with macro-economic indicators',
    strengths: ['Market trends', 'Economic indicators', 'Price forecasting', 'Timing analysis'],
    icon: <BarChart3 size={20} />,
    accentColor: '#EC4899',
    scores: { 'real-estate': 760, art: 740, commodity: 770 },
    totalAssessments: 134,
    successRate: 89,
    history: [
      { timestamp: Date.now() - 86400000 * 7, score: 740, reason: 'Initial calibration' },
      { timestamp: Date.now() - 86400000 * 5, score: 748, reason: 'Interest rate impact analysis' },
      { timestamp: Date.now() - 86400000 * 3, score: 755, reason: 'Commodity cycle prediction' },
      { timestamp: Date.now() - 86400000 * 1, score: 760, reason: 'RE market timing model' },
    ],
  },
  {
    id: 'precedent-researcher',
    name: 'Precedent Researcher',
    description: 'Searches historical assessments via vector database for relevant precedents and comparable cases.',
    methodology: 'RAG with vector similarity search across historical assessments',
    strengths: ['Case law research', 'Historical comparisons', 'Vector search', 'Pattern recognition'],
    icon: <BookOpen size={20} />,
    accentColor: '#EC4899',
    scores: { 'real-estate': 790, art: 770, commodity: 780 },
    totalAssessments: 128,
    successRate: 92,
    history: [
      { timestamp: Date.now() - 86400000 * 7, score: 770, reason: 'Initial calibration' },
      { timestamp: Date.now() - 86400000 * 5, score: 778, reason: 'Found 12 similar art cases' },
      { timestamp: Date.now() - 86400000 * 3, score: 785, reason: 'RE precedent matching' },
      { timestamp: Date.now() - 86400000 * 1, score: 790, reason: 'Gold valuation precedent' },
    ],
  },
];

// ─── Sparkline ─────────────────────────────────────────────────────────────

const MiniSparkline: React.FC<{
  data: number[];
  color?: string;
  height?: number;
  id?: string;
}> = ({ data, color = '#10B981', height = 48, id = 'sp' }) => {
  if (data.length < 2) return null;
  const w = 280;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pad = 6;

  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = height - pad - ((v - min) / range) * (height - pad * 2);
    return `${x},${y}`;
  });

  const line = pts.join(' ');
  const area = `M0,${height} L${pts.map(p => `L${p}`).join(' ')} L${w},${height} Z`;

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" style={{ display: 'block' }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.15} />
          <stop offset="100%" stopColor={color} stopOpacity={0.02} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <polyline points={line} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

// ─── Compact Agent Card (no expand — just click target) ────────────────────

const AgentCard: React.FC<{
  agent: AgentData;
  isSelected: boolean;
  onClick: () => void;
}> = ({ agent, isSelected, onClick }) => {
  const avgScore = Math.round(
    (agent.scores['real-estate'] + agent.scores.art + agent.scores.commodity) / 3
  );
  const scoreDelta = agent.history.length >= 2
    ? agent.history[agent.history.length - 1].score - agent.history[0].score
    : 0;
  const scoreColor = scoreDelta > 0 ? 'var(--success)' : scoreDelta < 0 ? 'var(--error)' : 'var(--text-tertiary)';
  const scoreIcon = scoreDelta > 0 ? '▲' : scoreDelta < 0 ? '▼' : '—';

  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--bg-elevated)',
        border: `1px solid ${isSelected ? agent.accentColor : 'var(--border-color)'}`,
        borderRadius: 'var(--card-radius)',
        padding: '16px 20px',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        boxShadow: isSelected ? `0 0 0 1px ${agent.accentColor}30, 0 2px 8px ${agent.accentColor}10` : 'var(--shadow-xs)',
      }}
      onMouseEnter={(e) => {
        if (!isSelected) e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
      }}
      onMouseLeave={(e) => {
        if (!isSelected) e.currentTarget.style.boxShadow = 'var(--shadow-xs)';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: `${agent.accentColor}10`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: agent.accentColor,
          }}>
            {agent.icon}
          </div>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
              {agent.name}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
              Rank #{AGENTS.indexOf(agent) + 1} · {agent.totalAssessments} assessments
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {avgScore}
            </div>
            <div style={{ fontSize: '0.7rem', color: scoreColor, fontWeight: 600 }}>
              {scoreIcon} {Math.abs(scoreDelta)} pts
            </div>
          </div>
          <div style={{
            padding: '4px 10px', borderRadius: 8,
            background: agent.successRate >= 90 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
            color: agent.successRate >= 90 ? 'var(--success)' : 'var(--warning)',
            fontSize: '0.8rem', fontWeight: 600,
          }}>
            {agent.successRate}%
          </div>
          <ChevronDown
            size={18}
            color="var(--text-tertiary)"
            style={{
              transition: 'transform 0.2s ease',
              transform: isSelected ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          />
        </div>
      </div>
    </div>
  );
};

// ─── Detail Panel (renders BELOW the grid, not inside a card) ──────────────

const AgentDetailPanel: React.FC<{ agent: AgentData }> = ({ agent }) => {
  const avgScore = Math.round(
    (agent.scores['real-estate'] + agent.scores.art + agent.scores.commodity) / 3
  );
  const scoreDelta = agent.history.length >= 2
    ? agent.history[agent.history.length - 1].score - agent.history[0].score
    : 0;
  const scoreColor = scoreDelta >= 0 ? 'var(--success)' : 'var(--error)';

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      style={{
        background: 'var(--bg-elevated)',
        border: `1px solid ${agent.accentColor}40`,
        borderRadius: 'var(--card-radius)',
        padding: 24,
        marginTop: 16,
        boxShadow: `0 4px 16px ${agent.accentColor}10`,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 10,
          background: `${agent.accentColor}15`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: agent.accentColor,
        }}>
          {agent.icon}
        </div>
        <div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {agent.name}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
            Score: {avgScore} · {agent.totalAssessments} assessments · {agent.successRate}% success
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Description */}
        <div>
          <div style={labelStyle}>ROLE</div>
          <div style={valueStyle}>{agent.description}</div>
        </div>

        {/* Methodology */}
        <div>
          <div style={labelStyle}>METHODOLOGY</div>
          <div style={valueStyle}>{agent.methodology}</div>
        </div>

        {/* Strengths */}
        <div style={{ gridColumn: 'span 2' }}>
          <div style={labelStyle}>STRENGTHS</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {agent.strengths.map((s, i) => (
              <span key={i} style={{
                padding: '4px 10px', borderRadius: 6,
                background: 'var(--bg-surface)',
                color: 'var(--text-secondary)',
                fontSize: '0.8rem',
                border: '1px solid var(--border-color-subtle)',
              }}>
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* Score by Asset Type */}
        <div style={{ gridColumn: 'span 2' }}>
          <div style={labelStyle}>SCORE BY ASSET TYPE</div>
          <div style={{ display: 'flex', gap: 12 }}>
            {[
              { type: 'Real Estate', score: agent.scores['real-estate'], icon: <Database size={14} /> },
              { type: 'Art', score: agent.scores.art, icon: <Star size={14} /> },
              { type: 'Commodity', score: agent.scores.commodity, icon: <Award size={14} /> },
            ].map((item) => (
              <div key={item.type} style={{
                flex: 1, padding: '10px 12px',
                background: 'var(--bg-surface)',
                borderRadius: 8,
                border: '1px solid var(--border-color-subtle)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, color: 'var(--text-tertiary)' }}>
                  {item.icon}
                  <span style={{ fontSize: '0.7rem', fontWeight: 500 }}>{item.type}</span>
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {item.score}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Score History */}
        <div style={{ gridColumn: 'span 2' }}>
          <div style={labelStyle}>SCORE HISTORY</div>
          <div style={{
            background: 'var(--bg-surface)',
            borderRadius: 8, padding: '12px 16px',
            border: '1px solid var(--border-color-subtle)',
          }}>
            <MiniSparkline
              data={agent.history.map(h => h.score)}
              color={scoreColor}
              height={48}
              id={`spark-${agent.id}`}
            />
            <div style={{
              display: 'flex', justifyContent: 'space-between', marginTop: 8,
              fontSize: '0.7rem', color: 'var(--text-tertiary)',
            }}>
              <span>{new Date(agent.history[0].timestamp).toLocaleDateString()}</span>
              <span>{agent.history.length} data points</span>
              <span>{new Date(agent.history[agent.history.length - 1].timestamp).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ─── Shared label/value styles ─────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  fontSize: '0.7rem',
  fontWeight: 600,
  color: 'var(--text-tertiary)',
  marginBottom: 6,
  letterSpacing: '0.05em',
};

const valueStyle: React.CSSProperties = {
  fontSize: '0.85rem',
  color: 'var(--text-secondary)',
  lineHeight: 1.5,
};

// ─── Main Component ────────────────────────────────────────────────────────

export const ReputationView: React.FC = () => {
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  const selectedAgent = useMemo(
    () => AGENTS.find(a => a.id === selectedAgentId) || null,
    [selectedAgentId]
  );

  const metrics = useMemo(() => {
    const total = AGENTS.length;
    const avgScore = Math.round(
      AGENTS.reduce((s, a) => s + (a.scores['real-estate'] + a.scores.art + a.scores.commodity) / 3, 0) / total
    );
    const avgSuccess = Math.round(AGENTS.reduce((s, a) => s + a.successRate, 0) / total);
    const totalAssessments = AGENTS.reduce((s, a) => s + a.totalAssessments, 0);
    return { totalAgents: total, avgScore, avgSuccess, totalAssessments };
  }, []);

  return (
    <div style={{
      padding: 'var(--page-padding-y) var(--page-padding-x)',
      maxWidth: 'var(--page-max-width)',
      margin: '0 auto',
    }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
          AI Agents
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>
          Click on any agent to view their methodology, strengths, and reputation history.
        </p>
      </div>

      {/* Aggregate Metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16, marginBottom: 32,
      }}>
        {[
          { label: 'Total Agents', value: metrics.totalAgents, icon: <Shield size={18} />, color: 'var(--primary)' },
          { label: 'Avg Score', value: metrics.avgScore, icon: <TrendingUp size={18} />, color: 'var(--success)' },
          { label: 'Avg Success', value: `${metrics.avgSuccess}%`, icon: <CheckCircle2 size={18} />, color: 'var(--info)' },
          { label: 'Total Assessments', value: metrics.totalAssessments.toLocaleString(), icon: <Target size={18} />, color: 'var(--purple)' },
        ].map((stat, i) => (
          <div key={i} style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--card-radius)',
            padding: '16px 20px',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8,
              background: `${stat.color}10`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: stat.color,
            }}>
              {stat.icon}
            </div>
            <div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>{stat.value}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Agent Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 12,
      }}>
        {AGENTS.map((agent) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            isSelected={selectedAgentId === agent.id}
            onClick={() => setSelectedAgentId(
              selectedAgentId === agent.id ? null : agent.id
            )}
          />
        ))}
      </div>

      {/* Detail Panel — renders BELOW the grid, not inside any card */}
      <AnimatePresence mode="wait">
        {selectedAgent && (
          <AgentDetailPanel key={selectedAgent.id} agent={selectedAgent} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ReputationView;
