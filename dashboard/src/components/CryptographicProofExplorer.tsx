import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Hash, Link, ChevronDown, ChevronRight, Copy, Check } from 'lucide-react';

interface ReceiptNode {
  id: string;
  hash: string;
  timestamp: number;
  type: string;
  action: string;
  previousHash: string | null;
  metadata: Record<string, any>;
  children: ReceiptNode[];
}

interface ProofExplorerProps {
  receipts: ReceiptNode[];
  onVerify?: (hash: string) => void;
}

const ReceiptCard: React.FC<{ 
  receipt: ReceiptNode; 
  depth: number; 
  isExpanded: boolean;
  onToggle: () => void;
}> = ({ receipt, depth, isExpanded, onToggle }) => {
  const [copied, setCopied] = useState(false);

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'ZK-Lite Commitment': return '#8B5CF6';
      case 'HMAC Receipt Chain': return '#3B82F6';
      case 'Native Transfer': return '#10B981';
      case 'x402 Payment': return '#F59E0B';
      case 'ExecuteVerdict': return '#EF4444';
      default: return 'var(--text-secondary)';
    }
  };

  return (
    <div style={{ marginLeft: depth > 0 ? '1.5rem' : '0' }}>
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        style={{
          background: 'var(--bg-surface)',
          border: `1px solid ${getTypeColor(receipt.type)}33`,
          borderRadius: '6px',
          padding: '0.75rem',
          marginBottom: '0.5rem',
          cursor: 'pointer',
          position: 'relative'
        }}
        onClick={onToggle}
      >
        {/* Connection Line */}
        {depth > 0 && (
          <div style={{
            position: 'absolute',
            left: '-1rem',
            top: '50%',
            width: '1rem',
            height: '2px',
            background: 'var(--border-color)'
          }} />
        )}

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          {receipt.children.length > 0 && (
            <div style={{ color: 'var(--text-tertiary)' }}>
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </div>
          )}
          <div style={{ 
            width: '6px', 
            height: '6px', 
            borderRadius: '50%', 
            background: getTypeColor(receipt.type) 
          }} />
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            {receipt.type}
          </span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginLeft: 'auto' }}>
            {new Date(receipt.timestamp).toLocaleTimeString()}
          </span>
        </div>

        {/* Hash Display */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem',
          background: 'var(--bg-main)',
          borderRadius: '4px',
          padding: '0.4rem 0.5rem',
          marginBottom: '0.5rem'
        }}>
          <Hash size={12} color="var(--text-tertiary)" />
          <code style={{ 
            fontSize: '0.7rem', 
            color: 'var(--text-secondary)',
            fontFamily: 'monospace',
            flexGrow: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {receipt.hash}
          </code>
          <button 
            onClick={(e) => { e.stopPropagation(); copyHash(receipt.hash); }}
            style={{ 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer',
              color: copied ? '#10B981' : 'var(--text-tertiary)',
              padding: '0.25rem'
            }}
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
          </button>
        </div>

        {/* Previous Hash Link */}
        {receipt.previousHash && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            fontSize: '0.7rem',
            color: 'var(--text-tertiary)',
            marginBottom: '0.5rem'
          }}>
            <Link size={10} />
            <span>Links to: {receipt.previousHash.substring(0, 12)}...</span>
          </div>
        )}

        {/* Action */}
        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          {receipt.action}
        </div>

        {/* Metadata Preview */}
        {Object.keys(receipt.metadata).length > 0 && (
          <div style={{ 
            marginTop: '0.5rem',
            padding: '0.4rem',
            background: 'var(--bg-surface-alt)',
            borderRadius: '4px',
            fontSize: '0.7rem',
            color: 'var(--text-tertiary)'
          }}>
    {Object.entries(receipt.metadata).slice(0, 2).map(([key, value]) => (
              <div key={key}>
                <span style={{ color: 'var(--text-secondary)' }}>{key}:</span> {String(value).substring(0, 30)}
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Children */}
      <AnimatePresence>
        {isExpanded && receipt.children.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            {receipt.children.map((child) => (
              <ReceiptCard
                key={child.id}
                receipt={child}
                depth={depth + 1}
                isExpanded={false}
                onToggle={() => {}}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const CryptographicProofExplorer: React.FC<ProofExplorerProps> = ({ receipts, onVerify }) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const toggleNode = (id: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const verifyChain = () => {
    if (onVerify) {
      receipts.forEach(receipt => onVerify(receipt.hash));
    }
  };

  return (
    <div style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Shield size={20} color="var(--text-secondary)" />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Cryptographic Proof Chain
          </h3>
        </div>
        <button 
          onClick={verifyChain}
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: '4px',
            padding: '0.4rem 0.75rem',
            fontSize: '0.75rem',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}
        >
          <Shield size={12} />
          Verify Chain
        </button>
      </div>

      <div style={{ 
        background: 'var(--bg-surface)',
        borderRadius: '8px',
        padding: '1rem',
        border: '1px solid var(--border-color)'
      }}>
        {receipts.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '2rem',
            color: 'var(--text-tertiary)',
            fontSize: '0.9rem'
          }}>
            No cryptographic proofs generated yet. Start a dispute to see the chain.
          </div>
        ) : (
          <div>
            {/* Chain Visualization */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              marginBottom: '1rem',
              padding: '0.5rem',
              background: 'var(--bg-main)',
              borderRadius: '4px'
            }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                Chain Length: {receipts.length} • 
                Latest: {receipts[receipts.length - 1]?.hash.substring(0, 12)}...
              </div>
            </div>

            {/* Receipt Tree */}
            {receipts.map((receipt) => (
              <ReceiptCard
                key={receipt.id}
                receipt={receipt}
                depth={0}
                isExpanded={expandedNodes.has(receipt.id)}
                onToggle={() => toggleNode(receipt.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

