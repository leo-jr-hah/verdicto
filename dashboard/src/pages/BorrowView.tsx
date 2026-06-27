import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
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
} from 'lucide-react';
import { useWallet } from '../contexts/CSPRClickContext';
import { useLoan } from '../hooks/useLoan';
import { useAssessment } from '../hooks/useAssessment';
import {
  type AssetType,
  type LoanCreateRequest,
  type AssessmentRequest,
} from '../services/api';
import { PLATFORM_WALLET, LOAN_FEE_CSPR, ASSESSMENT_FEE_CSPR } from '../config/casper';
import { AgentExplainer } from '../components/AgentExplainer';
import PaymentModal from '../components/PaymentModal';
import { AppModal, AppModalActions } from '../components/AppModal';
import { usePaymentFlow } from '../hooks/usePaymentFlow';

// ─── Constants ───────────────────────────────────────────────────────────────

const ASSET_TYPES: Array<{
  id: AssetType;
  label: string;
  sub: string;
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
    sub: '60–75% LTV',
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
    sub: '30–50% LTV',
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
    sub: '70–85% LTV',
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

const STEPS = ['Asset Type', 'Details', 'Assessment', 'Loan Offer'];

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
  if (ratio >= 1.5) return 'var(--success)';
  if (ratio >= 1.2) return 'var(--warning)';
  return 'var(--error)';
}

function statusVariant(status: string): string {
  switch (status) {
    case 'active': case 'healthy': return 'active';
    case 'warning': return 'warning';
    case 'repaid': case 'liquidated': return 'danger';
    default: return 'neutral';
  }
}

// ─── LTV Tooltip ─────────────────────────────────────────────────────────────

const LTVTooltip: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [show, setShow] = useState(false);
  return (
    <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', cursor: 'help' }}
      onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      <Info size={13} style={{ color: 'var(--text-tertiary)' }} />
      {show && (
        <span style={{
          position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)',
          background: 'var(--text-primary)', color: 'var(--text-inverse)',
          padding: '0.6rem 0.8rem', borderRadius: '8px', fontSize: '0.75rem',
          lineHeight: 1.5, width: '260px', zIndex: 50, marginBottom: '6px',
          boxShadow: 'var(--shadow-lg)',
        }}>
          <strong>Loan-to-Value (LTV) Ratio</strong><br />
          LTV measures the loan amount as a percentage of the asset's appraised value.
          A 65% LTV on a $1M asset means you can borrow up to $650K.
          <br /><br />
          <strong>Lower LTV = safer loan</strong> — more equity, better rates.
        </span>
      )}
    </span>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────

export const BorrowView: React.FC = () => {
  const wallet = useWallet();
  const { publicKey, connected, signPayment } = wallet;
  const {
    loading: loanLoading,
    error: loanError,
    errorHint: loanErrorHint,
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

  // Assessment payment flow
  const pendingAssessRequest = useRef<AssessmentRequest | null>(null);
  const assessPayment = usePaymentFlow(signPayment, ASSESSMENT_FEE_CSPR, async (paymentProof) => {
    const request = pendingAssessRequest.current;
    if (!request) return;
    await submitAssessmentWithProof(request, paymentProof);
  });

  // Load existing loans on mount
  useEffect(() => {
    if (connected && publicKey) loadLoans(publicKey);
  }, [connected, publicKey, loadLoans]);

  // Auto-advance steps based on assessment state
  useEffect(() => { if (assessmentLoading) setStep(2); }, [assessmentLoading]);
  useEffect(() => { if (assessmentResult || assessmentError) setStep(2); }, [assessmentResult, assessmentError]);

  // ─── Handlers ────────────────────────────────────────────────────────────

  const handleSubmitAsset = useCallback(() => {
    if (!assetName || !assetValue) return;
    pendingAssessRequest.current = {
      assetType,
      name: assetName,
      description: assetDescription,
      askingPrice: parseFloat(assetValue),
      location: assetType === 'real-estate' ? location : undefined,
      artistOrMedium: assetType === 'art' ? artistOrMedium : undefined,
      weightOz: assetType === 'commodity' ? parseFloat(weightOz) || 1 : undefined,
    };
    assessPayment.openModal();
  }, [assetType, assetName, assetDescription, assetValue, location, artistOrMedium, weightOz, assessPayment]);

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
          submitLoanWithProof({
            borrowerPublicKey: publicKey,
            assetId: assessmentResult.assetId,
            assetType: assessmentResult.assetType,
            assetName: assessmentResult.name,
            assessedValue: assessmentResult.assessedValue,
            askingPrice: assessmentResult.askingPrice,
            confidence: Math.max(assessmentResult.valuationA.confidence, assessmentResult.valuationB.confidence),
            assessmentId: assessmentResult.assetId,
          }, paymentProof);
        })
        .catch((err) => setSignError(err.message || 'Payment signing failed'))
        .finally(() => setSigning(false));
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
    if (success) { setRepayLoanId(null); setRepayAmount(''); if (publicKey) loadLoans(publicKey); }
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

  const loadDemo = useCallback(() => {
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
  }, [assetType]);

  const displayStep = step === 4 ? -1 : step;

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="wizard-page">
      {/* Assessment Payment Modal */}
      <PaymentModal
        open={assessPayment.showModal}
        title="Confirm Assessment Payment"
        description="A micropayment is required to run the AI valuation pipeline."
        feeLabel="Assessment Fee"
        feeAmount={ASSESSMENT_FEE_CSPR}
        features={[
          'Dual-agent independent valuation',
          'Agent deliberation (if agents diverge >15%)',
          'Full analysis report with data sources',
        ]}
        signing={assessPayment.signing}
        signError={assessPayment.signError}
        signErrorHint={assessPayment.signErrorHint}
        onConfirm={assessPayment.confirm}
        onCancel={assessPayment.cancel}
      />

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="wizard-header">
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
          <div className="wizard-header__icon">
            <Landmark size={24} />
          </div>
          <div>
            <h1 className="wizard-header__title">Borrow</h1>
            <p className="wizard-header__subtitle">
              Get instant liquidity against your real-world asset collateral. AI-powered valuation determines your loan terms.
            </p>
          </div>
        </div>
        <div className="wizard-header__actions">
          {step < 4 && (
            <button onClick={() => setStep(4)} className="btn" style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}>
              <FileText size={14} /> My Loans ({loans.length})
            </button>
          )}
        </div>
      </div>

      {/* ── Step Progress ────────────────────────────────────────────────── */}
      {displayStep >= 0 && (
        <div className="wizard-progress">
          {STEPS.map((label, i) => (
            <React.Fragment key={i}>
              <div className={`wizard-progress__step ${i < displayStep ? 'wizard-progress__step--done' : i === displayStep ? 'wizard-progress__step--active' : ''}`}>
                <div className="wizard-progress__dot">
                  {i < displayStep ? <CheckCircle2 size={14} /> : i + 1}
                </div>
                <span>{label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`wizard-progress__line ${i < displayStep ? 'wizard-progress__line--done' : ''}`} />
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* ── Error Banner ─────────────────────────────────────────────────── */}
      {(loanError || signError) && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="wizard-error">
          <AlertCircle size={18} color="var(--error)" style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ flex: 1 }}>
            <div className="wizard-error__msg">{loanError || signError}</div>
            {loanErrorHint && <div className="wizard-error__hint">💡 {loanErrorHint}</div>}
          </div>
          <button onClick={() => { clearError(); setSignError(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)', padding: 4 }}>
            <XCircle size={16} />
          </button>
        </motion.div>
      )}

      {/* ═══ Step 0: Asset Type ═══════════════════════════════════════════ */}
      {step === 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="wizard-card">
          <h3 className="wizard-card__title">Select Collateral Type</h3>
          <p className="wizard-card__desc">Choose the asset class you want to use as collateral for your loan.</p>

          <div className="wizard-asset-grid">
            {ASSET_TYPES.map((type) => (
              <button
                key={type.id}
                onClick={() => setAssetType(type.id)}
                className={`wizard-asset-btn ${assetType === type.id ? 'wizard-asset-btn--active' : ''}`}
              >
                <div className="wizard-asset-btn__icon">{type.icon}</div>
                <div className="wizard-asset-btn__label">{type.label}</div>
                <div className="wizard-asset-btn__sub">{type.sub}</div>
              </button>
            ))}
          </div>

          <div className="wizard-actions">
            <button onClick={loadDemo} className="btn" style={{ flex: 1 }}>
              Try Sample
            </button>
            <button onClick={() => setStep(1)} className="btn btn-primary" style={{ flex: 2 }}>
              Continue <ArrowRight size={16} />
            </button>
          </div>
        </motion.div>
      )}

      {/* ═══ Step 1: Asset Details ════════════════════════════════════════ */}
      {step === 1 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="wizard-card">
          <h3 className="wizard-card__title">Describe Your Collateral</h3>
          <p className="wizard-card__desc">Provide details about the asset. Our AI agents will independently evaluate it.</p>

          {!connected && (
            <div className="wizard-wallet-prompt">
              <AlertCircle size={18} color="var(--accent)" style={{ flexShrink: 0 }} />
              <span className="wizard-wallet-prompt__text">
                Connect your Casper wallet to run the assessment and receive a loan offer.
              </span>
              <button onClick={() => wallet.connect()} className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '0.5rem 1rem', whiteSpace: 'nowrap' }}>
                Connect Wallet
              </button>
            </div>
          )}

          <div className="wizard-field">
            <label className="wizard-field__label wizard-field__label--required">Asset Name</label>
            <input value={assetName} onChange={(e) => setAssetName(e.target.value)} placeholder="e.g. Downtown Office Building" className="wizard-field__input" />
          </div>

          <div className="wizard-field">
            <label className="wizard-field__label">Description</label>
            <textarea value={assetDescription} onChange={(e) => setAssetDescription(e.target.value)} placeholder="Key details about the asset — condition, location, income, provenance..." rows={3} className="wizard-field__input" />
          </div>

          <div className="wizard-form-row">
            <div className="wizard-field">
              <label className="wizard-field__label wizard-field__label--required">Estimated Value (USD)</label>
              <input type="number" value={assetValue} onChange={(e) => setAssetValue(e.target.value)} placeholder="e.g. 1,420,000" className="wizard-field__input" />
            </div>
            <div className="wizard-field">
              <label className="wizard-field__label">Target LTV (%)</label>
              <input type="number" value={requestedLtv} onChange={(e) => setRequestedLtv(e.target.value)} placeholder="e.g. 65" className="wizard-field__input" />
              <div className="wizard-field__hint">
                Typical range: {assetType === 'real-estate' ? '60–75%' : assetType === 'art' ? '30–50%' : '70–85%'}
              </div>
            </div>
          </div>

          {assetType === 'real-estate' && (
            <div className="wizard-field">
              <label className="wizard-field__label">Location</label>
              <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Austin, TX" className="wizard-field__input" />
            </div>
          )}
          {assetType === 'art' && (
            <div className="wizard-field">
              <label className="wizard-field__label">Artist / Medium</label>
              <input value={artistOrMedium} onChange={(e) => setArtistOrMedium(e.target.value)} placeholder="e.g. Basquiat, Acrylic on canvas" className="wizard-field__input" />
            </div>
          )}
          {assetType === 'commodity' && (
            <div className="wizard-field">
              <label className="wizard-field__label">Weight (oz)</label>
              <input type="number" value={weightOz} onChange={(e) => setWeightOz(e.target.value)} placeholder="e.g. 400" className="wizard-field__input" />
            </div>
          )}

          <div className="wizard-actions">
            <button onClick={() => setStep(0)} className="btn">
              <ArrowLeft size={16} /> Back
            </button>
            <button
              onClick={handleSubmitAsset}
              disabled={!assetName || !assetValue || assessPayment.signing}
              className="btn btn-primary"
              style={{ opacity: !assetName || !assetValue ? 0.5 : 1 }}
            >
              {assessPayment.signing ? (
                <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Signing...</>
              ) : (
                <>Run Assessment <ArrowRight size={16} /></>
              )}
            </button>
          </div>
        </motion.div>
      )}

      {/* ═══ Step 2: Assessment ═══════════════════════════════════════════ */}
      {step === 2 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="wizard-card">
          {assessmentLoading ? (
            <div className="wizard-loading">
              <div className="wizard-loading__spinner" />
              <div className="wizard-loading__title">AI Agents Are Assessing Your Asset</div>
              <div className="wizard-loading__desc">3 independent analysts are evaluating your collateral...</div>
            </div>
          ) : assessmentResult ? (
            <div>
              <div className="wizard-result-header">
                <div className="wizard-result-header__icon">
                  <CheckCircle2 size={20} />
                </div>
                <div className="wizard-result-header__title">Assessment Complete</div>
              </div>

              <div className="wizard-metrics">
                <div className="wizard-metric">
                  <div className="wizard-metric__label">Your Estimate</div>
                  <div className="wizard-metric__value">{formatCurrency(assessmentResult.askingPrice)}</div>
                </div>
                <div className="wizard-metric">
                  <div className="wizard-metric__label">AI Valuation</div>
                  <div className="wizard-metric__value wizard-metric__value--accent">{formatCurrency(assessmentResult.assessedValue)}</div>
                </div>
                <div className="wizard-metric">
                  <div className="wizard-metric__label"><LTVTooltip>Max Loan (75% LTV)</LTVTooltip></div>
                  <div className="wizard-metric__value wizard-metric__value--secondary">{formatCurrency(assessmentResult.assessedValue * 0.75)}</div>
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <AgentExplainer assessment={assessmentResult} />
              </div>

              <div className="wizard-actions">
                <button onClick={handleStartNew} className="btn">
                  <RotateCcw size={16} /> Start Over
                </button>
                <button onClick={handleRequestLoan} className="btn btn-primary">
                  <Landmark size={16} /> Request Loan
                </button>
              </div>
            </div>
          ) : (
            <div className="wizard-loading">
              <AlertTriangle size={32} color="var(--text-tertiary)" style={{ marginBottom: '1rem' }} />
              <div className="wizard-loading__title">Assessment Failed</div>
              <div className="wizard-loading__desc" style={{ marginBottom: '1.5rem' }}>
                {assessmentError || 'The AI agents couldn\'t complete the assessment. Please try again.'}
              </div>
              <button onClick={handleStartNew} className="btn btn-primary">
                <RotateCcw size={16} /> Try Again
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* ═══ Step 3: Loan Created ═════════════════════════════════════════ */}
      {step === 3 && currentLoan && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="wizard-card">
          <div className="wizard-result-header">
            <div className="wizard-result-header__icon">
              <CheckCircle2 size={20} />
            </div>
            <div className="wizard-result-header__title">Loan Created</div>
          </div>

          <div className="wizard-metrics" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
            <div className="wizard-metric">
              <div className="wizard-metric__label">Loan Amount</div>
              <div className="wizard-metric__value wizard-metric__value--secondary">
                ${currentLoan.loanAmountCSPR.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </div>
            </div>
            <div className="wizard-metric">
              <div className="wizard-metric__label">Collateral Value</div>
              <div className="wizard-metric__value">{formatCurrency(currentLoan.assessedValue)}</div>
            </div>
            <div className="wizard-metric">
              <div className="wizard-metric__label"><LTVTooltip>LTV Ratio</LTVTooltip></div>
              <div className="wizard-metric__value">{currentLoan.ltvRatio.toFixed(0)}%</div>
            </div>
            <div className="wizard-metric">
              <div className="wizard-metric__label">Platform Fee</div>
              <div className="wizard-metric__value">{currentLoan.platformFeeCSPR} CSPR</div>
            </div>
          </div>

          {currentLoan.trustBreakdown && (
            <div className="wizard-info-panel">
              <div className="wizard-info-panel__title">
                <Info size={14} /> Trust-Score LTV Breakdown
              </div>
              <div className="wizard-info-panel__row">
                <span>Confidence: <strong>{(currentLoan.trustBreakdown.confidence * 100).toFixed(0)}%</strong></span>
                <span>Value Ratio: <strong>{(currentLoan.trustBreakdown.valueRatio * 100).toFixed(0)}%</strong></span>
                <span>LTV Range: <strong>{currentLoan.trustBreakdown.ltvRange}</strong></span>
              </div>
            </div>
          )}

          {(currentLoan.escrowLockTxHash || currentLoan.escrowReleaseTxHash) && (
            <div className="wizard-info-panel">
              <div className="wizard-info-panel__title">Escrow Transactions</div>
              {currentLoan.escrowLockTxHash && (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  🔒 Lock: <code style={{ fontSize: '0.75rem', background: 'var(--bg-elevated)', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>
                    {currentLoan.escrowLockTxHash.slice(0, 16)}...
                  </code>
                </div>
              )}
              {currentLoan.escrowReleaseTxHash && (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  🔓 Release: <code style={{ fontSize: '0.75rem', background: 'var(--bg-elevated)', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>
                    {currentLoan.escrowReleaseTxHash.slice(0, 16)}...
                  </code>
                </div>
              )}
            </div>
          )}

          <div className="wizard-info-panel" style={{ background: 'var(--success-soft)', border: '1px solid var(--success)' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <Info size={14} style={{ verticalAlign: 'middle', marginRight: '0.4rem' }} />
              <strong>Testnet Mode</strong> — Loan disbursed via testnet CSPR. Monitor your health ratio to avoid liquidation.
              {currentLoan.disbursementTxHash && (
                <> Tx: <code style={{ fontSize: '0.75rem' }}>{currentLoan.disbursementTxHash.slice(0, 16)}...</code></>
              )}
            </div>
          </div>

          {assessmentResult && (
            <div style={{ marginBottom: '1.5rem' }}>
              <AgentExplainer assessment={assessmentResult} loan={{
                ltvRatio: currentLoan.ltvRatio,
                loanAmountCSPR: currentLoan.loanAmountCSPR,
                trustBreakdown: currentLoan.trustBreakdown,
              }} />
            </div>
          )}

          <div className="wizard-actions">
            <button onClick={handleStartNew} className="btn">
              <RotateCcw size={16} /> New Loan
            </button>
            <button onClick={() => setStep(4)} className="btn btn-primary">
              <FileText size={16} /> View My Loans
            </button>
          </div>
        </motion.div>
      )}

      {/* ═══ Step 4: My Loans ═════════════════════════════════════════════ */}
      {step === 4 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>My Loans</h3>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={handleStartNew} className="btn" style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}>
                <Landmark size={14} /> New Loan
              </button>
              <button onClick={() => publicKey && loadLoans(publicKey)} className="btn" style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}>
                <RefreshCw size={14} /> Refresh
              </button>
            </div>
          </div>

          {loanLoading && loans.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent)' }} />
            </div>
          ) : loans.length === 0 ? (
            <div className="wizard-empty">
              <div className="wizard-empty__icon"><Landmark size={24} /></div>
              <div className="wizard-empty__title">No loans yet</div>
              <div className="wizard-empty__text">Submit an asset for assessment to receive a loan offer.</div>
            </div>
          ) : (
            loans.map((loan) => {
              const health = loan.healthRatio ?? 1.5;
              return (
                <div key={loan.loanId} className="wizard-list-card">
                  <div className="wizard-list-card__header">
                    <div>
                      <div className="wizard-list-card__id">Loan #{loan.loanId.slice(0, 8)}</div>
                      <div className="wizard-list-card__amount">
                        ${loan.loanAmountCSPR.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </div>
                    </div>
                    <span className={`wizard-status wizard-status--${statusVariant(loan.status)}`}>{loan.status}</span>
                  </div>

                  <div className="wizard-list-card__stats">
                    <div>
                      <div className="wizard-list-card__stat-label">Collateral</div>
                      <div className="wizard-list-card__stat-value">{formatCurrency(loan.assessedValue)}</div>
                    </div>
                    <div>
                      <div className="wizard-list-card__stat-label"><LTVTooltip>LTV</LTVTooltip></div>
                      <div className="wizard-list-card__stat-value">{(loan.ltvRatio * 100).toFixed(0)}%</div>
                    </div>
                    <div>
                      <div className="wizard-list-card__stat-label">Health</div>
                      <div className="wizard-list-card__stat-value" style={{ color: healthColor(health) }}>
                        {health.toFixed(2)}x
                      </div>
                    </div>
                  </div>

                  <div className="wizard-health-bar">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((health / 2) * 100, 100)}%` }}
                      transition={{ duration: 0.5 }}
                      className="wizard-health-bar__fill"
                      style={{ background: healthColor(health) }}
                    />
                  </div>

                  {loan.status === 'active' && (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => handleRepay(loan.loanId)} disabled={loanLoading} className="btn" style={{ flex: 1, fontSize: '0.8rem', padding: '0.5rem' }}>
                        <DollarSign size={14} /> Repay
                      </button>
                      <button onClick={() => handleRevalue(loan.loanId)} disabled={loanLoading} className="btn" style={{ flex: 1, fontSize: '0.8rem', padding: '0.5rem' }}>
                        <RefreshCw size={14} /> Revalue
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Repay modal */}
          <AppModal open={!!repayLoanId} onClose={() => setRepayLoanId(null)}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>Repay Loan</h3>
            <div className="wizard-field">
              <label className="wizard-field__label">Amount (CSPR)</label>
              <input type="number" value={repayAmount} onChange={(e) => setRepayAmount(e.target.value)} placeholder="Enter amount" className="wizard-field__input" />
            </div>
            <AppModalActions
              onCancel={() => setRepayLoanId(null)}
              onConfirm={handleConfirmRepay}
              confirmLabel="Confirm Repay"
              confirmDisabled={!repayAmount || loanLoading}
              confirmLoading={loanLoading}
              confirmIcon={<DollarSign size={16} />}
            />
          </AppModal>
        </motion.div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default BorrowView;
