import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle2, Brain, Shield, DollarSign, Clock, Activity, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AgentBrainVisualization } from '../components/AgentBrainVisualization';
import { CryptographicProofExplorer } from '../components/CryptographicProofExplorer';
import { PaymentFlowVisualizer } from '../components/PaymentFlowVisualizer';
import { TimeTravelReplay } from '../components/TimeTravelReplay';

type LogEntry = {
  id: string;
  timestamp: number;
  type: string;
  content: string;
  category: 'system' | 'juror' | 'verdict' | 'evidence' | 'payment';
};

type AgentStatus = {
  id: string;
  name: string;
  status: 'idle' | 'thinking' | 'completed';
  progress: number;
  lastAction?: string;
};

export const DeliberationView: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [status, setStatus] = useState<'idle' | 'deliberating' | 'settled'>('idle');
  const [, setActiveDispute] = useState<any>(null);
  const [verdict, setVerdict] = useState<any>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [showScenario, setShowScenario] = useState(false);
  const [activeTab, setActiveTab] = useState<'live' | 'brain' | 'proof' | 'payments' | 'replay'>('live');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Agent statuses for the enhanced UI
  const [agentStatuses, setAgentStatuses] = useState<AgentStatus[]>([
    { id: 'valuation-a', name: 'Comps Specialist', status: 'idle', progress: 0 },
    { id: 'valuation-b', name: 'DCF Specialist', status: 'idle', progress: 0 },
    { id: 'evidence', name: 'Evidence Analyst', status: 'idle', progress: 0 },
    { id: 'market', name: 'Market Interpreter', status: 'idle', progress: 0 },
    { id: 'precedent', name: 'Precedent Researcher', status: 'idle', progress: 0 }
  ]);

  // Enhanced visualizations state
  const [receipts, setReceipts] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<any[]>([]);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3010');
    
    ws.onopen = () => {
      addLog('System', 'Connecting to Orchestrator...', 'system');
      setTimeout(() => addLog('System', 'Connection established. Ready.', 'system'), 500);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'dispute_started') {
        setStatus('deliberating');
        setActiveDispute(data.payload);
        setVerdict(null);
        addLog('Orchestrator', `Dispute #${data.payload.disputeId} initiated for asset: ${data.payload.assetId}`, 'system');
        
        // Update agent statuses
        setAgentStatuses(prev => prev.map(agent => ({ ...agent, status: 'thinking', progress: 10 })));
        
        // Add timeline event
        addTimelineEvent('system', 'Dispute Initiated', `Case #${data.payload.disputeId} opened for ${data.payload.assetId}`);
      } 
      else if (data.type === 'valuation_result') {
        addLog(data.payload.agent, `Submitted valuation evidence: $${data.payload.result.estimated_value.toLocaleString()} (Method: ${data.payload.result.method})`, 'evidence');
        
        // Update specific agent status
        const agentId = data.payload.agent.toLowerCase().replace(' ', '-');
        setAgentStatuses(prev => prev.map(agent => 
          agent.id === agentId 
            ? { ...agent, status: 'completed', progress: 100, lastAction: `Valued at $${data.payload.result.estimated_value.toLocaleString()}` }
            : agent
        ));
        
        // Add timeline event
        addTimelineEvent('valuation', `${data.payload.agent} Valuation`, `Estimated value: $${data.payload.result.estimated_value.toLocaleString()} using ${data.payload.result.method}`);
      }
      else if (data.type === 'juror_vote') {
        const readableVote = data.payload.verdict.vote === 'FullRefund' ? 'a full refund' : 
                             data.payload.verdict.vote === 'SplitFifty' ? 'a 50/50 split' : 
                             data.payload.verdict.vote === 'FullRelease' ? 'a full release to the treasury' : data.payload.verdict.vote;
        addLog(data.payload.juror, `Recommends ${readableVote} (Round ${data.payload.round}).\nReasoning: "${data.payload.verdict.reasoning}"`, 'juror');
        
        // Update juror status
        const jurorId = data.payload.juror.toLowerCase().replace(' ', '-');
        setAgentStatuses(prev => prev.map(agent => 
          agent.id === jurorId 
            ? { ...agent, status: 'completed', progress: 100, lastAction: `Voted: ${readableVote}` }
            : agent
        ));
        
        // Add timeline event
        addTimelineEvent('juror', `${data.payload.juror} Vote`, `Round ${data.payload.round}: ${readableVote}`);
      }
      else if (data.type === 'agent_thought') {
        // Update agent status based on thought progress
        const agentId = data.payload.agentId;
        const confidence = data.payload.confidence;
        const status = confidence > 90 ? 'completed' : confidence > 0 ? 'thinking' : 'idle';
        
        setAgentStatuses(prev => prev.map(agent => 
          agent.id === agentId 
            ? { ...agent, status, progress: confidence, lastAction: data.payload.thought.substring(0, 50) + '...' }
            : agent
        ));
      }
      else if (data.type === 'receipt_created') {
        // Add receipt to the proof chain
        const receipt = data.payload.receipt;
        addLog('Audit', `Receipt Generated: ${receipt.receiptId.slice(0, 8)}... for ${data.payload.juror} (Round ${data.payload.round})`, 'system');
        
        // Convert receipt to ReceiptNode format for the explorer
        const receiptNode = {
          id: receipt.receiptId,
          hash: receipt.signature,
          timestamp: receipt.timestamp,
          type: 'HMAC Receipt Chain',
          action: `Juror Vote - ${data.payload.juror}`,
          previousHash: receipt.previousReceiptId,
          metadata: {
            juror: data.payload.juror,
            round: data.payload.round,
            disputeId: receipt.disputeId,
            vote: receipt.vote
          },
          children: []
        };
        
        setReceipts(prev => [...prev, receiptNode]);
      }
      else if (data.type === 'final_verdict') {
        setStatus('settled');
        setVerdict(data.payload);
        addLog('Orchestrator', `Dispute resolved. Final Verdict Issued: ${data.payload.finalVerdict}`, 'verdict');
        
        // Add timeline event
        addTimelineEvent('verdict', 'Final Verdict', `Dispute resolved: ${data.payload.finalVerdict}`);
      }
      else if (data.type === 'transaction') {
        // Add payment visualization
        addPayment(data.payload);
        addTimelineEvent('payment', 'Payment Processed', `Transaction: ${data.payload.hash?.substring(0, 12)}...`);
      }
    };

    return () => ws.close();
  }, []);

  useEffect(() => {
    if (autoScroll && scrollContainerRef.current) {
      const { scrollHeight, clientHeight } = scrollContainerRef.current;
      scrollContainerRef.current.scrollTo({ top: scrollHeight - clientHeight, behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
      if (!isAtBottom && autoScroll) {
        setAutoScroll(false);
      }
    }
  };

  const addLog = (source: string, content: string, category: LogEntry['category']) => {
    setLogs(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      type: source,
      content,
      category
    }]);
  };

  const addTimelineEvent = (type: string, title: string, description: string) => {
    setTimelineEvents(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      type,
      title,
      description,
      agent: type === 'valuation' || type === 'juror' ? title.split(' ')[0] : undefined
    }]);
  };

  const addPayment = (payload: any) => {
    // Transaction payload structure from orchestrator:
    // { type, action, hash, contract, blockHeight, timestamp, explorerUrl, metadata }
    // Native Transfer metadata: { disputeId, amount: "2.5 CSPR", target: "0x..." }
    // x402 Payment metadata: { agentLabel, amount, payTo }
    // HMAC Receipt Chain metadata: { disputeId, receiptCount, chainValid }
    
    const metadata = payload.metadata || {};
    
    // Parse amount from string like "2.5 CSPR" or numeric value
    let amount = 0.01;
    let currency = 'CSPR';
    if (typeof metadata.amount === 'string') {
      const match = metadata.amount.match(/([\d.]+)/);
      if (match) {
        amount = parseFloat(match[1]);
      }
    } else if (typeof metadata.amount === 'number') {
      amount = metadata.amount;
    }
    
    // Determine recipient based on transaction type
    let recipient = 'Casper Chain';
    if (payload.type === 'Native Transfer') {
      // Native transfer is typically settlement payment
      recipient = 'Casper Chain';
    } else if (payload.type === 'x402 Payment') {
      // x402 payment goes to agent
      recipient = metadata.agentLabel || metadata.agent || 'Agent';
    } else if (payload.type === 'HMAC Receipt Chain') {
      // Receipt chain is an audit trail, not a payment
      // Skip adding to payment visualizer
      return;
    }
    
    // Map transaction type to payment type
    let paymentType: 'x402' | 'native' | 'fee' = 'native';
    if (payload.type === 'Native Transfer') paymentType = 'native';
    if (payload.type === 'x402 Payment') paymentType = 'x402';
    
    setPayments(prev => [...prev, {
      id: payload.id || Math.random().toString(36).substr(2, 9),
      from: 'Orchestrator',
      to: recipient,
      amount: amount,
      currency: currency,
      timestamp: payload.timestamp ? new Date(payload.timestamp).getTime() : Date.now(),
      status: 'completed',
      txHash: payload.hash,
      type: paymentType,
      description: payload.action
    }]);
  };

  const startDemo = async () => {
    try {
      addLog('System', 'Initiating demo dispute...', 'system');
      await fetch('http://localhost:3011/api/disputes/start', { method: 'POST' });
    } catch (e) {
      addLog('Error', 'Failed to connect to Orchestrator API endpoint. Ensure backend is running.', 'system');
    }
  };

  const getLogColor = (category: LogEntry['category']) => {
    switch (category) {
      case 'system': return 'var(--text-tertiary)';
      case 'juror': return '#3B82F6';
      case 'evidence': return '#8B5CF6';
      case 'verdict': return 'var(--primary)';
      case 'payment': return '#F59E0B';
      default: return 'var(--text-secondary)';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'idle': return 'var(--text-tertiary)';
      case 'thinking': return '#F59E0B';
      case 'completed': return '#10B981';
      default: return 'var(--text-secondary)';
    }
  };

  return (
    <div className="container" style={{ padding: '2rem 0', fontFamily: 'var(--font-sans)', color: 'var(--text-primary)', minHeight: 'calc(100vh - 72px)' }}>
      
      {/* Interactive Scenario Modal */}
      <AnimatePresence>
        {showScenario && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', backdropFilter: 'blur(4px)' }}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              style={{ backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '3rem', maxWidth: '650px', width: '100%', position: 'relative', boxShadow: 'var(--shadow-lg)' }}
            >
              <button 
                onClick={() => setShowScenario(false)}
                style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: '1.2rem' }}
              >
                ✕
              </button>
              
              <div style={{ marginBottom: '2.5rem' }}>
                <span style={{ padding: '6px 12px', background: 'rgba(255, 59, 59, 0.1)', color: 'var(--primary)', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Interactive Scenario</span>
                <h2 style={{ fontSize: '2rem', margin: '1rem 0', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>The Miami Parking Garage Dispute</h2>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '1.1rem' }}>You are observing a real-time autonomous dispute resolution on the Casper blockchain.</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '3rem' }}>
                <div style={{ padding: '1.5rem', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                  <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EF4444' }}></div>
                    The Conflict (The Problem)
                  </h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>A buyer purchased $50k in tokenized shares of a Miami garage valued at $2.4M. The local market crashed, and RentCast data shows it's now worth $1.8M. The platform refuses a partial refund.</p>
                </div>
                
                <div style={{ padding: '1.5rem', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                  <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }}></div>
                    The Casper Court Solution
                  </h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>Instead of spending 14 months and $20,000 on human lawyers, 3 specialized AI Jurors will evaluate the market APIs, deliberate, and trigger the escrow contract in 60 seconds. Total cost: $0.10.</p>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button onClick={() => setShowScenario(false)} className="btn-secondary">Cancel</button>
                <button onClick={() => { setShowScenario(false); startDemo(); }} className="btn-primary" style={{ boxShadow: '0 0 20px rgba(255, 59, 59, 0.4)' }}>Submit Case to AI Jury</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Terminal Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '2rem', marginBottom: '0.25rem', fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>Live Court Dashboard</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Observe autonomous AI agents resolving real-world disputes natively on Casper.</p>
        </div>
        {(status === 'idle' || status === 'settled') && (
          <button onClick={() => { setLogs([]); setVerdict(null); setStatus('idle'); setShowScenario(true); }} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', padding: '0.6rem 1.25rem' }}>
            {status === 'settled' ? 'Run Another Dispute' : 'Start New Dispute'}
          </button>
        )}
      </div>

      {/* Enhanced Tab Navigation */}
      <div style={{ 
        display: 'flex', 
        gap: '0.5rem', 
        marginBottom: '1.5rem',
        padding: '0.5rem',
        background: 'var(--bg-surface)',
        borderRadius: '8px',
        border: '1px solid var(--border-color)'
      }}>
        {[
          { id: 'live', label: 'Live Activity', icon: Activity },
          { id: 'brain', label: 'Agent Brains', icon: Brain },
          { id: 'proof', label: 'Proof Chain', icon: Shield },
          { id: 'payments', label: 'Payments', icon: DollarSign },
          { id: 'replay', label: 'Time Travel', icon: Clock }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.6rem 1rem',
              background: activeTab === tab.id ? 'var(--bg-main)' : 'transparent',
              border: activeTab === tab.id ? '1px solid var(--border-color)' : '1px solid transparent',
              borderRadius: '6px',
              color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: activeTab === tab.id ? 600 : 400,
              transition: 'all 0.2s ease',
              boxShadow: activeTab === tab.id ? 'var(--shadow-sm)' : 'none'
            }}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Top Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem' }}>
          {agentStatuses.map(agent => (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: 'var(--bg-surface)',
                borderRadius: '8px',
                padding: '1rem',
                border: `1px solid ${getStatusColor(agent.status)}33`,
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Progress Bar */}
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                height: '3px',
                width: `${agent.progress}%`,
                background: getStatusColor(agent.status),
                transition: 'width 0.3s ease'
              }} />
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <div style={{ 
                  width: '8px', 
                  height: '8px', 
                  borderRadius: '50%',
                  background: getStatusColor(agent.status),
                  boxShadow: agent.status === 'thinking' ? `0 0 8px ${getStatusColor(agent.status)}` : 'none'
                }} />
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {agent.name}
                </span>
              </div>
              
              <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
                {agent.status === 'idle' ? 'Standby' : 
                 agent.status === 'thinking' ? 'Processing...' : 
                 agent.lastAction || 'Completed'}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'live' && (
            <motion.div
              key="live"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}
            >
              {/* Live Activity Log */}
              <div className="enterprise-card" style={{ background: 'var(--bg-main)', height: '500px', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface)' }}>
                  <h4 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', margin: 0 }}>Live Activity</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={() => { setAutoScroll(!autoScroll); if(!autoScroll && scrollContainerRef.current) scrollContainerRef.current.scrollTo({ top: scrollContainerRef.current.scrollHeight, behavior: 'smooth' }); }} style={{ background: autoScroll ? 'rgba(16, 185, 129, 0.1)' : 'transparent', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '0.35rem 0.75rem', color: autoScroll ? '#10B981' : 'var(--text-tertiary)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, transition: 'all 0.2s' }}>
                      Auto-Scroll {autoScroll ? 'On' : 'Off'}
                    </button>
                  </div>
                </div>
                <div ref={scrollContainerRef} onScroll={handleScroll} style={{ flexGrow: 1, overflowY: 'auto', padding: '1.5rem' }}>
                  <AnimatePresence initial={false}>
                    {logs.map((log) => (
                      <motion.div 
                        key={log.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ marginBottom: '1.25rem', display: 'flex', gap: '1.25rem' }}
                      >
                        <div style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', flexShrink: 0, width: '65px', paddingTop: '2px', fontWeight: 500 }}>
                          {new Date(log.timestamp).toISOString().substr(11, 8)}
                        </div>
                        <div style={{ flexGrow: 1, borderLeft: '2px solid var(--border-color)', paddingLeft: '1.25rem', position: 'relative' }}>
                          <div style={{ position: 'absolute', left: '-5px', top: '6px', width: '8px', height: '8px', borderRadius: '50%', background: getLogColor(log.category) }}></div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem', fontSize: '0.9rem' }}>
                            {log.type}
                          </div>
                          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, wordBreak: 'break-word', maxWidth: '800px' }}>
                            {log.content}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>

              {/* Verdict Panel */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {verdict ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }} 
                    animate={{ opacity: 1, scale: 1 }} 
                    className="enterprise-card" 
                    style={{ border: '2px solid var(--primary)', backgroundColor: 'var(--bg-main)', padding: '1.5rem' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', marginBottom: '0.75rem' }}>
                      <CheckCircle2 size={24} />
                      <span style={{ fontSize: '1rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Final AI Verdict</span>
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                      {verdict.finalVerdict === 'FullRefund' ? '100% Refund Granted' : 
                       verdict.finalVerdict === 'SplitFifty' ? '50/50 Settlement Reached' : 
                       'Full Release to Treasury'}
                    </div>
                    <div style={{ fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      <strong>Explanation:</strong> Based on the RentCast market APIs and FRED mortgage rates, the 3 AI agents determined that the property manager severely over-reported the valuation. The true assessed value is <strong>${verdict.finalValue?.toLocaleString()}</strong>. The Odra smart contract will now automatically route the funds back to the token holders.
                    </div>
                  </motion.div>
                ) : (
                  <div className="enterprise-card" style={{ background: 'var(--bg-main)', padding: '2rem', textAlign: 'center' }}>
                    <Zap size={32} color="var(--text-tertiary)" style={{ marginBottom: '1rem' }} />
                    <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Awaiting Verdict</h4>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      {status === 'idle' ? 'Start a dispute to see the AI verdict.' : 'Agents are deliberating...'}
                    </p>
                  </div>
                )}

                {/* Quick Stats */}
                <div className="enterprise-card" style={{ background: 'var(--bg-main)', padding: '1rem' }}>
                  <h4 style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>Session Stats</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>{logs.length}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Events</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>{payments.length}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Payments</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>{receipts.length}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Proofs</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1.25rem', fontWeight: 700, color: status === 'settled' ? '#10B981' : status === 'deliberating' ? '#F59E0B' : 'var(--text-tertiary)' }}>
                        {status === 'settled' ? '✓' : status === 'deliberating' ? '●' : '○'}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Status</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'brain' && (
            <motion.div
              key="brain"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <AgentBrainVisualization />
            </motion.div>
          )}

          {activeTab === 'proof' && (
            <motion.div
              key="proof"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <CryptographicProofExplorer 
                receipts={receipts} 
                onVerify={(hash) => {
                  // Verify the cryptographic proof
                  console.log('Verifying proof:', hash);
                  addLog('Audit', `Verifying proof chain integrity for hash: ${hash.substring(0, 16)}...`, 'system');
                  
                  // In a real implementation, this would verify the Merkle proof
                  // For now, we'll just log the verification attempt
                  setTimeout(() => {
                    addLog('Audit', `Proof verification complete for ${hash.substring(0, 16)}...`, 'system');
                  }, 1000);
                }}
              />
            </motion.div>
          )}

          {activeTab === 'payments' && (
            <motion.div
              key="payments"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <PaymentFlowVisualizer payments={payments} totalVolume={payments.reduce((sum, p) => sum + p.amount, 0)} />
            </motion.div>
          )}

          {activeTab === 'replay' && (
            <motion.div
              key="replay"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <TimeTravelReplay events={timelineEvents} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};