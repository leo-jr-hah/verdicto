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
  insurance?: {
    riskScore: number;
    riskFactors: string[];
    tier: string;
    coverageAmount: number;
    premiumCSPR: number;
    deductiblePercent: number;
  };
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
      className="bg-elevated border rounded-sm overflow-hidden"
    >
      {/* Header */}
      <div
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-3 p-3 cursor-pointer transition-colors"
        style={{ borderLeft: `3px solid ${color}` }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
      >
        {/* Icon */}
        <div
          className="flex items-center justify-center flex-shrink-0 rounded-sm"
          style={{ width: 38, height: 38, background: `${color}12` }}
        >
          <Brain size={18} color={color} />
        </div>

        {/* Info */}
        <div className="flex-1" style={{ minWidth: 0 }}>
          <div className="mono-xs font-semibold uppercase mb-0" style={{ color, letterSpacing: '0.04em' }}>
            {label}
          </div>
          <div className="text-sm font-semibold text-primary">{method}</div>
        </div>

        {/* Value + Confidence */}
        <div className="text-right flex-shrink-0">
          <div className="text-lg font-bold text-primary">{formatCurrency(value)}</div>
          <div className="flex items-center gap-1 justify-end">
            <div className="rounded-full" style={{ width: 6, height: 6, background: confidenceColor(confidence) }} />
            <span className="mono-xs text-tertiary font-medium">
              {(confidence * 100).toFixed(0)}% conf
            </span>
          </div>
        </div>

        <motion.div animate={{ rotate: expanded ? 90 : 0 }} transition={{ duration: 0.15 }}>
          <ChevronRight size={16} className="text-tertiary" />
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
            <div className="p-4 border-t">
              {/* Data Source */}
              <div className="flex items-center gap-1 mono-xs text-tertiary mt-3 mb-2">
                <Database size={12} />
                <span>Data Source: <strong className="text-secondary">{source}</strong></span>
              </div>

              {/* Fallback warning */}
              {fallbackTriggered && (
                <div className="flex items-center gap-1 p-2 mb-2 bg-warning-soft rounded-sm mono-xs text-tertiary">
                  <AlertTriangle size={12} />
                  Fallback to {fallbackProvider || 'deterministic'} response (LLM timeout)
                </div>
              )}

              {/* Reasoning */}
              <div className="text-sm leading-relaxed text-secondary bg-sunken rounded-sm p-3 border">
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
      className="bg-elevated border rounded-sm overflow-hidden"
    >
      <div
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-3 p-3 cursor-pointer"
        style={{ borderLeft: '3px solid var(--red-600)' }}
      >
        <div className="flex items-center justify-center flex-shrink-0 rounded-sm bg-elevated" style={{ width: 38, height: 38 }}>
          <Scale size={18} color="var(--red-600)" />
        </div>
        <div className="flex-1">
          <div className="mono-xs font-semibold text-accent uppercase mb-0" style={{ letterSpacing: '0.04em' }}>
            AI Consensus
          </div>
          <div className="text-sm font-semibold text-primary">
            {verdict?.decision || 'Weighted Average'}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold text-accent">{formatCurrency(assessment.assessedValue)}</div>
          <div className="mono-xs font-semibold" style={{ color: divergenceColor(divergence) }}>
            {divergence.toFixed(1)}% divergence
          </div>
        </div>
        <motion.div animate={{ rotate: expanded ? 90 : 0 }} transition={{ duration: 0.15 }}>
          <ChevronRight size={16} className="text-tertiary" />
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
            <div className="p-4 border-t">
              {/* How consensus works */}
              <div className="bg-sunken rounded-sm p-3 text-sm leading-relaxed text-secondary mb-3">
                <div className="font-semibold text-primary mb-2">How the consensus was reached:</div>
                {divergence <= 15 ? (
                  <span>
                    Both agents <strong className="text-secondary">agreed within 15%</strong>, so the final value is a
                    confidence-weighted average. Agent A's valuation ({formatCurrency(assessment.valuationA.value)}) was weighted at{' '}
                    <strong>{(assessment.valuationA.confidence * 100).toFixed(0)}%</strong> confidence, and Agent B's
                    ({formatCurrency(assessment.valuationB.value)}) at <strong>{(assessment.valuationB.confidence * 100).toFixed(0)}%</strong>.
                  </span>
                ) : (
                  <span>
                    Agents <strong className="text-tertiary">diverged by {divergence.toFixed(1)}%</strong> - a jury
                    panel of 3 independent AI jurors deliberated in 2 rounds. In Round 1, each juror independently
                    evaluated both valuations. In Round 2, jurors reviewed each other's reasoning and revised their
                    votes. Final verdict was weighted by each juror's on-chain reputation score.
                  </span>
                )}
              </div>

              {/* Divergence bar visualization */}
              <div className="mb-2">
                <div className="mono-xs text-tertiary font-semibold mb-2">VALUATION RANGE</div>
                <div className="relative bg-sunken rounded-sm overflow-hidden" style={{ height: 28 }}>
                  {/* Range fill */}
                  <div
                    className="absolute rounded-sm"
                    style={{
                      left: `${(Math.min(assessment.valuationA.value, assessment.valuationB.value) / Math.max(assessment.valuationA.value, assessment.valuationB.value)) * 20}%`,
                      right: '20%',
                      top: 0, bottom: 0,
                      background: 'linear-gradient(90deg, rgba(107,114,128,0.12), rgba(107,114,128,0.22))',
                    }}
                  />
                  {/* Consensus marker */}
                  <div
                    className="absolute rounded-sm"
                    style={{
                      left: `${((assessment.assessedValue - Math.min(assessment.valuationA.value, assessment.valuationB.value)) /
                        (Math.max(assessment.valuationA.value, assessment.valuationB.value) - Math.min(assessment.valuationA.value, assessment.valuationB.value) || 1)) * 60 + 20}%`,
                      top: 2, bottom: 2,
                      width: 3, background: 'var(--text-primary)',
                    }}
                  />
                  {/* Labels */}
                  <div className="absolute text-xs font-bold text-secondary" style={{ left: 8, top: '50%', transform: 'translateY(-50%)' }}>
                    {formatCurrency(Math.min(assessment.valuationA.value, assessment.valuationB.value))}
                  </div>
                  <div className="absolute text-xs font-bold text-secondary" style={{ right: 8, top: '50%', transform: 'translateY(-50%)' }}>
                    {formatCurrency(Math.max(assessment.valuationA.value, assessment.valuationB.value))}
                  </div>
                </div>
              </div>

              {/* Methodology */}
              {assessment.methodology && (
                <div className="mt-3">
                  <div className="mono-xs text-tertiary font-semibold mb-2">
                    {assessment.methodology.title.toUpperCase()}
                  </div>
                  <div className="text-xs text-secondary leading-normal mb-2">
                    {assessment.methodology.description}
                  </div>
                  <div className="flex flex-col gap-1">
                    {assessment.methodology.methods.map((m, i) => (
                      <div key={i} className="flex items-start gap-2 p-2 rounded-sm bg-elevated border">
                        <Zap size={13} color="var(--red-600)" className="mt-0 flex-shrink-0" />
                        <div>
                          <div className="text-xs font-semibold text-primary">{m.name}</div>
                          <div className="mono-xs text-tertiary leading-normal">{m.description}</div>
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
    <div className="flex flex-col gap-2">
      {/* Section header */}
      <div className="flex items-center gap-2 mb-1">
        <Activity size={16} color="var(--primary, var(--navy-500))" />
        <span className="text-sm font-bold text-primary" style={{ letterSpacing: '0.02em' }}>
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
          className="bg-elevated border rounded-sm p-4"
          style={{ borderLeft: `3px solid ${riskColor(insurance.riskScore)}` }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Shield size={18} color={riskColor(insurance.riskScore)} />
            <div>
              <div className="mono-xs font-semibold uppercase" style={{ color: riskColor(insurance.riskScore), letterSpacing: '0.04em' }}>
                Risk Analysis
              </div>
              <div className="text-sm font-semibold text-primary">
                {insurance.tier} - Risk Score {insurance.riskScore}/100
              </div>
            </div>
          </div>

          {/* Risk gauge */}
          <div className="mb-3">
            <div className="bg-sunken rounded-full overflow-hidden" style={{ height: 8 }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${insurance.riskScore}%` }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: 0.4 }}
                className="h-full rounded-full bg-inset"
              />
            </div>
            <div className="flex justify-between mono-xs text-tertiary mt-1">
              <span>Low Risk</span>
              <span>High Risk</span>
            </div>
          </div>

          {/* How risk was calculated */}
          <div className="text-xs leading-relaxed text-secondary bg-sunken rounded-sm p-3 mb-3">
            Risk is calculated from <strong>assessment confidence</strong> ({(assessment.valuationA.confidence * 100).toFixed(0)}% &times; {(assessment.valuationB.confidence * 100).toFixed(0)}%)
            and <strong>value-to-asking ratio</strong> ({((assessment.assessedValue / assessment.askingPrice) * 100).toFixed(0)}%).
            {insurance.riskScore <= 30 && ' Both signals are strong - low risk - lower premium.'}
            {insurance.riskScore > 30 && insurance.riskScore <= 55 && ' Moderate signals - standard risk - standard premium.'}
            {insurance.riskScore > 55 && ' Weak signals detected - elevated risk - higher premium to compensate.'}
          </div>

          {/* Coverage & Premium breakdown */}
          <div className="grid grid-2 gap-2 mb-3">
            <div className="p-3 rounded-sm bg-success-soft border border-success">
              <div className="mono-xs text-tertiary font-semibold">COVERAGE</div>
              <div className="text-base font-bold text-secondary">{formatCurrency(insurance.coverageAmount)}</div>
              <div className="mono-xs text-tertiary">
                {((insurance.coverageAmount / assessment.assessedValue) * 100).toFixed(0)}% of AI valuation
              </div>
            </div>
            <div className="p-3 rounded-sm border bg-elevated">
              <div className="mono-xs text-tertiary font-semibold">MONTHLY PREMIUM</div>
              <div className="text-base font-bold text-accent">{insurance.premiumCSPR} CSPR</div>
              <div className="mono-xs text-tertiary">{insurance.deductiblePercent}% deductible applies</div>
            </div>
          </div>

          {/* Risk factors */}
          {insurance.riskFactors.length > 0 && (
            <div className="p-3 rounded-sm bg-warning-soft border border-warning">
              <div className="mono-xs font-semibold text-tertiary mb-2">RISK FACTORS IDENTIFIED</div>
              {insurance.riskFactors.map((f, i) => (
                <div key={i} className="flex items-center gap-1 text-xs text-secondary mb-1">
                  <AlertTriangle size={12} className="text-tertiary" />
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
          className="bg-elevated border rounded-sm p-4"
          style={{ borderLeft: '3px solid var(--red-600)' }}
        >
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={18} color="var(--red-600)" />
            <div>
              <div className="mono-xs font-semibold text-accent uppercase" style={{ letterSpacing: '0.04em' }}>
                LTV Decision Explained
              </div>
              <div className="text-sm font-semibold text-primary">
                {loan.ltvRatio.toFixed(0)}% Loan-to-Value Ratio
              </div>
            </div>
          </div>

          {/* LTV explanation */}
          <div className="text-xs leading-relaxed text-secondary bg-sunken rounded-sm p-3 mb-3">
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
            <div className="grid grid-3 gap-2">
              <div className="p-2 rounded-sm bg-elevated border text-center">
                <div className="mono-xs text-tertiary font-semibold">CONFIDENCE</div>
                <div className="text-base font-bold text-accent">
                  {(loan.trustBreakdown.confidence * 100).toFixed(0)}%
                </div>
              </div>
              <div className="p-2 rounded-sm bg-elevated border text-center">
                <div className="mono-xs text-tertiary font-semibold">VALUE RATIO</div>
                <div className="text-base font-bold text-accent">
                  {(loan.trustBreakdown.valueRatio * 100).toFixed(0)}%
                </div>
              </div>
              <div className="p-2 rounded-sm bg-elevated border text-center">
                <div className="mono-xs text-tertiary font-semibold">LTV RANGE</div>
                <div className="text-base font-bold text-accent">
                  {loan.trustBreakdown.ltvRange}
                </div>
              </div>
            </div>
          )}

          {/* Liquidation warning */}
          <div className="flex items-center gap-1 mt-3 p-2 bg-warning-soft rounded-sm mono-xs text-tertiary">
            <AlertTriangle size={13} />
            A Borrow Keeper monitors collateral value every 30 minutes. If LTV exceeds 80%, a margin call is issued. At 90%, automatic liquidation triggers.
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default AgentExplainer;
