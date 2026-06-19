import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Award, Star } from 'lucide-react';

interface ReputationDataPoint {
  timestamp: number;
  score: number;
  assessmentId?: string;
  reason?: string;
}

interface AgentReputation {
  agentId: string;
  agentName: string;
  currentScore: number;
  previousScore: number;
  history: ReputationDataPoint[];
  rank: number;
  totalAssessments: number;
  successRate: number;
}

interface ReputationGraphProps {
  agents: AgentReputation[];
  timeRange?: '24h' | '7d' | '30d' | 'all';
}

const MiniSparkline: React.FC<{ 
  data: number[]; 
  color: string;
  width?: number;
  height?: number;
}> = ({ data, color, width = 80, height = 30 }) => {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      {/* Gradient fill */}
      <defs>
        <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.05" />
        </linearGradient>
      </defs>
      
      {/* Area fill */}
      <polygon
        points={`0,${height} ${points} ${width},${height}`}
        fill={`url(#gradient-${color.replace('#', '')})`}
      />
      
      {/* Line */}
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Current value dot */}
      <circle
        cx={width}
        cy={height - ((data[data.length - 1] - min) / range) * height}
        r="3"
        fill={color}
        stroke="white"
        strokeWidth="1"
      />
    </svg>
  );
};

const AgentReputationCard: React.FC<{
  agent: AgentReputation;
  isSelected: boolean;
  onSelect: () => void;
}> = ({ agent, isSelected, onSelect }) => {
  const scoreChange = agent.currentScore - agent.previousScore;
  const isPositive = scoreChange >= 0;

  const getScoreColor = (score: number) => {
    if (score >= 900) return '#10B981';
    if (score >= 800) return '#3B82F6';
    if (score >= 700) return '#F59E0B';
    return '#EF4444';
  };

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1: return { icon: '🥇', label: '1st' };
      case 2: return { icon: '🥈', label: '2nd' };
      case 3: return { icon: '🥉', label: '3rd' };
      default: return { icon: '🏅', label: `${rank}th` };
    }
  };

  const rankBadge = getRankBadge(agent.rank);

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      style={{
        background: isSelected ? 'var(--bg-surface-alt)' : 'var(--bg-surface)',
        border: `1px solid ${isSelected ? getScoreColor(agent.currentScore) : 'var(--border-color)'}`,
        borderRadius: '8px',
        padding: '1rem',
        cursor: 'pointer',
        transition: 'all 0.2s ease'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <div style={{ 
          width: '32px', 
          height: '32px', 
          borderRadius: '50%', 
          background: getScoreColor(agent.currentScore),
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: 'white',
          fontSize: '0.75rem',
          fontWeight: 700
        }}>
          {agent.agentName.substring(0, 2).toUpperCase()}
        </div>
        
        <div style={{ flexGrow: 1 }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            {agent.agentName}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
            {agent.totalAssessments} assessments • {agent.successRate}% success rate
          </div>
        </div>

        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.25rem',
          padding: '0.25rem 0.5rem',
          background: 'var(--bg-main)',
          borderRadius: '4px',
          fontSize: '0.7rem'
        }}>
          <span>{rankBadge.icon}</span>
          <span style={{ color: 'var(--text-secondary)' }}>{rankBadge.label}</span>
        </div>
      </div>

      {/* Score Display */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: getScoreColor(agent.currentScore) }}>
            {agent.currentScore}
          </div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.25rem',
            fontSize: '0.75rem',
            color: isPositive ? '#10B981' : '#EF4444'
          }}>
            {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            <span>{isPositive ? '+' : ''}{scoreChange}</span>
          </div>
        </div>

        <MiniSparkline 
          data={agent.history.map(p => p.score)} 
          color={getScoreColor(agent.currentScore)}
          width={80}
          height={30}
        />
      </div>

      {/* Progress Bar */}
      <div style={{ marginBottom: '0.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Reputation</span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>{agent.currentScore}/1000</span>
        </div>
        <div style={{ 
          height: '4px', 
          background: 'var(--bg-surface-alt)', 
          borderRadius: '2px',
          overflow: 'hidden'
        }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${agent.currentScore / 10}%` }}
            transition={{ duration: 1, delay: 0.2 }}
            style={{ 
              height: '100%', 
              background: getScoreColor(agent.currentScore),
              borderRadius: '2px'
            }}
          />
        </div>
      </div>

      {/* Last Activity */}
      {agent.history.length > 0 && (
        <div style={{ 
          fontSize: '0.7rem', 
          color: 'var(--text-tertiary)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem'
        }}>
          <span>Last: {new Date(agent.history[agent.history.length - 1].timestamp).toLocaleTimeString()}</span>
          {agent.history[agent.history.length - 1].reason && (
            <span>• {agent.history[agent.history.length - 1].reason}</span>
          )}
        </div>
      )}
    </motion.div>
  );
};

export const ReputationGraph: React.FC<ReputationGraphProps> = ({ agents }) => {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'score' | 'rank' | 'successRate'>('score');

  const sortedAgents = [...agents].sort((a, b) => {
    switch (sortBy) {
      case 'score': return b.currentScore - a.currentScore;
      case 'rank': return a.rank - b.rank;
      case 'successRate': return b.successRate - a.successRate;
      default: return 0;
    }
  });

  const selectedAgentData = agents.find(a => a.agentId === selectedAgent);

  return (
    <div style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Award size={20} color="var(--text-secondary)" />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Agent Reputation
          </h3>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {(['score', 'rank', 'successRate'] as const).map((option) => (
            <button
              key={option}
              onClick={() => setSortBy(option)}
              style={{
                background: sortBy === option ? 'var(--bg-surface-alt)' : 'transparent',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                padding: '0.3rem 0.6rem',
                fontSize: '0.7rem',
                color: sortBy === option ? 'var(--text-primary)' : 'var(--text-tertiary)',
                cursor: 'pointer'
              }}
            >
              {option === 'score' ? 'Score' : option === 'rank' ? 'Rank' : 'Success Rate'}
            </button>
          ))}
        </div>
      </div>

      {/* Agent Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', 
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        {sortedAgents.map((agent) => (
          <AgentReputationCard
            key={agent.agentId}
            agent={agent}
            isSelected={selectedAgent === agent.agentId}
            onSelect={() => setSelectedAgent(agent.agentId === selectedAgent ? null : agent.agentId)}
          />
        ))}
      </div>

      {/* Selected Agent Details */}
      {selectedAgentData && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'var(--bg-surface)',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            padding: '1.25rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <Star size={16} color="var(--text-secondary)" />
            <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {selectedAgentData.agentName} - Detailed History
            </h4>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
            gap: '1rem',
            marginBottom: '1rem'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {selectedAgentData.currentScore}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Current Score</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {selectedAgentData.totalAssessments}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Total Assessments</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10B981' }}>
                {selectedAgentData.successRate}%
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Success Rate</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                #{selectedAgentData.rank}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Rank</div>
            </div>
          </div>

          {/* History Timeline */}
          <div style={{ 
            maxHeight: '150px', 
            overflowY: 'auto',
            background: 'var(--bg-main)',
            borderRadius: '6px',
            padding: '0.75rem'
          }}>
            {selectedAgentData.history.slice(-10).reverse().map((point, idx) => (
              <div 
                key={idx}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.75rem',
                  padding: '0.4rem 0',
                  borderBottom: idx < selectedAgentData.history.length - 1 ? '1px solid var(--border-color)' : 'none'
                }}
              >
                <div style={{ 
                  width: '6px', 
                  height: '6px', 
                  borderRadius: '50%',
                  background: point.score >= selectedAgentData.currentScore ? '#10B981' : '#EF4444'
                }} />
                <div style={{ flexGrow: 1 }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                    Score: {point.score}
                  </div>
                  {point.reason && (
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
                      {point.reason}
                    </div>
                  )}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
                  {new Date(point.timestamp).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

