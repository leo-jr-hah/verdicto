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
  TrendingUp,
  ChevronRight,
  RefreshCw,
  ExternalLink,
  ArrowRight,
} from 'lucide-react';
import { useWallet } from '../contexts/CSPRClickContext';
import { PREDICTION_FEE_CSPR } from '../config/casper';
import PaymentModal from '../components/PaymentModal';
import { usePaymentFlow } from '../hooks/usePaymentFlow';
import {
  submitPrediction,
  type PredictionResult as APIPredictionResult,
  type PredictionAgent as APIPredictionAgent,
} from '../services/api';

// ─── Types (re-exported from API) ───────────────────────────────────────────

type PredictionAgent = APIPredictionAgent;
type PredictionResult = APIPredictionResult;

// ─── Helpers ───────────────────────────────────────────────────────────────

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function probabilityColor(p: number): string {
  if (p >= 0.7) return 'var(--text-secondary)';
  if (p >= 0.4) return 'var(--text-tertiary)';
  return 'var(--red-600)';
}

function probabilityLabel(p: number): string {
  if (p >= 0.8) return 'Very Likely';
  if (p >= 0.6) return 'Likely';
  if (p >= 0.4) return 'Uncertain';
  if (p >= 0.2) return 'Unlikely';
  return 'Very Unlikely';
}

// ─── Constants ─────────────────────────────────────────────────────────────

const TIMEFRAMES = ['1 month', '3 months', '6 months', '12 months', '24 months'];

const DEMO_QUESTIONS = [
  {
    question: 'Will the Miami Beachfront Condo at 123 Ocean Dr sell above $2.5M by December 2026?',
    assetType: 'real-estate',
    timeframe: '6 months',
    icon: '🏠',
  },
  {
    question: 'Will gold prices exceed $3,500/oz by end of Q3 2026?',
    assetType: 'commodity',
    timeframe: '3 months',
    icon: '🥇',
  },
  {
    question: 'Will the Contemporary Oil Painting by Banksy appreciate more than 15% in the next auction?',
    assetType: 'art',
    timeframe: '12 months',
    icon: '🎨',
  },
  {
    question: 'Will the average US mortgage rate drop below 5.5% by end of 2026?',
    assetType: 'macro',
    timeframe: '6 months',
    icon: '📈',
  },
];

const AGENT_PROFILES = [
  { name: 'Valuation Agent A', role: 'Comparable Sales', color: 'var(--text-secondary)' },
  { name: 'Valuation Agent B', role: 'DCF & Cash Flow', color: 'var(--text-tertiary)' },
  { name: 'Evidence Analyst', role: 'Data Quality Auditor', color: 'var(--text-secondary)' },
  { name: 'Market Interpreter', role: 'Macro & Sentiment', color: 'var(--text-tertiary)' },
  { name: 'Precedent Researcher', role: 'Historical Precedent', color: 'var(--text-secondary)' },
];

// ─── Probability Ring ──────────────────────────────────────────────────────

const ProbabilityRing: React.FC<{ value: number; size?: number }> = ({ value, size = 140 }) => {
  const r = (size - 12) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - value);
  const color = probabilityColor(value);

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={8} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color} strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.5 }}
          style={{ fontSize: size * 0.22, fontWeight: 900, color, lineHeight: 1 }}
        >
          {formatPercent(value)}
        </motion.div>
        <div style={{ fontSize: size * 0.08, color: 'var(--text-tertiary)', fontWeight: 500, marginTop: 4 }}>
          {probabilityLabel(value)}
        </div>
      </div>
    </div>
  );
};

// ─── Agent Probability Bar ─────────────────────────────────────────────────

const AgentBar: React.FC<{ agent: PredictionAgent; index: number }> = ({ agent, index }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.08 }}
      onClick={() => setExpanded(!expanded)}
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--card-radius)',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'border-color 0.15s ease',
      }}
      onMouseEnter={(e) => e.currentTarget.style.borderColor = `${agent.color}50`}
      onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 16px',
      }}>
        {/* Agent dot + info */}
        <div style={{
          width: 36, height: 36, borderRadius: 8,
          background: `${agent.color}12`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: agent.color }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
            {agent.name}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
            {agent.role}
          </div>
        </div>

        {/* Bar visualization */}
        <div style={{ flex: '0 0 120px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <div style={{ fontSize: '1rem', fontWeight: 800, color: probabilityColor(agent.probability) }}>
            {formatPercent(agent.probability)}
          </div>
          <div style={{
            width: '100%', height: 4, borderRadius: 2,
            background: 'var(--border)',
            overflow: 'hidden',
          }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${agent.probability * 100}%` }}
              transition={{ duration: 0.8, delay: index * 0.1 + 0.3 }}
              style={{ height: '100%', borderRadius: 2, background: agent.color }}
            />
          </div>
        </div>

        <ChevronRight
          size={16}
          color="var(--text-tertiary)"
          style={{
            transition: 'transform 0.2s ease',
            transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
          }}
        />
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
              padding: '0 16px 14px',
              borderTop: '1px solid var(--border-color-subtle, var(--border))',
              marginTop: 0, paddingTop: 12,
            }}>
              <div style={{ display: 'flex', gap: 16, marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', fontWeight: 500 }}>CONFIDENCE</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {formatPercent(agent.confidence)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', fontWeight: 500 }}>SIGNAL</div>
                  <div style={{
                    display: 'inline-block',
                    padding: '2px 8px', borderRadius: 4,
                    background: `${probabilityColor(agent.probability)}15`,
                    color: probabilityColor(agent.probability),
                    fontSize: '0.75rem', fontWeight: 600,
                  }}>
                    {probabilityLabel(agent.probability)}
                  </div>
                </div>
              </div>
              <div style={{
                fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6,
                background: 'var(--bg-elevated)',
                borderRadius: 8, padding: '10px 12px',
                border: '1px solid var(--border-color-subtle, var(--border))',
              }}>
                {agent.reasoning}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────

export const PredictionView: React.FC = () => {
  const wallet = useWallet();
  const [question, setQuestion] = useState('');
  const [timeframe, setTimeframe] = useState('6 months');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [showDemos, setShowDemos] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastDeployHash, setLastDeployHash] = useState<string | null>(null);

  // Payment flow (shared hook)
  const payment = usePaymentFlow(wallet.signPayment, PREDICTION_FEE_CSPR, async (paymentProof, deployHash) => {
    setLastDeployHash(deployHash);
    await runPrediction(paymentProof);
  });

  const runPrediction = async (paymentProof?: string) => {
    setLoading(true);
    setResult(null);
    setError(null);

    const response = await submitPrediction(
      { question, timeframe, assetType: undefined },
      paymentProof,
    );

    if (response.status === 'success') {
      setResult(response.prediction);
    } else if (response.status === 'payment_required') {
      payment.openModal();
      setLoading(false);
      return;
    } else {
      setError(response.error);
    }
    setLoading(false);
  };

  const handlePredict = () => {
    if (!question.trim()) return;
    runPrediction();
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

  const walletDisplay = wallet.connected
    ? `${wallet.publicKey?.substring(0, 8)}...${wallet.publicKey?.substring(wallet.publicKey.length - 6)}`
    : null;

  return (
    <div style={{
      padding: 'var(--page-padding-y) var(--page-padding-x)',
      maxWidth: 'var(--page-max-width)',
      margin: '0 auto',
    }}>
      <AnimatePresence mode="wait">
        {/* ─── INPUT STATE ─────────────────────────────────────── */}
        {!result && !loading && !error ? (
          <motion.div
            key="input"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              maxWidth: 720,
              margin: '0 auto',
            }}
          >
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <h1 style={{
                fontSize: '1.8rem', fontWeight: 700,
                color: 'var(--text-primary)', marginBottom: 8,
              }}>
                Confidence Analysis
              </h1>
              <p style={{
                color: 'var(--text-secondary)',
                fontSize: '0.95rem', lineHeight: 1.6,
                maxWidth: 520, margin: '0 auto',
              }}>
                Ask any outcome question about RWA assets. Multiple AI agents independently estimate probability, producing a weighted confidence score that feeds into Oracle verdicts.
              </p>
            </div>

            {/* Main Form Card */}
            <div style={{
              width: '100%',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--card-radius)',
              padding: '24px 28px',
              boxShadow: 'var(--shadow-sm)',
            }}>
              {/* Question Input */}
              <div style={{ marginBottom: 20 }}>
                <label style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  fontSize: '0.82rem', fontWeight: 600,
                  color: 'var(--text-primary)', marginBottom: 8,
                }}>
                  <Target size={14} color="var(--accent)" />
                  Confidence Question
                </label>
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="e.g., Will this property sell above $2M by December 2026?"
                  rows={3}
                  style={{
                    width: '100%', padding: '12px 14px', borderRadius: 10,
                    border: '1.5px solid var(--border)',
                    background: 'var(--bg-elevated)',
                    color: 'var(--text-primary)', fontSize: '0.95rem',
                    fontFamily: 'var(--font-sans)',
                    outline: 'none', resize: 'vertical',
                    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                    lineHeight: 1.5,
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'var(--accent)';
                    e.currentTarget.style.boxShadow = '0 0 0 3px var(--accent-soft)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* Timeframe Row */}
              <div style={{ marginBottom: 24 }}>
                <label style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  fontSize: '0.82rem', fontWeight: 600,
                  color: 'var(--text-primary)', marginBottom: 10,
                }}>
                  <Clock size={14} />
                  Timeframe
                </label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {TIMEFRAMES.map((tf) => {
                    const active = timeframe === tf;
                    return (
                      <button
                        key={tf}
                        onClick={() => setTimeframe(tf)}
                        style={{
                          padding: '8px 16px', borderRadius: 8,
                          border: `1.5px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                          background: active ? 'var(--accent-soft)' : 'var(--bg-elevated)',
                          cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
                          color: active ? 'var(--accent)' : 'var(--text-secondary)',
                          transition: 'all 0.15s ease',
                          display: 'flex', alignItems: 'center', gap: 5,
                        }}
                      >
                        <Clock size={13} style={{ opacity: active ? 1 : 0.5 }} />
                        {tf}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Divider */}
              <div style={{
                height: 1, background: 'var(--border)',
                margin: '0 -28px 20px',
              }} />

              {/* Action Row */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 16,
              }}>
                <button
                  onClick={handlePredict}
                  disabled={!question.trim()}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '12px 28px', borderRadius: 10, border: 'none',
                    background: question.trim()
                      ? 'linear-gradient(135deg, var(--accent), var(--primary-dark, #cc2222))'
                      : 'var(--border)',
                    color: 'var(--text-inverse)', fontSize: '0.95rem', fontWeight: 700,
                    cursor: question.trim() ? 'pointer' : 'not-allowed',
                    transition: 'all 0.2s ease',
                    boxShadow: question.trim() ? '0 2px 8px var(--accent-glow)' : 'none',
                  }}
                >
                  <Wallet size={16} />
                  Pay {PREDICTION_FEE_CSPR} CSPR & Run Analysis
                  <ArrowRight size={16} />
                </button>

                <div style={{
                  fontSize: '0.78rem', color: 'var(--text-tertiary)',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  {walletDisplay ? (
                    <>
                      <div style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: 'var(--text-secondary)',
                      }} />
                      {walletDisplay}
                    </>
                  ) : (
                    <>
                      <Wallet size={13} />
                      Wallet connects automatically
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Sample Questions Section */}
            <div style={{ width: '100%', marginTop: 20 }}>
              <button
                onClick={() => setShowDemos(!showDemos)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 16px', borderRadius: 8,
                  border: '1px dashed var(--border)',
                  background: 'transparent',
                  cursor: 'pointer', fontSize: '0.82rem',
                  color: 'var(--text-tertiary)',
                  transition: 'all 0.15s ease',
                  width: '100%', justifyContent: 'center',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent)';
                  e.currentTarget.style.color = 'var(--accent)';
                  e.currentTarget.style.background = 'var(--accent-soft)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.color = 'var(--text-tertiary)';
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <Zap size={14} />
                {showDemos ? 'Hide sample questions' : 'Try a sample question'}
              </button>

              <AnimatePresence>
                {showDemos && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div className="prediction-demo-grid">
                      {DEMO_QUESTIONS.map((demo, i) => (
                        <motion.button
                          key={i}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          onClick={() => handleDemoSelect(demo)}
                          style={{
                            display: 'flex', alignItems: 'flex-start', gap: 10,
                            padding: '14px 16px', borderRadius: 10,
                            border: '1px solid var(--border)',
                            background: 'var(--bg-elevated)',
                            cursor: 'pointer', textAlign: 'left',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = 'var(--accent)';
                            e.currentTarget.style.boxShadow = '0 2px 8px var(--accent-soft)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'var(--border)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          <span style={{ fontSize: '1.2rem', lineHeight: 1, flexShrink: 0 }}>
                            {demo.icon}
                          </span>
                          <div style={{ minWidth: 0 }}>
                            <div style={{
                              fontWeight: 600, fontSize: '0.82rem',
                              color: 'var(--text-primary)',
                              lineHeight: 1.4,
                            }}>
                              {demo.question}
                            </div>
                            <div style={{
                              fontSize: '0.72rem', color: 'var(--text-tertiary)',
                              marginTop: 4, display: 'flex', gap: 8,
                            }}>
                              <span>{demo.assetType}</span>
                              <span>·</span>
                              <span>{demo.timeframe}</span>
                            </div>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ) : loading ? (
          /* ─── LOADING STATE ───────────────────────────────────── */
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              padding: '6rem 2rem', textAlign: 'center',
            }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
              style={{ marginBottom: 20 }}
            >
              <Loader2 size={48} color="var(--accent)" />
            </motion.div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>
              Running Confidence Analysis
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: 400, lineHeight: 1.5 }}>
              Multiple AI agents are analyzing market data, historical precedents, and economic indicators to produce a confidence score...
            </p>
            <div style={{
              display: 'flex', gap: 8, marginTop: 24, flexWrap: 'wrap', justifyContent: 'center',
            }}>
              {AGENT_PROFILES.map((ap) => (
                <motion.div
                  key={ap.name}
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ repeat: Infinity, duration: 1.5, delay: Math.random() * 0.5 }}
                  style={{
                    padding: '6px 12px', borderRadius: 6,
                    background: `${ap.color}10`,
                    border: `1px solid ${ap.color}25`,
                    fontSize: '0.72rem', fontWeight: 600, color: ap.color,
                  }}
                >
                  {ap.role}
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : error ? (
          /* ─── ERROR STATE ─────────────────────────────────────── */
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              padding: '6rem 2rem', textAlign: 'center',
              maxWidth: 500, margin: '0 auto',
            }}
          >
            <AlertTriangle size={48} color="var(--error)" style={{ marginBottom: 20 }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>
              Analysis Failed
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: 24 }}>
              {error.includes('Unexpected token') || error.includes('JSON')
                ? 'Could not connect to the Verdicto backend. The confidence analysis service may be temporarily offline. Please try again in a moment.'
                : error}
            </p>
            <button
              onClick={handleReset}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 24px', borderRadius: 8, border: '1px solid var(--border)',
                background: 'var(--bg-elevated)', cursor: 'pointer',
                fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)',
              }}
            >
              <RefreshCw size={14} />
              Try Again
            </button>
          </motion.div>
        ) : result ? (
          /* ─── RESULT STATE ────────────────────────────────────── */
          <motion.div
            key="result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            {/* Top Bar: Question + Reset */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: 24, gap: 16, flexWrap: 'wrap',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                <Target size={18} color="var(--accent)" style={{ flexShrink: 0 }} />
                <div style={{
                  fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {result.question}
                </div>
                <span style={{
                  fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px',
                  borderRadius: 6, background: 'var(--warning-soft)',
                  color: 'var(--warning)', border: '1px solid var(--warning)',
                  flexShrink: 0, letterSpacing: '0.05em',
                }}>DEMO</span>
              </div>
              <button onClick={handleReset} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 16px', borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--bg-elevated)', cursor: 'pointer',
                fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)',
                transition: 'all 0.15s ease',
                flexShrink: 0,
              }}>
                <RefreshCw size={14} />
                New Analysis
              </button>
            </div>

            {/* Hero: Probability Ring + Stats */}
            <div className="prediction-hero-grid"
              style={{
                gap: 32, alignItems: 'center',
                background: 'var(--bg-elevated)',
                border: `1px solid ${probabilityColor(result.probability)}30`,
                borderRadius: 'var(--card-radius)',
                padding: '32px 36px',
                marginBottom: 24,
              }}>
              <ProbabilityRing value={result.probability} size={160} />

              <div>
                <div style={{
                  fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-tertiary)',
                  textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12,
                }}>
                  Confidence Assessment
                </div>

                <div className="prediction-stats-grid"
                  style={{
                    gap: 16,
                  }}>
                  {[
                    { label: 'Confidence', value: formatPercent(result.confidence), icon: <TrendingUp size={14} /> },
                    { label: 'Timeframe', value: result.timeframe, icon: <Clock size={14} /> },
                    { label: 'Agents', value: `${result.agents.length} analyzed`, icon: <Target size={14} /> },
                  ].map((stat) => (
                    <div key={stat.label} style={{
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border)',
                      borderRadius: 10, padding: '14px 16px',
                    }}>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        fontSize: '0.68rem', color: 'var(--text-tertiary)',
                        fontWeight: 500, marginBottom: 6,
                      }}>
                        {stat.icon}
                        {stat.label.toUpperCase()}
                      </div>
                      <div style={{
                        fontSize: '1.05rem', fontWeight: 700,
                        color: 'var(--text-primary)',
                      }}>
                        {stat.value}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Payment proof */}
                {lastDeployHash && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    marginTop: 16, padding: '8px 12px', borderRadius: 8,
                    background: 'var(--success-soft)',
                    border: '1px solid var(--success)',
                    fontSize: '0.78rem', color: 'var(--text-tertiary)',
                  }}>
                    <CheckCircle2 size={14} color="var(--text-secondary)" />
                    <span>Paid {PREDICTION_FEE_CSPR} CSPR</span>
                    <a
                      href={`https://testnet.cspr.live/deploy/${lastDeployHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: 'var(--accent)', textDecoration: 'none',
                        fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3,
                      }}
                    >
                      Explorer <ExternalLink size={11} />
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Agent Analysis Section */}
            <div style={{ marginBottom: 20 }}>
              <h3 style={{
                fontSize: '1rem', fontWeight: 700,
                color: 'var(--text-primary)', marginBottom: 12,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                Agent Analysis
                <span style={{
                  fontSize: '0.7rem', fontWeight: 500, color: 'var(--text-tertiary)',
                  padding: '2px 8px', borderRadius: 4,
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                }}>
                  {result.agents.length} agents
                </span>
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {result.agents.map((agent, i) => (
                  <AgentBar key={agent.name} agent={agent} index={i} />
                ))}
              </div>
            </div>

            {/* Risk Factors */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              style={{
                background: 'var(--bg-elevated)',
                borderRadius: 'var(--card-radius)',
                border: '1px solid var(--border)',
                padding: '18px 22px',
              }}
            >
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                marginBottom: 12,
              }}>
                <AlertTriangle size={16} color="var(--text-tertiary)" />
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                  Risk Factors
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {result.riskFactors.map((factor, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    fontSize: '0.82rem', color: 'var(--text-secondary)',
                    padding: '8px 12px', borderRadius: 8,
                    background: 'var(--warning-soft)',
                    border: '1px solid var(--warning)',
                  }}>
                    <div style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: 'var(--text-tertiary)', flexShrink: 0,
                    }} />
                    {factor}
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* ─── Payment Modal ──────────────────────────────────────── */}
      <PaymentModal
        open={payment.showModal}
        title="Confirm Payment"
        description="Micropayment required to run the 5-agent prediction analysis."
        feeLabel="Prediction Fee"
        feeAmount={PREDICTION_FEE_CSPR}
        features={[
          '5-agent prediction analysis',
          'Multi-methodology consensus',
          'On-chain verdict with receipt',
        ]}
        signing={payment.signing}
        signError={payment.signError}
        signErrorHint={payment.signErrorHint}
        onConfirm={payment.confirm}
        onCancel={payment.cancel}
      />
    </div>
  );
};

export default PredictionView;
