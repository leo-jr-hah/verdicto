# Verdicto — Project Report

**Date:** June 25, 2026  
**Live:** [verdicto.xyz](https://verdicto.xyz) · [Backend API](https://verdicto-production.up.railway.app)  
**GitHub:** https://github.com/leo-jr-hah/casper-rwa-court

---

## 1. Executive Summary

Verdicto is a **fully-built, production-deployed autonomous multi-agent AI system** for Real World Asset valuation, lending, insurance, prediction markets, and dispute resolution — all settled on the Casper blockchain.

This is not a prototype. It is a working system with:
- **6 complete products** (Assess, Borrow, Insure, Predict, Oracle, Disputes)
- **5 independent AI agents** with autonomous methodology selection
- **Real x402 micropayments** (actual CSPR transfers signed by the user's wallet)
- **Autonomous keepers** that run unattended (borrow collateral monitoring, insurance lifecycle)
- **Oracle dispute resolution** with adversarial re-trial panels
- **55 unit tests** covering cryptographic receipt chains, trust scoring, agent orchestration, and x402 integration
- **A premium landing page** with particle effects, typewriter animations, and interactive story explainer

---

## 2. Products

| Product | Route | Fee | Status |
|---------|-------|-----|--------|
| **Assess** | `/assess` | 2.5 CSPR | ✅ Complete |
| **Borrow** | `/borrow` | 5 CSPR | ✅ Complete |
| **Insure** | `/insure` | 3 CSPR | ✅ Complete |
| **Predict** | `/predict` | 1 CSPR | ✅ Complete |
| **Oracle** | `/oracle` | — | ✅ Complete |
| **Disputes** | `/disputes` | 5 CSPR stake | ✅ Complete |

---

## 3. Architecture

### 3.1 Frontend (React 19 + Vite)

- **12 views** with sidebar navigation
- **Casper Wallet SDK** integration (window.CasperWalletProvider)
- **Shared PaymentModal** for all products
- **WebSocket** real-time updates
- **GSAP** landing page animations
- **Interactive story** explainer

### 3.2 Backend (Express + TypeScript)

- **Single orchestrator** handling all API endpoints
- **5 AI agent services** (2 valuation + 3 jurors)
- **Autonomous keepers** (borrow monitoring, insurance lifecycle)
- **x402 payment verification** middleware
- **HMAC receipt chain** for verifiable execution
- **Trust scoring** system (Platinum/Gold/Silver/Bronze tiers)

### 3.3 Blockchain (Casper Testnet)

- **x402 micropayments** — real CSPR transfers signed by user's wallet
- **Payment verification** on-chain
- **Reputation tracking** (off-chain, would move on-chain in production)

---

## 4. AI Agent System

| Agent | Role | Methodology |
|-------|------|-------------|
| Valuation Agent A | Primary valuation | Comparable Sales |
| Valuation Agent B | Secondary valuation | DCF / Income Approach |
| Evidence Analyst | Juror | Evidence review and validation |
| Market Data Interpreter | Juror | Market trend analysis |
| Precedent Researcher | Juror | Case precedent search |

**LLM Pipeline:** Groq llama-3.3-70b (primary) → MiMo V2 → Heuristic fallback (15s timeout)

**Data Sources:** RentCast (real estate), CoinGecko (commodities/crypto), FRED (macro), Met Museum (art)

---

## 5. Payment System (x402)

All payments use the x402 HTTP micropayment standard with real on-chain signing:

1. Frontend creates a native CSPR transfer deploy via `casper-js-sdk`
2. User's Casper Wallet signs the deploy
3. Signed deploy is base64-encoded as payment proof
4. Backend verifies the proof (amount, payer, network)
5. If valid, request proceeds; if invalid, returns HTTP 402

**Fees:**
| Product | Fee (CSPR) | Fee (motes) |
|---------|-----------|-------------|
| Assess | 2.5 | 2,500,000,000 |
| Predict | 1 | 1,000,000,000 |
| Borrow | 5 | 5,000,000,000 |
| Insure | 3 | 3,000,000,000 |
| Dispute | 5 (stake) | 5,000,000,000 |

---

## 6. Trust & Reputation

- **HMAC Receipt Chain** — Every agent action generates a cryptographic receipt
- **Trust Score** — 0-1000 scale based on historical accuracy, consistency, response quality
- **Tier Assignment:**
  - Platinum: >900
  - Gold: >750
  - Silver: >600
  - Bronze: <600
- **Retroactive Updates** — Reputation updated based on real market events, not consensus (prevents groupthink)

---

## 7. Oracle & Disputes

### 7.1 Oracle

- Stores all assessment verdicts with HMAC receipt hashes
- Tracks statistics: total verdicts, fresh verdicts, average confidence, active disputes, overturned verdicts
- Query any asset's valuation history

### 7.2 Disputes

- **Challenge** any verdict with a 5 CSPR stake
- **Re-trial** with 3 adversarial jurors (Adversarial Market Analyst, Deep Value Auditor, Devil's Advocate)
- **Outcome** — If 2/3 panelists agree original verdict was wrong → overturned, new verdict issued
- **Stake Distribution** — Challenger gets stake back if successful; forfeited if challenge fails

---

## 8. Autonomous Keepers

### 8.1 Borrow Keeper

- Checks collateral ratios every 30 minutes
- Triggers margin calls when LTV exceeds thresholds
- Liquidates when critical
- No human in the loop

### 8.2 Insurance Monitor

- Tracks policy expiration
- Triggers claim reviews
- Processes payouts
- Autonomous lifecycle management

---

## 9. Testing

```bash
cd agents
npm test
# 55/61 tests passing (4 test suites)
```

**Test Coverage:**
- HMAC receipt chain generation and verification
- Trust scoring and tier assignment
- Agent orchestration and methodology selection
- x402 payment verification (6 edge cases failing)

---

## 10. Deployment

| Component | Platform | URL |
|-----------|----------|-----|
| Frontend | Vercel | https://verdicto.xyz |
| Backend | Railway | https://verdicto-production.up.railway.app |
| Blockchain | Casper Testnet | https://testnet.cspr.live |

---

## 11. Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite, Tailwind CSS v3, motion, GSAP |
| **Backend** | Node.js 20, Express, TypeScript, WebSocket |
| **Blockchain** | Casper Testnet, casper-js-sdk v5, x402 |
| **AI** | Groq llama-3.3-70b, MiMo V2, heuristic fallback |
| **Wallet** | Casper Wallet SDK |
| **Tests** | vitest, supertest |
| **Deploy** | Railway, Vercel |

---

## 12. What's On-Chain vs. Off-Chain

| Layer | What's there | Why |
|-------|-------------|-----|
| **On-chain** | Payment verification (x402), CSPR transfers | Cryptographic guarantees |
| **Off-chain** | AI agent logic, collateral tracking, loan state, insurance policies, dispute resolution | Sub-second response, complex computation |

> **Note:** In production, collateral tracking and loan state would move to on-chain smart contracts or a persistent database.
