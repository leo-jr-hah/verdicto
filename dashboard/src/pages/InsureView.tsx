import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Shield, ArrowRight, ArrowLeft, CheckCircle2, AlertTriangle,
  Loader2, RotateCcw, RefreshCw, AlertCircle, XCircle,
  FileText, Building2, Palette, Gem, TrendingDown, Info,
} from 'lucide-react';
import { useWallet } from '../contexts/CSPRClickContext';
import { useInsurance } from '../hooks/useInsurance';
import { useAssessment } from '../hooks/useAssessment';
import {
  type AssetType, type InsuranceCreateRequest, type InsurancePolicy, type AssessmentRequest,
} from '../services/api';
import { PLATFORM_WALLET, INSURANCE_FEE_CSPR, ASSESSMENT_FEE_CSPR } from '../config/casper';
import { AgentExplainer } from '../components/AgentExplainer';
import PaymentModal from '../components/PaymentModal';
import { AppModal, AppModalActions } from '../components/AppModal';
import { usePaymentFlow } from '../hooks/usePaymentFlow';

// ─── Constants ───────────────────────────────────────────────────────────────

const ASSET_TYPES: Array<{
  id: AssetType; label: string; sub: string; icon: React.ReactNode;
  demo: { name: string; description: string; value: string; coveragePercent: string; location?: string; artistOrMedium?: string; weightOz?: number; };
}> = [
  {
    id: 'real-estate', label: 'Real Estate', sub: '2–3% premium', icon: <Building2 size={20} />,
    demo: { name: 'Downtown Austin Office Tower', description: '12-story Class A office building at 200 Congress Ave, Austin TX. Built 2018, 95% occupied with 8-year NNN leases. NOI $2.1M/yr.', value: '14200000', coveragePercent: '75', location: 'Austin, TX' },
  },
  {
    id: 'art', label: 'Fine Art', sub: '3.5–5% premium', icon: <Palette size={20} />,
    demo: { name: 'Basquiat Untitled (Skull), 1981', description: 'Acrylic and oilstick on canvas, 72×68 in. Provenance: Galerie Thaddeus Ropac → Private European collection. Authenticated by Basquiat Authentication Committee.', value: '120000000', coveragePercent: '50', artistOrMedium: 'Jean-Michel Basquiat, Acrylic and oilstick on canvas' },
  },
  {
    id: 'commodity', label: 'Commodity', sub: '1.5–2.5% premium', icon: <Gem size={20} />,
    demo: { name: 'LBMA Gold Bar - 400 oz', description: 'London Bullion Market Association certified, 995.0 fine gold bar. Serial #AU-2024-8847. Stored in Brink\'s London vault.', value: '936000', coveragePercent: '85', weightOz: 400 },
  },
];

const STEPS = ['Asset Type', 'Details', 'Assessment', 'Policy'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
}

function riskColor(score: number): string {
  if (score <= 30) return 'var(--success)';
  if (score <= 55) return 'var(--warning)';
  return 'var(--error)';
}

function riskLabel(score: number): string {
  if (score <= 30) return 'Low Risk';
  if (score <= 55) return 'Medium Risk';
  return 'High Risk';
}

function statusVariant(status: string): string {
  switch (status) {
    case 'active': return 'active';
    case 'expired': case 'claimed': return 'warning';
    case 'paid': return 'danger';
    default: return 'neutral';
  }
}

function daysUntilExpiry(expiresAt: number): number {
  return Math.max(0, Math.ceil((expiresAt - Date.now()) / (24 * 60 * 60 * 1000)));
}

// ─── Main Component ──────────────────────────────────────────────────────────

export const InsureView: React.FC = () => {
  const wallet = useWallet();
  const { publicKey, connected, signPayment } = wallet;
  const {
    loading: insLoading, error: insError, errorHint: insErrorHint,
    policies, currentPolicy, claimResult, paymentRequired,
    submitPolicy, submitPolicyWithProof, loadPolicies, claim, reset, clearError,
  } = useInsurance();

  const {
    result: assessmentResult, loading: assessmentLoading, error: assessmentError,
    submitWithPaymentProof: submitAssessmentWithProof,
  } = useAssessment();

  const [step, setStep] = useState(0);
  const [assetType, setAssetType] = useState<AssetType>('real-estate');
  const [assetName, setAssetName] = useState('');
  const [assetDescription, setAssetDescription] = useState('');
  const [assetValue, setAssetValue] = useState('');
  const [coveragePercent, setCoveragePercent] = useState('');
  const [location, setLocation] = useState('');
  const [artistOrMedium, setArtistOrMedium] = useState('');
  const [weightOz, setWeightOz] = useState('');
  const [signing, setSigning] = useState(false);
  const [signError, setSignError] = useState<string | null>(null);
  const [claimPolicyId, setClaimPolicyId] = useState<string | null>(null);
  const [claimReason, setClaimReason] = useState('');

  const assessPayment = usePaymentFlow(signPayment, ASSESSMENT_FEE_CSPR, async (paymentProof) => {
    if (!assessPayment.pendingPayloadRef.current) return;
    await submitAssessmentWithProof(assessPayment.pendingPayloadRef.current, paymentProof);
    setStep(2);
  });

  useEffect(() => { if (connected && publicKey) loadPolicies(publicKey); }, [connected, publicKey, loadPolicies]);

  const handleSubmitAsset = useCallback(async () => {
    if (!assetName || !assetValue) return;
    const request: AssessmentRequest = {
      assetType, name: assetName, description: assetDescription || undefined,
      askingPrice: parseFloat(assetValue), location: location || undefined,
      artistOrMedium: artistOrMedium || undefined, weightOz: weightOz ? parseFloat(weightOz) : undefined,
    };
    assessPayment.openModal(request);
  }, [assetType, assetName, assetDescription, assetValue, location, artistOrMedium, weightOz, assessPayment]);

  useEffect(() => {
    if (!assessmentResult || !publicKey) return;
    const request: InsuranceCreateRequest = {
      ownerPublicKey: publicKey, assetId: assessmentResult.assetId,
      assetType: assessmentResult.assetType, assetName: assessmentResult.name,
      assessedValue: assessmentResult.assessedValue, askingPrice: assessmentResult.askingPrice,
      confidence: Math.max(assessmentResult.valuationA.confidence, assessmentResult.valuationB.confidence),
      coveragePercent: coveragePercent ? parseFloat(coveragePercent) : undefined,
      assessmentId: assessmentResult.assetId,
    };
    submitPolicy(request);
  }, [assessmentResult, publicKey, coveragePercent, submitPolicy]);

  useEffect(() => {
    if (paymentRequired && signPayment && !signing) {
      setSigning(true); setSignError(null);
      signPayment(PLATFORM_WALLET, INSURANCE_FEE_CSPR)
        .then(({ paymentProof }) => {
          if (!assessmentResult || !publicKey) return;
          submitPolicyWithProof({
            ownerPublicKey: publicKey, assetId: assessmentResult.assetId,
            assetType: assessmentResult.assetType, assetName: assessmentResult.name,
            assessedValue: assessmentResult.assessedValue, askingPrice: assessmentResult.askingPrice,
            confidence: Math.max(assessmentResult.valuationA.confidence, assessmentResult.valuationB.confidence),
            coveragePercent: coveragePercent ? parseFloat(coveragePercent) : undefined,
            assessmentId: assessmentResult.assetId,
          }, paymentProof);
        })
        .catch((err) => setSignError(err.message || 'Payment signing failed'))
        .finally(() => setSigning(false));
    }
  }, [paymentRequired, signPayment, signing, submitPolicyWithProof, assessmentResult, publicKey, coveragePercent]);

  useEffect(() => {
    if (currentPolicy) { setStep(3); if (publicKey) loadPolicies(publicKey); }
  }, [currentPolicy, publicKey, loadPolicies]);

  const handleClaim = useCallback((policyId: string) => { setClaimPolicyId(policyId); setClaimReason(''); }, []);

  const handleConfirmClaim = useCallback(async () => {
    if (!claimPolicyId || !claimReason) return;
    const success = await claim(claimPolicyId, claimReason);
    if (success) { setClaimPolicyId(null); setClaimReason(''); if (publicKey) loadPolicies(publicKey); }
  }, [claimPolicyId, claimReason, claim, publicKey, loadPolicies]);

  const handleStartNew = useCallback(() => {
    reset(); setStep(0); setAssetName(''); setAssetDescription(''); setAssetValue(''); setCoveragePercent('');
  }, [reset]);

  const loadDemo = useCallback(() => {
    const demo = ASSET_TYPES.find(t => t.id === assetType)?.demo;
    if (demo) {
      setAssetName(demo.name); setAssetDescription(demo.description); setAssetValue(demo.value);
      setCoveragePercent(demo.coveragePercent);
      if (demo.location) setLocation(demo.location);
      if (demo.artistOrMedium) setArtistOrMedium(demo.artistOrMedium);
      if (demo.weightOz) setWeightOz(String(demo.weightOz));
    }
    setStep(1);
  }, [assetType]);

  const displayStep = step === 4 ? -1 : step;

  return (
    <div className="wizard-page">
      <PaymentModal
        open={assessPayment.showModal}
        title="Confirm Assessment Payment"
        description={`A fee of ${ASSESSMENT_FEE_CSPR} CSPR is required to run the AI valuation pipeline.`}
        feeLabel="Assessment Fee" feeAmount={ASSESSMENT_FEE_CSPR}
        features={['AI-powered risk assessment', 'On-chain insurance policy', 'Claim revaluation support']}
        signing={assessPayment.signing} signError={assessPayment.signError} signErrorHint={assessPayment.signErrorHint}
        onConfirm={assessPayment.confirm} onCancel={assessPayment.cancel}
      />

      {/* Header */}
      <div className="wizard-header">
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
          <div className="wizard-header__icon"><Shield size={24} /></div>
          <div>
            <h1 className="wizard-header__title">Insure</h1>
            <p className="wizard-header__subtitle">
              Protect your real-world assets against value loss with AI-powered risk assessment and on-chain insurance policies.
            </p>
          </div>
        </div>
        <div className="wizard-header__actions">
          {step < 4 && (
            <button onClick={() => setStep(4)} className="btn" style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}>
              <FileText size={14} /> My Policies ({policies.length})
            </button>
          )}
        </div>
      </div>

      {/* Step Progress */}
      {displayStep >= 0 && (
        <div className="wizard-progress">
          {STEPS.map((label, i) => (
            <React.Fragment key={i}>
              <div className={`wizard-progress__step ${i < displayStep ? 'wizard-progress__step--done' : i === displayStep ? 'wizard-progress__step--active' : ''}`}>
                <div className="wizard-progress__dot">{i < displayStep ? <CheckCircle2 size={14} /> : i + 1}</div>
                <span>{label}</span>
              </div>
              {i < STEPS.length - 1 && <div className={`wizard-progress__line ${i < displayStep ? 'wizard-progress__line--done' : ''}`} />}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Error Banner */}
      {(insError || signError) && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="wizard-error">
          <AlertCircle size={18} color="var(--error)" style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ flex: 1 }}>
            <div className="wizard-error__msg">{insError || signError}</div>
            {insErrorHint && <div className="wizard-error__hint">💡 {insErrorHint}</div>}
          </div>
          <button onClick={() => { clearError(); setSignError(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)', padding: 4 }}>
            <XCircle size={16} />
          </button>
        </motion.div>
      )}

      {/* ═══ Step 0: Asset Type ═══════════════════════════════════════════ */}
      {step === 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="wizard-card">
          <h3 className="wizard-card__title">Select Asset to Insure</h3>
          <p className="wizard-card__desc">Choose the asset class. Our AI will assess risk and calculate your premium.</p>
          <div className="wizard-asset-grid">
            {ASSET_TYPES.map((type) => (
              <button key={type.id} onClick={() => setAssetType(type.id)} className={`wizard-asset-btn ${assetType === type.id ? 'wizard-asset-btn--active' : ''}`}>
                <div className="wizard-asset-btn__icon">{type.icon}</div>
                <div className="wizard-asset-btn__label">{type.label}</div>
                <div className="wizard-asset-btn__sub">{type.sub}</div>
              </button>
            ))}
          </div>
          <div className="wizard-actions">
            <button onClick={loadDemo} className="btn" style={{ flex: 1 }}>Try Sample</button>
            <button onClick={() => setStep(1)} className="btn btn-primary" style={{ flex: 2 }}>Continue <ArrowRight size={16} /></button>
          </div>
        </motion.div>
      )}

      {/* ═══ Step 1: Asset Details ════════════════════════════════════════ */}
      {step === 1 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="wizard-card">
          <h3 className="wizard-card__title">Asset Details</h3>
          <p className="wizard-card__desc">Provide asset information for AI risk evaluation.</p>

          {!connected && (
            <div className="wizard-wallet-prompt">
              <AlertCircle size={18} color="var(--accent)" style={{ flexShrink: 0 }} />
              <span className="wizard-wallet-prompt__text">Connect your Casper wallet to run the assessment and create an insurance policy.</span>
              <button onClick={() => wallet.connect()} className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '0.5rem 1rem', whiteSpace: 'nowrap' }}>Connect Wallet</button>
            </div>
          )}

          <div className="wizard-field">
            <label className="wizard-field__label wizard-field__label--required">Asset Name</label>
            <input type="text" value={assetName} onChange={(e) => setAssetName(e.target.value)} placeholder="e.g. Miami Beachfront Condo" className="wizard-field__input" />
          </div>
          <div className="wizard-field">
            <label className="wizard-field__label">Description</label>
            <textarea value={assetDescription} onChange={(e) => setAssetDescription(e.target.value)} placeholder="Key details about the asset..." rows={3} className="wizard-field__input" />
          </div>
          <div className="wizard-form-row">
            <div className="wizard-field">
              <label className="wizard-field__label wizard-field__label--required">Estimated Value (USD)</label>
              <input type="number" value={assetValue} onChange={(e) => setAssetValue(e.target.value)} placeholder="e.g. 14,200,000" className="wizard-field__input" />
            </div>
            <div className="wizard-field">
              <label className="wizard-field__label">Coverage %</label>
              <input type="number" value={coveragePercent} onChange={(e) => setCoveragePercent(e.target.value)} placeholder="e.g. 75" min={1} max={90} className="wizard-field__input" />
              <div className="wizard-field__hint">Max: {assetType === 'real-estate' ? '80%' : assetType === 'art' ? '60%' : '90%'}</div>
            </div>
          </div>
          {assetType === 'real-estate' && (
            <div className="wizard-field">
              <label className="wizard-field__label">Location</label>
              <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Austin, TX" className="wizard-field__input" />
            </div>
          )}
          {assetType === 'art' && (
            <div className="wizard-field">
              <label className="wizard-field__label">Artist / Medium</label>
              <input type="text" value={artistOrMedium} onChange={(e) => setArtistOrMedium(e.target.value)} placeholder="e.g. Basquiat, Acrylic on canvas" className="wizard-field__input" />
            </div>
          )}
          {assetType === 'commodity' && (
            <div className="wizard-field">
              <label className="wizard-field__label wizard-field__label--required">Weight (oz)</label>
              <input type="number" value={weightOz} onChange={(e) => setWeightOz(e.target.value)} placeholder="e.g. 400" className="wizard-field__input" />
            </div>
          )}
          <div className="wizard-actions">
            <button onClick={() => setStep(0)} className="btn"><ArrowLeft size={16} /> Back</button>
            {!connected ? (
              <button onClick={() => wallet.connect()} className="btn btn-primary">Connect Wallet to Continue <ArrowRight size={16} /></button>
            ) : (
              <button onClick={handleSubmitAsset} disabled={!assetName || !assetValue || assessmentLoading} className="btn btn-primary" style={{ opacity: !assetName || !assetValue ? 0.5 : 1 }}>
                {assessmentLoading ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Running...</> : <>Run Assessment <ArrowRight size={16} /></>}
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* ═══ Step 2: Assessment ═══════════════════════════════════════════ */}
      {step === 2 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="wizard-card">
          {assessmentLoading || insLoading ? (
            <div className="wizard-loading">
              <div className="wizard-loading__spinner" />
              <div className="wizard-loading__title">{assessmentLoading ? 'AI Agents Are Assessing Your Asset' : 'Calculating Risk & Premium...'}</div>
              <div className="wizard-loading__desc">{assessmentLoading ? '3 independent analysts are evaluating your asset...' : 'Risk engine is analyzing market data and volatility...'}</div>
            </div>
          ) : assessmentResult ? (
            <div>
              <div className="wizard-result-header">
                <div className="wizard-result-header__icon"><CheckCircle2 size={20} /></div>
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
                  <div className="wizard-metric__label">Coverage</div>
                  <div className="wizard-metric__value wizard-metric__value--secondary">{coveragePercent ? `${coveragePercent}%` : 'Max'}</div>
                </div>
              </div>
              <div style={{ marginBottom: '1.5rem' }}><AgentExplainer assessment={assessmentResult} /></div>
            </div>
          ) : (
            <div className="wizard-loading">
              <AlertTriangle size={32} color="var(--text-tertiary)" style={{ marginBottom: '1rem' }} />
              <div className="wizard-loading__title">Assessment Failed</div>
              <div className="wizard-loading__desc" style={{ marginBottom: '1.5rem' }}>{assessmentError || 'The AI agents couldn\'t complete the assessment.'}</div>
              <button onClick={handleStartNew} className="btn btn-primary"><RotateCcw size={16} /> Try Again</button>
            </div>
          )}
        </motion.div>
      )}

      {/* ═══ Step 3: Policy Created ═══════════════════════════════════════ */}
      {step === 3 && currentPolicy && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="wizard-card">
          <div className="wizard-result-header">
            <div className="wizard-result-header__icon"><CheckCircle2 size={20} /></div>
            <div className="wizard-result-header__title">Insurance Policy Created</div>
          </div>
          <div className="wizard-metrics" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
            <div className="wizard-metric">
              <div className="wizard-metric__label">Coverage Amount</div>
              <div className="wizard-metric__value wizard-metric__value--secondary">{formatCurrency(currentPolicy.coverageAmount)}</div>
            </div>
            <div className="wizard-metric">
              <div className="wizard-metric__label">Asset Value</div>
              <div className="wizard-metric__value">{formatCurrency(currentPolicy.assessedValue)}</div>
            </div>
            <div className="wizard-metric">
              <div className="wizard-metric__label">Risk Score</div>
              <div className="wizard-metric__value" style={{ color: riskColor(currentPolicy.riskScore) }}>{currentPolicy.riskScore}/100</div>
            </div>
            <div className="wizard-metric">
              <div className="wizard-metric__label">Premium</div>
              <div className="wizard-metric__value">{currentPolicy.premiumCSPR} CSPR/mo</div>
            </div>
          </div>

          {currentPolicy.riskFactors.length > 0 && (
            <div className="wizard-info-panel" style={{ background: 'var(--warning-soft)', border: '1px solid var(--warning)' }}>
              <div className="wizard-info-panel__title"><AlertTriangle size={14} /> Risk Factors</div>
              {currentPolicy.riskFactors.map((f, i) => (
                <div key={i} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>• {f}</div>
              ))}
            </div>
          )}

          <div className="wizard-info-panel" style={{ background: 'var(--success-soft)', border: '1px solid var(--success)' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <Shield size={14} style={{ verticalAlign: 'middle', marginRight: '0.4rem' }} />
              Policy active for 365 days. Deductible: {currentPolicy.deductiblePercent}%. File a claim anytime if your asset loses value.
            </div>
          </div>

          {assessmentResult && (
            <div style={{ marginBottom: '1.5rem' }}>
              <AgentExplainer assessment={assessmentResult} insurance={{
                riskScore: currentPolicy.riskScore, riskFactors: currentPolicy.riskFactors,
                tier: currentPolicy.tier, coverageAmount: currentPolicy.coverageAmount,
                premiumCSPR: currentPolicy.premiumCSPR, deductiblePercent: currentPolicy.deductiblePercent,
              }} />
            </div>
          )}

          <div className="wizard-actions">
            <button onClick={handleStartNew} className="btn"><RotateCcw size={16} /> New Policy</button>
            <button onClick={() => setStep(4)} className="btn btn-primary"><FileText size={16} /> View My Policies</button>
          </div>
        </motion.div>
      )}

      {/* ═══ Step 4: My Policies ══════════════════════════════════════════ */}
      {step === 4 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>My Insurance Policies</h3>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={handleStartNew} className="btn" style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}><Shield size={14} /> New Policy</button>
              <button onClick={() => publicKey && loadPolicies(publicKey)} className="btn" style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}><RefreshCw size={14} /> Refresh</button>
            </div>
          </div>

          {insLoading && policies.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}><Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent)' }} /></div>
          ) : policies.length === 0 ? (
            <div className="wizard-empty">
              <div className="wizard-empty__icon"><Shield size={24} /></div>
              <div className="wizard-empty__title">No insurance policies yet</div>
              <div className="wizard-empty__text">Submit an asset for assessment to create your first policy.</div>
            </div>
          ) : (
            policies.map((policy) => {
              const daysLeft = daysUntilExpiry(policy.expiresAt);
              return (
                <div key={policy.policyId} className="wizard-list-card">
                  <div className="wizard-list-card__header">
                    <div>
                      <div className="wizard-list-card__id">Policy #{policy.policyId.slice(0, 8)}</div>
                      <div className="wizard-list-card__amount">{policy.assetName}</div>
                    </div>
                    <span className={`wizard-status wizard-status--${statusVariant(policy.status)}`}>{policy.status}</span>
                  </div>
                  <div className="wizard-list-card__stats">
                    <div>
                      <div className="wizard-list-card__stat-label">Coverage</div>
                      <div className="wizard-list-card__stat-value">{formatCurrency(policy.coverageAmount)}</div>
                    </div>
                    <div>
                      <div className="wizard-list-card__stat-label">Risk</div>
                      <div className="wizard-list-card__stat-value" style={{ color: riskColor(policy.riskScore) }}>{policy.riskScore}/100</div>
                    </div>
                    <div>
                      <div className="wizard-list-card__stat-label">Expires</div>
                      <div className="wizard-list-card__stat-value">{daysLeft > 0 ? `${daysLeft}d` : 'Expired'}</div>
                    </div>
                  </div>
                  <div className="wizard-health-bar">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${policy.riskScore}%` }} transition={{ duration: 0.5 }}
                      className="wizard-health-bar__fill" style={{ background: riskColor(policy.riskScore) }} />
                  </div>
                  {policy.status === 'active' && (
                    <button onClick={() => handleClaim(policy.policyId)} disabled={insLoading} className="btn btn-primary" style={{ width: '100%', fontSize: '0.8rem', padding: '0.5rem' }}>
                      <TrendingDown size={14} /> File Claim
                    </button>
                  )}
                  {policy.claimHistory.length > 0 && (
                    <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-weak)' }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: '0.4rem' }}>Claims ({policy.claimHistory.length})</div>
                      {policy.claimHistory.map((c) => (
                        <div key={c.claimId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.2rem' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>{c.reason.slice(0, 40)}...</span>
                          <span style={{ fontWeight: 600, color: c.status === 'denied' ? 'var(--error)' : 'var(--text-secondary)' }}>
                            {c.status === 'paid' ? `$${c.amount.toLocaleString()}` : c.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Claim modal */}
          <AppModal open={!!claimPolicyId} onClose={() => setClaimPolicyId(null)}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.75rem' }}>File Insurance Claim</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Describe the loss or damage. The AI will revalue the asset and determine your payout.</p>
            <div className="wizard-field">
              <label className="wizard-field__label wizard-field__label--required">Reason for Claim</label>
              <textarea value={claimReason} onChange={(e) => setClaimReason(e.target.value)} placeholder="e.g. Property value dropped 30% due to market crash..." rows={3} className="wizard-field__input" />
            </div>
            <AppModalActions onCancel={() => setClaimPolicyId(null)} onConfirm={handleConfirmClaim} confirmLabel="File Claim" confirmDisabled={!claimReason || insLoading} confirmLoading={insLoading} />
          </AppModal>

          {/* Claim result modal */}
          <AppModal open={!!claimResult} onClose={() => { if (publicKey) loadPolicies(publicKey); }} maxWidth={400}>
            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
              {claimResult?.status === 'paid' ? (
                <>
                  <CheckCircle2 size={48} color="var(--success)" style={{ marginBottom: '0.5rem' }} />
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>Claim Approved</h3>
                  <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-secondary)', margin: '0.5rem 0' }}>${claimResult.amount.toLocaleString()}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', margin: 0 }}>Payout processed on testnet</p>
                </>
              ) : (
                <>
                  <XCircle size={48} color="var(--error)" style={{ marginBottom: '0.5rem' }} />
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>Claim Denied</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.5rem 0' }}>Loss did not exceed the deductible threshold.</p>
                </>
              )}
            </div>
            {claimResult?.revaluation && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div className="wizard-metric">
                  <div className="wizard-metric__label">Previous Value</div>
                  <div className="wizard-metric__value">{formatCurrency(claimResult.revaluation.previousValue)}</div>
                </div>
                <div className="wizard-metric">
                  <div className="wizard-metric__label">Current Value</div>
                  <div className="wizard-metric__value" style={{ color: 'var(--error)' }}>{formatCurrency(claimResult.revaluation.newValue)}</div>
                </div>
              </div>
            )}
            <button onClick={() => { if (publicKey) loadPolicies(publicKey); }} className="btn btn-primary" style={{ width: '100%', padding: '0.75rem' }}>Done</button>
          </AppModal>
        </motion.div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default InsureView;
