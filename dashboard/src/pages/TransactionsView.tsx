import React from 'react';
import { ExternalLink } from 'lucide-react';

export const TransactionsView: React.FC = () => {
  const transactions = [
    { type: 'ZK-Lite Commitment', hash: 'e3b0c44298fc1c149afb', contract: 'ReputationRegistry', block: '14,293,012', time: 'Just now' },
    { type: 'HMAC Receipt Chain', hash: '8d969eef6ecad3c29a3a', contract: 'DeliberationEngine', block: 'Off-chain (Verified)', time: '1 min ago' },
    { type: 'ExecuteVerdict', hash: 'a1b2c3d4e5f6g7h8i9j0', contract: 'VotingContract', block: '14,293,005', time: '5 mins ago' },
    { type: 'UpdateReputation', hash: 'c3d4e5f6g7h8i9j0a1b2', contract: 'ReputationRegistry', block: '14,293,005', time: '5 mins ago' },
    { type: 'InitiateDispute', hash: 'd4e5f6g7h8i9j0a1b2c3', contract: 'EscrowContract', block: '14,292,990', time: '12 mins ago' },
  ];

  return (
    <div className="container" style={{ padding: '3rem 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Cryptographic Audit Ledger</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Immutable ZK-Lite execution commitments and HMAC-chained receipts on Casper Testnet.</p>
        </div>
      </div>

      <div className="enterprise-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-tertiary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Action</th>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Transaction Hash</th>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Target Contract</th>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Block Height</th>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Timestamp</th>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Explorer</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--border-color)', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.85rem' }}>
                <td style={{ padding: '1.25rem 1.5rem', fontWeight: 600, fontFamily: 'var(--font-sans)', color: 'var(--text-primary)' }}>{tx.type}</td>
                <td style={{ padding: '1.25rem 1.5rem', color: 'var(--primary)' }}>{tx.hash}...</td>
                <td style={{ padding: '1.25rem 1.5rem', color: 'var(--text-secondary)' }}>{tx.contract}</td>
                <td style={{ padding: '1.25rem 1.5rem' }}>{tx.block}</td>
                <td style={{ padding: '1.25rem 1.5rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)' }}>{tx.time}</td>
                <td style={{ padding: '1.25rem 1.5rem' }}>
                  <button onClick={() => alert('Note: This is a simulated execution hash for the hackathon demo. In production, this will link directly to the Casper block explorer.')} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--primary)', fontSize: '0.85rem' }}>
                    View <ExternalLink size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
