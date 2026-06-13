# Casper RWA Court ⚖️

An autonomous, multi-agent dispute resolution system for Real World Assets (RWA) built on the Casper Network.

This project implements the [Casper AI Toolkit](https://www.casper.network/ai) and demonstrates:
- **x402 Micropayments**: Agents pay each other in CSPR per API request.
- **Model Context Protocol (MCP)**: Native integration with CSPR.cloud for querying balances and the latest blocks.
- **Upgradable Smart Contracts (Odra)**: Deploys `VotingContract`, `EscrowContract`, and `ReputationRegistry`.
- **RAG & Agent Memory**: Employs `vectra` to retrieve historical dispute precedents.

## Architecture

```mermaid
graph TD
    User([User]) -->|Initiates Dispute| Orchestrator[Orchestrator Agent]
    
    Orchestrator -->|x402 Payment| AgentA[Agent A: Comps Specialist]
    Orchestrator -->|x402 Payment| AgentB[Agent B: DCF Specialist]
    
    AgentA --> Orchestrator
    AgentB --> Orchestrator
    
    Orchestrator -->|x402 Payment| Juror1[Evidence Analyst]
    Orchestrator -->|x402 Payment| Juror2[Market Data Interpreter]
    Orchestrator -->|x402 Payment| Juror3[Precedent Researcher]
    
    Juror3 -->|RAG Query| Vectra[(Vectra DB)]
    
    Juror1 --> Orchestrator
    Juror2 --> Orchestrator
    Juror3 --> Orchestrator
    
    Orchestrator -->|WebSocket| Dashboard[React Dashboard]
    
    Orchestrator -->|executeCasperTransfer| CasperNet((Casper Testnet))
    Orchestrator -.->|callTool| CSPR_MCP[CSPR.cloud MCP Server]
```

## Running the Project

1. Run all agents and the orchestrator:
   ```bash
   cd agents
   npm run test-agents
   ```

2. Start the Real-time Dashboard:
   ```bash
   cd dashboard
   npm run dev
   ```

Navigate to `http://localhost:5173` to watch the agents deliberate and settle the dispute on the Casper blockchain.
