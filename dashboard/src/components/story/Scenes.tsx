import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Database, GitMerge, ShieldCheck, CheckCircle2, Lock, Bot, Link as LinkIcon } from 'lucide-react';

/* -------------------------------------------------------------------------- */
/* SCENE 1: The Valuation Gap                                                 */
/* -------------------------------------------------------------------------- */
export const Scene1ValuationGap: React.FC = () => {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      {/* Background Grid */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.05, backgroundImage: 'radial-gradient(var(--text-secondary) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
      
      {/* Left Party: Asset Owner */}
      <motion.div 
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: -80, opacity: 1 }}
        transition={{ duration: 0.8, type: 'spring' }}
        style={{ position: 'absolute', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}
      >
        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Asset Owner</div>
        <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', padding: '1.5rem', borderRadius: '12px', boxShadow: 'var(--shadow-md)', textAlign: 'center' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', marginBottom: '0.5rem' }}>Valuation Claim</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>$2.4M</div>
        </div>
      </motion.div>

      {/* Right Party: Investor */}
      <motion.div 
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 80, opacity: 1 }}
        transition={{ duration: 0.8, type: 'spring', delay: 0.2 }}
        style={{ position: 'absolute', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}
      >
        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Investor</div>
        <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', padding: '1.5rem', borderRadius: '12px', boxShadow: 'var(--shadow-md)', textAlign: 'center' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', marginBottom: '0.5rem' }}>Valuation Claim</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>$1.8M</div>
        </div>
      </motion.div>

      {/* Tension / Valuation Gap Line */}
      <svg style={{ position: 'absolute', width: '200px', height: '100px', zIndex: 5 }}>
        <motion.path 
          d="M 0 50 Q 100 0 200 50" 
          fill="transparent" 
          stroke="var(--primary)" 
          strokeWidth="2" 
          strokeDasharray="4 4"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.5 }}
          transition={{ duration: 1.5, delay: 0.5, ease: "easeInOut" }}
        />
        <motion.path 
          d="M 0 50 Q 100 100 200 50" 
          fill="transparent" 
          stroke="var(--primary)" 
          strokeWidth="2" 
          strokeDasharray="4 4"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.5 }}
          transition={{ duration: 1.5, delay: 0.5, ease: "easeInOut" }}
        />
      </svg>
      
      {/* Floating Valuation Data */}
      <motion.div
        animate={{ y: [-5, 5, -5] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        style={{ position: 'absolute', top: '30%', background: 'rgba(255, 59, 59, 0.1)', color: 'var(--primary)', padding: '0.5rem 1rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600 }}
      >
        Conflict: Market Value
      </motion.div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* SCENE 2: Agents Investigate                                                */
/* -------------------------------------------------------------------------- */
export const Scene2Investigation: React.FC = () => {
  const agents = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon'];
  const sources = ['Market Data', 'Economic Trends', 'Property Metrics'];
  
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: '3rem 2rem', position: 'relative' }}>
      {/* Data Sources */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', width: '100%', zIndex: 10 }}>
        {sources.map((source, i) => (
          <motion.div 
            key={source}
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
          >
            <Database size={20} color="var(--primary)" />
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center', fontWeight: 600 }}>{source}</div>
          </motion.div>
        ))}
      </div>

      {/* Flow Lines */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 5 }}>
        {agents.map((_, i) => (
          <motion.line 
            key={i}
            x1="50%" y1="30%" 
            x2={`${15 + i * 17.5}%`} y2="70%" 
            stroke="var(--border-color)" 
            strokeWidth="1"
            strokeDasharray="4 4"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, delay: 0.5 }}
          />
        ))}
        {/* Animated flow dots */}
        {agents.map((_, i) => (
          <motion.circle 
            key={`dot-${i}`}
            r="3"
            fill="var(--primary)"
            initial={{ cx: "50%", cy: "30%", opacity: 0 }}
            animate={{ cx: `${15 + i * 17.5}%`, cy: "70%", opacity: [0, 1, 0] }}
            transition={{ duration: 2, delay: 1 + i * 0.2, repeat: Infinity }}
          />
        ))}
      </svg>

      {/* AI Agents */}
      <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', zIndex: 10, padding: '0 1rem' }}>
        {agents.map((agent, i) => (
          <motion.div 
            key={agent}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 + i * 0.1, duration: 0.5 }}
            style={{ 
              width: '56px', 
              height: '56px', 
              background: 'var(--bg-main)', 
              border: '2px solid var(--border-color)', 
              borderRadius: '16px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              boxShadow: 'var(--shadow-sm)',
              position: 'relative'
            }}
          >
            <Bot size={24} color="var(--text-secondary)" />
          </motion.div>
        ))}
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* SCENE 3: Deliberation                                                      */
/* -------------------------------------------------------------------------- */
export const Scene3Deliberation: React.FC = () => {
  const [pulse, setPulse] = useState(false);
  
  useEffect(() => {
    const interval = setInterval(() => setPulse(p => !p), 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      
      {/* Central Network Node */}
      <motion.div 
        animate={{ scale: pulse ? 1.05 : 1 }}
        transition={{ duration: 1 }}
        style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--bg-main)', border: '2px dashed var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5, boxShadow: 'var(--shadow-md)' }}
      >
        <GitMerge size={32} color="var(--primary)" />
      </motion.div>

      {/* SVG Connecting Lines */}
      <svg style={{ position: 'absolute', width: '300px', height: '300px', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 1 }}>
        {[0, 1, 2, 3, 4].map((i) => {
          const angle = (i * 72 - 90) * (Math.PI / 180);
          const x2 = 150 + Math.cos(angle) * 120;
          const y2 = 150 + Math.sin(angle) * 120;
          return (
            <motion.line
              key={`line-${i}`}
              x1="150" y1="150" x2={x2} y2={y2}
              stroke="var(--border-color)"
              strokeWidth="2"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1, delay: i * 0.1 }}
            />
          )
        })}
      </svg>

      {/* Agents in circle */}
      {[0, 1, 2, 3, 4].map((i) => {
        const angle = (i * 72 - 90) * (Math.PI / 180);
        const radius = 120;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        
        return (
          <motion.div 
            key={i}
            initial={{ opacity: 0, x: 0, y: 0 }}
            animate={{ opacity: 1, x, y }}
            transition={{ duration: 0.8, delay: i * 0.1, type: 'spring' }}
            style={{ 
              position: 'absolute',
              width: '48px', 
              height: '48px', 
              background: 'var(--bg-main)', 
              border: '1px solid var(--border-color)', 
              borderRadius: '12px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              boxShadow: 'var(--shadow-sm)',
              zIndex: 10
            }}
          >
            <Bot size={20} color="var(--text-secondary)" />
          </motion.div>
        );
      })}

      {/* Reasoning Cards */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: -50, x: 40 }}
        animate={{ opacity: [0, 1, 0], y: -80, x: 10 }}
        transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
        style={{ position: 'absolute', padding: '0.5rem 0.75rem', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.65rem', color: 'var(--text-primary)', fontWeight: 500, boxShadow: 'var(--shadow-sm)', zIndex: 15 }}
      >
        Occupancy trend supports lower valuation
      </motion.div>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 50, x: -40 }}
        animate={{ opacity: [0, 1, 0], y: 80, x: -10 }}
        transition={{ duration: 3, repeat: Infinity, delay: 2 }}
        style={{ position: 'absolute', padding: '0.5rem 0.75rem', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.65rem', color: 'var(--text-primary)', fontWeight: 500, boxShadow: 'var(--shadow-sm)', zIndex: 15 }}
      >
        Comparable sales indicate mid-range
      </motion.div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* SCENE 4: Trust-Weighted Consensus                                          */
/* -------------------------------------------------------------------------- */
export const Scene4Consensus: React.FC = () => {
  const agents = [
    { name: 'Agent Alpha', score: 98, weight: 35 },
    { name: 'Agent Beta', score: 91, weight: 25 },
    { name: 'Agent Gamma', score: 84, weight: 20 },
    { name: 'Agent Delta', score: 78, weight: 12 },
    { name: 'Agent Epsilon', score: 71, weight: 8 },
  ];

  return (
    <div className="scene4-grid" style={{ width: '100%', height: '100%', display: 'grid', gridTemplateColumns: '1.2fr 1fr', alignItems: 'center', gap: '2rem', padding: '3rem' }}>
      
      {/* Agents List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', zIndex: 10 }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)', marginBottom: '0.5rem' }}>
          Historical Trust Scores
        </div>
        {agents.map((agent, i) => (
          <motion.div 
            key={agent.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.15 }}
            style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--bg-main)', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}
          >
            <div style={{ width: '80px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {agent.name}
            </div>
            <div style={{ flex: 1, height: '6px', background: 'var(--bg-surface-alt)', borderRadius: '3px', overflow: 'hidden' }}>
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${agent.score}%` }}
                transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
                style={{ height: '100%', background: agent.score > 90 ? 'var(--success)' : 'var(--primary)' }}
              />
            </div>
            <div style={{ width: '30px', textAlign: 'right', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {agent.score}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Consensus Meter */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.5, duration: 0.8, type: 'spring' }}
          style={{ 
            width: '160px',
            height: '160px',
            borderRadius: '50%',
            border: '8px solid var(--bg-main)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-main)',
            boxShadow: 'var(--shadow-lg)',
            position: 'relative'
          }}
        >
          <svg style={{ position: 'absolute', inset: -8, width: '160px', height: '160px' }} viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="46" fill="none" stroke="var(--border-color)" strokeWidth="8" />
            <motion.circle 
              cx="50" cy="50" r="46" 
              fill="none" 
              stroke="#10B981" 
              strokeWidth="8" 
              strokeDasharray="289" 
              initial={{ strokeDashoffset: 289 }}
              animate={{ strokeDashoffset: 289 - (289 * 0.91) }}
              transition={{ duration: 1.5, delay: 2, ease: "easeOut" }}
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
            />
          </svg>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
            91%
          </div>
          <div style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
            Confidence
          </div>
        </motion.div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* SCENE 5: Verdicto Generated                                                 */
/* -------------------------------------------------------------------------- */
export const Scene5Verdict: React.FC = () => {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', gap: '2rem' }}>
      
      {/* Top Floating Badges */}
      <div style={{ display: 'flex', gap: '1rem', zIndex: 10 }}>
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', padding: '0.75rem 1.25rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: 'var(--shadow-sm)', color: 'var(--text-primary)' }}
        >
          <ShieldCheck size={16} color="var(--success)" /> Audit Trail Generated
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', padding: '0.75rem 1.25rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: 'var(--shadow-sm)', color: 'var(--text-primary)' }}
        >
          <FileText size={16} color="var(--primary)" /> Proof Hash Calculated
        </motion.div>
      </div>

      {/* Main Verdicto Card */}
      <motion.div 
        initial={{ y: 50, opacity: 0, scale: 0.9 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, type: 'spring' }}
        style={{ 
          background: 'var(--bg-main)', 
          border: '1px solid var(--border-color)', 
          padding: '2.5rem', 
          borderRadius: '16px', 
          boxShadow: 'var(--shadow-lg)', 
          textAlign: 'center',
          width: '320px',
          zIndex: 20
        }}
      >
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--success-soft)', color: 'var(--success)', padding: '0.4rem 1rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 600, marginBottom: '1.5rem' }}>
          <CheckCircle2 size={16} /> Final Verdicto
        </div>
        
        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fair Market Value</div>
        <div style={{ fontSize: '3.5rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-display)', marginBottom: '2rem', lineHeight: 1 }}>
          $2.05<span style={{ fontSize: '1.75rem', color: 'var(--text-secondary)' }}>M</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', textAlign: 'left', background: 'var(--bg-surface)', padding: '1rem', borderRadius: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Confidence Score</span>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>91.4%</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Signatures</span>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>5 / 5 Verified</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* SCENE 6: Recorded on Casper                                                */
/* -------------------------------------------------------------------------- */
export const Scene6OnChain: React.FC = () => {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      
      {/* Blockchain Nodes */}
      <div className="scene6-nodes" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', zIndex: 10, maxWidth: '100%', overflowX: 'auto', paddingBottom: '1rem' }}>
        
        {/* Previous Block */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}
          style={{ width: '80px', height: '100px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}
        >
          <Lock size={20} />
        </motion.div>
        
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} style={{ color: 'var(--text-tertiary)' }}>
          <LinkIcon size={24} />
        </motion.div>
        
        {/* The New Block */}
        <motion.div 
          initial={{ y: -50, opacity: 0, scale: 1.1 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, type: 'spring', delay: 0.8 }}
          style={{ 
            width: '220px', 
            background: 'var(--text-primary)', 
            border: '1px solid var(--border-color)', 
            padding: '1.5rem', 
            borderRadius: '12px', 
            color: 'white',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)', fontSize: '0.85rem', fontWeight: 600 }}>
            <Lock size={16} /> Block #89210
          </div>
          <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-tertiary)', wordBreak: 'break-all' }}>
            0x7f8a9e2b1c4d...b34c
          </div>
          <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ fontSize: '0.85rem', color: 'var(--text-inverse)', lineHeight: 1.6 }}>
            <strong>Verdicto:</strong> $2.05M<br/>
            <strong>Confidence:</strong> 91.4%
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }} style={{ color: 'var(--text-tertiary)' }}>
          <LinkIcon size={24} />
        </motion.div>

        {/* Next Block */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 1.5 }}
          style={{ width: '80px', height: '100px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}
        >
          <Lock size={20} />
        </motion.div>
      </div>

      {/* Footer Keywords */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2, duration: 0.8 }}
        style={{ position: 'absolute', bottom: '15%', display: 'flex', gap: '2rem', fontSize: '0.9rem', fontWeight: 600, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}
      >
        <span>Transparent</span>
        <span style={{ color: 'var(--text-tertiary)' }}>•</span>
        <span>Verifiable</span>
        <span style={{ color: 'var(--text-tertiary)' }}>•</span>
        <span>Autonomous</span>
      </motion.div>
    </div>
  );
};
