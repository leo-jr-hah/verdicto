# Casper RWA Court — AI Onboarding Document

## Project Overview
Multi-agent dispute resolution system for RWA (Real-World Asset) valuations on Casper Network.
3 Odra smart contracts + AI analyst agents + x402 micropayments + React dark-mode dashboard.

## Hackathon
Casper Agentic Buildathon 2026 — https://dorahacks.io/hackathon/casper-agentic-buildathon
Deadline: July 1, 2026

## Technology Stack
- Smart Contracts: Odra 2.8.1 (Rust → WASM) on Casper Testnet
- Agent Services: Node.js 20 + TypeScript + @modelcontextprotocol/sdk v1.16.0 (NEW API)
- Payments: x402 HTTP Micropayment Standard (real on-chain signing via casper-js-sdk)
- Frontend: React 19 + Vite + Tailwind CSS v3 + motion (NOT framer-motion)
- Blockchain API: casper-js-sdk v5.0.12 + CSPR.cloud REST API
- Vector Store: vectra (pure Node.js, no server needed)
- WebSocket: ws package (port 3010, separate from HTTP)
- Animations: GSAP + @gsap/react + use-scramble (landing page)

## CRITICAL: MCP SDK API Change
Use the NEW McpServer API (v1.16.0+):
```ts
// ✅ CORRECT
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPTransport } from '@modelcontextprotocol/sdk/server/streamable-http.js';

// ❌ WRONG - deprecated
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
```

## CRITICAL: Dashboard Imports
```ts
// ✅ CORRECT
import { motion } from 'motion/react';
// npm install motion (NOT framer-motion)

// ❌ WRONG
import { motion } from 'framer-motion';
```

## Architecture
```
Layer 1 (On-Chain): 3 Odra contracts — Reputation, Escrow, Voting
Layer 2 (Off-Chain): AI analyst agents — ValuationA, ValuationB, EvidenceAnalyst
Layer 3 (Payment): x402 micropayments (real signing, CSPR native transfers)
Layer 4 (Frontend): React 19 dark-mode dashboard with live WebSocket deliberation
```

## Project Structure
```
contracts/          Odra smart contracts (Rust)
  reputation/       ReputationRegistry - agent identity & scores
  escrow/           EscrowContract - locks CSPR for disputes
  voting/           VotingContract - weighted on-chain votes
agents/             Agent Services (TypeScript)
  src/index.ts      Orchestrator
  src/analyst.ts    AI analyst agents
  src/hmac-chain.ts Receipt chain
  src/trust-scoring.ts  Reputation system
  src/x402-middleware.ts x402 payment middleware
dashboard/          React 19 frontend (Vite, port 5173)
  src/pages/        LandingPage, DashboardView, AssessView, PredictionView, etc.
  src/layouts/      LandingLayout (top-nav), Layout (sidebar)
  src/contexts/     CSPRClickContext (wallet provider)
  src/components/   UI components (WalletConnectButton, agent cards, etc.)
scripts/            Deploy and demo scripts
```

## Routes
- `/` — Landing page (standalone top-nav layout, premium animations)
- `/dashboard` — Dashboard with live contract state + x402 payment stream
- `/assess` — Asset valuation with multi-methodology dashboard (2.5 CSPR fee)
- `/borrow` — Borrow against assessed assets (5 CSPR fee, AI-calculated LTV)
- `/insure` — Insure assets against value loss (3 CSPR fee, AI risk assessment)
- `/predict` — Prediction market resolution (1 CSPR fee)
- `/reputation` — Agent reputation
- `/transactions` — Transaction history
- `/architecture` — How it works
- `/roadmap` — Product roadmap

## Wallet Integration
- Uses official Casper Wallet SDK (injected by Chrome extension)
- `window.CasperWalletProvider` — factory function (NOT `window.casper`)
- `window.CasperWalletEventTypes` — event names: Connected, Disconnected, ActiveKeyChanged
- Events are DOM CustomEvents on `window` (provider.on() does NOT exist)
- Payment flow: signPayment() creates native transfer deploy → wallet signs → returns base64 proof
- Platform wallet: `02039cd256da1f2e13fc24a6f2ad1c15166f45070befa52bc2da46bbe194e7381010`

## Conventions
- All contracts use Odra modules with #[odra::module] macro
- All contracts emit Events for off-chain indexing
- All agent services use McpServer + StreamableHTTPTransport
- All functions have JSDoc/Rustdoc comments
- Use kebab-case for filenames, camelCase for variables, PascalCase for types
- Use U256 for all CSPR amounts in contracts (no floating point)
- Default Tailwind is dark mode (bg-gray-950, text-gray-100)
- No em dashes (—) in source files — use hyphens or colons instead

## Do NOT Do
- Do NOT use ethers.js or viem (use casper-js-sdk v5)
- Do NOT hardcode private keys (use .env)
- Do NOT deploy to mainnet
- Do NOT use framer-motion (use motion)
- Do NOT use old MCP Server/StdioServerTransport API
- Do NOT use Tailwind v4 (use v3)
- Do NOT change shared/types.ts after Day 3
- Do NOT use `window.casper` (deprecated, use `window.CasperWalletProvider`)

## Key Constants
- Assessment fee: 2.5 CSPR
- Prediction fee: 1 CSPR
- Filing fee: 0.1 CSPR
- Juror payment: 0.03 CSPR per juror
- Divergence threshold: 25% (triggers dispute)
- Min juror reputation: 600/1000
- Juror count: 3 per dispute
- Demo asset: Miami Downtown Parking, 100 spots

## Tests
- 27/27 tests pass (vitest)
- 3 test files: trust-framework (17), verifiable-execution (10), agent-engine (16)
- Covers: HMAC receipt chain, trust scoring, tier assignment, agent orchestration, valuation logic

## Workflow
1. Plan changes in comments before implementing
2. Implement one contract/agent at a time
3. Test each before moving to next
4. Run full integration test before deploy
5. Keep this CLAUDE.md updated as architecture evolves
