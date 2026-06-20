# CASPER RWA Court — Validator Prompt

Use this prompt with any AI validator/evaluator (ChatGPT, Claude, Gemini, etc.) to get a comprehensive project audit.

---

## PROMPT START

---

You are a senior technical validator and product strategist. I need you to perform a **deep, honest audit** of our hackathon project: **CASPER RWA Court**.

### Context

**Hackathon:** Casper Agentic Buildathon 2026 — Qualification Round
**Platform:** https://dorahacks.io/hackathon/casper-agentic-buildathon
**Prize Pool:** $150,000 USD ($30K cash + $100K x402 credits + $20K in-kind)
**Deadline:** July 1, 2026 (11 days from today, June 19, 2026)
**Submission Requirements:** GitHub link required, Demo video required, Casper Network deployment required
**Hackathon Tags:** Agentic AI, DeFi, Real-World Assets, Casper Network, x402, Blockchain, Web3, Rust

**Our GitHub:** https://github.com/leo-jr-hah/casper-rwa-court

---

### What This Project Is

**CASPER RWA Court** is an autonomous, multi-agent dispute resolution system for Real-World Assets (RWAs) built on the Casper Network.

**The problem it solves:** When two parties disagree on what a real-world asset is worth (property, art, commodities), there's no neutral, transparent, fast way to settle it. Traditional appraisals are slow, opaque, and single-opinion. CASPER RWA Court uses **5 independent AI agents** to analyze an asset in parallel, deliberate on the valuation, and produce a verdict — all cryptographically signed and permanently recorded on the Casper blockchain.

**Core flow:**
1. User submits an asset (property address, art piece, or commodity) with an asking price
2. System runs dual-agent valuation (Comparable Sales + DCF/Market/Appraisal)
3. Three juror agents analyze evidence independently (Evidence Reviewer, Trend Analyst, Case Researcher)
4. Agents deliberate with reputation-weighted voting
5. Final verdict is recorded on-chain with full HMAC audit trail
6. All agent-to-agent payments flow via x402 micropayments in CSPR

**Core technologies:**
- **3 Odra Smart Contracts** (Rust → WASM, deployed on Casper Testnet):
  - `ReputationRegistry` — agent identity & reliability scores (0-1000)
  - `EscrowContract` — locks 0.1 CSPR filing fee per dispute
  - `VotingContract` — reputation-weighted on-chain votes (3 verdict options: FullRefund / SplitFifty / FullRelease)
- **5 AI Agent MCP Services** (Node.js + TypeScript + @modelcontextprotocol/sdk v1.16):
  - `ValuationAgentA` (Comparable Sales — port 3001)
  - `ValuationAgentB` (DCF Analysis — port 3002)
  - `EvidenceAnalyst` (Data Validation — port 3003)
  - `TrendAnalyst` (Market Context)
  - `CaseResearcher` (RAG-powered precedent search via vectra)
- **Orchestrator** (Express + WebSocket, port 3011/3010): Routes disputes, manages deliberation, streams agent thoughts in real-time
- **x402 Micropayment Middleware**: Agents gate their services behind HTTP 402 Payment Required. Orchestrator generates payment proofs. Full x402 header/flow implementation with localhost bypass for dev.
- **LLM Pipeline**: MiMo V2 (primary) → Groq llama-3.3-70b (fallback) → Heuristic (15s timeout per call)
- **Data Sources**: RentCast API (real estate comps), Met Museum API (art), CoinGecko (gold/silver/platinum spot), FRED (macro rates)
- **Crypto Verification**: HMAC receipt chains, ZK-Lite execution commitments, SHA-256 audit trail
- **Frontend**: React 19 + Vite + Tailwind v3 dark-mode dashboard with:
  - Landing page with interactive animated story explainer
  - Dashboard with live agent cards, WebSocket status, activity feed
  - Assessment page (split-pane: form + live terminal log + results)
  - Agent reputation registry with interactive graphs
  - Transaction history with on-chain explorer links
  - Architecture "How It Works" page with expandable steps
  - Casper Wallet v2.x integration (connect, sign payments, faucet link)
- **On-Chain Deployments** (Casper Testnet — verified on cspr.live):
  - VotingContract: `f00cbb8f03e468c0750e7ce78bfc7f8a5c337fd520ebc218e969833bdea0fcfb`
  - EscrowContract: `83bf2bab33200e60b092847abc38ea5d0301327fae43fc2d3555fec5be120d3a`
  - ReputationRegistry: `30da84e6d0db566b5d8ba4a93cc392bd2268bff6c24c1c0e5cb16a4f51038942`

**Test suite:** 27/27 tests pass (vitest) — covers HMAC receipt chain integrity, trust scoring, tier assignment, agent orchestration

---

### YOUR TASKS

Please provide a thorough analysis across these 5 sections:

---

## SECTION 1: Project Audit & Hackathon Alignment

Evaluate the project against the Casper Agentic Buildathon requirements:

1. **Technical Completeness** — How well does the project implement each required technology? (Agentic AI, Casper blockchain integration, x402 payments, RWA focus, Rust/Odra smart contracts)
2. **What Works vs What's Demo-Only** — Be honest. Which parts are production-ready vs proof-of-concept vs mock/simulated? Specifically:
   - Are the x402 payments real or simulated?
   - Are the smart contract calls actually hitting testnet or are they local?
   - Is the MCP integration real or does it bypass the protocol?
   - Is the LLM actually reasoning or using heuristic fallbacks?
3. **Gaps** — What's missing that a judge would expect to see? What would raise red flags?
4. **Competitive Positioning** — With 297 hackers participating, how does this project stand out? What's the unique value prop?
5. **Submission Readiness** — What needs to be done before July 1 to have a winning submission? (Demo video, README polish, deployment verification, etc.)

---

## SECTION 2: New Feature Suggestions

Research the current state of the art in:
- Agentic AI systems (multi-agent architectures, agent-to-agent payments, autonomous decision-making)
- RWA tokenization (latest protocols, standards, market trends)
- Casper Network capabilities (recent upgrades, available tools, ecosystem projects)
- x402 protocol (current status, supported chains, real-world implementations)

Based on your research, suggest **5-8 new features** that would significantly strengthen this project for the hackathon. For each feature:

1. **Feature Name**
2. **Why It Matters** — How does it improve the project and impress judges?
3. **Implementation Plan** — Step-by-step technical approach with estimated effort (hours/days)
4. **Dependencies** — What APIs, libraries, or infrastructure are needed?
5. **Risk Assessment** — What could go wrong? How hard is it to get right in 11 days?

Prioritize features that:
- Deepen Casper blockchain integration (not just testnet deploys)
- Showcase genuine agentic AI behavior (not just "call an LLM")
- Demonstrate real x402 payment flows
- Add RWA-specific value (not generic blockchain features)

---

## SECTION 3: Future Roadmap

Create a **6-month post-hackathon roadmap** with:

1. **Phase 1 (Month 1-2): MVP Hardening** — What needs to go from hackathon demo to real product?
2. **Phase 2 (Month 3-4): Market Entry** — How does this become a real business?
3. **Phase 3 (Month 5-6): Scale** — What takes this from niche tool to platform?

For each phase:
- Key milestones
- Feasibility assessment (easy / medium / hard)
- Resource requirements (team size, skills, budget)
- Revenue model viability
- Competitive moat analysis

Also address:
- **Market size** for RWA dispute resolution / valuation
- **Competitors** (who else is doing this? How is this differentiated?)
- **Regulatory considerations** (AI-based financial opinions, blockchain records as evidence)
- **Go-to-market** strategy

---

## SECTION 4: Frontend Redesign — Landing Page

You are now a **Principal Design Engineer from a FAANG company** (think Stripe's design team, Vercel's landing pages, Linear's aesthetic, Apple's clarity).

Analyze the current landing page design and provide a **comprehensive redesign recommendation** based on:

### Current State
The landing page currently has:
- Hero section: "When two parties can't agree on what an asset is worth, Verdict settles it." with two CTA buttons ("See How It Works" / "Value an Asset")
- Interactive story explainer (6 animated scenes showing the dispute flow)
- Security narrative section ("Verifiable, accountable, transparent intelligence")
- Call-to-action to explore architecture

### Design Analysis Required

1. **Visual Hierarchy** — Is the information architecture correct? Does the user understand the product in <5 seconds?
2. **Above the Fold** — What should be the first thing a judge sees when they open the demo?
3. **Trust Signals** — What proof points need to be visible immediately? (Testnet deployments, real API integrations, agent count, etc.)
4. **Motion & Interaction** — How should animations serve the story, not distract from it?
5. **Conversion Flow** — What's the ideal path from "landing" → "understanding" → "trying it" → "impressed"?
6. **Mobile Responsiveness** — Key breakpoints and layout adjustments
7. **Dark Mode Optimization** — The app is dark-mode first. What are the best practices from Linear, Vercel, Raycast?
8. **Typography** — Font choices, sizing scale, display vs body text
9. **Color System** — Primary accent, semantic colors, gradient usage
10. **Component Patterns** — Cards, buttons, inputs, badges that match 2025-2026 design trends

### Provide:
- **Specific CSS/component changes** with code snippets
- **Layout wireframe** (described in text — section-by-section)
- **3 reference designs** from real products that inspire the ideal direction
- **Quick wins** — changes implementable in <2 hours that have maximum visual impact
- **Bold moves** — ambitious redesign ideas if time permits

---

## SECTION 5: Technical Debt & Code Quality

Based on the codebase described above, identify:

1. **Architecture issues** — Are there structural problems that will hurt scalability?
2. **Security concerns** — Private key handling, API key exposure, injection risks
3. **Performance bottlenecks** — Where will things break under load?
4. **Testing gaps** — What's untested that should be tested?
5. **Documentation gaps** — What would a new developer struggle with?
6. **Dependency risks** — Any packages that are deprecated, vulnerable, or poorly maintained?

For each issue, provide:
- Severity (Critical / High / Medium / Low)
- Fix effort (hours)
- Recommended solution

---

### OUTPUT FORMAT

Please structure your response as a structured report with clear headers, prioritized recommendations, and actionable next steps. Use tables where appropriate. Be brutally honest — we'd rather fix problems now than have judges find them.

End your report with a **Top 5 Action Items** list ranked by impact-per-effort ratio — what should we do in the next 48 hours to maximize our chances?

---

## PROMPT END
