# Casper RWA Court: Master Architecture Document

*This document serves as the updated source of truth for the Casper RWA Court project.*

---

## 1. System Overview

The Casper RWA Court is an autonomous, multi-agent dispute resolution system for tokenized Real-World Assets (RWAs). It utilizes AI agents as independent economic actors who analyze real-world data, debate valuations, and settle disputes on the Casper blockchain.

### Core Technologies
*   **Blockchain:** Casper Testnet
*   **Smart Contracts:** Odra Framework (Rust v2.8)
*   **Agent Protocol:** Model Context Protocol (MCP) SDK v1.16+
*   **Payments:** x402 HTTP Micropayment Standard (real on-chain signing)
*   **Frontend:** React 19, Vite, Tailwind v3, motion (NOT framer-motion)
*   **Blockchain Indexing:** CSPR.cloud API & casper-js-sdk v5
*   **Animations:** GSAP + @gsap/react + use-scramble (landing page)

---

## 2. Smart Contract Architecture (Odra)

The on-chain logic is divided into three specialized Odra contracts.

### A. Escrow Contract
*   **Purpose:** Locks the human Filer's CSPR fee (e.g., 0.1 CSPR) when a dispute is initiated.
*   **Flow:** Holds funds securely while the AI jury deliberates. Upon verdict, routes the funds to the winning agents.

### B. Voting Contract
*   **Purpose:** Records the AI agents' verdicts on-chain.
*   **Mechanic:** Uses a **Reputation-Weighted Tally**. Instead of 1-wallet-1-vote, an agent's vote weight is determined by their historical accuracy score.

### C. Reputation Registry Contract
*   **Purpose:** Maintains the immutable identity and reliability score of every AI agent.
*   **Update Mechanic (Retroactive Settlement):** To prevent AI groupthink, reputation is *not* updated purely by majority consensus. Instead, the contract records the agents' estimates. Later, when the asset experiences a true market event (e.g., actual sale), the contract calculates the delta. The agent closest to reality gains reputation; others lose reputation.

---

## 3. Agent Architecture (MCP & Autonomy)

Agents are independent Node.js services utilizing the **Model Context Protocol (MCP)** to expose valuation tools to the network.

### Genuine Autonomy (The LLM Router)
Agents are NOT hardcoded to specific methodologies. Instead, each agent has a core logic engine:
1.  **Analyze Data Availability:** The agent queries market data for the asset.
2.  **Autonomous Selection:** If comparable sales data is robust (>3 recent sales), the agent autonomously selects the `Comparable Sales` MCP tool. If data is thin, it falls back to the `Discounted Cash Flow (DCF)` tool for higher confidence.
3.  **Execution:** The agent executes the chosen mathematical model and formulates a human-readable reasoning string.

### Trust Scoring
*   HMAC receipt chain for verifiable execution proofs
*   Trust scores based on historical accuracy, consistency, and response quality
*   Tier assignment: Platinum (>900), Gold (>750), Silver (>600), Bronze (<600)

---

## 4. Economic Layer: x402 Micropayments

Agents gate their services behind the **x402 Protocol** with real on-chain signing.

*   **The Flow:**
    1.  The Orchestrator requests a valuation from an agent's MCP server.
    2.  The agent's middleware intercepts the request and returns HTTP `402 Payment Required`.
    3.  The Orchestrator creates a native CSPR transfer deploy using casper-js-sdk.
    4.  The user's Casper Wallet signs the deploy (via `signPayment()` in CSPRClickContext).
    5.  The signed deploy is returned as a cryptographic payment proof.
    6.  The agent validates the proof and processes the request.

*   **User-Facing Fees:**
    *   Asset Assessment: 2.5 CSPR
    *   Prediction Market: 1 CSPR
    *   Dispute Filing: 0.1 CSPR

*   **Platform Wallet:** `02039cd256da1f2e13fc24a6f2ad1c15166f45070befa52bc2da46bbe194e7381010`

---

## 5. Frontend Architecture (React 19)

### Layouts
*   **LandingLayout** (`/` route): Standalone top-nav with glass morphism, logo, nav links, CTA button, footer. No sidebar.
*   **Layout** (all other routes): Sidebar navigation with wallet integration, mobile responsive.

### Landing Page (Premium)
*   Canvas particle field with mouse repulsion + connections
*   Animated gradient orbs (pulsing, parallax)
*   ScrambleText hero headline (use-scramble hook)
*   AnimatedNumber counters (count up on scroll)
*   Reveal animations (scroll-triggered fade up/left/right)
*   LiveAssessmentVisual (5-step animated asset valuation sequence)
*   StickyScrollSection (horizontal scroll with pinned container)
*   CursorGlow (subtle radial gradient follows mouse)
*   Scroll progress bar at top

### Key Pages
*   **DashboardView**: Live contract state, x402 payment stream, stats grid
*   **AssessView**: Asset valuation with multi-methodology dashboard, 5 agent cards, divergence range, risk flags
*   **PredictionView**: Prediction market resolution, probability cards, weighted consensus
*   **ReputationView**: Agent reputation table, score history, sparklines
*   **RoadmapView**: 16 features across 4 categories, status tracking

### Wallet Integration
*   Official Casper Wallet SDK (Chrome extension injection)
*   `window.CasperWalletProvider` factory → `provider.requestConnection()`
*   Events via `window.addEventListener(CasperWalletEventTypes.Connected, handler)`
*   WalletConnectButton in sidebar footer + mobile header
*   Faucet link in sidebar for testnet CSPR

---

## 6. End-to-End User Flow

1.  **Landing:** User visits `/`, sees premium landing page with particle effects and scramble text.
2.  **Connect Wallet:** User clicks "Connect Wallet" → Casper Wallet extension popup → approves connection.
3.  **Assess Asset:** User navigates to `/assess`, enters asset details, pays 2.5 CSPR via wallet signing.
4.  **Agent Deliberation:** 5 AI agents analyze the asset using different methodologies (comparable sales, DCF, income approach, market data, precedent).
5.  **Results:** Multi-methodology dashboard shows agent cards, divergence range, risk flags, consensus analysis.
6.  **Prediction:** User can also make predictions on asset values at `/predict` (1 CSPR fee).
7.  **On-Chain Proof:** All payments are signed native CSPR transfers, verifiable on testnet.cspr.live.

---

## 7. Testing

*   **Framework:** Vitest
*   **Coverage:** 27/27 tests passing
*   **Test Files:**
    *   `trust-framework.test.ts` (17 tests) - trust scoring, tier assignment
    *   `verifiable-execution.test.ts` (10 tests) - HMAC receipt chain
    *   `agent-engine.test.ts` (16 tests) - agent orchestration, valuation logic

---

## 8. Deployment

*   **Smart Contracts:** Deployed on Casper Testnet
    *   VotingContract: `f00cbb8f...`
    *   EscrowContract: `83bf2bab...`
    *   ReputationRegistry: `30da84e6...`
*   **Frontend:** Vite build → Firebase Hosting
*   **Backend:** GCP Cloud Run
