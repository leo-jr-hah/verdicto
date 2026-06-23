# Casper RWA Court ⚖️

**An autonomous, multi-agent AI system that assesses, borrows against, insures, and resolves disputes for Real World Assets on the Casper blockchain.** Users pay in CSPR; independent AI agents analyze real market data, deliberate, and produce verdicts — with every execution step cryptographically receipted and every payment settled on-chain.

---

## Quick Start

### Prerequisites

- **Node.js** ≥ 20
- **Rust + cargo-odra** (for smart contracts only — not needed to run the demo)
- **Casper Wallet** Chrome extension ([install](https://chromewebstore.google.com/detail/casper-wallet/abkahkcbhngaebpcgfmhkoioedceoigp?hl=en))
- **Testnet CSPR** — get free tokens from the [Casper Testnet Faucet](https://testnet.cspr.live/tools/faucet)

### 1. Clone & Install

```bash
git clone https://github.com/<your-org>/casper-rwa-court.git
cd casper-rwa-court

# Install frontend dependencies
cd dashboard && npm install

# Install backend dependencies
cd ../agents && npm install
```

### 2. Configure Environment

```bash
# From the repo root — create your .env from the template
cp .env.example .env
```

Edit `.env` and fill in at minimum:

| Variable | What it does | Example |
|----------|-------------|---------|
| `CASPER_RPC_URL` | Casper testnet RPC endpoint | `https://node.testnet.casper.network:7777/rpc` |
| `DEPLOYER_PRIVATE_KEY` | Absolute path to your deployer `.pem` file | `/Users/you/.casper/keys/deployer.pem` |
| `DEPLOYER_PUBLIC_KEY` | Hex public key of the deployer account | `01abcdef...` |
| `ADMIN_SECRET` | Password for admin endpoints (force-revalue, loan list) | `your-admin-secret-here` |
| `VITE_ORCHESTRATOR_URL` | Where the backend runs (dashboard reads this) | `http://localhost:3000` |
| `VITE_WS_URL` | WebSocket URL for live updates | `ws://localhost:3010` |

> **Note:** The `.env.example` file documents every variable with comments. Most have sensible defaults for local development. You do NOT need API keys for the AI agents — they use a built-in fallback when no LLM key is configured.

### 3. Run the Backend

```bash
cd agents
npm run dev
# Starts orchestrator on :3000, WebSocket on :3011
```

### 4. Run the Frontend

```bash
# In a separate terminal
cd dashboard
npm run dev
# Starts Vite dev server on http://localhost:5173
```

### 5. Run the Demo Flow

1. Open `http://localhost:5173` — the landing page loads
2. Click **Connect Wallet** in the sidebar → approve in Casper Wallet extension
3. Navigate to **Assess** → select a demo asset (e.g., Manhattan Condo)
4. Click **Pay & Assess** → approve the 2.5 CSPR payment in your wallet
5. Watch 3 AI agents analyze the asset in real time via WebSocket
6. See the consensus valuation, risk flags, and methodology breakdown
7. Navigate to **Borrow** or **Insure** to use the assessment as collateral

### 6. Run Tests

```bash
cd agents
npm test
# 27/27 tests passing — covers HMAC chain, trust scoring, agent orchestration
```

---

## What This System Does

### Four Products, One Platform

| Product | Fee | What happens |
|---------|-----|-------------|
| **Assess** | 2.5 CSPR | 3 AI agents independently value an asset using different methodologies (Comparable Sales, DCF, Income Approach). Results are reconciled into a consensus valuation with risk flags. |
| **Borrow** | 5 CSPR | Use an assessment as collateral. AI determines Loan-to-Value ratio, CSPR is disbursed from an on-chain escrow, and an autonomous keeper monitors collateral health every 30 minutes. |
| **Insure** | 3 CSPR | Insure an asset against value loss. AI generates a risk score and premium. File claims with automatic AI revaluation and on-chain payout. |
| **Predict** | 1 CSPR | Ask any yes/no question about future events. 5 agents independently estimate probability, weighted by reputation. |

### What Makes It Autonomous

This isn't a frontend that calls an API. The system runs **unattended**:

- **Borrow Keeper** — checks collateral ratios every 30 minutes, triggers margin calls when LTV exceeds thresholds, liquidates when critical. Runs on a `setInterval` loop, no human in the loop.
- **Insurance Monitor** — tracks policy expiration, triggers claim reviews, processes payouts. Autonomous lifecycle management.
- **Agent Self-Selection** — AI agents autonomously choose their valuation methodology based on data availability (not hardcoded). If comparable sales data is thin, the agent falls back to DCF.
- **Reputation Updates** — after real market events, agents gain or lose reputation based on how close their predictions were to reality. This is retroactive, not consensus-based.

### What's On-Chain vs. Off-Chain

| Layer | What's there | Why |
|-------|-------------|-----|
| **On-chain (Casper Testnet)** | Payment verification (x402), reputation scores, voting records, escrow locks | These need cryptographic guarantees and economic finality |
| **Off-chain (this repo)** | AI agent logic, collateral tracking, loan state, insurance policies | These need sub-second response times and complex computation |

> **Honest scoping note:** Collateral tracking and loan state are currently managed off-chain in the orchestrator's in-memory store. In production, these would move to on-chain smart contracts or a persistent database. The AI agent layer, payment protocol, and autonomous keepers are fully functional as-is. We chose to ship working autonomous behavior over a half-built on-chain loan contract.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   React Dashboard                    │
│  (Vite + Tailwind + Casper Wallet SDK)              │
│  Landing · Assess · Borrow · Insure · Predict       │
└──────────────┬──────────────────────┬───────────────┘
               │ HTTP                │ WebSocket
               ▼                     ▼
┌─────────────────────────────────────────────────────┐
│                  Orchestrator (:3000)                │
│  Assessment · Loans · Insurance · Predictions       │
│  Autonomous Keepers (borrow + insurance monitors)   │
│  HMAC Receipt Chain · Trust Scoring                 │
└────────┬──────────┬──────────┬──────────────────────┘
         │ x402     │ x402     │ x402
         ▼          ▼          ▼
┌────────────┐ ┌────────────┐ ┌────────────┐
│  Agent A   │ │  Agent B   │ │  Agent C   │
│  :3001     │ │  :3002     │ │  :3003     │
│ Comparable │ │    DCF     │ │  Income    │
│   Sales    │ │  Method    │ │  Approach  │
└────────────┘ └────────────┘ └────────────┘
         │          │          │
         ▼          ▼          ▼
┌─────────────────────────────────────────────────────┐
│              Casper Testnet (On-Chain)               │
│  VotingContract · EscrowContract · ReputationRegistry│
│  x402 Payment Verification · CSPR Transfers         │
└─────────────────────────────────────────────────────┘
```

---

## Environment Variables

See [`.env.example`](.env.example) for the full list with descriptions. Key groups:

| Group | Variables | Required for |
|-------|-----------|-------------|
| **Casper RPC** | `CASPER_RPC_URL`, `CASPER_CHAIN_NAME` | All blockchain interactions |
| **Keys** | `DEPLOYER_PRIVATE_KEY`, `DEPLOYER_PUBLIC_KEY` | Signing deploys, x402 payments |
| **Contracts** | `REPUTATION_CONTRACT_HASH`, `VOTING_CONTRACT_HASH`, etc. | On-chain reads (optional for demo) |
| **Admin** | `ADMIN_SECRET` | Admin endpoints (force-revalue, loan list) |
| **Dashboard** | `VITE_ORCHESTRATOR_URL`, `VITE_WS_URL` | Frontend → backend connection |
| **Payments** | `X402_REQUIRE_PAYMENT`, `X402_RECIPIENT_ADDRESS` | x402 micropayment enforcement |

---

## Smart Contracts (Deployed on Casper Testnet)

| Contract | Deploy Hash | Purpose |
|----------|-------------|---------|
| VotingContract | [`f00cbb8f...`](https://testnet.cspr.live/deploy/f00cbb8f03e468c0750e7ce78bfc7f8a5c337fd520ebc218e969833bdea0fcfb) | Records AI verdicts with reputation-weighted voting |
| EscrowContract | [`83bf2bab...`](https://testnet.cspr.live/deploy/83bf2bab33200e60b092847abc38ea5d0301327fae43fc2d3555fec5be120d3a) | Locks CSPR during dispute resolution |
| ReputationRegistry | [`30da84e6...`](https://testnet.cspr.live/deploy/30da84e6d0db566b5d8ba4a93cc392bd2268bff6c24c1c0e5cb16a4f51038942) | Agent identity + reputation scores |

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/assessments/start` | — | Start a new AI assessment |
| `POST` | `/api/assessments/:id/submit` | — | Submit asset data for analysis |
| `POST` | `/api/loans/create` | x402 (5 CSPR) | Create a loan against assessed collateral |
| `GET` | `/api/loans` | — | List loans (filter by borrower) |
| `GET` | `/api/loans/:id` | — | Get loan details |
| `POST` | `/api/loans/:id/repay` | — | Repay a loan |
| `POST` | `/api/loans/:id/revalue` | — | Trigger collateral revaluation |
| `POST` | `/api/insurance/create` | x402 (3 CSPR) | Create insurance policy |
| `GET` | `/api/insurance` | — | List policies (filter by owner) |
| `GET` | `/api/insurance/:id` | — | Get policy details |
| `POST` | `/api/insurance/:id/claim` | — | File claim (AI revaluation + payout) |
| `GET` | `/api/transactions` | — | Transaction history |
| `GET` | `/api/demos` | — | Demo assets for assessment |
| `POST` | `/api/admin/force-revalue/:id` | `x-admin-secret` | Force immediate revaluation (admin) |
| `GET` | `/api/admin/loans` | `x-admin-secret` | List all loans with state (admin) |

---

## Project Structure

```
casper-rwa-court/
├── contracts/              # Odra smart contracts (Rust)
│   ├── reputation/         # ReputationRegistry
│   ├── escrow/             # EscrowContract
│   └── voting/             # VotingContract
├── agents/                 # Backend services (TypeScript)
│   ├── orchestrator/       # Main API server + autonomous keepers
│   └── src/
│       ├── analyst.ts      # AI analyst agent logic
│       ├── hmac-chain.ts   # Cryptographic receipt chain
│       ├── trust-scoring.ts# Reputation + tier system
│       └── x402-middleware.ts # x402 payment verification
├── dashboard/              # React 19 frontend (Vite)
│   └── src/
│       ├── pages/          # AssessView, BorrowView, InsureView, PredictView
│       ├── contexts/       # CSPRClickContext (wallet + payment signing)
│       ├── hooks/          # useLoan, useInsurance (state management)
│       └── services/       # api.ts (all API types + fetch functions)
├── .env.example            # Environment variable template
├── ARCHITECTURE.md         # Detailed architecture document
└── README.md               # This file
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, Tailwind CSS v3, GSAP, motion |
| Backend | Node.js 20, TypeScript, MCP SDK v1.16 |
| Blockchain | Casper Testnet, casper-js-sdk v5, Odra 2.8.1 (Rust) |
| Payments | x402 HTTP Micropayment Standard (real on-chain signing) |
| Wallet | Casper Wallet Chrome Extension (`window.CasperWalletProvider`) |
| Testing | Vitest (27/27 passing) |

---

## License

MIT
