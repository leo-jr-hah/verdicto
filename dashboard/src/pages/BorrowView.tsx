import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Landmark,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  RotateCcw,
  DollarSign,
  RefreshCw,
  Info,
  AlertCircle,
  XCircle,
  FileText,
  Building2,
  Palette,
  Gem,
  Zap,
} from 'lucide-react';
import { useWallet } from '../contexts/CSPRClickContext';
import { useLoan } from '../hooks/useLoan';
import { useAssessment } from '../hooks/useAssessment';
import {
  type AssetType,
  type LoanCreateRequest,
  type Loan,
  type AssessmentRequest,
} from '../services/api';
import { PLATFORM_WALLET, LOAN_FEE_CSPR, ASSESSMENT_FEE_CSPR } from '../config/casper';
import { AgentExplainer } from '../components/AgentExplainer';

// ─── Constants ───────────────────────────────────────────────────────────────

const ASSET_TYPES: Array<{
  id: AssetType;
  label: string;
  icon: React.ReactNode;
  demo: {
    name: string;
    description: string;
    value: string;
    ltv: string;
    location?: string;
    artistOrMedium?: string;
    weightOz?: number;
  };
}> = [
  {
    id: 'real-estate',
    label: 'Real Estate',
    icon: <Building2 size={20} />,
    demo: {
      name: 'Downtown Austin Office Tower',
      description: '12-story Class A office building at 200 Congress Ave, Austin TX. Built 2018, 95% occupied with 8-year NNN leases. NOI $2.1M/yr. Recent appraisal $14.2M.',
      value: '1420000',
      ltv: '65',
      location: 'Austin, TX',
    },
  },
  {
    id: 'art',
    label: 'Fine Art',
    icon: <Palette size={20} />,
    demo: {
      name: 'Basquiat Untitled (Skull), 1981',
      description: 'Acrylic and oilstick on canvas, 72×68 in. Provenance: Galerie Thaddeus Ropac → Private European collection → Current owner. Authenticated by Basquiat Authentication Committee. Last sold at Sotheby\'s 2017 for $110.5M.',
      value: '120000000',
      ltv: '35',
      artistOrMedium: 'Jean-Michel Basquiat, Acrylic and oilstick on canvas',
    },
  },
  {
    id: 'commodity',
    label: 'Commodity',
    icon: <Gem size={20} />,
    demo: {
      name: 'LBMA Gold Bar - 400 oz',
      description: 'London Bullion Market Association certified, 995.0 fine gold bar. Serial #AU-2024-8847. Stored in Brink\'s London vault. Current spot: $2,340/oz. Assay certificate and chain of custody documentation included.',
      value: '936000',
      ltv: '80',
      weightOz: 400,
    },
  },
];

const LTV_TIERS: Record<AssetType, string> = {
  'real-estate': '60-75%',
  'art': '30-50%',
  'commodity': '70-85%',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function healthColor(ratio: number): string {
  if (ratio >= 1.5) return '#10b981';
  if (ratio >= 1.2) return '#f59e0b';
  return '#ef4444';
}

function healthLabel(ratio: number): string {
  if (ratio >= 1.5) return 'Healthy';
  if (ratio >= 1.2) return 'At Risk';
  return 'Liquidation Risk';
}

function statusColor(status: string): string {
  switch (status) {
    case 'active': case 'healthy': return '#10b981';
    case 'warning': return '#f59e0b';
    case 'repaid': return '#3b82f6';
    case 'liquidated': return '#ef4444';
    default: return '#8b949e';
  }
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const tooltipStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: 'calc(100% + 8px)',
  left: '50%',
  transform: 'translateX(-50%)',
  background: 'var(--bg-surface, #1a1a2e)',
  border: '1px solid var(--border-color)',
  borderRadius: '8px',
  padding: '0.75rem 1rem',
  fontSize: '0.8rem',
  lineHeight: 1.5,
  color: 'var(--text-secondary)',
  width: '280px',
  boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
  zIndex: 100,
  pointerEvents: 'none',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.7rem 0.9rem',
  borderRadius: '6px',
  border: '1px solid var(--border-color)',
  background: 'var(--bg-main)',
  color: 'var(--text-primary)',
  fontSize: '0.95rem',
  fontFamily: 'var(--font-sans)',
  outline: 'none',
  transition: 'border-color 0.15s ease',
};

const btnPrimary: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.5rem',
  padding: '0.75rem 1.5rem',
  borderRadius: '8px',
  border: 'none',
  background: 'var(--primary)',
  color: '#fff',
  fontSize: '0.95rem',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.15s ease',
};

const btnSecondary: React.CSSProperties = {
  ...btnPrimary,
  background: 'var(--bg-surface)',
  color: 'var(--text-primary)',
  border: '1px solid var(--border-color)',
};

const cardStyle: React.CSSProperties = {
  background: 'var(--bg-surface)',
  border: '1px solid var(--border-color)',
  borderRadius: '12px',
  padding: '1.5rem',
};

// ─── LTV Tooltip ─────────────────────────────────────────────────────────────

const LTVTooltip: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [show, setShow] = useState(false);
  return (
    <span
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', cursor: 'help' }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      <Info size={14} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
      {show && (
        <span style={tooltipStyle}>
          <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '0.25rem' }}>
            Loan-to-Value (LTV) Ratio
          </strong>
          LTV measures the loan amount as a percentage of the asset's appraised value.
          For example, a 65% LTV on a $1M asset means you can borrow up to $650K.
          <br /><br />
          <strong style={{ color: 'var(--text-primary)' }}>Lower LTV = safer loan</strong> - you keep more equity,
          and lenders offer better rates. Higher LTV means more leverage but higher liquidation risk.
        </span>
      )}
    </span>
  );
};

// ─── Step Indicator ──────────────────────────────────────────────────────────

const StepIndicator: React.FC<{ current: number; steps: string[] }> = ({ current, steps }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
    {steps.map((label, i) => (
      <React.Fragment key={i}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.4rem',
          color: i <= current ? 'var(--primary)' : 'var(--text-tertiary)',
          fontWeight: i === current ? 700 : 500,
          fontSize: '0.85rem',
        }}>
          <div style={{
            width: 24, height: 24, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: i < current ? 'var(--primary)' : i === current ? 'rgba(255,59,59,0.1)' : 'var(--bg-main)',
            color: i < current ? '#fff' : i === current ? 'var(--primary)' : 'var(--text-tertiary)',
            fontSize: '0.75rem', fontWeight: 700,
          }}>
            {i < current ? <CheckCircle2 size={14} /> : i + 1}
          </div>
          <span>{label}</span>
        </div>
        {i < steps.length - 1 && (
          <div style={{
            flex: 1, height: 2,
            background: i < current ? 'var(--primary)' : 'var(--border-color)',
          }} />
        )}
      </React.Fragment>
    ))}
  </div>
);

// ─── Loan Card ───────────────────────────────────────────────────────────────

const LoanCard: React.FC<{
  loan: Loan;
  onRepay: (loanId: string) => void;
  onRevalue: (loanId: string) => void;
  loading: boolean;
}> = ({ loan, onRepay, onRevalue, loading }) => {
  const health = loan.healthRatio ?? 1.5;
  const ltv = loan.ltvRatio;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ ...cardStyle, marginBottom: '1rem' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>
            Loan #{loan.loanId.slice(0, 8)}
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            ${loan.loanAmountCSPR.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
        </div>
        <span style={{
          padding: '0.25rem 0.75rem',
          borderRadius: '999px',
          fontSize: '0.75rem',
          fontWeight: 600,
          background: `${statusColor(loan.status)}15`,
          color: statusColor(loan.status),
          textTransform: 'capitalize',
        }}>
          {loan.status}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '0.2rem' }}>Collateral</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{formatCurrency(loan.assessedValue)}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '0.2rem' }}><LTVTooltip>LTV</LTVTooltip></div>
          <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{(ltv * 100).toFixed(0)}%</div>
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '0.2rem' }}>Health</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 600, color: healthColor(health) }}>
            {health.toFixed(2)}x - {healthLabel(health)}
          </div>
        </div>
      </div>

      {/* Verdicto Point 1: Trust breakdown - shows why LTV is what it is */}
      {loan.trustBreakdown && (
        <div style={{
          padding: '0.75rem 1rem',
          background: 'var(--bg-main)',
          borderRadius: '8px',
          marginBottom: '1rem',
          fontSize: '0.8rem',
        }}>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            Trust-Score LTV Breakdown
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', color: 'var(--text-secondary)' }}>
            <span>Confidence: <strong>{(loan.trustBreakdown.confidence * 100).toFixed(0)}%</strong></span>
            <span>Value Ratio: <strong>{(loan.trustBreakdown.valueRatio * 100).toFixed(0)}%</strong></span>
            <span>LTV Range: <strong>{loan.trustBreakdown.ltvRange}</strong></span>
          </div>
        </div>
      )}

      {/* Verdicto Point 2: Escrow tx hashes - visible on-chain proof */}
      {(loan.escrowLockTxHash || loan.escrowReleaseTxHash) && (
        <div style={{
          padding: '0.75rem 1rem',
          background: 'var(--bg-main)',
          borderRadius: '8px',
          marginBottom: '1rem',
          fontSize: '0.8rem',
        }}>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            Escrow Transactions
          </div>
          {loan.escrowLockTxHash && (
            <div style={{ color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
              🔒 Lock: <code style={{ fontSize: '0.75rem', background: 'var(--bg-surface)', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>
                {loan.escrowLockTxHash.slice(0, 16)}...
              </code>
            </div>
          )}
          {loan.escrowReleaseTxHash && (
            <div style={{ color: 'var(--text-secondary)' }}>
              🔓 Release: <code style={{ fontSize: '0.75rem', background: 'var(--bg-surface)', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>
                {loan.escrowReleaseTxHash.slice(0, 16)}...
              </code>
            </div>
          )}
        </div>
      )}

      {/* Verdicto Point 3: Revaluation history - shows juror deliberation */}
      {loan.revaluationHistory && loan.revaluationHistory.length > 0 && (
        <div style={{
          padding: '0.75rem 1rem',
          background: 'var(--bg-main)',
          borderRadius: '8px',
          marginBottom: '1rem',
          fontSize: '0.8rem',
        }}>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            Revaluation History ({loan.revaluationHistory.length})
          </div>
          {loan.revaluationHistory.slice(-3).map((rev, i) => (
            <div key={i} style={{
              padding: '0.5rem',
              background: 'var(--bg-surface)',
              borderRadius: '6px',
              marginBottom: '0.5rem',
              borderLeft: `3px solid ${rev.status === 'warning' ? '#f59e0b' : rev.status === 'liquidated' ? '#ef4444' : '#10b981'}`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>
                  {new Date(rev.timestamp).toLocaleString()}
                </span>
                <span style={{ color: rev.previousValue <= rev.newValue ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                  {rev.previousValue <= rev.newValue ? '+' : ''}{((rev.newValue - rev.previousValue) / rev.previousValue * 100).toFixed(1)}%
                </span>
              </div>
              <div style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>
                Agent A ({rev.valuationA.method}): ${rev.valuationA.value.toLocaleString()} | 
                Agent B ({rev.valuationB.method}): ${rev.valuationB.value.toLocaleString()}
              </div>
              {rev.deliberationReceiptHash && (
                <div style={{ color: 'var(--text-tertiary)', fontSize: '0.7rem', marginTop: '0.25rem' }}>
                  📜 Receipt: {rev.deliberationReceiptHash.slice(0, 16)}...
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Health bar */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ height: 6, borderRadius: 3, background: 'var(--bg-main)', overflow: 'hidden' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min((health / 2) * 100, 100)}%` }}
            transition={{ duration: 0.5 }}
            style={{ height: '100%', background: healthColor(health), borderRadius: 3 }}
          />
        </div>
      </div>

      {loan.status === 'active' && (
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => onRepay(loan.loanId)}
            disabled={loading}
            style={{ ...btnPrimary, flex: 1, fontSize: '0.85rem', padding: '0.6rem' }}
          >
            <DollarSign size={14} /> Repay
          </button>
          <button
            onClick={() => onRevalue(loan.loanId)}
            disabled={loading}
            style={{ ...btnSecondary, flex: 1, fontSize: '0.85rem', padding: '0.6rem' }}
          >
            <RefreshCw size={14} /> Revalue
          </button>
        </div>
      )}
    </motion.div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────

export const BorrowView: React.FC = () => {
  const wallet = useWallet();
  const { publicKey, connected, signPayment } = wallet;
  const {
    loading: loanLoading,
    error: loanError,
    loans,
    currentLoan,
    paymentRequired,
    submitLoan,
    submitLoanWithProof,
    loadLoans,
    repay,
    revalue,
    reset,
    clearError,
  } = useLoan();

  const {
    result: assessmentResult,
    loading: assessmentLoading,
    error: assessmentError,
    submitWithPaymentProof: submitAssessmentWithProof,
  } = useAssessment();

  // Form state
  const [step, setStep] = useState(0);
  const [assetType, setAssetType] = useState<AssetType>('real-estate');
  const [assetName, setAssetName] = useState('');
  const [assetDescription, setAssetDescription] = useState('');
  const [assetValue, setAssetValue] = useState('');
  const [requestedLtv, setRequestedLtv] = useState('');
  const [location, setLocation] = useState('');
  const [artistOrMedium, setArtistOrMedium] = useState('');
  const [weightOz, setWeightOz] = useState('');
  const [signing, setSigning] = useState(false);
  const [signError, setSignError] = useState<string | null>(null);
  const [repayAmount, setRepayAmount] = useState('');
  const [repayLoanId, setRepayLoanId] = useState<string | null>(null);

  // Assessment payment state
  const [showAssessPaymentModal, setShowAssessPaymentModal] = useState(false);
  const [assessSigning, setAssessSigning] = useState(false);
  const [assessSignError, setAssessSignError] = useState<string | null>(null);
  const pendingAssessRequest = useRef<AssessmentRequest | null>(null);

  // Load existing loans on mount
  useEffect(() => {
    if (connected && publicKey) {
      loadLoans(publicKey);
    }
  }, [connected, publicKey, loadLoans]);

  // Advance to step 2 when assessment starts loading
  useEffect(() => {
    if (assessmentLoading) {
      setStep(2);
    }
  }, [assessmentLoading]);

  // Advance to step 2 when assessment completes (success or error)
  useEffect(() => {
    if (assessmentResult || assessmentError) {
      setStep(2);
    }
  }, [assessmentResult, assessmentError]);

  // ─── Handlers ────────────────────────────────────────────────────────────

  const handleSubmitAsset = useCallback(() => {
    if (!assetName || !assetValue) return;

    // Store the request and show payment modal
    pendingAssessRequest.current = {
      assetType,
      name: assetName,
      description: assetDescription,
      askingPrice: parseFloat(assetValue),
      location: assetType === 'real-estate' ? location : undefined,
      artistOrMedium: assetType === 'art' ? artistOrMedium : undefined,
      weightOz: assetType === 'commodity' ? parseFloat(weightOz) || 1 : undefined,
    };
    setAssessSignError(null);
    setShowAssessPaymentModal(true);
  }, [assetType, assetName, assetDescription, assetValue, location, artistOrMedium, weightOz]);

  const handleAssessPaymentConfirm = useCallback(async () => {
    const request = pendingAssessRequest.current;
    if (!request) return;

    // If wallet not connected, connect first
    if (!connected) {
      try {
        await wallet.connect();
      } catch {
        setAssessSignError('Please connect your wallet first.');
        return;
      }
      if (!connected) {
        setAssessSignError('Wallet connection is required to proceed.');
        return;
      }
    }

    setAssessSigning(true);
    setAssessSignError(null);

    try {
      const { paymentProof } = await signPayment(PLATFORM_WALLET, ASSESSMENT_FEE_CSPR);
      setShowAssessPaymentModal(false);
      await submitAssessmentWithProof(request, paymentProof);
    } catch (err: any) {
      if (err?.message?.includes('cancelled')) {
        setAssessSignError('Payment was cancelled. Please approve the transfer in your wallet.');
      } else {
        setAssessSignError(err?.message || 'Failed to sign payment. Please try again.');
      }
    } finally {
      setAssessSigning(false);
    }
  }, [connected, wallet, signPayment, submitAssessmentWithProof]);

  const handleAssessPaymentCancel = useCallback(() => {
    setShowAssessPaymentModal(false);
    setAssessSigning(false);
    setAssessSignError(null);
    pendingAssessRequest.current = null;
  }, []);

  const handleRequestLoan = useCallback(async () => {
    if (!assessmentResult || !publicKey) return;

    const request: LoanCreateRequest = {
      borrowerPublicKey: publicKey,
      assetId: assessmentResult.assetId,
      assetType: assessmentResult.assetType,
      assetName: assessmentResult.name,
      assessedValue: assessmentResult.assessedValue,
      askingPrice: assessmentResult.askingPrice,
      confidence: Math.max(assessmentResult.valuationA.confidence, assessmentResult.valuationB.confidence),
      assessmentId: assessmentResult.assetId,
    };

    await submitLoan(request);
  }, [assessmentResult, publicKey, submitLoan]);

  // When payment is required, trigger wallet signing
  useEffect(() => {
    if (paymentRequired && signPayment && !signing) {
      setSigning(true);
      setSignError(null);

      signPayment(PLATFORM_WALLET, LOAN_FEE_CSPR)
        .then(({ paymentProof }) => {
          if (!assessmentResult || !publicKey) return;
          submitLoanWithProof(
            {
              borrowerPublicKey: publicKey,
              assetId: assessmentResult.assetId,
              assetType: assessmentResult.assetType,
              assetName: assessmentResult.name,
              assessedValue: assessmentResult.assessedValue,
              askingPrice: assessmentResult.askingPrice,
              confidence: Math.max(assessmentResult.valuationA.confidence, assessmentResult.valuationB.confidence),
              assessmentId: assessmentResult.assetId,
            },
            paymentProof,
          );
        })
        .catch((err) => {
          setSignError(err.message || 'Payment signing failed');
        })
        .finally(() => {
          setSigning(false);
        });
    }
  }, [paymentRequired, signPayment, signing, submitLoanWithProof, assessmentResult, publicKey]);

  // When loan is created, move to step 3
  useEffect(() => {
    if (currentLoan) {
      setStep(3);
      if (publicKey) loadLoans(publicKey);
    }
  }, [currentLoan, publicKey, loadLoans]);

  const handleRepay = useCallback(async (loanId: string) => {
    setRepayLoanId(loanId);
    setRepayAmount('');
  }, []);

  const handleConfirmRepay = useCallback(async () => {
    if (!repayLoanId || !repayAmount) return;
    const success = await repay(repayLoanId, parseFloat(repayAmount));
    if (success) {
      setRepayLoanId(null);
      setRepayAmount('');
      if (publicKey) loadLoans(publicKey);
    }
  }, [repayLoanId, repayAmount, repay, publicKey, loadLoans]);

  const handleRevalue = useCallback(async (loanId: string) => {
    await revalue(loanId);
    if (publicKey) loadLoans(publicKey);
  }, [revalue, publicKey, loadLoans]);

  const handleStartNew = useCallback(() => {
    reset();
    setStep(0);
    setAssetName('');
    setAssetDescription('');
    setAssetValue('');
    setRequestedLtv('');
  }, [reset]);

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      {/* Assessment Payment Modal */}
      <AnimatePresence>
        {showAssessPaymentModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
            }}
            onClick={handleAssessPaymentCancel}
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
                maxWidth: '420px',
                width: '90%',
                boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
              }}
            >
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%',
                  background: 'rgba(139, 92, 246, 0.1)',
                  border: '2px solid rgba(139, 92, 246, 0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 1rem',
                }}>
                  <Zap size={24} color="#8B5CF6" />
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  Confirm Assessment Payment
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  A micropayment is required to run the AI valuation pipeline.
                </p>
              </div>

              <div style={{ background: 'var(--bg-main)', borderRadius: '10px', padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Assessment Fee</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{ASSESSMENT_FEE_CSPR} CSPR</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                  <span>Network</span>
                  <span>Casper Testnet</span>
                </div>
              </div>

              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                <div style={{ fontWeight: 600, marginBottom: '0.25rem', color: 'var(--text-primary)' }}>You'll receive:</div>
                <div>- Dual-agent independent valuation</div>
                <div>- Agent deliberation (if agents diverge &gt;15%)</div>
                <div>- Full analysis report with data sources</div>
              </div>

              {assessSignError && (
                <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', padding: '0.75rem', marginBottom: '1rem', fontSize: '0.8rem', color: '#EF4444' }}>
                  {assessSignError}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button onClick={handleAssessPaymentCancel} disabled={assessSigning} style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600, cursor: assessSigning ? 'not-allowed' : 'pointer', opacity: assessSigning ? 0.5 : 1 }}>
                  Cancel
                </button>
                <button onClick={handleAssessPaymentConfirm} disabled={assessSigning} style={{ flex: 2, padding: '0.75rem', borderRadius: '8px', border: 'none', background: assessSigning ? '#6366f1aa' : '#6366f1', color: 'white', fontSize: '0.9rem', fontWeight: 600, cursor: assessSigning ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  {assessSigning ? (
                    <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Waiting for wallet...</>
                  ) : (
                    <><Zap size={16} /> Pay {ASSESSMENT_FEE_CSPR} CSPR & Run</>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
            <Landmark size={24} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
            Borrow
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>
            Get instant liquidity against your RWA collateral
          </p>
        </div>
        {step < 3 && (
          <button onClick={() => setStep(4)} style={{ ...btnSecondary, fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
            <FileText size={14} /> My Loans ({loans.length})
          </button>
        )}
      </div>

      {/* Step indicator */}
      {step < 4 && (
        <StepIndicator
          current={step}
          steps={['Asset Type', 'Details', 'Assessment', 'Loan Offer']}
        />
      )}

      {/* Error banner */}
      {(loanError || signError) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            ...cardStyle,
            marginBottom: '1rem',
            borderColor: '#ef4444',
            background: 'rgba(239,68,68,0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <AlertCircle size={18} color="#ef4444" />
          <span style={{ flex: 1, fontSize: '0.85rem', color: '#ef4444' }}>
            {loanError || signError}
          </span>
          <button onClick={() => { clearError(); setSignError(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>
            <XCircle size={16} />
          </button>
        </motion.div>
      )}

      {/* ─── Step 0: Asset Type ─────────────────────────────────────────── */}
      {step === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={cardStyle}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>
            What type of asset will you use as collateral?
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            {ASSET_TYPES.map((type) => {
              const isActive = assetType === type.id;
              return (
                <button
                  key={type.id}
                  onClick={() => setAssetType(type.id)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '1.25rem 1rem',
                    borderRadius: '8px',
                    border: `2px solid ${isActive ? 'var(--primary)' : 'var(--border-color)'}`,
                    background: isActive ? 'rgba(255, 59, 59, 0.04)' : 'var(--bg-surface)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                  }}
                >
                  {type.icon}
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{type.label}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                    <LTVTooltip>LTV: {LTV_TIERS[type.id]}</LTVTooltip>
                  </span>
                </button>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={() => {
              const demo = ASSET_TYPES.find(t => t.id === assetType)?.demo;
              if (demo) {
                setAssetName(demo.name);
                setAssetDescription(demo.description);
                setAssetValue(demo.value);
                setRequestedLtv(demo.ltv);
                if (demo.location) setLocation(demo.location);
                if (demo.artistOrMedium) setArtistOrMedium(demo.artistOrMedium);
                if (demo.weightOz) setWeightOz(String(demo.weightOz));
              }
              setStep(1);
            }} style={{ ...btnSecondary, flex: 1, fontSize: '0.85rem' }}>
              Try Demo
            </button>
            <button onClick={() => setStep(1)} style={{ ...btnPrimary, flex: 2 }}>
              Continue <ArrowRight size={16} />
            </button>
          </div>
        </motion.div>
      )}

      {/* ─── Step 1: Asset Details ──────────────────────────────────────── */}
      {step === 1 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={cardStyle}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>
            Describe your collateral
          </h3>

          {/* Wallet connect prompt - shown inline when not connected */}
          {!connected && (
            <div style={{
              padding: '1rem',
              marginBottom: '1.25rem',
              borderRadius: '8px',
              border: '1px solid rgba(255,59,59,0.25)',
              background: 'rgba(255,59,59,0.04)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}>
              <AlertCircle size={18} color="var(--primary)" />
              <span style={{ flex: 1, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Connect your Casper wallet to run the assessment and receive a loan offer.
              </span>
              <button
                onClick={() => wallet.connect()}
                style={{ ...btnPrimary, fontSize: '0.8rem', padding: '0.5rem 1rem', whiteSpace: 'nowrap' }}
              >
                Connect Wallet
              </button>
            </div>
          )}

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
              Asset Name <span style={{ color: 'var(--primary)' }}>*</span>
            </label>
            <input
              value={assetName}
              onChange={(e) => setAssetName(e.target.value)}
              placeholder="e.g. Downtown Office Building"
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
              Description
            </label>
            <textarea
              value={assetDescription}
              onChange={(e) => setAssetDescription(e.target.value)}
              placeholder="Key details about the asset..."
              rows={3}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                Estimated Value (USD) <span style={{ color: 'var(--primary)' }}>*</span>
              </label>
              <input
                type="number"
                value={assetValue}
                onChange={(e) => setAssetValue(e.target.value)}
                placeholder="500000"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                <LTVTooltip>Requested LTV (%)</LTVTooltip>
              </label>
              <input
                type="number"
                value={requestedLtv}
                onChange={(e) => setRequestedLtv(e.target.value)}
                placeholder={`e.g. ${LTV_TIERS[assetType].split('-')[0]}`}
                min={10}
                max={90}
                style={inputStyle}
              />
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>
                Typical range: {LTV_TIERS[assetType]}
              </div>
            </div>
          </div>

          {/* Asset-specific fields */}
          {assetType === 'real-estate' && (
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                Location <span style={{ color: 'var(--primary)' }}>*</span>
              </label>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Austin, TX"
                style={inputStyle}
              />
            </div>
          )}

          {assetType === 'art' && (
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                Artist & Medium <span style={{ color: 'var(--primary)' }}>*</span>
              </label>
              <input
                value={artistOrMedium}
                onChange={(e) => setArtistOrMedium(e.target.value)}
                placeholder="e.g. Basquiat, Acrylic and oilstick on canvas"
                style={inputStyle}
              />
            </div>
          )}

          {assetType === 'commodity' && (
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                Weight (oz) <span style={{ color: 'var(--primary)' }}>*</span>
              </label>
              <input
                type="number"
                value={weightOz}
                onChange={(e) => setWeightOz(e.target.value)}
                placeholder="e.g. 400"
                min={0.01}
                step={0.01}
                style={inputStyle}
              />
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={() => setStep(0)} style={{ ...btnSecondary, flex: 1 }}>
              <ArrowLeft size={16} /> Back
            </button>
            {!connected ? (
              <button
                onClick={() => wallet.connect()}
                style={{ ...btnPrimary, flex: 2 }}
              >
                Connect Wallet to Continue <ArrowRight size={16} />
              </button>
            ) : (
              <button
                onClick={handleSubmitAsset}
                disabled={!assetName || !assetValue || assessmentLoading}
                style={{
                  ...btnPrimary,
                  flex: 2,
                  opacity: !assetName || !assetValue || assessmentLoading ? 0.5 : 1,
                }}
              >
                {assessmentLoading ? (
                  <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Running Assessment...</>
                ) : (
                  <>Run Assessment <ArrowRight size={16} /></>
                )}
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* ─── Step 2: Assessment Running ─────────────────────────────────── */}
      {step === 2 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={cardStyle}>
          {assessmentLoading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)', marginBottom: '1rem' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                AI Agents Are Assessing Your Asset
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                3 independent analysts are evaluating your collateral...
              </p>
            </div>
          ) : assessmentResult ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <CheckCircle2 size={20} color="#10b981" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>Assessment Complete</h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ textAlign: 'center', padding: '1rem', background: 'var(--bg-main)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>Your Estimate</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{formatCurrency(assessmentResult.askingPrice)}</div>
                </div>
                <div style={{ textAlign: 'center', padding: '1rem', background: 'var(--bg-main)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>AI Valuation</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)' }}>
                    {formatCurrency(assessmentResult.assessedValue)}
                  </div>
                </div>
                <div style={{ textAlign: 'center', padding: '1rem', background: 'var(--bg-main)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>
                    <LTVTooltip>Max Loan (75% LTV)</LTVTooltip>
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#10b981' }}>
                    {formatCurrency(assessmentResult.assessedValue * 0.75)}
                  </div>
                </div>
              </div>

              {/* Agent explanation for assessment */}
              {assessmentResult && (
                <div style={{ marginTop: '1.5rem' }}>
                  <AgentExplainer assessment={assessmentResult} />
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button onClick={handleStartNew} style={{ ...btnSecondary, flex: 1 }}>
                  <RotateCcw size={16} /> Start Over
                </button>
                <button onClick={handleRequestLoan} style={{ ...btnPrimary, flex: 2 }}>
                  <Landmark size={16} /> Request Loan
                </button>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <AlertTriangle size={32} color="#f59e0b" style={{ marginBottom: '1rem' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Assessment Failed</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                {assessmentError || 'The AI agents couldn\'t complete the assessment. Please try again.'}
              </p>
              <button onClick={handleStartNew} style={btnPrimary}>
                <RotateCcw size={16} /> Try Again
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* ─── Step 3: Loan Offer / Confirmation ──────────────────────────── */}
      {step === 3 && currentLoan && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <CheckCircle2 size={20} color="#10b981" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>Loan Created</h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ padding: '1rem', background: 'var(--bg-main)', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>Loan Amount</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#10b981' }}>
                ${currentLoan.loanAmountCSPR.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </div>
            </div>
            <div style={{ padding: '1rem', background: 'var(--bg-main)', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>Collateral Value</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>
                {formatCurrency(currentLoan.assessedValue)}
              </div>
            </div>
            <div style={{ padding: '1rem', background: 'var(--bg-main)', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>
                <LTVTooltip>LTV Ratio</LTVTooltip>
              </div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>
                {currentLoan.ltvRatio.toFixed(0)}%
              </div>
            </div>
            <div style={{ padding: '1rem', background: 'var(--bg-main)', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>Platform Fee</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>
                {currentLoan.platformFeeCSPR} CSPR
              </div>
            </div>
          </div>

          {/* Verdicto Point 1: Trust breakdown - why this LTV */}
          {currentLoan.trustBreakdown && (
            <div style={{
              padding: '0.75rem 1rem',
              background: 'var(--bg-main)',
              borderRadius: '8px',
              marginBottom: '1rem',
              fontSize: '0.8rem',
            }}>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                Trust-Score LTV Breakdown
              </div>
              <div style={{ display: 'flex', gap: '1.5rem', color: 'var(--text-secondary)' }}>
                <span>Confidence: <strong>{(currentLoan.trustBreakdown.confidence * 100).toFixed(0)}%</strong></span>
                <span>Value Ratio: <strong>{(currentLoan.trustBreakdown.valueRatio * 100).toFixed(0)}%</strong></span>
                <span>LTV Range: <strong>{currentLoan.trustBreakdown.ltvRange}</strong></span>
              </div>
            </div>
          )}

          {/* Verdicto Point 2: Escrow lock tx hash */}
          {currentLoan.escrowLockTxHash && (
            <div style={{
              padding: '0.75rem 1rem',
              background: 'rgba(16,185,129,0.05)',
              border: '1px solid rgba(16,185,129,0.2)',
              borderRadius: '8px',
              marginBottom: '1rem',
              fontSize: '0.8rem',
            }}>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                🔒 Escrow Lock
              </div>
              <div style={{ color: 'var(--text-secondary)' }}>
                Collateral locked on-chain: <code style={{ fontSize: '0.75rem', background: 'var(--bg-surface)', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>
                  {currentLoan.escrowLockTxHash.slice(0, 20)}...
                </code>
              </div>
            </div>
          )}

          <div style={{
            padding: '1rem',
            background: 'rgba(16,185,129,0.05)',
            border: '1px solid rgba(16,185,129,0.2)',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            fontSize: '0.85rem',
            color: 'var(--text-secondary)',
          }}>
            <Info size={14} style={{ verticalAlign: 'middle', marginRight: '0.4rem', color: '#10b981' }} />
            Funds disbursed to your wallet. Monitor your health ratio to avoid liquidation.
            {currentLoan.disbursementTxHash && (
              <> Tx: <code style={{ fontSize: '0.75rem' }}>{currentLoan.disbursementTxHash.slice(0, 16)}...</code></>
            )}
          </div>

          {/* Agent explanation with loan context */}
          {assessmentResult && (
            <div style={{ marginBottom: '1.5rem' }}>
              <AgentExplainer
                assessment={assessmentResult}
                loan={{
                  ltvRatio: currentLoan.ltvRatio,
                  loanAmountCSPR: currentLoan.loanAmountCSPR,
                  trustBreakdown: currentLoan.trustBreakdown,
                }}
              />
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={handleStartNew} style={{ ...btnSecondary, flex: 1 }}>
              <RotateCcw size={16} /> New Loan
            </button>
            <button onClick={() => setStep(4)} style={{ ...btnPrimary, flex: 1 }}>
              <FileText size={16} /> View My Loans
            </button>
          </div>
        </motion.div>
      )}

      {/* ─── Step 4: My Loans ───────────────────────────────────────────── */}
      {step === 4 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>My Loans</h3>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={handleStartNew} style={{ ...btnSecondary, fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
                <Landmark size={14} /> New Loan
              </button>
              <button onClick={() => publicKey && loadLoans(publicKey)} style={{ ...btnSecondary, fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
                <RefreshCw size={14} /> Refresh
              </button>
            </div>
          </div>

          {loanLoading && loans.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)' }} />
            </div>
          ) : loans.length === 0 ? (
            <div style={{ ...cardStyle, textAlign: 'center', padding: '3rem' }}>
              <Landmark size={32} style={{ color: 'var(--text-tertiary)', marginBottom: '0.75rem' }} />
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                No loans yet. Submit an asset to get started.
              </p>
            </div>
          ) : (
            loans.map((loan) => (
              <LoanCard
                key={loan.loanId}
                loan={loan}
                onRepay={handleRepay}
                onRevalue={handleRevalue}
                loading={loanLoading}
              />
            ))
          )}

          {/* Repay modal */}
          {repayLoanId && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                position: 'fixed', inset: 0,
                background: 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(4px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 1000,
              }}
              onClick={() => setRepayLoanId(null)}
            >
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                style={{ ...cardStyle, maxWidth: 400, width: '90%' }}
                onClick={(e) => e.stopPropagation()}
              >
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>Repay Loan</h3>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                    Amount (CSPR)
                  </label>
                  <input
                    type="number"
                    value={repayAmount}
                    onChange={(e) => setRepayAmount(e.target.value)}
                    placeholder="Enter amount"
                    style={inputStyle}
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button onClick={() => setRepayLoanId(null)} style={{ ...btnSecondary, flex: 1 }}>
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmRepay}
                    disabled={!repayAmount || loanLoading}
                    style={{ ...btnPrimary, flex: 1, opacity: !repayAmount || loanLoading ? 0.5 : 1 }}
                  >
                    {loanLoading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <DollarSign size={16} />}
                    Confirm Repay
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </motion.div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default BorrowView;
