# Casper RWA Court Dashboard

React 19 frontend for the Casper RWA Court multi-agent dispute resolution system.

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
| `/` | LandingLayout (top-nav) | Premium landing page with particle effects |
| `/dashboard` | Layout (sidebar) | Live contract state + x402 payment stream |
| `/assess` | Layout (sidebar) | Asset valuation (2.5 CSPR fee) |
| `/predict` | Layout (sidebar) | Prediction market (1 CSPR fee) |
| `/reputation` | Layout (sidebar) | Agent reputation scores |
| `/transactions` | Layout (sidebar) | Transaction history |
| `/architecture` | Layout (sidebar) | How it works |
| `/roadmap` | Layout (sidebar) | Product roadmap |

## Key Components

### Landing Page (`LandingPage.tsx`)
- `ParticleField` - Canvas particles with mouse repulsion + connections
- `GradientOrb` - Pulsing radial gradient blobs
- `ScrambleText` - use-scramble hook on hero headline
- `AnimatedNumber` - Counts up when scrolled into view
- `Reveal` - Scroll-triggered fade animations
- `LiveAssessmentVisual` - 5-step animated asset valuation sequence
- `StickyScrollSection` - Horizontal scroll with pinned container
- `CursorGlow` - Subtle radial gradient follows mouse
- Scroll progress bar at top

### App Pages
- **DashboardView** - Stats grid, agent reputation table, x402 payment stream
- **AssessView** - Multi-methodology dashboard, 5 agent cards, divergence range, risk flags
- **PredictionView** - Probability cards, weighted consensus, risk factors
- **ReputationView** - Accordion tabs, score history sparklines, tier badges
- **RoadmapView** - 16 features across 4 categories

### Wallet Integration
- `CSPRClickContext` - Wallet provider using window.CasperWalletProvider
- `WalletConnectButton` - Connect/disconnect, copy address, faucet link
- `PaymentModal` - Shows fee before signing, handles CSPR transfer

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

# Run tests
npm test
```

## Environment Variables

```env
VITE_CASPER_RPC_URL=https://node.testnet.cspr.cloud/rpc
VITE_CASPER_NETWORK=testnet
VITE_PLATFORM_WALLET=02039cd256da1f2e13fc24a6f2ad1c15166f45070befa52bc2da46bbe194e7381010
VITE_ASSESSMENT_FEE=2500000000
VITE_PREDICTION_FEE=1000000000
```

## Project Structure

```
dashboard/
├── src/
│   ├── pages/
│   │   ├── LandingPage.tsx      # Premium landing with GSAP effects
│   │   ├── DashboardView.tsx    # Live contract state
│   │   ├── AssessView.tsx       # Asset valuation
│   │   ├── PredictionView.tsx   # Prediction market
│   │   ├── ReputationView.tsx   # Agent reputation
│   │   ├── RoadmapView.tsx      # Product roadmap
│   │   ├── TransactionsView.tsx # Transaction history
│   │   └── ArchitectureView.tsx # How it works
│   ├── layouts/
│   │   ├── LandingLayout.tsx    # Top-nav (landing page only)
│   │   └── Layout.tsx           # Sidebar (all other pages)
│   ├── contexts/
│   │   └── CSPRClickContext.tsx  # Wallet provider
│   ├── components/
│   │   ├── WalletConnectButton.tsx
│   │   ├── PaymentModal.tsx
│   │   ├── AgentCard.tsx
│   │   └── ... (other UI components)
│   ├── config/
│   │   └── casper.ts            # Wallet address, fees, RPC URL
│   ├── App.tsx                  # Router setup
│   └── main.tsx                 # Entry point
├── public/
├── package.json
├── vite.config.ts
└── tailwind.config.js
```

## Key Files

- `src/contexts/CSPRClickContext.tsx` - Wallet provider (CasperWalletProvider API)
- `src/components/WalletConnectButton.tsx` - UI button with dropdown
- `src/layouts/LandingLayout.tsx` - Standalone top-nav layout
- `src/layouts/Layout.tsx` - Sidebar layout with wallet integration
- `src/pages/LandingPage.tsx` - Premium landing page (~1215 lines)
- `src/config/casper.ts` - Single source of truth for wallet address, fees, RPC URL
