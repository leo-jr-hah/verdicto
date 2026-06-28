import React, { useState } from 'react';
import {
  Globe, Shield, Layers, GitBranch, Bot, Award,
  ChevronDown, ChevronUp, Lock, Database, Cpu,
  Eye, Coins, Cloud,
  CheckCircle, AlertTriangle, BarChart3, Scale, Link2,
} from 'lucide-react';
import { motion, AnimatePresence, useInView } from 'framer-motion';

// ─── Reveal Animation Wrapper ────────────────────────────────────────────────

const Reveal: React.FC<{ children: React.ReactNode; delay?: number }> = ({ children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-50px' }}
    transition={{ duration: 0.5, delay }}
  >
    {children}
  </motion.div>
);

// ─── Section Heading ─────────────────────────────────────────────────────────

const SectionHeading: React.FC<{ icon: React.ReactNode; title: string; subtitle: string }> = ({ icon, title, subtitle }) => (
  <div style={{ marginBottom: 'var(--space-5)' }}>
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)',
      fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)',
      textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 'var(--space-2)',
    }}>
      {icon}
      <span>{title}</span>
    </div>
    <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 640, margin: 0 }}>
      {subtitle}
    </p>
  </div>
);

// ─── Architecture Data ───────────────────────────────────────────────────────

const SYSTEM_LAYERS = [
  {
    id: 'client',
    title: 'Client Layer',
    subtitle: 'React SPA with Casper Wallet integration',
    icon: <Globe size={20} />,
    color: 'var(--text-secondary)',
    details: [
      { label: 'Wallet Authentication', desc: 'No accounts or passwords. Users connect via Casper Wallet browser extension. All signing happens client-side — private keys never leave the browser.' },
      { label: 'Real-Time Streaming', desc: 'Assessment progress, juror deliberation, and verdict updates stream to the UI via WebSocket. Users see agents reasoning in real time.' },
      { label: 'Payment Signing', desc: 'x402 micropayments are native transfer deploys constructed client-side, signed by the wallet, and submitted as payment proof with each API request.' },
      { label: 'Responsive Dashboard', desc: 'Single-page application built with React 19 + Vite. All four products (Assess, Borrow, Insure, Predict) plus Oracle and Disputes accessible from one interface.' },
    ],
  },
  {
    id: 'orchestrator',
    title: 'Orchestrator',
    subtitle: 'Express server coordinating all agents and business logic',
    icon: <Cpu size={20} />,
    color: 'var(--red-600)',
    details: [
      { label: 'Request Routing', desc: 'Receives API requests, validates x402 payment proofs against the Casper blockchain via CSPR.cloud, then dispatches work to the appropriate agent pipeline.' },
      { label: 'Dual-Write Persistence', desc: 'Every transaction writes to both a local JSON file (fast, for dev) and Supabase (persistent, for production). Data survives Railway redeploy cycles.' },
      { label: 'Agent Coordination', desc: 'Runs dual valuation agents in parallel, collects results, calculates divergence, and triggers the juror deliberation pipeline when valuations disagree beyond threshold.' },
      { label: 'Loan & Insurance Lifecycle', desc: 'Manages the full lifecycle: origination, continuous collateral monitoring, automated margin calls, claims processing with AI revaluation, and settlement.' },
    ],
  },
  {
    id: 'agents',
    title: 'AI Agent Layer',
    subtitle: 'Multiple independent LLM-powered analysts with distinct specializations',
    icon: <Bot size={20} />,
    color: 'var(--text-tertiary)',
    details: [
      { label: 'Dual Primary Valuators', desc: 'Agent A (Comps Specialist) focuses on market data, comparable sales, and spot prices. Agent B (Fundamentals Analyst) focuses on DCF, intrinsic value, and macro context. Each reasons independently.' },
      { label: 'Three-Agent Jury', desc: 'When primary valuations diverge, three jurors deliberate: Evidence Analyst (data quality), Market Data Interpreter (trends), and Precedent Researcher (historical analogies). Each casts a reputation-weighted vote.' },
      { label: 'LLM Cascade', desc: 'Primary: MiMo V2 (Xiaomi). Fallback 1: Groq (Llama 3.3 70B). Fallback 2: Deterministic heuristic calculations. The system never hard-fails — it always produces a result with appropriate confidence flags.' },
      { label: 'Prompt Injection Defense', desc: 'All user-supplied data is sanitized before injection into LLM prompts. Injection patterns are stripped, field lengths are capped, and outputs are validated as JSON before processing.' },
    ],
  },
  {
    id: 'blockchain',
    title: 'Settlement Layer',
    subtitle: 'Casper blockchain for immutable records and CSPR payments',
    icon: <Link2 size={20} />,
    color: 'var(--text-tertiary)',
    details: [
      { label: 'On-Chain Commitments', desc: 'Each assessment result is hashed (SHA-256 of input + agent state + block height) and anchored to Casper as a transfer memo. Creates a tamper-proof, timestamped record without smart contract overhead.' },
      { label: 'x402 Micropayments', desc: 'Pay-per-request model: users sign native CSPR transfers (2.5–5 CSPR per action) via their wallet. The orchestrator verifies the deploy hash on-chain before processing.' },
      { label: 'HMAC Receipt Chains', desc: 'Every juror deliberation step produces a cryptographically signed receipt (HMAC-SHA256). Receipts are chained: each links to the previous, creating an auditable timeline of reasoning.' },
      { label: 'Reputation Ledger', desc: 'Agent trust scores (execution quality, output consistency, economic stake) are computed on a 0–1000 scale with tiered classification: Bronze → Silver → Gold → Platinum.' },
    ],
  },
  {
    id: 'persistence',
    title: 'Persistence Layer',
    subtitle: 'Supabase (PostgreSQL) for durable storage across deploys',
    icon: <Database size={20} />,
    color: 'var(--text-tertiary)',
    details: [
      { label: 'Seven Core Tables', desc: 'assessments, loans, insurance, oracle_verdicts, disputes, transactions, predictions. Each product has its own table with full lifecycle tracking.' },
      { label: 'Dual-Write Pattern', desc: 'Writes go to both local JSON (for dev speed) and Supabase (for production durability). Reads merge and deduplicate from both sources by ID.' },
      { label: 'Graceful Degradation', desc: 'If Supabase is not configured, the system falls back to local-only storage with a clear warning. No data loss in dev — just no persistence across restarts.' },
      { label: 'Service Role Access', desc: 'Backend uses Supabase service role key for full read/write access. No client-side Supabase SDK — all database access goes through the orchestrator.' },
    ],
  },
];

const AGENTS_TABLE = [
  { name: 'Agent A', full: 'Comparable Sales Analyst', role: 'Primary Valuator', method: 'Market comparables, recent transactions, price-per-sqft, auction results, spot prices', data: 'RentCast API, Met Museum API, CoinGecko, FRED', style: 'comps' },
  { name: 'Agent B', full: 'Cash Flow Analyst', role: 'Primary Valuator', method: 'Discounted cash flow, intrinsic value, risk-adjusted returns, macro context', data: 'FRED (rates, CPI), market sentiment, economic indicators', style: 'fundamentals' },
  { name: 'Juror 1', full: 'Evidence Analyst', role: 'Juror', method: 'Data quality validation, source cross-referencing, confidence scoring', data: 'LLM reasoning over both valuations + raw evidence', style: 'juror' },
  { name: 'Juror 2', full: 'Market Data Interpreter', role: 'Juror', method: 'Macro trend analysis, timing assessment, market cycle positioning', data: 'Economic indicators, market sentiment, LLM analysis', style: 'juror' },
  { name: 'Juror 3', full: 'Precedent Researcher', role: 'Juror', method: 'Historical analogy search, pattern matching, case outcome prediction', data: 'Case database, vector similarity, LLM reasoning', style: 'juror' },
];

const DATA_SOURCES = [
  { name: 'RentCast', type: 'Real Estate', desc: 'Property data, comparable sales, market trends, rental estimates', coverage: 'US residential & commercial' },
  { name: 'Met Museum API', type: 'Fine Art', desc: 'Artist provenance, exhibition history, medium, comparable works', coverage: '470K+ artworks, free & unlimited' },
  { name: 'CoinGecko', type: 'Commodities', desc: 'Gold, silver, platinum spot prices with 24h volume and market cap', coverage: 'Global commodity markets' },
  { name: 'FRED', type: 'Macro Economics', desc: 'Federal Reserve Economic Data: mortgage rates, CPI, treasury yields, GDP', coverage: '816K+ US economic time series' },
  { name: 'CSPR.cloud', type: 'Blockchain', desc: 'Casper testnet RPC: deploy verification, account balance, block state', coverage: 'Full Casper testnet node' },
];

const ASSESSMENT_PIPELINE = [
  { step: '1', label: 'Submit Asset', desc: 'User provides asset details (type, location, description) and connects Casper Wallet', icon: <Globe size={16} /> },
  { step: '2', label: 'x402 Payment', desc: '2.5 CSPR micropayment signed by wallet, deploy hash verified on-chain', icon: <Coins size={16} /> },
  { step: '3', label: 'Data Fetch', desc: 'Orchestrator queries relevant APIs (RentCast, CoinGecko, FRED, etc.) for market data', icon: <Database size={16} /> },
  { step: '4', label: 'Dual Analysis', desc: 'Agent A (Comps) and Agent B (Fundamentals) independently value the asset via LLM', icon: <Bot size={16} /> },
  { step: '5', label: 'Divergence Check', desc: 'If valuations differ >15%, trigger juror deliberation pipeline', icon: <AlertTriangle size={16} /> },
  { step: '6', label: 'Juror Deliberation', desc: 'Three specialist jurors evaluate both analyses, cast reputation-weighted votes', icon: <Scale size={16} /> },
  { step: '7', label: 'Consensus', desc: 'Final value = weighted average by agent reputation. HMAC receipt chain generated', icon: <CheckCircle size={16} /> },
  { step: '8', label: 'On-Chain Record', desc: 'Result hash anchored to Casper blockchain as transfer memo. Transaction recorded', icon: <Shield size={16} /> },
];

const TRUST_TIERS = [
  { name: 'Platinum', threshold: '900–1000', color: 'var(--text-primary)', desc: 'Highest accuracy. Proven track record across many assessments.' },
  { name: 'Gold', threshold: '750–899', color: 'var(--text-tertiary)', desc: 'Consistently reliable. Strong alignment with real-world outcomes.' },
  { name: 'Silver', threshold: '500–749', color: 'var(--text-tertiary)', desc: 'Proven track record. Moderate accuracy with room for improvement.' },
  { name: 'Bronze', threshold: '0–499', color: 'var(--text-secondary)', desc: 'Building reputation. New or unproven agents.' },
];

const INFRASTRUCTURE = [
  { label: 'Frontend', items: ['React 19', 'TypeScript', 'Vite', 'Framer Motion', 'Casper Wallet SDK'] },
  { label: 'Backend', items: ['Express.js', 'TypeScript', 'Node.js', 'WebSocket', 'Zod validation'] },
  { label: 'AI', items: ['MiMo V2 (primary)', 'Groq / Llama 3.3 (fallback)', 'Deterministic heuristic (last resort)'] },
  { label: 'Database', items: ['Supabase (PostgreSQL)', 'Local JSON (dev fallback)', 'Dual-write pattern'] },
  { label: 'Blockchain', items: ['Casper Testnet', 'casper-js-sdk v5', 'CSPR.cloud RPC', 'Native transfers'] },
  { label: 'Hosting', items: ['Railway (backend)', 'Firebase Hosting (frontend)', 'Auto-deploy on push'] },
];

// ─── Layer Card Component ────────────────────────────────────────────────────

const LayerCard: React.FC<{
  layer: typeof SYSTEM_LAYERS[0];
  isOpen: boolean;
  onToggle: () => void;
  index: number;
}> = ({ layer, isOpen, onToggle, index }) => (
  <motion.div
    className="card card-hover"
    style={{ padding: 0, overflow: 'hidden' }}
    initial={{ opacity: 0, y: 16 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.4, delay: index * 0.06 }}
  >
    <div
      onClick={onToggle}
      style={{
        display: 'flex', alignItems: 'center', gap: 'var(--space-4)',
        padding: 'var(--space-5)', cursor: 'pointer', userSelect: 'none',
        transition: 'background var(--duration-fast) var(--ease-out-expo)',
      }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: 10,
        background: `${layer.color}15`, color: layer.color,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        {layer.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-sans)' }}>
          {layer.title}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 2 }}>
          {layer.subtitle}
        </div>
      </div>
      {isOpen
        ? <ChevronUp size={16} style={{ color: 'var(--text-tertiary)' }} />
        : <ChevronDown size={16} style={{ color: 'var(--text-tertiary)' }} />
      }
    </div>
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25 }}
          style={{ overflow: 'hidden' }}
        >
          <div style={{ padding: '0 var(--space-5) var(--space-5)', borderTop: '1px solid var(--border)' }}>
            {layer.details.map((item, i) => (
              <div key={item.label} style={{ paddingTop: i > 0 ? 'var(--space-3)' : 'var(--space-4)' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
                  {item.label}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {item.desc}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </motion.div>
);

// ─── Pipeline Step ───────────────────────────────────────────────────────────

const PipelineStep: React.FC<{
  step: typeof ASSESSMENT_PIPELINE[0];
  index: number;
  isLast: boolean;
}> = ({ step, index, isLast }) => {
  const ref = React.useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -16 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.4, delay: index * 0.06 }}
      style={{ display: 'flex', gap: 'var(--space-4)', position: 'relative' }}
    >
      {/* Vertical line */}
      {!isLast && (
        <div style={{
          position: 'absolute', left: 19, top: 40, bottom: -8,
          width: 1, background: 'var(--border)',
        }} />
      )}
      {/* Step number */}
      <div style={{
        width: 40, height: 40, borderRadius: 10, flexShrink: 0,
        background: 'var(--bg-elevated)', border: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13, fontWeight: 700, color: 'var(--text-primary)',
        fontFamily: 'var(--font-mono)',
      }}>
        {step.step}
      </div>
      {/* Content */}
      <div style={{ paddingBottom: isLast ? 0 : 'var(--space-5)' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
          marginBottom: 4,
        }}>
          <span style={{ color: 'var(--text-secondary)' }}>{step.icon}</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-sans)' }}>
            {step.label}
          </span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          {step.desc}
        </div>
      </div>
    </motion.div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────

export const ArchitectureView: React.FC = () => {
  const [openLayer, setOpenLayer] = useState<string | null>('orchestrator');

  return (
    <div className="arch-page">
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <Reveal>
        <div style={{ textAlign: 'center', padding: 'var(--space-8) 0 var(--sp-12)' }}>
          <h1 style={{
            fontSize: 'clamp(2rem, 4vw, 2.75rem)', fontWeight: 800,
            fontFamily: 'var(--font-sans)', letterSpacing: '-0.03em',
            color: 'var(--text-primary)', lineHeight: 1.15, margin: '0 0 var(--space-4)',
          }}>
            System Architecture
          </h1>
          <p style={{
            fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: 1.65,
            maxWidth: 680, margin: '0 auto',
          }}>
            Five layers — from the browser wallet to the Casper blockchain — connected by
            cryptographic proofs, LLM-powered reasoning, and reputation-weighted consensus.
            Every component is observable, auditable, and designed to fail gracefully.
          </p>
        </div>
      </Reveal>

      {/* ── System Layers ────────────────────────────────────────── */}
      <Reveal delay={0.05}>
        <section className="arch-section" style={{ marginBottom: 'var(--sp-12)' }}>
          <SectionHeading
            icon={<Layers size={13} />}
            title="System Layers"
            subtitle="Click each layer to explore its responsibilities, design decisions, and implementation details."
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {SYSTEM_LAYERS.map((layer, i) => (
              <LayerCard
                key={layer.id}
                layer={layer}
                isOpen={openLayer === layer.id}
                onToggle={() => setOpenLayer(openLayer === layer.id ? null : layer.id)}
                index={i}
              />
            ))}
          </div>
        </section>
      </Reveal>

      {/* ── Agent Network ────────────────────────────────────────── */}
      <Reveal delay={0.1}>
        <section className="arch-section" style={{ marginBottom: 'var(--sp-12)' }}>
          <SectionHeading
            icon={<Bot size={13} />}
            title="AI Agent Network"
            subtitle="Five independent agents, each with a distinct specialization. No single agent controls the outcome. Valuations emerge from structured disagreement."
          />
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {/* Desktop Table */}
            <div className="desktop-table-view" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr>
                    {['Agent', 'Full Name', 'Role', 'Methodology', 'Data Sources'].map(h => (
                      <th key={h} style={{
                        textAlign: 'left', padding: '10px 14px',
                        color: 'var(--text-tertiary)', fontWeight: 600, fontSize: 11,
                        textTransform: 'uppercase', letterSpacing: '0.05em',
                        borderBottom: '1px solid var(--border)',
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {AGENTS_TABLE.map(agent => (
                    <tr key={agent.name}>
                      <td style={{
                        padding: '10px 14px', fontWeight: 700, color: 'var(--text-primary)',
                        borderBottom: '1px solid var(--border)',
                        fontFamily: 'var(--font-mono)', fontSize: 12,
                      }}>
                        {agent.name}
                      </td>
                      <td style={{ padding: '10px 14px', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>
                        {agent.full}
                      </td>
                      <td style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
                        <span style={{
                          display: 'inline-block', padding: '2px 8px', borderRadius: 6,
                          fontSize: 11, fontWeight: 500,
                          background: 'var(--bg-elevated)',
                          color: agent.role === 'Primary Valuator' ? 'var(--text-secondary)' : 'var(--red-600)',
                        }}>
                          {agent.role}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)', maxWidth: 260 }}>
                        {agent.method}
                      </td>
                      <td style={{ padding: '10px 14px', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)', maxWidth: 200 }}>
                        {agent.data}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile Cards */}
            <div className="mobile-card-view" style={{ padding: '1rem' }}>
              {AGENTS_TABLE.map(agent => (
                <div key={agent.name} style={{
                  background: 'var(--bg-sunken)', padding: '1rem', borderRadius: 12,
                  border: '1px solid var(--border)', marginBottom: 'var(--space-3)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>
                      {agent.name}
                    </span>
                    <span style={{
                      padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 500,
                      background: 'var(--bg-elevated)',
                      color: agent.role === 'Primary Valuator' ? 'var(--text-secondary)' : 'var(--red-600)',
                    }}>
                      {agent.role}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 500, marginBottom: 6 }}>
                    {agent.full}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 6 }}>
                    <strong>Method:</strong> {agent.method}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    <strong>Data:</strong> {agent.data}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      {/* ── Assessment Pipeline ──────────────────────────────────── */}
      <Reveal delay={0.1}>
        <section className="arch-section" style={{ marginBottom: 'var(--sp-12)' }}>
          <SectionHeading
            icon={<GitBranch size={13} />}
            title="Assessment Pipeline"
            subtitle="From asset submission to on-chain settlement — the complete flow of a single assessment through all five system layers."
          />
          <div className="card" style={{ padding: 'var(--space-5)' }}>
            {ASSESSMENT_PIPELINE.map((step, i) => (
              <PipelineStep
                key={step.step}
                step={step}
                index={i}
                isLast={i === ASSESSMENT_PIPELINE.length - 1}
              />
            ))}
          </div>
        </section>
      </Reveal>

      {/* ── Data Sources ─────────────────────────────────────────── */}
      <Reveal delay={0.1}>
        <section className="arch-section" style={{ marginBottom: 'var(--sp-12)' }}>
          <SectionHeading
            icon={<BarChart3 size={13} />}
            title="Data Sources"
            subtitle="Real APIs feeding real market data into the agent reasoning pipeline. No synthetic data in production."
          />
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 'var(--space-3)',
          }}>
            {DATA_SOURCES.map((src, i) => (
              <motion.div
                key={src.name}
                className="card card-hover"
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.05 }}
                style={{ padding: 'var(--space-4)' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                    {src.name}
                  </span>
                  <span style={{
                    fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)',
                    background: 'var(--bg-elevated)', padding: '2px 8px', borderRadius: 6,
                    textTransform: 'uppercase', letterSpacing: '0.04em',
                  }}>
                    {src.type}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 'var(--space-2)' }}>
                  {src.desc}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                  {src.coverage}
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </Reveal>

      {/* ── Trust & Verification ─────────────────────────────────── */}
      <Reveal delay={0.1}>
        <section className="arch-section" style={{ marginBottom: 'var(--sp-12)' }}>
          <SectionHeading
            icon={<Award size={13} />}
            title="Trust & Verification"
            subtitle="Agent influence is earned through accuracy, not seniority. Every deliberation step is cryptographically signed and chained."
          />

          {/* Trust Tiers */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 'var(--space-3)',
            marginBottom: 'var(--space-5)',
          }}>
            {TRUST_TIERS.map((tier, i) => (
              <motion.div
                key={tier.name}
                className="card"
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.05 }}
                style={{ padding: 'var(--space-4)', textAlign: 'center' }}
              >
                <span style={{
                  display: 'inline-block', padding: '4px 14px', borderRadius: 8,
                  fontSize: 12, fontWeight: 700, color: 'var(--bg-primary)', background: tier.color,
                  marginBottom: 'var(--space-2)',
                }}>
                  {tier.name}
                </span>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>
                  {tier.threshold}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
                  {tier.desc}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Verification mechanisms */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 'var(--space-3)',
          }}>
            {[
              {
                icon: <Lock size={16} />,
                title: 'HMAC Receipt Chains',
                desc: 'Every juror deliberation step produces a signed receipt (HMAC-SHA256). Each receipt chains to the previous one, creating a tamper-evident timeline. The full chain can be verified by recomputing signatures from the shared secret.',
              },
              {
                icon: <Eye size={16} />,
                title: 'Verifiable Execution',
                desc: 'Before running an assessment, the orchestrator creates a cryptographic commitment (SHA-256 of input + agent state + block height). This is anchored on-chain, providing timestamped proof that specific inputs produced specific outputs.',
              },
              {
                icon: <Shield size={16} />,
                title: 'Challenge-Response Verification',
                desc: 'Juror agents are periodically challenged with known-answer tasks. Consistency (same challenge → similar output) and accuracy (output vs. expected baseline) feed into the trust score: 40% consistency + 60% accuracy.',
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                className="card card-hover"
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.06 }}
                style={{ padding: 'var(--space-5)' }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 8,
                  background: 'var(--bg-elevated)', color: 'var(--text-secondary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 'var(--space-3)',
                }}>
                  {item.icon}
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-sans)', marginBottom: 'var(--space-2)' }}>
                  {item.title}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {item.desc}
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </Reveal>

      {/* ── Infrastructure ───────────────────────────────────────── */}
      <Reveal delay={0.1}>
        <section className="arch-section" style={{ marginBottom: 'var(--sp-16)' }}>
          <SectionHeading
            icon={<Cloud size={13} />}
            title="Infrastructure"
            subtitle="Production stack deployed on Railway (backend) and Firebase Hosting (frontend), with Supabase for persistence."
          />
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 'var(--space-3)',
          }}>
            {INFRASTRUCTURE.map((group, i) => (
              <motion.div
                key={group.label}
                className="card"
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.04 }}
                style={{ padding: 'var(--space-4)' }}
              >
                <div style={{
                  fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)',
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                  marginBottom: 'var(--space-3)',
                }}>
                  {group.label}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {group.items.map(item => (
                    <div key={item} style={{
                      fontSize: 12, color: 'var(--text-secondary)',
                      display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
                    }}>
                      <div style={{
                        width: 4, height: 4, borderRadius: '50%',
                        background: 'var(--text-tertiary)', flexShrink: 0,
                      }} />
                      {item}
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </Reveal>
    </div>
  );
};
