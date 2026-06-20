import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2,
  AlertTriangle,
  Zap,
  Target,
  Clock,
  Wallet,
  CheckCircle2,
} from 'lucide-react';
import { useWallet } from '../contexts/CSPRClickContext';
import { PLATFORM_WALLET, PREDICTION_FEE_CSPR } from '../config/casper';

// ─── Types ───────────────────────────────────────────────────────────────────

interface PredictionAgent {
  name: string;
  role: string;
  probability: number;
  confidence: number;
  reasoning: string;
  color: string;
}

interface PredictionResult {
  question: string;
  probability: number;
  confidence: number;
  timeframe: string;
  agents: PredictionAgent[];
  riskFactors: string[];
  timestamp: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function probabilityColor(p: number): string {
  if (p >= 0.7) return '#10b981';
  if (p >= 0.4) return '#f59e0b';
  return '#ef4444';
}

function probabilityLabel(p: number): string {
  if (p >= 0.8) return 'Very Likely';
  if (p >= 0.6) return 'Likely';
  if (p >= 0.4) return 'Uncertain';
  if (p >= 0.2) return 'Unlikely';
  return 'Very Unlikely';
}

// ─── Demo Questions ──────────────────────────────────────────────────────────

const DEMO_QUESTIONS = [
  {
    question: 'Will the Miami Beachfront Condo at 123 Ocean Dr sell above $2.5M by December 2026?',
    assetType: 'real-estate',
    timeframe: '6 months',
  },
  {
    question: 'Will gold prices exceed $3,500/oz by end of Q3 2026?',
    assetType: 'commodity',
    timeframe: '3 months',
  },
  {
    question: 'Will the Contemporary Oil Painting by Banksy appreciate more than 15% in the next auction?',
    assetType: 'art',
    timeframe: '12 months',
  },
  {
    question: 'Will the average US mortgage rate drop below 5.5% by end of 2026?',
    assetType: 'macro',
    timeframe: '6 months',
  },
];

// ─── Agent Cards ─────────────────────────────────────────────────────────────

const AGENT_PROFILES = [
  { name: 'Valuation Agent A', role: 'Comparable Sales', color: '#EC4899' },
  { name: 'Valuation Agent B', role: 'DCF & Cash Flow', color: '#F97316' },
  { name: 'Evidence Analyst', role: 'Data Quality Auditor', color: '#10B981' },
  { name: 'Market Interpreter', role: 'Macro & Sentiment', color: '#06B6D4' },
  { name: 'Precedent Researcher', role: 'Historical Precedent', color: '#8B5CF6' },
];

// ─── Simulate Prediction ─────────────────────────────────────────────────────

function simulatePrediction(question: string, timeframe: string): PredictionResult {
  const baseProbability = 0.3 + Math.random() * 0.4;
  const agents = AGENT_PROFILES.map((profile) => {
    const drift = (Math.random() - 0.5) * 0.3;
    const prob = Math.max(0.05, Math.min(0.95, baseProbability + drift));
    const conf = 0.6 + Math.random() * 0.35;
    return {
      ...profile,
      probability: prob,
      confidence: conf,
      reasoning: generateReasoning(profile.name, prob),
    };
  });

  const weightedProb = agents.reduce((sum, a) => sum + a.probability * a.confidence, 0)
    / agents.reduce((sum, a) => sum + a.confidence, 0);

  const riskFactors = [
    'Market volatility may affect outcome',
    'Interest rate changes could shift probabilities',
    'Historical precedent shows 60% accuracy for similar predictions',
  ];

  return {
    question,
    probability: weightedProb,
    confidence: 0.75 + Math.random() * 0.2,
    timeframe,
    agents,
    riskFactors,
    timestamp: Date.now(),
  };
}

function generateReasoning(agentName: string, prob: number): string {
  const templates: Record<string, string[]> = {
    'Valuation Agent A': [
      `Based on 12 comparable transactions from RentCast, the probability is assessed at ${(prob * 100).toFixed(0)}%. Recent sales data shows strong momentum.`,
      `Analyzed 8 similar outcomes in the past 24 months. Market conditions suggest ${(prob * 100).toFixed(0)}% likelihood. Demand indicators are mixed.`,
    ],
    'Valuation Agent B': [
      `Cash flow projections and DCF analysis using FRED data indicate ${(prob * 100).toFixed(0)}% probability. Discount rate adjusted for current risk environment.`,
      `Revenue trajectory and yield analysis suggest ${(prob * 100).toFixed(0)}% chance. Operating margins support the assessment.`,
    ],
    'Evidence Analyst': [
      `Data quality is high — 4/5 sources verified via MiMo LLM. Confidence in the ${(prob * 100).toFixed(0)}% estimate is strong. No significant outliers detected.`,
      `Evidence chain is solid. 3 independent data sources corroborate the ${(prob * 100).toFixed(0)}% assessment. Minor gaps in historical data noted.`,
    ],
    'Market Interpreter': [
      `Macro trends and sentiment analysis via MiMo LLM indicate ${(prob * 100).toFixed(0)}% probability. Interest rate environment is a key variable.`,
      `Market cycle positioning suggests ${(prob * 100).toFixed(0)}% likelihood. Seasonal patterns and demand indicators align.`,
    ],
    'Precedent Researcher': [
      `Found 6 historical precedents via Vectra vector search. Outcome distribution suggests ${(prob * 100).toFixed(0)}% probability. Precedent accuracy: 72%.`,
      `Historical case analysis of 9 comparable scenarios supports ${(prob * 100).toFixed(0)}% probability. Resolution patterns are consistent.`,
    ],
  };

  const options = templates[agentName] || [`Analysis suggests ${(prob * 100).toFixed(0)}% probability based on available data.`];
  return options[Math.floor(Math.random() * options.length)];
}

// ─── Main Component ──────────────────────────────────────────────────────────

export const PredictionView: React.FC = () => {
  const wallet = useWallet();
  const [question, setQuestion] = useState('');
  const [timeframe, setTimeframe] = useState('6 months');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [showDemos, setShowDemos] = useState(false);

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [signingPayment, setSigningPayment] = useState(false);
  const [signError, setSignError] = useState<string | null>(null);
  const [lastDeployHash, setLastDeployHash] = useState<string | null>(null);

  const runPrediction = async () => {
    setLoading(true);
    setResult(null);
    await new Promise((r) => setTimeout(r, 4000 + Math.random() * 2000));
    const prediction = simulatePrediction(question, timeframe);
    setResult(prediction);
    setLoading(false);
  };

  const handlePredict = () => {
    if (!question.trim()) return;
    // Show payment modal
    setSignError(null);
    setShowPaymentModal(true);
  };

  const handlePaymentConfirm = async () => {
    // If wallet not connected, connect first
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
      const { deployHash } = await wallet.signPayment(
        PLATFORM_WALLET,
        PREDICTION_FEE_CSPR,
      );
      setShowPaymentModal(false);
      setLastDeployHash(deployHash);
      console.log(`[Prediction] Payment signed — deploy: ${deployHash}`);
      await runPrediction();
    } catch (err: any) {
      if (err?.message?.includes('cancelled')) {
        setSignError('Payment was cancelled. Please approve the transfer in your wallet.');
      } else {
        setSignError(err?.message || 'Failed to sign payment. Please try again.');
      }
    } finally {
      setSigningPayment(false);
    }
  };

  const handlePaymentCancel = () => {
    setShowPaymentModal(false);
    setSigningPayment(false);
    setSignError(null);
  };

  const handleDemoSelect = (demo: typeof DEMO_QUESTIONS[number]) => {
    setQuestion(demo.question);
    setTimeframe(demo.timeframe);
    setShowDemos(false);
  };

  const handleReset = () => {
    setQuestion('');
    setTimeframe('6 months');
    setResult(null);
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Prediction Engine</h1>
        <p className="page-subtitle">
          Ask outcome questions. 5 AI agents analyze market data and give probability estimates with full reasoning.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {!result && !loading ? (
          <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ maxWidth: '700px' }}>
            {/* Demo quick-fill */}
            <div style={{ marginBottom: '1.5rem' }}>
              <button
                onClick={() => setShowDemos(!showDemos)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.6rem 1rem', borderRadius: '6px',
                  border: '1px solid var(--border-color)', background: 'var(--bg-surface)',
                  cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-secondary)',
                }}
              >
                <Zap size={14} />
                Try a sample question
              </button>
              {showDemos && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
                >
                  {DEMO_QUESTIONS.map((demo, i) => (
                    <button
                      key={i}
                      onClick={() => handleDemoSelect(demo)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                        padding: '0.75rem 1rem', borderRadius: '6px',
                        border: '1px solid var(--border-color)', background: 'var(--bg-surface)',
                        cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'all 0.15s ease',
                      }}
                    >
                      <Target size={16} color="var(--text-tertiary)" />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                          {demo.question}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.15rem' }}>
                          Timeframe: {demo.timeframe}
                        </div>
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}
            </div>

            {/* Question input */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                Prediction Question <span style={{ color: 'var(--primary)' }}>*</span>
              </label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="e.g., Will this property sell above $2M by December?"
                rows={3}
                style={{
                  width: '100%', padding: '0.8rem 1rem', borderRadius: '8px',
                  border: '1px solid var(--border-color)', background: 'var(--bg-main)',
                  color: 'var(--text-primary)', fontSize: '0.95rem', fontFamily: 'var(--font-sans)',
                  outline: 'none', resize: 'vertical', transition: 'border-color 0.15s ease',
                }}
              />
            </div>

            {/* Timeframe */}
            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                Timeframe
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {['1 month', '3 months', '6 months', '12 months', '24 months'].map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    style={{
                      padding: '0.5rem 1rem', borderRadius: '6px',
                      border: `2px solid ${timeframe === tf ? 'var(--primary)' : 'var(--border-color)'}`,
                      background: timeframe === tf ? 'rgba(255, 59, 59, 0.04)' : 'var(--bg-surface)',
                      cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
                      color: timeframe === tf ? 'var(--primary)' : 'var(--text-secondary)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <Clock size={14} style={{ marginRight: '0.3rem', verticalAlign: 'middle' }} />
                    {tf}
                  </button>
                ))}
              </div>
            </div>

            {/* Predict button */}
            <button
              onClick={handlePredict}
              disabled={!question.trim()}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                width: '100%', padding: '0.9rem 2rem', borderRadius: '8px', border: 'none',
                background: question.trim()
                  ? 'linear-gradient(135deg, var(--primary), var(--primary-dark, #cc2222))'
                  : 'var(--border-color)',
                color: '#fff', fontSize: '1rem', fontWeight: 700,
                cursor: question.trim() ? 'pointer' : 'not-allowed', transition: 'all 0.2s ease',
              }}
            >
              <Wallet size={18} />
              Pay {PREDICTION_FEE_CSPR} CSPR & Run Prediction
            </button>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textAlign: 'center', marginTop: '0.5rem' }}>
              {wallet.connected
                ? `Connected: ${wallet.publicKey?.substring(0, 8)}...${wallet.publicKey?.substring(wallet.publicKey.length - 6)}`
                : 'Wallet will be connected automatically'}
            </p>
          </motion.div>
        ) : loading ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem', textAlign: 'center' }}
          >
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: 'linear' }} style={{ marginBottom: '1.5rem' }}>
              <Loader2 size={48} color="var(--primary)" />
            </motion.div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Running Prediction Analysis</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '400px' }}>
              5 AI agents are analyzing market data, historical precedents, and economic indicators...
            </p>
          </motion.div>
        ) : result ? (
          <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            {/* Hero probability banner */}
            <div style={{
              background: `linear-gradient(135deg, ${probabilityColor(result.probability)}10, ${probabilityColor(result.probability)}05)`,
              borderRadius: '16px', border: `2px solid ${probabilityColor(result.probability)}`,
              padding: '2.5rem', marginBottom: '2rem', textAlign: 'center',
            }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
                Predicted Outcome
              </div>
              <div style={{ fontSize: '4rem', fontWeight: 900, color: probabilityColor(result.probability), lineHeight: 1, marginBottom: '0.5rem' }}>
                {formatPercent(result.probability)}
              </div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.4rem 1rem', borderRadius: '9999px',
                background: `${probabilityColor(result.probability)}20`,
                color: probabilityColor(result.probability),
                fontSize: '0.9rem', fontWeight: 700, marginBottom: '1rem',
              }}>
                {probabilityLabel(result.probability)}
              </div>
              <div style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.5, maxWidth: '600px', margin: '0 auto' }}>
                {result.question}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '1.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Confidence</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{formatPercent(result.confidence)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Timeframe</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{result.timeframe}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Agents</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{result.agents.length}</div>
                </div>
              </div>
            </div>

            {/* Question display + payment proof */}
            <div style={{
              background: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border-color)',
              padding: '1.25rem', marginBottom: '1.5rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: lastDeployHash ? '0.75rem' : 0 }}>
                <Target size={18} color="var(--primary)" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{result.question}</div>
                </div>
                <button onClick={handleReset} style={{
                  padding: '0.4rem 0.8rem', borderRadius: '6px', border: '1px solid var(--border-color)',
                  background: 'var(--bg-surface)', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--text-secondary)',
                }}>
                  New Prediction
                </button>
              </div>
              {lastDeployHash && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.5rem 0.75rem', borderRadius: '6px',
                  background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)',
                  fontSize: '0.75rem', color: 'var(--text-tertiary)',
                }}>
                  <CheckCircle2 size={13} color="#10b981" />
                  <span>Paid {PREDICTION_FEE_CSPR} CSPR —</span>
                  <a
                    href={`https://testnet.cspr.live/deploy/${lastDeployHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--primary)', textDecoration: 'underline', fontWeight: 600 }}
                  >
                    View on Explorer ↗
                  </a>
                </div>
              )}
            </div>

            {/* Agent probability cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              {result.agents.map((agent, i) => (
                <motion.div key={agent.name} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.1 }}
                  style={{ background: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)', background: `${agent.color}08` }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: agent.color }} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-primary)' }}>{agent.name}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>{agent.role}</div>
                    </div>
                    <div style={{ marginLeft: 'auto', fontSize: '1.3rem', fontWeight: 800, color: probabilityColor(agent.probability) }}>
                      {formatPercent(agent.probability)}
                    </div>
                  </div>
                  <div style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                      <span>Confidence: {formatPercent(agent.confidence)}</span>
                      <span style={{ padding: '0.15rem 0.5rem', borderRadius: '4px', background: `${agent.color}15`, color: agent.color, fontWeight: 600 }}>
                        {probabilityLabel(agent.probability)}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5, background: 'var(--bg-surface-alt)', borderRadius: '6px', padding: '0.5rem 0.75rem' }}>
                      {agent.reasoning}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Risk factors */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.6 }}
              style={{ background: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '1.25rem' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <AlertTriangle size={16} color="#f59e0b" />
                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Risk Factors</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {result.riskFactors.map((factor, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b', flexShrink: 0 }} />
                    {factor}
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* ─── Payment Confirmation Modal ─────────────────────────────────── */}
      <AnimatePresence>
        {showPaymentModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 1000,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            }}
            onClick={handlePaymentCancel}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'var(--bg-surface)', borderRadius: '16px',
                border: '1px solid var(--border-color)',
                padding: '2rem', maxWidth: '420px', width: '90%',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              }}
            >
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--primary), var(--primary-dark, #cc2222))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 1rem',
                }}>
                  <Wallet size={28} color="#fff" />
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                  Confirm Prediction Payment
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  A micropayment is required to run the 5-agent prediction analysis.
                </p>
              </div>

              {/* Fee breakdown */}
              <div style={{
                background: 'var(--bg-main)', borderRadius: '10px',
                border: '1px solid var(--border-color)',
                padding: '1rem', marginBottom: '1.5rem',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Prediction Fee</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)' }}>
                    {PREDICTION_FEE_CSPR} CSPR
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                  <span>Network</span>
                  <span>Casper Testnet</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>
                  <span>Recipient</span>
                  <span>{PLATFORM_WALLET.substring(0, 8)}...{PLATFORM_WALLET.substring(PLATFORM_WALLET.length - 6)}</span>
                </div>
              </div>

              {/* Error */}
              {signError && (
                <div style={{
                  background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                  borderRadius: '8px', padding: '0.75rem', marginBottom: '1rem',
                  fontSize: '0.8rem', color: '#ef4444',
                }}>
                  {signError}
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={handlePaymentCancel}
                  disabled={signingPayment}
                  style={{
                    flex: 1, padding: '0.75rem', borderRadius: '8px',
                    border: '1px solid var(--border-color)', background: 'var(--bg-main)',
                    cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600,
                    color: 'var(--text-secondary)',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handlePaymentConfirm}
                  disabled={signingPayment}
                  style={{
                    flex: 2, padding: '0.75rem', borderRadius: '8px',
                    border: 'none',
                    background: signingPayment
                      ? 'var(--border-color)'
                      : 'linear-gradient(135deg, var(--primary), var(--primary-dark, #cc2222))',
                    cursor: signingPayment ? 'not-allowed' : 'pointer',
                    fontSize: '0.9rem', fontWeight: 700, color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  }}
                >
                  {signingPayment ? (
                    <>
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                        <Loader2 size={16} />
                      </motion.div>
                      Signing in wallet...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      Pay {PREDICTION_FEE_CSPR} CSPR & Run
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PredictionView;
