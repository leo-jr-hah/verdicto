# Verdicto — Validator Prompt

Use this prompt with any AI validator/evaluator (ChatGPT, Claude, Gemini, etc.) to get a comprehensive project audit.

---

## PROMPT START

---

You are a senior technical validator and product strategist. I need you to perform a **deep, honest audit** of our hackathon project: **Verdicto**.

### Context

**Hackathon:** Casper Agentic Buildathon 2026 — Qualification Round
**Platform:** https://dorahacks.io/hackathon/casper-agentic-buildathon
**Prize Pool:** $150,000 USD ($30K cash + $100K x402 credits + $20K in-kind)
**Deadline:** July 1, 2026
**Submission Requirements:** GitHub link required, Demo video required, Casper Network deployment required
**Hackathon Tags:** Agentic AI, DeFi, Real-World Assets, Casper Network, x402, Blockchain, Web3, Rust

**Our GitHub:** https://github.com/leo-jr-hah/casper-rwa-court
**Live Site:** https://verdicto.xyz
**Backend API:** https://verdicto-production.up.railway.app

---

### What This Project Is

**Verdicto** is an autonomous, multi-agent AI system for Real-World Asset (RWA) valuation, lending, insurance, prediction markets, and dispute resolution — all settled on the Casper blockchain.

**The problem it solves:** When two parties disagree on what a real-world asset is worth (property, art, commodities), there's no neutral, transparent, fast way to settle it. Traditional appraisals are slow, opaque, and single-opinion. Verdicto uses **5 independent AI agents** to analyze an asset in parallel, deliberate on the valuation, and produce a verdict — all cryptographically signed and permanently recorded on the Casper blockchain.

**Core flow:**
1. User submits an asset (property address, art piece, or commodity) with an asking price
2. System runs dual-agent valuation (Comparable Sales + DCF/Market/Appraisal)
3. Three juror agents analyze evidence independently (Evidence Reviewer, Trend Analyst, Case Researcher)
4. Agents deliberate with reputation-weighted voting
5. Final verdict is recorded with full HMAC audit trail
6. All agent-to-agent payments flow via x402 micropayments in CSPR

**Six products:**
1. **Assess** (2.5 CSPR) — AI asset valuation with dual-agent consensus
2. **Borrow** (5 CSPR) — Lend against assessed assets with AI-calculated LTV
3. **Insure** (3 CSPR) — Insure assets against value loss with AI risk scoring
4. **Predict** (1 CSPR) — Prediction market resolution with 3-agent consensus
5. **Oracle** (free) — Dashboard showing all verdicts, stats, and oracle health
6. **Disputes** (5 CSPR stake) — Challenge any verdict with adversarial re-trial

**Core technologies:**
- **5 AI Agent Services** (Node.js + TypeScript):
  - `ValuationAgentA` — Comparable Sales methodology
  - `ValuationAgentB` — DCF / Income Approach
  - `EvidenceAnalyst` — Evidence review and validation
  - `MarketDataInterpreter` — Market trend analysis
  - `PrecedentResearcher` — Case precedent search
- **Orchestrator** (Express + WebSocket): Routes disputes, manages deliberation, streams agent thoughts in real-time
- **x402 Micropayment Middleware**: Agents gate their services behind HTTP 402 Payment Required. Full x402 header/flow implementation with real on-chain signing.
- **LLM Pipeline**: Groq llama-3.3-70b (primary) → MiMo V2 → Heuristic (15s timeout per call)
- **Data Sources**: RentCast API (real estate comps), Met Museum API (art), CoinGecko (gold/silver/platinum spot), FRED (macro rates)
- **Crypto Verification**: HMAC receipt chains, SHA-256 audit trail
- **Frontend**: React 19 + Vite + Tailwind v3 dark-mode dashboard with:
  - Landing page with interactive animated story explainer
  - 12 views with sidebar navigation
  - Casper Wallet SDK integration
  - Shared payment modal for all products
  - WebSocket real-time updates
- **Smart Contracts**: Odra Framework (Rust → WASM) on Casper Testnet:
  - `ReputationRegistry` — agent identity & reliability scores (0-1000)
  - `VotingContract` — reputation-weighted on-chain votes

**What's autonomous (runs unattended):**
- Borrow Keeper — checks collateral ratios every 30 minutes, triggers margin calls, liquidates
- Insurance Monitor — tracks policy expiration, triggers claim reviews, processes payouts
- Agent Self-Selection — agents autonomously choose methodology based on data availability
- Reputation Updates — retroactive updates based on real market events (not consensus)
- Oracle Dispute Resolution — anyone can challenge a verdict with a 5 CSPR stake

**What's on-chain vs. off-chain:**
- On-chain: Payment verification (x402), CSPR transfers, reputation scores, voting records
- Off-chain: AI agent logic, collateral tracking, loan state, insurance policies, dispute resolution
- Note: In production, collateral tracking and loan state would move to on-chain smart contracts

**Testing:**
- 55/61 unit tests passing (vitest)
- 4 test suites: HMAC chain, trust scoring, agent orchestration, x402 integration
- 6 x402 integration edge cases failing (nested proof format)

**Deployment:**
- Frontend: Vercel (https://verdicto.xyz)
- Backend: Railway (https://verdicto-production.up.railway.app)
- Blockchain: Casper Testnet

---

### What I Need From You

Please evaluate this project across these dimensions:

1. **Technical Depth** — Is the architecture sound? Are the AI agents genuinely autonomous or just API wrappers? Is the x402 integration real or simulated?

2. **Product Completeness** — Are all 6 products functional? Is the user experience polished? Are there obvious gaps?

3. **Blockchain Integration** — Is the Casper integration meaningful? Are payments real? Is the on-chain/off-chain split reasonable?

4. **Innovation** — Does this solve a real problem? Is the approach novel? What's the competitive moat?

5. **Production Readiness** — Could this actually be deployed? What are the biggest risks?

6. **Hackathon Fit** — Does this align with the Casper Agentic Buildathon goals? How does it compare to typical hackathon projects?

7. **Honest Weaknesses** — What are the biggest gaps, shortcuts, or areas that need improvement?

Please be brutally honest. I'd rather hear about problems now than during judging.

---

## PROMPT END
