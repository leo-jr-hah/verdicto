# Casper RWA Court — AI Onboarding Document

## Project Overview
Multi-agent dispute resolution system for RWA (Real-World Asset) valuations on Casper Network.
3 Odra smart contracts + 3 MCP agent services + x402 simulated payments + React dark-mode dashboard.

## Hackathon
Casper Agentic Buildathon 2026 — https://dorahacks.io/hackathon/casper-agentic-buildathon
Deadline: July 1, 2026

## Technology Stack
- Smart Contracts: Odra 2.8.1 (Rust → WASM) on Casper Testnet
- Agent Services: Node.js 20 + TypeScript + @modelcontextprotocol/sdk v1.16.0 (NEW API)
- Payments: x402 simulated (show flow, no real blockchain settlement)
- Frontend: React 18 + Vite + Tailwind CSS v3 + motion (NOT framer-motion)
- Blockchain API: casper-js-sdk v5.0.12 + CSPR.cloud REST API
- Vector Store: vectra (pure Node.js, no server needed)
- WebSocket: ws package (port 3010, separate from HTTP)

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
Layer 2 (Off-Chain): 3 MCP agent services — ValuationA, ValuationB, EvidenceAnalyst
Layer 3 (Payment): x402 simulated micropayments between layers
Layer 4 (Frontend): React dark-mode dashboard with live WebSocket deliberation
```

## Project Structure
```
contracts/          Odra smart contracts (Rust)
  reputation/       ReputationRegistry - agent identity & scores
  escrow/           EscrowContract - locks CSPR for disputes
  voting/           VotingContract - weighted on-chain votes
agents/             MCP Agent Services (TypeScript)
  shared/           Base classes, types, constants
  valuation-agent-a/ Comparable Sales method (port 3001)
  valuation-agent-b/ DCF method (port 3002)
  evidence-analyst/  Juror agent + Vectra precedents (port 3003)
deliberation/       Dispute orchestration engine
x402/               Payment simulation middleware
websocket/          WebSocket broadcast server (port 3010)
dashboard/          React frontend (Vite, port 5173)
scripts/            Deploy and demo scripts
```

## Conventions
- All contracts use Odra modules with #[odra::module] macro
- All contracts emit Events for off-chain indexing
- All agent services use McpServer + StreamableHTTPTransport
- All x402 payments use simulation mode (X402_SIMULATE=true)
- All functions have JSDoc/Rustdoc comments
- Use kebab-case for filenames, camelCase for variables, PascalCase for types
- Use U256 for all CSPR amounts in contracts (no floating point)
- Default Tailwind is dark mode (bg-gray-950, text-gray-100)

## Do NOT Do
- Do NOT use ethers.js or viem (use casper-js-sdk v5)
- Do NOT hardcode private keys (use .env)
- Do NOT deploy to mainnet
- Do NOT use framer-motion (use motion)
- Do NOT use old MCP Server/StdioServerTransport API
- Do NOT use Tailwind v4 (use v3)
- Do NOT change shared/types.ts after Day 3

## Key Constants
- Filing fee: 0.1 CSPR
- Juror payment: 0.03 CSPR per juror
- Divergence threshold: 25% (triggers dispute)
- Min juror reputation: 600/1000
- Juror count: 3 per dispute
- Demo asset: Miami Downtown Parking, 100 spots

## Workflow
1. Plan changes in comments before implementing
2. Implement one contract/agent at a time
3. Test each before moving to next
4. Run full integration test before deploy
5. Keep this CLAUDE.md updated as architecture evolves
