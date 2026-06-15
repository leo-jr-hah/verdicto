import React, { useState } from 'react';
import { Database, Calculator, Users, Server, Shield, Zap, Globe, Lock, Cpu, Network } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ArchNode {
  id: string;
  name: string;
  type: 'frontend' | 'backend' | 'agent' | 'blockchain' | 'external';
  icon: React.ReactNode;
  description: string;
  tech: string[];
  connections: string[];
  color: string;
}

export const ArchitectureView: React.FC = () => {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const nodes: ArchNode[] = [
    {
      id: 'dashboard',
      name: 'Verdict Dashboard',
      type: 'frontend',
      icon: <Globe size={24} />,
      description: 'React-based real-time monitoring interface for observing AI agent deliberation and blockchain transactions.',
      tech: ['React 18', 'TypeScript', 'Framer Motion', 'WebSocket'],
      connections: ['orchestrator', 'ws-server'],
      color: '#3B82F6'
    },
    {
      id: 'orchestrator',
      name: 'Orchestrator Agent',
      type: 'backend',
      icon: <Server size={24} />,
      description: 'Central coordination engine that manages dispute lifecycle, dispatches tasks to specialized agents, and aggregates results.',
      tech: ['Node.js', 'Express', 'MCP Client', 'Axios'],
      connections: ['valuation-a', 'valuation-b', 'evidence', 'market', 'precedent', 'casper-chain'],
      color: '#8B5CF6'
    },
    {
      id: 'ws-server',
      name: 'WebSocket Server',
      type: 'backend',
      icon: <Zap size={24} />,
      description: 'Real-time event broadcasting service for live updates to the dashboard.',
      tech: ['WebSocket', 'Event Emitter'],
      connections: ['dashboard'],
      color: '#F59E0B'
    },
    {
      id: 'valuation-a',
      name: 'Comps Specialist',
      type: 'agent',
      icon: <Calculator size={24} />,
      description: 'Valuation agent using comparable sales analysis via RentCast API for property valuation.',
      tech: ['RentCast API', 'MCP Server', 'x402 Payments'],
      connections: ['orchestrator', 'casper-chain'],
      color: '#EC4899'
    },
    {
      id: 'valuation-b',
      name: 'DCF Specialist',
      type: 'agent',
      icon: <Calculator size={24} />,
      description: 'Valuation agent using discounted cash flow analysis via FRED economic data.',
      tech: ['FRED API', 'MCP Server', 'x402 Payments'],
      connections: ['orchestrator', 'casper-chain'],
      color: '#F97316'
    },
    {
      id: 'evidence',
      name: 'Evidence Analyst',
      type: 'agent',
      icon: <Shield size={24} />,
      description: 'AI juror that validates raw data points, cross-references sources, and assesses evidence quality.',
      tech: ['Groq LLM', 'MCP Server', 'RAG'],
      connections: ['orchestrator'],
      color: '#10B981'
    },
    {
      id: 'market',
      name: 'Market Interpreter',
      type: 'agent',
      icon: <Users size={24} />,
      description: 'AI juror providing macro-economic context and market trend analysis for informed decision-making.',
      tech: ['Groq LLM', 'MCP Server', 'Market Data'],
      connections: ['orchestrator'],
      color: '#06B6D4'
    },
    {
      id: 'precedent',
      name: 'Precedent Researcher',
      type: 'agent',
      icon: <Database size={24} />,
      description: 'RAG-powered juror that searches historical dispute precedents and legal frameworks.',
      tech: ['Vectra RAG', 'Groq LLM', 'Vector Search'],
      connections: ['orchestrator'],
      color: '#8B5CF6'
    },
    {
      id: 'casper-chain',
      name: 'Casper Testnet',
      type: 'blockchain',
      icon: <Lock size={24} />,
      description: 'Layer-1 blockchain for immutable transaction recording, smart contract execution, and reputation tracking.',
      tech: ['Casper Network', 'Odra Contracts', 'CSPR.cloud'],
      connections: [],
      color: '#EF4444'
    },
    {
      id: 'external-apis',
      name: 'External APIs',
      type: 'external',
      icon: <Cpu size={24} />,
      description: 'Third-party data sources for market information, economic indicators, and property data.',
      tech: ['RentCast', 'FRED', 'CSPR.cloud'],
      connections: ['valuation-a', 'valuation-b'],
      color: '#6B7280'
    }
  ];

  const getNodePosition = (id: string) => {
    // Left-to-Right Process Flow Layout
    const positions: Record<string, { x: number; y: number }> = {
      'dashboard': { x: 150, y: 200 },
      'external-apis': { x: 150, y: 500 },
      'ws-server': { x: 400, y: 100 },
      'orchestrator': { x: 400, y: 300 },
      'evidence': { x: 750, y: 100 },
      'market': { x: 750, y: 200 },
      'precedent': { x: 750, y: 300 },
      'valuation-a': { x: 750, y: 400 },
      'valuation-b': { x: 750, y: 500 },
      'casper-chain': { x: 1050, y: 450 }
    };
    return positions[id] || { x: 600, y: 300 };
  };

  const selectedNodeData = nodes.find(n => n.id === selectedNode);

  const getPath = (sourceId: string, targetId: string, sx: number, sy: number, tx: number, ty: number) => {
    // Custom sweep curve for Orchestrator -> Casper to gracefully bypass the AI agents
    if (sourceId === 'orchestrator' && targetId === 'casper-chain') {
      return `M ${sx} ${sy} C ${sx} 600, ${tx} 600, ${tx} ${ty}`;
    }
    
    // Default smooth horizontal S-curve
    const cx = (sx + tx) / 2;
    return `M ${sx} ${sy} C ${cx} ${sy}, ${cx} ${ty}, ${tx} ${ty}`;
  };

  // Deduplicate edges so animated dashes don't overlap
  const edges = new Set<string>();
  const uniquePaths: { sourceId: string; targetId: string }[] = [];
  nodes.forEach(node => {
    node.connections.forEach(targetId => {
      const edgeId1 = `${node.id}-${targetId}`;
      const edgeId2 = `${targetId}-${node.id}`;
      if (!edges.has(edgeId1) && !edges.has(edgeId2)) {
        edges.add(edgeId1);
        uniquePaths.push({ sourceId: node.id, targetId });
      }
    });
  });

  return (
    <div className="container" style={{ padding: '3rem 0' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <Network size={28} color="var(--text-secondary)" />
          <h2 style={{ fontSize: '2.5rem', margin: 0 }}>System Architecture</h2>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '700px', margin: '0 auto' }}>
          Visualizing the data flow between the User Interface, AI Agents, and the Casper Blockchain. Click any node to explore.
        </p>
      </div>

      {/* Architecture Diagram */}
      <div style={{ width: '100%', overflowX: 'auto', paddingBottom: '1rem' }}>
        <div style={{ 
          position: 'relative', 
          minWidth: '1000px',
          height: '640px',
          background: 'var(--bg-surface)',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          overflow: 'hidden',
          marginBottom: '2rem'
        }}>
          <style>
            {`
              .system-flow-line {
                fill: none;
                stroke-dasharray: 6 6;
                animation: flowLineAnim 1s linear infinite;
              }
              .system-flow-line.highlight {
                stroke-dasharray: none;
                animation: none;
                stroke-width: 3px !important;
              }
              @keyframes flowLineAnim {
                from { stroke-dashoffset: 12; }
                to { stroke-dashoffset: 0; }
              }
            `}
          </style>

          {/* Grid Background */}
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              radial-gradient(circle at 1px 1px, var(--border-color) 1px, transparent 0)
            `,
            backgroundSize: '32px 32px',
            opacity: 0.4
          }} />

          {/* Connection Lines */}
          <svg viewBox="0 0 1200 640" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} preserveAspectRatio="none">
            {uniquePaths.map(({ sourceId, targetId }) => {
              const sourceNode = nodes.find(n => n.id === sourceId);
              const targetNode = nodes.find(n => n.id === targetId);
              if (!sourceNode || !targetNode) return null;
              
              const source = getNodePosition(sourceId);
              const target = getNodePosition(targetId);
              const isHighlighted = selectedNode === sourceId || selectedNode === targetId;
              
              return (
                <path
                  key={`${sourceId}-${targetId}`}
                  d={getPath(sourceId, targetId, source.x, source.y, target.x, target.y)}
                  className={`system-flow-line ${isHighlighted ? 'highlight' : ''}`}
                  stroke={isHighlighted ? sourceNode.color : 'var(--text-tertiary)'}
                  strokeWidth="2"
                  opacity={isHighlighted ? 0.8 : 0.25}
                />
              );
            })}
          </svg>

          {/* Nodes */}
          {nodes.map((node, idx) => {
            const pos = getNodePosition(node.id);
            const isSelected = selectedNode === node.id;
            const isHovered = hoveredNode === node.id;
            const isConnected = selectedNode && (node.connections.includes(selectedNode) || nodes.find(n => n.id === selectedNode)?.connections.includes(node.id));
            
            return (
              <motion.div
                key={node.id}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                style={{
                  position: 'absolute',
                  left: `${(pos.x / 1200) * 100}%`,
                  top: `${(pos.y / 640) * 100}%`,
                  transform: 'translate(-50%, -50%)',
                  zIndex: isSelected || isHovered ? 10 : 1,
                  cursor: 'pointer'
                }}
                onClick={() => setSelectedNode(isSelected ? null : node.id)}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    width: '85px',
                    height: '85px',
                    borderRadius: '16px',
                    background: isSelected || isHovered ? node.color : 'var(--bg-main)',
                    border: `2px solid ${isSelected || isConnected ? node.color : 'var(--border-color)'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.35rem',
                    boxShadow: isSelected || isHovered ? `0 0 24px ${node.color}55` : 'var(--shadow-sm)',
                    transition: 'all 0.2s ease',
                    padding: '0.25rem'
                  }}
                >
                  <div style={{ color: isSelected || isHovered ? 'white' : node.color }}>
                    {node.icon}
                  </div>
                  <span style={{ 
                    fontSize: '0.6rem', 
                    fontWeight: 600, 
                    color: isSelected || isHovered ? 'white' : 'var(--text-secondary)',
                    textAlign: 'center',
                    lineHeight: 1.2,
                    maxWidth: '80px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    whiteSpace: 'normal'
                  }}>
                    {node.name}
                  </span>
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Detail Panel */}
      <AnimatePresence>
        {selectedNodeData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="enterprise-card"
            style={{ padding: '2rem', marginBottom: '2rem' }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem' }}>
              <div style={{ 
                width: '60px', 
                height: '60px', 
                borderRadius: '12px', 
                background: `${selectedNodeData.color}22`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: selectedNodeData.color,
                flexShrink: 0
              }}>
                {selectedNodeData.icon}
              </div>
              
              <div style={{ flexGrow: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                    {selectedNodeData.name}
                  </h3>
                  <span style={{ 
                    padding: '0.25rem 0.75rem', 
                    background: `${selectedNodeData.color}22`, 
                    color: selectedNodeData.color,
                    borderRadius: '999px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textTransform: 'capitalize'
                  }}>
                    {selectedNodeData.type}
                  </span>
                </div>
                
                <p style={{ 
                  fontSize: '0.95rem', 
                  color: 'var(--text-secondary)', 
                  lineHeight: 1.6,
                  marginBottom: '1rem'
                }}>
                  {selectedNodeData.description}
                </p>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {selectedNodeData.tech.map(tech => (
                    <span 
                      key={tech}
                      style={{ 
                        padding: '0.35rem 0.75rem', 
                        background: 'var(--bg-surface)', 
                        border: '1px solid var(--border-color)',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
              
              <button 
                onClick={() => setSelectedNode(null)}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: 'var(--text-tertiary)', 
                  cursor: 'pointer',
                  fontSize: '1.25rem'
                }}
              >
                ✕
              </button>
            </div>
            
            {selectedNodeData.connections.length > 0 && (
              <div style={{ 
                marginTop: '1.5rem', 
                paddingTop: '1.5rem', 
                borderTop: '1px solid var(--border-color)' 
              }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', marginBottom: '0.75rem' }}>
                  Connected to:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {selectedNodeData.connections.map(connId => {
                    const connNode = nodes.find(n => n.id === connId);
                    return connNode ? (
                      <button
                        key={connId}
                        onClick={() => setSelectedNode(connId)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.5rem 0.75rem',
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          color: 'var(--text-secondary)',
                          fontSize: '0.85rem'
                        }}
                      >
                        <div style={{ color: connNode.color }}>{connNode.icon}</div>
                        {connNode.name}
                      </button>
                    ) : null;
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        gap: '2rem',
        flexWrap: 'wrap'
      }}>
        {[
          { type: 'frontend', label: 'Frontend', color: '#3B82F6' },
          { type: 'backend', label: 'Backend', color: '#8B5CF6' },
          { type: 'agent', label: 'AI Agents', color: '#10B981' },
          { type: 'blockchain', label: 'Blockchain', color: '#EF4444' },
          { type: 'external', label: 'External', color: '#6B7280' }
        ].map(item => (
          <div key={item.type} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ 
              width: '12px', 
              height: '12px', 
              borderRadius: '3px', 
              background: item.color 
            }} />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};