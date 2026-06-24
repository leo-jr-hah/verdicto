import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Gavel, RefreshCw, Swords, Scale, AlertTriangle, Shield, ChevronDown, ChevronUp, Activity, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { fetchOracleVerdicts, fetchDisputes, fileDispute, triggerRetrial, type OracleVerdict, type Dispute } from '../services/api';
import { useWallet } from '../contexts/CSPRClickContext';
import { PLATFORM_WALLET, DISPUTE_FEE_CSPR } from '../config/casper';
import PaymentModal from '../components/PaymentModal';

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
  const [filter, setFilter] = useState<'all' | 'pending' | 'under_retrial' | 'resolved'>('all');
  const [retrialLoading, setRetrialLoading] = useState<string | null>(null);

  // ── Dispute filing state ──────────────────────────────────────────────
  // Step 1: reason form modal
  const [showReasonModal, setShowReasonModal] = useState<string | null>(null); // assetId or null
  const [disputeReason, setDisputeReason] = useState('');
  const [reasonError, setReasonError] = useState<string | null>(null);

  // Step 2: payment modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [signingPayment, setSigningPayment] = useState(false);
  const [signError, setSignError] = useState<string | null>(null);

  // Pending request (stored between step 1 → step 2)
  const pendingRequestRef = useRef<{ assetId: string; reason: string } | null>(null);

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
      // silent — data may be unavailable
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
    setSignError(null);
    setShowPaymentModal(true); // open payment modal
  }, [showReasonModal, disputeReason, wallet.connected, wallet.publicKey]);

  // ── Step 2: User confirms payment in PaymentModal ─────────────────────
  const handlePaymentConfirm = useCallback(async () => {
    const request = pendingRequestRef.current;
    if (!request) return;

    // If wallet not connected, try to connect first
    if (!wallet.connected) {
      try {
        await wallet.connect();
      } catch {
        setSignError('Please connect your wallet first.');
        return;
      }
      if (!wallet.connected) {
        setSignError('Wallet connection is required to proceed.');
        return;
      }
    }

    setSigningPayment(true);
    setSignError(null);

    try {
      // Sign the payment via wallet — this opens the wallet popup
      const { paymentProof } = await wallet.signPayment(
        PLATFORM_WALLET,
        DISPUTE_FEE_CSPR,
      );

      // Payment signed — close modal and submit the dispute
      setShowPaymentModal(false);
      pendingRequestRef.current = null;

      // Submit the dispute with the payment proof
      const result = await fileDispute(request.assetId, wallet.publicKey!, request.reason, paymentProof);

      if (result.status === 'success') {
        setDisputeReason('');
        await loadData();
      } else if (result.status === 'payment_required') {
        setSignError('Payment was not accepted by the server. Please try again.');
        setShowPaymentModal(true);
      } else if (result.status === 'error') {
        setSignError(result.error);
        setShowPaymentModal(true);
      }
    } catch (err: any) {
      const msg = err?.message || 'Failed to sign payment.';
      if (msg.includes('cancelled') || msg.includes('reject')) {
        setSignError('Payment was cancelled. Please approve the transfer in your wallet.');
      } else {
        setSignError(msg);
      }
      // Re-open modal so user can retry
      setShowPaymentModal(true);
    } finally {
      setSigningPayment(false);
    }
  }, [wallet, loadData]);

  // ── Cancel payment ────────────────────────────────────────────────────
  const handlePaymentCancel = useCallback(() => {
    setShowPaymentModal(false);
    setSigningPayment(false);
    setSignError(null);
    pendingRequestRef.current = null;
  }, []);

  // ── Cancel reason form ────────────────────────────────────────────────
  const handleReasonCancel = useCallback(() => {
    setShowReasonModal(null);
    setDisputeReason('');
    setReasonError(null);
  }, []);

  const handleTriggerRetrial = async (disputeId: string) => {
    setRetrialLoading(disputeId);
    try {
      await triggerRetrial(disputeId);
      await loadData();
    } finally {
      setRetrialLoading(null);
    }
  };

  const filteredDisputes = filter === 'all' ? disputes : disputes.filter(d => d.status === filter);

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
              <Gavel size={28} style={{ color: '#EF4444' }} />
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {[
          { label: 'Total Disputes', value: stats.total, icon: Gavel, color: '#8B5CF6' },
          { label: 'Pending', value: stats.pending, icon: AlertTriangle, color: '#F59E0B' },
          { label: 'Under Re-trial', value: stats.underRetrial, icon: Swords, color: '#8B5CF6' },
          { label: 'Resolved', value: stats.resolved, icon: Scale, color: '#06B6D4' },
          { label: 'Overturned', value: stats.overturned, icon: Shield, color: '#EF4444' },
          { label: 'Upheld', value: stats.upheld, icon: Activity, color: '#10B981' },
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
          background: 'linear-gradient(135deg, rgba(239,68,68,0.06) 0%, rgba(139,92,246,0.06) 100%)',
          border: '1px solid rgba(239,68,68,0.15)',
          marginBottom: '32px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '12px',
            background: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Swords size={24} style={{ color: '#EF4444' }} />
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
              <Link to="/oracle" style={{ color: '#8B5CF6', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}>
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
            <Scale size={16} style={{ color: '#8B5CF6' }} />
            <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
              Verdicts Available for Challenge
            </span>
            <span style={{
              fontSize: '0.75rem', padding: '2px 8px', borderRadius: '10px',
              background: 'rgba(139,92,246,0.1)', color: '#8B5CF6', fontWeight: 600,
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
              Run an assessment, loan, insurance, or prediction first to generate verdicts.
            </p>
          </div>
        ) : (
          <div>
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
                    border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)',
                    color: '#EF4444', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
                  }}
                >
                  <Swords size={14} />
                  Challenge
                </button>
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
            <Gavel size={16} style={{ color: '#EF4444' }} />
            <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
              Active Disputes
            </span>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {(['all', 'pending', 'under_retrial', 'resolved'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: '4px 12px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 500,
                  border: '1px solid', cursor: 'pointer',
                  ...(filter === f
                    ? { background: 'rgba(139,92,246,0.15)', borderColor: 'rgba(139,92,246,0.3)', color: '#8B5CF6' }
                    : { background: 'transparent', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }),
                }}
              >
                {f === 'all' ? 'All' : f === 'under_retrial' ? 'Re-trial' : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {filteredDisputes.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Gavel size={40} style={{ color: 'var(--text-tertiary)', marginBottom: '12px', opacity: 0.5 }} />
            <p style={{ margin: '0 0 4px', fontWeight: 500 }}>No disputes found</p>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>
              {filter === 'all' ? 'Challenge a verdict above to get started.' : `No ${filter.replace('_', ' ')} disputes.`}
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
                          ? { background: 'rgba(245,158,11,0.12)', color: '#F59E0B' }
                          : d.status === 'under_retrial'
                          ? { background: 'rgba(139,92,246,0.12)', color: '#8B5CF6' }
                          : { background: 'rgba(16,185,129,0.12)', color: '#10B981' }),
                      }}>
                        {d.status === 'under_retrial' ? 'Re-trial' : d.status.charAt(0).toUpperCase() + d.status.slice(1)}
                      </span>
                      {d.outcome && (
                        <span style={{
                          fontSize: '0.7rem', padding: '2px 8px', borderRadius: '10px', fontWeight: 600,
                          ...(d.outcome === 'overturned'
                            ? { background: 'rgba(239,68,68,0.12)', color: '#EF4444' }
                            : { background: 'rgba(16,185,129,0.12)', color: '#10B981' }),
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
                          <div style={{ marginTop: '12px' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              Re-trial Result
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                              {typeof d.retrial === 'string' ? d.retrial : JSON.stringify(d.retrial)}
                            </div>
                          </div>
                        )}
                        {d.status === 'pending' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleTriggerRetrial(d.id); }}
                            disabled={retrialLoading === d.id}
                            style={{
                              marginTop: '12px', padding: '8px 16px', borderRadius: '8px',
                              border: '1px solid rgba(139,92,246,0.3)', background: 'rgba(139,92,246,0.08)',
                              color: '#8B5CF6', cursor: retrialLoading === d.id ? 'wait' : 'pointer',
                              fontSize: '0.82rem', fontWeight: 600,
                              display: 'flex', alignItems: 'center', gap: '6px',
                            }}
                          >
                            <Swords size={14} style={{ animation: retrialLoading === d.id ? 'spin 1s linear infinite' : 'none' }} />
                            {retrialLoading === d.id ? 'Starting Re-trial...' : 'Trigger Re-trial'}
                          </button>
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

      {/* ── Step 1: Reason Form Modal ─────────────────────────────── */}
      <AnimatePresence>
        {showReasonModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 1000,
              background: 'rgba(0,0,0,0.6)',
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
                width: '90%', maxWidth: '520px', borderRadius: '16px',
                background: 'var(--bg-surface)', border: '1px solid var(--border-color)',
                boxShadow: '0 24px 64px rgba(0,0,0,0.4)', overflow: 'hidden',
              }}
            >
              {/* Header */}
              <div style={{
                padding: '20px 24px', borderBottom: '1px solid var(--border-color)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Swords size={20} style={{ color: '#EF4444' }} />
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Challenge Verdict
                  </h3>
                </div>
                <button
                  onClick={handleReasonCancel}
                  style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: '1.2rem', padding: '4px' }}
                >
                  &times;
                </button>
              </div>

              {/* Body */}
              <div style={{ padding: '20px 24px' }}>
                {/* Wallet status */}
                <div style={{
                  padding: '10px 14px', borderRadius: '8px', marginBottom: '16px',
                  background: wallet.connected ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                  border: `1px solid ${wallet.connected ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
                  display: 'flex', alignItems: 'center', gap: '8px',
                }}>
                  <span style={{ fontSize: '0.8rem', color: wallet.connected ? '#10B981' : '#EF4444', fontWeight: 500 }}>
                    {wallet.connected
                      ? `Wallet connected: ${wallet.publicKey?.slice(0, 8)}...${wallet.publicKey?.slice(-6)}`
                      : 'Wallet not connected — please connect first'}
                  </span>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Target Asset
                  </div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                    {showReasonModal}
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
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

                <div style={{
                  padding: '12px', borderRadius: '8px',
                  background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
                  marginBottom: '16px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <AlertTriangle size={14} style={{ color: '#F59E0B' }} />
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#F59E0B' }}>Stake Required: {DISPUTE_FEE_CSPR} CSPR</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    If the re-trial overturns the verdict, you get your stake back. If upheld, the stake goes to the original jurors.
                  </p>
                </div>

                {/* Error display */}
                {reasonError && (
                  <div style={{
                    padding: '10px 14px', borderRadius: '8px', marginBottom: '16px',
                    background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                    fontSize: '0.82rem', color: '#EF4444',
                  }}>
                    {reasonError}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div style={{
                padding: '16px 24px', borderTop: '1px solid var(--border-color)',
                display: 'flex', justifyContent: 'flex-end', gap: '10px',
              }}>
                <button
                  onClick={handleReasonCancel}
                  style={{
                    padding: '10px 20px', borderRadius: '8px',
                    border: '1px solid var(--border-color)', background: 'transparent',
                    color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.85rem',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleReasonSubmit}
                  disabled={!disputeReason.trim() || !wallet.connected}
                  style={{
                    padding: '10px 20px', borderRadius: '8px', border: 'none',
                    background: (!disputeReason.trim() || !wallet.connected) ? 'var(--bg-surface-alt)' : 'linear-gradient(135deg, #EF4444, #F97316)',
                    color: '#fff', cursor: (!disputeReason.trim() || !wallet.connected) ? 'not-allowed' : 'pointer',
                    fontSize: '0.85rem', fontWeight: 600,
                    display: 'flex', alignItems: 'center', gap: '6px',
                  }}
                >
                  <Swords size={14} />
                  Continue to Payment
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Step 2: Payment Confirmation Modal (shared component) ── */}
      <PaymentModal
        open={showPaymentModal}
        title="Confirm Dispute Filing"
        description={`Stake ${DISPUTE_FEE_CSPR} CSPR to challenge this verdict. An independent AI panel will re-evaluate the case.`}
        feeLabel="Dispute Stake"
        feeAmount={DISPUTE_FEE_CSPR}
        features={[
          'Independent adversarial re-trial by 3 AI agents',
          'Market Analyst, Value Auditor, and Devil\'s Advocate',
          'Stake returned if you win the challenge',
        ]}
        signing={signingPayment}
        signError={signError}
        onConfirm={handlePaymentConfirm}
        onCancel={handlePaymentCancel}
      />
    </>
  );
};
