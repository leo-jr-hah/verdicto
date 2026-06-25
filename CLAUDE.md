# Verdicto — AI Onboarding Document

## Project Overview
Autonomous multi-agent AI system for RWA (Real-World Asset) valuation, lending, insurance, prediction markets, and dispute resolution on Casper Network. 6 products, x402 micropayments, React 19 dark-mode dashboard.

## Hackathon
Casper Agentic Buildathon 2026 — https://dorahacks.io/hackathon/casper-agentic-buildathon
Deadline: July 1, 2026

## Technology Stack
- **Frontend:** React 19 + Vite + Tailwind CSS v3 + motion (NOT framer-motion)
- **Backend:** Node.js 20 + Express + TypeScript + WebSocket (ws)
- **Blockchain:** Casper Testnet, casper-js-sdk v5, x402 HTTP micropayments
- **AI:** Groq llama-3.3-70b (primary), MiMo V2, heuristic fallback (15s timeout)
- **Wallet:** Casper Wallet SDK (window.CasperWalletProvider)
- **Tests:** vitest, supertest
- **Deploy:** Railway (backend), Vercel (frontend)

## CRITICAL: Dashboard Imports
```ts
// ✅ CORRECT
import { motion } from 'motion/react';
// npm install motion (NOT framer-motion)

// ❌ WRONG
import { motion } from 'framer-motion';
```

## Architecture
```
Layer 1 (Frontend):  React 19 dashboard — 12 views, wallet integration, WebSocket
Layer 2 (Backend):   Express orchestrator — all API endpoints, autonomous keepers
Layer 3 (Agents):    5 AI services — 2 valuation agents + 3 jurors
Layer 4 (Payments):  x402 micropayments — real CSPR signing via Casper Wallet
Layer 5 (On-Chain):  Casper Testnet — payment verification, reputation, verdicts
```

## Project Structure
```
agents/                 Backend: orchestrator + AI jurors
  orchestrator/         Main API server (Express + WebSocket)
  valuation-agent-a/    Agent A: Comparable Sales
  valuation-agent-b/    Agent B: DCF / Income Approach
  evidence-analyst/     Juror: Evidence Reviewer
  market-data-interpreter/ Juror: Market Trend Analyst
  precedent-researcher/ Juror: Case Precedent Researcher
  shared/               Trust scoring, HMAC chains, x402, data sources
  tests/                Unit tests (vitest)
contracts/              Rust smart contracts (Odra framework)
  reputation/           ReputationRegistry
  voting/               VotingContract
dashboard/              React 19 frontend (Vite)
  src/pages/            12 views (Landing, Assess, Borrow, Insure, Predict, Oracle, Disputes, etc.)
  src/components/       Shared UI + landing page components
  src/contexts/         CSPRClickContext (wallet provider)
  src/hooks/            useAssessment, useLoan, useInsurance
  src/services/         api.ts (all backend calls)
  src/layouts/          LandingLayout (top-nav), Layout (sidebar)
  src/config/           casper.ts (fees, wallet address)
```

## Routes
- `/` — Landing page (standalone top-nav layout, premium GSAP animations)
- `/dashboard` — Portfolio overview
- `/assess` — Asset valuation (2.5 CSPR fee)
- `/borrow` — Borrow against assessed assets (5 CSPR fee, AI-calculated LTV)
- `/insure` — Insure assets against value loss (3 CSPR fee, AI risk assessment)
- `/predict` — Prediction market resolution (1 CSPR fee)
- `/oracle` — Verdict dashboard (read-only, shows all verdicts + stats)
- `/disputes` — Challenge verdicts (5 CSPR stake, re-trial with adversarial jurors)
- `/reputation` — Agent reputation scores + history
- `/transactions` — Transaction history
- `/how-it-works` — System explainer
- `/architecture` — Technical architecture
- `/roadmap` — Product roadmap

## Wallet Integration
- Uses official Casper Wallet SDK (injected by Chrome extension)
- `window.CasperWalletProvider` — factory function (NOT `window.casper`)
- `window.CasperWalletEventTypes` — event names: Connected, Disconnected, ActiveKeyChanged
- Events are DOM CustomEvents on `window` (NOT provider.on())
- `event.detail` is JSON: `{ activeKey, isConnected, isLocked }`
- Chrome Web Store: https://chromewebstore.google.com/detail/casper-wallet/abkahkcbhngaebpcgfmhkoioedceoigp?hl=en
- Testnet Faucet: https://testnet.cspr.live/tools/faucet

## Backend Endpoints (orchestrator/index.ts)
- `POST /api/assess` — Run asset assessment
- `POST /api/assessments/start` — Start assessment session
- `GET /api/assess/demo` — Demo assets
- `POST /api/predict` — Prediction market
- `POST /api/loans/create` — Create loan (x402 gated)
- `GET /api/loans` — List loans
- `GET /api/loans/:id` — Get loan
- `POST /api/loans/:id/repay` — Repay loan
- `POST /api/loans/:id/revalue` — Revalue collateral
- `POST /api/insurance/create` — Create policy (x402 gated)
- `GET /api/insurance` — List policies
- `GET /api/insurance/:id` — Get policy
- `POST /api/insurance/:id/claim` — File claim
- `GET /api/oracle/verdicts` — List verdicts
- `GET /api/oracle/verdict/:assetId` — Get verdict by asset
- `GET /api/oracle/stats` — Oracle statistics
- `POST /api/oracle/dispute` — File dispute (x402 gated, 5 CSPR stake)
- `POST /api/oracle/disputes/:id/retrial` — Trigger re-trial
- `GET /api/oracle/disputes` — List disputes
- `GET /api/oracle/disputes/:id` — Get dispute
- `GET /api/reputation` — Agent reputation scores
- `GET /api/transactions` — Transaction history
- `GET /api/contract-state` — Live contract state
- `POST /api/receipts/verify` — Verify HMAC receipt
- `POST /api/relay-deploy` — Relay signed deploy to Casper testnet
- `GET /health` — Health check

## Key Files
- `dashboard/src/contexts/CSPRClickContext.tsx` — Wallet provider
- `dashboard/src/components/PaymentModal.tsx` — Shared payment modal
- `dashboard/src/components/WalletConnectButton.tsx` — Wallet UI
- `dashboard/src/layouts/Layout.tsx` — Sidebar navigation
- `dashboard/src/services/api.ts` — All API calls
- `dashboard/src/config/casper.ts` — Fees, wallet address
- `agents/orchestrator/index.ts` — All backend endpoints
- `agents/shared/trust-framework.ts` — Trust scoring
- `agents/shared/verifiable-execution.ts` — HMAC receipt chains
- `agents/shared/x402-middleware.ts` — x402 payment verification

## x402 Payment Proof Format (CRITICAL)
Wallet creates nested proofs. Backend MUST handle both formats:
```typescript
const amount = decoded.amount || decoded.payload?.amount;
const payer = decoded.payer || decoded.payload?.payer;
const txHash = decoded.txHash || decoded.deployHash;
```

## Fees
| Product | Fee (CSPR) |
|---------|-----------|
| Assess | 2.5 |
| Predict | 1 |
| Borrow | 5 |
| Insure | 3 |
| Dispute | 5 (stake) |

## Live URLs
- Frontend: https://verdicto.xyz
- Backend: https://verdicto-production.up.railway.app
- GitHub: https://github.com/leo-jr-hah/casper-rwa-court

## Tests
- 55/61 tests passing (vitest)
- 4 test suites: HMAC chain, trust scoring, agent orchestration, x402 integration
- 6 x402 integration tests failing (nested proof format edge cases)
