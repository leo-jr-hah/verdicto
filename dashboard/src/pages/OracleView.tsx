import React, { useState, useEffect, useCallback } from 'react';
import { Radio, RefreshCw, Shield, Zap, Code, Copy, Check, Wifi, ChevronDown, ChevronUp, Database, Activity, AlertTriangle, Swords, Gavel } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { fetchOracleVerdicts, type OracleVerdict, type OracleStats } from '../services/api';

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

function formatExpiry(ts: number): string {
  const now = Date.now();
  const remaining = ts - now;
  if (remaining <= 0) return 'Expired';
  const hours = Math.floor(remaining / 3_600_000);
  const mins = Math.floor((remaining % 3_600_000) / 60_000);
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function confidenceColor(c: number): string {
  if (c >= 85) return '#10B981';
  if (c >= 70) return '#F59E0B';
  return '#EF4444';
}

function freshnessBadge(expiry: number): { label: string; color: string; bg: string } {
  const now = Date.now();
  const remaining = expiry - now;
  if (remaining <= 0) return { label: 'Expired', color: '#EF4444', bg: 'rgba(239,68,68,0.1)' };
  if (remaining < 3_600_000) return { label: 'Expiring Soon', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' };
  return { label: 'Fresh', color: '#10B981', bg: 'rgba(16,185,129,0.1)' };
}

const INTEGRATION_SNIPPET = `// Cross-contract call from any Casper dApp
// 1. Query the VerdictOracle for an asset price
const verdict = oracle.get_verdict("ASSESS-1719000000000");

// 2. Enforce staleness: expired verdicts are rejected contract-side
//    TTL is 24h by default. is_expired() checks block_time > expiry.
if (oracle.is_expired(asset_id)) {
    revert("Verdict expired - request fresh assessment");
}

// 3. Use the verdict in your lending logic
if (verdict.confidence >= 80) {
    let ltv = calculate_ltv(verdict.value, loan_amount);
    disburse_loan(loan_amount, collateral);
}

// 4. Pay 0.1 CSPR per query via x402 micropayment
//    No API key needed. No human in the loop. Agent-to-agent.`;

export const OracleView: React.FC = () => {
  const [verdicts, setVerdicts] = useState<OracleVerdict[]>([]);
  const [stats, setStats] = useState<OracleStats>({ totalVerdicts: 0, freshVerdicts: 0, avgConfidence: 0, totalQueries: 0, activeDisputes: 0, overturnedVerdicts: 0 });
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [copied, setCopied] = useState(false);
  const [expandedVerdict, setExpandedVerdict] = useState<string | null>(null);
  const [showCode, setShowCode] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchOracleVerdicts();
      setVerdicts(data.verdicts || []);
      setStats(data.stats || { totalVerdicts: 0, freshVerdicts: 0, avgConfidence: 0, totalQueries: 0, activeDisputes: 0, overturnedVerdicts: 0 });
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

  const handleCopy = () => {
    navigator.clipboard.writeText(INTEGRATION_SNIPPET);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {/* ── Page Header ───────────────────────────────────────────── */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
              <Radio size={28} style={{ color: '#8B5CF6' }} />
              <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Verdict Oracle
              </h1>
            </div>
            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.95rem' }}>
              On-chain RWA price feed — shared data layer for all Verdicto products
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
      <div className="oracle-stats-grid">
        {[
          { label: 'Total Verdicts', value: stats.totalVerdicts, icon: Database, color: '#8B5CF6' },
          { label: 'Fresh (Active)', value: stats.freshVerdicts, icon: Zap, color: '#10B981' },
          { label: 'Avg Confidence', value: `${stats.avgConfidence}%`, icon: Shield, color: '#F59E0B' },
          { label: 'Active Disputes', value: stats.activeDisputes, icon: AlertTriangle, color: '#EF4444' },
          { label: 'Overturned', value: stats.overturnedVerdicts, icon: Gavel, color: '#F97316' },
          { label: 'Query Fee', value: '0.1 CSPR', icon: Activity, color: '#06B6D4' },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                padding: '16px 18px', borderRadius: '12px',
                background: 'var(--bg-elevated)', border: '1px solid var(--border-color)',
                display: 'flex', alignItems: 'center', gap: '12px',
              }}
            >
              <div style={{
                width: '40px', height: '40px', borderRadius: '10px',
                background: `${stat.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Icon size={18} style={{ color: stat.color }} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2, fontVariantNumeric: 'tabular-nums' }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', fontWeight: 500, letterSpacing: '0.02em' }}>{stat.label}</div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── What Is This? ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{
          padding: '24px', borderRadius: '12px',
          background: 'linear-gradient(135deg, rgba(139,92,246,0.06) 0%, rgba(6,182,212,0.06) 100%)',
          border: '1px solid rgba(139,92,246,0.15)',
          marginBottom: '32px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '12px',
            background: 'rgba(139,92,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Radio size={24} style={{ color: '#8B5CF6' }} />
          </div>
          <div>
            <h3 style={{ margin: '0 0 8px', fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              The GPS for Asset Prices
            </h3>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Verdict Oracle stores multi-agent consensus valuations on-chain as a shared data layer.
              Borrow and Insure query it for collateral valuations and risk scores.
              Any Casper dApp can integrate the same data via cross-contract call.
              0.1 CSPR per query, settled on-chain.
            </p>
          </div>
        </div>
      </motion.div>

      {/* ── Integration Code Snippet ──────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        style={{
          borderRadius: '12px', border: '1px solid var(--border-color)',
          background: 'var(--bg-primary)', marginBottom: '32px', overflow: 'hidden',
        }}
      >
        <button
          onClick={() => setShowCode(!showCode)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 20px', border: 'none', background: 'transparent',
            cursor: 'pointer', color: 'var(--text-primary)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Code size={18} style={{ color: '#8B5CF6' }} />
            <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Integration Code: How to Query the Oracle</span>
          </div>
          {showCode ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        <AnimatePresence>
          {showCode && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{ position: 'relative', padding: '0 20px 20px' }}>
                <button
                  onClick={handleCopy}
                  style={{
                    position: 'absolute', top: '8px', right: '28px',
                    display: 'flex', alignItems: 'center', gap: '4px',
                    padding: '4px 10px', borderRadius: '6px',
                    border: '1px solid var(--border-color)', background: 'var(--bg-secondary)',
                    color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.75rem',
                  }}
                >
                  {copied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
                </button>
                <pre style={{
                  margin: 0, padding: '16px', borderRadius: '8px',
                  background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                  fontSize: '0.82rem', lineHeight: 1.6, overflow: 'auto',
                  color: 'var(--text-primary)', fontFamily: "'SF Mono', 'Fira Code', monospace",
                }}>
                  {INTEGRATION_SNIPPET}
                </pre>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Verdicts Table ────────────────────────────────────────── */}
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
            <Database size={16} style={{ color: '#8B5CF6' }} />
            <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
              Stored Verdicts
            </span>
            <span style={{
              fontSize: '0.75rem', padding: '2px 8px', borderRadius: '10px',
              background: 'rgba(139,92,246,0.1)', color: '#8B5CF6', fontWeight: 600,
            }}>
              {verdicts.length}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Wifi size={12} style={{ color: '#10B981' }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Live</span>
          </div>
        </div>

        {verdicts.length === 0 ? (
          <div className="oracle-empty-state">
            <div className="oracle-empty-icon">
              <Radio size={24} style={{ color: 'var(--text-tertiary)', opacity: 0.5 }} />
            </div>
            <p style={{ margin: '0 0 6px', fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>No verdicts yet</p>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-tertiary)', maxWidth: 320, marginLeft: 'auto', marginRight: 'auto' }}>
              Verdicts appear here automatically after each asset assessment completes
            </p>
          </div>
        ) : (
          <div>
            {/* Table Header (desktop only, hidden on mobile via CSS) */}
            <div className="oracle-table-header">
              <span>Asset</span>
              <span>Value</span>
              <span>Confidence</span>
              <span>Jurors</span>
              <span>Freshness</span>
              <span>Time</span>
            </div>

            {/* Verdict Rows */}
            {verdicts.map((v, i) => {
              const badge = freshnessBadge(v.expiry);
              const isExpanded = expandedVerdict === v.assetId;
              const confColor = confidenceColor(v.confidence);
              return (
                <React.Fragment key={v.assetId}>
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => setExpandedVerdict(isExpanded ? null : v.assetId)}
                    className={`oracle-table-row${isExpanded ? ' expanded' : ''}`}
                  >
                    {/* Asset ID */}
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.88rem' }}>
                      <div>{v.assetId.length > 28 ? v.assetId.slice(0, 28) + '…' : v.assetId}</div>
                    </span>

                    {/* Value */}
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.92rem', fontVariantNumeric: 'tabular-nums' }}>
                      <div>${v.value.toLocaleString()}</div>
                    </span>

                    {/* Confidence with bar */}
                    <span className="oracle-cell">
                      <div className="oracle-confidence-bar">
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: confColor, flexShrink: 0 }} />
                        <div className="oracle-confidence-track">
                          <div className="oracle-confidence-fill" style={{ width: `${v.confidence}%`, background: confColor }} />
                        </div>
                        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums', minWidth: 32, textAlign: 'right' }}>
                          {v.confidence}%
                        </span>
                      </div>
                    </span>

                    {/* Jurors */}
                    <span className="oracle-cell" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                      <div>{v.jurorCount}</div>
                    </span>

                    {/* Freshness Badge */}
                    <span className="oracle-cell">
                      <div className="oracle-freshness-badge" style={{ background: badge.bg, color: badge.color }}>
                        <span className="oracle-freshness-dot" style={{ background: badge.color }} />
                        {badge.label} · {formatExpiry(v.expiry)}
                      </div>
                    </span>

                    {/* Time */}
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontVariantNumeric: 'tabular-nums' }}>
                      <div>{formatTime(v.timestamp)}</div>
                    </span>
                  </motion.div>

                  {/* Expanded Detail Panel */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ overflow: 'hidden' }}
                      >
                        <div className="oracle-expanded-grid">
                          {/* Decision */}
                          <div>
                            <div className="oracle-detail-label">Decision</div>
                            <div className="oracle-detail-value">{v.decision}</div>
                          </div>

                          {/* Receipt Hash */}
                          <div>
                            <div className="oracle-detail-label">Receipt Hash</div>
                            <div className="oracle-detail-mono">
                              {v.receiptHash ? v.receiptHash.slice(0, 40) + '…' : 'None'}
                            </div>
                          </div>

                          {/* Expires */}
                          <div>
                            <div className="oracle-detail-label">Expires</div>
                            <div className="oracle-detail-value">
                              {new Date(v.expiry).toLocaleString()}
                            </div>
                          </div>

                          {/* Agent Reputation Breakdown — full width */}
                          <div style={{ gridColumn: '1 / -1' }}>
                            <div className="oracle-detail-label">Agent Reputation Breakdown</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                              {(v.agentWeights || '').split(',').filter(Boolean).map((pair) => {
                                const [agent, scoreStr] = pair.split(':');
                                const score = parseInt(scoreStr, 10);
                                const pct = Math.min(score / 1000 * 100, 100);
                                const agentColors: Record<string, string> = {
                                  evidence: '#10B981', 'valuation-a': '#06B6D4', 'valuation-b': '#8B5CF6',
                                  market: '#F59E0B', precedent: '#EF4444',
                                };
                                const color = agentColors[agent?.trim()] || '#8B5CF6';
                                return (
                                  <div key={agent} className="oracle-agent-bar-row">
                                    <span className="oracle-agent-name">{agent?.trim()}</span>
                                    <div className="oracle-agent-track">
                                      <div className="oracle-agent-fill" style={{ width: `${pct}%`, background: color }} />
                                    </div>
                                    <span className="oracle-agent-score">{score}</span>
                                  </div>
                                );
                              })}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '8px' }}>
                              Reputation-weighted (0–1000 scale). Higher score = more influence on consensus.
                            </div>
                          </div>
                        </div>

                        {/* Challenge Action */}
                        <div style={{ padding: '12px 24px 20px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                          <Link
                            to="/disputes"
                            onClick={(e: React.MouseEvent) => e.stopPropagation()}
                            className="oracle-challenge-btn"
                          >
                            <Swords size={14} />
                            Challenge This Verdict
                          </Link>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                            5 CSPR stake required · Rewards for strong evidence
                          </span>
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
    </>
  );
};
