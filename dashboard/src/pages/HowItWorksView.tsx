import React, { useState } from 'react';
import {
  Shield, Globe, Server, ChevronDown, ChevronUp, Lock, Eye,
  FileCode, ArrowRight, Layers, GitBranch, Bot, Award, Coins, AlertTriangle,
  Zap, TrendingUp, Users,
} from 'lucide-react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { Reveal } from '../components/landing/UIComponents';

// ─── Data ─────────────────────────────────────────────────────────────────────

const LAYERS = [
  {
    id: 'frontend',
    title: 'Client Interface',
    subtitle: 'Secure wallet-connected dashboard for asset owners and institutional users',
    icon: <Globe size={20} />,
    color: '#3B82F6',
    stats: ['Wallet-native auth', 'Real-time streaming', 'Mobile-ready'],
    items: [
      {
        label: 'Asset Assessment Portal',
        detail: 'Submit any real-world asset, including real estate, fine art, commodities, and collectibles, and receive a multi-agent valuation in under 60 seconds. No account creation required. Authentication is handled entirely through your Casper Wallet.',
      },
      {
        label: 'Lending & Insurance Desk',
        detail: 'Borrow against assessed collateral or insure assets against value decline. Loan-to-value ratios and insurance premiums are calculated by AI based on asset type, market conditions, and assessment confidence, not static rules.',
      },
      {
        label: 'Live Audit Trail',
        detail: 'Every valuation, payment, and verdict is recorded on-chain with a cryptographic receipt. Full transparency into agent reasoning, data sources, and consensus outcomes, auditable by anyone.',
      },
      {
        label: 'Portfolio Dashboard',
        detail: 'Track active loans, insurance policies, and confidence analyses in one view. Real-time collateral monitoring with automated margin alerts when loan-to-value ratios approach risk thresholds.',
      },
    ],
  },
  {
    id: 'backend',
    title: 'AI Agent Network',
    subtitle: 'Five independent analysts with autonomous methodology selection and juror deliberation',
    icon: <Server size={20} />,
    color: '#8B5CF6',
    stats: ['5 independent agents', 'Autonomous reasoning', 'Juror peer review'],
    items: [
      {
        label: 'Dual Valuation Engine',
        detail: 'Two primary analysts independently value each asset using different methodologies, including Comparable Sales Analysis and Discounted Cash Flow. Each agent autonomously selects its approach based on data availability, not hardcoded rules.',
      },
      {
        label: 'Three-Agent Jury',
        detail: 'When primary valuations diverge beyond acceptable thresholds, three juror agents independently evaluate both analyses. They assess data quality, methodology appropriateness, and market context, then deliberate through a structured peer-review process.',
      },
      {
        label: 'Reputation-Weighted Consensus',
        detail: 'Final valuations are weighted by each agent\'s on-chain reputation score. Agents with proven accuracy carry more influence. Reputation is earned through retroactive settlement. When reality proves one agent closer than others, scores adjust accordingly.',
      },
      {
        label: 'Autonomous Operations',
        detail: 'Background monitors continuously track active loans and insurance policies. Collateral values are re-evaluated against live market data, triggering margin calls or claim processing without human intervention.',
      },
    ],
  },
  {
    id: 'contracts',
    title: 'On-Chain Settlement',
    subtitle: 'Three smart contracts on Casper blockchain ensuring verifiable, tamper-proof records',
    icon: <FileCode size={20} />,
    color: '#F59E0B',
    stats: ['3 deployed contracts', 'Casper Testnet', 'Publicly verifiable'],
    items: [
      {
        label: 'Verdicto Registry',
        detail: 'Every assessment outcome is recorded on-chain with the full voting record, including which agents voted, their confidence levels, and the weighted consensus. Once committed, results cannot be altered or deleted.',
      },
      {
        label: 'Reputation Ledger',
        detail: 'Agent trust scores are stored on-chain with full history. Score changes are transparent and auditable. Tier assignments (Platinum, Gold, Silver, Bronze) are determined by verifiable accuracy metrics.',
      },
      {
        label: 'Escrow Vault',
        detail: 'Dispute resolution funds are locked in a smart contract until a verdict is reached. Funds are released only when consensus is achieved and recorded on-chain, eliminating counterparty risk.',
      },
    ],
  },
];

const FLOWS = [
  {
    id: 'assessment',
    title: 'Asset Assessment',
    color: '#3B82F6',
    steps: [
      { label: 'Submit Asset', detail: 'Select asset type, provide details, connect wallet' },
      { label: 'Micropayment', detail: 'Small CSPR fee signed directly by your wallet' },
      { label: 'Parallel Analysis', detail: 'Five AI agents independently evaluate the asset' },
      { label: 'Juror Review', detail: 'If valuations diverge, jury deliberates with peer review' },
      { label: 'Consensus', detail: 'Reputation-weighted valuation with confidence score' },
      { label: 'On-Chain Record', detail: 'Result immutably committed to Casper blockchain' },
    ],
  },
  {
    id: 'borrow',
    title: 'Collateralized Lending',
    color: '#10B981',
    steps: [
      { label: 'Select Assessment', detail: 'Use an existing valuation as collateral' },
      { label: 'AI Risk Pricing', detail: 'Loan-to-value ratio calculated by asset class and confidence' },
      { label: 'Loan Origination', detail: 'CSPR disbursed directly to your wallet' },
      { label: 'Continuous Monitoring', detail: 'Autonomous collateral re-evaluation against live markets' },
      { label: 'Risk Alerts', detail: 'Automated margin calls if collateral value declines' },
      { label: 'Settlement', detail: 'Repay anytime, collateral released on-chain' },
    ],
  },
  {
    id: 'insurance',
    title: 'Asset Insurance',
    color: '#EC4899',
    steps: [
      { label: 'Select Assessment', detail: 'Use an existing valuation as the insured value' },
      { label: 'Risk Assessment', detail: 'AI evaluates volatility, liquidity, and market stability' },
      { label: 'Premium Calculation', detail: 'Dynamic pricing based on real risk factors, not flat rates' },
      { label: 'Policy Activation', detail: 'Coverage begins immediately after micropayment' },
      { label: 'Continuous Tracking', detail: 'Asset value monitored throughout policy period' },
      { label: 'Claims Processing', detail: 'AI revalues asset, calculates payout, transfers CSPR' },
    ],
  },
];

const AGENTS = [
  { name: 'Comparable Sales Analyst', role: 'Primary Valuator', method: 'Market comparables with property-level adjustments', data: 'Real estate transactions, listings, market data' },
  { name: 'Cash Flow Analyst', role: 'Primary Valuator', method: 'Discounted cash flow with risk-adjusted rates', data: 'Economic indicators, rental yields, interest rates' },
  { name: 'Evidence Analyst', role: 'Juror', method: 'Data quality validation and source cross-referencing', data: 'LLM-powered reasoning, confidence scoring' },
  { name: 'Market Interpreter', role: 'Juror', method: 'Macro trend analysis and timing assessment', data: 'Economic indicators, market sentiment, LLM analysis' },
  { name: 'Precedent Researcher', role: 'Juror', method: 'Historical analogy search and pattern matching', data: 'Case database, vector similarity, LLM reasoning' },
];

const TIERS = [
  { name: 'Platinum', threshold: '900+', color: '#E5E7EB', desc: 'Highest accuracy' },
  { name: 'Gold', threshold: '750+', color: '#F59E0B', desc: 'Consistently reliable' },
  { name: 'Silver', threshold: '600+', color: '#9CA3AF', desc: 'Proven track record' },
  { name: 'Bronze', threshold: 'Below 600', color: '#D97706', desc: 'Building reputation' },
];

const WHY_VERDICT = [
  { icon: <Zap size={18} />, title: '60-Second Valuations', desc: 'What takes traditional appraisers 2 to 4 weeks, Verdicto delivers in under a minute with full methodology transparency.' },
  { icon: <Users size={18} />, title: 'Multi-Agent Deliberation', desc: 'No single AI model decides. Five independent agents analyze, three jurors review, and consensus is weighted by proven accuracy.' },
  { icon: <Shield size={18} />, title: 'On-Chain Verifiability', desc: 'Every verdict, vote, and payment is recorded on the Casper blockchain. Results are tamper-proof and publicly auditable.' },
  { icon: <TrendingUp size={18} />, title: 'Self-Improving Accuracy', desc: 'Agents earn reputation through retroactive settlement. When reality proves one analysis closer than others, scores adjust. The system gets smarter over time.' },
];

// ─── Layer Card ───────────────────────────────────────────────────────────────

const LayerCard: React.FC<{ layer: typeof LAYERS[0]; isOpen: boolean; onToggle: () => void }> = ({ layer, isOpen, onToggle }) => (
  <div className="card card-hover" style={{ padding: 0, overflow: 'hidden' }}>
    <div
      onClick={onToggle}
      style={{
        display: 'flex', alignItems: 'center', gap: 'var(--sp-4)',
        padding: 'var(--sp-5)', cursor: 'pointer', userSelect: 'none',
        transition: 'background var(--transition-fast)',
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
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
          {layer.title}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 2 }}>
          {layer.subtitle}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 'var(--sp-2)', flexShrink: 0 }}>
        {layer.stats.map(s => (
          <span key={s} style={{
            fontSize: 11, color: 'var(--text-tertiary)', background: 'var(--bg-surface)',
            padding: '3px 8px', borderRadius: 6, whiteSpace: 'nowrap',
          }}>
            {s}
          </span>
        ))}
      </div>
      {isOpen ? <ChevronUp size={16} style={{ color: 'var(--text-tertiary)' }} /> : <ChevronDown size={16} style={{ color: 'var(--text-tertiary)' }} />}
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
          <div style={{ padding: '0 var(--sp-5) var(--sp-5)', borderTop: '1px solid var(--border-color)' }}>
            {layer.items.map((item, i) => (
              <div key={item.label} style={{ paddingTop: i > 0 ? 'var(--sp-3)' : 'var(--sp-4)' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
                  {item.label}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {item.detail}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

// ─── Flow Diagram ─────────────────────────────────────────────────────────────

const FlowDiagram: React.FC<{ flow: typeof FLOWS[0]; index: number }> = ({ flow, index }) => {
  const ref = React.useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <motion.div
      ref={ref}
      className="card"
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      style={{ padding: 'var(--sp-5)' }}
    >
      <div style={{
        fontSize: 14, fontWeight: 600, color: flow.color, marginBottom: 'var(--sp-4)',
        fontFamily: 'var(--font-display)', letterSpacing: '-0.01em',
      }}>
        {flow.title}
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--sp-2)', overflowX: 'auto', paddingBottom: 'var(--sp-2)' }}>
        {flow.steps.map((step, i) => (
          <React.Fragment key={step.label}>
            <div style={{ flex: 1, minWidth: 120, textAlign: 'center' }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', margin: '0 auto 6px',
                background: `${flow.color}20`, color: flow.color,
                fontSize: 12, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {i + 1}
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
                {step.label}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', lineHeight: 1.4 }}>
                {step.detail}
              </div>
            </div>
            {i < flow.steps.length - 1 && (
              <ArrowRight size={14} style={{ color: 'var(--text-tertiary)', flexShrink: 0, marginTop: 6 }} />
            )}
          </React.Fragment>
        ))}
      </div>
    </motion.div>
  );
};

// ─── Agent Table ──────────────────────────────────────────────────────────────

const AgentTable: React.FC = () => (
  <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr>
            {['Agent', 'Role', 'Methodology', 'Data Sources'].map(h => (
              <th key={h} style={{
                textAlign: 'left', padding: '10px 14px',
                color: 'var(--text-tertiary)', fontWeight: 600, fontSize: 11,
                textTransform: 'uppercase', letterSpacing: '0.05em',
                borderBottom: '1px solid var(--border-color)',
              }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {AGENTS.map(agent => (
            <tr key={agent.name}>
              <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)' }}>
                {agent.name}
              </td>
              <td style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{
                  display: 'inline-block', padding: '2px 8px', borderRadius: 6,
                  fontSize: 11, fontWeight: 500,
                  background: agent.role === 'Primary Valuator' ? 'rgba(59,130,246,0.1)' : 'rgba(139,92,246,0.1)',
                  color: agent.role === 'Primary Valuator' ? '#60A5FA' : '#A78BFA',
                }}>
                  {agent.role}
                </span>
              </td>
              <td style={{ padding: '10px 14px', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                {agent.method}
              </td>
              <td style={{ padding: '10px 14px', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                {agent.data}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// ─── Section Heading ──────────────────────────────────────────────────────────

const SectionHeading: React.FC<{ icon: React.ReactNode; title: string; subtitle: string }> = ({ icon, title, subtitle }) => (
  <div style={{ marginBottom: 'var(--sp-5)' }}>
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 'var(--sp-2)',
      fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)',
      textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 'var(--sp-2)',
    }}>
      {icon}
      <span>{title}</span>
    </div>
    <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 640, margin: 0 }}>
      {subtitle}
    </p>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export const HowItWorksView: React.FC = () => {
  const [openLayer, setOpenLayer] = useState<string | null>('frontend');

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'var(--sp-6) var(--sp-5) var(--sp-16)' }}>
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <Reveal>
        <div style={{ textAlign: 'center', padding: 'var(--sp-8) 0 var(--sp-12)' }}>
          <h1 style={{
            fontSize: 'clamp(2rem, 4vw, 2.75rem)', fontWeight: 800,
            fontFamily: 'var(--font-display)', letterSpacing: '-0.03em',
            color: 'var(--text-primary)', lineHeight: 1.15, margin: '0 0 var(--sp-4)',
          }}>
            How Verdicto Works
          </h1>
          <p style={{
            fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: 1.65,
            maxWidth: 640, margin: '0 auto',
          }}>
            Five independent AI analysts evaluate every asset. Three juror agents
            deliberate when valuations disagree. Results are settled on-chain with
            cryptographic receipts. No black boxes.
          </p>
        </div>
      </Reveal>

      {/* ── Why Verdicto ──────────────────────────────────────────── */}
      <Reveal delay={0.05}>
        <section style={{ marginBottom: 'var(--sp-12)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--sp-3)' }}>
            {WHY_VERDICT.map((item, i) => (
              <motion.div
                key={item.title}
                className="card card-hover"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                style={{ padding: 'var(--sp-5)' }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 8,
                  background: 'var(--bg-surface)', color: 'var(--text-secondary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 'var(--sp-3)',
                }}>
                  {item.icon}
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-display)', marginBottom: 'var(--sp-2)' }}>
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

      {/* ── Three-Layer Architecture ─────────────────────────────── */}
      <Reveal delay={0.1}>
        <section style={{ marginBottom: 'var(--sp-12)' }}>
          <SectionHeading
            icon={<Layers size={13} />}
            title="Three-Layer Architecture"
            subtitle="Every assessment flows through three layers: a secure client interface, an autonomous AI agent network, and on-chain settlement. Click each layer to learn more."
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
            {LAYERS.map(layer => (
              <LayerCard
                key={layer.id}
                layer={layer}
                isOpen={openLayer === layer.id}
                onToggle={() => setOpenLayer(openLayer === layer.id ? null : layer.id)}
              />
            ))}
          </div>
        </section>
      </Reveal>

      {/* ── Data Flows ───────────────────────────────────────────── */}
      <Reveal delay={0.1}>
        <section style={{ marginBottom: 'var(--sp-12)' }}>
          <SectionHeading
            icon={<GitBranch size={13} />}
            title="Product Lifecycles"
            subtitle="From asset submission to on-chain settlement, each product follows a structured, auditable process."
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
            {FLOWS.map((flow, i) => (
              <FlowDiagram key={flow.id} flow={flow} index={i} />
            ))}
          </div>
        </section>
      </Reveal>

      {/* ── Agent System ─────────────────────────────────────────── */}
      <Reveal delay={0.1}>
        <section style={{ marginBottom: 'var(--sp-12)' }}>
          <SectionHeading
            icon={<Bot size={13} />}
            title="AI Agent Network"
            subtitle="Five independent analysts, each specializing in a different evaluation methodology. No single agent controls the outcome."
          />
          <AgentTable />
        </section>
      </Reveal>

      {/* ── Trust Scoring ────────────────────────────────────────── */}
      <Reveal delay={0.1}>
        <section style={{ marginBottom: 'var(--sp-12)' }}>
          <SectionHeading
            icon={<Award size={13} />}
            title="Reputation System"
            subtitle="Agent influence is earned through accuracy, not seniority. Scores are updated retroactively when real-world outcomes prove one analysis closer than others."
          />

          {/* Tier cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--sp-3)', marginBottom: 'var(--sp-4)' }}>
            {TIERS.map(tier => (
              <div key={tier.name} className="card" style={{ textAlign: 'center', padding: 'var(--sp-4)' }}>
                <span style={{
                  display: 'inline-block', padding: '4px 12px', borderRadius: 8,
                  fontSize: 12, fontWeight: 700, color: '#000', background: tier.color,
                  marginBottom: 'var(--sp-2)',
                }}>
                  {tier.name}
                </span>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                  {tier.threshold}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
                  {tier.desc}
                </div>
              </div>
            ))}
          </div>

          {/* Trust detail cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
            {[
              { label: 'How Scores Are Earned', value: 'Agents are evaluated on historical accuracy, consistency of confidence scores, quality of reasoning, and effective use of available data. Higher-scoring agents carry more weight in consensus decisions.' },
              { label: 'Retroactive Settlement', value: 'Unlike consensus-based systems, Verdicto does not reward agents for agreeing with each other. When a real-world outcome occurs (a property sells, a market shifts), each agent\'s confidence score is compared to reality. The closest agent gains reputation; the furthest loses it.' },
              { label: 'Anti-Groupthink Design', value: 'Because reputation is earned through accuracy rather than conformity, agents are incentivized to produce independent analyses rather than cluster around a safe middle ground. This is the core differentiator from single-model AI valuation.' },
            ].map(item => (
              <div key={item.label} className="card" style={{ padding: 'var(--sp-3) var(--sp-4)' }}>
                <div style={{
                  fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)',
                  textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2,
                }}>
                  {item.label}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6 }}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      {/* ── Smart Contracts ──────────────────────────────────────── */}
      <Reveal delay={0.1}>
        <section style={{ marginBottom: 'var(--sp-12)' }}>
          <SectionHeading
            icon={<FileCode size={13} />}
            title="On-Chain Settlement"
            subtitle="Three smart contracts deployed on the Casper blockchain. Every verdict, reputation update, and escrow action is publicly verifiable."
          />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--sp-3)' }}>
            {[
              { name: 'Verdicto Registry', desc: 'Records every assessment outcome with the full voting record, including agent identities, confidence levels, and weighted consensus. Once committed, results are immutable.', hash: 'f00cbb8f…' },
              { name: 'Reputation Ledger', desc: 'Stores agent trust scores with complete history. Score changes are transparent and auditable. Tier assignments are determined by verifiable accuracy metrics.', hash: '30da84e6…' },
              { name: 'Escrow Vault', desc: 'Locks dispute resolution funds until a verdict is reached. Funds release only when consensus is achieved and recorded on-chain, eliminating counterparty risk.', hash: '83bf2bab…' },
            ].map((c, i) => (
              <motion.div
                key={c.name}
                className="card card-hover"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', marginBottom: 'var(--sp-3)' }}>
                  <FileCode size={18} style={{ color: 'var(--text-secondary)' }} />
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-display)', flex: 1 }}>
                    {c.name}
                  </span>
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 var(--sp-3)' }}>
                  {c.desc}
                </p>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 'var(--sp-1)',
                  fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)',
                }}>
                  <Lock size={11} />
                  <span>Deploy: {c.hash}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </Reveal>

      {/* ── x402 Payment Protocol ────────────────────────────────── */}
      <Reveal delay={0.1}>
        <section style={{ marginBottom: 'var(--sp-12)' }}>
          <SectionHeading
            icon={<Coins size={13} />}
            title="Micropayment Protocol"
            subtitle="Every assessment, loan, and insurance policy is gated by a small CSPR micropayment, signed directly by the user's wallet. No accounts, no subscriptions, no stored payment methods."
          />

          {/* Payment flow */}
          <div className="card" style={{
            padding: 'var(--sp-4) var(--sp-5)',
            display: 'flex', alignItems: 'flex-start', gap: 'var(--sp-2)',
            overflowX: 'auto', marginBottom: 'var(--sp-4)',
          }}>
            {[
              { step: 1, label: 'Request', detail: 'User initiates an action' },
              { step: 2, label: 'Payment Prompt', detail: 'System requests a micropayment' },
              { step: 3, label: 'Wallet Signature', detail: 'User approves in Casper Wallet' },
              { step: 4, label: 'Verification', detail: 'Cryptographic proof validated' },
              { step: 5, label: 'Execution', detail: 'Action processed and recorded' },
            ].map((item, i, arr) => (
              <React.Fragment key={item.step}>
                <div style={{ flex: 1, minWidth: 110, textAlign: 'center' }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%', margin: '0 auto 6px',
                    background: 'rgba(245,158,11,0.15)', color: '#F59E0B',
                    fontSize: 11, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {item.step}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', lineHeight: 1.4 }}>
                    {item.detail}
                  </div>
                </div>
                {i < arr.length - 1 && (
                  <ArrowRight size={14} style={{ color: 'var(--text-tertiary)', flexShrink: 0, marginTop: 6 }} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Fee grid */}
          <div className="card" style={{ padding: 'var(--sp-4) var(--sp-5)' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 'var(--sp-3)', fontFamily: 'var(--font-display)' }}>
              Fee Structure
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--sp-3)' }}>
              {[
                { product: 'Assessment', fee: '2.5 CSPR' },
                { product: 'Confidence Analysis', fee: '1 CSPR' },
                { product: 'Loan Origination', fee: '5 CSPR' },
                { product: 'Insurance Policy', fee: '3 CSPR' },
              ].map(item => (
                <div key={item.product} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 2 }}>{item.product}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#F59E0B' }}>{item.fee}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      {/* ── Honest Limitations ───────────────────────────────────── */}
      <Reveal delay={0.1}>
        <section>
          <SectionHeading
            icon={<AlertTriangle size={13} />}
            title="Transparency"
            subtitle="We believe in being upfront about what's production-ready and what's still evolving."
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-3)' }}>
            {/* What's Real */}
            <div className="card" style={{ padding: 'var(--sp-5)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', marginBottom: 'var(--sp-4)' }}>
                <Shield size={16} style={{ color: '#10B981' }} />
                <span style={{ fontSize: 14, fontWeight: 600, color: '#10B981', fontFamily: 'var(--font-display)' }}>Production-Ready</span>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
                {[
                  'All four products (Assess, Borrow, Insure, Confidence) work end-to-end',
                  'Micropayments are real wallet-signed CSPR transfers, not simulated',
                  'Smart contracts are deployed and publicly verifiable on Casper Testnet',
                  'AI agents use live market data from established financial data providers',
                  'Autonomous monitors run continuously without human intervention',
                  'Every execution step produces a cryptographically verifiable receipt',
                  'Full test suite passing with comprehensive coverage',
                ].map(item => (
                  <li key={item} style={{
                    fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6,
                    paddingLeft: 'var(--sp-4)', position: 'relative',
                  }}>
                    <span style={{ position: 'absolute', left: 0, color: '#10B981', fontWeight: 700 }}>✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* What's Simplified */}
            <div className="card" style={{ padding: 'var(--sp-5)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', marginBottom: 'var(--sp-4)' }}>
                <Eye size={16} style={{ color: '#F59E0B' }} />
                <span style={{ fontSize: 14, fontWeight: 600, color: '#F59E0B', fontFamily: 'var(--font-display)' }}>Currently Simplified</span>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
                {[
                  'Loan and insurance state is held in-memory. Production will use persistent on-chain or database storage',
                  'Disbursement uses a pre-funded platform wallet. Production will route through escrow contracts',
                  'LLM integration has a timeout fallback. Production will use redundant provider routing',
                  'Some dashboard metrics are illustrative. Production will pull all data from live APIs',
                ].map(item => (
                  <li key={item} style={{
                    fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6,
                    paddingLeft: 'var(--sp-4)', position: 'relative',
                  }}>
                    <span style={{ position: 'absolute', left: 0, color: '#F59E0B', fontWeight: 700 }}>⚠</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </Reveal>
    </div>
  );
};
