import React, { useState } from 'react';
import {
  Upload, Cpu, Users, Scale, ShieldCheck, ArrowDown,
  Calculator, Shield, TrendingUp, Search, Landmark,
  ChevronDown, ChevronUp, Zap, Lock, Eye, GitBranch
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Step Data ────────────────────────────────────────────────────────────────

const STEPS = [
  {
    num: '01',
    icon: <Upload size={28} />,
    title: 'Submit a Dispute',
    subtitle: 'You describe the asset and the question you need answered.',
    description:
      'Enter an asset address, type (property, collectible, etc.), and the dispute details. The system creates a unique dispute ID and opens a real-time session so you can watch the analysis unfold live.',
    accent: '#3B82F6',
    visual: 'submit',
  },
  {
    num: '02',
    icon: <Cpu size={28} />,
    title: 'The Orchestrator Dispatches',
    subtitle: 'One command center routes your case to five independent specialists.',
    description:
      'The Orchestrator receives your dispute, fetches baseline data from external APIs (property records, market feeds, economic indicators), then dispatches parallel analysis tasks to five AI agents — each with a distinct expertise.',
    accent: '#8B5CF6',
    visual: 'dispatch',
  },
  {
    num: '03',
    icon: <Users size={28} />,
    title: 'Five Specialists Analyze',
    subtitle: 'Independent, parallel, adversarial by design.',
    description:
      'Each agent works in isolation — no agent sees another\'s reasoning until deliberation. This prevents groupthink and ensures diverse perspectives. Agents pay for data access via x402 micropayments on Casper.',
    accent: '#EC4899',
    visual: 'agents',
  },
  {
    num: '04',
    icon: <Scale size={28} />,
    title: 'Agent Deliberation & Trust Scoring',
    subtitle: 'Opinions are weighed by on-chain reputation, not popularity.',
    description:
      'Agent analyses are collected and scored. Each agent\'s weight is determined by its on-chain trust score — a reputation built over time from accuracy and consistency. The HMAC receipt chain ensures no reasoning was altered after the fact.',
    accent: '#F59E0B',
    visual: 'deliberate',
  },
  {
    num: '05',
    icon: <ShieldCheck size={28} />,
    title: 'Verdict Recorded On-Chain',
    subtitle: 'Immutable, verifiable, permanently auditable.',
    description:
      'The final verdict — along with every agent\'s reasoning, confidence, and trust weight — is committed to the Casper blockchain. Anyone can verify the receipt chain independently. No central authority can rewrite the outcome.',
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
    method: 'RentCast API',
    desc: 'Pulls recent comparable sales and adjusts for differences in size, condition, and location.',
  },
  {
    name: 'Income Specialist',
    role: 'Cash Flow Analysis',
    icon: <TrendingUp size={20} />,
    color: '#F97316',
    method: 'FRED Economic Data',
    desc: 'Models rental income potential, cap rates, and discounted cash flow using live economic indicators.',
  },
  {
    name: 'Evidence Reviewer',
    role: 'Data Validation',
    icon: <Shield size={20} />,
    color: '#10B981',
    method: 'Groq LLM + RAG',
    desc: 'Cross-references raw data points, flags inconsistencies, and assesses evidence quality.',
  },
  {
    name: 'Trend Analyst',
    role: 'Market Context',
    icon: <TrendingUp size={20} />,
    color: '#06B6D4',
    method: 'Groq LLM + Market Data',
    desc: 'Evaluates macro trends, neighborhood trajectory, and market timing factors.',
  },
  {
    name: 'Case Researcher',
    role: 'Precedent Search',
    icon: <Search size={20} />,
    color: '#8B5CF6',
    method: 'Vectra RAG + Vector Search',
    desc: 'Searches historical disputes and outcomes to find relevant precedents and legal frameworks.',
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
        <div className="hiw-form-label">Dispute</div>
        <div className="hiw-form-value">Seller claims $450K value. Buyer disputes.</div>
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
      {[0, 1, 2, 3, 4].map(i => (
        <div key={i} className="hiw-dispatch-arrow" style={{ animationDelay: `${i * 0.15}s` }} />
      ))}
    </div>
    <div className="hiw-dispatch-targets">
      {['Comps', 'Income', 'Evidence', 'Trends', 'Precedent'].map((name, i) => (
        <div key={name} className="hiw-dispatch-target" style={{ animationDelay: `${0.6 + i * 0.1}s` }}>
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
    { name: 'Comps', value: 450000, weight: 28, color: '#EC4899' },
    { name: 'Income', value: 435000, weight: 24, color: '#F97316' },
    { name: 'Evidence', value: 442000, weight: 20, color: '#10B981' },
    { name: 'Trends', value: 448000, weight: 16, color: '#06B6D4' },
    { name: 'Precedent', value: 440000, weight: 12, color: '#8B5CF6' },
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
                whileInView={{ width: `${v.weight * 3}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 }}
              />
            </div>
            <div className="hiw-vote-meta">
              <span className="hiw-vote-value">${(v.value / 1000).toFixed(0)}K</span>
              <span className="hiw-vote-weight">{v.weight}%</span>
            </div>
          </div>
        ))}
      </div>
      <div className="hiw-deliberate-result">
        <div className="hiw-deliberate-verdict-label">Weighted Verdict</div>
        <div className="hiw-deliberate-verdict-value">$443,200</div>
        <div className="hiw-deliberate-verdict-note">±3.2% confidence interval</div>
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
        <span className="hiw-verdict-value" style={{ color: '#10B981' }}>$443,200 Fair Market Value</span>
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
        <span className="hiw-verdict-label">Block</span>
        <span className="hiw-verdict-value hiw-hash">#2,847,391</span>
      </div>
    </div>
    <div className="hiw-verdict-badge">
      <Lock size={12} />
      Immutable — Casper Testnet
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
      'Every agent action produces a signed receipt. Receipts are chained via HMAC-SHA256 — each receipt includes the hash of the previous one. This means any tampering with historical reasoning is instantly detectable.',
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
      'Before analysis begins, the orchestrator commits to a specific execution plan on-chain. After completion, anyone can verify that the committed plan was followed — no shortcuts, no substitutions.',
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
          Submit a Dispute. <br />Get a Verdict.
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
      <motion.section
        className="hiw-deep-dive"
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
