# Verdicto

Multi-agent AI valuation and dispute resolution for real world assets on Casper.

Verdicto is a platform where multiple independent AI agents analyze real-world assets, each using their own methodology, then deliberate as a jury to produce a consensus valuation. Every verdict is stored on-chain. Users pay in CSPR through x402 micropayments, no accounts or API keys needed.

Live: [verdicto.xyz](https://verdicto.xyz)
Backend: [verdicto-production.up.railway.app](https://verdicto-production.up.railway.app)

---

## What It Does

Verdicto covers the full lifecycle of a real-world asset on-chain.

**Assess** (2.5 CSPR)
Submit an asset like real estate, fine art, or a commodity. Independent AI agents value it using different methodologies. A jury of AI jurors deliberates and votes. A consensus verdict is reached and stored on-chain.

**Borrow** (5 CSPR)
Use an assessment as collateral. The system determines Loan-to-Value ratio, disburses real CSPR, and an autonomous keeper monitors collateral health continuously.

**Insure** (3 CSPR)
Insure an asset against value loss. AI generates a risk score and premium. File claims with automatic AI revaluation and on-chain payout.

**Predict** (1 CSPR)
Ask any yes/no question about future events. Independent AI analysts research and forecast. Oracle resolves outcomes on-chain.

**Oracle**
Every verdict is stored in an on-chain Oracle contract. Immutable, timestamped, auditable by anyone. Browse verdicts, see agent reasoning, verify receipts.

**Disputes** (5 CSPR)
Anyone can challenge a verdict by staking CSPR. A re-trial is triggered with a fresh jury and new evidence. Autonomous keepers monitor the challenge period.

---

## How It Works

### The Assessment Pipeline

When a user submits an asset and pays the assessment fee, here is what happens:

1. The orchestrator receives the request and dispatches it to independent analyst agents in parallel.

2. Each agent specializes in a different valuation methodology. One focuses on comparable sales and market data. Another runs discounted cash flow analysis and evaluates fundamentals. Each agent pulls from real market data APIs independently.

3. Every agent produces its own estimated value, confidence score, reasoning, and risk factors. The system calculates how far apart the valuations are.

4. A jury of AI jurors then deliberates. Each juror has a different specialty: one evaluates evidence quality and proof strength, another examines market trends and pricing signals, another researches historical case outcomes.

5. Each juror votes on which analysis they find most convincing.

6. A consensus verdict is reached. The final value is stored on-chain. A cryptographic receipt chain is generated for full auditability.

### Real Market Data Sources

| Asset Type | API | What It Provides |
|------------|-----|-----------------|
| Real Estate | RentCast | Comparable sales, property data, price per sqft |
| Fine Art | Met Museum API | Artist records, auction history, provenance data |
| Commodities | CoinGecko | Live spot prices for gold, silver, platinum |
| Macro Context | FRED (Federal Reserve) | Interest rates, CPI, inflation data |

All APIs are free or have free tiers. No paid API keys required for the demo.

### Graceful Degradation

The system works even with zero API keys configured. When no LLM provider is available, agents fall back to formula-based calculations using real market data. Every fallback is flagged in the UI and receipt so users always know what they are getting.

---

## Architecture

The system is built in four layers.

**Frontend** is a React app with TypeScript. It has a landing page with an interactive story explainer, six product views, a real-time WebSocket agent log called "Under the Hood", and Casper Wallet integration for CSPR payments.

**Orchestrator** is an Express server. It handles all API routes: assessment creation, loan creation, insurance creation, dispute filing, and verdict retrieval. Payment-gated endpoints use x402 verification.

**Agent Layer** runs independent AI agents as separate services. Each agent specializes in either valuation or jury deliberation. Agents communicate with the orchestrator over HTTP and produce structured, machine-readable outputs.

**Shared Layer** contains the core platform logic: agent orchestration, jury deliberation and voting, agent reputation scoring, cryptographic receipt chains, on-chain payment verification, smart contract interactions, market data aggregation, verifiable execution proofs, and transaction logging.

---

## Smart Contracts

Verdicto uses three deployed smart contracts on Casper Testnet.

| Contract | Purpose |
|----------|---------|
| VotingContract | On-chain jury voting for assessments |
| ReputationRegistry | Agent reputation and trust tiers |
| VerdictOracle | Immutable verdict storage and dispute resolution |

All contract calls are verified via CSPR.cloud API.

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

Every step of the AI deliberation is recorded in a signed receipt chain. Each receipt contains:

- A hash of the evidence fed to the juror
- A hash of the juror's analysis
- A hash of the reasoning text
- A cryptographic signature over all fields
- A reference to the previous receipt in the chain

The chain is tamper-evident. Modifying any receipt breaks all downstream signatures. The full chain is stored in the database and displayed in the UI.

---

## Trust Scoring Framework

Each agent has a multi-dimension trust score. Dimensions include identity verification, execution accuracy, output consistency, and economic stake. Agents are assigned tiers from Unverified up to Platinum. Higher-tier agents get more weight in jury deliberation.

---

## Frontend

Built with React, TypeScript, Vite, Tailwind CSS, and Casper Wallet SDK. Dark mode by default.

Key UI features:

- Interactive Story Explainer: landing page walks through the entire flow step by step
- "Under the Hood" Agent Log: terminal-style real-time view of every agent action during assessment
- Multi-Methodology Dashboard: shows all agent valuations side by side with divergence indicators
- Court Verdict Section: final consensus value with on-chain receipt hash
- Transaction Feed: live feed of all on-chain transactions with CSPR.live explorer links

---

## What It Demonstrates

Adversarial AI consensus. Agents are designed to disagree. One trusts market data. Another trusts fundamentals. The jury resolves the disagreement.

On-chain verifiability. Every verdict, vote, and payment is on Casper Testnet. Every receipt is cryptographically signed.

x402 machine-to-machine payments. Real micropayments verified on-chain, no accounts or API keys.

Graceful degradation. Works with zero API keys. When no LLM is available, the system falls back to deterministic calculations using real market data.

Full RWA lifecycle. Not just valuation. Borrow, insure, predict, and dispute resolution on the same platform.

---

## Casper Testnet Proof

All verdicts are stored on-chain via the VerdictOracle contract. The deployer account is registered in the ReputationRegistry. Transaction hashes are displayed in the UI with links to CSPR.live.

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
| Payments | x402 micropayment verification via CSPR.cloud |
| Database | SQLite |
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

[PASTE SCREENSHOT: The /assess page showing the demo assets grid with the Pay and Assess button visible]

Shows the product surface. Multiple asset classes supported.

### 4. Assessment Running, "Under the Hood" Agent Log

[PASTE SCREENSHOT: The terminal-style real-time log showing agents working. Look for lines showing analysis, deliberation, and consensus]

This is the hero screenshot. Shows the multi-agent system in action, which is the core differentiator.

### 5. Assessment Results, Verdict Card

[PASTE SCREENSHOT: The final verdict card with consensus value, confidence score, risk flags, and the View on CSPR.live link]

Shows the end result and on-chain proof.

### 6. Oracle Verdicts Dashboard

[PASTE SCREENSHOT: The /oracle page showing the list of on-chain verdicts with timestamps, values, and explorer links]

Shows the system is running and producing real on-chain data.

### 7. Borrow or Insure Product

[PASTE SCREENSHOT: Either the /borrow or /insure page showing the wizard UI]

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
