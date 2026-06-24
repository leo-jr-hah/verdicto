import React, { useState, useEffect, useCallback } from 'react';
import { Gavel, RefreshCw, Swords, Scale, AlertTriangle, Shield, ChevronDown, ChevronUp, Activity, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { fetchOracleVerdicts, fetchDisputes, fileDispute, triggerRetrial, type OracleVerdict, type Dispute } from '../services/api';

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
  const [verdicts, setVerdicts] = useState<OracleVerdict[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [expandedDispute, setExpandedDispute] = useState<string | null>(null);
  const [disputeModal, setDisputeModal] = useState<string | null>(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeLoading, setDisputeLoading] = useState(false);
  const [retrialLoading, setRetrialLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'under_retrial' | 'resolved'>('all');

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
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15_000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleFileDispute = async () => {
    if (!disputeModal || !disputeReason.trim()) return;
    setDisputeLoading(true);
    try {
      const result = await fileDispute(disputeModal, '0203user-challenger-key', disputeReason.trim());
      if (result.success) {
        setDisputeModal(null);
        setDisputeReason('');
        await loadData();
      }
    } finally {
      setDisputeLoading(false);
    }
  };

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
              Challenge any verdict with a 5 CSPR stake. Adversarial AI panel re-evaluates independently.
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
              <strong>1. Challenge:</strong> Stake 5 CSPR and explain why the verdict is wrong.
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
                  onClick={() => setDisputeModal(v.assetId)}
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
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Gavel size={16} style={{ color: '#EF4444' }} />
            <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
              All Disputes
            </span>
            <span style={{
              fontSize: '0.75rem', padding: '2px 8px', borderRadius: '10px',
              background: 'rgba(239,68,68,0.1)', color: '#EF4444', fontWeight: 600,
            }}>
              {filteredDisputes.length}
            </span>
          </div>

          {/* Filter Tabs */}
          <div style={{ display: 'flex', gap: '4px' }}>
            {(['all', 'pending', 'under_retrial', 'resolved'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: '4px 12px', borderRadius: '6px', border: 'none',
                  background: filter === f ? 'rgba(139,92,246,0.15)' : 'transparent',
                  color: filter === f ? '#8B5CF6' : 'var(--text-tertiary)',
                  cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600,
                }}
              >
                {f === 'all' ? 'All' : f === 'under_retrial' ? 'Re-trial' : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {filteredDisputes.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Scale size={40} style={{ color: 'var(--text-tertiary)', marginBottom: '12px', opacity: 0.5 }} />
            <p style={{ margin: '0 0 4px', fontWeight: 500 }}>
              {filter === 'all' ? 'No disputes filed yet' : `No ${filter === 'under_retrial' ? 're-trial' : filter} disputes`}
            </p>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>
              {filter === 'all' ? 'Challenge any verdict above by staking 5 CSPR.' : 'Switch to "All" to see all disputes.'}
            </p>
          </div>
        ) : (
          <div>
            {filteredDisputes.map((d, i) => {
              const isExpanded = expandedDispute === d.id;
              const statusColors: Record<string, { color: string; bg: string }> = {
                pending: { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
                under_retrial: { color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)' },
                resolved: { color: d.outcome === 'overturned' ? '#EF4444' : '#10B981', bg: d.outcome === 'overturned' ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)' },
              };
              const sc = statusColors[d.status] || statusColors.pending;

              return (
                <React.Fragment key={d.id}>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => setExpandedDispute(isExpanded ? null : d.id)}
                    style={{
                      padding: '14px 20px', borderBottom: '1px solid var(--border-color)',
                      cursor: 'pointer', background: isExpanded ? 'var(--bg-secondary)' : 'transparent',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => { if (!isExpanded) (e.currentTarget as HTMLElement).style.background = 'var(--bg-secondary)'; }}
                    onMouseLeave={(e) => { if (!isExpanded) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                        <Swords size={16} style={{ color: '#EF4444', flexShrink: 0 }} />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {d.assetId.length > 28 ? d.assetId.slice(0, 28) + '...' : d.assetId}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                            {d.reason.length > 60 ? d.reason.slice(0, 60) + '...' : d.reason}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                        <span style={{
                          padding: '3px 10px', borderRadius: '12px',
                          background: sc.bg, color: sc.color,
                          fontSize: '0.75rem', fontWeight: 600,
                        }}>
                          {d.status === 'under_retrial' ? 'Re-trial' : d.status.charAt(0).toUpperCase() + d.status.slice(1)}
                        </span>
                        {d.outcome && (
                          <span style={{
                            padding: '3px 10px', borderRadius: '12px',
                            background: d.outcome === 'overturned' ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                            color: d.outcome === 'overturned' ? '#EF4444' : '#10B981',
                            fontSize: '0.75rem', fontWeight: 600,
                          }}>
                            {d.outcome === 'overturned' ? 'Overturned' : 'Upheld'}
                          </span>
                        )}
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#F59E0B' }}>
                          {d.stakeCSPR} CSPR
                        </span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                          {formatTime(d.createdAt)}
                        </span>
                        {isExpanded ? <ChevronUp size={14} style={{ color: 'var(--text-tertiary)' }} /> : <ChevronDown size={14} style={{ color: 'var(--text-tertiary)' }} />}
                      </div>
                    </div>
                  </motion.div>

                  {/* Expanded Dispute Detail */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        style={{ overflow: 'hidden', background: 'var(--bg-secondary)' }}
                      >
                        <div style={{ padding: '16px 20px' }}>
                          {/* Challenger's Reason */}
                          <div style={{ marginBottom: '16px' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              Challenger's Claim
                            </div>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                              {d.reason}
                            </div>
                          </div>

                          {/* Original vs New Verdict (if retrial completed) */}
                          {d.retrial && (
                            <div style={{ marginBottom: '16px' }}>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Re-trial Result
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '16px', alignItems: 'center' }}>
                                {/* Original */}
                                <div style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)' }}>
                                  <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginBottom: '4px', textTransform: 'uppercase' }}>Original</div>
                                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>${d.retrial.originalVerdict.value.toLocaleString()}</div>
                                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{d.retrial.originalVerdict.confidence}% confidence</div>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>{d.retrial.originalVerdict.decision}</div>
                                </div>

                                {/* Arrow + Delta */}
                                <div style={{ textAlign: 'center' }}>
                                  <div style={{ fontSize: '1.2rem', color: d.outcome === 'overturned' ? '#EF4444' : '#10B981' }}>
                                    {d.outcome === 'overturned' ? '!=' : '=='}
                                  </div>
                                  <div style={{
                                    fontSize: '0.85rem', fontWeight: 700,
                                    color: d.retrial.valueDelta > 0 ? '#10B981' : d.retrial.valueDelta < 0 ? '#EF4444' : 'var(--text-secondary)',
                                  }}>
                                    {d.retrial.valueDelta > 0 ? '+' : ''}{d.retrial.valueDelta}%
                                  </div>
                                </div>

                                {/* New */}
                                <div style={{ padding: '12px', borderRadius: '8px', border: `1px solid ${d.outcome === 'overturned' ? 'rgba(239,68,68,0.3)' : 'var(--border-color)'}`, background: 'var(--bg-primary)' }}>
                                  <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginBottom: '4px', textTransform: 'uppercase' }}>Re-trial</div>
                                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: d.outcome === 'overturned' ? '#EF4444' : 'var(--text-primary)' }}>${d.retrial.newVerdict.value.toLocaleString()}</div>
                                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{d.retrial.newVerdict.confidence}% confidence</div>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>{d.retrial.newVerdict.decision}</div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Retrial Panel (if retrial completed) */}
                          {d.retrial && (
                            <div style={{ marginBottom: '16px' }}>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Adversarial Panel ({d.retrial.panel.length} jurors)
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {d.retrial.panel.map((juror) => (
                                  <div key={juror.agentId} style={{
                                    padding: '10px 12px', borderRadius: '8px',
                                    border: '1px solid var(--border-color)', background: 'var(--bg-primary)',
                                  }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{juror.name}</span>
                                        <span style={{
                                          fontSize: '0.7rem', padding: '2px 6px', borderRadius: '6px',
                                          background: 'rgba(139,92,246,0.1)', color: '#8B5CF6', fontWeight: 500,
                                        }}>
                                          {juror.methodology}
                                        </span>
                                      </div>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{
                                          padding: '2px 8px', borderRadius: '6px',
                                          background: juror.vote === 'A' ? 'rgba(16,185,129,0.1)' : juror.vote === 'B' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                                          color: juror.vote === 'A' ? '#10B981' : juror.vote === 'B' ? '#EF4444' : '#F59E0B',
                                          fontSize: '0.75rem', fontWeight: 600,
                                        }}>
                                          {juror.vote === 'A' ? 'Upheld' : juror.vote === 'B' ? 'Overturn' : 'Split'}
                                        </span>
                                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>{juror.confidence}%</span>
                                      </div>
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                                      {juror.reasoning}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Retrial Reasoning Summary */}
                          {d.retrial && (
                            <div style={{ marginBottom: '16px', padding: '10px 12px', borderRadius: '8px', background: d.outcome === 'overturned' ? 'rgba(239,68,68,0.05)' : 'rgba(16,185,129,0.05)', border: `1px solid ${d.outcome === 'overturned' ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)'}` }}>
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                {d.retrial.reasoning}
                              </div>
                            </div>
                          )}

                          {/* Stake Distribution */}
                          {d.stakeDistribution && (
                            <div style={{ marginBottom: '12px' }}>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Stake Distribution</div>
                              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {d.stakeDistribution.map((sd, si) => (
                                  <span key={si} style={{
                                    padding: '4px 10px', borderRadius: '6px',
                                    background: sd.recipient === 'challenger' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                                    color: sd.recipient === 'challenger' ? '#10B981' : '#F59E0B',
                                    fontSize: '0.8rem', fontWeight: 600,
                                  }}>
                                    {sd.recipient === 'challenger' ? 'Challenger' : 'Original Jurors'}: {sd.amountCSPR} CSPR
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Retrial Button for Pending Disputes */}
                          {d.status === 'pending' && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleTriggerRetrial(d.id); }}
                              disabled={retrialLoading === d.id}
                              style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '10px 20px', borderRadius: '8px',
                                border: 'none', background: retrialLoading === d.id ? 'var(--bg-secondary)' : 'linear-gradient(135deg, #8B5CF6, #06B6D4)',
                                color: '#fff', cursor: retrialLoading === d.id ? 'wait' : 'pointer',
                                fontSize: '0.85rem', fontWeight: 600,
                              }}
                            >
                              <Gavel size={14} />
                              {retrialLoading === d.id ? 'Running Re-trial...' : 'Run Re-trial'}
                            </button>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </React.Fragment>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* ── Dispute Filing Modal ──────────────────────────────────── */}
      <AnimatePresence>
        {disputeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 1000,
              background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            onClick={() => { setDisputeModal(null); setDisputeReason(''); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '90%', maxWidth: '520px', borderRadius: '16px',
                background: 'var(--bg-primary)', border: '1px solid var(--border-color)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.4)', overflow: 'hidden',
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
                  onClick={() => { setDisputeModal(null); setDisputeReason(''); }}
                  style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: '1.2rem', padding: '4px' }}
                >
                  &times;
                </button>
              </div>

              {/* Body */}
              <div style={{ padding: '20px 24px' }}>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Target Asset
                  </div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                    {disputeModal}
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
                      border: '1px solid var(--border-color)', background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)', fontSize: '0.9rem', lineHeight: 1.5,
                      resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div style={{
                  padding: '12px', borderRadius: '8px',
                  background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)',
                  marginBottom: '16px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <AlertTriangle size={14} style={{ color: '#F59E0B' }} />
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#F59E0B' }}>Stake Required: 5 CSPR</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    If the re-trial overturns the verdict, you get your stake back. If upheld, the stake goes to the original jurors.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div style={{
                padding: '16px 24px', borderTop: '1px solid var(--border-color)',
                display: 'flex', justifyContent: 'flex-end', gap: '10px',
              }}>
                <button
                  onClick={() => { setDisputeModal(null); setDisputeReason(''); }}
                  style={{
                    padding: '10px 20px', borderRadius: '8px',
                    border: '1px solid var(--border-color)', background: 'transparent',
                    color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.85rem',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleFileDispute}
                  disabled={!disputeReason.trim() || disputeLoading}
                  style={{
                    padding: '10px 20px', borderRadius: '8px', border: 'none',
                    background: (!disputeReason.trim() || disputeLoading) ? 'var(--bg-secondary)' : 'linear-gradient(135deg, #EF4444, #F97316)',
                    color: '#fff', cursor: (!disputeReason.trim() || disputeLoading) ? 'not-allowed' : 'pointer',
                    fontSize: '0.85rem', fontWeight: 600,
                    display: 'flex', alignItems: 'center', gap: '6px',
                  }}
                >
                  <Swords size={14} />
                  {disputeLoading ? 'Filing...' : 'File Dispute (5 CSPR)'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
