import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, Zap, Shield, User, ArrowRight, ChevronDown, ChevronUp, Info, ExternalLink, FileText, TrendingUp } from 'lucide-react';

/* ─────────── Types ─────────── */
interface PaymentFlow {
  id: string;
  from: string;
  to: string;
  amount: number;
  currency: string;
  timestamp: number;
  status: 'pending' | 'completed' | 'failed';
  txHash?: string;
  type: 'x402' | 'native' | 'fee';
  description?: string;
}

interface PaymentFlowVisualizerProps {
  payments: PaymentFlow[];
  totalVolume?: number;
}

/* ─────────── Tooltip ─────────── */
const Tooltip: React.FC<{ text: string; children: React.ReactNode }> = ({ text, children }) => {
  const [visible, setVisible] = useState(false);
  return (
    <div
      style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute',
              left: '50%',
              bottom: '100%',
              transform: 'translateX(-50%)',
              marginBottom: '8px',
              background: '#1E1B2E',
              color: '#E2E8F0',
              padding: '8px 12px',
              borderRadius: '8px',
              fontSize: '0.72rem',
              lineHeight: 1.4,
              maxWidth: '240px',
              whiteSpace: 'normal',
              textAlign: 'center',
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              border: '1px solid rgba(255,255,255,0.08)',
              zIndex: 100,
              pointerEvents: 'none',
            }}
          >
            {text}
            <div style={{
              position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
              width: 0, height: 0,
              borderLeft: '6px solid transparent', borderRight: '6px solid transparent',
              borderTop: '6px solid #1E1B2E',
            }} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ─────────── Architecture Flow Diagram ─────────── */
const FlowDiagram: React.FC = () => {
  const nodes = [
    { id: 'user', label: 'User / dApp', sub: 'REST API', icon: User, x: 100, y: 200, color: '#3B82F6', desc: 'End user initiating the dispute via REST API.', align: 'left', valign: 'top' },
    { id: 'orchestrator', label: 'Orchestrator', sub: 'Coordinator', icon: Zap, x: 350, y: 200, color: '#8B5CF6', desc: 'Central coordinator dispatching valuation tasks and collecting votes.', align: 'center', valign: 'top' },
    { id: 'agent-a', label: 'Comps Specialist', sub: 'Agent A', icon: Shield, x: 650, y: 100, color: '#EC4899', desc: 'Estimates asset value using comparable sales. Protected by x402 payment wall.', align: 'center', valign: 'bottom' },
    { id: 'agent-b', label: 'DCF Specialist', sub: 'Agent B', icon: Shield, x: 650, y: 300, color: '#F59E0B', desc: 'Estimates asset value using discounted cash flows. Protected by x402 payment wall.', align: 'center', valign: 'top' },
    { id: 'jurors', label: 'Juror Pool', sub: 'DAO Voting', icon: Shield, x: 950, y: 200, color: '#10B981', desc: 'Decentralized jury voting on the final verdict.', align: 'center', valign: 'top' },
    { id: 'chain', label: 'Casper Chain', sub: 'L1 Settlement', icon: DollarSign, x: 1100, y: 200, color: '#EF4444', desc: 'Layer-1 Casper testnet for immutable transaction recording.', align: 'right', valign: 'top' },
  ];

  return (
    <div style={{ width: '100%', overflowX: 'auto', paddingBottom: '0.5rem' }}>
      <div style={{ position: 'relative', minWidth: '1000px', height: '400px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
        <style>
          {`
            .animated-flow-line {
              stroke: var(--text-tertiary);
              stroke-width: 2;
              fill: none;
              stroke-dasharray: 6 6;
              animation: flowLineAnim 1s linear infinite;
              opacity: 0.5;
            }
            .animated-flow-line.highlight {
              stroke: var(--primary);
              opacity: 0.8;
            }
            @keyframes flowLineAnim {
              from { stroke-dashoffset: 12; }
              to { stroke-dashoffset: 0; }
            }
            .node-hover-wrapper {
              position: absolute;
              transform: translate(-50%, -50%);
              display: flex;
              flex-direction: column;
              align-items: center;
              z-index: 10;
            }
            .node-card {
              background: var(--bg-surface);
              border: 1px solid var(--border-color);
              border-radius: 8px;
              padding: 0.75rem 1rem;
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 0.5rem;
              width: 130px;
              box-shadow: var(--shadow-sm);
              transition: all 0.2s ease;
              cursor: help;
            }
            .node-hover-wrapper:hover .node-card {
              box-shadow: var(--shadow-md);
              border-color: var(--text-secondary);
              transform: translateY(-2px);
            }
            .node-tooltip {
              position: absolute;
              background: var(--text-primary);
              color: var(--bg-main);
              padding: 0.75rem;
              border-radius: 6px;
              font-size: 0.75rem;
              line-height: 1.4;
              width: 200px;
              opacity: 0;
              visibility: hidden;
              transition: all 0.2s ease;
              box-shadow: var(--shadow-lg);
              pointer-events: none;
              z-index: 20;
            }
            .node-hover-wrapper:hover .node-tooltip {
              opacity: 1;
              visibility: visible;
            }
          `}
        </style>

        {/* SVG Background Layer */}
        <svg viewBox="0 0 1200 400" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} preserveAspectRatio="none">
          {/* Paths */}
          <path d="M 100 200 L 350 200" className="animated-flow-line" />
          <path d="M 350 200 C 500 200, 550 100, 650 100" className="animated-flow-line highlight" />
          <path d="M 350 200 C 500 200, 550 300, 650 300" className="animated-flow-line highlight" />
          <path d="M 650 100 C 800 100, 850 200, 950 200" className="animated-flow-line" />
          <path d="M 650 300 C 800 300, 850 200, 950 200" className="animated-flow-line" />
          <path d="M 950 200 L 1100 200" className="animated-flow-line" />
          
          {/* Labels */}
          <rect x="195" y="184" width="60" height="18" fill="var(--bg-main)" rx="4" />
          <text x="225" y="196" textAnchor="middle" fontSize="10" fill="var(--text-secondary)" fontWeight="600">REST API</text>
          
          <rect x="450" y="134" width="100" height="18" fill="var(--bg-main)" rx="4" />
          <text x="500" y="146" textAnchor="middle" fontSize="10" fill="var(--primary)" fontWeight="600">x402 Payment</text>
          
          <rect x="450" y="264" width="100" height="18" fill="var(--bg-main)" rx="4" />
          <text x="500" y="276" textAnchor="middle" fontSize="10" fill="var(--primary)" fontWeight="600">x402 Payment</text>
          
          <rect x="765" y="134" width="70" height="18" fill="var(--bg-main)" rx="4" />
          <text x="800" y="146" textAnchor="middle" fontSize="10" fill="var(--text-secondary)" fontWeight="600">Report</text>
          
          <rect x="765" y="264" width="70" height="18" fill="var(--bg-main)" rx="4" />
          <text x="800" y="276" textAnchor="middle" fontSize="10" fill="var(--text-secondary)" fontWeight="600">Report</text>
          
          <rect x="995" y="184" width="60" height="18" fill="var(--bg-main)" rx="4" />
          <text x="1025" y="196" textAnchor="middle" fontSize="10" fill="#10B981" fontWeight="600">Settle</text>
        </svg>

        {/* HTML Nodes Layer */}
        {nodes.map(node => (
          <div key={node.id} className="node-hover-wrapper" style={{ left: `${(node.x / 1200) * 100}%`, top: `${(node.y / 400) * 100}%` }}>
            <div className="node-card">
              <div style={{ 
                width: 36, height: 36, borderRadius: '8px', 
                background: `${node.color}15`, color: node.color, 
                display: 'flex', alignItems: 'center', justifyContent: 'center' 
              }}>
                <node.icon size={18} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>{node.label}</div>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>{node.sub}</div>
              </div>
            </div>
            
            <div className="node-tooltip" style={{
              ...(node.valign === 'top' ? { bottom: '100%', marginBottom: '8px', transformOrigin: 'bottom center' } : { top: '100%', marginTop: '8px', transformOrigin: 'top center' }),
              ...(node.align === 'center' ? { left: '50%', transform: 'translateX(-50%)', textAlign: 'center' as const } : 
                  node.align === 'left' ? { left: '0', textAlign: 'left' as const } : 
                  { right: '0', textAlign: 'right' as const })
            }}>
              {node.desc}
              <div style={{
                position: 'absolute',
                ...(node.valign === 'top' ? { top: '100%', borderTopColor: 'var(--text-primary)' } : { bottom: '100%', borderBottomColor: 'var(--text-primary)' }),
                ...(node.align === 'center' ? { left: '50%', transform: 'translateX(-50%)' } : 
                    node.align === 'left' ? { left: '20px' } : 
                    { right: '20px' }),
                borderWidth: '6px',
                borderStyle: 'solid',
                borderColor: 'transparent',
              }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ─────────── Summary Cards ─────────── */
const SummaryCards: React.FC<{ payments: PaymentFlow[] }> = ({ payments }) => {
  const cards = [
    { label: 'x402 Micropayments', icon: TrendingUp, color: '#EC4899', desc: 'Per-request agent fees (0.01 CSPR each)', count: payments.filter(p => p.type === 'x402').length },
    { label: 'Native Transfers', icon: ArrowRight, color: '#10B981', desc: 'Settlement payments on Casper testnet', count: payments.filter(p => p.type === 'native').length },
    { label: 'Receipt Chains', icon: FileText, color: '#F59E0B', desc: 'HMAC audit trail + ZK-Lite commitments', count: payments.filter(p => p.type === 'fee').length },
    { label: 'Total Transactions', icon: DollarSign, color: '#8B5CF6', desc: 'Combined count of all transaction types', count: payments.length },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
      {cards.map((card, idx) => (
        <Tooltip key={idx} text={card.desc}>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            style={{
              background: 'var(--bg-surface)',
              borderRadius: '10px',
              padding: '1rem',
              border: '1px solid var(--border-color)',
              cursor: 'help',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: '8px',
                background: `${card.color}22`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: card.color,
              }}>
                <card.icon size={16} />
              </div>
              <span style={{ fontSize: '1.4rem', fontWeight: 700, color: card.color, fontFamily: 'var(--font-mono)' }}>
                {card.count}
              </span>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              {card.label}
            </span>
          </motion.div>
        </Tooltip>
      ))}
    </div>
  );
};

/* ─────────── Transaction Log ─────────── */
const TransactionLog: React.FC<{ payments: PaymentFlow[] }> = ({ payments }) => {
  const [selectedPayment, setSelectedPayment] = useState<PaymentFlow | null>(null);
  const [expanded, setExpanded] = useState(true);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'x402': return TrendingUp;
      case 'native': return ArrowRight;
      case 'fee': return FileText;
      default: return DollarSign;
    }
  };

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          background: 'none', border: 'none', color: 'var(--text-secondary)',
          fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', padding: '0.5rem 0', width: '100%',
        }}
      >
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        Transaction Log ({payments.length})
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              background: 'var(--bg-surface)', borderRadius: '8px',
              border: '1px solid var(--border-color)', overflow: 'hidden',
            }}>
              {/* Header */}
              <div style={{
                display: 'grid', gridTemplateColumns: '32px 1fr 100px 80px 120px',
                gap: '0.5rem', padding: '0.6rem 1rem', fontSize: '0.65rem',
                color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase',
                letterSpacing: '0.05em', borderBottom: '1px solid var(--border-color)',
                background: 'var(--bg-elevated)',
              }}>
                <span></span>
                <span>Route</span>
                <span>Amount</span>
                <span>Status</span>
                <span>Time</span>
              </div>

              <div style={{ maxHeight: '260px', overflowY: 'auto' }}>
                {payments.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>
                    No transactions yet — start a dispute to see payments flow
                  </div>
                ) : (
                  payments.map((payment, idx) => {
                    const statusColor = payment.status === 'completed' ? '#10B981' : payment.status === 'pending' ? '#F59E0B' : '#EF4444';
                    const isSelected = selectedPayment?.id === payment.id;
                    const Icon = getTypeIcon(payment.type);

                    return (
                      <motion.div
                        key={payment.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        onClick={() => setSelectedPayment(isSelected ? null : payment)}
                        style={{
                          display: 'grid', gridTemplateColumns: '32px 1fr 100px 80px 120px',
                          gap: '0.5rem', padding: '0.6rem 1rem', fontSize: '0.75rem',
                          cursor: 'pointer', borderBottom: '1px solid var(--border-color)',
                          background: isSelected ? 'rgba(139,92,246,0.08)' : 'transparent',
                          transition: 'background 0.15s',
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Icon size={14} color="var(--text-secondary)" />
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', minWidth: 0 }}>
                          <span style={{ color: 'var(--text-primary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {payment.from}
                          </span>
                          <ArrowRight size={11} color="var(--text-tertiary)" style={{ flexShrink: 0 }} />
                          <span style={{ color: 'var(--text-primary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {payment.to}
                          </span>
                        </div>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {payment.amount.toFixed(payment.amount < 1 ? 4 : 2)} {payment.currency}
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: statusColor, fontWeight: 500, fontSize: '0.7rem' }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor, display: 'inline-block' }} />
                          {payment.status}
                        </span>
                        <span style={{ color: 'var(--text-tertiary)', fontSize: '0.68rem', fontFamily: 'var(--font-mono)' }}>
                          {formatTime(payment.timestamp)}
                        </span>
                      </motion.div>
                    );
                  })
                )}
              </div>

              {/* Detail panel */}
              <AnimatePresence>
                {selectedPayment && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    style={{
                      borderTop: '1px solid var(--border-color)',
                      background: 'var(--bg-elevated)', padding: '1rem', overflow: 'hidden',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <Info size={14} color="#8B5CF6" />
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>Transaction Detail</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.72rem' }}>
                      <div>
                        <span style={{ color: 'var(--text-tertiary)', display: 'block', marginBottom: 2 }}>Type</span>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                          {selectedPayment.type === 'x402' ? 'x402 Micropayment (HTTP 402)' : selectedPayment.type === 'native' ? 'Casper Native Transfer' : 'Network Fee'}
                        </span>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-tertiary)', display: 'block', marginBottom: 2 }}>Status</span>
                        <span style={{ color: selectedPayment.status === 'completed' ? '#10B981' : '#F59E0B', fontWeight: 500 }}>
                          {selectedPayment.status.toUpperCase()}
                        </span>
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <span style={{ color: 'var(--text-tertiary)', display: 'block', marginBottom: 2 }}>From → To</span>
                        <span style={{ color: 'var(--text-primary)' }}>{selectedPayment.from} → {selectedPayment.to}</span>
                      </div>
                      {selectedPayment.txHash && (
                        <div style={{ gridColumn: '1 / -1' }}>
                          <span style={{ color: 'var(--text-tertiary)', display: 'block', marginBottom: 2 }}>Tx Hash</span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: '#8B5CF6', wordBreak: 'break-all' }}>
                            {selectedPayment.txHash}
                          </span>
                        </div>
                      )}
                      {selectedPayment.description && (
                        <div style={{ gridColumn: '1 / -1' }}>
                          <span style={{ color: 'var(--text-tertiary)', display: 'block', marginBottom: 2 }}>Description</span>
                          <span style={{ color: 'var(--text-primary)' }}>{selectedPayment.description}</span>
                        </div>
                      )}
                      {selectedPayment.txHash && (
                        <div style={{ gridColumn: '1 / -1' }}>
                          <a
                            href={`https://testnet.cspr.live/transaction/${selectedPayment.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: '#8B5CF6', fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}
                          >
                            View on Explorer <ExternalLink size={10} />
                          </a>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ─────────── Main Component ─────────── */
export const PaymentFlowVisualizer: React.FC<PaymentFlowVisualizerProps> = ({ payments, totalVolume }) => {
  return (
    <div style={{ padding: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <DollarSign size={20} color="#F59E0B" />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
            Payment Flow Architecture
          </h3>
          {payments.length > 0 && (
            <span style={{
              background: 'rgba(245,158,11,0.15)', color: '#F59E0B',
              padding: '2px 8px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 600,
            }}>
              {payments.length} tx
            </span>
          )}
        </div>
        {totalVolume !== undefined && totalVolume > 0 && (
          <div style={{
            fontSize: '0.8rem', color: '#10B981', background: 'rgba(16,185,129,0.1)',
            padding: '0.3rem 0.75rem', borderRadius: '6px', fontWeight: 600, fontFamily: 'var(--font-mono)',
          }}>
            Volume: {totalVolume.toFixed(2)} CSPR
          </div>
        )}
      </div>

      {/* Architecture Diagram */}
      <div style={{ marginBottom: '1.5rem' }}>
        <FlowDiagram />
      </div>

      {/* Summary Cards */}
      <div style={{ marginBottom: '1.25rem' }}>
        <SummaryCards payments={payments} />
      </div>

      {/* Transaction Log */}
      <TransactionLog payments={payments} />
    </div>
  );
};

export default PaymentFlowVisualizer;
