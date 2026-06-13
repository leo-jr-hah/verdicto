import { useState, useEffect, useRef } from 'react';
import { Shield, Activity, Gavel, Scale, Database, Server } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type LogEntry = {
  id: string;
  timestamp: number;
  type: string;
  content: string;
  category: 'system' | 'juror' | 'verdict';
};

function App() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [status, setStatus] = useState<'idle' | 'deliberating' | 'settled'>('idle');
  const [activeDispute, setActiveDispute] = useState<any>(null);
  const [verdict, setVerdict] = useState<any>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Connect to Orchestrator WebSocket
    const ws = new WebSocket('ws://localhost:3010');
    
    ws.onopen = () => {
      addLog('System', 'Connected to Orchestrator WebSocket', 'system');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'dispute_started') {
        setStatus('deliberating');
        setActiveDispute(data.payload);
        setVerdict(null);
        setLogs([]);
        addLog('System', `Dispute #${data.payload.disputeId} Started for ${data.payload.assetId}`, 'system');
      } 
      else if (data.type === 'valuation_result') {
        addLog(data.payload.agent, `Valuation returned: $${data.payload.result.estimated_value.toLocaleString()} via ${data.payload.result.method}`, 'juror');
      }
      else if (data.type === 'juror_vote') {
        addLog(data.payload.juror, `Round ${data.payload.round}: Voted ${data.payload.verdict.vote} (Rep: ${data.payload.rep})`, 'juror');
      }
      else if (data.type === 'final_verdict') {
        setStatus('settled');
        setVerdict(data.payload);
        addLog('System', `Final Verdict reached: ${data.payload.finalVerdict}`, 'verdict');
      }
    };

    return () => ws.close();
  }, []);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const addLog = (source: string, content: string, category: 'system' | 'juror' | 'verdict') => {
    setLogs(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      type: source,
      content,
      category
    }]);
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1>
          <Shield className="highlight" size={32} />
          <span>Casper RWA <span className="highlight">Court</span></span>
        </h1>
        <div className={`badge ${status === 'deliberating' ? 'badge-active' : 'badge-pending'}`}>
          {status === 'deliberating' ? (
            <span className="flex items-center gap-2"><Activity size={14} className="animate-pulse" /> Deliberating</span>
          ) : status === 'settled' ? (
            <span className="flex items-center gap-2"><Gavel size={14} /> Settled on Chain</span>
          ) : (
            <span className="flex items-center gap-2"><Server size={14} /> Listening</span>
          )}
        </div>
      </header>

      <div className="grid-layout">
        <main className="main-content">
          <AnimatePresence mode="wait">
            {status === 'idle' && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="glass-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}
              >
                <Database size={48} style={{ opacity: 0.5, margin: '0 auto 1rem' }} />
                <h2 style={{ marginBottom: '0.5rem' }}>Waiting for Dispute</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Trigger a dispute to see real-time agent deliberation.</p>
                <button 
                  onClick={async () => {
                    try {
                      await fetch('http://localhost:3011/api/disputes/start', { method: 'POST' });
                    } catch (e) {
                      console.error('Failed to start dispute', e);
                    }
                  }}
                  style={{
                    background: 'var(--accent-red)',
                    color: 'white',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    border: 'none',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  Start Demo Dispute
                </button>
              </motion.div>
            )}

            {status !== 'idle' && activeDispute && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card" style={{ marginBottom: '2rem' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>Dispute #{activeDispute.disputeId}</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{activeDispute.assetId} • {activeDispute.location}</p>
                  </div>
                  <div className="badge badge-pending">Active Case</div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Asset Type</div>
                    <div style={{ fontWeight: 500 }}>Commercial Real Estate</div>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Subject Spots</div>
                    <div style={{ fontWeight: 500 }}>{activeDispute.spotCount}</div>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Network</div>
                    <div style={{ fontWeight: 500, color: 'var(--accent-red)' }}>Casper Testnet</div>
                  </div>
                </div>
              </motion.div>
            )}

            {verdict && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card"
                style={{ border: '1px solid var(--accent-green)', background: 'rgba(188, 252, 7, 0.05)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{ background: 'rgba(188, 252, 7, 0.1)', padding: '0.75rem', borderRadius: '50%', color: 'var(--accent-green)' }}>
                    <Scale size={24} />
                  </div>
                  <div>
                    <h3 style={{ color: 'var(--accent-green)', fontSize: '1.25rem', marginBottom: '0.25rem' }}>Final Verdict: {verdict.finalVerdict}</h3>
                    <p style={{ color: 'var(--text-secondary)' }}>Assessed Value: ${verdict.finalValue.toLocaleString()}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <span>Agent A Weight: {verdict.scoreA}</span>
                  <span>Agent B Weight: {verdict.scoreB}</span>
                  <span>Split Weight: {verdict.scoreSplit}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        <aside className="sidebar">
          <div className="glass-card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={16} /> Live Agent Logs
            </h3>
            <div className="log-container" style={{ flexGrow: 1 }}>
              <AnimatePresence initial={false}>
                {logs.map((log) => (
                  <motion.div 
                    key={log.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`log-entry ${log.category}`}
                  >
                    <span style={{ opacity: 0.5, marginRight: '0.5rem' }}>
                      {new Date(log.timestamp).toLocaleTimeString([], { hour12: false })}
                    </span>
                    <strong>[{log.type}]</strong> {log.content}
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={logsEndRef} />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default App;
