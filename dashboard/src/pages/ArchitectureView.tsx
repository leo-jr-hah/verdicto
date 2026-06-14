import React from 'react';
import { Database, Activity, Scale, Server } from 'lucide-react';

export const ArchitectureView: React.FC = () => {
  return (
    <div className="container" style={{ padding: '3rem 0' }}>
      <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>System Architecture</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
          Visualizing the data flow between the User Interface, AI Agents, and the Casper Blockchain.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
        
        {/* Frontend */}
        <div className="enterprise-card" style={{ width: '400px', textAlign: 'center', border: '1px solid var(--primary)' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '0.5rem' }}>PRESENTATION LAYER</div>
          <h3 style={{ fontSize: '1.25rem' }}>Verdict Dashboard (React)</h3>
        </div>

        <div style={{ height: '40px', width: '2px', background: 'var(--border-color)' }}></div>

        {/* Orchestrator */}
        <div className="enterprise-card" style={{ width: '400px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '0.5rem' }}>COORDINATION LAYER</div>
          <Server style={{ margin: '0 auto 0.5rem', color: 'var(--text-tertiary)' }} size={24} />
          <h3 style={{ fontSize: '1.25rem' }}>Orchestrator Agent</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Node.js / WebSocket / MCP Client</p>
        </div>

        <div style={{ display: 'flex', gap: '10rem' }}>
          <div style={{ height: '40px', width: '2px', background: 'var(--border-color)', transform: 'rotate(-45deg)', transformOrigin: 'top' }}></div>
          <div style={{ height: '40px', width: '2px', background: 'var(--border-color)', transform: 'rotate(45deg)', transformOrigin: 'top' }}></div>
        </div>

        <div style={{ display: 'flex', gap: '2rem' }}>
          {/* Valuation Agents */}
          <div className="enterprise-card" style={{ width: '300px', textAlign: 'center', background: 'var(--bg-surface)' }}>
            <Activity style={{ margin: '0 auto 0.5rem', color: 'var(--text-tertiary)' }} size={24} />
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Valuation Swarm</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Deterministic Data APIs</p>
          </div>

          {/* Juror Agents */}
          <div className="enterprise-card" style={{ width: '300px', textAlign: 'center', background: 'var(--bg-surface)' }}>
            <Scale style={{ margin: '0 auto 0.5rem', color: 'var(--text-tertiary)' }} size={24} />
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Juror Swarm</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Groq LLM via MCP Server</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10rem' }}>
          <div style={{ height: '40px', width: '2px', background: 'var(--border-color)', transform: 'rotate(45deg)', transformOrigin: 'bottom' }}></div>
          <div style={{ height: '40px', width: '2px', background: 'var(--border-color)', transform: 'rotate(-45deg)', transformOrigin: 'bottom' }}></div>
        </div>

        {/* Blockchain */}
        <div className="enterprise-card" style={{ width: '400px', textAlign: 'center', border: '1px solid var(--text-primary)', background: 'var(--text-primary)', color: 'white' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '0.5rem' }}>SETTLEMENT LAYER</div>
          <Database style={{ margin: '0 auto 0.5rem', color: 'var(--text-tertiary)' }} size={24} />
          <h3 style={{ fontSize: '1.25rem' }}>Casper Testnet (Odra)</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', marginTop: '0.5rem' }}>Voting, Escrow & Reputation Contracts</p>
        </div>

      </div>
    </div>
  );
};
