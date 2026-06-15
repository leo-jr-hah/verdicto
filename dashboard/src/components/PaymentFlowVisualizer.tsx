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
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const nodes = [
    { id: 'user', label: 'User / dApp', sub: 'REST API', icon: User, color: '#3B82F6', desc: 'End user or decentralized application initiating the dispute resolution process via REST API or on-chain trigger.' },
    { id: 'orchestrator', label: 'Orchestrator', sub: 'Coordination', icon: Zap, color: '#8B5CF6', desc: 'Central coordinator that dispatches valuation tasks to specialist agents, collects votes from jurors, and executes final verdicts on-chain.' },
    { id: 'agent-a', label: 'Comps Specialist', sub: 'Comparable Sales', icon: Shield, color: '#EC4899', desc: 'Agent A — estimates asset value using comparable sales method. Protected by x402 micropayment wall (0.01 CSPR per request).' },
    { id: 'agent-b', label: 'DCF Specialist', sub: 'Discounted CF', icon: Shield, color: '#F59E0B', desc: 'Agent B — estimates asset value using discounted cash-flow analysis. Protected by x402 micropayment wall (0.01 CSPR per request).' },
    { id: 'jurors', label: 'Juror Pool', sub: 'DAO Voting', icon: Shield, color: '#10B981', desc: 'Decentralized jury (Evidence Analyst, Market Interpreter, Precedent Researcher) that votes on the final verdict after reviewing evidence from both agents.' },
    { id: 'chain', label: 'Casper Chain', sub: 'L1 Settlement', icon: DollarSign, color: '#EF4444', desc: 'Layer-1 Casper testnet where settlement payments (2.5 CSPR), HMAC receipt chains, and ZK-Lite execution commitments are committed on-chain.' },
  ];

  return (
    <div style={{
      background: 'linear-gradient(180deg, rgba(30,27,46,0.8) 0%, rgba(20,18,32,0.9) 100%)',
      borderRadius: '12px',
      border: '1px solid rgba(255,255,255,0.08)',
      padding: '32px 24px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background grid pattern */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)',
        backgroundSize: '24px 24px',
        opacity: 0.5,
      }} />

      {/* Title */}
      <div style={{
        position: 'relative',
        fontSize: '0.65rem',
        fontWeight: 600,
        color: 'rgba(255,255,255,0.45)',
        textTransform: 'uppercase',
        letterSpacing: '0.12em',
        marginBottom: '28px',
        textAlign: 'center',
      }}>
        Payment Flow Architecture
      </div>

      {/* Main flow container */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Row 1: User → Orchestrator → Agents */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '24px',
          marginBottom: '20px',
        }}>
          {/* User */}
          <Tooltip text={nodes[0].desc}>
            <div
              onMouseEnter={() => setHoveredNode('user')}
              onMouseLeave={() => setHoveredNode(null)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                transition: 'transform 0.2s',
                transform: hoveredNode === 'user' ? 'scale(1.08)' : 'scale(1)',
              }}
            >
              <div style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${nodes[0].color}dd, ${nodes[0].color})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                border: `2px solid ${hoveredNode === 'user' ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.12)'}`,
                boxShadow: hoveredNode === 'user' ? `0 0 24px ${nodes[0].color}66` : `0 0 12px ${nodes[0].color}33`,
              }}>
                <User size={20} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 600, color: hoveredNode === 'user' ? nodes[0].color : 'var(--text-primary)' }}>
                  {nodes[0].label}
                </div>
                <div style={{ fontSize: '0.58rem', color: 'var(--text-tertiary)', marginTop: 2 }}>
                  {nodes[0].sub}
                </div>
              </div>
            </div>
          </Tooltip>

          {/* Arrow: User → Orchestrator */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '60px', height: '2px', background: `linear-gradient(90deg, transparent, ${nodes[0].color}88, transparent)` }} />
            <div style={{ fontSize: '0.6rem', fontWeight: 600, color: nodes[0].color }}>Submit Dispute</div>
            <div style={{ fontSize: '0.55rem', color: 'var(--text-tertiary)' }}>REST API / POST</div>
          </div>

          {/* Orchestrator */}
          <Tooltip text={nodes[1].desc}>
            <div
              onMouseEnter={() => setHoveredNode('orchestrator')}
              onMouseLeave={() => setHoveredNode(null)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                transition: 'transform 0.2s',
                transform: hoveredNode === 'orchestrator' ? 'scale(1.08)' : 'scale(1)',
              }}
            >
              <div style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${nodes[1].color}dd, ${nodes[1].color})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                border: `2px solid ${hoveredNode === 'orchestrator' ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.12)'}`,
                boxShadow: hoveredNode === 'orchestrator' ? `0 0 24px ${nodes[1].color}66` : `0 0 12px ${nodes[1].color}33`,
              }}>
                <Zap size={20} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 600, color: hoveredNode === 'orchestrator' ? nodes[1].color : 'var(--text-primary)' }}>
                  {nodes[1].label}
                </div>
                <div style={{ fontSize: '0.58rem', color: 'var(--text-tertiary)', marginTop: 2 }}>
                  {nodes[1].sub}
                </div>
              </div>
            </div>
          </Tooltip>

          {/* Arrow: Orchestrator → Agents */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '60px', height: '2px', background: `linear-gradient(90deg, transparent, ${nodes[2].color}88, transparent)` }} />
            <div style={{ fontSize: '0.6rem', fontWeight: 600, color: nodes[2].color }}>x402 Payment</div>
            <div style={{ fontSize: '0.55rem', color: 'var(--text-tertiary)' }}>0.01 CSPR/request</div>
          </div>

          {/* Agent A */}
          <Tooltip text={nodes[2].desc}>
            <div
              onMouseEnter={() => setHoveredNode('agent-a')}
              onMouseLeave={() => setHoveredNode(null)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                transition: 'transform 0.2s',
                transform: hoveredNode === 'agent-a' ? 'scale(1.08)' : 'scale(1)',
              }}
            >
              <div style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${nodes[2].color}dd, ${nodes[2].color})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                border: `2px solid ${hoveredNode === 'agent-a' ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.12)'}`,
                boxShadow: hoveredNode === 'agent-a' ? `0 0 20px ${nodes[2].color}66` : `0 0 10px ${nodes[2].color}33`,
              }}>
                <Shield size={16} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 600, color: hoveredNode === 'agent-a' ? nodes[2].color : 'var(--text-primary)' }}>
                  {nodes[2].label}
                </div>
                <div style={{ fontSize: '0.55rem', color: 'var(--text-tertiary)', marginTop: 1 }}>
                  {nodes[2].sub}
                </div>
              </div>
            </div>
          </Tooltip>

          {/* Agent B */}
          <Tooltip text={nodes[3].desc}>
            <div
              onMouseEnter={() => setHoveredNode('agent-b')}
              onMouseLeave={() => setHoveredNode(null)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                transition: 'transform 0.2s',
                transform: hoveredNode === 'agent-b' ? 'scale(1.08)' : 'scale(1)',
              }}
            >
              <div style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${nodes[3].color}dd, ${nodes[3].color})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                border: `2px solid ${hoveredNode === 'agent-b' ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.12)'}`,
                boxShadow: hoveredNode === 'agent-b' ? `0 0 20px ${nodes[3].color}66` : `0 0 10px ${nodes[3].color}33`,
              }}>
                <Shield size={16} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 600, color: hoveredNode === 'agent-b' ? nodes[3].color : 'var(--text-primary)' }}>
                  {nodes[3].label}
                </div>
                <div style={{ fontSize: '0.55rem', color: 'var(--text-tertiary)', marginTop: 1 }}>
                  {nodes[3].sub}
                </div>
              </div>
            </div>
          </Tooltip>
        </div>

        {/* Row 2: Agents → Jurors → Chain */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '24px',
        }}>
          {/* Spacer for alignment */}
          <div style={{ width: '200px' }} />

          {/* Arrow: Agents → Jurors */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '80px', height: '2px', background: `linear-gradient(90deg, transparent, ${nodes[4].color}88, transparent)` }} />
            <div style={{ fontSize: '0.6rem', fontWeight: 600, color: nodes[4].color }}>Evidence Reports</div>
            <div style={{ fontSize: '0.55rem', color: 'var(--text-tertiary)' }}>Valuation Data</div>
          </div>

          {/* Jurors */}
          <Tooltip text={nodes[4].desc}>
            <div
              onMouseEnter={() => setHoveredNode('jurors')}
              onMouseLeave={() => setHoveredNode(null)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                transition: 'transform 0.2s',
                transform: hoveredNode === 'jurors' ? 'scale(1.08)' : 'scale(1)',
              }}
            >
              <div style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${nodes[4].color}dd, ${nodes[4].color})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                border: `2px solid ${hoveredNode === 'jurors' ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.12)'}`,
                boxShadow: hoveredNode === 'jurors' ? `0 0 24px ${nodes[4].color}66` : `0 0 12px ${nodes[4].color}33`,
              }}>
                <Shield size={20} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 600, color: hoveredNode === 'jurors' ? nodes[4].color : 'var(--text-primary)' }}>
                  {nodes[4].label}
                </div>
                <div style={{ fontSize: '0.58rem', color: 'var(--text-tertiary)', marginTop: 2 }}>
                  {nodes[4].sub}
                </div>
              </div>
            </div>
          </Tooltip>

          {/* Arrow: Jurors → Chain */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '60px', height: '2px', background: `linear-gradient(90deg, transparent, ${nodes[5].color}88, transparent)` }} />
            <div style={{ fontSize: '0.6rem', fontWeight: 600, color: nodes[5].color }}>Settlement</div>
            <div style={{ fontSize: '0.55rem', color: 'var(--text-tertiary)' }}>2.5 CSPR Transfer</div>
          </div>

          {/* Chain */}
          <Tooltip text={nodes[5].desc}>
            <div
              onMouseEnter={() => setHoveredNode('chain')}
              onMouseLeave={() => setHoveredNode(null)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                transition: 'transform 0.2s',
                transform: hoveredNode === 'chain' ? 'scale(1.08)' : 'scale(1)',
              }}
            >
              <div style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${nodes[5].color}dd, ${nodes[5].color})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                border: `2px solid ${hoveredNode === 'chain' ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.12)'}`,
                boxShadow: hoveredNode === 'chain' ? `0 0 24px ${nodes[5].color}66` : `0 0 12px ${nodes[5].color}33`,
              }}>
                <DollarSign size={20} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 600, color: hoveredNode === 'chain' ? nodes[5].color : 'var(--text-primary)' }}>
                  {nodes[5].label}
                </div>
                <div style={{ fontSize: '0.58rem', color: 'var(--text-tertiary)', marginTop: 2 }}>
                  {nodes[5].sub}
                </div>
              </div>
            </div>
          </Tooltip>
        </div>
      </div>

      {/* Legend */}
      <div style={{
        display: 'flex',
        gap: '1.5rem',
        justifyContent: 'center',
        marginTop: '28px',
        paddingTop: '20px',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        position: 'relative',
        zIndex: 1,
      }}>
        {[
          { color: '#3B82F6', label: 'API Call' },
          { color: '#EC4899', label: 'x402 Payment' },
          { color: '#10B981', label: 'Settlement' },
          { color: '#EF4444', label: 'On-Chain Commit' },
        ].map((item, i) => (
          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.6rem', color: 'rgba(255,255,255,0.5)' }}>
            <span style={{ width: 16, height: 2, background: item.color, display: 'inline-block', borderRadius: 1 }} />
            {item.label}
          </span>
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
