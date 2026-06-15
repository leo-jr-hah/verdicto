import React, { useState, useEffect, useRef } from 'react';
import { Activity, Search, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type LogEntry = {
  id: string;
  timestamp: number;
  type: string;
  content: string;
  category: 'system' | 'juror' | 'verdict' | 'evidence';
};

export const DeliberationView: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [status, setStatus] = useState<'idle' | 'deliberating' | 'settled'>('idle');
  const [activeDispute, setActiveDispute] = useState<any>(null);
  const [verdict, setVerdict] = useState<any>(null);
  const [filterText, setFilterText] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [showScenario, setShowScenario] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

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
      } 
      else if (data.type === 'valuation_result') {
        addLog(data.payload.agent, `Submitted valuation evidence: $${data.payload.result.estimated_value.toLocaleString()} (Method: ${data.payload.result.method})`, 'evidence');
      }
      else if (data.type === 'juror_vote') {
        const readableVote = data.payload.verdict.vote === 'FullRefund' ? 'a full refund' : 
                             data.payload.verdict.vote === 'SplitFifty' ? 'a 50/50 split' : 
                             data.payload.verdict.vote === 'FullRelease' ? 'a full release to the treasury' : data.payload.verdict.vote;
        addLog(data.payload.juror, `Recommends ${readableVote} (Round ${data.payload.round}).\nReasoning: "${data.payload.verdict.reasoning}"`, 'juror');
      }
      else if (data.type === 'final_verdict') {
        setStatus('settled');
        setVerdict(data.payload);
        addLog('Orchestrator', `Dispute resolved. Final Verdict Issued: ${data.payload.finalVerdict}`, 'verdict');
      }
    };

    return () => ws.close();
  }, []);

  useEffect(() => {
    if (autoScroll) {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const addLog = (source: string, content: string, category: LogEntry['category']) => {
    setLogs(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      type: source,
      content,
      category
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

  // Helper for Bloomberg-style terminal text color
  const getLogColor = (category: string) => {
    switch (category) {
      case 'system': return 'var(--text-tertiary)';
      case 'evidence': return '#10B981'; // Green
      case 'juror': return '#D1D5DB'; // Light gray instead of global dark text-primary
      case 'verdict': return 'var(--primary)';
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

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>Live Court Dashboard</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Observe autonomous AI agents resolving real-world disputes natively on Casper.</p>
        </div>
        {status === 'idle' && (
          <button onClick={() => setShowScenario(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', padding: '0.75rem 1.5rem' }}>
            Start New Dispute
          </button>
        )}
      </div>

      {/* Top Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="enterprise-card" style={{ background: 'var(--bg-main)' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Active Dispute</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>{activeDispute ? `#${activeDispute.disputeId}` : 'None'}</div>
        </div>
        <div className="enterprise-card" style={{ background: 'var(--bg-main)' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Asset Value</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>{activeDispute ? `$2.4M` : '-'}</div>
        </div>
        <div className="enterprise-card" style={{ background: 'var(--bg-main)' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Assigned Jurors</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>{activeDispute ? '3' : '0'}</div>
        </div>
        <div className="enterprise-card" style={{ background: 'var(--bg-main)' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Status</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.5rem', fontWeight: 700, color: status === 'deliberating' ? '#10B981' : 'var(--text-primary)', marginTop: '0.5rem' }}>
            {status === 'deliberating' && <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#10B981' }} className="animate-pulse"></span>}
            {status === 'idle' ? 'Standby' : status === 'deliberating' ? 'In Progress' : 'Resolved'}
          </div>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* Left Column: Log / Timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="enterprise-card" style={{ background: 'var(--bg-main)' }}>
            <h4 style={{ marginBottom: '1rem', fontSize: '1.25rem', paddingBottom: '0.75rem', color: 'var(--text-primary)' }}>Case Background</h4>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '1rem' }}>
              The Buyer purchased $50,000 in tokenized shares. The local market crashed. The property manager claims the garage is still worth $2.4M and refuses a partial refund to the treasury. The Buyer has requested immediate AI arbitration to assess real market value via RentCast and FRED data.
            </p>
          </div>

          <div className="enterprise-card" style={{ background: 'var(--bg-main)', flexGrow: 1, height: '400px', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface)' }}>
              <h4 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', margin: 0 }}>Deliberation Activity</h4>
              <button onClick={() => setAutoScroll(!autoScroll)} style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '0.5rem 1rem', color: autoScroll ? '#10B981' : 'var(--text-tertiary)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>Auto-Scroll {autoScroll ? 'On' : 'Off'}</button>
            </div>
            <div style={{ flexGrow: 1, overflowY: 'auto', padding: '1.5rem' }}>
              <AnimatePresence initial={false}>
                {logs.filter(log => 
                  log.content.toLowerCase().includes(filterText.toLowerCase()) || 
                  log.type.toLowerCase().includes(filterText.toLowerCase())
                ).map((log) => (
                  <motion.div 
                    key={log.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ marginBottom: '1.5rem', display: 'flex', gap: '1.5rem' }}
                  >
                    <div style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', flexShrink: 0, width: '65px', paddingTop: '2px', fontWeight: 500 }}>
                      {new Date(log.timestamp).toISOString().substr(11, 8)}
                    </div>
                    <div style={{ flexGrow: 1, borderLeft: '2px solid var(--border-color)', paddingLeft: '1.5rem', position: 'relative' }}>
                      <div style={{ position: 'absolute', left: '-5px', top: '6px', width: '8px', height: '8px', borderRadius: '50%', background: getLogColor(log.category) }}></div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem', fontSize: '1rem' }}>
                        {log.type}
                      </div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, wordBreak: 'break-word' }}>
                        {log.content}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={logsEndRef} />
            </div>
          </div>

          {verdict && (
            <div className="enterprise-card" style={{ border: '2px solid var(--primary)', backgroundColor: 'var(--bg-main)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--primary)', marginBottom: '1.25rem' }}>
                <CheckCircle2 size={24} />
                <span style={{ fontSize: '1.1rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Final AI Verdict</span>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)' }}>
                {verdict.finalVerdict === 'FullRefund' ? '100% Refund Granted' : 
                 verdict.finalVerdict === 'SplitFifty' ? '50/50 Settlement Reached' : 
                 'Full Release to Treasury'}
              </div>
              <div style={{ fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                <strong>Explanation:</strong> Based on the RentCast market APIs and FRED mortgage rates, the 3 AI agents determined that the property manager severely over-reported the valuation. The true assessed value is <strong>${verdict.finalValue.toLocaleString()}</strong>. The Odra smart contract will now automatically route the funds back to the token holders.
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Agents Sidebar */}
        <div className="enterprise-card" style={{ background: 'var(--bg-main)', padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface)' }}>
            <h4 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', margin: 0 }}>Team Collaboration</h4>
          </div>
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {[
              { name: 'Comps Specialist', type: 'Valuation', desc: 'Analyzes recent property sales via RentCast API.' },
              { name: 'DCF Specialist', type: 'Valuation', desc: 'Calculates NPV using FRED mortgage rates.' },
              { name: 'Evidence Analyst', type: 'Juror (LLM)', desc: 'Validates raw data points and comps.' },
              { name: 'Data Interpreter', type: 'Juror (LLM)', desc: 'Provides macro-economic context.' },
              { name: 'Case Researcher', type: 'Juror (RAG)', desc: 'Searches Vectra RAG for historical precedents.' }
            ].map((agent, idx) => (
              <div key={agent.name} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--bg-surface-alt)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, color: 'var(--text-tertiary)', fontSize: '1rem' }}>
                  {agent.name.substring(0, 2).toUpperCase()}
                </div>
                <div style={{ flexGrow: 1 }}>
                  <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{agent.name}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>{agent.type}</div>
                </div>
                <div style={{ padding: '6px 12px', background: status === 'idle' ? 'var(--bg-surface-alt)' : status === 'settled' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(252, 211, 77, 0.1)', color: status === 'idle' ? 'var(--text-secondary)' : status === 'settled' ? '#10B981' : '#F59E0B', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600, border: '1px solid var(--border-color)' }}>
                  {status === 'idle' ? 'Standby' : status === 'deliberating' ? 'In Progress' : 'Completed'}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
