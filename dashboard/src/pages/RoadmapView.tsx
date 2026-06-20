import React from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  CheckCircle2,
  ArrowRight,
  Zap,
  Shield,
  Globe,
  TrendingUp,
  Users,
  BarChart3,
  Lock,
  Layers,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  category: 'verifiable' | 'economic' | 'network' | 'enhancement';
  status: 'live' | 'building' | 'planned' | 'future';
  effort: string;
  icon: React.ReactNode;
}

// ─── Data ────────────────────────────────────────────────────────────────────

const ROADMAP_ITEMS: RoadmapItem[] = [
  // LIVE
  {
    id: 'a2',
    title: 'Multi-Methodology Dashboard',
    description: 'Side-by-side view of all 5 AI agents\' reasoning with divergence visualization, risk flags, and consensus analysis.',
    category: 'verifiable',
    status: 'live',
    effort: '5 hours',
    icon: <BarChart3 size={18} />,
  },
  {
    id: 'd4',
    title: 'Multi-Asset Selector',
    description: 'Dropdown to choose asset type: Real Estate, Fine Art, Commodities. Each triggers asset-specific valuation logic.',
    category: 'enhancement',
    status: 'live',
    effort: '4 hours',
    icon: <Layers size={18} />,
  },
  {
    id: 'd7',
    title: 'Async CSPR Transfer',
    description: 'Replaced synchronous execFileSync with async execFile to prevent event loop blocking during blockchain operations.',
    category: 'enhancement',
    status: 'live',
    effort: '1 hour',
    icon: <Zap size={18} />,
  },
  {
    id: 'd8',
    title: 'Environment Variable Validation',
    description: 'Startup validation of all required env vars using Zod-style checks. Fails fast with clear error messages.',
    category: 'enhancement',
    status: 'live',
    effort: '1 hour',
    icon: <Shield size={18} />,
  },
  {
    id: 'd1',
    title: 'Live Contract State Panel',
    description: 'Real-time dashboard showing deployed contract data: dispute count, agent reputation scores, recent votes, escrow balances.',
    category: 'enhancement',
    status: 'live',
    effort: '3 hours',
    icon: <Globe size={18} />,
  },
  {
    id: 'd2',
    title: 'x402 Payment Stream',
    description: 'Live visualization of CSPR flowing between agents via x402: payment requests, settlements, and confirmations with tx hashes.',
    category: 'enhancement',
    status: 'live',
    effort: '4 hours',
    icon: <Zap size={18} />,
  },

  // PLANNED
  {
    id: 'b2',
    title: 'Prediction Market Resolution',
    description: 'Ask real-world outcome questions. 5 AI agents analyze market data and give probability estimates with full reasoning.',
    category: 'economic',
    status: 'planned',
    effort: '5 hours',
    icon: <TrendingUp size={18} />,
  },
  {
    id: 'a1',
    title: 'On-Chain Verdict Certificate (NFT)',
    description: 'Mint a non-transferable NFT on Casper Testnet containing the verdict hash, agent signatures, and HMAC receipt root.',
    category: 'verifiable',
    status: 'planned',
    effort: '4 hours',
    icon: <Shield size={18} />,
  },
  {
    id: 'a3',
    title: 'Regulatory Compliance Export (PDF)',
    description: 'One-click generation of SEC, EU MiCA, and UAE VARA formatted compliance documents with cryptographic signatures.',
    category: 'verifiable',
    status: 'planned',
    effort: '4 hours',
    icon: <Lock size={18} />,
  },
  {
    id: 'b1',
    title: 'DeFi Collateral Oracle Feed',
    description: 'Standardized API endpoint that outputs Verdict valuations in a format consumable by DeFi lending protocols (Aave, Compound, Morpho).',
    category: 'economic',
    status: 'planned',
    effort: '4 hours',
    icon: <Globe size={18} />,
  },
  {
    id: 'b3',
    title: 'Agent Staking Marketplace',
    description: 'Open platform where third-party AI analysts register as Verdict agents, stake CSPR as collateral, and earn fees for accurate valuations.',
    category: 'economic',
    status: 'planned',
    effort: '6 hours',
    icon: <Users size={18} />,
  },
  {
    id: 'b4',
    title: 'Insurance Claim Verification',
    description: 'Insurance companies submit property damage claims; Verdict agents verify the claimed value against market data and flag fraud.',
    category: 'economic',
    status: 'planned',
    effort: '5 hours',
    icon: <Shield size={18} />,
  },

  // FUTURE
  {
    id: 'c1',
    title: 'Historical Accuracy Leaderboard',
    description: 'Public leaderboard showing each agent\'s historical accuracy: how close their valuations were to actual market outcomes.',
    category: 'network',
    status: 'future',
    effort: '3 hours',
    icon: <TrendingUp size={18} />,
  },
  {
    id: 'c2',
    title: 'Cross-Asset Correlation Analysis',
    description: 'Portfolio risk reports across multiple asset types: concentration risk, macro sensitivity, and diversification recommendations.',
    category: 'network',
    status: 'future',
    effort: '6 hours',
    icon: <BarChart3 size={18} />,
  },
  {
    id: 'c3',
    title: 'Retroactive Accuracy Betting',
    description: 'Users bet CSPR on whether an agent\'s valuation will prove accurate when the asset eventually sells. A prediction market on prediction accuracy.',
    category: 'network',
    status: 'future',
    effort: '8 hours',
    icon: <TrendingUp size={18} />,
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  live: { label: 'Live', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
  building: { label: 'Building', color: '#6366f1', bg: 'rgba(99, 102, 241, 0.1)' },
  planned: { label: 'Planned', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
  future: { label: 'Future', color: 'var(--text-tertiary)', bg: 'var(--bg-surface-alt)' },
};

const CATEGORY_CONFIG = {
  verifiable: { label: 'Verifiable Value', color: '#6366f1', description: 'Outputs traditional AI cannot produce' },
  economic: { label: 'Economic Value', color: '#10b981', description: 'Direct revenue or cost savings' },
  network: { label: 'Network Effects', color: '#f59e0b', description: 'More users = more value' },
  enhancement: { label: 'Enhancement', color: '#8b5cf6', description: 'Improvements to existing system' },
};

// ─── Sub-components ──────────────────────────────────────────────────────────

const RoadmapCard: React.FC<{ item: RoadmapItem; index: number }> = ({ item, index }) => {
  const status = STATUS_CONFIG[item.status];
  const category = CATEGORY_CONFIG[item.category];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      style={{
        background: 'var(--bg-surface)',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        padding: '1.25rem',
        opacity: item.status === 'future' ? 0.7 : 1,
        transition: 'all 0.2s ease',
      }}
    >
      {/* Top row: icon + badges */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <div style={{
          width: 36,
          height: 36,
          borderRadius: '8px',
          background: `${category.color}15`,
          border: `1px solid ${category.color}30`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: category.color,
        }}>
          {item.icon}
        </div>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <span style={{
            padding: '0.15rem 0.5rem',
            borderRadius: '4px',
            background: status.bg,
            color: status.color,
            fontSize: '0.7rem',
            fontWeight: 600,
          }}>
            {status.label}
          </span>
        </div>
      </div>

      {/* Title */}
      <h3 style={{
        fontSize: '1rem',
        fontWeight: 700,
        color: 'var(--text-primary)',
        marginBottom: '0.4rem',
      }}>
        {item.title}
      </h3>

      {/* Description */}
      <p style={{
        fontSize: '0.8rem',
        color: 'var(--text-secondary)',
        lineHeight: 1.5,
        marginBottom: '0.75rem',
      }}>
        {item.description}
      </p>

      {/* Bottom row: category + effort */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{
          fontSize: '0.7rem',
          color: category.color,
          fontWeight: 600,
        }}>
          {category.label}
        </span>
        <span style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.3rem',
          fontSize: '0.7rem',
          color: 'var(--text-tertiary)',
        }}>
          <Clock size={12} />
          {item.effort}
        </span>
      </div>
    </motion.div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────

export const RoadmapView: React.FC = () => {
  const live = ROADMAP_ITEMS.filter(i => i.status === 'live');
  const planned = ROADMAP_ITEMS.filter(i => i.status === 'planned');
  const future = ROADMAP_ITEMS.filter(i => i.status === 'future');

  const sections = [
    { title: 'Live Now', items: live, icon: <CheckCircle2 size={18} color="#10b981" />, color: '#10b981' },
    { title: 'Planned', items: planned, icon: <Clock size={18} color="#f59e0b" />, color: '#f59e0b' },
    { title: 'Future Vision', items: future, icon: <ArrowRight size={18} color="var(--text-tertiary)" />, color: 'var(--text-tertiary)' },
  ];

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Roadmap</h1>
        <p className="page-subtitle">
          What Verdict is building, from live features to future vision. Every feature creates verifiable value that traditional AI cannot produce.
        </p>
      </div>

      {/* Stats bar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '1rem',
        marginBottom: '2rem',
      }}>
        {sections.map((section) => (
          <div key={section.title} style={{
            background: 'var(--bg-surface)',
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
            padding: '1rem',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: section.color }}>
              {section.items.length}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>
              {section.title}
            </div>
          </div>
        ))}
      </div>

      {/* Sections */}
      {sections.map((section) => (
        <div key={section.title} style={{ marginBottom: '2.5rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1rem',
          }}>
            {section.icon}
            <h2 style={{
              fontSize: '1.2rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
            }}>
              {section.title}
            </h2>
            <span style={{
              padding: '0.15rem 0.5rem',
              borderRadius: '4px',
              background: `${section.color}15`,
              color: section.color,
              fontSize: '0.7rem',
              fontWeight: 600,
            }}>
              {section.items.length} features
            </span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1rem',
          }}>
            {section.items.map((item, i) => (
              <RoadmapCard key={item.id} item={item} index={i} />
            ))}
          </div>
        </div>
      ))}

      {/* Bottom narrative */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        style={{
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05), rgba(139, 92, 246, 0.05))',
          borderRadius: '12px',
          border: '1px solid rgba(99, 102, 241, 0.2)',
          padding: '2rem',
          textAlign: 'center',
          marginTop: '1rem',
        }}
      >
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          The Verdict Vision
        </h3>
        <p style={{
          fontSize: '0.9rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
          maxWidth: '600px',
          margin: '0 auto',
        }}>
          Traditional AI gives you an <strong>opinion</strong>. Verdict gives you a <strong>verifiable, actionable, on-chain asset</strong>,
          cryptographically signed, permanently recorded, legally defensible, and economically valuable.
          Built on the Verdict Manifest with real x402 payments, deployed Odra contracts, and a $27.5B RWA market
          that desperately needs trustworthy price discovery.
        </p>
      </motion.div>
    </div>
  );
};

export default RoadmapView;
