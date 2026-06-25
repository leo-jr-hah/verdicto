# Verdicto — Architecture Deep-Dive

*Technical reference for the Verdicto platform. For a high-level overview, see [README.md](README.md).*

---

## 1. System Overview

Verdicto is an autonomous, multi-agent AI system for Real World Asset (RWA) valuation, lending, insurance, prediction markets, and dispute resolution — all settled on the Casper blockchain.

### Core Technologies

| Layer | Stack |
|-------|-------|
| **Frontend** | React 19, Vite, Tailwind CSS v3, motion (NOT framer-motion), GSAP |
| **Backend** | Node.js 20, Express, TypeScript, WebSocket (ws) |
| **Blockchain** | Casper Testnet, casper-js-sdk v5, x402 HTTP micropayments |
| **AI** | Groq llama-3.3-70b (primary), MiMo V2, heuristic fallback (15s timeout) |
| **Wallet** | Casper Wallet SDK (window.CasperWalletProvider) |
| **Tests** | vitest, supertest |
| **Deploy** | Railway (backend), Vercel (frontend) |

---

## 2. Product Architecture

### 2.1 Assess (Asset Valuation)

**Flow:** User selects asset → pays 2.5 CSPR → 2 agents independently value → 3 jurors reconcile → consensus verdict returned.

- **Agent A** — Comparable Sales methodology (real estate comps, art auction data, commodity spot prices)
- **Agent B** — DCF / Income Approach / Market Analysis (depending on asset type)
- **Jurors** — Evidence Reviewer, Market Trend Analyst, Case Precedent Researcher
- **Output** — Consensus value, confidence score, divergence range, risk flags, HMAC receipt chain

### 2.2 Borrow (Lending Against Assets)

**Flow:** User selects assessment → AI calculates LTV → pays 5 CSPR → CSPR disbursed → autonomous keeper monitors.

- **LTV Calculation** — Trust-score-aware: higher confidence assessments get better LTV ratios (up to 70%)
- **Escrow** — CSPR locked in orchestrator, released on repayment or liquidation
- **Autonomous Keeper** — `setInterval` checks collateral health every 30 minutes
- **Revaluation** — AI re-assesses collateral value, triggers margin calls or liquidation
- **Status States** — `healthy` → `warning` → `liquidated` or `repaid`

### 2.3 Insure (Asset Insurance)

**Flow:** User selects asset → AI generates risk score + premium → pays 3 CSPR → policy created → autonomous monitor tracks.

- **Risk Scoring** — AI evaluates asset volatility, market conditions, historical data
- **Premium Calculation** — Risk-adjusted, paid in CSPR
- **Claims** — User files claim → AI revaluates asset → if value dropped, payout processed
- **Autonomous Monitor** — Tracks policy expiration, triggers claim reviews

### 2.4 Predict (Prediction Markets)

**Flow:** User asks yes/no question → pays 1 CSPR → 3 agents estimate probability → weighted consensus returned.

- **Agents** — Each independently estimates probability (0-100%)
- **Weighting** — Reputation-weighted: higher-reputation agents have more influence
- **Output** — Weighted probability, confidence interval, risk factors

### 2.5 Oracle (Verdict Dashboard)

**Flow:** Read-only dashboard showing all verdicts, statistics, and oracle health.

- **Verdicts** — All assessment results stored with HMAC receipt hashes
- **Stats** — Total verdicts, fresh verdicts, average confidence, active disputes, overturned verdicts
- **Query** — Look up any asset's valuation history by asset ID

### 2.6 Disputes (Verdict Challenges)

**Flow:** User challenges verdict → pays 5 CSPR stake → re-trial with 3 adversarial jurors → verdict overturned or upheld.

- **Stake** — 5 CSPR locked on challenge; returned if challenge succeeds
- **Re-trial Panel** — 3 adversarial agents (Adversarial Market Analyst, Deep Value Auditor, Devil's Advocate)
- **Outcome** — If 2/3 panelists agree original verdict was wrong → overturned, new verdict issued
- **Stake Distribution** — Challenger gets stake back if successful; forfeited if challenge fails

---

## 3. Backend Architecture

### 3.1 Orchestrator (`agents/orchestrator/index.ts`)

Single Express server handling all API endpoints. Key responsibilities:

- **Assessment Pipeline** — Coordinates Agent A + Agent B + 3 Jurors
- **Loan Lifecycle** — Create, monitor, revalue, repay, liquidate
- **Insurance Lifecycle** — Create, monitor, file claims, process payouts
- **Prediction Processing** — Route questions to agents, aggregate probabilities
- **Oracle Management** — Store verdicts, track stats, handle disputes
- **Dispute Resolution** — Accept challenges, run re-trials, distribute stakes
- **Autonomous Keepers** — Background intervals for collateral monitoring and insurance lifecycle
- **x402 Payment Verification** — Validate CSPR payment proofs from wallet signatures
- **WebSocket** — Real-time updates for assessment progress, loan status, etc.

### 3.2 AI Agents

Each agent is a standalone TypeScript service:

| Agent | Port | Role |
|-------|------|------|
| Valuation Agent A | 3001 | Comparable Sales methodology |
| Valuation Agent B | 3002 | DCF / Income Approach |
| Evidence Analyst | 3003 | Juror: evidence review |
| Market Data Interpreter | 3004 | Juror: market trend analysis |
| Precedent Researcher | 3005 | Juror: case precedent search |

**LLM Pipeline:** Groq llama-3.3-70b (primary) → MiMo V2 → Heuristic fallback (15s timeout per call)

### 3.3 Shared Libraries (`agents/shared/`)

| File | Purpose |
|------|---------|
| `agent-engine.ts` | Core agent logic, methodology selection |
| `trust-framework.ts` | Trust scoring, tier assignment (Platinum/Gold/Silver/Bronze) |
| `verifiable-execution.ts` | HMAC receipt chain generation and verification |
| `x402-middleware.ts` | HTTP 402 payment verification middleware |
| `x402-client.ts` | Client-side x402 payment proof generation |
| `data-sources.ts` | Market data fetching (RentCast, CoinGecko, FRED, Met Museum) |
| `mimo-client.ts` | MiMo V2 LLM client |
| `fred-client.ts` | FRED economic data client |
| `rentcast-client.ts` | RentCast real estate data client |
| `juror-engine.ts` | Juror deliberation logic |
| `casper-mcp-client.ts` | Casper MCP client |
| `transaction-log.ts` | Transaction logging |
| `audit-trail.ts` | Audit trail generation |
| `types.ts` | Shared TypeScript types |

---

## 4. Frontend Architecture

### 4.1 Routing (`dashboard/src/App.tsx`)

| Route | Layout | Component | Description |
|-------|--------|-----------|-------------|
| `/` | LandingLayout | LandingPage | Premium landing with GSAP effects |
| `/dashboard` | Layout (sidebar) | DashboardView | Portfolio overview |
| `/assess` | Layout | AssessView | Asset valuation (2.5 CSPR) |
| `/borrow` | Layout | BorrowView | Borrow against assessments (5 CSPR) |
| `/insure` | Layout | InsureView | Insure assets (3 CSPR) |
| `/predict` | Layout | PredictionView | Prediction markets (1 CSPR) |
| `/oracle` | Layout | OracleView | Verdict dashboard |
| `/disputes` | Layout | DisputesView | Challenge verdicts (5 CSPR stake) |
| `/reputation` | Layout | ReputationView | Agent trust scores |
| `/transactions` | Layout | TransactionsView | Payment history |
| `/how-it-works` | Layout | HowItWorksView | System explainer |
| `/architecture` | Layout | ArchitectureView | Technical architecture |
| `/roadmap` | Layout | RoadmapView | Product roadmap |

### 4.2 Key Components

| Component | Purpose |
|-----------|---------|
| `CSPRClickContext` | Wallet provider (CasperWalletProvider API) |
| `WalletConnectButton` | Connect/disconnect, copy address, faucet link |
| `PaymentModal` | Shared payment modal for all products |
| `MultiMethodologyDashboard` | Agent result cards with divergence visualization |
| `ReputationGraph` | SVG sparklines + tier badges |
| `LiveContractPanel` | Real-time contract state |
| `ConnectionStatus` | WebSocket health indicator |
| `InteractiveStory` | Landing page interactive story explainer |

### 4.3 State Management

| Hook | Purpose |
|------|---------|
| `useAssessment` | Assessment state machine (idle → paying → analyzing → complete) |
| `useLoan` | Loan lifecycle (create → active → healthy/warning/liquidated/repaid) |
| `useInsurance` | Insurance policy management (create → active → claim → resolved) |
| `usePaymentFlow` | CSPR payment signing and verification |

---

## 5. Payment Architecture (x402)

### 5.1 Flow

1. Frontend creates a native CSPR transfer deploy via `casper-js-sdk`
2. User's Casper Wallet signs the deploy (via `signPayment()` in CSPRClickContext)
3. Signed deploy is base64-encoded as payment proof
4. Backend verifies the proof: checks amount, payer, network
5. If valid, request proceeds; if invalid, returns HTTP 402

### 5.2 Proof Format

The wallet creates nested proofs:
```json
{
  "scheme": "...",
  "payload": { "deploy": "...", "payer": "...", "amount": 2500000000, "network": "casper-testnet" },
  "deployHash": "...",
  "broadcast": true
}
```

Backend must handle both flat and nested formats:
```typescript
const amount = decoded.amount || decoded.payload?.amount;
const payer = decoded.payer || decoded.payload?.payer;
const txHash = decoded.txHash || decoded.deployHash;
```

### 5.3 Fees

| Product | Fee (CSPR) | Fee (motes) |
|---------|-----------|-------------|
| Assess | 2.5 | 2,500,000,000 |
| Predict | 1 | 1,000,000,000 |
| Borrow | 5 | 5,000,000,000 |
| Insure | 3 | 3,000,000,000 |
| Dispute | 5 (stake) | 5,000,000,000 |

---

## 6. Trust & Reputation System

### 6.1 Trust Scoring

- **HMAC Receipt Chain** — Every agent action generates a cryptographic receipt
- **Trust Score** — 0-1000 scale based on historical accuracy, consistency, response quality
- **Tier Assignment:**
  - Platinum: >900
  - Gold: >750
  - Silver: >600
  - Bronze: <600

### 6.2 Reputation Updates

Reputation is NOT updated by majority consensus (to prevent groupthink). Instead:
1. Agents submit valuations
2. Later, when the asset experiences a real market event (actual sale), the system calculates the delta
3. The agent closest to reality gains reputation; others lose reputation

---

## 7. Deployment

### 7.1 Backend (Railway)

- **URL:** `https://verdicto-production.up.railway.app`
- **Config:** `agents/railway.json`
- **Start command:** `npm run start` (runs all agents + orchestrator via concurrently)

### 7.2 Frontend (Vercel)

- **URL:** `https://verdicto.xyz`
- **Config:** `dashboard/vercel.json`
- **Build:** `npm run build` (Vite)

### 7.3 Environment Variables

Backend (Railway):
- `CASPER_RPC_URL`, `DEPLOYER_PRIVATE_KEY`, `DEPLOYER_PUBLIC_KEY`
- `ADMIN_SECRET`, `GROQ_API_KEY`, `MIMO_API_KEY`
- `ALLOWED_ORIGINS` (comma-separated, includes `verdicto.xyz`)

Frontend (Vercel):
- `VITE_ORCHESTRATOR_URL=https://verdicto-production.up.railway.app`
- `VITE_WS_URL=wss://verdicto-production.up.railway.app/ws`
- `VITE_CASPER_RPC_URL`, `VITE_CASPER_NETWORK`, `VITE_PLATFORM_WALLET`

---

## 8. Testing

```bash
cd agents
npm test
# 55/61 tests passing (4 test suites)
# - HMAC receipt chain tests
# - Trust scoring + tier assignment tests
# - Agent orchestration tests
# - x402 integration tests (6 failing — nested proof format edge cases)
```

---

## 9. Data Sources

| Source | Asset Type | Data |
|--------|-----------|------|
| RentCast | Real Estate | Comparable sales, property details |
| CoinGecko | Commodities | Gold, silver, platinum spot prices |
| FRED | Macro | Interest rates, CPI, economic indicators |
| Met Museum API | Art | Auction data, artist records |
| CoinGecko | Crypto | Token prices for prediction markets |
