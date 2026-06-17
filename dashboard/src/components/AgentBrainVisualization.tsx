import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain } from 'lucide-react';

interface AgentThought {
  id: string;
  agent: string;
  timestamp: number;
  thought: string;
  confidence: number;
  tokensUsed: number;
  category: 'reasoning' | 'evidence' | 'decision' | 'validation';
}

interface AgentBrainProps {
  agentId: string;
  agentName: string;
  color: string;
  thoughts: AgentThought[];
  reputation: number;
  status: 'idle' | 'thinking' | 'completed';
}

const AgentBrain: React.FC<AgentBrainProps> = ({ agentName, color, thoughts, reputation, status }) => {
  const [expanded, setExpanded] = useState(false);
  const latestThought = thoughts[thoughts.length - 1];

  return (
    <motion.div 
      className="agent-brain-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: 'var(--bg-surface)',
        border: `1px solid ${color}33`,
        borderRadius: '8px',
        padding: '1rem',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden'
      }}
      onClick={() => setExpanded(!expanded)}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <div style={{ 
          width: '32px', 
          height: '32px', 
          borderRadius: '50%', 
          background: color,
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: 'white',
          fontSize: '0.75rem',
          fontWeight: 700
        }}>
          {agentName.substring(0, 2).toUpperCase()}
        </div>
        <div style={{ flexGrow: 1 }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            {agentName}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
            Rep: {reputation} • {thoughts.length} thoughts
          </div>
        </div>
        <div style={{ 
          width: '8px', 
          height: '8px', 
          borderRadius: '50%',
          background: status === 'thinking' ? '#F59E0B' : status === 'completed' ? '#10B981' : '#6B7280',
          boxShadow: status === 'thinking' ? `0 0 8px ${color}` : 'none'
        }} />
      </div>

      {/* Latest Thought Preview */}
      {latestThought && (
        <div style={{ 
          background: 'var(--bg-main)', 
          borderRadius: '4px', 
          padding: '0.5rem',
          fontSize: '0.8rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.4,
          marginBottom: '0.5rem'
        }}>
          {latestThought.thought.length > 100 
            ? latestThought.thought.substring(0, 100) + '...' 
            : latestThought.thought}
        </div>
      )}

      {/* Confidence Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
        <div style={{ flexGrow: 1, height: '4px', background: 'var(--bg-surface-alt)', borderRadius: '2px', overflow: 'hidden' }}>
          <div 
            style={{ 
              width: `${latestThought?.confidence || 0}%`, 
              height: '100%', 
              background: color,
              borderRadius: '2px',
              transition: 'width 0.3s ease'
            }} 
          />
        </div>
        <span>{latestThought?.confidence || 0}%</span>
      </div>

      {/* Expanded View */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}
          >
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '0.5rem' }}>
              Thought History ({thoughts.length})
            </div>
            <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
              {thoughts.slice(-5).reverse().map((thought) => (
                <div 
                  key={thought.id}
                  style={{ 
                    padding: '0.4rem 0.5rem',
                    marginBottom: '0.25rem',
                    background: 'var(--bg-surface-alt)',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                    <span style={{ color: 'var(--text-tertiary)' }}>
                      {new Date(thought.timestamp).toLocaleTimeString()}
                    </span>
                    <span style={{ color: color }}>
                      {thought.confidence}% confidence
                    </span>
                  </div>
                  {thought.thought}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export const AgentBrainVisualization: React.FC = () => {
  const [agentThoughts, setAgentThoughts] = useState<Record<string, AgentThought[]>>({
    'valuation-a': [],
    'valuation-b': [],
    'evidence': [],
    'market': [],
    'precedent': []
  });

  const [agentStatus, setAgentStatus] = useState<Record<string, 'idle' | 'thinking' | 'completed'>>({
    'valuation-a': 'idle',
    'valuation-b': 'idle',
    'evidence': 'idle',
    'market': 'idle',
    'precedent': 'idle'
  });

  const [agentReputation] = useState<Record<string, number>>({
    'valuation-a': 850,
    'valuation-b': 820,
    'evidence': 780,
    'market': 760,
    'precedent': 790
  });

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3010');
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'agent_thought') {
        const agentId = data.payload.agentId;
        const newThought: AgentThought = {
          id: Math.random().toString(36).substr(2, 9),
          agent: data.payload.agentName,
          timestamp: data.payload.timestamp,
          thought: data.payload.thought,
          confidence: data.payload.confidence,
          tokensUsed: data.payload.tokensUsed,
          category: data.payload.category
        };
        
        setAgentThoughts(prev => ({
          ...prev,
          [agentId]: [...(prev[agentId] || []), newThought]
        }));
        
        // Update status based on confidence
        if (data.payload.confidence > 90) {
          setAgentStatus(prev => ({ ...prev, [agentId]: 'completed' }));
        } else if (data.payload.confidence > 0) {
          setAgentStatus(prev => ({ ...prev, [agentId]: 'thinking' }));
        }
      }
      
      if (data.type === 'juror_vote') {
        const jurorId = data.payload.juror.toLowerCase().replace(' ', '-');
        const newThought: AgentThought = {
          id: Math.random().toString(36).substr(2, 9),
          agent: data.payload.juror,
          timestamp: Date.now(),
          thought: `Vote: ${data.payload.verdict.vote} - "${data.payload.verdict.reasoning.substring(0, 80)}..."`,
          confidence: 75 + Math.random() * 20,
          tokensUsed: Math.floor(Math.random() * 1000) + 500,
          category: 'decision'
        };
        
        setAgentThoughts(prev => ({
          ...prev,
          [jurorId]: [...(prev[jurorId] || []), newThought]
        }));
        
        // Update status to completed after voting
        setAgentStatus(prev => ({ ...prev, [jurorId]: 'completed' }));
      }
    };

    return () => ws.close();
  }, []);

  const agents = [
    { id: 'valuation-a', name: 'Comps Specialist', color: '#8B5CF6' },
    { id: 'valuation-b', name: 'DCF Specialist', color: '#EC4899' },
    { id: 'evidence', name: 'Evidence Analyst', color: '#10B981' },
    { id: 'market', name: 'Market Interpreter', color: '#F59E0B' },
    { id: 'precedent', name: 'Precedent Researcher', color: '#3B82F6' }
  ];

  return (
    <div style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <Brain size={20} color="var(--text-secondary)" />
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
          Agent Brain Activity
        </h3>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        {agents.map(agent => (
          <AgentBrain
            key={agent.id}
            agentId={agent.id}
            agentName={agent.name}
            color={agent.color}
            thoughts={agentThoughts[agent.id] || []}
            reputation={agentReputation[agent.id]}
            status={agentStatus[agent.id]}
          />
        ))}
      </div>
    </div>
  );
};

