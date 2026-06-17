import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle2, Brain, DollarSign, Activity, Zap, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AgentBrainVisualization } from '../components/AgentBrainVisualization';
import { CryptographicProofExplorer } from '../components/CryptographicProofExplorer';
import { PaymentFlowVisualizer } from '../components/PaymentFlowVisualizer';
import { TimeTravelReplay } from '../components/TimeTravelReplay';
import { Tooltip } from '../components/Tooltip';
import { verifyReceiptChain } from '../services/api';

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
  const [starting, setStarting] = useState(false);
  const [verdict, setVerdict] = useState<any>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [activeTab, setActiveTab] = useState<'session' | 'evidence' | 'payments'>('session');
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [agentStatuses, setAgentStatuses] = useState<AgentStatus[]>([
    { id: 'valuation-a', name: 'Market Analyst', status: 'idle', progress: 0 },
    { id: 'valuation-b', name: 'Income Analyst', status: 'idle', progress: 0 },
    { id: 'evidence', name: 'Evidence Reviewer', status: 'idle', progress: 0 },
    { id: 'market', name: 'Trend Analyst', status: 'idle', progress: 0 },
    { id: 'precedent', name: 'Case Researcher', status: 'idle', progress: 0 }
  ]);

  const [receipts, setReceipts] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<any[]>([]);
  const [activeDisputeId, setActiveDisputeId] = useState<string | null>(null);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
    let reconnectDelay = 1000;
    const MAX_RECONNECT_DELAY = 30_000;
    let unmounted = false;

    function connect() {
      if (unmounted) return;
      ws = new WebSocket('ws://localhost:3010');
    
      ws.onopen = () => {
        console.log('[Dashboard] WebSocket connected to ws://localhost:3010');
        setConnectionStatus('connected');
        reconnectDelay = 1000; // Reset backoff on success
        addLog('System', 'Connecting to Orchestrator...', 'system');
        setTimeout(() => addLog('System', 'Connection established. Ready.', 'system'), 500);
      };

      ws.onerror = (error) => {
        console.error('[Dashboard] WebSocket error:', error);
        setConnectionStatus('disconnected');
      };

      ws.onclose = () => {
        console.log('[Dashboard] WebSocket connection closed');
        setConnectionStatus('disconnected');
        if (!unmounted) {
          addLog('System', `Connection lost. Reconnecting in ${Math.round(reconnectDelay / 1000)}s...`, 'system');
          reconnectTimeout = setTimeout(() => {
            reconnectDelay = Math.min(reconnectDelay * 2, MAX_RECONNECT_DELAY);
            connect();
          }, reconnectDelay);
        }
      };

      ws.onmessage = (event) => {
      console.log('[Dashboard] WebSocket message received:', event.data.substring(0, 200));
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'dispute_started') {
          setStatus('deliberating');
          setVerdict(null);
          setActiveDisputeId(data.payload.disputeId);
          setReceipts([]); // Reset receipts for new dispute
          addLog('Orchestrator', `Case #${data.payload.disputeId} initiated for asset: ${data.payload.assetId}`, 'system');
          setAgentStatuses(prev => prev.map(agent => ({ ...agent, status: 'thinking', progress: 10 })));
          addTimelineEvent('system', 'Dispute Initiated', `Case #${data.payload.disputeId} opened for ${data.payload.assetId}`);
        } 
        else if (data.type === 'valuation_result') {
          addLog(data.payload.agent, `Submitted valuation evidence: $${data.payload.result.estimated_value.toLocaleString()} (Method: ${data.payload.result.method})`, 'evidence');
          const agentId = data.payload.agent.toLowerCase().replace(' ', '-');
          setAgentStatuses(prev => prev.map(agent => 
            agent.id === agentId || agent.name === data.payload.agent
              ? { ...agent, status: 'completed', progress: 100, lastAction: `Valued at $${data.payload.result.estimated_value.toLocaleString()}` }
              : agent
          ));
          addTimelineEvent('valuation', `${data.payload.agent} Valuation`, `Estimated value: $${data.payload.result.estimated_value.toLocaleString()}`);
        }
        else if (data.type === 'juror_vote') {
          const readableVote = data.payload.verdict.vote === 'FullRefund' ? 'a full refund' : 
                              data.payload.verdict.vote === 'SplitFifty' ? 'a 50/50 split' : 
                              data.payload.verdict.vote === 'FullRelease' ? 'a full release to the treasury' : data.payload.verdict.vote;
          addLog(data.payload.juror, `Recommends ${readableVote} (Round ${data.payload.round}).\nReasoning: "${data.payload.verdict.reasoning}"`, 'juror');
          const jurorId = data.payload.juror.toLowerCase().replace(' ', '-');
          setAgentStatuses(prev => prev.map(agent => 
            agent.id === jurorId || agent.name === data.payload.juror
              ? { ...agent, status: 'completed', progress: 100, lastAction: `Voted: ${readableVote}` }
              : agent
          ));
          addTimelineEvent('juror', `${data.payload.juror} Vote`, `Round ${data.payload.round}: ${readableVote}`);
        }
        else if (data.type === 'agent_thought') {
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
          const receipt = data.payload.receipt;
          addLog('Audit', `Receipt Generated: ${receipt.receiptId.slice(0, 8)}... for ${data.payload.juror} (Round ${data.payload.round})`, 'system');
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
          addTimelineEvent('verdict', 'Final Verdict', `Dispute resolved: ${data.payload.finalVerdict}`);
        }
        else if (data.type === 'transaction') {
          addPayment(data.payload);
          addTimelineEvent('payment', 'Payment Processed', `Transaction: ${data.payload.hash?.substring(0, 12)}...`);
        }
      } catch (err) {
        console.error("Error processing WS message", err);
      }
    };
    } // end connect()

    connect();

    return () => {
      unmounted = true;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (ws && ws.readyState === WebSocket.OPEN) ws.close();
    };
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
      if (!isAtBottom && autoScroll) setAutoScroll(false);
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
    const metadata = payload.metadata || {};
    let amount = 0.01;
    let currency = 'CSPR';
    if (typeof metadata.amount === 'string') {
      const match = metadata.amount.match(/([\d.]+)/);
      if (match) amount = parseFloat(match[1]);
    } else if (typeof metadata.amount === 'number') {
      amount = metadata.amount;
    }
    
    let recipient = 'Casper Chain';
    if (payload.type === 'Native Transfer') recipient = 'Casper Chain';
    else if (payload.type === 'x402 Payment') recipient = metadata.agentLabel || metadata.agent || 'Agent';
    else if (payload.type === 'HMAC Receipt Chain') return;
    
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
    setStarting(true);
    try {
      addLog('System', 'Initiating demo case...', 'system');
      const res = await fetch(`${import.meta.env.VITE_ORCHESTRATOR_URL || 'http://localhost:3011'}/api/disputes/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetId: 'PARKING-MIAMI-001', location: 'Miami', spotCount: 60 }),
      });
      if (!res.ok) {
        addLog('Error', `Orchestrator returned HTTP ${res.status}. Is the backend running?`, 'system');
        return;
      }
      const data = await res.json();
      if (!data.success) {
        addLog('Error', `Failed to start dispute: ${data.error || 'Unknown error'}`, 'system');
      }
    } catch (e: any) {
      addLog('Error', `Cannot reach orchestrator at localhost:3011 — ${e.message}. Start backend with: cd agents && npm run dev && npx tsx orchestrator/index.ts`, 'system');
    } finally {
      setStarting(false);
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
      {/* Terminal Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '2rem', marginBottom: '0.25rem', fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
            Live Session
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Observe autonomous <Tooltip term="AI Agents" explanation="Specialized LLMs evaluating specific parts of a dispute.">AI agents</Tooltip> resolving real-world disputes natively <Tooltip term="on-chain" explanation="Recorded permanently on the blockchain.">on-chain</Tooltip>.
          </p>
        </div>
        {/* Connection Status Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '0.5rem', backgroundColor: connectionStatus === 'connected' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)' }}>
          <div style={{ width: '0.5rem', height: '0.5rem', borderRadius: '50%', backgroundColor: connectionStatus === 'connected' ? '#10B981' : connectionStatus === 'connecting' ? '#F59E0B' : '#EF4444' }} />
          <span style={{ fontSize: '0.85rem', color: connectionStatus === 'connected' ? '#10B981' : connectionStatus === 'connecting' ? '#F59E0B' : '#EF4444' }}>
            {connectionStatus === 'connected' ? 'Backend Connected' : connectionStatus === 'connecting' ? 'Connecting...' : 'Backend Disconnected'}
          </span>
        </div>
      </div>
      {(status === 'idle' || status === 'settled') && (
        <button
          onClick={() => { setLogs([]); setVerdict(null); setStatus('idle'); startDemo(); }}
          disabled={starting}
          className="btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', padding: '0.6rem 1.25rem', opacity: starting ? 0.7 : 1, cursor: starting ? 'wait' : 'pointer' }}
        >
          {starting ? (
            <>
              <RefreshCw size={16} className="spin" />
              Starting...
            </>
          ) : status === 'settled' ? 'Start Another Case' : 'Start Demo Case'}
        </button>
      )}

      {/* Tabs */}
      <div className="deliberation-tabs" style={{ 
        display: 'flex', 
        gap: '0.5rem', 
        marginBottom: '1.5rem',
        padding: '0.5rem',
        background: 'var(--bg-surface)',
        borderRadius: '8px',
        border: '1px solid var(--border-color)',
        overflowX: 'auto'
      }}>
        {[
          { id: 'session', label: 'Session', icon: Activity },
          { id: 'evidence', label: 'Evidence & Proofs', icon: Brain },
          { id: 'payments', label: 'Payments & History', icon: DollarSign }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className="deliberation-tab"
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
              boxShadow: activeTab === tab.id ? 'var(--shadow-sm)' : 'none',
              whiteSpace: 'nowrap'
            }}
          >
            <tab.icon size={16} />
            <span className="hide-on-mobile">{tab.label}</span>
            <span className="show-on-mobile">{tab.id === 'session' ? 'Session' : tab.id === 'evidence' ? 'Evidence' : 'Payments'}</span>
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <AnimatePresence mode="wait">
          {activeTab === 'session' && (
            <motion.div
              key="session"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
            >
              {/* Top Verdict Panel (Moved Above Fold) */}
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
                      <span style={{ fontSize: '1rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Final Verdict</span>
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                      {verdict.finalVerdict === 'FullRefund' ? '100% Refund Granted' : 
                       verdict.finalVerdict === 'SplitFifty' ? '50/50 Settlement Reached' : 
                       'Full Release to Treasury'}
                    </div>
                    <div style={{ fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      <strong>Explanation:</strong> Based on the market APIs and mortgage rates, the 3 AI agents determined the true assessed value is <strong>${verdict.finalValue?.toLocaleString()}</strong>. The smart contract automatically routed the funds back to the token holders.
                    </div>
                    <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                      <button onClick={() => setActiveTab('evidence')} className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>View Evidence</button>
                      <button onClick={() => setActiveTab('payments')} className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>View Payment Trail</button>
                    </div>
                  </motion.div>
                ) : (
                  <div className="enterprise-card" style={{ background: 'var(--bg-main)', padding: '2rem', textAlign: 'center', border: '1px dashed var(--border-color)' }}>
                    <Zap size={32} color="var(--text-tertiary)" style={{ marginBottom: '1rem' }} />
                    <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Awaiting Verdict</h4>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      {status === 'idle' ? 'Start a case to see the AI verdict.' : 'Agents are deliberating and building consensus...'}
                    </p>
                  </div>
                )}
              </div>

              {/* Layout Split: Agents (25%) / Live Log (75%) */}
              <div className="deliberation-main-grid" style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 3fr', 
                gap: '1.5rem'
              }}>
                {/* Agent Status Panel */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <h4 style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)', marginBottom: '0.5rem' }}>Agents</h4>
                  {agentStatuses.map(agent => (
                    <motion.div
                      key={agent.id}
                      initial={{ opacity: 0, y: 10 }}
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
                      <div style={{ position: 'absolute', bottom: 0, left: 0, height: '3px', width: `${agent.progress}%`, background: getStatusColor(agent.status), transition: 'width 0.3s ease' }} />
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: getStatusColor(agent.status) }} />
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{agent.name}</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                        {agent.status === 'idle' ? 'Standby' : agent.status === 'thinking' ? 'Processing...' : 'Completed'}
                      </div>
                    </motion.div>
                  ))}
                  
                  {/* Overall Progress */}
                  <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--bg-surface)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Overall Progress</span>
                      <span>{Math.round(agentStatuses.reduce((acc, a) => acc + a.progress, 0) / agentStatuses.length)}%</span>
                    </div>
                    <div style={{ width: '100%', height: '4px', background: 'var(--bg-main)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: 'var(--primary)', width: `${Math.round(agentStatuses.reduce((acc, a) => acc + a.progress, 0) / agentStatuses.length)}%`, transition: 'width 0.3s ease' }} />
                    </div>
                  </div>
                </div>

                {/* Live Log */}
                <div className="enterprise-card deliberation-log-container" style={{ background: 'var(--bg-main)', height: '600px', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface)' }}>
                    <h4 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', margin: 0 }}>Live Log</h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      {logs.length > 0 && !autoScroll && (
                        <button onClick={() => { setAutoScroll(true); if(scrollContainerRef.current) scrollContainerRef.current.scrollTo({ top: scrollContainerRef.current.scrollHeight, behavior: 'smooth' }); }} style={{ background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '999px', padding: '0.2rem 0.6rem', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <span style={{ width: '6px', height: '6px', background: 'white', borderRadius: '50%' }}></span>
                          New Events
                        </button>
                      )}
                      <button onClick={() => { setAutoScroll(!autoScroll); }} style={{ background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '0.35rem 0.75rem', color: autoScroll ? '#10B981' : 'var(--text-tertiary)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, transition: 'all 0.2s' }}>
                        Auto-Scroll {autoScroll ? 'On' : 'Off'}
                      </button>
                    </div>
                  </div>
                  <div ref={scrollContainerRef} onScroll={handleScroll} style={{ flexGrow: 1, overflowY: 'auto', padding: '1.5rem' }}>
                    <AnimatePresence initial={false}>
                      {logs.length === 0 && (
                        <div style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem', textAlign: 'center', marginTop: '2rem' }}>
                          Log is empty. Start a case to see activity.
                        </div>
                      )}
                      {logs.map((log) => (
                        <motion.div key={log.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '1.25rem', display: 'flex', gap: '1.25rem' }}>
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
              </div>
            </motion.div>
          )}

          {activeTab === 'evidence' && (
            <motion.div key="evidence" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <AgentBrainVisualization />
              <CryptographicProofExplorer receipts={receipts} onVerify={async (_hash) => {
                  if (!activeDisputeId) {
                    addLog('Audit', '⚠ No active dispute to verify', 'system');
                    return;
                  }
                  addLog('Audit', `🔍 Verifying receipt chain for dispute ${activeDisputeId}...`, 'system');
                  try {
                    const result = await verifyReceiptChain(activeDisputeId);
                    if (!result.success) {
                      addLog('Audit', `✗ Verification request failed: ${result.reason}`, 'system');
                      return;
                    }
                    if (result.valid) {
                      addLog('Audit', `✅ Chain VALID — ${result.receiptCount} receipts verified with HMAC signatures`, 'system');
                    } else {
                      addLog('Audit', `❌ Chain INVALID — tampering detected in ${result.receiptCount} receipts`, 'system');
                    }
                    // Log per-receipt details
                    for (const d of result.details) {
                      const icon = d.chainLinkValid ? '✓' : '✗';
                      addLog('Audit', `  ${icon} Receipt ${d.receiptId.substring(0, 8)}... (juror: ${d.jurorId}, round: ${d.round}) — chain link: ${d.chainLinkValid ? 'ok' : 'BROKEN'}`, 'system');
                    }
                  } catch (err: any) {
                    addLog('Audit', `✗ Verification error: ${err.message}`, 'system');
                  }
              }} />
            </motion.div>
          )}

          {activeTab === 'payments' && (
            <motion.div key="payments" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <PaymentFlowVisualizer payments={payments} totalVolume={payments.reduce((sum, p) => sum + p.amount, 0)} />
              <TimeTravelReplay events={timelineEvents} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};