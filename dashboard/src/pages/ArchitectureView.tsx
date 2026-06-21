import React, { useState } from 'react';
import {
  Upload, Cpu, Users, Scale, ShieldCheck, ArrowDown,
  Calculator, Shield, TrendingUp, Search, Landmark,
  ChevronDown, ChevronUp, Zap, Lock, Eye, GitBranch
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArchitectureDiagram } from '../components/landing/ArchitectureDiagram';

// ─── Step Data ────────────────────────────────────────────────────────────────

const STEPS = [
  {
    num: '01',
    icon: <Upload size={28} />,
    title: 'Submit Your Asset',
    subtitle: 'Tell Verdict what you want valued.',
    description:
      'Choose from Real Estate, Fine Art, or Commodities. Provide the asset details and your asking price. A 2.5 CSPR assessment fee is collected via x402 micropayment.',
    accent: '#3B82F6',
    visual: 'submit',
  },
  {
    num: '02',
    icon: <Cpu size={28} />,
    title: 'Independent Dual Valuation',
    subtitle: 'Two AI agents, two different methodologies.',
    description:
      'The Orchestrator dispatches parallel valuation tasks to the Comps Specialist (comparable sales analysis) and the DCF Specialist (discounted cash flow modeling). Each agent works independently using different data sources and methodologies.',
    accent: '#8B5CF6',
    visual: 'dispatch',
  },
  {
    num: '03',
    icon: <Users size={28} />,
    title: 'Juror Deliberation',
    subtitle: 'Three specialized jurors evaluate the valuations.',
    description:
      'If the two valuations diverge beyond a threshold, three jurors (Evidence Analyst, Market Data Interpreter, Precedent Researcher) deliberate across two rounds. In Round 2, each juror reviews peer reasoning and may revise their vote.',
    accent: '#EC4899',
    visual: 'agents',
  },
  {
    num: '04',
    icon: <Scale size={28} />,
    title: 'Trust-Weighted Vote Tally',
    subtitle: 'Votes are weighted by on-chain reputation.',
    description:
      'Votes are weighted by each juror\'s on-chain trust score, built from execution accuracy (40%), output consistency (30%), and economic stake (30%), scaled to 0-1000. The HMAC receipt chain ensures no reasoning was altered after the fact.',
    accent: '#F59E0B',
    visual: 'deliberate',
  },
  {
    num: '05',
    icon: <ShieldCheck size={28} />,
    title: 'Verdict Recorded On-Chain',
    subtitle: 'Immutable, verifiable, permanently auditable.',
    description:
      'The final verdict, along with every juror\'s reasoning, confidence, and trust weight, is committed to the Casper blockchain as a SHA-256 execution commitment. Anyone can verify the HMAC receipt chain independently.',
    accent: '#10B981',
    visual: 'verdict',
  },
] as const;

// ─── Agent Cards for Step 3 ───────────────────────────────────────────────────

const AGENTS = [
  {
    name: 'Comps Specialist',
    role: 'Comparable Sales',
    icon: <Calculator size={20} />,
    color: '#EC4899',
    method: 'Comparable Sales Analysis',
    desc: 'Analyzes comparable sales data and adjusts for differences in size, condition, and location to estimate fair market value.',
  },
  {
    name: 'DCF Specialist',
    role: 'DCF Analysis',
    icon: <TrendingUp size={20} />,
    color: '#F97316',
    method: 'Discounted Cash Flow',
    desc: 'Models rental income potential, cap rates, and discounted cash flow using economic indicators and market data.',
  },
  {
    name: 'Evidence Analyst',
    role: 'Data Validation',
    icon: <Shield size={20} />,
    color: '#10B981',
    method: 'LLM Reasoning',
    desc: 'Cross-references raw data points, flags inconsistencies, and assesses evidence quality using LLM reasoning.',
  },
  {
    name: 'Market Data Interpreter',
    role: 'Market Context',
    icon: <TrendingUp size={20} />,
    color: '#06B6D4',
    method: 'LLM + Market Data',
    desc: 'Evaluates macro trends, neighborhood trajectory, and market timing factors using LLM and live market feeds.',
  },
  {
    name: 'Precedent Researcher',
    role: 'Precedent Search',
    icon: <Search size={20} />,
    color: '#8B5CF6',
    method: 'Vector Search',
    desc: 'Searches historical assessments and outcomes via vector database to find relevant precedents and frameworks.',
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

const StepVisualSubmit: React.FC = () => (
  <div className="hiw-visual-card">
    <div className="hiw-form-preview">
      <div className="hiw-form-row">
        <div className="hiw-form-label">Asset</div>
        <div className="hiw-form-value">742 Evergreen Terrace, Springfield</div>
      </div>
      <div className="hiw-form-row">
        <div className="hiw-form-label">Type</div>
        <div className="hiw-form-value">Residential Property</div>
      </div>
      <div className="hiw-form-row">
        <div className="hiw-form-label">Asking Price</div>
        <div className="hiw-form-value">$450,000</div>
      </div>
      <div className="hiw-form-btn">
        <Zap size={14} />
        <span>Begin Assessment</span>
      </div>
    </div>
  </div>
);

const StepVisualDispatch: React.FC = () => (
  <div className="hiw-visual-card hiw-dispatch-visual">
    <div className="hiw-dispatch-center">
      <Cpu size={24} />
      <span>Orchestrator</span>
    </div>
    <div className="hiw-dispatch-arrows">
      {[0, 1].map(i => (
        <div key={i} className="hiw-dispatch-arrow" style={{ animationDelay: `${i * 0.15}s` }} />
      ))}
    </div>
    <div className="hiw-dispatch-targets">
      {['Agent A\n(Comps)', 'Agent B\n(DCF)'].map((name, i) => (
        <div key={name} className="hiw-dispatch-target" style={{ animationDelay: `${0.6 + i * 0.1}s`, whiteSpace: 'pre-line' }}>
          {name}
        </div>
      ))}
    </div>
  </div>
);

const StepVisualAgents: React.FC = () => (
  <div className="hiw-agents-grid">
    {AGENTS.map(agent => (
      <div key={agent.name} className="hiw-agent-card" style={{ '--agent-color': agent.color } as React.CSSProperties}>
        <div className="hiw-agent-header">
          <div className="hiw-agent-icon">{agent.icon}</div>
          <div>
            <div className="hiw-agent-name">{agent.name}</div>
            <div className="hiw-agent-role">{agent.role}</div>
          </div>
        </div>
        <div className="hiw-agent-desc">{agent.desc}</div>
        <div className="hiw-agent-method">{agent.method}</div>
      </div>
    ))}
  </div>
);

const StepVisualDeliberate: React.FC = () => {
  const votes = [
    { name: 'Evidence Analyst', verdict: 'Value A (Comps)', weight: 40, color: '#10B981' },
    { name: 'Market Interpreter', verdict: 'Value B (DCF)', weight: 35, color: '#06B6D4' },
    { name: 'Precedent Researcher', verdict: 'Value A (Comps)', weight: 25, color: '#8B5CF6' },
  ];
  return (
    <div className="hiw-visual-card hiw-deliberate-visual">
      <div className="hiw-vote-bars">
        {votes.map(v => (
          <div key={v.name} className="hiw-vote-row">
            <div className="hiw-vote-label">{v.name}</div>
            <div className="hiw-vote-track">
              <motion.div
                className="hiw-vote-fill"
                style={{ background: v.color }}
                initial={{ width: 0 }}
                whileInView={{ width: `${v.weight * 2.5}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 }}
              />
            </div>
            <div className="hiw-vote-meta">
              <span className="hiw-vote-value">{v.verdict}</span>
              <span className="hiw-vote-weight">{v.weight}%</span>
            </div>
          </div>
        ))}
      </div>
      <div className="hiw-deliberate-result">
        <div className="hiw-deliberate-verdict-label">Trust-Weighted Verdict</div>
        <div className="hiw-deliberate-verdict-value">Value A: $450,000</div>
        <div className="hiw-deliberate-verdict-note">HMAC receipt chain verified</div>
      </div>
    </div>
  );
};

const StepVisualVerdict: React.FC = () => (
  <div className="hiw-visual-card hiw-verdict-visual">
    <div className="hiw-verdict-header">
      <ShieldCheck size={20} />
      <span>Verdict Finalized</span>
    </div>
    <div className="hiw-verdict-body">
      <div className="hiw-verdict-row">
        <span className="hiw-verdict-label">Outcome</span>
        <span className="hiw-verdict-value" style={{ color: '#10B981' }}>$450,000</span>
      </div>
      <div className="hiw-verdict-row">
        <span className="hiw-verdict-label">Confidence</span>
        <span className="hiw-verdict-value">94.7%</span>
      </div>
      <div className="hiw-verdict-row">
        <span className="hiw-verdict-label">Receipt Chain</span>
        <span className="hiw-verdict-value hiw-hash">0x7a3f...e2b1</span>
      </div>
      <div className="hiw-verdict-row">
        <span className="hiw-verdict-label">Trust Score</span>
        <span className="hiw-verdict-value">847 / 1000</span>
      </div>
    </div>
    <div className="hiw-verdict-badge">
      <Lock size={12} />
      Immutable on Casper Testnet
    </div>
  </div>
);

const VISUALS: Record<string, React.FC> = {
  submit: StepVisualSubmit,
  dispatch: StepVisualDispatch,
  agents: StepVisualAgents,
  deliberate: StepVisualDeliberate,
  verdict: StepVisualVerdict,
};

// ─── Detail Expand Sections ───────────────────────────────────────────────────

const DETAILS = [
  {
    title: 'HMAC Receipt Chain',
    icon: <GitBranch size={16} />,
    content:
      'Every agent action produces a signed receipt. Receipts are chained via HMAC-SHA256, where each receipt includes the hash of the previous one. This means any tampering with historical reasoning is instantly detectable.',
  },
  {
    title: 'x402 Micropayments',
    icon: <Zap size={16} />,
    content:
      'Agents pay for premium data access (property records, economic feeds) using HTTP 402 micropayments on the Casper network. This creates a sustainable, decentralized data marketplace.',
  },
  {
    title: 'On-Chain Reputation',
    icon: <Landmark size={16} />,
    content:
      'Agent trust scores are stored in a Casper smart contract. Scores increase with accurate assessments and decrease with poor ones. The contract is the single source of truth for agent reliability.',
  },
  {
    title: 'Verifiable Execution',
    icon: <Eye size={16} />,
    content:
      'Before analysis begins, the orchestrator commits to a specific execution plan on-chain. After completion, anyone can verify that the committed plan was followed, with no shortcuts or substitutions.',
  },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export const ArchitectureView: React.FC = () => {
  const [expandedDetail, setExpandedDetail] = useState<number | null>(null);

  return (
    <div className="hiw-page">
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <header className="hiw-hero">
        <motion.h1
          className="hiw-hero-title"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Submit Your Asset. <br />Get a Verdict.
        </motion.h1>
        <motion.p
          className="hiw-hero-subtitle"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          Five AI specialists independently analyze your asset, deliberate with trust-weighted scoring, and record the outcome immutably on the Casper blockchain. No single point of failure. No hidden reasoning.
        </motion.p>
      </header>

      {/* ── Steps ────────────────────────────────────────────────── */}
      <div className="hiw-steps">
        {STEPS.map((step, idx) => {
          const Visual = VISUALS[step.visual];
          const isEven = idx % 2 === 0;
          return (
            <motion.section
              key={step.num}
              className={`hiw-step ${isEven ? 'hiw-step--left' : 'hiw-step--right'}`}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.5 }}
            >
              {/* Connector line */}
              {idx < STEPS.length - 1 && (
                <div className="hiw-step-connector">
                  <ArrowDown size={20} />
                </div>
              )}

              <div className="hiw-step-content">
                {/* Text side */}
                <div className="hiw-step-text">
                  <div className="hiw-step-badge" style={{ background: `${step.accent}18`, color: step.accent }}>
                    {step.icon}
                    <span>Step {step.num}</span>
                  </div>
                  <h2 className="hiw-step-title">{step.title}</h2>
                  <p className="hiw-step-subtitle">{step.subtitle}</p>
                  <p className="hiw-step-desc">{step.description}</p>
                </div>

                {/* Visual side */}
                <div className="hiw-step-visual">
                  {Visual && <Visual />}
                </div>
              </div>
            </motion.section>
          );
        })}
      </div>

      {/* ── Under the Hood ───────────────────────────────────────── */}
      {/* Architecture Diagram */}
      <ArchitectureDiagram />

      {/* Deep Dive Section */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="hiw-deep-dive-title">Under the Hood</h2>
        <p className="hiw-deep-dive-subtitle">
          The cryptographic and economic primitives that make Verdict trustworthy.
        </p>

        <div className="hiw-deep-dive-grid">
          {DETAILS.map((detail, i) => (
            <div
              key={detail.title}
              className={`hiw-detail-card ${expandedDetail === i ? 'hiw-detail-card--open' : ''}`}
              onClick={() => setExpandedDetail(expandedDetail === i ? null : i)}
            >
              <div className="hiw-detail-header">
                <div className="hiw-detail-icon">{detail.icon}</div>
                <span className="hiw-detail-title">{detail.title}</span>
                {expandedDetail === i ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
              <AnimatePresence>
                {expandedDetail === i && (
                  <motion.p
                    className="hiw-detail-content"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    {detail.content}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </motion.section>
    </div>
  );
};
