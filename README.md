# Verdicto ⚖️

**An autonomous, multi-agent AI system that assesses, borrows against, insures, predicts, and resolves disputes for Real World Assets on the Casper blockchain.** Users pay in CSPR; independent AI agents analyze real market data, deliberate, and produce verdicts — with every execution step cryptographically receipted and every payment settled on-chain.

**Live:** [verdicto.xyz](https://verdicto.xyz) · **Backend:** [verdicto-production.up.railway.app](https://verdicto-production.up.railway.app)

---

## Quick Start

### Prerequisites

- **Node.js** ≥ 20
- **Casper Wallet** Chrome extension ([install](https://chromewebstore.google.com/detail/casper-wallet/abkahkcbhngaebpcgfmhkoioedceoigp?hl=en))
- **Testnet CSPR** — get free tokens from the [Casper Testnet Faucet](https://testnet.cspr.live/tools/faucet)

### 1. Clone & Install

```bash
git clone https://github.com/leo-jr-hah/casper-rwa-court.git
cd casper-rwa-court

# Install frontend dependencies
cd dashboard && npm install

# Install backend dependencies
cd ../agents && npm install
```

### 2. Configure Environment

```bash
# From the repo root
cp .env.example .env
```

Edit `.env` and fill in at minimum:

| Variable | What it does | Example |
|----------|-------------|---------|
| `CASPER_RPC_URL` | Casper testnet RPC endpoint | `https://node.testnet.cspr.cloud/rpc` |
| `DEPLOYER_PRIVATE_KEY` | Absolute path to your deployer `.pem` file | `/Users/you/.casper/keys/deployer.pem` |
| `DEPLOYER_PUBLIC_KEY` | Hex public key of the deployer account | `01abcdef...` |
| `ADMIN_SECRET` | Password for admin endpoints | `your-admin-secret-here` |
| `VITE_ORCHESTRATOR_URL` | Where the backend runs | `http://localhost:3000` |
| `VITE_WS_URL` | WebSocket URL for live updates | `ws://localhost:3010` |

> You do NOT need API keys for the AI agents — they use a built-in fallback when no LLM key is configured.

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
3. Navigate to **Value Asset** → select a demo asset (e.g., Manhattan Condo)
4. Click **Pay & Assess** → approve the 2.5 CSPR payment in your wallet
5. Watch 3 AI jurors analyze the asset in real time via WebSocket
6. See the consensus valuation, risk flags, and methodology breakdown
7. Navigate to **Borrow**, **Insure**, **Predict**, **Oracle**, or **Disputes**

### 6. Run Tests

```bash
cd agents
npm test
# 55/61 tests passing — covers HMAC chain, trust scoring, agent orchestration
```

---

## What This System Does

### Six Products, One Platform

| Product | Route | Fee | What happens |
|---------|-------|-----|-------------|
| **Assess** | `/assess` | 2.5 CSPR | 2 AI agents independently value an asset using different methodologies (Comparable Sales, DCF, Income Approach). Results are reconciled into a consensus valuation with risk flags. |
| **Borrow** | `/borrow` | 5 CSPR | Use an assessment as collateral. AI determines Loan-to-Value ratio, CSPR is disbursed, and an autonomous keeper monitors collateral health every 30 minutes. |
| **Insure** | `/insure` | 3 CSPR | Insure an asset against value loss. AI generates a risk score and premium. File claims with automatic AI revaluation and on-chain payout. |
| **Predict** | `/predict` | 1 CSPR | Ask any yes/no question about future events. 3 agents independently estimate probability, weighted by reputation. |
| **Oracle** | `/oracle` | — | Dashboard showing all verdicts, statistics, and oracle health. Query any asset's valuation history. |
| **Disputes** | `/disputes` | 5 CSPR stake | Challenge any verdict with a 5 CSPR stake. Triggers a re-trial with 3 adversarial jurors. If the challenge succeeds, the stake is returned. |

### What Makes It Autonomous

This isn't a frontend that calls an API. The system runs **unattended**:

- **Borrow Keeper** — checks collateral ratios every 30 minutes, triggers margin calls when LTV exceeds thresholds, liquidates when critical.
- **Insurance Monitor** — tracks policy expiration, triggers claim reviews, processes payouts.
- **Agent Self-Selection** — AI agents autonomously choose their valuation methodology based on data availability (not hardcoded). If comparable sales data is thin, the agent falls back to DCF.
- **Reputation Updates** — after real market events, agents gain or lose reputation based on how close their predictions were to reality.
- **Oracle Dispute Resolution** — anyone can challenge a verdict with a 5 CSPR stake. A re-trial panel of adversarial jurors re-examines the evidence.

### What's On-Chain vs. Off-Chain

| Layer | What's there | Why |
|-------|-------------|-----|
| **On-chain (Casper Testnet)** | Payment verification (x402), reputation scores, voting records | Cryptographic guarantees and economic finality |
| **Off-chain (this repo)** | AI agent logic, collateral tracking, loan state, insurance policies, dispute resolution | Sub-second response times and complex computation |

> **Honest scoping note:** Collateral tracking and loan state are currently managed off-chain in the orchestrator's in-memory store. In production, these would move to on-chain smart contracts or a persistent database.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                 React Dashboard                      │
│  (Vite + Tailwind + Casper Wallet SDK)              │
│  Landing · Assess · Borrow · Insure · Predict       │
│  Oracle · Disputes · Agents · History               │
└──────────────┬──────────────────────┬───────────────┘
               │ HTTP                │ WebSocket
               ▼                     ▼
┌─────────────────────────────────────────────────────┐
│                Orchestrator (:3000)                  │
│  Assessment · Loans · Insurance · Predictions       │
│  Oracle Verdicts · Dispute Resolution               │
│  Autonomous Keepers (borrow + insurance monitors)   │
│  HMAC Receipt Chain · Trust Scoring                 │
└────────┬──────────┬──────────┬──────────────────────┘
         │ x402     │ x402     │ x402
         ▼          ▼          ▼
┌────────────┐ ┌────────────┐ ┌────────────┐
│  Agent A   │ │  Agent B   │ │  Agent C   │
│ Comparable │ │    DCF     │ │  Income    │
│   Sales    │ │  Method    │ │  Approach  │
└────────────┘ └────────────┘ └────────────┘
         │          │          │
         ▼          ▼          ▼
┌─────────────────────────────────────────────────────┐
│              Casper Testnet (On-Chain)               │
│  x402 Payment Verification · CSPR Transfers         │
│  Reputation Registry · Verdict Oracle                │
└─────────────────────────────────────────────────────┘
```

---

## Environment Variables

See [`.env.example`](.env.example) for the full list with descriptions. Key groups:

| Group | Variables | Required for |
|-------|-----------|-------------|
| **Blockchain** | `CASPER_RPC_URL`, `DEPLOYER_PRIVATE_KEY`, `DEPLOYER_PUBLIC_KEY` | On-chain payments, deploy relay |
| **Backend** | `PORT`, `ADMIN_SECRET`, `GROQ_API_KEY`, `MIMO_API_KEY` | Server, auth, LLM fallbacks |
| **Frontend** | `VITE_ORCHESTRATOR_URL`, `VITE_WS_URL`, `VITE_CASPER_RPC_URL` | API calls, WebSocket, wallet |
| **Wallet** | `VITE_PLATFORM_WALLET`, `VITE_ASSESSMENT_FEE`, `VITE_PREDICTION_FEE` | Fee display, payment routing |

---

## Project Structure

```
casper-rwa-court/
├── agents/                    # Backend: orchestrator + AI jurors
│   ├── orchestrator/          # Main API server (Express + WebSocket)
│   ├── valuation-agent-a/     # Agent A: Comparable Sales
│   ├── valuation-agent-b/     # Agent B: DCF / Income Approach
│   ├── evidence-analyst/      # Juror: Evidence Reviewer
│   ├── market-data-interpreter/ # Juror: Market Trend Analyst
│   ├── precedent-researcher/  # Juror: Case Precedent Researcher
│   ├── shared/                # Shared: trust scoring, HMAC chains, x402
│   └── tests/                 # Unit tests (vitest)
├── contracts/                 # Rust smart contracts (Odra framework)
│   ├── reputation/            # ReputationRegistry
│   └── voting/                # VotingContract
├── dashboard/                 # React 19 frontend (Vite)
│   └── src/
│       ├── pages/             # 12 views (Landing, Assess, Borrow, etc.)
│       ├── components/        # Shared UI + landing page components
│       ├── contexts/          # CSPRClickContext (wallet provider)
│       ├── hooks/             # useAssessment, useLoan, useInsurance
│       ├── services/          # api.ts (all backend calls)
│       ├── layouts/           # LandingLayout (top-nav), Layout (sidebar)
│       └── config/            # casper.ts (fees, wallet address)
├── .env.example               # Environment template
├── ARCHITECTURE.md            # Technical deep-dive
└── README.md                  # This file
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite, Tailwind CSS v3, motion (NOT framer-motion), GSAP |
| **Backend** | Node.js 20, Express, WebSocket (ws), TypeScript |
| **Blockchain** | Casper Testnet, casper-js-sdk v5, x402 HTTP micropayments |
| **AI Agents** | Groq llama-3.3-70b (primary), MiMo V2, heuristic fallback |
| **Wallet** | Casper Wallet SDK (window.CasperWalletProvider) |
| **Tests** | vitest, supertest |
| **Deploy** | Railway (backend), Vercel (frontend) |

---

## License

Built for the [Casper Agentic Buildathon 2026](https://dorahacks.io/hackathon/casper-agentic-buildathon).
