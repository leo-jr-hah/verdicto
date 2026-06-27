# Verdicto - Product Demo Script

**Product Summary:** Verdicto is an AI-powered platform for valuing, lending against, insuring, and monitoring real-world assets on the Casper blockchain. Multiple independent AI agents analyze each asset using different methodologies, deliberate as a jury, and produce a consensus valuation recorded on-chain. The platform covers the full lifecycle — from appraisal to lending to insurance to dispute resolution — all driven by AI.

**Target Audience:** Finance professionals, asset managers, DeFi builders, and anyone dealing with real-world asset valuation and collateral management.

**Total Runtime:** ~4 minutes 50 seconds

---

## Script

| Time | What to Show on Screen | What to Say |
|------|----------------------|-------------|
| **0:00 - 0:12** | Screen recording starts on the Verdicto landing page at `verdicto.app`. Show the full page with animated hero, then scroll slowly to the "How It Works" section showing the 4-step flow. Dark mode active. | "Valuing a real-world asset — a building, a painting, a gold bar — usually takes weeks, costs thousands, and comes down to one person's opinion. Verdicto changes that. Multiple AI analysts independently evaluate the same asset, compare their findings, and reach a consensus — all in under a minute. Here's the platform." |
| **0:12 - 0:35** | Click "Launch App" in the landing page hero. The dashboard loads showing the sidebar on the left with all navigation items. Point the cursor at each section briefly. Then move to the dashboard center showing the quick action cards, live transaction feed, and oracle stats at the top. | "This is the dashboard. You connect through your Casper Wallet — your identity is your key, and every action is recorded on-chain. The sidebar gives you access to the full suite: asset valuation, lending, insurance, prediction markets, an on-chain oracle, and a dispute system. Every product runs on the same analytical engine." |
| **0:35 - 1:05** | Click "Value Asset" in the sidebar. The Assess page loads. The asset type selector shows three cards: Real Estate, Fine Art, Commodity. Click "Fine Art." The form fills with a demo: "Basquiat Untitled (Skull), 1981" with description, asking price of $120M, artist/medium fields. Point to the demo asset cards on the side showing pre-loaded examples. | "Let's value an asset. You pick a category — real estate, art, or commodity — and describe what you're looking at. I'll use this demo: a Basquiat painting with an asking price of a hundred twenty million. When you're ready, you approve a small fee and the analysis begins." |
| **1:05 - 1:50** | Click "Assess Asset" button. The PaymentModal appears. Click "Approve & Sign." The live agent log panel ("Under the Hood") starts scrolling on the right side of the screen. Show the terminal-style log with colored status icons. On the left, the result card appears with a large assessed value number, divergence percentage, and the asking vs. assessed comparison. | "While the analysis runs, you can watch every step in real time — data being fetched, models being applied, comparisons being made. On the left, the result comes in. Two independent valuations — one based on comparable sales, the other on projected value — and they're close. The platform shows you exactly where they agree and where they diverge, with the final consensus value front and center." |
| **1:50 - 2:25** | Scroll down on the assessment results page to show the Multi-Methodology Dashboard. Show the 5 agent cards. Each shows their methodology, value, confidence score, and reasoning. Point to the divergence indicator. Then scroll to show the "Court Verdict" section with the final decision and on-chain receipt hash. | "This is what makes it more than a simple price lookup. Each analyst works independently using a different methodology — comparable sales, discounted cash flow, market conditions, historical precedent. Then a panel of reviewers checks the work: data quality, market context, and historical cases. Every analyst explains their reasoning, and the final verdict is weighted by each one's track record. Every step is cryptographically signed and recorded." |
| **2:25 - 2:55** | Navigate to "Borrow" in the sidebar. The Borrow page loads showing a 4-step wizard. Select "Real Estate" and the form populates with the Austin office tower demo. Advance through the steps — the AI assessment runs, then the loan terms panel appears. Click "Disburse Loan" and the PaymentModal appears with 5 CSPR fee. Approve it. The loan card appears with a health bar showing "Healthy" status. | "Now let's put that valuation to work. Borrow lets you take a loan against any assessed asset. I'll select this Austin office tower. The system runs a fresh assessment, then calculates loan terms based on the asset type, market conditions, and analyst confidence. When I approve, real CSPR is disbursed on-chain and the collateral is locked. The health of the loan is monitored continuously." |
| **3:00 - 3:25** | Navigate to "Insure" in the sidebar. The Insure page loads with a 3-step wizard. Select "Commodity" — the LBMA Gold Bar demo populates. Show the coverage slider, the AI risk assessment panel, and the premium calculation. Approve the 3 CSPR payment. The policy card appears showing active status, coverage amount, and deductible. | "Insure follows the same pattern. I'll pick this gold bar. The system evaluates volatility, storage conditions, and market exposure to produce a risk profile that determines your premium. Coverage, deductible, and tier are all calculated from the analysis. When you file a claim, the asset is re-evaluated at that moment — if the loss is real, payout happens automatically." |
| **3:25 - 3:50** | Navigate to "Confidence" in the sidebar. The Confidence page loads showing a prediction market interface. Show the demo questions. Select the gold price question. The timeframe selector shows options. Approve the 1 CSPR payment. The result appears with a large animated probability ring showing a percentage, a verdict label, and individual probability bars for each agent. | "Confidence turns the valuation engine into a prediction market. Ask a yes-or-no question — will this property sell above a certain price, will gold hit a threshold, will appreciation outpace a target. The analysts weigh in independently, and you get a consensus probability backed by real market data. One CSPR per query." |
| **3:50 - 4:15** | Navigate to "Oracle" in the sidebar. The Oracle page loads showing the on-chain price feed. Show the stats bar at the top. Scroll down to the verdict cards — each shows asset name, assessed value, confidence score, freshness badge, and expiry countdown. Click on one verdict to expand it. Then click "View Code" to show the integration snippet. | "This is the Oracle — the backbone of the platform. Every assessment becomes a verifiable, on-chain price feed that any dApp on Casper can query. Verdicts stay fresh for 24 hours, and the system automatically requests new assessments when they expire. It's first-party data with full audit trails — no third-party dependencies." |
| **4:20 - 4:50** | Navigate to "Disputes" in the sidebar. The Disputes page loads showing the Oracle verdicts at the top and active disputes below. Click "Challenge" on one of the verdicts. A reason modal appears — type a brief dispute reason. Click submit. The PaymentModal shows 5 CSPR dispute stake. Approve it. The dispute appears in the list below. Expand it to show the re-trial results. | "And if you think the Oracle got it wrong, you can challenge it. Stake a small amount, provide your reasoning, and the system triggers a completely fresh analysis. If the challenge holds up, you get your stake back and the verdict is updated. If not, the stake is forfeited. It's a self-correcting system — no central authority needed." |
| **4:50 - 5:15** | Navigate to "Agents" in the sidebar. The Reputation page loads showing 5 agent profile cards in a grid. Each shows their specialty, methodology, performance scores, total assessments, and success rate. Click on one to expand its detail panel. Then navigate to "History" showing the full transaction ledger with colored type badges. | "Every analyst has a public track record. You can see how each one performs across different asset types, and that performance directly influences how much weight their analysis carries in future verdicts. The History page ties it all together — a complete audit trail of every valuation, payment, and decision on the platform, all verifiable on-chain." |

---

## Pacing Check

| Section | Duration | Word Count | Words/Min (natural pace) |
|---------|----------|------------|--------------------------|
| Opening hook | 12s | 52 | 260 |
| Dashboard overview | 23s | 52 | 136 |
| Assessment setup | 30s | 49 | 98 |
| Assessment results (standout) | 45s | 67 | 89 |
| Borrow walkthrough | 30s | 64 | 128 |
| Insure walkthrough | 25s | 59 | 142 |
| Confidence walkthrough | 25s | 52 | 125 |
| Oracle walkthrough | 25s | 52 | 125 |
| Disputes walkthrough | 30s | 58 | 116 |
| Agents & History (closing) | 25s | 56 | 134 |
| **Total** | **~4:50** | **621** | **~129 avg** |

**Verdict:** 621 words of voiceover. At a natural speaking pace of 150-170 wpm, the voiceover alone runs 3:42–4:11. Combined with pauses, transitions, and letting the UI breathe, the total lands right at the 5-minute target. The assessment walkthrough — the core differentiator — gets the most screen time at 45 seconds. All seven products are covered naturally without feeling like a checklist.

---

## Recording Notes

1. **Pre-load demo assets** before recording. The Basquiat painting, Austin office tower, and gold bar should already be populated when you click them. For Confidence, pre-load the gold price question.
2. **Use dark mode** throughout — it looks more polished on camera.
3. **Wallet should be pre-connected** before recording starts. Don't show the connection flow — it adds dead time.
4. **Speed up the agent processing** if needed in post. The "Under the Hood" log should feel fast, not sluggish.
5. **Mouse cursor** should move deliberately and pause on key elements. Don't rush through clicks.
6. **No voiceover during transitions** — let the UI animations breathe for 1-2 seconds between sections.
7. **End on the History page** showing the full transaction ledger. It's the strongest visual proof that everything is real and auditable.
8. **Confidence page** — the probability ring animation is the visual highlight. Let it animate fully before moving on.
