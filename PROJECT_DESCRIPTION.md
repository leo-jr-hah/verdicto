# Verdicto

Multi-agent AI valuation and dispute resolution for real-world assets on Casper.

Verdicto is a platform where multiple independent AI agents analyze real-world assets, each using their own methodology, then deliberate as a jury to produce a consensus verdict. Users pay in CSPR through x402 micropayments — no accounts or API keys needed.

Live: [verdicto.xyz](https://verdicto.xyz)

---

## What It Does

**Assess** (2.5 CSPR)
Submit an asset like real estate, fine art, or a commodity. Independent AI agents value it using different methodologies. A jury deliberates and votes. Consensus verdict stored on-chain.

**Borrow** (5 CSPR)
Use an assessment as collateral. The system determines LTV, disburses real CSPR, and monitors collateral health continuously.

**Insure** (3 CSPR)
Insure an asset against value loss. AI generates a risk score and premium. File claims with automatic revaluation and on-chain payout.

**Predict** (1 CSPR)
Ask any yes/no question about future events. Independent AI analysts research and forecast. Oracle resolves outcomes on-chain.

**Oracle**
Browse verdicts, see agent reasoning, verify receipts. Everything is on Casper Testnet.

**Disputes** (5 CSPR)
Challenge any verdict by staking CSPR. Re-trial with a fresh jury and new evidence.

---

## How It Works

### The Assessment Pipeline

1. The orchestrator dispatches the asset to independent analyst agents in parallel.
2. Each agent specializes in a different methodology — comparable sales, discounted cash flow, market signals — and pulls from real data APIs independently.
3. Every agent produces its own estimated value, confidence score, and reasoning.
4. A jury deliberates. Each juror has a different specialty: evidence quality, market trends, historical precedent.
5. Each juror votes on which analysis they find most convincing.
6. Consensus verdict is reached and stored on-chain with a signed receipt chain.

### Data Sources

| Asset Type | API | What It Provides |
|------------|-----|-----------------|
| Real Estate | RentCast | Comparable sales, property data, price per sqft |
| Fine Art | Met Museum API | Artist records, auction history, provenance |
| Commodities | CoinGecko | Live spot prices for gold, silver, platinum |
| Macro Context | FRED (Federal Reserve) | Interest rates, CPI, inflation data |

All APIs are free or have free tiers. No paid keys required.

### Graceful Degradation

Works with zero API keys. When no LLM provider is available, agents fall back to formula-based calculations using real market data. Every fallback is flagged in the UI.

---

## Architecture

Four layers.

**Frontend** — React + TypeScript. Landing page with interactive story explainer, six product views, real-time WebSocket agent log, Casper Wallet integration.

**Orchestrator** — Express server handling all API routes. Payment-gated endpoints use x402 verification.

**Agent Layer** — Independent AI agents running as separate services. Each specializes in valuation or jury deliberation.

**Shared Layer** — Core platform logic: agent orchestration, jury voting, reputation scoring, receipt chains, payment verification, smart contract interactions, market data aggregation, transaction logging.

---

## Smart Contracts

| Contract | Purpose |
|----------|---------|
| VotingContract | Jury voting for assessments |
| ReputationRegistry | Agent reputation and trust tiers |
| VerdictOracle | Verdict storage and dispute resolution |

---

## x402 Micropayment System

Every endpoint is gated by on-chain payment proofs. Flow:

1. User approves CSPR payment in Casper Wallet
2. Wallet creates a native transfer deploy on Casper Testnet
3. Frontend sends the deploy hash as a payment proof header
4. Backend verifies the deploy on-chain via CSPR.cloud API
5. Backend checks the amount matches the required fee
6. Request proceeds

No API keys. No accounts. No subscriptions. Payment is authentication.

| Product | Fee |
|---------|-----|
| Assess | 2.5 CSPR |
| Predict | 1 CSPR |
| Insure | 3 CSPR |
| Borrow | 5 CSPR |
| Dispute | 5 CSPR |

---

## Receipt Chain

Every step of the AI deliberation is recorded in a signed receipt chain. Each receipt hashes the evidence, analysis, and reasoning, then signs over all fields with a reference to the previous receipt. Modifying any receipt breaks the chain.

---

## Trust Scoring

Each agent has a multi-dimension trust score covering identity verification, execution accuracy, output consistency, and economic stake. Agents are assigned tiers from Unverified to Platinum. Higher-tier agents get more weight in deliberation.

---

## What It Demonstrates

Adversarial AI consensus — agents are designed to disagree, and the jury resolves it.

Real x402 micropayments — no accounts, no API keys, just on-chain payment proofs.

Full RWA lifecycle — valuation, borrowing, insurance, prediction, and dispute resolution on one platform.

Graceful degradation — works with zero API keys, falls back to deterministic calculations.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, TypeScript, Vite, Tailwind CSS |
| Backend | Express, TypeScript, Node.js |
| AI Agents | LLM-powered with deterministic fallback |
| Agent Protocol | Model Context Protocol (MCP) |
| Blockchain | Casper Testnet, casper-js-sdk |
| Data APIs | RentCast, Met Museum, CoinGecko, FRED |
| Payments | x402 via CSPR.cloud |
| Database | Supabase (persistent) + JSON file fallback |
| Smart Contracts | Odra (Rust) |
| Hosting | Railway (backend), Vercel (frontend) |

---

## Screenshots

### 1. Landing Page Hero

[PASTE SCREENSHOT: Full hero section of verdicto.xyz with title, tagline, and CTA button]

### 2. Interactive Story Explainer

[PASTE SCREENSHOT: Step-by-step explainer on the landing page with icons and progression]

### 3. Assessment Page, Asset Selection

[PASTE SCREENSHOT: /assess page showing demo assets grid with Pay and Assess button]

### 4. "Under the Hood" Agent Log

[PASTE SCREENSHOT: Terminal-style real-time log showing agents analyzing, deliberating, reaching consensus]

### 5. Assessment Results

[PASTE SCREENSHOT: Final verdict card with consensus value, confidence score, and CSPR.live link]

### 6. Oracle Dashboard

[PASTE SCREENSHOT: /oracle page showing on-chain verdicts with timestamps and explorer links]

### 7. Borrow or Insure

[PASTE SCREENSHOT: /borrow or /insure wizard UI]

### 8. Wallet and Payment

[PASTE SCREENSHOT: Casper Wallet connect or payment modal with CSPR amount and Sign button]

### 9. Disputes

[PASTE SCREENSHOT: /disputes page with dispute filing or active disputes list]

### 10. Transaction Feed

[PASTE SCREENSHOT: Transaction history with deploy hashes and CSPR.live links]

---

## Repository

https://github.com/leo-jr-hah/casper-rwa-court
