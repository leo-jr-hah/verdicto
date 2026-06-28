# Verdicto — Landing Page Content Specification

> **Audience:** Enterprise buyers, institutional asset managers, DeFi protocol teams, blockchain infrastructure partners.
> **Tone:** Authoritative. Technical precision. No metrics that aren't real. No filler.
> **Sections:** 4 total (Hero is separate, owned by the existing Hero component).

---

## Section 01 — THE PROBLEM

**Headline:**
Real-world assets are a $400 trillion market. Valuation is still broken.

**Subheadline:**
A single appraiser. A subjective opinion. Weeks of turnaround. No audit trail. No recourse. The largest asset class on earth runs on trust — and trust doesn't scale.

**Body (2–3 sentences):**
Verdicto replaces subjective, single-point appraisals with a multi-agent AI system that independently analyzes assets, deliberates through a structured jury process, and records every decision on-chain. Every step — from raw input to final verdict — is captured in an HMAC-signed receipt chain: a tamper-evident, cryptographically linked audit trail where each receipt references the previous one. The result is a valuation you can verify, not one you have to take on faith.

**Visual direction:** Dark, minimal. Could be a subtle split-screen showing "old way" (paper appraisal document, single signature) vs. "new way" (on-chain receipt, multiple agent badges). Or simply strong typography with no image — let the words carry weight.

---

## Section 02 — THE PLATFORM

**Headline:**
Four products. One analytical engine.

**Subheadline:**
Every product on Verdicto runs on the same multi-agent valuation and deliberation infrastructure. Assess an asset, borrow against it, insure it, or resolve a dispute — the underlying process is identical: independent AI agents analyze, a jury deliberates, and the verdict is recorded on Casper.

**Product Cards (4 items):**

| Product | One-liner | What happens |
|---------|-----------|-------------|
| **Assess** | Multi-agent asset valuation | Two independent AI analysts value the same asset using different methodologies — comparable sales, DCF, income approach. A three-juror panel deliberates and votes. Every deliberation step is HMAC-signed and chained to the previous receipt, producing a tamper-evident audit trail. Consensus verdict stored on-chain. |
| **Borrow** | Collateralized lending against assessed assets | Use an assessment as collateral. AI determines loan-to-value ratio based on agent confidence and value divergence. Real CSPR disbursement. Autonomous keeper monitors collateral health continuously. |
| **Insure** | AI-underwritten asset insurance | AI generates a risk score, premium, and coverage terms based on the same valuation data. File claims with automatic revaluation — if value has dropped, the system pays out. |
| **Predict** | Event-driven oracle resolution | Ask any yes/no question about future outcomes. Independent AI analysts research and forecast. Oracle resolves on-chain. Disputable through the same jury process. |

**Visual direction:** Four cards or a 2×2 grid. Each card has a product name, the one-liner, and a subtle icon or glyph. No screenshots — this is a positioning section, not a product tour.

---

## Section 03 — THE TECHNOLOGY

**Headline:**
Built for verifiability, not just functionality.

**Subheadline:**
Every agent execution is receipted. Every payment is on-chain. Every verdict is disputeable. Verdicto is not a black box with a nice UI — it is an auditable pipeline where every step can be independently verified.

**Technology Pillars (4 items):**

| Pillar | What it is |
|--------|-----------|
| **Multi-Agent Deliberation** | Independent AI agents — each with a distinct analytical philosophy (comparable sales vs. fundamentals) — analyze the same asset in parallel. A three-juror panel (evidence analyst, market data interpreter, precedent researcher) deliberates and votes. No single agent controls the outcome. |
| **On-Chain Audit Trail** | Every deliberation step produces an HMAC-SHA256 signed receipt. Each receipt contains SHA-256 hashes of the juror's input evidence, output decision, and reasoning — making every piece of the deliberation independently verifiable. Receipts are chained: each one references the `receiptId` of the previous, forming a tamper-evident linked list. The chain is verified end-to-end using timing-safe comparison — any break or tampering is detected immediately. Execution commitments are anchored to Casper block heights. Every verdict can be traced back to the exact inputs and reasoning that produced it. |
| **x402 Micropayments** | Every API call is gated by on-chain payment verification. Users pay per action in CSPR — no accounts, no subscriptions, no API keys. Deploy hashes are verified against CSPR.cloud before execution proceeds. Fail-closed by design. |
| **On-Chain Smart Contracts** | Three deployed Odra contracts on Casper: VotingContract (jury voting), ReputationRegistry (agent trust tiers), VerdictOracle (verdict storage and dispute resolution). Written in Rust, compiled to WASM, deployed on Casper testnet. |

**Supporting details (small text or secondary row):**

- **LLM Pipeline:** MiMo V2 (primary) - Groq Llama 3.3 70B (fallback) - deterministic heuristic (final fallback). Every fallback is flagged in the UI.
- **Data Sources:** RentCast (real estate comps), Met Museum API (fine art provenance), CoinGecko (commodity spot prices), FRED / Federal Reserve (macro context — interest rates, CPI).
- **Trust Framework:** Five-dimension agent scoring — identity verification, execution consistency, output similarity, economic stake, challenge-response verification. Agents earn tiers: Bronze - Silver - Gold - Platinum.
- **Persistence:** Supabase (PostgreSQL) for production data. Dual-write to local JSON for development. All tables indexed and schema-versioned.

**Visual direction:** This section should feel technical and precise. Could use a layered architecture diagram (Frontend - Orchestrator - Agent Layer - Shared Layer - Casper Blockchain) or a horizontal pipeline showing the flow: Asset Submitted - Agents Analyze - Jury Deliberates - Verdict Recorded - Receipt Anchored. Keep it clean — no stock photos.

---

## Section 04 — WHO IT'S FOR

**Headline:**
For teams that need valuation they can defend.

**Subheadline:**
Verdicto is built for organizations where "we trust our appraiser" is no longer sufficient — where valuations need to be auditable, reproducible, and backed by a transparent process that can withstand scrutiny.

**Audience Segments (3–4 items):**

| Segment | Why they need this |
|---------|-------------------|
| **Asset Managers & Fund Operators** | Managing portfolios of real-world assets (real estate, art, commodities) requires independent, documented valuations for NAV reporting, investor disclosures, and regulatory compliance. Verdicto provides a multi-agent process with a full HMAC-chained audit trail — every deliberation step is cryptographically signed and linked, not a single appraiser's opinion. |
| **DeFi Protocols & Lending Platforms** | RWA-collateralized lending is growing, but protocols need reliable, on-chain valuation oracles to set LTV ratios and trigger liquidations. Verdicto's assessment pipeline produces verifiable valuations with confidence scores and divergence metrics — backed by HMAC-receipted deliberation chains that protocols can independently verify before accepting a valuation. |
| **Insurance Underwriters** | Traditional asset insurance relies on periodic manual appraisals. Verdicto enables continuous, AI-driven risk assessment with automatic revaluation — reducing the gap between policy issuance and the next formal appraisal. |
| **Blockchain Infrastructure Partners** | Casper-native. Verdicto demonstrates what's possible on Casper: smart contracts in Rust/WASM, HMAC-chained receipt audit trails, x402 micropayments, and a multi-agent system where every execution step is cryptographically receipted and anchored to block heights. |

**Closing line (optional, for the bottom of this section or the CTA):**
Verdicto is live on Casper Testnet. The full pipeline — from asset submission to on-chain verdict — is operational.

**Visual direction:** Clean list or card layout. No logos (we don't have partner logos yet). Typography-forward. Could use subtle icons for each segment. The emphasis is on the specificity of the use cases, not visual flair.

---

## Notes for Implementation

- **No fake metrics.** Do not include numbers like "2,847+ valuations" or "5 AI agents running" unless they are real and current. This section spec deliberately excludes metrics.
- **No screenshots until they exist.** Product images should be placeholder UI components (as currently implemented) or strong typography. Do not use stock images.
- **Enterprise tone throughout.** Every sentence should sound like it was written for a CTO or head of risk, not a crypto Twitter audience. No exclamation marks. No "revolutionary." No "game-changing."
- **Hero section is untouched.** The existing Hero ("Intelligence Scales Better Than Trust") is strong and stays as-is. These 4 sections follow it.
- **Section numbering on the page:** 01, 02, 03, 04 — displayed as small labels (like "01 — THE PROBLEM") to reinforce the structured, deliberate feel.
