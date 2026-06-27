import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  RotateCcw,
  FileText,
  RefreshCw,
  AlertCircle,
  XCircle,
  Building2,
  Palette,
  Gem,
  TrendingDown,
} from 'lucide-react';
import { useWallet } from '../contexts/CSPRClickContext';
import { useInsurance } from '../hooks/useInsurance';
import { useAssessment } from '../hooks/useAssessment';
import {
  type AssetType,
  type InsuranceCreateRequest,
  type InsurancePolicy,
  type AssessmentRequest,
} from '../services/api';
import { PLATFORM_WALLET, INSURANCE_FEE_CSPR, ASSESSMENT_FEE_CSPR } from '../config/casper';
import { AgentExplainer } from '../components/AgentExplainer';
import PaymentModal from '../components/PaymentModal';
import { usePaymentFlow } from '../hooks/usePaymentFlow';

// ─── Constants ───────────────────────────────────────────────────────────────

const ASSET_TYPES: Array<{
  id: AssetType;
  label: string;
  icon: React.ReactNode;
  demo: {
    name: string;
    description: string;
    value: string;
    coveragePercent: string;
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
      value: '14200000',
      coveragePercent: '75',
      location: 'Austin, TX',
    },
  },
  {
    id: 'art',
    label: 'Fine Art',
    icon: <Palette size={20} />,
    demo: {
      name: 'Basquiat Untitled (Skull), 1981',
      description: 'Acrylic and oilstick on canvas, 72×68 in. Provenance: Galerie Thaddeus Ropac → Private European collection → Current owner. Authenticated by Basquiat Authentication Committee.',
      value: '120000000',
      coveragePercent: '50',
      artistOrMedium: 'Jean-Michel Basquiat, Acrylic and oilstick on canvas',
    },
  },
  {
    id: 'commodity',
    label: 'Commodity',
    icon: <Gem size={20} />,
    demo: {
      name: 'LBMA Gold Bar - 400 oz',
      description: 'London Bullion Market Association certified, 995.0 fine gold bar. Serial #AU-2024-8847. Stored in Brink\'s London vault. Current spot: $2,340/oz.',
      value: '936000',
      coveragePercent: '85',
      weightOz: 400,
    },
  },
];

const RISK_TIERS: Record<AssetType, string> = {
  'real-estate': '2-3% premium',
  'art': '3.5-5% premium',
  'commodity': '1.5-2.5% premium',
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

function riskColor(score: number): string {
  if (score <= 30) return 'var(--text-secondary)';
  if (score <= 55) return 'var(--text-tertiary)';
  return 'var(--red-600)';
}

function riskLabel(score: number): string {
  if (score <= 30) return 'Low Risk';
  if (score <= 55) return 'Medium Risk';
  return 'High Risk';
}

function statusColor(status: string): string {
  switch (status) {
    case 'active': return 'var(--text-secondary)';
    case 'expired': return 'var(--text-tertiary)';
    case 'claimed': return 'var(--text-tertiary)';
    case 'paid': return 'var(--red-600)';
    default: return 'var(--text-tertiary)';
  }
}

function daysUntilExpiry(expiresAt: number): number {
  return Math.max(0, Math.ceil((expiresAt - Date.now()) / (24 * 60 * 60 * 1000)));
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.7rem 0.9rem',
  borderRadius: '6px',
  border: '1px solid var(--border)',
  background: 'var(--bg-base)',
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
  background: 'var(--accent)',
  color: 'var(--text-inverse)',
  fontSize: '0.95rem',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.15s ease',
};

const btnSecondary: React.CSSProperties = {
  ...btnPrimary,
  background: 'var(--bg-elevated)',
  color: 'var(--text-primary)',
  border: '1px solid var(--border)',
};

const cardStyle: React.CSSProperties = {
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border)',
  borderRadius: '12px',
  padding: '1.5rem',
};

// ─── Policy Card ─────────────────────────────────────────────────────────────

const PolicyCard: React.FC<{
  policy: InsurancePolicy;
  onClaim: (policyId: string) => void;
  loading: boolean;
}> = ({ policy, onClaim, loading }) => {
  const daysLeft = daysUntilExpiry(policy.expiresAt);
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ ...cardStyle, marginBottom: '1rem' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{policy.assetName}</div>
        <span style={{
          padding: '0.2rem 0.6rem',
          borderRadius: '4px',
          fontSize: '0.75rem',
          fontWeight: 600,
          background: `${statusColor(policy.status)}15`,
          color: statusColor(policy.status),
          textTransform: 'capitalize',
        }}>
          {policy.status}
        </span>
      </div>

      <div className="insure-coverage-grid">
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '0.2rem' }}>Coverage</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{formatCurrency(policy.coverageAmount)}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '0.2rem' }}>Risk</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 600, color: riskColor(policy.riskScore) }}>
            {policy.riskScore}/100, {riskLabel(policy.riskScore)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '0.2rem' }}>Expires</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>
            {daysLeft > 0 ? `${daysLeft} days` : 'Expired'}
          </div>
        </div>
      </div>

      {/* Risk bar */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ height: 6, borderRadius: 3, background: 'var(--bg-base)', overflow: 'hidden' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${policy.riskScore}%` }}
            transition={{ duration: 0.5 }}
            style={{ height: '100%', background: riskColor(policy.riskScore), borderRadius: 3 }}
          />
        </div>
      </div>

      {/* Risk factors */}
      {policy.riskFactors.length > 0 && (
        <div style={{ marginBottom: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          {policy.riskFactors.map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
              <AlertTriangle size={12} color="var(--text-tertiary)" />
              {f}
            </div>
          ))}
        </div>
      )}

      {policy.status === 'active' && (
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => onClaim(policy.policyId)}
            disabled={loading}
            style={{ ...btnPrimary, flex: 1, fontSize: '0.85rem', padding: '0.6rem' }}
          >
            <TrendingDown size={14} /> File Claim
          </button>
        </div>
      )}

      {/* Claim history */}
      {policy.claimHistory.length > 0 && (
        <div style={{ marginTop: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: '0.4rem' }}>
            Claims ({policy.claimHistory.length})
          </div>
          {policy.claimHistory.map((c) => (
            <div key={c.claimId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.2rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>{c.reason.slice(0, 40)}...</span>
              <span style={{ fontWeight: 600, color: c.status === 'denied' ? 'var(--red-600)' : 'var(--text-secondary)' }}>
                {c.status === 'paid' ? `$${c.amount.toLocaleString()}` : c.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────

export const InsureView: React.FC = () => {
  const wallet = useWallet();
  const { publicKey, connected, signPayment } = wallet;
  const {
    loading: insLoading,
    error: insError,
    errorHint: insErrorHint,
    policies,
    currentPolicy,
    claimResult,
    paymentRequired,
    submitPolicy,
    submitPolicyWithProof,
    loadPolicies,
    claim,
    reset,
    clearError,
  } = useInsurance();

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
  const [coveragePercent, setCoveragePercent] = useState('');
  const [location, setLocation] = useState('');
  const [artistOrMedium, setArtistOrMedium] = useState('');
  const [weightOz, setWeightOz] = useState('');
  const [signing, setSigning] = useState(false);
  const [signError, setSignError] = useState<string | null>(null);

  // Assessment payment flow (shared hook)
  const assessPayment = usePaymentFlow(signPayment, ASSESSMENT_FEE_CSPR, async (paymentProof) => {
    if (!assessPayment.pendingPayloadRef.current) return;
    await submitAssessmentWithProof(assessPayment.pendingPayloadRef.current, paymentProof);
    setStep(2);
  });

  // Claim modal
  const [claimPolicyId, setClaimPolicyId] = useState<string | null>(null);
  const [claimReason, setClaimReason] = useState('');

  // Load policies on mount
  useEffect(() => {
    if (connected && publicKey) {
      loadPolicies(publicKey);
    }
  }, [connected, publicKey, loadPolicies]);

  // Submit asset for assessment (same as Borrow flow)
  const handleSubmitAsset = useCallback(async () => {
    if (!assetName || !assetValue) return;

    const request: AssessmentRequest = {
      assetType,
      name: assetName,
      description: assetDescription || undefined,
      askingPrice: parseFloat(assetValue),
      location: location || undefined,
      artistOrMedium: artistOrMedium || undefined,
      weightOz: weightOz ? parseFloat(weightOz) : undefined,
    };

    assessPayment.openModal(request);
  }, [assetType, assetName, assetDescription, assetValue, location, artistOrMedium, weightOz, assessPayment]);

  // When assessment completes, request insurance
  useEffect(() => {
    if (!assessmentResult || !publicKey) return;

    const request: InsuranceCreateRequest = {
      ownerPublicKey: publicKey,
      assetId: assessmentResult.assetId,
      assetType: assessmentResult.assetType,
      assetName: assessmentResult.name,
      assessedValue: assessmentResult.assessedValue,
      askingPrice: assessmentResult.askingPrice,
      confidence: Math.max(assessmentResult.valuationA.confidence, assessmentResult.valuationB.confidence),
      coveragePercent: coveragePercent ? parseFloat(coveragePercent) : undefined,
      assessmentId: assessmentResult.assetId,
    };

    submitPolicy(request);
  }, [assessmentResult, publicKey, coveragePercent, submitPolicy]);

  // When payment is required for insurance, trigger wallet signing
  useEffect(() => {
    if (paymentRequired && signPayment && !signing) {
      setSigning(true);
      setSignError(null);

      signPayment(PLATFORM_WALLET, INSURANCE_FEE_CSPR)
        .then(({ paymentProof }) => {
          if (!assessmentResult || !publicKey) return;
          submitPolicyWithProof(
            {
              ownerPublicKey: publicKey,
              assetId: assessmentResult.assetId,
              assetType: assessmentResult.assetType,
              assetName: assessmentResult.name,
              assessedValue: assessmentResult.assessedValue,
              askingPrice: assessmentResult.askingPrice,
              confidence: Math.max(assessmentResult.valuationA.confidence, assessmentResult.valuationB.confidence),
              coveragePercent: coveragePercent ? parseFloat(coveragePercent) : undefined,
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
  }, [paymentRequired, signPayment, signing, submitPolicyWithProof, assessmentResult, publicKey, coveragePercent]);

  // When policy is created, move to step 3
  useEffect(() => {
    if (currentPolicy) {
      setStep(3);
      if (publicKey) loadPolicies(publicKey);
    }
  }, [currentPolicy, publicKey, loadPolicies]);

  const handleClaim = useCallback((policyId: string) => {
    setClaimPolicyId(policyId);
    setClaimReason('');
  }, []);

  const handleConfirmClaim = useCallback(async () => {
    if (!claimPolicyId || !claimReason) return;
    const success = await claim(claimPolicyId, claimReason);
    if (success) {
      setClaimPolicyId(null);
      setClaimReason('');
      if (publicKey) loadPolicies(publicKey);
    }
  }, [claimPolicyId, claimReason, claim, publicKey, loadPolicies]);

  const handleStartNew = useCallback(() => {
    reset();
    setStep(0);
    setAssetName('');
    setAssetDescription('');
    setAssetValue('');
    setCoveragePercent('');
  }, [reset]);

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      {/* Assessment Payment Modal */}
      <PaymentModal
        open={assessPayment.showModal}
        title="Assessment Fee Required"
        description={`To run an AI-powered assessment of your asset, a fee of ${ASSESSMENT_FEE_CSPR} CSPR is required.`}
        feeLabel="Assessment Fee"
        feeAmount={ASSESSMENT_FEE_CSPR}
        features={[
          'AI-powered risk assessment',
          'On-chain insurance policy',
          'Claim revaluation support',
        ]}
        signing={assessPayment.signing}
        signError={assessPayment.signError}
        signErrorHint={assessPayment.signErrorHint}
        onConfirm={assessPayment.confirm}
        onCancel={assessPayment.cancel}
      />

      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <Shield size={28} color="var(--accent)" />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Insure Your Asset</h2>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
          Get AI-powered risk assessment and on-chain insurance for your real-world assets.
        </p>
      </div>

      {/* Error banner */}
      {(insError || signError) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            ...cardStyle,
            marginBottom: '1rem',
            borderColor: 'var(--error)',
            background: 'var(--error-soft)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <AlertCircle size={18} color="var(--error)" />
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--error)' }}>
              {insError || signError}
            </span>
            {insErrorHint && (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                💡 {insErrorHint}
              </div>
            )}
          </div>
          <button onClick={() => { clearError(); setSignError(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)' }}>
            <XCircle size={16} />
          </button>
        </motion.div>
      )}

      {/* ─── Step 0: Asset Type ─────────────────────────────────────────── */}
      {step === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={cardStyle}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>
            What type of asset do you want to insure?
          </h3>
          <div className="insure-asset-type-grid">
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
                    border: `2px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`,
                    background: isActive ? 'rgba(255, 59, 59, 0.04)' : 'var(--bg-elevated)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                  }}
                >
                  {type.icon}
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{type.label}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                    {RISK_TIERS[type.id]}
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
                setCoveragePercent(demo.coveragePercent);
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
            Asset Details
          </h3>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
              Asset Name <span style={{ color: 'var(--accent)' }}>*</span>
            </label>
            <input
              type="text"
              value={assetName}
              onChange={(e) => setAssetName(e.target.value)}
              placeholder="e.g. Miami Beachfront Condo"
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
              placeholder="Describe the asset..."
              rows={3}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          <div className="insure-coverage-period-grid">
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                Estimated Value (USD) <span style={{ color: 'var(--accent)' }}>*</span>
              </label>
              <input
                type="number"
                value={assetValue}
                onChange={(e) => setAssetValue(e.target.value)}
                placeholder="e.g. 1250000"
                min={1}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                Coverage %
              </label>
              <input
                type="number"
                value={coveragePercent}
                onChange={(e) => setCoveragePercent(e.target.value)}
                placeholder="e.g. 75"
                min={1}
                max={90}
                style={inputStyle}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                Max: {assetType === 'real-estate' ? '80%' : assetType === 'art' ? '60%' : '90%'}
              </span>
            </div>
          </div>

          {assetType === 'real-estate' && (
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                Location
              </label>
              <input
                type="text"
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
                Artist / Medium
              </label>
              <input
                type="text"
                value={artistOrMedium}
                onChange={(e) => setArtistOrMedium(e.target.value)}
                placeholder="e.g. Jean-Michel Basquiat, Acrylic on canvas"
                style={inputStyle}
              />
            </div>
          )}

          {assetType === 'commodity' && (
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                Weight (oz) <span style={{ color: 'var(--accent)' }}>*</span>
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
                className="mobile-sticky-cta"
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
          {assessmentLoading || insLoading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent)', marginBottom: '1rem' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                {assessmentLoading ? 'AI Agents Are Assessing Your Asset' : 'Calculating Risk & Premium...'}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                {assessmentLoading
                  ? '3 independent analysts are evaluating your asset...'
                  : 'Risk engine is analyzing market data and volatility...'}
              </p>
            </div>
          ) : assessmentResult ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <CheckCircle2 size={20} color="var(--text-secondary)" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>Assessment Complete</h3>
              </div>

              <div className="insure-estimate-grid">
                <div style={{ textAlign: 'center', padding: '1rem', background: 'var(--bg-base)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>Your Estimate</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{formatCurrency(assessmentResult.askingPrice)}</div>
                </div>
                <div style={{ textAlign: 'center', padding: '1rem', background: 'var(--bg-base)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>AI Valuation</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent)' }}>
                    {formatCurrency(assessmentResult.assessedValue)}
                  </div>
                </div>
                <div style={{ textAlign: 'center', padding: '1rem', background: 'var(--bg-base)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>Coverage</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    {coveragePercent ? `${coveragePercent}%` : 'Max'}
                  </div>
                </div>
              </div>

              {/* Agent explanation for assessment */}
              {assessmentResult && (
                <div style={{ marginTop: '1.5rem' }}>
                  <AgentExplainer assessment={assessmentResult} />
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <AlertTriangle size={32} color="var(--text-tertiary)" style={{ marginBottom: '1rem' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Assessment Failed</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                {assessmentError || insError || 'The AI agents couldn\'t complete the assessment. Please try again.'}
              </p>
              <button onClick={handleStartNew} style={btnPrimary}>
                <RotateCcw size={16} /> Try Again
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* ─── Step 3: Policy Confirmation ────────────────────────────────── */}
      {step === 3 && currentPolicy && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <CheckCircle2 size={20} color="var(--text-secondary)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>Insurance Policy Created (Demo)</h3>
          </div>

          <div className="insure-claim-info-grid">
            <div style={{ padding: '1rem', background: 'var(--bg-base)', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>Coverage Amount</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                {formatCurrency(currentPolicy.coverageAmount)}
              </div>
            </div>
            <div style={{ padding: '1rem', background: 'var(--bg-base)', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>Asset Value</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>
                {formatCurrency(currentPolicy.assessedValue)}
              </div>
            </div>
            <div style={{ padding: '1rem', background: 'var(--bg-base)', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>Risk Score</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: riskColor(currentPolicy.riskScore) }}>
                {currentPolicy.riskScore}/100, {currentPolicy.tier}
              </div>
            </div>
            <div style={{ padding: '1rem', background: 'var(--bg-base)', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>Premium</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>
                {currentPolicy.premiumCSPR} CSPR/mo
              </div>
            </div>
          </div>

          {/* Risk factors */}
          {currentPolicy.riskFactors.length > 0 && (
            <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'var(--warning-soft)', borderRadius: '8px', border: '1px solid var(--warning)' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: '0.4rem' }}>Risk Factors</div>
              {currentPolicy.riskFactors.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>
                  <AlertTriangle size={12} color="var(--text-tertiary)" />
                  {f}
                </div>
              ))}
            </div>
          )}

          <div style={{
            padding: '0.75rem',
            background: 'var(--success-soft)',
            borderRadius: '8px',
            border: '1px solid var(--success)',
            marginBottom: '1.5rem',
            fontSize: '0.85rem',
            color: 'var(--text-secondary)',
          }}>
            <Shield size={14} style={{ verticalAlign: 'middle', marginRight: '0.4rem', color: 'var(--text-secondary)' }} />
            Policy active for 365 days. Deductible: {currentPolicy.deductiblePercent}%.
            File a claim anytime if your asset loses value.
          </div>

          {/* Agent explanation with insurance context */}
          {assessmentResult && (
            <div style={{ marginBottom: '1.5rem' }}>
              <AgentExplainer
                assessment={assessmentResult}
                insurance={{
                  riskScore: currentPolicy.riskScore,
                  riskFactors: currentPolicy.riskFactors,
                  tier: currentPolicy.tier,
                  coverageAmount: currentPolicy.coverageAmount,
                  premiumCSPR: currentPolicy.premiumCSPR,
                  deductiblePercent: currentPolicy.deductiblePercent,
                }}
              />
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={handleStartNew} style={{ ...btnSecondary, flex: 1 }}>
              <RotateCcw size={16} /> New Policy
            </button>
            <button onClick={() => setStep(4)} style={{ ...btnPrimary, flex: 1 }}>
              <FileText size={16} /> View My Policies
            </button>
          </div>
        </motion.div>
      )}

      {/* ─── Step 4: My Policies ────────────────────────────────────────── */}
      {step === 4 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>My Insurance Policies</h3>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={handleStartNew} style={{ ...btnSecondary, fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
                <Shield size={14} /> New Policy
              </button>
              <button onClick={() => publicKey && loadPolicies(publicKey)} style={{ ...btnSecondary, fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
                <RefreshCw size={14} /> Refresh
              </button>
            </div>
          </div>

          {insLoading && policies.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent)' }} />
            </div>
          ) : policies.length === 0 ? (
            <div style={{ ...cardStyle, textAlign: 'center', padding: '3rem' }}>
              <Shield size={32} style={{ color: 'var(--text-tertiary)', marginBottom: '0.75rem' }} />
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                No insurance policies yet. Submit an asset to get started.
              </p>
            </div>
          ) : (
            policies.map((policy) => (
              <PolicyCard
                key={policy.policyId}
                policy={policy}
                onClaim={handleClaim}
                loading={insLoading}
              />
            ))
          )}

          {/* Claim modal */}
          {claimPolicyId && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                position: 'fixed', inset: 0,
                background: 'rgba(0,0,0,0.7)',
                backdropFilter: 'blur(4px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 1000,
              }}
              onClick={() => setClaimPolicyId(null)}
            >
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                style={{ ...cardStyle, maxWidth: 400, width: '90%' }}
                onClick={(e) => e.stopPropagation()}
              >
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.75rem' }}>
                  File Insurance Claim
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  Describe the loss or damage to your asset. The AI will revalue the asset and determine your payout.
                </p>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                    Reason for Claim <span style={{ color: 'var(--accent)' }}>*</span>
                  </label>
                  <textarea
                    value={claimReason}
                    onChange={(e) => setClaimReason(e.target.value)}
                    placeholder="e.g. Property value dropped 30% due to market crash..."
                    rows={3}
                    style={{ ...inputStyle, resize: 'vertical' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button onClick={() => setClaimPolicyId(null)} style={{ ...btnSecondary, flex: 1 }}>
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmClaim}
                    disabled={!claimReason || insLoading}
                    style={{ ...btnPrimary, flex: 1, opacity: !claimReason || insLoading ? 0.5 : 1 }}
                  >
                    {insLoading ? (
                      <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Processing...</>
                    ) : (
                      <>File Claim</>
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Claim result modal */}
          <AnimatePresence>
            {claimResult && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  position: 'fixed', inset: 0,
                  background: 'rgba(0,0,0,0.7)',
                  backdropFilter: 'blur(4px)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  zIndex: 1001,
                }}
                onClick={() => {}} // Don't close on backdrop click
              >
                <motion.div
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.95 }}
                  style={{ ...cardStyle, maxWidth: 400, width: '90%' }}
                >
                  <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                    {claimResult.status === 'paid' ? (
                      <>
                        <CheckCircle2 size={48} color="var(--text-secondary)" style={{ marginBottom: '0.5rem' }} />
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>Claim Approved! (Demo)</h3>
                        <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-secondary)', margin: '0.5rem 0' }}>
                          ${claimResult.amount.toLocaleString()}
                        </p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', margin: 0 }}>
                          Simulated payout - no real funds transferred
                        </p>
                      </>
                    ) : (
                      <>
                        <XCircle size={48} color="var(--error)" style={{ marginBottom: '0.5rem' }} />
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>Claim Denied (Demo)</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.5rem 0' }}>
                          Loss did not exceed the deductible threshold.
                        </p>
                      </>
                    )}
                  </div>

                  {claimResult.revaluation && (
                    <div className="insure-revaluation-grid">
                      <div style={{ padding: '0.75rem', background: 'var(--bg-base)', borderRadius: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Previous Value</div>
                        <div style={{ fontWeight: 600 }}>{formatCurrency(claimResult.revaluation.previousValue)}</div>
                      </div>
                      <div style={{ padding: '0.75rem', background: 'var(--bg-base)', borderRadius: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Current Value</div>
                        <div style={{ fontWeight: 600, color: 'var(--error)' }}>{formatCurrency(claimResult.revaluation.newValue)}</div>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      // Clear claim result and refresh
                      if (publicKey) loadPolicies(publicKey);
                    }}
                    style={{ ...btnPrimary, width: '100%' }}
                  >
                    Done
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
};

export default InsureView;
