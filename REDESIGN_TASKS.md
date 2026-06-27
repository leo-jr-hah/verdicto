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
- [ ] 3.3 Other landing components (StatsBar, OracleSection, etc.)

## Phase 4: Dashboard & Core Pages
- [x] 4.1 Card/stat-card/section/page-header CSS brutalist
- [ ] 4.2 Page inline styles → utility classes (functional with tokens, cosmetic cleanup remaining)

## Phase 5: Shared Components
- [ ] 5.1 WalletConnectButton, PaymentModal, AgentExplainer CSS

## Phase 6: Cleanup & Build
- [x] 6.1 Remove all `--nm-*` references from codebase (0 remaining)
- [x] 6.2 Remove all neumorphism.css imports
- [x] 6.3 Replace hardcoded colors/fonts/spacing/radius with token references
- [x] 6.4 Em dashes removed from user-facing text
- [x] 6.5 Build passes clean
- [ ] 6.6 Git commit
