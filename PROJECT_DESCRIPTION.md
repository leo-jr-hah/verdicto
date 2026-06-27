# Verdicto

Multi-agent AI valuation and dispute resolution for real world assets on Casper.

Verdicto is a platform where multiple independent AI agents analyze real-world assets, each using their own methodology, then deliberate as a jury to produce a consensus valuation. Every verdict is stored on-chain. Users pay in CSPR through x402 micropayments, no accounts or API keys needed.

Live: [verdicto.xyz](https://verdicto.xyz)
Backend: [verdicto-production.up.railway.app](https://verdicto-production.up.railway.app)

---

## What It Does

Verdicto covers the full lifecycle of a real-world asset on-chain. Six products, one platform.

**Assess** (2.5 CSPR)
Submit an asset like real estate, fine art, or a commodity. Two AI agents independently value it using different methodologies. Three AI jurors deliberate and vote. A consensus verdict is reached and stored on-chain.

**Borrow** (5 CSPR)
Use an assessment as collateral. The system determines Loan-to-Value ratio, disburses real CSPR, and an autonomous keeper monitors collateral health every 30 minutes.

**Insure** (3 CSPR)
Insure an asset against value loss. AI generates a risk score and premium. File claims with automatic AI revaluation and on-chain payout.

**Predict** (1 CSPR)
Ask any yes/no question about future events. Three AI analysts independently research and forecast. Oracle resolves outcomes on-chain.

**Oracle**
Every verdict is stored in an on-chain Oracle contract. Immutable, timestamped, auditable by anyone. Browse verdicts, see agent reasoning, verify receipts.

**Disputes** (5 CSPR)
Anyone can challenge a verdict by staking 5 CSPR. A re-trial is triggered with a different jury and fresh evidence. Autonomous keepers monitor the challenge period.

---

## How It Works

### The Assessment Pipeline

When a user submits an asset and pays 2.5 CSPR, here is what happens:

1. The orchestrator receives the request and dispatches it to two independent analyst agents.

2. Agent A is a Comps Specialist. It pulls comparable sales data, recent transactions, and market signals. Agent B is a Fundamentals Analyst. It runs DCF analysis, evaluates income potential, and pulls macro context from the FRED API.

3. Both agents produce their own estimated value, confidence score, reasoning, and risk factors. The system calculates how far apart the two valuations are (the divergence).

4. Three AI jurors then deliberate. The Evidence Analyst evaluates document quality and proof strength. The Market Data Interpreter examines market trends and pricing signals. The Precedent Researcher looks at historical case outcomes.

5. Each juror votes: Agent A preferred, Split, or Agent B preferred.

6. A consensus verdict is reached. The final value is stored on-chain. An HMAC-signed receipt chain is generated for full auditability.

### Real Market Data Sources

| Asset Type | API | What It Provides |
|------------|-----|-----------------|
| Real Estate | RentCast | Comparable sales, property data, price per sqft |
| Fine Art | Met Museum API | Artist records, auction history, provenance data |
| Commodities | CoinGecko | Live spot prices for gold, silver, platinum |
| Macro Context | FRED (Federal Reserve) | Interest rates, CPI, inflation data |

All APIs are free or have free tiers. No paid API keys required for the demo.

### LLM Fallback Chain

The system works even with zero API keys configured. The fallback chain is: MiMo (primary) then Groq (secondary) then a deterministic heuristic that uses real market data with formula-based calculations. Every fallback is flagged in the UI and receipt.

---

## Architecture

The system has four layers.

**Frontend** is a React 19 + TypeScript + Vite app. It has a landing page with an interactive story explainer, six product views (Assess, Borrow, Insure, Predict, Oracle, Disputes), a real-time WebSocket agent log called "Under the Hood", and Casper Wallet integration for CSPR payments.

**Orchestrator** is an Express + TypeScript server. It handles all API routes: assessment creation, loan creation, insurance creation, dispute filing, and verdict retrieval. Payment-gated endpoints use x402 verification.

**Agent Layer** runs five MCP servers on separate ports. Valuation Agent A (Comps Specialist) on :4001, Valuation Agent B (Fundamentals) on :4002, Evidence Analyst Juror on :4003, Market Data Interpreter Juror on :4004, and Precedent Researcher Juror on :4005.

**Shared Layer** contains the core logic: agent-engine.ts for LLM-powered valuation, juror-engine.ts for jury deliberation and voting, trust-framework.ts for agent reputation scoring, audit-trail.ts for HMAC receipt chains, x402-middleware.ts for on-chain payment verification, casper-contracts.ts for smart contract interactions, data-sources.ts for RentCast/Met Museum/CoinGecko, verifiable-execution.ts for ZK-lite execution proofs, and transaction-log.ts for on-chain transaction recording.

---

## Smart Contracts

Verdicto interacts with three deployed Odra contracts on Casper Testnet.

| Contract | Entry Points | Purpose |
|----------|-------------|---------|
| VotingContract | cast_vote, get_verdict, get_tally | On-chain jury voting for assessments |
| ReputationRegistry | register_agent, get_agent, update_parking_score | Agent reputation and trust tiers |
| VerdictOracle | store_verdict, get_verdict, dispute_verdict | Immutable verdict storage and dispute resolution |

All contract calls use casper-client put-deploy with session deploys, verified via CSPR.cloud API.

---

## x402 Micropayment System

Every product endpoint is gated by cryptographic payment proofs verified on-chain. Here is the flow:

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

Every step of the AI deliberation is recorded in an HMAC-SHA256 signed receipt chain. Each receipt contains:

- inputHash: SHA-256 of the evidence fed to the juror
- outputHash: SHA-256 of the juror's analysis
- reasoningHash: SHA-256 of the reasoning text
- signature: HMAC-SHA256 of all fields using a derived key
- previousReceiptId: chain linking to the previous receipt

The chain is tamper-evident. Modifying any receipt breaks all downstream signatures. The full chain is stored in the database and displayed in the UI.

---

## Trust Scoring Framework

Each agent has a 5-dimension trust score based on the March 2026 IETF Trust Scoring Draft.

| Dimension | Weight | How It's Measured |
|-----------|--------|------------------|
| Identity Verified | Gate | On-chain registration in ReputationRegistry |
| Execution Score | 40% | Challenge-response verification |
| Output Consistency | 30% | Variance across runs with same input |
| Economic Stake | 30% | CSPR staked as collateral |
| Aggregate Score | 0-1000 | Weighted combination |

Tiers: Unverified, Bronze (500+), Silver (750+), Gold (900+), Platinum. Higher-tier agents get more weight in jury deliberation.

---

## Frontend

Tech stack: React 19, TypeScript, Vite, Casper Wallet SDK (window.CasperWalletProvider), WebSocket for real-time agent logs, Tailwind CSS with dark mode.

Key UI features:

- Interactive Story Explainer: landing page walks through the entire flow step by step
- "Under the Hood" Agent Log: terminal-style real-time view of every agent action during assessment
- Multi-Methodology Dashboard: shows all agent valuations side by side with divergence indicators
- Court Verdict Section: final consensus value with on-chain receipt hash
- Transaction Feed: live feed of all on-chain transactions with CSPR.live explorer links

---

## What It Demonstrates

Adversarial AI consensus. Agents are designed to disagree. Agent A trusts market data. Agent B trusts fundamentals. The jury resolves the disagreement.

On-chain verifiability. Every verdict, vote, and payment is on Casper Testnet. Every receipt is cryptographically signed.

x402 machine-to-machine payments. Real micropayments verified on-chain, no accounts or API keys.

Graceful degradation. Works with zero API keys. LLM fallback chain: MiMo, then Groq, then deterministic heuristic.

Full RWA lifecycle. Not just valuation. Borrow, insure, predict, and dispute resolution on the same platform.

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

## Screenshots

Below are the screenshots to capture. Paste them in order.

### 1. Landing Page Hero

[PASTE SCREENSHOT: The full hero section of verdicto.xyz with the title, tagline, and CTA button]

This is the first thing judges see. Shows the brand and positioning.

### 2. Interactive Story Explainer

[PASTE SCREENSHOT: The step-by-step explainer section on the landing page, showing the flow with icons and progression]

Shows the product is thoughtfully designed, not just a tech demo.

### 3. Assessment Page, Asset Selection

[PASTE SCREENSHOT: The /assess page showing the demo assets grid (Manhattan Condo, Basquiat Painting, etc.) with the Pay and Assess button visible]

Shows the product surface. Multiple asset classes supported.

### 4. Assessment Running, "Under the Hood" Agent Log

[PASTE SCREENSHOT: The terminal-style real-time log showing agents working. Look for lines like "Agent A analyzing...", "Juror 1 deliberating...", "Consensus reached"]

This is the hero screenshot. Shows the multi-agent system in action, which is the core differentiator.

### 5. Assessment Results, Verdict Card

[PASTE SCREENSHOT: The final verdict card with consensus value, confidence score, risk flags, and the View on CSPR.live link]

Shows the end result and on-chain proof.

### 6. Oracle Verdicts Dashboard

[PASTE SCREENSHOT: The /oracle page showing the list of on-chain verdicts with timestamps, values, and explorer links]

Shows the system is running and producing real on-chain data.

### 7. Borrow or Insure Product

[PASTE SCREENSHOT: Either the /borrow or /insure page showing the wizard UI, collateral selection step, or insurance policy creation]

Shows Verdicto is more than just valuation. Full RWA lifecycle.

### 8. Wallet Connection or Payment Modal

[PASTE SCREENSHOT: Either the Casper Wallet connect popup or the payment modal showing the CSPR amount and Sign button]

Shows real blockchain integration, not mock.

### 9. Disputes Page

[PASTE SCREENSHOT: The /disputes page showing the dispute filing interface or a list of active disputes with stake amounts]

Shows the adversarial and justice angle. Anyone can challenge a verdict.

### 10. Transaction History

[PASTE SCREENSHOT: The transaction feed showing on-chain transactions with deploy hashes and CSPR.live links]

Proves everything is on-chain and auditable.

---

## Repository

https://github.com/leo-jr-hah/casper-rwa-court
