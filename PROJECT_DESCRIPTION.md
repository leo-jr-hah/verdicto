# Verdicto — Multi-Agent AI Valuation & Dispute Resolution for Real World Assets on Casper

Verdicto is an autonomous multi-agent system that values real-world assets, lends against them, insures them, and resolves disputes — all on the Casper blockchain. Multiple independent AI agents analyze each asset using different methodologies, deliberate as a jury, and produce a consensus valuation recorded on-chain. Payments are settled in CSPR via x402 micropayments with no accounts or API keys.

**Live:** [verdicto.xyz](https://verdicto.xyz) · **Backend:** [verdicto-production.up.railway.app](https://verdicto-production.up.railway.app)

---

## What It Does

Verdicto covers the full lifecycle of a real-world asset on-chain:

1. **Assess** — Submit an asset (real estate, fine art, commodity). Two AI agents independently value it using different methodologies (comparable sales vs. DCF/fundamentals). Three AI jurors deliberate and vote. A consensus verdict is reached and stored on-chain. Fee: 2.5 CSPR.

2. **Borrow** — Use an assessment as collateral. The system determines Loan-to-Value ratio, disburses real CSPR, and an autonomous keeper monitors collateral health every 30 minutes. Fee: 5 CSPR.

3. **Insure** — Insure an asset against value loss. AI generates a risk score and premium. File claims with automatic AI revaluation and on-chain payout. Fee: 3 CSPR.

4. **Predict** — Ask any yes/no question about future events. Three AI analysts independently research and forecast. Oracle resolves outcomes on-chain. Fee: 1 CSPR.

5. **Oracle** — Every verdict is stored in an on-chain Oracle contract. Immutable, timestamped, auditable by anyone. Browse verdicts, see agent reasoning, verify receipts.

6. **Disputes** — Anyone can challenge a verdict by staking 5 CSPR. A re-trial is triggered with a different jury and fresh evidence. Autonomous keepers monitor the challenge period.

---

## How It Works

### The Assessment Pipeline

```
User submits asset + pays 2.5 CSPR
        ↓
Orchestrator dispatches to 2 independent analyst agents
        ↓
Agent A (Comps Specialist)          Agent B (Fundamentals Analyst)
- Comparable sales data             - DCF / intrinsic value
- Recent transactions               - Income potential
- Market signals                    - Macro context (FRED API)
        ↓                           ↓
Both agents produce: estimated_value, confidence, reasoning, risk_factors
        ↓
Divergence calculated (how far apart the two valuations are)
        ↓
3 AI Jurors deliberate:
  - Evidence Analyst: document quality, proof strength
  - Market Data Interpreter: market trends, pricing signals
  - Precedent Researcher: historical case outcomes
        ↓
Each juror votes: Agent A preferred / Split / Agent B preferred
        ↓
Consensus verdict → final value stored on-chain
        ↓
HMAC-signed receipt chain generated for full auditability
```

### Real Market Data Sources

| Asset Type | API | What It Provides |
|------------|-----|-----------------|
| Real Estate | RentCast | Comparable sales, property data, price per sqft |
| Fine Art | Met Museum API | Artist records, auction history, provenance data |
| Commodities | CoinGecko | Live spot prices for gold, silver, platinum |
| Macro Context | FRED (Federal Reserve) | Interest rates, CPI, inflation data |

All APIs are free or have free tiers. No paid API keys required for the demo.

### LLM Fallback Chain

```
MiMo (primary) → Groq (secondary) → Deterministic heuristic (offline)
```

The system works even with zero API keys configured. If no LLM is available, agents fall back to formula-based calculations using real market data. Every fallback is flagged in the UI and receipt.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Dashboard (React + TypeScript + Vite)                      │
│  ├── Landing page with interactive story                    │
│  ├── 6 product views: Assess, Borrow, Insure, Predict,      │
│  │   Oracle, Disputes                                       │
│  ├── Real-time WebSocket agent log ("Under the Hood")       │
│  └── Casper Wallet integration (CSPR payments)              │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP + WebSocket
┌──────────────────────▼──────────────────────────────────────┐
│  Orchestrator (Express + TypeScript)                        │
│  ├── POST /api/assessments/start                            │
│  ├── POST /api/loans/create          (x402 gated)          │
│  ├── POST /api/insurance/create      (x402 gated)          │
│  ├── POST /api/oracle/dispute        (x402 gated)          │
│  └── GET  /api/oracle/verdicts                              │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│  Agent Layer (MCP Servers)                                  │
│  ├── Valuation Agent A (Comps Specialist)    :4001          │
│  ├── Valuation Agent B (Fundamentals)        :4002          │
│  ├── Evidence Analyst Juror                  :4003          │
│  ├── Market Data Interpreter Juror           :4004          │
│  └── Precedent Researcher Juror              :4005          │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│  Shared Layer                                               │
│  ├── agent-engine.ts    — LLM-powered valuation logic       │
│  ├── juror-engine.ts    — Jury deliberation + voting         │
│  ├── trust-framework.ts — Agent reputation scoring           │
│  ├── audit-trail.ts     — HMAC receipt chain                 │
│  ├── x402-middleware.ts — On-chain payment verification      │
│  ├── casper-contracts.ts — Smart contract interactions       │
│  ├── data-sources.ts    — RentCast, Met Museum, CoinGecko   │
│  ├── verifiable-execution.ts — ZK-lite execution proofs      │
│  └── transaction-log.ts — On-chain transaction recording     │
└─────────────────────────────────────────────────────────────┘
```

---

## Smart Contracts

Verdicto interacts with three deployed Odra contracts on Casper Testnet:

| Contract | Entry Points | Purpose |
|----------|-------------|---------|
| **VotingContract** | `cast_vote`, `get_verdict`, `get_tally` | On-chain jury voting for assessments |
| **ReputationRegistry** | `register_agent`, `get_agent`, `update_parking_score` | Agent reputation and trust tiers |
| **VerdictOracle** | `store_verdict`, `get_verdict`, `dispute_verdict` | Immutable verdict storage + dispute resolution |

All contract calls use `casper-client put-deploy` with session deploys, verified via CSPR.cloud API.

---

## x402 Micropayment System

Every product endpoint is gated by cryptographic payment proofs verified on-chain:

1. User approves CSPR payment in Casper Wallet
2. Wallet creates a native transfer deploy on Casper Testnet
3. Frontend sends the deploy hash as a payment proof header
4. Backend verifies the deploy exists on-chain via CSPR.cloud API
5. Backend checks the amount matches the required fee
6. Only then does the request proceed

No API keys. No accounts. No subscriptions. Payment is authentication.

**Fee schedule:**

| Product | Fee |
|---------|-----|
| Assess | 2.5 CSPR |
| Predict | 1 CSPR |
| Insure | 3 CSPR |
| Borrow | 5 CSPR |
| Dispute | 5 CSPR |

---

## Cryptographic Receipt Chain

Every step of the AI deliberation is recorded in an HMAC-SHA256 signed receipt chain:

```
Receipt 0 (genesis) → Receipt 1 → Receipt 2 → ... → Receipt N
     ↓                    ↓            ↓                ↓
  HMAC(sig, data)    HMAC(sig, data)  HMAC(sig, data)  HMAC(sig, data)
```

Each receipt contains:
- `inputHash` — SHA-256 of the evidence fed to the juror
- `outputHash` — SHA-256 of the juror's analysis
- `reasoningHash` — SHA-256 of the reasoning text
- `signature` — HMAC-SHA256 of all fields using a derived key
- `previousReceiptId` — Chain linking to the previous receipt

The chain is tamper-evident: modifying any receipt breaks all downstream signatures. The full chain is stored in the database and displayed in the UI.

---

## Trust Scoring Framework

Each agent has a 5-dimension trust score based on the March 2026 IETF Trust Scoring Draft:

| Dimension | Weight | How It's Measured |
|-----------|--------|------------------|
| Identity Verified | Gate | On-chain registration in ReputationRegistry |
| Execution Score | 40% | Challenge-response verification |
| Output Consistency | 30% | Variance across runs with same input |
| Economic Stake | 30% | CSPR staked as collateral |
| Aggregate Score | 0-1000 | Weighted combination |

**Tiers:** Unverified → Bronze (500+) → Silver (750+) → Gold (900+) → Platinum

Higher-tier agents get more weight in jury deliberation.

---

## Frontend

### Tech Stack
- React 19 + TypeScript + Vite
- Casper Wallet SDK (window.CasperWalletProvider)
- WebSocket for real-time agent logs
- Tailwind CSS, dark mode

### Key UI Features
- **Interactive Story Explainer** — Landing page walks through the entire flow step by step
- **"Under the Hood" Agent Log** — Terminal-style real-time view of every agent action during assessment
- **Multi-Methodology Dashboard** — Shows all agent valuations side by side with divergence indicators
- **Court Verdict Section** — Final consensus value with on-chain receipt hash
- **Transaction Feed** — Live feed of all on-chain transactions with CSPR.live explorer links

---

## What It Demonstrates

- **Adversarial AI consensus** — Agents are designed to disagree. Agent A trusts market data; Agent B trusts fundamentals. The jury resolves the disagreement.
- **On-chain verifiability** — Every verdict, vote, and payment is on Casper Testnet. Every receipt is cryptographically signed.
- **x402 machine-to-machine payments** — Real micropayments verified on-chain, no accounts or API keys.
- **Graceful degradation** — Works with zero API keys. LLM fallback chain: MiMo → Groq → deterministic heuristic.
- **Full RWA lifecycle** — Not just valuation: borrow, insure, predict, and dispute resolution on the same platform.

---

## Casper Testnet Proof

All verdicts are stored on-chain via the VerdictOracle contract. The deployer account is registered in the ReputationRegistry. Transaction hashes are displayed in the UI with links to CSPR.live.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS |
| Backend | Express, TypeScript, Node.js 20+ |
| AI Agents | MiMo (primary LLM), Groq (fallback), deterministic heuristic |
| Agent Protocol | Model Context Protocol (MCP) SDK |
| Blockchain | Casper Testnet, casper-js-sdk, casper-client CLI |
| Data APIs | RentCast, Met Museum, CoinGecko, FRED |
| Payments | x402 micropayment verification via CSPR.cloud |
| Database | SQLite (better-sqlite3) |
| Signing | HMAC-SHA256 receipt chains, ECDSA on Casper |
| Smart Contracts | Odra (Rust), VotingContract, ReputationRegistry, VerdictOracle |
| Hosting | Railway (backend), Vercel (frontend) |

---

## Repository

https://github.com/leo-jr-hah/casper-rwa-court
