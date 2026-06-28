import React, { useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { 
  User, Brain, Database, Shield, Scale, Gavel, FileCheck, Link2, 
  Search, TrendingUp, BookOpen, Zap 
} from 'lucide-react';

/**
 * ArchitectureDiagram - "How the Oracle Gets Fed"
 */

interface FlowNode {
  id: string;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
  accentColor: string;
  row: number;
  col: number;
  isCore?: boolean;
}

const NODES: FlowNode[] = [
  { id: 'user', label: 'You', sublabel: 'Connect wallet, choose product', icon: <User size={18} />, accentColor: 'var(--accent)', row: 0, col: 0 },
  { id: 'orchestrator', label: 'Orchestrator', sublabel: 'Routes to product pipeline', icon: <Brain size={18} />, accentColor: 'var(--accent)', row: 0, col: 1, isCore: true },

  { id: 'datasources', label: 'Data Sources', sublabel: 'RentCast, FRED, CSPR.cloud', icon: <Database size={18} />, accentColor: 'var(--text-secondary)', row: 1, col: 0 },
  { id: 'x402', label: 'x402 Payment', sublabel: '1-5 CSPR per product', icon: <Zap size={18} />, accentColor: 'var(--accent)', row: 1, col: 1 },

  { id: 'comps', label: 'Agent A', sublabel: 'Comparable sales analysis', icon: <Search size={18} />, accentColor: 'var(--text-secondary)', row: 2, col: 0 },
  { id: 'dcf', label: 'Agent B', sublabel: 'Discounted cash flow', icon: <TrendingUp size={18} />, accentColor: 'var(--text-secondary)', row: 2, col: 1 },
  { id: 'llm', label: 'LLM Engine', sublabel: 'Qualitative reasoning', icon: <Brain size={18} />, accentColor: 'var(--text-secondary)', row: 2, col: 2 },

  { id: 'evidence', label: 'Evidence Analyst', sublabel: 'Data quality review', icon: <Shield size={18} />, accentColor: 'var(--text-tertiary)', row: 3, col: 0 },
  { id: 'market', label: 'Market Interpreter', sublabel: 'Macro trends and timing', icon: <TrendingUp size={18} />, accentColor: 'var(--text-tertiary)', row: 3, col: 1 },
  { id: 'precedent', label: 'Precedent Researcher', sublabel: 'Historical comparisons', icon: <BookOpen size={18} />, accentColor: 'var(--text-tertiary)', row: 3, col: 2 },

  { id: 'trust', label: 'Trust Framework', sublabel: 'Reputation scoring', icon: <Scale size={18} />, accentColor: 'var(--text-secondary)', row: 4, col: 0 },
  { id: 'hmac', label: 'HMAC Receipt Chain', sublabel: 'Tamper-proof audit trail', icon: <FileCheck size={18} />, accentColor: 'var(--text-secondary)', row: 4, col: 1 },
  { id: 'verdict', label: 'Verdict Oracle', sublabel: 'On-chain dispute resolution', icon: <Gavel size={18} />, accentColor: 'var(--accent)', row: 4, col: 2, isCore: true },

  { id: 'blockchain', label: 'Casper Blockchain', sublabel: 'Immutable on-chain record', icon: <Link2 size={18} />, accentColor: 'var(--accent)', row: 5, col: 1, isCore: true },
];

interface FlowEdge {
  from: string;
  to: string;
  tag?: string;
}

const EDGES: FlowEdge[] = [
  { from: 'user', to: 'orchestrator', tag: '[ INIT_REQ ]' },
  { from: 'orchestrator', to: 'datasources', tag: '[ FETCH_DATA ]' },
  { from: 'orchestrator', to: 'x402', tag: '[ PAY_GAS ]' },
  { from: 'datasources', to: 'comps' },
  { from: 'datasources', to: 'dcf' },
  { from: 'datasources', to: 'llm' },
  { from: 'comps', to: 'evidence' },
  { from: 'comps', to: 'market' },
  { from: 'comps', to: 'precedent' },
  { from: 'dcf', to: 'evidence' },
  { from: 'dcf', to: 'market' },
  { from: 'dcf', to: 'precedent' },
  { from: 'llm', to: 'evidence', tag: '[ RAW_EVIDENCE ]' },
  { from: 'llm', to: 'market' },
  { from: 'llm', to: 'precedent' },
  { from: 'evidence', to: 'trust' },
  { from: 'market', to: 'trust' },
  { from: 'precedent', to: 'trust' },
  { from: 'trust', to: 'hmac', tag: '[ SIGNED_DATA ]' },
  { from: 'hmac', to: 'verdict' },
  { from: 'verdict', to: 'blockchain', tag: '[ CSPR_TX_HASH ]' },
];

const NODE_W = 180;
const NODE_H = 64;
const COL_GAP = 280;
const ROW_GAP = 120;
const PAD_X = 60;
const PAD_Y = 60;
const SVG_W = PAD_X * 2 + 3 * COL_GAP;
const SVG_H = PAD_Y * 2 + 6 * ROW_GAP + NODE_H;

function getNodeCenter(node: FlowNode) {
  const nodesInRow = NODES.filter(n => n.row === node.row);
  const totalRowWidth = (nodesInRow.length - 1) * COL_GAP;
  const startX = (SVG_W - totalRowWidth) / 2;
  return {
    x: startX + node.col * COL_GAP + NODE_W / 2,
    y: PAD_Y + node.row * ROW_GAP + NODE_H / 2,
  };
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 }
  }
};

const nodeVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 24 }
  }
};

export const ArchitectureDiagram: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.1 });
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const connectedNodes = hoveredNode
    ? new Set([
        hoveredNode,
        ...EDGES.filter(e => e.from === hoveredNode || e.to === hoveredNode).flatMap(e => [e.from, e.to]),
      ])
    : null;

  return (
    <section style={{ padding: '80px 32px', background: 'var(--bg-base)' }} ref={containerRef}>
      <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
          style={{ marginBottom: 48 }}
        >
          <h2 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>
            How the Oracle Gets Fed
          </h2>
          <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', maxWidth: 600, margin: '0 auto', lineHeight: 1.6 }}>
            Every product follows this pipeline, from wallet connection to immutable on-chain record.
          </p>
        </motion.div>

        <div style={{ display: 'flex', justifyContent: 'center', overflow: 'auto' }}>
          <motion.svg
            width={SVG_W} height={SVG_H} viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            style={{ maxWidth: '100%', height: 'auto' }}
            variants={containerVariants}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
          >
            {/* Blueprint Grid + Crosshairs */}
            <defs>
              <pattern id="blueprint-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--border-weak)" strokeWidth="0.5" />
                <path d="M 18 20 L 22 20 M 20 18 L 20 22" fill="none" stroke="var(--border)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#blueprint-grid)" />

            {/* Edges */}
            {EDGES.map((edge, i) => {
              const fromNode = NODES.find(n => n.id === edge.from);
              const toNode = NODES.find(n => n.id === edge.to);
              if (!fromNode || !toNode) return null;

              const from = getNodeCenter(fromNode);
              const to = getNodeCenter(toNode);
              const isHighlighted = connectedNodes && (connectedNodes.has(edge.from) && connectedNodes.has(edge.to));

              const midX = (from.x + to.x) / 2;
              const midY = (from.y + to.y) / 2;

              return (
                <motion.g key={`edge-${i}`} variants={nodeVariants}>
                  {/* Base path */}
                  <line
                    x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                    stroke={isHighlighted ? 'var(--accent)' : 'var(--border)'}
                    strokeWidth={isHighlighted ? 2 : 1}
                    strokeDasharray="4 4"
                  />
                  
                  {/* Pulsing data stream overlay */}
                  <line
                    x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                    stroke="var(--accent)"
                    strokeWidth="1.5"
                    strokeDasharray="20 100"
                    strokeLinecap="round"
                    style={{
                      animation: `flow-dash ${3 + (i % 3)}s linear infinite`,
                      opacity: isHighlighted ? 1 : 0.4
                    }}
                  />

                  {/* Metadata Tag */}
                  {edge.tag && (
                    <g transform={`translate(${midX}, ${midY})`}>
                      <rect x="-45" y="-10" width="90" height="20" fill="var(--bg-base)" />
                      <text
                        x="0" y="3"
                        fontSize={9}
                        fill="var(--accent)"
                        fontFamily="var(--font-mono)"
                        textAnchor="middle"
                        letterSpacing="0.05em"
                      >
                        {edge.tag}
                      </text>
                    </g>
                  )}
                </motion.g>
              );
            })}

            {/* Nodes */}
            {NODES.map((node) => {
              const center = getNodeCenter(node);
              const isHovered = hoveredNode === node.id;
              const isConnected = connectedNodes?.has(node.id);

              return (
                <motion.g
                  key={node.id}
                  variants={nodeVariants}
                  transform={`translate(${center.x - NODE_W / 2}, ${center.y - NODE_H / 2})`}
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  style={{ cursor: 'pointer' }}
                >
                  <rect
                    width={NODE_W} height={NODE_H} rx={8}
                    fill="var(--bg-elevated)"
                    stroke={isHovered ? node.accentColor : isConnected ? 'var(--accent)' : 'var(--border)'}
                    strokeWidth={isHovered ? 2 : 1}
                    style={{
                      transition: 'all 0.3s ease',
                      filter: node.isCore 
                        ? `drop-shadow(0 0 15px ${node.accentColor}40)` 
                        : isHovered 
                          ? `drop-shadow(0 4px 12px ${node.accentColor}33)` 
                          : 'none',
                    }}
                  />
                  <rect
                    x={0} y={0} width={4} height={NODE_H} rx={2}
                    fill={node.accentColor}
                    opacity={isHovered ? 1 : 0.6}
                    style={{ transition: 'opacity 0.2s ease' }}
                  />
                  <foreignObject x={16} y={20} width={24} height={24}>
                    <div style={{ color: node.accentColor }}>{node.icon}</div>
                  </foreignObject>
                  <text
                    x={40} y={26} fontSize={13} fontWeight={600}
                    fill="var(--text-primary)" fontFamily="var(--font-sans)"
                  >
                    {node.label}
                  </text>
                  <text
                    x={40} y={44} fontSize={10}
                    fill="var(--text-tertiary)" fontFamily="var(--font-sans)"
                  >
                    {node.sublabel}
                  </text>
                </motion.g>
              );
            })}

            {/* Row labels */}
            {['ENTRY', 'DATA & PAY', 'AI AGENTS', 'DELIBERATION', 'SETTLEMENT', 'CHAIN'].map((label, i) => (
              <motion.text
                key={label}
                variants={nodeVariants}
                x={24} y={PAD_Y + i * ROW_GAP + NODE_H / 2 + 4}
                fontSize={9} fontWeight={600}
                fill="var(--text-tertiary)" fontFamily="var(--font-sans)"
                letterSpacing="0.05em" textAnchor="start"
              >
                {label}
              </motion.text>
            ))}
          </motion.svg>
        </div>
      </div>
      
      {/* Global styles for SVG animations */}
      <style>{`
        @keyframes flow-dash {
          to { stroke-dashoffset: -120; }
        }
      `}</style>
    </section>
  );
};

export default ArchitectureDiagram;
