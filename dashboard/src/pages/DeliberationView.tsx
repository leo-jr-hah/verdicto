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
        addLog(data.payload.juror, `Round ${data.payload.round} vote: ${data.payload.verdict.vote} (Confidence/Rep: ${data.payload.rep})`, 'juror');
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
    <div style={{ backgroundColor: '#000000', color: '#FFFFFF', minHeight: 'calc(100vh - 72px)', fontFamily: "'JetBrains Mono', 'Courier New', Courier, monospace" }}>
      {/* Terminal Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem', borderBottom: '1px solid #333', backgroundColor: '#0a0a0a' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <div>
            <div style={{ fontSize: '0.7rem', color: '#666', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Status</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: status === 'deliberating' ? 'var(--primary)' : '#10B981', fontWeight: 600 }}>
              <Activity size={14} className={status === 'deliberating' ? "animate-pulse" : ""} />
              {status === 'idle' ? 'Standby' : status === 'deliberating' ? 'In Progress' : 'Resolved'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: '#666', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Network</div>
            <div style={{ fontWeight: 600 }}>Casper Testnet</div>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '8px', top: '8px', color: '#666' }} />
            <input 
              type="text" 
              placeholder="Filter transcripts..." 
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              style={{ background: '#111', border: '1px solid #333', color: '#fff', padding: '0.25rem 0.5rem 0.25rem 2rem', fontSize: '0.8rem', fontFamily: 'inherit', width: '200px' }} 
            />
          </div>
          {status === 'idle' && (
            <button onClick={startDemo} style={{ background: '#fff', color: '#000', border: 'none', padding: '0.25rem 1rem', fontSize: '0.8rem', fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', borderRadius: '4px' }}>
              Trigger Dispute
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr 350px', height: 'calc(100vh - 140px)' }}>
        
        {/* Left Panel: Case Info */}
        <div style={{ borderRight: '1px solid #333', padding: '1.5rem', backgroundColor: '#050505', overflowY: 'auto' }}>
          <h3 style={{ fontSize: '0.85rem', color: '#666', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem', borderBottom: '1px solid #222', paddingBottom: '0.5rem' }}>Case Details</h3>
          
          {activeDispute ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dispute ID</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--primary)' }}>#{activeDispute.disputeId}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Asset Reference</div>
                <div style={{ fontSize: '0.9rem' }}>{activeDispute.assetId}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Location</div>
                <div style={{ fontSize: '0.9rem' }}>{activeDispute.location}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Asset Metrics</div>
                <div style={{ fontSize: '0.9rem' }}>Spots: {activeDispute.spotCount}</div>
              </div>
              
              {verdict && (
                <div style={{ marginTop: '2rem', padding: '1.5rem', border: '1px solid #333', backgroundColor: '#111', borderRadius: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10B981', marginBottom: '0.5rem' }}>
                    <CheckCircle2 size={16} />
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Resolution Details</span>
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.25rem', color: '#fff' }}>{verdict.finalVerdict.replace(/([A-Z])/g, ' $1').trim()}</div>
                  <div style={{ fontSize: '0.85rem', color: '#888' }}>Assessed Value: ${verdict.finalValue.toLocaleString()}</div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ color: '#444', fontSize: '0.85rem', fontStyle: 'italic' }}>Awaiting case data...</div>
          )}
        </div>

        {/* Center Panel: Transcript/Logs */}
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#000' }}>
          <div style={{ padding: '0.5rem 1rem', borderBottom: '1px solid #222', fontSize: '0.75rem', color: '#666', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Deliberation Log</span>
            <button 
              onClick={() => setAutoScroll(!autoScroll)} 
              style={{ background: 'none', border: 'none', color: autoScroll ? '#10B981' : '#666', cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'inherit' }}
            >
              Auto-Scroll: {autoScroll ? 'On' : 'Off'}
            </button>
          </div>
          
          <div style={{ flexGrow: 1, overflowY: 'auto', padding: '1rem 1.5rem', fontSize: '0.85rem', lineHeight: 1.6 }}>
            <AnimatePresence initial={false}>
              {logs.filter(log => 
                log.content.toLowerCase().includes(filterText.toLowerCase()) || 
                log.type.toLowerCase().includes(filterText.toLowerCase())
              ).map((log) => (
                <motion.div 
                  key={log.id}
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  style={{ marginBottom: '0.75rem', display: 'flex', gap: '1rem', color: getLogColor(log.category) }}
                >
                  <span style={{ color: '#555', flexShrink: 0, width: '75px' }}>
                    {new Date(log.timestamp).toISOString().substr(11, 12)}
                  </span>
                  <span style={{ fontWeight: 600, flexShrink: 0, width: '120px' }}>
                    [{log.type}]
                  </span>
                  <span style={{ flexGrow: 1, wordBreak: 'break-word' }}>
                    {log.content}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={logsEndRef} />
          </div>
        </div>

        {/* Right Panel: Jury / Agents */}
        <div style={{ borderLeft: '1px solid #333', padding: '1.5rem', backgroundColor: '#050505', overflowY: 'auto' }}>
          <h3 style={{ fontSize: '0.85rem', color: '#666', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem', borderBottom: '1px solid #222', paddingBottom: '0.5rem' }}>Active Agents</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {['Comps Specialist', 'DCF Specialist', 'Evidence Analyst', 'Market Data Interpreter', 'Precedent Researcher'].map((agent) => (
              <div key={agent} style={{ padding: '0.75rem', border: '1px solid #222', backgroundColor: '#0a0a0a' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{agent}</div>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: status === 'idle' ? '#444' : '#10B981' }}></div>
                </div>
                <div style={{ fontSize: '0.7rem', color: '#666', display: 'flex', justifyContent: 'space-between' }}>
                  <span>State: {status === 'idle' ? 'Idle' : 'Listening'}</span>
                  <span>Rep: 90+</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
