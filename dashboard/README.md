# Verdicto Dashboard

React 19 frontend for the Verdicto platform — AI-powered RWA valuation, lending, insurance, prediction markets, and dispute resolution on Casper.

## Tech Stack

- **React 19** + TypeScript + Vite
- **Tailwind CSS v3** (dark mode default)
- **motion** (NOT framer-motion) for animations
- **GSAP** + @gsap/react + use-scramble (landing page effects)
- **Lucide React** for icons
- **casper-js-sdk v5** for blockchain interaction
- **Casper Wallet SDK** (window.CasperWalletProvider)

## Routes

| Route | Layout | Description |
|-------|--------|-------------|
| `/` | LandingLayout (top-nav) | Premium landing page with GSAP effects |
| `/dashboard` | Layout (sidebar) | Portfolio overview |
| `/assess` | Layout (sidebar) | Asset valuation (2.5 CSPR fee) |
| `/borrow` | Layout (sidebar) | Borrow against assessments (5 CSPR fee) |
| `/insure` | Layout (sidebar) | Insure assets against loss (3 CSPR fee) |
| `/predict` | Layout (sidebar) | Prediction market (1 CSPR fee) |
| `/oracle` | Layout (sidebar) | Verdict dashboard (read-only) |
| `/disputes` | Layout (sidebar) | Challenge verdicts (5 CSPR stake) |
| `/reputation` | Layout (sidebar) | Agent reputation scores |
| `/transactions` | Layout (sidebar) | Transaction history |
| `/how-it-works` | Layout (sidebar) | System explainer |
| `/architecture` | Layout (sidebar) | Technical architecture |
| `/roadmap` | Layout (sidebar) | Product roadmap |

## Key Components

### Landing Page (`LandingPage.tsx`)
- `HeroSection` — Particle canvas, scramble text, CTA buttons
- `StatsBar` — Animated counters
- `HowItWorks` — 5-step flow explanation
- `AgentGrid` — Agent cards with methodology details
- `ArchitectureDiagram` — "How the Oracle Gets Fed" visual
- `OracleSection` — Oracle composability explainer
- `X402PaymentFlow` — Payment flow visualization
- `LiveAssessmentVisual` — 5-step animated asset valuation sequence
- `TestnetProof` — On-chain proof display
- `ContractCards` — Smart contract details
- `BlockchainRecord` — Receipt chain visualization
- `CTASection` — Call to action
- `Navigation` — Top nav with smooth scroll
- `Footer` — Links and social

### App Pages
- **DashboardView** — Portfolio overview, stats grid
- **AssessView** — Multi-methodology dashboard, agent cards, divergence range, risk flags
- **BorrowView** — 6-step loan wizard (select assessment → configure LTV → sign → disburse → monitor)
- **InsureView** — 6-step insurance wizard (select asset → risk score → premium → sign → policy → monitor)
- **PredictionView** — Yes/No questions, 3-agent consensus, probability cards
- **OracleView** — Verdict list, stats, oracle health
- **DisputesView** — Challenge verdicts, re-trial results, stake distribution
- **ReputationView** — Agent trust scores, tier badges, history sparklines
- **TransactionsView** — Payment history with explorer links
- **HowItWorksView** — System explainer
- **ArchitectureView** — Technical architecture
- **RoadmapView** — Product roadmap

### Wallet Integration
- `CSPRClickContext` — Wallet provider using window.CasperWalletProvider
- `WalletConnectButton` — Connect/disconnect, copy address, faucet link
- `PaymentModal` — Shows fee before signing, handles CSPR transfer (shared by all products)

## Design System

### Colors
- **Primary:** #FF3B3B (Casper red)
- **Success:** #10B981 (green)
- **Warning:** #F59E0B (amber)
- **Info:** #3B82F6 (blue)
- **Background:** bg-gray-950 (dark mode default)

### Typography
- **Display:** Geist, Inter
- **Body:** Inter
- **Monospace:** JetBrains Mono (for hashes)

### Components
- Glass morphism cards (backdrop-filter blur)
- Animated transitions using motion
- Consistent spacing (0.5rem, 0.75rem, 1rem, 1.5rem)
- Border radius: 4px (minimal), 6px (small), 8px (medium), 12px (large)

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
# → http://localhost:5173

# Build for production
npm run build

# Preview production build
npm run preview
```

## Environment Variables

```env
VITE_CASPER_RPC_URL=https://node.testnet.cspr.cloud/rpc
VITE_CASPER_NETWORK=testnet
VITE_PLATFORM_WALLET=02039cd256da1f2e13fc24a6f2ad1c15166f45070befa52bc2da46bbe194e7381010
VITE_ASSESSMENT_FEE=2500000000
VITE_PREDICTION_FEE=1000000000
VITE_ORCHESTRATOR_URL=https://verdicto-production.up.railway.app
VITE_WS_URL=wss://verdicto-production.up.railway.app/ws
```

## Project Structure

```
dashboard/
├── src/
│   ├── pages/
│   │   ├── LandingPage.tsx       # Premium landing with GSAP effects
│   │   ├── DashboardView.tsx     # Portfolio overview
│   │   ├── AssessView.tsx        # Asset valuation
│   │   ├── BorrowView.tsx        # Borrow against assessments
│   │   ├── InsureView.tsx        # Insure assets
│   │   ├── PredictionView.tsx    # Prediction market
│   │   ├── OracleView.tsx        # Verdict dashboard
│   │   ├── DisputesView.tsx      # Challenge verdicts
│   │   ├── ReputationView.tsx    # Agent reputation
│   │   ├── TransactionsView.tsx  # Transaction history
│   │   ├── HowItWorksView.tsx    # System explainer
│   │   ├── ArchitectureView.tsx  # Technical architecture
│   │   └── RoadmapView.tsx       # Product roadmap
│   ├── layouts/
│   │   ├── LandingLayout.tsx     # Top-nav (landing page only)
│   │   └── Layout.tsx            # Sidebar (all other pages)
│   ├── contexts/
│   │   └── CSPRClickContext.tsx   # Wallet provider
│   ├── hooks/
│   │   ├── useAssessment.ts      # Assessment state machine
│   │   ├── useLoan.ts            # Loan lifecycle
│   │   ├── useInsurance.ts       # Insurance policy management
│   │   └── usePaymentFlow.ts     # CSPR payment signing
│   ├── components/
│   │   ├── WalletConnectButton.tsx
│   │   ├── PaymentModal.tsx
│   │   ├── MultiMethodologyDashboard.tsx
│   │   ├── ReputationGraph.tsx
│   │   ├── LiveContractPanel.tsx
│   │   ├── ConnectionStatus.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── landing/              # 18 landing page components
│   │   └── story/                # Interactive story explainer
│   ├── services/
│   │   └── api.ts                # All backend API calls
│   ├── config/
│   │   └── casper.ts             # Fees, wallet address, RPC URL
│   ├── App.tsx                   # Router setup
│   └── main.tsx                  # Entry point
├── public/
├── package.json
├── vite.config.ts
└── vercel.json
```

## Key Files

- `src/contexts/CSPRClickContext.tsx` — Wallet provider (CasperWalletProvider API)
- `src/components/WalletConnectButton.tsx` — UI button with dropdown
- `src/components/PaymentModal.tsx` — Shared payment modal (all products)
- `src/layouts/Layout.tsx` — Sidebar navigation with all routes
- `src/services/api.ts` — All backend API calls + types
- `src/config/casper.ts` — Single source of truth for fees, wallet address
