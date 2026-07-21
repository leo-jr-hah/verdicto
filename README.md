# Verdicto

Real World Asset valuation, lending, insurance, prediction markets, and dispute resolution. Powered by independent AI agents. Settled on Casper.

**Live:** [verdicto.xyz](https://verdicto.xyz) | **Backend:** [verdicto-production.up.railway.app](https://verdicto-production.up.railway.app)

## What It Does

Verdicto is a platform where users submit real world assets (property, vehicles, art, commodities) and get back AI-generated valuations, loan offers, insurance policies, and prediction market resolutions. Every action costs CSPR. Every payment is verified on-chain. Every result is auditable.

Six products, one platform:

| Product | Route | Fee | What happens |
|---------|-------|-----|-------------|
| Assess | `/assess` | 2.5 CSPR | Two AI agents independently value your asset using different methodologies, then reconcile into a consensus valuation with risk flags |
| Borrow | `/borrow` | 5 CSPR | Use an assessment as collateral. AI sets the LTV ratio, CSPR is disbursed, and a keeper monitors collateral health every 30 minutes |
| Insure | `/insure` | 3 CSPR | Get a risk score, premium quote, and policy. File claims with automatic revaluation and on-chain payout |
| Predict | `/predict` | 1 CSPR | Ask any yes/no question. Three AI jurors independently assess and reach a consensus |
| Oracle | `/oracle` | Free | Dashboard of all verdicts, agent statistics, and valuation history |
| Disputes | `/disputes` | 5 CSPR stake | Challenge any verdict. Triggers a re-trial with three adversarial jurors. Successful challenges return the stake |

## How It Works

**Wallet connection.** Users connect via the Casper Wallet browser extension. No accounts, no passwords. Your wallet address is your identity.

**Payment.** Each product has a fixed fee in CSPR. The wallet signs a native transfer deploy. The backend verifies the payment on-chain before running any AI analysis.

**AI analysis.** Independent agents with different specializations analyze the same asset. Agent A uses comparable sales data. Agent B uses discounted cash flow and income approaches. Three jurors review the evidence. Results are reconciled into a single verdict.

**On-chain settlement.** Payment verification, reputation scores, and voting records live on Casper testnet. AI logic, loan state, and insurance policies run off-chain for speed.

**Autonomous operation.** The borrow keeper checks collateral ratios every 30 minutes and triggers margin calls or liquidations. The insurance monitor tracks policy expiration and processes claims. Reputation scores update based on how close past predictions were to actual outcomes.

## Quick Start

### Prerequisites

- Node.js 20 or later
- [Casper Wallet](https://chromewebstore.google.com/detail/casper-wallet/abkahkcbhngaebpcgfmhkoioedceoigp?hl=en) browser extension
- Testnet CSPR from the [faucet](https://testnet.cspr.live/tools/faucet)

### Install

```bash
git clone https://github.com/leo-jr-hah/casper-rwa-court.git
cd casper-rwa-court

cd dashboard && npm install
cd ../agents && npm install
```

### Configure

```bash
cp .env.example .env
```

Open `.env` and set these at minimum:

| Variable | Purpose | Example |
|----------|---------|---------|
| `CASPER_RPC_URL` | Casper testnet RPC endpoint | `https://node.testnet.casper.network:7777/rpc` |
| `DEPLOYER_PRIVATE_KEY` | Path to your deployer `.pem` file | `/Users/you/.casper/keys/deployer.pem` |
| `DEPLOYER_PUBLIC_KEY` | Hex public key of deployer account | `01abcdef...` |
| `ADMIN_SECRET` | Password for admin endpoints | any string |
| `VITE_ORCHESTRATOR_URL` | Backend URL | `http://localhost:3000` |
| `VITE_WS_URL` | WebSocket URL | `ws://localhost:3010` |

You do not need API keys for the AI agents. They use a built-in heuristic fallback when no LLM key is configured.

### Run

```bash
# Terminal 1: backend
cd agents && npm run dev

# Terminal 2: frontend
cd dashboard && npm run dev
```

Open `http://localhost:5173`. Connect your wallet. Pick a product. Pay in CSPR. Watch the AI work.

### Test

```bash
cd agents && npm test
```

64 tests covering HMAC receipt chains, trust scoring, tier assignment, agent orchestration, insurance, predictions, oracle disputes, and the borrow audit.

## Architecture

**Frontend** (`dashboard/`): React 19, Vite, Tailwind CSS, Casper Wallet SDK. Twelve views including a landing page with an interactive story explainer, product wizards, and real-time WebSocket updates.

**Backend** (`agents/`): Express orchestrator serving all API endpoints. Three AI analyst engines. HMAC receipt chain for verifiable execution. Trust scoring system that ranks agent reliability. x402 middleware for payment-gated endpoints.

**Smart contracts** (`contracts/`): Rust contracts built with the Odra framework. ReputationRegistry for on-chain agent reputation. VotingContract for verdict recording. Compiled to WASM and deployed on Casper testnet.

**Data flow:**
```
Browser (React + Casper Wallet)
  |
  |-- HTTP requests --> Orchestrator (Express, port 3000)
  |                       |
  |                       |-- x402 payment verification
  |                       |-- Agent A (Comparable Sales)
  |                       |-- Agent B (DCF / Income)
  |                       |-- Jurors (Evidence, Market, Precedent)
  |                       |-- Supabase (persistent storage)
  |                       |
  |-- WebSocket ------> Orchestrator (port 3010)
  |                       |
  |                       |-- Real-time agent status
  |                       |-- Live verdict updates
  |
  |-- On-chain ------> Casper Testnet
                          |-- Payment verification
                          |-- Reputation registry
                          |-- Verdict oracle
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, Tailwind CSS v3, motion, GSAP |
| Backend | Node.js 20, Express, WebSocket (ws), TypeScript |
| Blockchain | Casper testnet, casper-js-sdk v5, x402 HTTP micropayments |
| AI | Groq llama-3.3-70b-versatile, heuristic fallback |
| Wallet | Casper Wallet SDK (window.CasperWalletProvider) |
| Database | Supabase (PostgreSQL) |
| Smart Contracts | Rust, Odra framework, WASM |
| Tests | vitest, supertest |
| Deploy | Railway (backend), Vercel (frontend) |

## Project Structure

```
verdicto/
  agents/                        Backend
    orchestrator/                  Main API server (Express + WebSocket)
    valuation-agent-a/             Agent A: Comparable Sales methodology
    valuation-agent-b/             Agent B: DCF and Income Approach
    evidence-analyst/              Juror: Evidence Reviewer
    market-data-interpreter/       Juror: Market Trend Analyst
    precedent-researcher/          Juror: Case Precedent Researcher
    shared/                        Trust scoring, HMAC chains, x402, DB layer
    tests/                         Unit and integration tests
  contracts/                     Smart contracts (Rust / Odra)
    reputation/                    ReputationRegistry
    voting/                        VotingContract
    verdict-oracle/                VerdictOracle
  dashboard/                     Frontend (React 19 + Vite)
    src/
      pages/                       Product views (Assess, Borrow, Insure, etc.)
      components/                  Shared UI, PaymentModal, WalletConnectButton
      contexts/                    CSPRClickContext (wallet provider)
      hooks/                       useAssessment, useLoan, useInsurance
      services/                    api.ts (all backend calls)
      config/                      Fees, wallet address, Casper network config
```

## Environment Variables

All variables are documented in `.env.example`. The main groups:

- **Blockchain**: `CASPER_RPC_URL`, `DEPLOYER_PRIVATE_KEY`, `DEPLOYER_PUBLIC_KEY` for on-chain interaction
- **Backend**: `PORT`, `ADMIN_SECRET`, `GROQ_API_KEY` for server config and LLM access
- **Frontend**: `VITE_ORCHESTRATOR_URL`, `VITE_WS_URL`, `VITE_PLATFORM_WALLET` for client-side config
- **Database**: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` for persistent storage
- **Payments**: `X402_REQUIRE_PAYMENT`, `X402_RECIPIENT_ADDRESS` for micropayment enforcement

## On-Chain Contracts (Casper Testnet)

Three smart contracts deployed via Odra framework:

| Contract | Deploy Transaction | Purpose |
|----------|-------------------|---------|
| ReputationRegistry | `7125ee79...ab74` | Stores agent reputation scores and tier assignments on-chain |
| VotingContract | `43fb7646...f59` | Records juror votes and verdict outcomes |
| EscrowContract | `7a10f775...d13` | Holds CSPR stakes for disputes and loan collateral |

Deployer account: `02039cd256da1f2e13fc24a6f2ad1c15166f45070befa52bc2da46bbe194e7381010`

WASM binaries are in `contracts/wasm/`. Source is in `contracts/reputation/`, `contracts/voting/`, `contracts/verdict-oracle/`.

## Testing Instructions

### Live demo (no install)

1. Install [Casper Wallet](https://chromewebstore.google.com/detail/casper-wallet/abkahkcbhngaebpcgfmhkoioedceoigp?hl=en) browser extension
2. Get testnet CSPR from the [faucet](https://testnet.cspr.live/tools/faucet) (takes ~30 seconds)
3. Go to [verdicto.xyz](https://verdicto.xyz)
4. Click "Connect Wallet" in the sidebar
5. Pick any product (Assess is the simplest to try first)
6. Select a demo asset or enter your own details
7. Approve the CSPR payment in the wallet popup
8. Watch the AI agents analyze in real time (WebSocket updates)
9. View the verdict on the Oracle dashboard

### Run locally

```bash
# Terminal 1: backend
cd agents && npm install && npm run dev

# Terminal 2: frontend
cd dashboard && npm install && npm run dev
```

The backend starts with heuristic fallback when no Groq API key is set. Set `GROQ_API_KEY` in `.env` for full AI analysis. Payments use the Casper testnet.

### Run tests

```bash
cd agents && npx vitest run    # 64 tests
cd dashboard && npx vitest run # 4 tests
```

## License

Built for the [Casper Agentic Buildathon 2026](https://dorahacks.io/hackathon/casper-agentic-buildathon).
