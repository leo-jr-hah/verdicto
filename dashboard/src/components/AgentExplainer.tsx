import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  TrendingUp,
  ChevronRight,
  Scale,
  AlertTriangle,
  Shield,
  Zap,
  Database,
  Activity,
} from 'lucide-react';
import type { AssessmentResult } from '../services/api';

// ─── Types ─────────────────────────────────────────────────────────────────

interface AgentExplainerProps {
  assessment: AssessmentResult;
  /** Insurance-specific context to display */
  insurance?: {
    riskScore: number;
    riskFactors: string[];
    tier: string;
    coverageAmount: number;
    premiumCSPR: number;
    deductiblePercent: number;
  };
  /** Loan-specific context to display */
  loan?: {
    ltvRatio: number;
    loanAmountCSPR: number;
    trustBreakdown?: {
      confidence: number;
      valueRatio: number;
      ltvRange: string;
    };
  };
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toLocaleString()}`;
}

function confidenceColor(c: number): string {
  if (c >= 0.8) return 'var(--text-secondary)';
  if (c >= 0.6) return 'var(--text-tertiary)';
  return 'var(--error)';
}

function riskColor(r: number): string {
  if (r <= 30) return 'var(--text-secondary)';
  if (r <= 55) return 'var(--text-tertiary)';
  return 'var(--error)';
}

function divergenceColor(d: number): string {
  if (d <= 10) return 'var(--text-secondary)';
  if (d <= 20) return 'var(--text-tertiary)';
  return 'var(--error)';
}

// ─── Sub-components ────────────────────────────────────────────────────────

const AgentCard: React.FC<{
  label: string;
  method: string;
  value: number;
  confidence: number;
  source: string;
  reasoning: string;
  fallbackTriggered?: boolean;
  fallbackProvider?: string;
  index: number;
}> = ({ label, method, value, confidence, source, reasoning, fallbackTriggered, fallbackProvider, index }) => {
  const [expanded, setExpanded] = useState(false);
  const color = 'var(--red-600)';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.1 }}
      style={{
        background: 'var(--bg-elevated, #fff)',
        border: `1px solid var(--border-color, #e5e7eb)`,
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 16px', cursor: 'pointer',
          borderLeft: `3px solid ${color}`,
          transition: 'background 0.15s ease',
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover, #f9fafb)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
      >
        {/* Icon */}
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: `${color}12`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Brain size={18} color={color} />
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: '0.72rem', fontWeight: 600, color, letterSpacing: '0.04em',
            textTransform: 'uppercase', marginBottom: 2,
          }}>
            {label}
          </div>
          <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary, #111)' }}>
            {method}
          </div>
        </div>

        {/* Value + Confidence */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary, #111)' }}>
            {formatCurrency(value)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: confidenceColor(confidence),
            }} />
            <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary, #9ca3af)', fontWeight: 500 }}>
              {(confidence * 100).toFixed(0)}% conf
            </span>
          </div>
        </div>

        <motion.div
          animate={{ rotate: expanded ? 90 : 0 }}
          transition={{ duration: 0.15 }}
        >
          <ChevronRight size={16} color="var(--text-tertiary, #9ca3af)" />
        </motion.div>
      </div>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              padding: '0 16px 16px',
              borderTop: '1px solid var(--border-color, #e5e7eb)',
            }}>
              {/* Data Source */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                margin: '12px 0 8px',
                fontSize: '0.72rem', color: 'var(--text-tertiary, #9ca3af)',
              }}>
                <Database size={12} />
                <span>Data Source: <strong style={{ color: 'var(--text-secondary, #6b7280)' }}>{source}</strong></span>
              </div>

              {/* Fallback warning */}
              {fallbackTriggered && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 10px', marginBottom: 8,
                  background: 'var(--warning-soft)', borderRadius: 6,
                  fontSize: '0.72rem', color: 'var(--text-tertiary)',
                }}>
                  <AlertTriangle size={12} />
                  Fallback to {fallbackProvider || 'deterministic'} response (LLM timeout)
                </div>
              )}

              {/* Reasoning */}
              <div style={{
                fontSize: '0.82rem', lineHeight: 1.65,
                color: 'var(--text-secondary, #6b7280)',
                background: 'var(--bg-surface, #f3f4f6)',
                borderRadius: 8, padding: '12px 14px',
                border: '1px solid var(--border-color-subtle, var(--border-color, #e5e7eb))',
              }}>
                {reasoning}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const ConsensusCard: React.FC<{
  assessment: AssessmentResult;
  index: number;
}> = ({ assessment, index }) => {
  const [expanded, setExpanded] = useState(false);
  const divergence = assessment.divergence;
  const verdict = assessment.verdict;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.1 }}
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 16px', cursor: 'pointer',
          borderLeft: '3px solid var(--red-600)',
        }}
      >
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: 'var(--bg-elevated)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Scale size={18} color="var(--red-600)" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: '0.72rem', fontWeight: 600, color: 'var(--red-600)',
            letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 2,
          }}>
            AI Consensus
          </div>
          <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary, #111)' }}>
            {verdict?.decision || 'Weighted Average'}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--red-600)' }}>
            {formatCurrency(assessment.assessedValue)}
          </div>
          <div style={{
            fontSize: '0.72rem', fontWeight: 600,
            color: divergenceColor(divergence),
          }}>
            {divergence.toFixed(1)}% divergence
          </div>
        </div>
        <motion.div animate={{ rotate: expanded ? 90 : 0 }} transition={{ duration: 0.15 }}>
          <ChevronRight size={16} color="var(--text-tertiary, #9ca3af)" />
        </motion.div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              padding: '0 16px 16px',
              borderTop: '1px solid var(--border)',
            }}>
              {/* How consensus works */}
              <div style={{
                margin: '12px 0',
                padding: '12px 14px',
                background: 'var(--bg-surface, #f3f4f6)',
                borderRadius: 8,
                fontSize: '0.82rem',
                lineHeight: 1.65,
                color: 'var(--text-secondary, #6b7280)',
              }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary, #111)', marginBottom: 6 }}>
                  How the consensus was reached:
                </div>
                {divergence <= 15 ? (
                  <span>
                    Both agents <strong style={{ color: 'var(--text-secondary)' }}>agreed within 15%</strong>, so the final value is a
                    confidence-weighted average. Agent A's valuation ({formatCurrency(assessment.valuationA.value)}) was weighted at{' '}
                    <strong>{(assessment.valuationA.confidence * 100).toFixed(0)}%</strong> confidence, and Agent B's
                    ({formatCurrency(assessment.valuationB.value)}) at <strong>{(assessment.valuationB.confidence * 100).toFixed(0)}%</strong>.
                  </span>
                ) : (
                  <span>
                    Agents <strong style={{ color: 'var(--text-tertiary)' }}>diverged by {divergence.toFixed(1)}%</strong> - a jury
                    panel of 3 independent AI jurors deliberated in 2 rounds. In Round 1, each juror independently
                    evaluated both valuations. In Round 2, jurors reviewed each other's reasoning and revised their
                    votes. Final verdict was weighted by each juror's on-chain reputation score.
                  </span>
                )}
              </div>

              {/* Divergence bar visualization */}
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary, #9ca3af)', marginBottom: 6, fontWeight: 600 }}>
                  VALUATION RANGE
                </div>
                <div style={{
                  position: 'relative', height: 28,
                  background: 'var(--bg-surface, #f3f4f6)',
                  borderRadius: 6, overflow: 'hidden',
                }}>
                  {/* Range fill */}
                  <div style={{
                    position: 'absolute',
                    left: `${(Math.min(assessment.valuationA.value, assessment.valuationB.value) / Math.max(assessment.valuationA.value, assessment.valuationB.value)) * 20}%`,
                    right: '20%',
                    top: 0, bottom: 0,
                    background: `linear-gradient(90deg, rgba(107,114,128,0.12), rgba(107,114,128,0.22))`,
                    borderRadius: 6,
                  }} />
                  {/* Consensus marker */}
                  <div style={{
                    position: 'absolute',
                    left: `${((assessment.assessedValue - Math.min(assessment.valuationA.value, assessment.valuationB.value)) /
                      (Math.max(assessment.valuationA.value, assessment.valuationB.value) - Math.min(assessment.valuationA.value, assessment.valuationB.value) || 1)) * 60 + 20}%`,
                    top: 2, bottom: 2,
                    width: 3, background: 'var(--text-primary)', borderRadius: 2,
                  }} />
                  {/* Labels */}
                  <div style={{
                    position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
                    fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)',
                  }}>
                    {formatCurrency(Math.min(assessment.valuationA.value, assessment.valuationB.value))}
                  </div>
                  <div style={{
                    position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                    fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)',
                  }}>
                    {formatCurrency(Math.max(assessment.valuationA.value, assessment.valuationB.value))}
                  </div>
                </div>
              </div>

              {/* Methodology */}
              {assessment.methodology && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary, #9ca3af)', marginBottom: 6, fontWeight: 600 }}>
                    {assessment.methodology.title.toUpperCase()}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary, #6b7280)', lineHeight: 1.6, marginBottom: 8 }}>
                    {assessment.methodology.description}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {assessment.methodology.methods.map((m, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'flex-start', gap: 8,
                        padding: '8px 10px', borderRadius: 6,
                        background: 'var(--bg-elevated, #fff)',
                        border: '1px solid var(--border-color, #e5e7eb)',
                      }}>
                        <Zap size={13} color="var(--red-600)" style={{ marginTop: 2, flexShrink: 0 }} />
                        <div>
                          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary, #111)' }}>
                            {m.name}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary, #9ca3af)', lineHeight: 1.5 }}>
                            {m.description}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────

export const AgentExplainer: React.FC<AgentExplainerProps> = ({ assessment, insurance, loan }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Section header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        marginBottom: 4,
      }}>
        <Activity size={16} color="var(--primary, #ef4444)" />
        <span style={{
          fontSize: '0.82rem', fontWeight: 700,
          color: 'var(--text-primary, #111)',
          letterSpacing: '0.02em',
        }}>
          How AI Agents Reached This Result
        </span>
      </div>

      {/* Agent A card */}
      <AgentCard
        label="Agent A - Valuator"
        method={assessment.valuationA.method}
        value={assessment.valuationA.value}
        confidence={assessment.valuationA.confidence}
        source={assessment.valuationA.source}
        reasoning={assessment.valuationA.reasoning}
        fallbackTriggered={assessment.valuationA.fallbackTriggered}
        fallbackProvider={assessment.valuationA.fallbackProvider}
        index={0}
      />

      {/* Agent B card */}
      <AgentCard
        label="Agent B - Valuator"
        method={assessment.valuationB.method}
        value={assessment.valuationB.value}
        confidence={assessment.valuationB.confidence}
        source={assessment.valuationB.source}
        reasoning={assessment.valuationB.reasoning}
        fallbackTriggered={assessment.valuationB.fallbackTriggered}
        fallbackProvider={assessment.valuationB.fallbackProvider}
        index={1}
      />

      {/* Consensus card */}
      <ConsensusCard assessment={assessment} index={2} />

      {/* Insurance Risk Analysis */}
      {insurance && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.3 }}
          style={{
            background: 'var(--bg-elevated, #fff)',
            border: '1px solid var(--border-color, #e5e7eb)',
            borderRadius: 12,
            padding: '16px',
            borderLeft: `3px solid ${riskColor(insurance.riskScore)}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Shield size={18} color={riskColor(insurance.riskScore)} />
            <div>
              <div style={{
                fontSize: '0.72rem', fontWeight: 600, color: riskColor(insurance.riskScore),
                letterSpacing: '0.04em', textTransform: 'uppercase',
              }}>
                Risk Analysis
              </div>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary, #111)' }}>
                {insurance.tier} - Risk Score {insurance.riskScore}/100
              </div>
            </div>
          </div>

          {/* Risk gauge */}
          <div style={{ marginBottom: 12 }}>
            <div style={{
              height: 8, borderRadius: 4,
              background: 'var(--bg-surface, #f3f4f6)',
              overflow: 'hidden',
            }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${insurance.riskScore}%` }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: 0.4 }}
                style={{
                  height: '100%', borderRadius: 4,
                  background: 'var(--bg-inset)',
                }}
              />
            </div>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              fontSize: '0.65rem', color: 'var(--text-tertiary, #9ca3af)', marginTop: 4,
            }}>
              <span>Low Risk</span>
              <span>High Risk</span>
            </div>
          </div>

          {/* How risk was calculated */}
          <div style={{
            fontSize: '0.78rem', lineHeight: 1.65,
            color: 'var(--text-secondary, #6b7280)',
            background: 'var(--bg-surface, #f3f4f6)',
            borderRadius: 8, padding: '10px 12px',
            marginBottom: 12,
          }}>
            Risk is calculated from <strong>assessment confidence</strong> ({(assessment.valuationA.confidence * 100).toFixed(0)}% &times; {(assessment.valuationB.confidence * 100).toFixed(0)}%) 
            and <strong>value-to-asking ratio</strong> ({((assessment.assessedValue / assessment.askingPrice) * 100).toFixed(0)}%).
            {insurance.riskScore <= 30 && ' Both signals are strong → low risk → lower premium.'}
            {insurance.riskScore > 30 && insurance.riskScore <= 55 && ' Moderate signals → standard risk → standard premium.'}
            {insurance.riskScore > 55 && ' Weak signals detected → elevated risk → higher premium to compensate.'}
          </div>

          {/* Coverage & Premium breakdown */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
            marginBottom: 12,
          }}>
            <div style={{
              padding: '10px 12px', borderRadius: 8,
              background: 'var(--success-soft)',
              border: '1px solid var(--success)',
            }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary, #9ca3af)', fontWeight: 600 }}>COVERAGE</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                {formatCurrency(insurance.coverageAmount)}
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary, #9ca3af)' }}>
                {((insurance.coverageAmount / assessment.assessedValue) * 100).toFixed(0)}% of AI valuation
              </div>
            </div>
            <div style={{
              padding: '10px 12px', borderRadius: 8,
              background: 'rgba(139,92,246,0.04)',
              border: '1px solid var(--border)',
            }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary, #9ca3af)', fontWeight: 600 }}>MONTHLY PREMIUM</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--red-600)' }}>
                {insurance.premiumCSPR} CSPR
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary, #9ca3af)' }}>
                {insurance.deductiblePercent}% deductible applies
              </div>
            </div>
          </div>

          {/* Risk factors */}
          {insurance.riskFactors.length > 0 && (
            <div style={{
              padding: '10px 12px', borderRadius: 8,
              background: 'var(--warning-soft)',
              border: '1px solid var(--warning)',
            }}>
              <div style={{
                fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-tertiary)',
                marginBottom: 6,
              }}>
                RISK FACTORS IDENTIFIED
              </div>
              {insurance.riskFactors.map((f, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  fontSize: '0.78rem', color: 'var(--text-secondary, #6b7280)',
                  marginBottom: 4,
                }}>
                  <AlertTriangle size={12} color="var(--text-tertiary)" />
                  {f}
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Loan LTV Breakdown */}
      {loan && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.3 }}
          style={{
            background: 'var(--bg-elevated, #fff)',
            border: '1px solid var(--border-color, #e5e7eb)',
            borderRadius: 12,
            padding: '16px',
            borderLeft: '3px solid var(--red-600)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <TrendingUp size={18} color="var(--red-600)" />
            <div>
              <div style={{
                fontSize: '0.72rem', fontWeight: 600, color: 'var(--red-600)',
                letterSpacing: '0.04em', textTransform: 'uppercase',
              }}>
                LTV Decision Explained
              </div>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary, #111)' }}>
                {loan.ltvRatio.toFixed(0)}% Loan-to-Value Ratio
              </div>
            </div>
          </div>

          {/* LTV explanation */}
          <div style={{
            fontSize: '0.78rem', lineHeight: 1.65,
            color: 'var(--text-secondary, #6b7280)',
            background: 'var(--bg-surface, #f3f4f6)',
            borderRadius: 8, padding: '10px 12px',
            marginBottom: 12,
          }}>
            The AI calculated an LTV of <strong>{loan.ltvRatio.toFixed(0)}%</strong> based on the asset's
            assessment confidence and market data quality. This means you can borrow up to{' '}
            <strong>{formatCurrency(loan.loanAmountCSPR)}</strong> against your collateral valued at{' '}
            <strong>{formatCurrency(assessment.assessedValue)}</strong>.
            {loan.ltvRatio <= 65 && ' Conservative LTV protects both you and the platform - lower risk of liquidation.'}
            {loan.ltvRatio > 65 && loan.ltvRatio <= 75 && ' Standard LTV balances borrowing power with safety margins.'}
            {loan.ltvRatio > 75 && ' Higher LTV gives you more capital but leaves less buffer before liquidation.'}
          </div>

          {/* Trust breakdown if available */}
          {loan.trustBreakdown && (
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8,
            }}>
              <div style={{
                padding: '10px', borderRadius: 8,
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary, #9ca3af)', fontWeight: 600 }}>CONFIDENCE</div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--red-600)' }}>
                  {(loan.trustBreakdown.confidence * 100).toFixed(0)}%
                </div>
              </div>
              <div style={{
                padding: '10px', borderRadius: 8,
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary, #9ca3af)', fontWeight: 600 }}>VALUE RATIO</div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--red-600)' }}>
                  {(loan.trustBreakdown.valueRatio * 100).toFixed(0)}%
                </div>
              </div>
              <div style={{
                padding: '10px', borderRadius: 8,
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary, #9ca3af)', fontWeight: 600 }}>LTV RANGE</div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--red-600)' }}>
                  {loan.trustBreakdown.ltvRange}
                </div>
              </div>
            </div>
          )}

          {/* Liquidation warning */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            marginTop: 12, padding: '8px 10px',
            background: 'var(--warning-soft)',
            borderRadius: 6,
            fontSize: '0.72rem', color: 'var(--text-tertiary)',
          }}>
            <AlertTriangle size={13} />
            A Borrow Keeper monitors collateral value every 30 minutes. If LTV exceeds 80%, a margin call is issued. At 90%, automatic liquidation triggers.
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default AgentExplainer;
