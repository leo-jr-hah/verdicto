import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Gavel, RefreshCw, Swords, Scale, AlertTriangle, Shield, ChevronDown, ChevronUp, Activity, ArrowLeft, Loader2, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { fetchOracleVerdicts, fetchDisputes, fileDispute, triggerRetrial, type OracleVerdict, type Dispute } from '../services/api';
import { useWallet } from '../contexts/CSPRClickContext';
import { DISPUTE_FEE_CSPR } from '../config/casper';
import PaymentModal from '../components/PaymentModal';
import { usePaymentFlow } from '../hooks/usePaymentFlow';

function formatTime(ts: number): string {
  const date = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  if (diffSec < 10) return 'Just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export const DisputesView: React.FC = () => {
  const wallet = useWallet();
  const [verdicts, setVerdicts] = useState<OracleVerdict[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [expandedDispute, setExpandedDispute] = useState<string | null>(null);
  const [filter, setFilter] = useState<'active' | 'pending' | 'under_retrial' | 'resolved'>('active');

  // ── Dispute filing state ──────────────────────────────────────────────
  // Step 1: reason form modal
  const [showReasonModal, setShowReasonModal] = useState<string | null>(null); // assetId or null
  const [disputeReason, setDisputeReason] = useState('');
  const [reasonError, setReasonError] = useState<string | null>(null);

  // Step 2: payment flow (shared hook)
  const pendingRequestRef = useRef<{ assetId: string; reason: string } | null>(null);
  const [lastTxHashByAsset, setLastTxHashByAsset] = useState<Record<string, string>>({});

  const payment = usePaymentFlow(wallet.signPayment, DISPUTE_FEE_CSPR, async (paymentProof, deployHash) => {
    const request = pendingRequestRef.current;
    if (!request) return;
    pendingRequestRef.current = null;

    const result = await fileDispute(request.assetId, wallet.publicKey!, request.reason, paymentProof);

    if (result.status === 'success') {
      setDisputeReason('');
      setLastTxHashByAsset(prev => ({ ...prev, [request.assetId]: deployHash || '' }));
      // Auto-trigger re-trial immediately after dispute is filed
      try {
        await triggerRetrial(result.dispute.id);
      } catch {
        // Retrial may fail silently, dispute is still filed
      }
      await loadData();
    } else {
      const err = new Error('error' in result ? result.error : 'Dispute filing failed');
      (err as any).hint = 'hint' in result ? result.hint : undefined;
      throw err;
    }
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [oracleData, disputesData] = await Promise.all([
        fetchOracleVerdicts(),
        fetchDisputes(),
      ]);
      setVerdicts(oracleData.verdicts || []);
      setDisputes(disputesData || []);
      setLastUpdate(new Date());
    } catch {
      // silent, data may be unavailable
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15_000);
    return () => clearInterval(interval);
  }, [loadData]);

  // ── Step 1: User fills reason, clicks "Continue to Payment" ───────────
  const handleReasonSubmit = useCallback(() => {
    if (!showReasonModal || !disputeReason.trim()) return;

    if (!wallet.connected || !wallet.publicKey) {
      setReasonError('Please connect your wallet first.');
      return;
    }

    // Store the request and open the payment modal
    pendingRequestRef.current = { assetId: showReasonModal, reason: disputeReason.trim() };
    setReasonError(null);
    setShowReasonModal(null); // close reason modal
    payment.openModal(); // open payment modal
  }, [showReasonModal, disputeReason, wallet.connected, wallet.publicKey, payment]);

  // ── Cancel reason form ────────────────────────────────────────────────
  const handleReasonCancel = useCallback(() => {
    setShowReasonModal(null);
    setDisputeReason('');
    setReasonError(null);
  }, []);

  const filteredDisputes = filter === 'active'
    ? disputes.filter(d => d.status !== 'resolved')
    : disputes.filter(d => d.status === filter);

  // Build a set of assetIds that already have active (non-resolved) disputes
  const activeDisputedAssets = new Set(
    disputes.filter(d => d.status !== 'resolved').map(d => d.assetId)
  );

  const stats = {
    total: disputes.length,
    pending: disputes.filter(d => d.status === 'pending').length,
    underRetrial: disputes.filter(d => d.status === 'under_retrial').length,
    resolved: disputes.filter(d => d.status === 'resolved').length,
    overturned: disputes.filter(d => d.outcome === 'overturned').length,
    upheld: disputes.filter(d => d.outcome === 'upheld').length,
  };

  return (
    <>
      {/* ── Page Header ───────────────────────────────────────────── */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
              <Gavel size={28} style={{ color: 'var(--error)' }} />
              <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Disputes & Re-trials
              </h1>
            </div>
            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.95rem' }}>
              Challenge any verdict with a {DISPUTE_FEE_CSPR} CSPR stake. Adversarial AI panel re-evaluates independently.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {lastUpdate && (
              <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                Updated {formatTime(lastUpdate.getTime())}
              </span>
            )}
            <button
              onClick={loadData}
              disabled={loading}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 16px', borderRadius: '8px',
                border: '1px solid var(--border-color)', background: 'var(--bg-primary)',
                color: 'var(--text-primary)', cursor: loading ? 'wait' : 'pointer',
                fontSize: '0.85rem', fontWeight: 500,
              }}
            >
              <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* ── Stats Cards ───────────────────────────────────────────── */}
      <div className="disputes-stats-grid">
        {[
          { label: 'Total Disputes', value: stats.total, icon: Gavel, color: 'var(--text-primary)' },
          { label: 'Pending', value: stats.pending, icon: AlertTriangle, color: 'var(--text-tertiary)' },
          { label: 'Under Re-trial', value: stats.underRetrial, icon: Swords, color: 'var(--red-600)' },
          { label: 'Resolved', value: stats.resolved, icon: Scale, color: 'var(--text-secondary)' },
          { label: 'Overturned', value: stats.overturned, icon: Shield, color: 'var(--error)' },
          { label: 'Upheld', value: stats.upheld, icon: Activity, color: 'var(--text-secondary)' },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                padding: '20px', borderRadius: '12px',
                background: 'var(--bg-primary)', border: '1px solid var(--border-color)',
                display: 'flex', alignItems: 'center', gap: '14px',
              }}
            >
              <div style={{
                width: '44px', height: '44px', borderRadius: '10px',
                background: `${stat.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={20} style={{ color: stat.color }} />
              </div>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{stat.label}</div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── How Disputes Work ─────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{
          padding: '24px', borderRadius: '12px',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-color)',
          marginBottom: '32px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '12px',
            background: 'var(--error-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Swords size={24} style={{ color: 'var(--error)' }} />
          </div>
          <div>
            <h3 style={{ margin: '0 0 8px', fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              How Disputes Work
            </h3>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              <strong>1. Challenge:</strong> Stake {DISPUTE_FEE_CSPR} CSPR and explain why the verdict is wrong.
              <br />
              <strong>2. Adversarial Re-trial:</strong> Three fresh AI agents (Market Analyst, Value Auditor, Devil's Advocate) independently re-evaluate.
              <br />
              <strong>3. Resolution:</strong> If 2+ agents vote to overturn, the verdict is corrected. If upheld, the original becomes stronger.
              <br />
              <br />
              <Link to="/oracle" style={{ color: 'var(--red-600)', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}>
                <ArrowLeft size={14} /> View all verdicts
              </Link>
            </p>
          </div>
        </div>
      </motion.div>

      {/* ── Verdicts Available for Dispute ────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        style={{
          borderRadius: '12px', border: '1px solid var(--border-color)',
          background: 'var(--bg-primary)', overflow: 'hidden', marginBottom: '32px',
        }}
      >
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid var(--border-color)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Scale size={16} style={{ color: 'var(--red-600)' }} />
            <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
              Verdicts Available for Challenge
            </span>
            <span style={{
              fontSize: '0.75rem', padding: '2px 8px', borderRadius: '10px',
              background: 'var(--bg-elevated)', color: 'var(--red-600)', fontWeight: 600,
            }}>
              {verdicts.length}
            </span>
          </div>
        </div>

        {verdicts.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Scale size={40} style={{ color: 'var(--text-tertiary)', marginBottom: '12px', opacity: 0.5 }} />
            <p style={{ margin: '0 0 4px', fontWeight: 500 }}>No verdicts yet</p>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>
              Run an assessment, loan, insurance, or confidence analysis first to generate verdicts.
            </p>
          </div>
        ) : (
          <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
            {verdicts.map((v) => (
              <div
                key={v.assetId}
                style={{
                  padding: '14px 20px', borderBottom: '1px solid var(--border-color)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {v.assetId.length > 28 ? v.assetId.slice(0, 28) + '...' : v.assetId}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                    ${v.value.toLocaleString()} · {Math.round(v.confidence * 100)}% confidence · {formatTime(v.timestamp)}
                  </div>
                </div>
                {activeDisputedAssets.has(v.assetId) ? (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '8px 16px', borderRadius: '8px',
                    border: '1px solid var(--warning-border)', background: 'var(--warning-bg)',
                    color: 'var(--text-tertiary)', fontSize: '0.82rem', fontWeight: 600,
                  }}>
                    <AlertTriangle size={14} />
                    Dispute Active
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      if (!wallet.connected) {
                        wallet.connect();
                      }
                      setShowReasonModal(v.assetId);
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      padding: '8px 16px', borderRadius: '8px',
                      border: '1px solid var(--error-border)', background: 'var(--error-bg)',
                      color: 'var(--error)', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
                    }}
                  >
                    <Swords size={14} />
                    Challenge
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* ── Disputes List ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        style={{
          borderRadius: '12px', border: '1px solid var(--border-color)',
          background: 'var(--bg-primary)', overflow: 'hidden',
        }}
      >
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid var(--border-color)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Gavel size={16} style={{ color: 'var(--error)' }} />
            <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
              Active Disputes
            </span>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {(['active', 'pending', 'under_retrial', 'resolved'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: '4px 12px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 500,
                  border: '1px solid', cursor: 'pointer',
                  ...(filter === f
                    ? { background: 'var(--bg-elevated)', borderColor: 'var(--border-color)', color: 'var(--red-600)' }
                    : { background: 'transparent', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }),
                }}
              >
                {f === 'active' ? `Active (${disputes.filter(d => d.status !== 'resolved').length})` : f === 'under_retrial' ? 'Re-trial' : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {filteredDisputes.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Gavel size={40} style={{ color: 'var(--text-tertiary)', marginBottom: '12px', opacity: 0.5 }} />
            <p style={{ margin: '0 0 4px', fontWeight: 500 }}>No disputes found</p>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>
              {filter === 'active' ? 'No active disputes. Challenge a verdict above to get started.' : `No ${filter.replace('_', ' ')} disputes.`}
            </p>
          </div>
        ) : (
          <div>
            {filteredDisputes.map((d) => (
              <div key={d.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <div
                  style={{
                    padding: '14px 20px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
                  }}
                  onClick={() => setExpandedDispute(expandedDispute === d.id ? null : d.id)}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{
                        fontSize: '0.7rem', padding: '2px 8px', borderRadius: '10px', fontWeight: 600,
                        ...(d.status === 'pending'
                          ? { background: 'rgba(245,158,11,0.12)', color: 'var(--text-tertiary)' }
                          : d.status === 'under_retrial'
                          ? { background: 'var(--bg-elevated)', color: 'var(--red-600)' }
                          : { background: 'rgba(16,185,129,0.12)', color: 'var(--text-secondary)' }),
                      }}>
                        {d.status === 'under_retrial' ? 'Re-trial' : d.status.charAt(0).toUpperCase() + d.status.slice(1)}
                      </span>
                      {d.outcome && (
                        <span style={{
                          fontSize: '0.7rem', padding: '2px 8px', borderRadius: '10px', fontWeight: 600,
                          ...(d.outcome === 'overturned'
                            ? { background: 'rgba(239,68,68,0.12)', color: 'var(--error)' }
                            : { background: 'rgba(16,185,129,0.12)', color: 'var(--text-secondary)' }),
                        }}>
                          {d.outcome === 'overturned' ? 'Overturned' : 'Upheld'}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {d.assetId.length > 32 ? d.assetId.slice(0, 32) + '...' : d.assetId}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                      Stake: {d.stakeCSPR} CSPR · {formatTime(d.createdAt)}
                    </div>
                    {d.outcome && (
                      <div style={{
                        fontSize: '0.75rem', marginTop: '4px', lineHeight: 1.4,
                        color: d.outcome === 'overturned' ? 'var(--red-600)' : 'var(--text-secondary)',
                      }}>
                        {d.outcome === 'overturned'
                          ? 'Re-trial found the original verdict incorrect. Decision has been reversed.'
                          : 'Re-trial confirmed the original verdict. Challenge was unsuccessful.'}
                      </div>
                    )}
                  </div>
                  {expandedDispute === d.id ? <ChevronUp size={16} style={{ color: 'var(--text-tertiary)' }} /> : <ChevronDown size={16} style={{ color: 'var(--text-tertiary)' }} />}
                </div>

                <AnimatePresence>
                  {expandedDispute === d.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div style={{ padding: '0 20px 16px', borderTop: '1px solid var(--border-color)' }}>
                        <div style={{ paddingTop: '12px' }}>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Challenger
                          </div>
                          <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                            {d.challengerKey}
                          </div>
                        </div>
                        <div style={{ marginTop: '12px' }}>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Reason
                          </div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                            {d.reason}
                          </div>
                        </div>
                        {d.retrial && (
                          <div style={{ marginTop: '16px' }}>
                            {/* ── Re-trial Header ──────────────────────────── */}
                            <div style={{
                              padding: '14px 16px', borderRadius: '10px',
                              background: d.outcome === 'overturned'
                                ? 'var(--error-bg)' : 'var(--success-bg)',
                              border: `1px solid ${d.outcome === 'overturned' ? 'var(--error-border)' : 'var(--success-border)'}`,
                              marginBottom: '12px',
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                  Re-trial Outcome
                                </div>
                                <span style={{
                                  fontSize: '0.7rem', padding: '3px 10px', borderRadius: '10px', fontWeight: 700,
                                  ...(d.outcome === 'overturned'
                                    ? { background: 'rgba(239,68,68,0.15)', color: 'var(--error)' }
                                    : { background: 'rgba(16,185,129,0.15)', color: 'var(--text-secondary)' }),
                                }}>
                                  {d.outcome === 'overturned' ? '⚡ Overturned' : '✅ Upheld'}
                                </span>
                              </div>

                              {/* Value comparison */}
                              <div className="disputes-retrial-grid" style={{ marginBottom: '10px' }}>
                                <div style={{ textAlign: 'center' }}>
                                  <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', marginBottom: '2px' }}>Original</div>
                                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                    ${d.retrial.originalVerdict.value.toLocaleString()}
                                  </div>
                                  <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
                                    {d.retrial.originalVerdict.confidence}% conf
                                  </div>
                                </div>
                                <div style={{ fontSize: '1.2rem', color: 'var(--text-tertiary)' }}>→</div>
                                <div style={{ textAlign: 'center' }}>
                                  <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', marginBottom: '2px' }}>New Verdict</div>
                                  <div style={{
                                    fontSize: '1.1rem', fontWeight: 700,
                                    color: d.outcome === 'overturned' ? 'var(--red-600)' : 'var(--text-secondary)',
                                  }}>
                                    ${d.retrial.newVerdict.value.toLocaleString()}
                                  </div>
                                  <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
                                    {d.retrial.newVerdict.confidence}% conf
                                  </div>
                                </div>
                              </div>

                              {/* Deltas */}
                              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                                <span style={{
                                  fontSize: '0.75rem', padding: '2px 8px', borderRadius: '6px',
                                  background: d.retrial.valueDelta < 0 ? 'var(--error-bg)' : 'var(--success-bg)',
                                  color: d.retrial.valueDelta < 0 ? 'var(--red-600)' : 'var(--text-secondary)', fontWeight: 600,
                                }}>
                                  Value: {d.retrial.valueDelta > 0 ? '+' : ''}{d.retrial.valueDelta.toFixed(1)}%
                                </span>
                                <span style={{
                                  fontSize: '0.75rem', padding: '2px 8px', borderRadius: '6px',
                                  background: d.retrial.confidenceDelta < 0 ? 'var(--error-bg)' : 'var(--success-bg)',
                                  color: d.retrial.confidenceDelta < 0 ? 'var(--red-600)' : 'var(--text-secondary)', fontWeight: 600,
                                }}>
                                  Confidence: {d.retrial.confidenceDelta > 0 ? '+' : ''}{d.retrial.confidenceDelta}
                                </span>
                              </div>
                            </div>

                            {/* ── Panel Votes ──────────────────────────────── */}
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              Panel Votes
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
                              {d.retrial.panel.map((juror, i) => (
                                <div key={i} style={{
                                  padding: '10px 12px', borderRadius: '8px',
                                  background: 'var(--bg-primary)', border: '1px solid var(--border-color)',
                                  display: 'flex', alignItems: 'flex-start', gap: '10px',
                                }}>
                                  <div style={{
                                    width: '28px', height: '28px', borderRadius: '6px', flexShrink: 0,
                                    background: juror.vote === 'A' ? 'var(--success-bg)' : juror.vote === 'B' ? 'var(--error-bg)' : 'var(--warning-bg)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '0.7rem', fontWeight: 700,
                                    color: juror.vote === 'A' ? 'var(--text-secondary)' : juror.vote === 'B' ? 'var(--red-600)' : 'var(--text-tertiary)',
                                  }}>
                                    {juror.vote}
                                  </div>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                        {juror.name}
                                      </span>
                                      <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>
                                        {juror.confidence}% · Rep {juror.reputation}
                                      </span>
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                                      {juror.reasoning}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* ── Reasoning Summary ────────────────────────── */}
                            {d.retrial.reasoning && (
                              <div style={{
                                padding: '12px 14px', borderRadius: '8px',
                                background: 'var(--bg-elevated)', border: '1px solid var(--border-color)',
                              }}>
                                <div style={{ fontSize: '0.7rem', color: 'var(--red-600)', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                  Panel Summary
                                </div>
                                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                  {d.retrial.reasoning}
                                </div>
                              </div>
                            )}

                            {/* ── On-chain Payment Tx Link ──────────────────── */}
                            {(d.paymentTxHash || lastTxHashByAsset[d.assetId]) && (() => {
                              const txHash = d.paymentTxHash || lastTxHashByAsset[d.assetId];
                              return txHash ? (
                              <a
                                href={`https://testnet.cspr.live/deploy/${txHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                                  marginTop: '12px', padding: '8px 14px', borderRadius: '8px',
                                  background: 'var(--bg-elevated)', border: '1px solid var(--border-color)',
                                  color: 'var(--red-600)', fontSize: '0.78rem', fontWeight: 500,
                                  textDecoration: 'none',
                                }}
                              >
                                <ExternalLink size={13} />
                                View 5 CSPR payment on Explorer ↗
                              </a>
                              ) : null;
                            })()}
                          </div>
                        )}
                        {d.status === 'pending' && (
                          <div style={{
                            marginTop: '12px', padding: '10px 14px', borderRadius: '8px',
                            background: 'var(--warning-bg)', border: '1px solid var(--warning-border)',
                            display: 'flex', alignItems: 'center', gap: '8px',
                          }}>
                            <Loader2 size={14} style={{ color: 'var(--text-tertiary)', animation: 'spin 1s linear infinite' }} />
                            <span style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', fontWeight: 500 }}>
                              Re-trial pending. Will start automatically
                            </span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* ── Step 1: Reason Form Modal (matches PaymentModal design) ─── */}
      <AnimatePresence>
        {showReasonModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 1000,
              background: 'var(--overlay-bg)',
              backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            onClick={handleReasonCancel}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: '16px',
                padding: '2rem',
                maxWidth: '480px',
                width: '90%',
                boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
              }}
            >
              {/* Header */}
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%',
                  background: 'var(--error-bg)',
                  border: '2px solid var(--error-border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 1rem',
                }}>
                  <Swords size={24} color="var(--error)" />
                </div>
                <h3 style={{
                  fontSize: '1.2rem', fontWeight: 700,
                  color: 'var(--text-primary)', marginBottom: '0.5rem',
                }}>
                  Challenge Verdict
                </h3>
                <p style={{
                  fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0,
                }}>
                  Stake {DISPUTE_FEE_CSPR} CSPR and explain why this verdict is wrong.
                </p>
              </div>

              {/* Wallet status */}
              <div style={{
                padding: '10px 14px', borderRadius: '8px', marginBottom: '16px',
                background: wallet.connected ? 'var(--success-bg)' : 'var(--error-bg)',
                border: `1px solid ${wallet.connected ? 'var(--success-border)' : 'var(--error-border)'}`,
                display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                <span style={{ fontSize: '0.8rem', color: wallet.connected ? 'var(--text-secondary)' : 'var(--red-600)', fontWeight: 500 }}>
                  {wallet.connected
                    ? `Wallet connected: ${wallet.publicKey?.slice(0, 8)}...${wallet.publicKey?.slice(-6)}`
                    : 'Wallet not connected. Please connect first.'}
                </span>
              </div>

              {/* Target asset */}
              <div style={{
                background: 'var(--bg-surface-alt)',
                borderRadius: '10px', padding: '1rem 1.25rem', marginBottom: '16px',
              }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Target Asset
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                  {showReasonModal}
                </div>
              </div>

              {/* Reason textarea */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Why is this verdict wrong?
                </div>
                <textarea
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  placeholder="e.g. Comparable sales data is 18 days stale. Market moved 15% since last data pull..."
                  rows={4}
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: '8px',
                    border: '1px solid var(--border-color)', background: 'var(--bg-primary)',
                    color: 'var(--text-primary)', fontSize: '0.9rem', lineHeight: 1.5,
                    resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Stake info */}
              <div style={{
                padding: '12px', borderRadius: '8px',
                background: 'var(--warning-bg)', border: '1px solid var(--warning-border)',
                marginBottom: '16px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <AlertTriangle size={14} style={{ color: 'var(--text-tertiary)' }} />
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-tertiary)' }}>Stake Required: {DISPUTE_FEE_CSPR} CSPR</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  If the re-trial overturns the verdict, you get your stake back. If upheld, the stake goes to the original jurors.
                </p>
              </div>

              {/* Error */}
              {reasonError && (
                <div style={{
                  background: 'var(--error-bg)',
                  border: '1px solid var(--error-border)',
                  borderRadius: '8px', padding: '0.75rem', marginBottom: '1rem',
                  fontSize: '0.8rem', color: 'var(--error)',
                }}>
                  {reasonError}
                </div>
              )}

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={handleReasonCancel}
                  style={{
                    flex: 1, padding: '0.75rem', borderRadius: '8px',
                    border: '1px solid var(--border-color)', background: 'transparent',
                    color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleReasonSubmit}
                  disabled={!disputeReason.trim() || !wallet.connected}
                  style={{
                    flex: 2, padding: '0.75rem', borderRadius: '8px', border: 'none',
                    background: (!disputeReason.trim() || !wallet.connected) ? 'var(--bg-surface-alt)' : 'var(--error)',
                    color: 'var(--text-inverse)', cursor: (!disputeReason.trim() || !wallet.connected) ? 'not-allowed' : 'pointer',
                    fontSize: '0.9rem', fontWeight: 600,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    opacity: (!disputeReason.trim() || !wallet.connected) ? 0.5 : 1,
                  }}
                >
                  <Swords size={16} />
                  Continue to Payment
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Step 2: Payment Confirmation Modal (shared component) ── */}
      <PaymentModal
        open={payment.showModal}
        title="Confirm Dispute Filing"
        description={`Stake ${DISPUTE_FEE_CSPR} CSPR to challenge this verdict. An independent AI panel will re-evaluate the case.`}
        feeLabel="Dispute Stake"
        feeAmount={DISPUTE_FEE_CSPR}
        features={[
          'Independent adversarial re-trial by 3 AI agents',
          'Market Analyst, Value Auditor, and Devil\'s Advocate',
          'Stake returned if you win the challenge',
        ]}
        signing={payment.signing}
        signError={payment.signError}
        signErrorHint={payment.signErrorHint}
        onConfirm={payment.confirm}
        onCancel={payment.cancel}
      />
    </>
  );
};
