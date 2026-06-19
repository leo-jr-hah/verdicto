import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { ReputationGraph } from '../components/ReputationGraph';

interface AgentReputation {
  agentId: string;
  agentName: string;
  description: string;
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
      winRate: 94,
      description: 'Validates raw data points and cross-references sources for accuracy.'
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
      winRate: 91,
      description: 'Searches historical dispute precedents using RAG-powered retrieval.'
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
      winRate: 89,
      description: 'Provides macro-economic context and market trend interpretation.'
    },
    {
      agentId: 'valuation-a',
      agentName: 'Comps Specialist',
      currentScore: 720,
      previousScore: 710,
      history: [
        { timestamp: Date.now() - 3600000, score: 710, reason: 'Dispute #123 resolved' },
        { timestamp: Date.now() - 7200000, score: 715, reason: 'Dispute #122 resolved' },
        { timestamp: Date.now() - 10800000, score: 720, reason: 'Dispute #121 resolved' }
      ],
      rank: 4,
      totalDisputes: 98,
      winRate: 87,
      description: 'Analyzes comparable sales and market listings to estimate asset value.'
    },
    {
      agentId: 'valuation-b',
      agentName: 'Income Specialist',
      currentScore: 710,
      previousScore: 705,
      history: [
        { timestamp: Date.now() - 3600000, score: 705, reason: 'Dispute #123 resolved' },
        { timestamp: Date.now() - 7200000, score: 708, reason: 'Dispute #122 resolved' },
        { timestamp: Date.now() - 10800000, score: 710, reason: 'Dispute #121 resolved' }
      ],
      rank: 5,
      totalDisputes: 87,
      winRate: 85,
      description: 'Projects future cash flows and applies discounted cash flow (DCF) analysis.'
    }
  ]);

  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

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

  const avgResolutionTime = '14s';
  const topPerformer = agents[0];

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">AI Agents</h1>
            <p className="page-subtitle">Meet the autonomous analysts behind every valuation. Track their accuracy, speed, and track record.</p>
          </div>
          <div className="page-header-actions">
            <div className="badge badge-success" style={{ padding: '6px 14px' }}>
              <CheckCircle2 size={14} />
              All Agents Verified
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="section">
        <div className="grid-3">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="enterprise-card" 
          style={{ background: 'var(--text-primary)', color: 'white' }}
        >
          <div style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Top Performer
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
            Honesty Score
          </div>
          <h3 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: '#10B981' }}>
            100%
          </h3>
          <div style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
            Zero penalties recorded
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="enterprise-card"
        >
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Avg Speed
          </div>
          <h3 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
            {avgResolutionTime}
          </h3>
          <div style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
            Per case resolution
          </div>
        </motion.div>
        </div>
      </div>

      {/* Reputation Graph Component */}
      <div className="section">
        <ReputationGraph agents={agents} />
      </div>

      {/* Agent Details Table */}
      <div className="section">
        <div className="table-container">
        {/* Selected Agent Detail Panel */}
        {selectedAgent && (() => {
          const agent = agents.find(a => a.agentId === selectedAgent);
          if (!agent) return null;
          return (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{
                padding: '1.25rem 1.5rem',
                background: 'var(--bg-main)',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%',
                  background: 'var(--primary)', color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.8rem', fontWeight: 700, flexShrink: 0,
                }}>
                  {agent.agentName.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>{agent.agentName}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{agent.description}</div>
                </div>
              </div>
              <button
                onClick={() => setSelectedAgent(null)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-tertiary)', fontSize: '1.1rem', padding: '0.25rem',
                }}
              >
                ✕
              </button>
            </motion.div>
          );
        })()}

        <table className="responsive-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-tertiary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Agent</th>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Role</th>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Score</th>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Accuracy</th>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Cases</th>
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
                onClick={() => setSelectedAgent(selectedAgent === agent.agentId ? null : agent.agentId)}
                style={{ 
                  borderBottom: '1px solid var(--border-color)',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  background: selectedAgent === agent.agentId ? 'var(--bg-main)' : 'transparent',
                  transition: 'background 0.15s ease',
                }}
              >
                <td data-label="Agent" style={{ padding: '1.25rem 1.5rem', fontWeight: 600, fontFamily: 'var(--font-sans)' }}>
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
                    <div>
                      <span style={{ color: 'var(--text-primary)' }}>{agent.agentName}</span>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>{agent.description}</div>
                    </div>
                  </div>
                </td>
                <td data-label="Role" style={{ padding: '1.25rem 1.5rem', color: 'var(--text-secondary)' }}>
                  {agent.agentId.includes('valuation') ? 'Valuation' : 'Juror'}
                </td>
                <td data-label="Score" style={{ padding: '1.25rem 1.5rem' }}>
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
                <td data-label="Accuracy" style={{ padding: '1.25rem 1.5rem', color: '#10B981', fontWeight: 600 }}>
                  {agent.winRate}%
                </td>
                <td data-label="Cases" style={{ padding: '1.25rem 1.5rem', color: 'var(--text-secondary)' }}>
                  {agent.totalDisputes}
                </td>
                <td data-label="Status" style={{ padding: '1.25rem 1.5rem' }}>
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
    </div>
  );
};