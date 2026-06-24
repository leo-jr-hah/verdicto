import React from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  ArrowRight,
  Shield,
  Globe,
  TrendingUp,
  Users,
  BarChart3,
  Lock,
  Layers,
  Wallet,
  Scale,
  Landmark,
  Activity,
  Cpu,
  FileCheck,
  Link2,
  Timer,
  GitBranch,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  category: 'verifiable' | 'economic' | 'network' | 'enhancement';
  status: 'live' | 'building' | 'planned' | 'future';
  icon: React.ReactNode;
}

// ─── Data ────────────────────────────────────────────────────────────────────

const ROADMAP_ITEMS: RoadmapItem[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // LIVE: Products and core features
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'p1',
    title: 'Assess: AI Asset Valuation',
    description: 'Dual-agent valuation with 3 AI jurors, autonomous methodology selection, and HMAC receipt chains. Results in under 60 seconds.',
    category: 'economic',
    status: 'live',
    icon: <Scale size={18} />,
  },
  {
    id: 'p2',
    title: 'Borrow: Lend Against Assessed Assets',
    description: 'AI-calculated LTV ratios with real CSPR disbursement to your wallet. Autonomous collateral monitoring with margin call alerts.',
    category: 'economic',
    status: 'live',
    icon: <Landmark size={18} />,
  },
  {
    id: 'p3',
    title: 'Insure: AI-Powered Asset Insurance',
    description: 'Risk scoring across market volatility, liquidity, and confidence. File claims with live AI revaluation and automated payouts.',
    category: 'economic',
    status: 'live',
    icon: <Shield size={18} />,
  },
  {
    id: 'p4',
    title: 'Predict: Prediction Market Resolution',
    description: 'Ask real-world outcome questions. 5 AI agents analyze data and produce probability estimates with full reasoning.',
    category: 'economic',
    status: 'live',
    icon: <TrendingUp size={18} />,
  },
  {
    id: 'v1',
    title: 'Multi-Agent Deliberation',
    description: '5 independent AI agents with autonomous methodology selection. Each queries real market data, selects its approach at runtime, and documents reasoning.',
    category: 'verifiable',
    status: 'live',
    icon: <Cpu size={18} />,
  },
  {
    id: 'v2',
    title: 'Juror Peer Review Protocol',
    description: 'When valuations diverge, 3 jurors deliberate across 2 rounds. In Round 2, each juror reviews peer reasoning and may revise their vote.',
    category: 'verifiable',
    status: 'live',
    icon: <Users size={18} />,
  },
  {
    id: 'v3',
    title: 'HMAC Receipt Chain',
    description: 'Every execution step produces a cryptographic receipt. Receipts chain together so no step can be altered without breaking the chain.',
    category: 'verifiable',
    status: 'live',
    icon: <Link2 size={18} />,
  },
  {
    id: 'v4',
    title: 'Retroactive Trust Scoring',
    description: 'Agent reputation is not consensus-based. Predictions are recorded, then compared to actual market outcomes. Accurate agents gain trust; inaccurate ones lose it.',
    category: 'verifiable',
    status: 'live',
    icon: <BarChart3 size={18} />,
  },
  {
    id: 'v5',
    title: 'Verifiable Execution Commitments',
    description: 'Pre-execution commitment hashes stored on-chain. Post-execution receipts prove the committed computation was executed faithfully.',
    category: 'verifiable',
    status: 'live',
    icon: <FileCheck size={18} />,
  },
  {
    id: 'e1',
    title: 'x402 Micropayments',
    description: 'Real CSPR transfers signed by your Casper Wallet. Not simulated. Every payment is verifiable on the Casper testnet explorer.',
    category: 'economic',
    status: 'live',
    icon: <Wallet size={18} />,
  },
  {
    id: 'e2',
    title: 'Casper Wallet Connection',
    description: 'One-click wallet integration via CasperWalletProvider. Connect, sign transactions, and manage your account from the dashboard.',
    category: 'enhancement',
    status: 'live',
    icon: <Wallet size={18} />,
  },
  {
    id: 'e3',
    title: 'Multi-Asset Support',
    description: 'Real Estate, Fine Art, and Commodities. Each asset type triggers specialized valuation logic with different data sources and methodologies.',
    category: 'enhancement',
    status: 'live',
    icon: <Layers size={18} />,
  },
  {
    id: 'e4',
    title: 'Real-Time Progress Updates',
    description: 'WebSocket-powered live updates during assessments. See each agent start, complete, and deliberate as it happens.',
    category: 'enhancement',
    status: 'live',
    icon: <Activity size={18} />,
  },
  {
    id: 'e5',
    title: 'Autonomous Keepers',
    description: 'Background services monitor collateral health and insurance policies continuously. Margin calls and liquidation triggers fire without human intervention.',
    category: 'enhancement',
    status: 'live',
    icon: <Timer size={18} />,
  },
  {
    id: 'e6',
    title: 'Agent Reputation Dashboard',
    description: 'Trust scores with historical accuracy charts, tier badges, and methodology details for every agent in the system.',
    category: 'enhancement',
    status: 'live',
    icon: <Globe size={18} />,
  },
  {
    id: 'e7',
    title: 'LLM Fallback Transparency',
    description: 'When the primary LLM is unavailable, agents fall back to deterministic estimates. The UI flags exactly which agents fell back and at what quality level.',
    category: 'enhancement',
    status: 'live',
    icon: <Shield size={18} />,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PLANNED: Next phase
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'a1',
    title: 'On-Chain Verdicto Certificate',
    description: 'Mint a non-transferable NFT on Casper containing the verdict hash, agent signatures, and receipt root. Permanent, verifiable proof of assessment.',
    category: 'verifiable',
    status: 'planned',
    icon: <Shield size={18} />,
  },
  {
    id: 'a2',
    title: 'Compliance Export',
    description: 'One-click generation of regulatory compliance documents (SEC, EU MiCA, UAE VARA) with cryptographic signatures and methodology documentation.',
    category: 'verifiable',
    status: 'planned',
    icon: <Lock size={18} />,
  },
  {
    id: 'b1',
    title: 'DeFi Collateral Oracle',
    description: 'Standardized API that outputs Verdicto valuations in a format consumable by DeFi lending protocols.',
    category: 'economic',
    status: 'planned',
    icon: <Globe size={18} />,
  },
  {
    id: 'b2',
    title: 'Agent Staking Marketplace',
    description: 'Open platform where third-party AI analysts register as Verdicto agents, stake CSPR as collateral, and earn fees for accurate valuations.',
    category: 'economic',
    status: 'planned',
    icon: <Users size={18} />,
  },
  {
    id: 'c1',
    title: 'Cross-Asset Portfolio Analysis',
    description: 'Portfolio risk reports across multiple asset types: concentration risk, macro sensitivity, and diversification recommendations.',
    category: 'network',
    status: 'planned',
    icon: <BarChart3 size={18} />,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // FUTURE: Long-term vision
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'f1',
    title: 'Accuracy Prediction Market',
    description: 'Users bet on whether an agent\'s valuation will prove accurate when the asset eventually sells. A market on prediction quality itself.',
    category: 'network',
    status: 'future',
    icon: <TrendingUp size={18} />,
  },
  {
    id: 'f2',
    title: 'Multi-Tenant Agent Deployment',
    description: 'Isolated agent clusters per client with dedicated AI agents, separate reputation namespaces, and isolated payment flows.',
    category: 'network',
    status: 'future',
    icon: <GitBranch size={18} />,
  },
  {
    id: 'f3',
    title: 'Mainnet Deployment',
    description: 'Migration from Casper Testnet to Mainnet with security audit, gas optimization, and production-grade infrastructure.',
    category: 'network',
    status: 'future',
    icon: <Globe size={18} />,
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

      {/* Bottom row: category */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{
          fontSize: '0.7rem',
          color: category.color,
          fontWeight: 600,
        }}>
          {category.label}
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
    { title: 'Live & Deployed', items: live, icon: <CheckCircle2 size={18} color="#10b981" />, color: '#10b981' },
    { title: 'Planned', items: planned, icon: <ArrowRight size={18} color="#f59e0b" />, color: '#f59e0b' },
    { title: 'Future Vision', items: future, icon: <ArrowRight size={18} color="var(--text-tertiary)" />, color: 'var(--text-tertiary)' },
  ];

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Roadmap</h1>
        <p className="page-subtitle">
          What Verdicto has built and what's next. Every feature creates verifiable value that traditional AI cannot produce.
        </p>
      </div>

      {/* Summary stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
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
          The Verdicto Vision
        </h3>
        <p style={{
          fontSize: '0.9rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
          maxWidth: '600px',
          margin: '0 auto',
        }}>
          Traditional AI gives you an <strong>opinion</strong>. Verdicto gives you a <strong>verifiable, actionable, on-chain asset</strong>,
          cryptographically signed, permanently recorded, and economically valuable.
        </p>
      </motion.div>
    </div>
  );
};

export default RoadmapView;
