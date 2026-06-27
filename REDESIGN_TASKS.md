# Verdicto Technical Brutalism Redesign — Task Tracker

## Phase 1: Foundation
- [x] 1.1 Rewrite `tokens.css` — new brutalism tokens (colors, spacing, typography, shadows, radius, animation)
- [x] 1.2 Rewrite `neumorphism.css` → `brutalism.css` — new utility classes (grid, data-panel, buttons, LED indicators, border-trace, 200+ utility classes)
- [x] 1.3 Update `index.css` — import new fonts (Geist), remove old neumorphism imports, add component classes
- [x] 1.4 Font import via tokens.css (Google Fonts Geist + Geist Mono)

## Phase 2: Layout Shell
- [x] 2.1 Rewrite `Layout.tsx` CSS — brutalist sidebar (1px borders, sharp radius, no shadows)

## Phase 3: Landing Page
- [x] 3.1 Hero section — left-aligned, monospace badge, brutalist proof bar
- [x] 3.2 HowItWorks — step cards with borders, monospace labels, brutalist form preview
- [x] 3.3 StatsBar — borders, mono font, uppercase labels
- [x] 3.4 Oracle section — feature cards with borders, use cases, code card
- [x] 3.5 Agent grid — agent cards with borders, mono labels
- [x] 3.6 X402 section — diagram card, node cards with borders
- [x] 3.7 Contract cards — bordered cards, mono names
- [x] 3.8 Testnet terminal — bordered terminal, mono labels
- [x] 3.9 Footer — bordered, mono column headers, social icons with borders

## Phase 4: Dashboard & Core Pages
- [x] 4.1 Card/stat-card/section/page-header CSS brutalist
- [x] 4.2 All hardcoded values tokenized (font-size, font-weight, gap, padding, margin, border-radius, letter-spacing)

## Phase 5: Shared Components
- [x] 5.1 WalletConnectButton, PaymentModal, AgentExplainer CSS — converted to brutalism utility classes

## Phase 6: Cleanup & Build
- [x] 6.1 Remove all `--nm-*` references from codebase (0 remaining)
- [x] 6.2 Remove all neumorphism.css imports
- [x] 6.3 Replace hardcoded colors/fonts/spacing/radius with token references
- [x] 6.4 Em dashes removed from user-facing text
- [x] 6.5 Build passes clean
- [x] 6.6 Git commit (2 commits: 81e8257, c32b475)
