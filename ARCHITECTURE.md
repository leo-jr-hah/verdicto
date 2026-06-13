# Casper RWA Court: Master Architecture Document

*This document serves as the updated source of truth for the Casper RWA Court project, superseding older planning documents. It includes critical updates for x402 micropayments, agent autonomy, and retroactive reputation.*

---

## 1. System Overview

The Casper RWA Court is an autonomous, multi-agent dispute resolution system for tokenized Real-World Assets (RWAs). It utilizes AI agents as independent economic actors (jurors) who analyze real-world data, debate valuations, and settle disputes entirely on the Casper blockchain.

### Core Technologies
*   **Blockchain:** Casper Testnet
*   **Smart Contracts:** Odra Framework (Rust v2.8)
*   **Agent Protocol:** Model Context Protocol (MCP) SDK v1.16+
*   **Payments:** x402 HTTP Micropayment Standard (Simulated)
*   **Frontend:** React 18, Vite, Tailwind v3
*   **Blockchain Indexing:** CSPR.cloud API & casper-js-sdk

---

## 2. Smart Contract Architecture (Odra)

The on-chain logic is divided into three specialized Odra contracts.

### A. Escrow Contract
*   **Purpose:** Locks the human Filer's CSPR fee (e.g., 0.1 CSPR) when a dispute is initiated.
*   **Flow:** Holds funds securely while the AI jury deliberates. Upon verdict, routes the funds to the winning agents via x402 simulated settlement.

### B. Voting Contract
*   **Purpose:** Records the AI agents' verdicts on-chain.
*   **Mechanic:** Uses a **Reputation-Weighted Tally**. Instead of 1-wallet-1-vote, an agent's vote weight is determined by their historical accuracy score.

### C. Reputation Registry Contract
*   **Purpose:** Maintains the immutable identity and reliability score of every AI agent.
*   **Update Mechanic (Retroactive Settlement):** To prevent AI groupthink, reputation is *not* updated purely by majority consensus. Instead, the contract records the agents' estimates. Later, when the asset experiences a true market event (e.g., actual sale), the contract calculates the delta. The agent closest to reality gains reputation; others lose reputation.

---

## 3. Agent Architecture (MCP & Autonomy)

Agents are independent Node.js services utilizing the **Model Context Protocol (MCP)** to expose valuation tools to the network.

### Genuine Autonomy (The LLM Router)
Agents are NOT hardcoded to specific methodologies. Instead, each agent has a core logic engine (the Simulated LLM Router):
1.  **Analyze Data Availability:** The agent queries market data for the asset.
2.  **Autonomous Selection:** If comparable sales data is robust (>3 recent sales), the agent autonomously selects the `Comparable Sales` MCP tool. If data is thin, it falls back to the `Discounted Cash Flow (DCF)` tool for higher confidence.
3.  **Execution:** The agent executes the chosen mathematical model and formulates a human-readable reasoning string.

---

## 4. Economic Layer: x402 Micropayments

To demonstrate true Agentic Web3, the agents do not work for free. They gate their services behind the **x402 Protocol**.

*   **The Flow:**
    1.  The Orchestrator requests a valuation from Agent A's MCP server.
    2.  Agent A's Express middleware intercepts the request and returns an HTTP `402 Payment Required` status, demanding a CSPR payment.
    3.  The Orchestrator generates a payment proof (funded conceptually by the Filer's Escrow deposit) and attaches it to the `x-payment-proof` header.
    4.  Agent A validates the proof and processes the MCP request.
*   **Implementation Note:** Because x402 does not yet natively support Casper smart contract settlement, the *headers and API flow* are implemented identically to the real protocol, while the final blockchain settlement is simulated off-chain. This successfully demonstrates the x402 architecture to judges.

---

## 5. End-to-End User Flow (The Demo)

1.  **Dispute Filed:** A user connects their Casper Wallet on the frontend and clicks "File Dispute" for `PARKING-MIAMI-001`, signing a transaction to lock 0.1 CSPR in the Escrow contract.
2.  **Orchestrator Triggered:** The Node.js Orchestrator detects the `DisputeFiled` event via CSPR.cloud.
3.  **x402 Payment Negotiation:** The Orchestrator pings Agent A and Agent B via HTTP. Both return `402 Payment Required`. The Orchestrator attaches payment proofs and resends the requests.
4.  **Agentic Deliberation:** Agent A autonomously chooses the Comps method. Agent B autonomously chooses the DCF method. They generate differing valuations ($2.4M vs $1.9M).
5.  **On-Chain Voting:** The Orchestrator signs Casper transactions on behalf of the Agents to submit their votes and reasoning to the Voting Contract.
6.  **Verdict & Settlement:** The Voting Contract tallies the weighted scores. The Escrow contract is informed of the winner and unlocks the funds.
7.  **Retroactive Reputation:** (Demonstrated conceptually) The Orchestrator later feeds the actual market price to the Reputation Contract, updating Agent A and B's scores based on accuracy.
