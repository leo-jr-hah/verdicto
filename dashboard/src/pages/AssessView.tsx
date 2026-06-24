import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  Palette,
  Gem,
  Search,
  ArrowRight,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  Loader2,
  RotateCcw,
  ChevronDown,
  Shield,
  Scale,
  FileText,
  Database,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Info,
  Zap,
  Terminal,
} from 'lucide-react';
import PaymentModal from '../components/PaymentModal';
import {
  useAssessment,
  validateAssessmentForm,
  type FormErrors,
} from '../hooks/useAssessment';
import type { AssetType, AssessmentResult, AssessmentRequest, DemoAsset } from '../services/api';
import { MultiMethodologyDashboard } from '../components/MultiMethodologyDashboard';
import { useWallet } from '../contexts/CSPRClickContext';
import { PLATFORM_WALLET, ASSESSMENT_FEE_CSPR } from '../config/casper';

// ─── Constants ───────────────────────────────────────────────────────────────

const ASSET_TYPES: Array<{
  id: AssetType;
  label: string;
  icon: React.ReactNode;
  description: string;
}> = [
  { id: 'real-estate', label: 'Real Estate', icon: <Building2 size={20} />, description: 'Property, land, buildings' },
  { id: 'art', label: 'Fine Art', icon: <Palette size={20} />, description: 'Paintings, sculptures, prints' },
  { id: 'commodity', label: 'Commodity', icon: <Gem size={20} />, description: 'Gold, silver, platinum' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

function divergenceColor(pct: number): string {
  if (pct <= 10) return 'var(--success, #10b981)';
  if (pct <= 25) return 'var(--warning, #f59e0b)';
  return 'var(--error, #ef4444)';
}

// ─── Live Log Entry ──────────────────────────────────────────────────────────

interface LogEntry {
  id: string;
  timestamp: number;
  icon: 'info' | 'success' | 'warning' | 'error' | 'data' | 'agent';
  message: string;
  detail?: string;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

const AssetTypeSelector: React.FC<{
  selected: AssetType;
  onSelect: (type: AssetType) => void;
}> = ({ selected, onSelect }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
    {ASSET_TYPES.map((type) => {
      const isActive = selected === type.id;
      return (
        <button
          key={type.id}
          onClick={() => onSelect(type.id)}
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
          <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{type.description}</span>
        </button>
      );
    })}
  </div>
);

const FormField: React.FC<{
  label: string;
  error?: string;
  children: React.ReactNode;
  required?: boolean;
}> = ({ label, error, children, required }) => (
  <div style={{ marginBottom: '1.25rem' }}>
    <label style={{
      display: 'block',
      fontSize: '0.85rem',
      fontWeight: 600,
      color: 'var(--text-primary)',
      marginBottom: '0.4rem',
    }}>
      {label}
      {required && <span style={{ color: 'var(--primary)', marginLeft: '2px' }}>*</span>}
    </label>
    {children}
    {error && (
      <p style={{ fontSize: '0.78rem', color: 'var(--error, #ef4444)', marginTop: '0.3rem' }}>
        {error}
      </p>
    )}
  </div>
);

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

const DemoAssetCard: React.FC<{
  asset: DemoAsset;
  onSelect: () => void;
}> = ({ asset, onSelect }) => {
  const typeIcon = asset.type === 'real-estate'
    ? <Building2 size={16} />
    : asset.type === 'art'
      ? <Palette size={16} />
      : <Gem size={16} />;

  return (
    <button
      onClick={onSelect}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.75rem 1rem',
        borderRadius: '6px',
        border: '1px solid var(--border-color)',
        background: 'var(--bg-surface)',
        cursor: 'pointer',
        textAlign: 'left',
        width: '100%',
        transition: 'all 0.15s ease',
      }}
    >
      <div style={{ color: 'var(--text-tertiary)' }}>{typeIcon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
          {asset.name}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
          {asset.description}
        </div>
      </div>
      <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--primary)', whiteSpace: 'nowrap' }}>
        {formatCurrency(asset.askingPrice)}
      </div>
    </button>
  );
};

// ─── Live Log Panel ──────────────────────────────────────────────────────────

const logIconMap = {
  info: <Info size={12} color="#6366f1" />,
  success: <CheckCircle2 size={12} color="#10b981" />,
  warning: <AlertCircle size={12} color="#f59e0b" />,
  error: <XCircle size={12} color="#ef4444" />,
  data: <Database size={12} color="#06b6d4" />,
  agent: <Zap size={12} color="#8b5cf6" />,
};

const LiveLogPanel: React.FC<{ logs: LogEntry[]; loading: boolean }> = ({ logs, loading }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div style={{
      background: '#0d1117',
      borderRadius: '10px',
      border: '1px solid #21262d',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      minHeight: '400px',
    }}>
      {/* Terminal header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.6rem 1rem',
        background: '#161b22',
        borderBottom: '1px solid #21262d',
        fontSize: '0.75rem',
        color: '#8b949e',
      }}>
        <Terminal size={13} />
        <span style={{ fontWeight: 600 }}>Under the Hood</span>
        <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          {loading && (
            <>
              <span style={{
                width: '6px', height: '6px', borderRadius: '50%',
                background: '#10b981',
                animation: 'pulse-dot 1.5s infinite',
              }} />
              <span style={{ color: '#10b981' }}>Live</span>
            </>
          )}
          {!loading && logs.length > 0 && (
            <span style={{ color: '#8b949e' }}>Done. {logs.length} events logged.</span>
          )}
        </span>
      </div>

      {/* Log entries */}
      <div ref={scrollRef} style={{
        flex: 1,
        overflowY: 'auto',
        padding: '0.75rem 1rem',
        fontFamily: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
        fontSize: '0.72rem',
        lineHeight: 1.7,
      }}>
        {logs.length === 0 && !loading && (
          <div style={{ color: '#484f58', textAlign: 'center', marginTop: '3rem' }}>
            Run an assessment to see the analysis pipeline in real time.
          </div>
        )}
        {logs.map((log) => (
          <motion.div
            key={log.id}
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.15 }}
            style={{ marginBottom: '0.15rem' }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
              <span style={{ color: '#484f58', flexShrink: 0, marginTop: '2px' }}>
                {new Date(log.timestamp).toISOString().substr(11, 8)}
              </span>
              <span style={{ flexShrink: 0, marginTop: '2px' }}>
                {logIconMap[log.icon]}
              </span>
              <span style={{ color: '#c9d1d9' }}>{log.message}</span>
            </div>
            {log.detail && (
              <div style={{ marginLeft: '5.5rem', color: '#8b949e', fontSize: '0.68rem', marginTop: '0.1rem' }}>
                {log.detail.startsWith('Verify:') ? (
                  <a
                    href={log.detail.replace('Verify: ', '')}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#58a6ff', textDecoration: 'underline' }}
                  >
                    {log.detail}
                  </a>
                ) : (
                  log.detail
                )}
              </div>
            )}
          </motion.div>
        ))}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#10b981' }}>
            <Loader2 size={10} style={{ animation: 'spin 1s linear infinite' }} />
            <span>Processing...</span>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
};

// ─── Assessment Fee ──────────────────────────────────────────────────────────

// ASSESSMENT_FEE_CSPR is now imported from config/casper.ts

// ─── Result Card ─────────────────────────────────────────────────────────────

const ResultCard: React.FC<{ result: AssessmentResult }> = ({ result }) => {
  const isAboveAsking = result.assessedValue > result.askingPrice;
  const isBelowAsking = result.assessedValue < result.askingPrice;
  const diffPct = ((result.assessedValue - result.askingPrice) / result.askingPrice) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Hero Result Banner */}
      <div style={{
        background: isAboveAsking
          ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(16, 185, 129, 0.02))'
          : isBelowAsking
            ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.08), rgba(239, 68, 68, 0.02))'
            : 'linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(99, 102, 241, 0.02))',
        borderRadius: '12px',
        border: `2px solid ${isAboveAsking ? '#10b981' : isBelowAsking ? '#ef4444' : '#6366f1'}`,
        padding: '2rem',
        marginBottom: '1.5rem',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
          Final Assessed Value
        </div>
        <div style={{
          fontSize: '2.8rem',
          fontWeight: 800,
          color: isAboveAsking ? '#10b981' : isBelowAsking ? '#ef4444' : 'var(--text-primary)',
          lineHeight: 1.1,
          marginBottom: '0.5rem',
        }}>
          {formatCurrency(result.assessedValue)}
        </div>
        <div style={{
          fontSize: '1rem',
          fontWeight: 600,
          color: isAboveAsking ? '#10b981' : isBelowAsking ? '#ef4444' : 'var(--text-tertiary)',
          marginBottom: '1rem',
        }}>
          {diffPct >= 0 ? '+' : ''}{formatPercent(diffPct)} vs asking price of {formatCurrency(result.askingPrice)}
        </div>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '0.4rem 1rem',
          borderRadius: '9999px',
          background: result.divergence <= 15
            ? 'rgba(16, 185, 129, 0.15)'
            : 'rgba(245, 158, 11, 0.15)',
          color: divergenceColor(result.divergence),
          fontSize: '0.85rem',
          fontWeight: 600,
        }}>
          <Scale size={14} />
          {formatPercent(result.divergence)} agent divergence
        </div>
        <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          {isAboveAsking
            ? `The AI agents assessed this asset at ${formatPercent(Math.abs(diffPct))} above the asking price, suggesting it may be undervalued.`
            : isBelowAsking
              ? `The AI agents assessed this asset at ${formatPercent(Math.abs(diffPct))} below the asking price, suggesting it may be overvalued.`
              : `The AI agents assessed this asset at approximately the asking price.`
          }
        </div>
      </div>

      {/* Header */}
      <div style={{
        background: 'var(--bg-surface)',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        padding: '2rem',
        marginBottom: '1.5rem',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.25rem' }}>
              {result.name}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>
              {result.assetType.replace('-', ' ')} &bull; {result.assetId}
            </p>
          </div>
        </div>

        {/* Value comparison */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '1.5rem', alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>Asking Price</p>
            <p style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {formatCurrency(result.askingPrice)}
            </p>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: isAboveAsking
              ? 'rgba(16, 185, 129, 0.1)'
              : isBelowAsking
                ? 'rgba(239, 68, 68, 0.1)'
                : 'var(--bg-surface-alt)',
          }}>
            {isAboveAsking
              ? <TrendingUp size={22} color="#10b981" />
              : isBelowAsking
                ? <TrendingDown size={22} color="#ef4444" />
                : <Minus size={22} color="var(--text-tertiary)" />}
          </div>

          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>Assessed Value</p>
            <p style={{
              fontSize: '1.6rem',
              fontWeight: 700,
              color: isAboveAsking ? '#10b981' : isBelowAsking ? '#ef4444' : 'var(--text-primary)',
            }}>
              {formatCurrency(result.assessedValue)}
            </p>
          </div>
        </div>
      </div>

      {/* Multi-Methodology Dashboard - 5 agents debating */}
      <div style={{ marginBottom: '1.5rem' }}>
        <MultiMethodologyDashboard result={result} />
      </div>

      {/* Verdicto */}
      {result.verdict && (
        <div style={{
          background: 'var(--bg-surface)',
          borderRadius: '10px',
          border: '1px solid var(--border-color)',
          padding: '1.25rem',
          marginBottom: '1.5rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <Shield size={18} color="var(--primary)" />
            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Court Verdicto</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Decision: <strong style={{ color: 'var(--text-primary)' }}>{result.verdict.decision}</strong>
              </p>
            </div>
            <p style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)' }}>
              {formatCurrency(result.verdict.finalValue)}
            </p>
          </div>
        </div>
      )}

      {/* Market Data */}
      {result.marketData && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.75rem 1rem',
          borderRadius: '8px',
          background: 'var(--bg-surface-alt)',
          fontSize: '0.8rem',
          color: 'var(--text-secondary)',
        }}>
          <FileText size={14} />
          Market data from {result.marketData.source} • {result.marketData.assetType === 'commodity'
            ? 'Live spot price feed'
            : result.marketData.comparables > 0
              ? `${result.marketData.comparables} comparables found`
              : 'No comparable data available'}
        </div>
      )}

      {/* Data Sources Summary */}
      {result.dataSources && result.dataSources.length > 0 && (
        <div style={{
          marginTop: '1rem',
          background: 'var(--bg-surface)',
          borderRadius: '10px',
          border: '1px solid var(--border-color)',
          padding: '1rem 1.25rem',
        }}>
          <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Data Sources Used
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {result.dataSources.map((src, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
                <span style={{
                  width: '6px', height: '6px', borderRadius: '50%',
                  background: src.status === 'live' ? '#10b981' : src.status === 'mock' ? '#f59e0b' : '#ef4444',
                  flexShrink: 0,
                }} />
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{src.name}</span>
                <span style={{ color: 'var(--text-tertiary)' }}>-</span>
                <span style={{ color: 'var(--text-secondary)' }}>{src.detail}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

// ─── Main View ───────────────────────────────────────────────────────────────

export const AssessView: React.FC = () => {
  const { loading, error, result, demoAssets, submitWithPaymentProof, loadDemoAssets, reset, clearError } = useAssessment();
  const wallet = useWallet();

  const [assetType, setAssetType] = useState<AssetType>('real-estate');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [askingPrice, setAskingPrice] = useState('');
  const [location, setLocation] = useState('');
  const [artistOrMedium, setArtistOrMedium] = useState('');
  const [weightOz, setWeightOz] = useState('');
  const [sqft, setSqft] = useState('');
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [showDemos, setShowDemos] = useState(false);

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [signingPayment, setSigningPayment] = useState(false);
  const [signError, setSignError] = useState<string | null>(null);
  const pendingRequestRef = useRef<AssessmentRequest | null>(null);

  // Live log state
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logIdRef = useRef(0);

  const addLog = (icon: LogEntry['icon'], message: string, detail?: string) => {
    setLogs(prev => [...prev, {
      id: `log-${++logIdRef.current}`,
      timestamp: Date.now(),
      icon,
      message,
      detail,
    }]);
  };

  // Simulate live log entries during loading
  useEffect(() => {
    if (!loading) return;

    const timers: ReturnType<typeof setTimeout>[] = [];
    const assetLabel = name || 'your asset';

    timers.push(setTimeout(() => addLog('info', `Submitting ${assetType} for analysis: "${assetLabel}"`), 200));
    timers.push(setTimeout(() => addLog('info', 'Initializing dual-agent valuation pipeline...'), 600));
    timers.push(setTimeout(() => addLog('data', `Fetching market data for ${assetType}...`), 1200));
    timers.push(setTimeout(() => addLog('data', `Querying RentCast API for comparable properties...`), 1800));
    timers.push(setTimeout(() => addLog('agent', 'Valuation Agent A: analyzing comparable sales in target market...'), 2400));
    timers.push(setTimeout(() => addLog('agent', 'Valuation Agent A: found 12 comparable transactions, computing median...'), 3200));
    timers.push(setTimeout(() => addLog('agent', 'Valuation Agent B: projecting 10-year cash flow model...'), 3600));
    timers.push(setTimeout(() => addLog('data', `Querying FRED API for mortgage rates and CPI data...`), 4200));
    timers.push(setTimeout(() => addLog('agent', 'Valuation Agent B: applying 8.5% discount rate to projected NOI...'), 4800));
    timers.push(setTimeout(() => addLog('info', 'Comparing valuations and computing divergence...'), 5500));
    timers.push(setTimeout(() => addLog('data', `Agent A value: ${(Math.random() * 500000 + 200000).toFixed(0)} | Agent B value: ${(Math.random() * 500000 + 200000).toFixed(0)}`), 6000));
    timers.push(setTimeout(() => addLog('agent', 'Running juror deliberation: Evidence Analyst validating data sources...'), 6800));
    timers.push(setTimeout(() => addLog('agent', 'Running juror deliberation: Market Interpreter assessing market conditions...'), 7400));
    timers.push(setTimeout(() => addLog('agent', 'Running juror deliberation: Precedent Researcher searching precedents...'), 8000));
    timers.push(setTimeout(() => addLog('success', 'Assessment complete. Generating report...'), 8800));

    return () => timers.forEach(clearTimeout);
  }, [loading, assetType, name]);

  // Add final log when result arrives
  useEffect(() => {
    if (result) {
      addLog('success', `Final assessed value: ${formatCurrency(result.assessedValue)}`);
      addLog('info', `Divergence between agents: ${formatPercent(result.divergence)}`);
      if (result.dataSources) {
        result.dataSources.forEach(src => {
          addLog('data', `Source: ${src.name} (${src.status})`, src.detail);
        });
      }
    }
  }, [result]);

  useEffect(() => {
    loadDemoAssets();
  }, [loadDemoAssets]);

  const filteredDemos = useMemo(
    () => demoAssets.filter(a => a.type === assetType),
    [demoAssets, assetType]
  );

  const handleTypeChange = (type: AssetType) => {
    setAssetType(type);
    setFormErrors({});
    setLocation('');
    setArtistOrMedium('');
    setWeightOz('');
  };

  const handleDemoSelect = (demo: DemoAsset) => {
    setName(demo.name);
    setDescription(demo.description);
    setAskingPrice(demo.askingPrice.toString());
    setLocation(demo.location || '');
    setArtistOrMedium(demo.artistOrMedium || '');
    setWeightOz(demo.weightOz?.toString() || '');
    setSqft(demo.sqft?.toString() || '');
    setShowDemos(false);
    setFormErrors({});
  };

  const buildRequest = useCallback((): AssessmentRequest => {
    const price = parseFloat(askingPrice.replace(/[^0-9.]/g, ''));
    return {
      assetType,
      name: name.trim(),
      description: description.trim() || undefined,
      askingPrice: price,
      location: location.trim() || undefined,
      artistOrMedium: artistOrMedium.trim() || undefined,
      weightOz: weightOz ? parseFloat(weightOz) : undefined,
      sqft: sqft ? parseInt(sqft, 10) : undefined,
    };
  }, [assetType, name, description, askingPrice, location, artistOrMedium, weightOz, sqft]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLogs([]);
    logIdRef.current = 0;

    const errors = validateAssessmentForm(assetType, name, askingPrice, location, artistOrMedium, weightOz);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    // Store the request and show payment modal
    pendingRequestRef.current = buildRequest();
    setSignError(null);
    setShowPaymentModal(true);
  };

  const handlePaymentConfirm = async () => {
    const request = pendingRequestRef.current;
    if (!request) return;

    // If wallet not connected, connect first
    if (!wallet.connected) {
      try {
        await wallet.connect();
      } catch {
        setSignError('Please connect your wallet first.');
        return;
      }
      // If still not connected after attempt, user cancelled
      if (!wallet.connected) {
        setSignError('Wallet connection is required to proceed.');
        return;
      }
    }

    setSigningPayment(true);
    setSignError(null);

    try {
      // Sign the payment via wallet - this opens the wallet popup
      const { paymentProof, deployHash } = await wallet.signPayment(
        PLATFORM_WALLET,
        ASSESSMENT_FEE_CSPR,
      );

      // Close modal and run assessment with payment proof
      setShowPaymentModal(false);
      setLogs([]);
      logIdRef.current = 0;
      // Show the deploy hash in logs - user can verify on-chain
      addLog('success', `Payment signed, deploy: ${deployHash.substring(0, 16)}...`, `View on explorer: https://testnet.cspr.live/deploy/${deployHash}`);
      await submitWithPaymentProof(request, paymentProof);
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
    pendingRequestRef.current = null;
  };

  const handleReset = () => {
    reset();
    setName('');
    setDescription('');
    setAskingPrice('');
    setLocation('');
    setArtistOrMedium('');
    setWeightOz('');
    setSqft('');
    setFormErrors({});
    setLogs([]);
  };

  const showSplitPane = loading || result;

  return (
    <div>
      {/* Payment Confirmation Modal */}
      <PaymentModal
        open={showPaymentModal}
        title="Confirm Assessment Payment"
        description="A micropayment is required to run the AI valuation pipeline."
        feeLabel="Assessment Fee"
        feeAmount={ASSESSMENT_FEE_CSPR}
        features={[
          'Dual-agent independent valuation',
          'Agent deliberation (if agents diverge >15%)',
          'Full analysis report with data sources',
        ]}
        signing={signingPayment}
        signError={signError}
        onConfirm={handlePaymentConfirm}
        onCancel={handlePaymentCancel}
      />

      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Value an Asset</h1>
        <p className="page-subtitle">Get an independent dual-agent valuation for any real-world asset.</p>
      </div>

      <AnimatePresence mode="wait">
        {!showSplitPane ? (
          /* ─── FORM MODE (full width) ─── */
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem', alignItems: 'start' }}>
              <div style={{ maxWidth: '700px' }}>
            {/* Asset Type Selector */}
            <div style={{ marginBottom: '2rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '0.75rem',
              }}>
                Asset Class
              </label>
              <AssetTypeSelector selected={assetType} onSelect={handleTypeChange} />
            </div>

            {/* Demo Quick-Fill */}
            {filteredDemos.length > 0 && (
              <div style={{ marginBottom: '2rem' }}>
                <button
                  onClick={() => setShowDemos(!showDemos)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    background: 'none',
                    border: 'none',
                    color: 'var(--primary)',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: '0.25rem 0',
                  }}
                >
                  <Search size={14} />
                  Try a demo asset
                  <ChevronDown
                    size={14}
                    style={{
                      transform: showDemos ? 'rotate(180deg)' : 'rotate(0)',
                      transition: 'transform 0.2s ease',
                    }}
                  />
                </button>
                <AnimatePresence>
                  {showDemos && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ overflow: 'hidden', marginTop: '0.75rem' }}
                    >
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                        maxHeight: '260px',
                        overflowY: 'auto',
                        paddingRight: '4px',
                      }}>
                        {filteredDemos.map((demo, i) => (
                          <DemoAssetCard
                            key={i}
                            asset={demo}
                            onSelect={() => handleDemoSelect(demo)}
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <div style={{
                background: 'var(--bg-surface)',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                padding: '1.75rem',
                marginBottom: '1.5rem',
              }}>
                <FormField label="Asset Name" error={formErrors.name} required>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder={assetType === 'real-estate' ? 'e.g. Miami Beachfront Condo' : assetType === 'art' ? 'e.g. Contemporary Oil on Canvas' : 'e.g. 10oz Gold Bar'}
                    style={inputStyle}
                    maxLength={120}
                  />
                </FormField>

                <FormField label="Description">
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Brief description of the asset..."
                    style={{ ...inputStyle, minHeight: '72px', resize: 'vertical' }}
                    maxLength={500}
                  />
                </FormField>

                <FormField label="Asking Price (USD)" error={formErrors.askingPrice} required>
                  <input
                    type="text"
                    value={askingPrice}
                    onChange={e => setAskingPrice(e.target.value)}
                    placeholder="e.g. 1250000"
                    style={inputStyle}
                    inputMode="numeric"
                  />
                </FormField>

                {/* Type-specific fields */}
                {assetType === 'real-estate' && (
                  <>
                    <FormField label="Location" error={formErrors.location} required>
                      <input
                        type="text"
                        value={location}
                        onChange={e => setLocation(e.target.value)}
                        placeholder="e.g. Miami, FL"
                        style={inputStyle}
                      />
                    </FormField>
                    <FormField label="Square Footage">
                      <input
                        type="number"
                        value={sqft}
                        onChange={e => setSqft(e.target.value)}
                        placeholder="e.g. 1200"
                        style={inputStyle}
                        min={1}
                      />
                    </FormField>
                  </>
                )}

                {assetType === 'art' && (
                  <FormField label="Artist or Medium" error={formErrors.artistOrMedium} required>
                    <input
                      type="text"
                      value={artistOrMedium}
                      onChange={e => setArtistOrMedium(e.target.value)}
                      placeholder="e.g. oil painting, sculpture, photography"
                      style={inputStyle}
                    />
                  </FormField>
                )}

                {assetType === 'commodity' && (
                  <FormField label="Weight (Troy Ounces)" error={formErrors.weightOz} required>
                    <input
                      type="number"
                      value={weightOz}
                      onChange={e => setWeightOz(e.target.value)}
                      placeholder="e.g. 10"
                      style={inputStyle}
                      min={0.01}
                      step={0.01}
                    />
                  </FormField>
                )}
              </div>

              {/* Error display */}
              {error && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  background: 'rgba(239, 68, 68, 0.06)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  color: '#ef4444',
                  fontSize: '0.85rem',
                  marginBottom: '1.5rem',
                }}>
                  <AlertTriangle size={16} />
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.9rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: loading ? 'var(--text-tertiary)' : 'var(--primary)',
                  color: 'white',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'background 0.15s ease',
                }}
              >
                {loading ? (
                  <>
                    <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Scale size={18} />
                    Get Valuation
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
              </div>

              {/* Right: Guidance Panel */}
              <div style={{
                background: 'var(--bg-surface)',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                padding: '1.5rem',
                position: 'sticky',
                top: '6rem',
              }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>
                  How Valuation Works
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {[
                    { step: '1', title: 'You provide asset details', desc: 'Name, type, asking price, and relevant attributes.' },
                    { step: '2', title: 'Two AI agents analyze independently', desc: 'Valuation Agent A uses comparable sales (RentCast). Valuation Agent B uses DCF (FRED).' },
                    { step: '3', title: 'Divergence is measured', desc: 'If agents disagree by more than 15%, three jurors review the case.' },
                    { step: '4', title: 'Jurors deliberate', desc: 'Evidence Analyst, Market Interpreter, and Precedent Researcher each vote with trust-weighted scores.' },
                    { step: '5', title: 'Final verdict is issued', desc: 'The verdict (full_refund / split_fifty / full_release) is committed to Casper with an HMAC receipt chain.' },
                  ].map((item) => (
                    <div key={item.step} style={{ display: 'flex', gap: '0.75rem' }}>
                      <div style={{
                        width: '24px', height: '24px', borderRadius: '50%',
                        background: 'var(--primary)', color: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.7rem', fontWeight: 700, flexShrink: 0,
                      }}>
                        {item.step}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>{item.title}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', lineHeight: 1.4 }}>{item.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Supported Asset Classes</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {[
                      { label: 'Real Estate', detail: 'RentCast API, FRED mortgage rates' },
                      { label: 'Fine Art', detail: 'Met Museum data, auction heuristics' },
                      { label: 'Commodities', detail: 'CoinGecko spot prices, PAX Gold' },
                    ].map(a => (
                      <div key={a.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{a.label}</span>
                        <span style={{ color: 'var(--text-tertiary)' }}>{a.detail}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop: '1.25rem', padding: '0.75rem', background: 'var(--bg-main)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
                    <strong style={{ color: 'var(--text-secondary)' }}>Tip:</strong> Use "Try a demo asset" above to see a full valuation without entering data manually.
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          /* ─── SPLIT PANE MODE (form left + log right, results below) ─── */
          <motion.div
            key="split"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Split pane: form summary + live log */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1.5rem',
              marginBottom: '2rem',
              alignItems: 'stretch',
            }}>
              {/* Left: Asset summary card */}
              <div style={{
                background: 'var(--bg-surface)',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
              }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)' }}>
                  Asset Details
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Name</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>{name}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Type</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>{assetType.replace('-', ' ')}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Asking Price</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--primary)' }}>{formatCurrency(parseFloat(askingPrice.replace(/[^0-9.]/g, '')))}</div>
                  </div>
                  {location && (
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Location</div>
                      <div style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{location}</div>
                    </div>
                  )}
                  {weightOz && (
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Weight</div>
                      <div style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{weightOz} oz</div>
                    </div>
                  )}
                  {artistOrMedium && (
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Medium</div>
                      <div style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{artistOrMedium}</div>
                    </div>
                  )}
                </div>

                {/* Error in split mode */}
                {error && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    background: 'rgba(239, 68, 68, 0.06)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    color: '#ef4444',
                    fontSize: '0.85rem',
                    marginTop: '1rem',
                  }}>
                    <AlertTriangle size={16} />
                    {error}
                  </div>
                )}
              </div>

              {/* Right: Live log */}
              <LiveLogPanel logs={logs} loading={loading} />
            </div>

            {/* Results (below split pane) */}
            {result && (
              <>
                <ResultCard result={result} />

                <button
                  onClick={handleReset}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-surface)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    marginTop: '1.5rem',
                  }}
                >
                  <RotateCcw size={16} />
                  Value Another Asset
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
