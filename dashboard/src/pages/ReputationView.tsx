import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { ReputationGraph } from '../components/ReputationGraph';

interface AgentReputation {
  agentId: string;
  agentName: string;
  currentScore: number;
  previousScore: number;
  history: { timestamp: number; score: number; reason?: string }[];
  rank: number;
  totalDisputes: number;
  winRate: number;
}

export const ReputationView: React.FC = () => {
  const [agents, setAgents] = useState<AgentReputation[]>([
    {
      agentId: 'evidence',
      agentName: 'Evidence Reviewer',
      currentScore: 850,
      previousScore: 820,
      history: [
        { timestamp: Date.now() - 3600000, score: 820, reason: 'Dispute #123 resolved' },
        { timestamp: Date.now() - 7200000, score: 835, reason: 'Dispute #122 resolved' },
        { timestamp: Date.now() - 10800000, score: 850, reason: 'Dispute #121 resolved' }
      ],
      rank: 1,
      totalDisputes: 156,
      winRate: 94
    },
    {
      agentId: 'precedent',
      agentName: 'Case Researcher',
      currentScore: 790,
      previousScore: 780,
      history: [
        { timestamp: Date.now() - 3600000, score: 780, reason: 'Dispute #123 resolved' },
        { timestamp: Date.now() - 7200000, score: 785, reason: 'Dispute #122 resolved' },
        { timestamp: Date.now() - 10800000, score: 790, reason: 'Dispute #121 resolved' }
      ],
      rank: 2,
      totalDisputes: 142,
      winRate: 91
    },
    {
      agentId: 'market',
      agentName: 'Trend Analyst',
      currentScore: 760,
      previousScore: 755,
      history: [
        { timestamp: Date.now() - 3600000, score: 755, reason: 'Dispute #123 resolved' },
        { timestamp: Date.now() - 7200000, score: 758, reason: 'Dispute #122 resolved' },
        { timestamp: Date.now() - 10800000, score: 760, reason: 'Dispute #121 resolved' }
      ],
      rank: 3,
      totalDisputes: 128,
      winRate: 89
    },
    {
      agentId: 'valuation-a',
      agentName: 'Market Analyst',
      currentScore: 720,
      previousScore: 710,
      history: [
        { timestamp: Date.now() - 3600000, score: 710, reason: 'Dispute #123 resolved' },
        { timestamp: Date.now() - 7200000, score: 715, reason: 'Dispute #122 resolved' },
        { timestamp: Date.now() - 10800000, score: 720, reason: 'Dispute #121 resolved' }
      ],
      rank: 4,
      totalDisputes: 98,
      winRate: 87
    },
    {
      agentId: 'valuation-b',
      agentName: 'Income Analyst',
      currentScore: 710,
      previousScore: 705,
      history: [
        { timestamp: Date.now() - 3600000, score: 705, reason: 'Dispute #123 resolved' },
        { timestamp: Date.now() - 7200000, score: 708, reason: 'Dispute #122 resolved' },
        { timestamp: Date.now() - 10800000, score: 710, reason: 'Dispute #121 resolved' }
      ],
      rank: 5,
      totalDisputes: 87,
      winRate: 85
    }
  ]);

  // Listen for reputation updates via WebSocket
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3010');
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'reputation_update') {
        setAgents(prev => prev.map(agent => {
          if (agent.agentId === data.payload.agentId) {
            return {
              ...agent,
              currentScore: data.payload.newScore,
              previousScore: agent.currentScore,
              history: [
                ...agent.history,
                { timestamp: Date.now(), score: data.payload.newScore, reason: data.payload.reason }
              ].slice(-20) // Keep last 20 entries
            };
          }
          return agent;
        }));
      }
    };

    return () => ws.close();
  }, []);

  const totalSlashingEvents = 0;
  const avgResolutionTime = '14s';
  const topPerformer = agents[0];

  return (
    <div className="container" style={{ padding: '3rem 0' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <Shield size={24} color="var(--text-secondary)" />
            <h2 style={{ fontSize: '2rem', margin: 0 }}>Agent Reputation Registry</h2>
          </div>
          <p style={{ color: 'var(--text-secondary)' }}>
            On-chain reliability metrics governing agent selection probability and dispute resolution authority.
          </p>
        </div>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem',
          padding: '0.5rem 1rem',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: '999px',
          fontSize: '0.85rem',
          color: '#10B981'
        }}>
          <CheckCircle2 size={14} />
          All Agents Verified
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', marginBottom: '3rem' }}>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="enterprise-card" 
          style={{ background: 'var(--text-primary)', color: 'white' }}
        >
          <div style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Top Performing Juror
          </div>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
            {topPerformer.agentName}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
            <Shield size={16} /> Score: {topPerformer.currentScore}
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="enterprise-card"
        >
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Total Slashing Events
          </div>
          <h3 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: '#10B981' }}>
            {totalSlashingEvents}
          </h3>
          <div style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
            Network behaves honestly
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="enterprise-card"
        >
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Avg Resolution Time
          </div>
          <h3 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
            {avgResolutionTime}
          </h3>
          <div style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
            Block finality
          </div>
        </motion.div>
      </div>

      {/* Reputation Graph Component */}
      <ReputationGraph agents={agents} />

      {/* Agent Details Table */}
      <div className="enterprise-card" style={{ padding: 0, overflow: 'hidden', marginTop: '2rem' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-tertiary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Agent Identity</th>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Role</th>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Reputation Score</th>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Win Rate</th>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Disputes</th>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {agents.map((agent, i) => (
              <motion.tr 
                key={agent.agentId}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                style={{ 
                  borderBottom: '1px solid var(--border-color)',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '0.85rem'
                }}
              >
                <td style={{ padding: '1.25rem 1.5rem', fontWeight: 600, fontFamily: 'var(--font-sans)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ 
                      width: '32px', 
                      height: '32px', 
                      borderRadius: '50%', 
                      background: 'var(--bg-surface-alt)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: 'var(--text-secondary)'
                    }}>
                      {agent.agentName.substring(0, 2).toUpperCase()}
                    </div>
                    <span style={{ color: 'var(--text-primary)' }}>{agent.agentName}</span>
                  </div>
                </td>
                <td style={{ padding: '1.25rem 1.5rem', color: 'var(--text-secondary)' }}>
                  {agent.agentId.includes('valuation') ? 'Valuation' : 'Juror'}
                </td>
                <td style={{ padding: '1.25rem 1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ 
                      width: '60px', 
                      height: '6px', 
                      background: 'var(--bg-surface-alt)', 
                      borderRadius: '3px',
                      overflow: 'hidden'
                    }}>
                      <div style={{ 
                        width: `${agent.currentScore / 10}%`, 
                        height: '100%', 
                        background: agent.currentScore >= 800 ? '#10B981' : agent.currentScore >= 700 ? '#F59E0B' : '#EF4444',
                        borderRadius: '3px'
                      }} />
                    </div>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{agent.currentScore}</span>
                  </div>
                </td>
                <td style={{ padding: '1.25rem 1.5rem', color: '#10B981', fontWeight: 600 }}>
                  {agent.winRate}%
                </td>
                <td style={{ padding: '1.25rem 1.5rem', color: 'var(--text-secondary)' }}>
                  {agent.totalDisputes}
                </td>
                <td style={{ padding: '1.25rem 1.5rem' }}>
                  <span style={{ 
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.25rem 0.6rem',
                    background: 'rgba(16, 185, 129, 0.1)',
                    color: '#10B981',
                    borderRadius: '999px',
                    fontSize: '0.75rem',
                    fontWeight: 600
                  }}>
                    <CheckCircle2 size={12} />
                    Active
                  </span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};