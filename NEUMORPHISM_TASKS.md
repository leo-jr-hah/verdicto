# Neumorphism Redesign — Task Tracker

Reference: `neumorphism_redesign_plan.md` (2737 lines)

---

## Phase 1: Design Tokens & Global Setup

- [x] 1.1 Replace `tokens.css` with neumorphic token system (light + dark mode, backward-compat aliases)
- [x] 1.2 Create `styles/neumorphism.css` — all utility classes (nm-extruded, nm-inset, nm-input, nm-card, nm-terminal, nm-badge, nm-tab, nm-divider, nm-focus, nm-scroll, nm-text-extruded, nm-nested, nm-icon-well, nm-extruded-primary)
- [x] 1.3 Update `index.css` — replace Google Fonts import (Plus Jakarta Sans + DM Sans + JetBrains Mono), import neumorphism.css, update body base styles

## Phase 2: Core Layout & Navigation

- [x] 2.1 Sidebar CSS — extruded appearance, nav links with inset active state, section titles, logo hover
- [x] 2.2 Sidebar footer — faucet link, theme toggle (extruded circular), wallet button area
- [x] 2.3 Sidebar collapse handle — extruded circular
- [x] 2.4 Mobile header — extruded bar, menu button (extruded), logo
- [x] 2.5 Mobile menu overlay — extruded panel, menu links with inset active
- [x] 2.6 Mobile bottom nav — extruded floating bar, inset active tab

## Phase 3: Landing Page Components

- [x] 3.1 HeroSection — warm base bg, extruded text effect, primary CTA, secondary CTA, decorative circles
- [x] 3.2 StatsBar — extruded panel, extruded stat number displays, inset dividers
- [x] 3.3 AgentGrid + AgentCard — extruded cards, inset icon wells, extruded trust badges, hover lift
- [x] 3.4 ContractCards — extruded cards, inset hash wells, extruded status dots
- [x] 3.5 HowItWorks — extruded step cards, extruded number badges, inset connectors
- [x] 3.6 TestnetProof — extruded panel, inset hash wells, extruded badges
- [x] 3.7 X402PaymentFlow — extruded step boxes, inset connectors
- [x] 3.8 OracleSection — extruded cards, inset content areas
- [x] 3.9 Footer — inset panel, extruded social icon wells, extruded link pills
- [x] 3.10 ArchitectureDiagram — extruded container, SVG shadow filters
- [x] 3.11 Backgrounds.tsx — concentric extruded/inset circles
- [x] 3.12 UIComponents.tsx — shared neumorphic primitives

## Phase 4: Shared Components

- [x] 4.1 WalletConnectButton — extruded-primary (disconnected), extruded (connected), inset (connecting), collapsed variant
- [x] 4.2 ConnectionStatus — extruded status dot, inset container
- [x] 4.3 DemoModeBanner — extruded banner, extruded icon well, extruded close button
- [x] 4.4 PaymentModal — extruded card, inset header, extruded amount panel, extruded-primary confirm, extruded cancel
- [x] 4.5 MultiMethodologyDashboard — extruded methodology cards, inset-deep icon wells, inset confidence track + extruded fill
- [x] 4.6 X402PaymentStream — extruded step nodes, inset active, inset connectors
- [x] 4.7 LiveContractPanel — extruded panel, inset hash well, extruded status badge, inset-deep log
- [x] 4.8 AgentExplainer — extruded panel, extruded avatar well, inset trust score
- [x] 4.9 Tooltip — extruded container
- [x] 4.10 Logo — optional extruded well
- [x] 4.11 ErrorBoundary — extruded panel, extruded icon well, inset error details

## Phase 5: Dashboard & Tool Pages

- [x] 5.1 DashboardView — extruded metric cards with inset icon wells, extruded quick actions, extruded activity list
- [x] 5.2 AssessView — extruded sections, asset type selector cards (extruded/inset), inset inputs, inset-deep terminal, extruded-primary CTA
- [x] 5.3 BorrowView — extruded LTV calculator, extruded loan cards, inset inputs, extruded-primary CTA
- [x] 5.4 InsureView — inset risk inputs, extruded premium display, extruded policy cards, extruded-primary CTA
- [x] 5.5 PredictionView — extruded confidence panel, inset circular gauge, extruded chart panel, extruded tab buttons

## Phase 6: Supporting Pages

- [x] 6.1 ReputationView — extruded agent cards, inset avatar wells, extruded trust badges, inset score tracks
- [x] 6.2 TransactionsView — extruded filter buttons, extruded TX cards, inset hash wells, extruded status badges
- [x] 6.3 HowItWorksView — extruded step cards, extruded number badges
- [x] 6.4 ArchitectureView — extruded diagram panel, extruded component cards
- [x] 6.5 RoadmapView — inset timeline track, extruded milestone circles, extruded cards
- [x] 6.6 OracleView — extruded feed cards, extruded value panels, extruded status dots
- [x] 6.7 DisputesView — extruded case cards, inset-deep deliberation panel, extruded juror wells, extruded-primary verdict

## Phase 7: Landing Page Final Pass

- [x] 7.1 Verify hero extruded text effect
- [x] 7.2 Verify background decorative elements
- [x] 7.3 Verify CTA button prominence
- [x] 7.4 Verify overall visual hierarchy

## Phase 8: Mobile Verification

- [x] 8.1 Shadow scaling at 768px breakpoint
- [x] 8.2 44px minimum tap targets
- [x] 8.3 Sidebar hidden, mobile header visible
- [x] 8.4 Bottom navigation renders
- [x] 8.5 Mobile menu slides smoothly
- [x] 8.6 Cards stack vertically
- [x] 8.7 No horizontal overflow
- [x] 8.8 Assessment flow works on mobile
- [x] 8.9 Payment modal fits screen

## Phase 9: Dark Mode Verification

- [x] 9.1 Dark mode tokens apply correctly
- [x] 9.2 Shadows invert properly
- [x] 9.3 Text colors swap correctly
- [x] 9.4 Accent color brightens
- [x] 9.5 All components render in dark mode
- [x] 9.6 Toggle works, preference saved

## Phase 10: Build & Polish

- [x] 10.1 Run `npm run build` — zero errors
- [ ] 10.2 Visual QA — all pages
- [ ] 10.3 Performance — will-change on animated elements
- [ ] 10.4 Accessibility — focus rings, contrast, keyboard nav
