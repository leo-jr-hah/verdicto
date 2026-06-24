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
              On-chain RWA price feed, composable primitive for Casper dApps
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '32px' }}>
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
              Verdict Oracle stores multi-agent consensus valuations on-chain as a composable primitive.
              We are our own first integrator, using it to power Borrow and Insure.
              Any future Casper dApp can compose with the same data via cross-contract call.
              0.1 CSPR micropayment per query. Agent-to-agent.
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
          <div style={{
            padding: '60px 20px', textAlign: 'center',
            color: 'var(--text-secondary)',
          }}>
            <Radio size={40} style={{ color: 'var(--text-tertiary)', marginBottom: '12px', opacity: 0.5 }} />
            <p style={{ margin: '0 0 4px', fontWeight: 500 }}>No verdicts stored yet</p>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>
              Verdicts appear here automatically after each asset assessment
            </p>
          </div>
        ) : (
          <div>
            {/* Table Header */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 120px 100px 80px 120px 100px',
              padding: '10px 20px', borderBottom: '1px solid var(--border-color)',
              background: 'var(--bg-secondary)', fontSize: '0.75rem',
              fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              <span>Asset</span>
              <span>Value</span>
              <span>Confidence</span>
              <span>Jurors</span>
              <span>Freshness</span>
              <span>Time</span>
            </div>

            {/* Rows */}
            {verdicts.map((v, i) => {
              const badge = freshnessBadge(v.expiry);
              const isExpanded = expandedVerdict === v.assetId;
              return (
                <React.Fragment key={v.assetId}>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => setExpandedVerdict(isExpanded ? null : v.assetId)}
                    style={{
                      display: 'grid', gridTemplateColumns: '1fr 120px 100px 80px 120px 100px',
                      padding: '14px 20px', borderBottom: '1px solid var(--border-color)',
                      cursor: 'pointer', alignItems: 'center',
                      background: isExpanded ? 'var(--bg-secondary)' : 'transparent',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => { if (!isExpanded) (e.currentTarget as HTMLElement).style.background = 'var(--bg-secondary)'; }}
                    onMouseLeave={(e) => { if (!isExpanded) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    <span style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                      {v.assetId.length > 24 ? v.assetId.slice(0, 24) + '…' : v.assetId}
                    </span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                      ${v.value.toLocaleString()}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{
                        width: '8px', height: '8px', borderRadius: '50%',
                        background: confidenceColor(v.confidence),
                      }} />
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{v.confidence}%</span>
                    </span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{v.jurorCount}</span>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                      padding: '3px 10px', borderRadius: '12px',
                      background: badge.bg, color: badge.color,
                      fontSize: '0.75rem', fontWeight: 600, width: 'fit-content',
                    }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: badge.color }} />
                      {badge.label} · {formatExpiry(v.expiry)}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                      {formatTime(v.timestamp)}
                    </span>
                  </motion.div>

                  {/* Expanded Detail */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        style={{ overflow: 'hidden', background: 'var(--bg-secondary)' }}
                      >
                        <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                          <div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Decision</div>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 500 }}>{v.decision}</div>
                          </div>
                          <div style={{ gridColumn: 'span 2' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              Agent Reputation Breakdown
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
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
                                  <div key={agent} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', width: 100, fontFamily: 'monospace' }}>
                                      {agent?.trim()}
                                    </span>
                                    <div style={{ flex: 1, height: 8, background: 'var(--border-color)', borderRadius: 4, overflow: 'hidden' }}>
                                      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.3s' }} />
                                    </div>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', width: 40, textAlign: 'right' }}>
                                      {score}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '6px' }}>
                              Scores are reputation-weighted (0-1000 scale). Higher = more influence on consensus.
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Receipt Hash</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                              {v.receiptHash ? v.receiptHash.slice(0, 40) + '…' : 'None'}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Expires</div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                              {new Date(v.expiry).toLocaleString()}
                            </div>
                          </div>
                        </div>

                        {/* Challenge Button */}
                        <div style={{ padding: '0 20px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <Link
                            to="/disputes"
                            onClick={(e: React.MouseEvent) => e.stopPropagation()}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '6px',
                              padding: '8px 16px', borderRadius: '8px',
                              border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)',
                              color: '#EF4444', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
                              textDecoration: 'none',
                            }}
                          >
                            <Swords size={14} />
                            Challenge Verdict
                          </Link>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                            Stake 5 CSPR to trigger an independent re-trial
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
