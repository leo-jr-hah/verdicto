import { useState } from 'react';
import { Search, Shield, ExternalLink, XCircle, Hash, FileText, Copy, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { verifyById, type VerifyResult } from '../services/api';

export default function VerifyView() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  const handleVerify = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await verifyById(query.trim());
      if (!res.success) {
        setError(res.error || 'Verification failed');
      } else {
        setResult(res);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '2rem 1rem' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <Shield size={28} style={{ color: 'var(--accent-primary)' }} />
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>Verify</h1>
        </div>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.95rem' }}>
          Paste an assessment ID, receipt ID, or asset ID to verify its on-chain integrity, receipt chain, and explorer links.
        </p>

        {/* Search */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem' }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
            placeholder="Enter assessment ID, receipt ID, or asset ID..."
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              border: '1px solid var(--border-default)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              fontSize: '0.95rem',
              outline: 'none',
            }}
          />
          <button
            onClick={handleVerify}
            disabled={loading || !query.trim()}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              border: 'none',
              background: loading ? 'var(--bg-tertiary)' : 'var(--accent-primary)',
              color: loading ? 'var(--text-secondary)' : '#fff',
              fontWeight: 600,
              cursor: loading ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.95rem',
            }}
          >
            <Search size={16} />
            {loading ? 'Verifying...' : 'Verify'}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            padding: '1rem',
            borderRadius: '8px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: 'var(--red-600)',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}>
            <XCircle size={18} />
            {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            {/* Not found */}
            {!result.found && (
              <div style={{
                padding: '2rem',
                borderRadius: '12px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-default)',
                textAlign: 'center',
              }}>
                <XCircle size={48} style={{ color: 'var(--text-tertiary)', marginBottom: '1rem' }} />
                <h3 style={{ margin: '0 0 0.5rem', color: 'var(--text-primary)' }}>Not Found</h3>
                <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                  No assessment, verdict, or transaction found for "{result.id}"
                </p>
              </div>
            )}

            {/* Assessment */}
            {result.assessment && (
              <div style={{
                padding: '1.5rem',
                borderRadius: '12px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-default)',
                marginBottom: '1rem',
              }}>
                <h3 style={{ margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileText size={18} style={{ color: 'var(--accent-primary)' }} />
                  Assessment
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <Field label="Asset" value={result.assessment.assetName} />
                  <Field label="Type" value={result.assessment.assetType} />
                  <Field label="Assessed Value" value={`$${result.assessment.assessedValue?.toLocaleString()}`} />
                  <Field label="Status" value={result.assessment.status} />
                  <Field label="Receipts" value={`${result.assessment.receiptCount} in chain`} />
                  <Field
                    label="Chain Integrity"
                    value={
                      result.assessment.receiptChainValid === true ? 'Valid' :
                      result.assessment.receiptChainValid === false ? 'Invalid' : 'N/A'
                    }
                    color={
                      result.assessment.receiptChainValid === true ? 'var(--green-600)' :
                      result.assessment.receiptChainValid === false ? 'var(--red-600)' : 'var(--text-tertiary)'
                    }
                  />
                </div>
              </div>
            )}

            {/* Verdict */}
            {result.verdict && (
              <div style={{
                padding: '1.5rem',
                borderRadius: '12px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-default)',
                marginBottom: '1rem',
              }}>
                <h3 style={{ margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Shield size={18} style={{ color: 'var(--accent-primary)' }} />
                  Verdict
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <Field label="Asset ID" value={result.verdict.assetId} />
                  <Field label="Value" value={`$${result.verdict.value?.toLocaleString()}`} />
                  <Field label="Confidence" value={`${result.verdict.confidence}%`} />
                  <Field label="Jurors" value={String(result.verdict.jurorCount)} />
                  <Field label="Decision" value={result.verdict.decision} />
                  <Field label="Receipt Hash" value={result.verdict.receiptHash?.slice(0, 16) + '...'} mono />
                </div>

                {/* Verdict Hash */}
                {result.verdict.verdictHash && (
                  <div style={{
                    marginTop: '1rem',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-default)',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>VERDICT HASH (for on-chain verification)</span>
                      <button
                        onClick={() => copyToClipboard(result.verdict!.verdictHash, 'hash')}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '0.25rem' }}
                      >
                        {copied === 'hash' ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    </div>
                    <code style={{ fontSize: '0.8rem', wordBreak: 'break-all', color: 'var(--accent-primary)' }}>
                      {result.verdict.verdictHash}
                    </code>
                  </div>
                )}
              </div>
            )}

            {/* On-chain Transactions */}
            {result.onChainTransactions.length > 0 && (
              <div style={{
                padding: '1.5rem',
                borderRadius: '12px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-default)',
                marginBottom: '1rem',
              }}>
                <h3 style={{ margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Hash size={18} style={{ color: 'var(--accent-primary)' }} />
                  On-Chain Transactions
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {result.onChainTransactions.map((tx, i) => (
                    <a
                      key={i}
                      href={tx.explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border-default)',
                        textDecoration: 'none',
                        color: 'var(--text-primary)',
                      }}
                    >
                      <div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{tx.type}</span>
                        <div style={{ fontSize: '0.85rem', fontFamily: 'monospace', marginTop: '0.25rem' }}>
                          {tx.hash.slice(0, 20)}...{tx.hash.slice(-8)}
                        </div>
                      </div>
                      <ExternalLink size={16} style={{ color: 'var(--text-secondary)' }} />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Verification Instructions */}
            {result.verdict?.verdictHash && (
              <div style={{
                padding: '1rem 1.5rem',
                borderRadius: '8px',
                background: 'rgba(99, 102, 241, 0.08)',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                fontSize: '0.85rem',
                color: 'var(--text-secondary)',
              }}>
                <strong style={{ color: 'var(--text-primary)' }}>How to verify on-chain:</strong>{' '}
                Copy the verdict hash above, then look up the asset ID on{' '}
                <a href="https://testnet.cspr.live" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-primary)' }}>
                  cspr.live
                </a>{' '}
                to compare the stored hash with the recomputed one.
              </div>
            )}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

function Field({ label, value, color, mono }: { label: string; value: string; color?: string; mono?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </div>
      <div style={{
        fontSize: '0.9rem',
        color: color || 'var(--text-primary)',
        fontFamily: mono ? 'monospace' : 'inherit',
        wordBreak: 'break-all',
      }}>
        {value}
      </div>
    </div>
  );
}
