import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  User, Brain, Database, Shield, Scale, Gavel, FileCheck, Link2, 
  Search, TrendingUp, BookOpen, Zap 
} from 'lucide-react';

/**
 * ArchitectureDiagram - "How the Oracle Gets Fed"
 * 
 * A clean, properly-connected vertical flow diagram showing the real pipeline:
 * 
 *   User → Orchestrator → Data Sources → x402 Payment
 *                                       ↓
 *                     ┌─────────────────┼─────────────────┐
 *                     ↓                 ↓                 ↓
 *              Comps Specialist   DCF Specialist     MiMo LLM
 *                     └─────────────────┼─────────────────┘
 *                                       ↓
 *                     ┌─────────────────┼─────────────────┐
 *                     ↓                 ↓                 ↓
 *              Evidence Analyst  Market Interpreter  Precedent Researcher
 *                     └─────────────────┼─────────────────┘
 *                                       ↓
 *                    Trust Framework → HMAC Receipt Chain → Verdict Oracle
 *                                                          ↓
 *                                                    Casper Blockchain
 */

// ─── Step definitions ──────────────────────────────────────────────────────

interface FlowNode {
  id: string;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
  accentColor: string;
  row: number;
  col: number;
}

const NODES: FlowNode[] = [
  // Row 0: Entry
  { id: 'user', label: 'You', sublabel: 'Connect wallet, choose product', icon: <User size={18} />, accentColor: 'var(--primary)', row: 0, col: 0 },
  { id: 'orchestrator', label: 'Orchestrator', sublabel: 'Routes to product pipeline', icon: <Brain size={18} />, accentColor: 'var(--text-secondary)', row: 0, col: 1 },

  // Row 1: Data & Payment
  { id: 'datasources', label: 'Data Sources', sublabel: 'RentCast, FRED, CSPR.cloud', icon: <Database size={18} />, accentColor: 'var(--text-secondary)', row: 1, col: 0 },
  { id: 'x402', label: 'x402 Payment', sublabel: '1-5 CSPR per product', icon: <Zap size={18} />, accentColor: 'var(--primary)', row: 1, col: 1 },

  // Row 2: AI Agents
  { id: 'comps', label: 'Agent A', sublabel: 'Comparable sales analysis', icon: <Search size={18} />, accentColor: 'var(--text-secondary)', row: 2, col: 0 },
  { id: 'dcf', label: 'Agent B', sublabel: 'Discounted cash flow', icon: <TrendingUp size={18} />, accentColor: 'var(--text-secondary)', row: 2, col: 1 },
  { id: 'llm', label: 'LLM Engine', sublabel: 'Qualitative reasoning', icon: <Brain size={18} />, accentColor: 'var(--text-secondary)', row: 2, col: 2 },

  // Row 3: Jurors
  { id: 'evidence', label: 'Evidence Analyst', sublabel: 'Data quality review', icon: <Shield size={18} />, accentColor: 'var(--text-tertiary)', row: 3, col: 0 },
  { id: 'market', label: 'Market Interpreter', sublabel: 'Macro trends and timing', icon: <TrendingUp size={18} />, accentColor: 'var(--text-tertiary)', row: 3, col: 1 },
  { id: 'precedent', label: 'Precedent Researcher', sublabel: 'Historical comparisons', icon: <BookOpen size={18} />, accentColor: 'var(--text-tertiary)', row: 3, col: 2 },

  // Row 4: Settlement
  { id: 'trust', label: 'Trust Framework', sublabel: 'Reputation scoring', icon: <Scale size={18} />, accentColor: 'var(--text-secondary)', row: 4, col: 0 },
  { id: 'hmac', label: 'HMAC Receipt Chain', sublabel: 'Tamper-proof audit trail', icon: <FileCheck size={18} />, accentColor: 'var(--text-secondary)', row: 4, col: 1 },
  { id: 'verdict', label: 'Verdict Oracle', sublabel: 'On-chain dispute resolution', icon: <Gavel size={18} />, accentColor: 'var(--primary)', row: 4, col: 2 },

  // Row 5: On-chain
  { id: 'blockchain', label: 'Casper Blockchain', sublabel: 'Immutable on-chain record', icon: <Link2 size={18} />, accentColor: 'var(--primary)', row: 5, col: 1 },
];

interface FlowEdge {
  from: string;
  to: string;
  animated?: boolean;
}

const EDGES: FlowEdge[] = [
  // Row 0 connections
  { from: 'user', to: 'orchestrator', animated: true },
  
  // Row 0 → Row 1
  { from: 'orchestrator', to: 'datasources', animated: true },
  { from: 'orchestrator', to: 'x402', animated: true },
  
  // Row 1 → Row 2
  { from: 'datasources', to: 'comps', animated: true },
  { from: 'datasources', to: 'dcf', animated: true },
  { from: 'datasources', to: 'llm', animated: true },
  
  // Row 2 → Row 3 (parallel flow)
  { from: 'comps', to: 'evidence', animated: true },
  { from: 'comps', to: 'market', animated: true },
  { from: 'comps', to: 'precedent', animated: true },
  { from: 'dcf', to: 'evidence', animated: true },
  { from: 'dcf', to: 'market', animated: true },
  { from: 'dcf', to: 'precedent', animated: true },
  { from: 'llm', to: 'evidence', animated: true },
  { from: 'llm', to: 'market', animated: true },
  { from: 'llm', to: 'precedent', animated: true },
  
  // Row 3 → Row 4
  { from: 'evidence', to: 'trust', animated: true },
  { from: 'market', to: 'trust', animated: true },
  { from: 'precedent', to: 'trust', animated: true },
  { from: 'trust', to: 'hmac', animated: true },
  { from: 'hmac', to: 'verdict', animated: true },
  
  // Row 4 → Row 5
  { from: 'verdict', to: 'blockchain', animated: true },
];

// ─── Layout constants ──────────────────────────────────────────────────────

const NODE_W = 180;
const NODE_H = 64;
const COL_GAP = 280;
const ROW_GAP = 120;
const PAD_X = 60;
const PAD_Y = 60;
const SVG_W = PAD_X * 2 + 3 * COL_GAP;
const SVG_H = PAD_Y * 2 + 6 * ROW_GAP + NODE_H;

// ─── Helpers ───────────────────────────────────────────────────────────────

function getNodeCenter(node: FlowNode): { x: number; y: number } {
  const row = node.row;
  const col = node.col;
  
  // Count nodes in this row
  const nodesInRow = NODES.filter(n => n.row === row);
  const colsInRow = nodesInRow.length;
  
  // Center the row horizontally
  const totalRowWidth = (colsInRow - 1) * COL_GAP;
  const startX = (SVG_W - totalRowWidth) / 2;
  
  return {
    x: startX + col * COL_GAP + NODE_W / 2,
    y: PAD_Y + row * ROW_GAP + NODE_H / 2,
  };
}

function getNodeById(id: string): FlowNode | undefined {
  return NODES.find(n => n.id === id);
}

// ─── Component ─────────────────────────────────────────────────────────────

export const ArchitectureDiagram: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (svgRef.current) {
      observer.observe(svgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Get connected nodes for hover highlighting
  const connectedNodes = hoveredNode
    ? new Set([
        hoveredNode,
        ...EDGES.filter(e => e.from === hoveredNode || e.to === hoveredNode).flatMap(e => [e.from, e.to]),
      ])
    : null;

  return (
    <section style={{
      padding: '80px 32px',
      background: 'var(--bg-main)',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          style={{ marginBottom: 48 }}
        >
          <h2 style={{
            fontSize: '2rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: 12,
          }}>
            How the Oracle Gets Fed
          </h2>
          <p style={{
            fontSize: '1rem',
            color: 'var(--text-secondary)',
            maxWidth: 600,
            margin: '0 auto',
            lineHeight: 1.6,
          }}>
            Every product follows this pipeline, from wallet connection to immutable on-chain record.
          </p>
        </motion.div>

        {/* Flow Diagram */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          overflow: 'auto',
        }}>
          <svg
            ref={svgRef}
            width={SVG_W}
            height={SVG_H}
            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            style={{
              maxWidth: '100%',
              height: 'auto',
            }}
          >
            {/* Background Grid */}
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--border-color-subtle)" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* Edges */}
            {EDGES.map((edge, i) => {
              const fromNode = getNodeById(edge.from);
              const toNode = getNodeById(edge.to);
              if (!fromNode || !toNode) return null;

              const from = getNodeCenter(fromNode);
              const to = getNodeCenter(toNode);

              const isHighlighted = connectedNodes && (
                connectedNodes.has(edge.from) && connectedNodes.has(edge.to)
              );

              return (
                <g key={`edge-${i}`}>
                  {/* Edge line */}
                  <line
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                    stroke={isHighlighted ? 'var(--primary)' : 'var(--border-color)'}
                    strokeWidth={isHighlighted ? 2 : 1}
                    strokeDasharray={isHighlighted ? 'none' : '4 4'}
                    style={{
                      transition: 'all 0.2s ease',
                    }}
                  />

                  {/* Animated packet */}
                  {edge.animated && isVisible && (
                    <circle r="3" fill="var(--primary)" opacity="0.8">
                      <animateMotion
                        dur={`${2 + i * 0.1}s`}
                        repeatCount="indefinite"
                        path={`M${from.x},${from.y} L${to.x},${to.y}`}
                      />
                    </circle>
                  )}
                </g>
              );
            })}

            {/* Nodes */}
            {NODES.map((node) => {
              const center = getNodeCenter(node);
              const isHovered = hoveredNode === node.id;
              const isConnected = connectedNodes?.has(node.id);

              return (
                <g
                  key={node.id}
                  transform={`translate(${center.x - NODE_W / 2}, ${center.y - NODE_H / 2})`}
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Node background */}
                  <rect
                    width={NODE_W}
                    height={NODE_H}
                    rx={8}
                    fill={isHovered ? 'var(--bg-surface)' : 'var(--bg-elevated)'}
                    stroke={isHovered ? node.accentColor : isConnected ? 'var(--primary)' : 'var(--border-color)'}
                    strokeWidth={isHovered ? 2 : 1}
                    style={{
                      transition: 'all 0.2s ease',
                      filter: isHovered ? `drop-shadow(0 4px 12px ${node.accentColor}33)` : 'none',
                    }}
                  />

                  {/* Left accent bar */}
                  <rect
                    x={0}
                    y={0}
                    width={4}
                    height={NODE_H}
                    rx={2}
                    fill={node.accentColor}
                    opacity={isHovered ? 1 : 0.6}
                    style={{ transition: 'opacity 0.2s ease' }}
                  />

                  {/* Icon */}
                  <foreignObject x={16} y={20} width={24} height={24}>
                    <div style={{ color: node.accentColor }}>
                      {node.icon}
                    </div>
                  </foreignObject>

                  {/* Label */}
                  <text
                    x={40}
                    y={26}
                    fontSize={13}
                    fontWeight={600}
                    fill="var(--text-primary)"
                    fontFamily="var(--font-sans)"
                  >
                    {node.label}
                  </text>

                  {/* Sublabel */}
                  <text
                    x={40}
                    y={44}
                    fontSize={10}
                    fill="var(--text-tertiary)"
                    fontFamily="var(--font-sans)"
                  >
                    {node.sublabel}
                  </text>
                </g>
              );
            })}

            {/* Row labels */}
            {['ENTRY', 'DATA & PAY', 'AI AGENTS', 'DELIBERATION', 'SETTLEMENT', 'CHAIN'].map((label, i) => (
              <text
                key={label}
                x={24}
                y={PAD_Y + i * ROW_GAP + NODE_H / 2 + 4}
                fontSize={9}
                fontWeight={600}
                fill="var(--text-tertiary)"
                fontFamily="var(--font-sans)"
                letterSpacing="0.05em"
                textAnchor="start"
              >
                {label}
              </text>
            ))}
          </svg>
        </div>

        {/* Legend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          viewport={{ once: true }}
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 24,
            marginTop: 32,
            flexWrap: 'wrap',
          }}
        >
          {[
            { color: 'var(--success)', label: 'AI Agents' },
            { color: 'var(--pink)', label: 'Jurors' },
            { color: 'var(--warning)', label: 'Trust & Payment' },
            { color: 'var(--text-accent)', label: 'Blockchain' },
          ].map((item) => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 12,
                height: 12,
                borderRadius: 3,
                background: item.color,
              }} />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {item.label}
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default ArchitectureDiagram;
