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

## 🌐 Casper Testnet Deployments

Our smart contracts are actively deployed on the **Casper Testnet**. You can verify the on-chain transactions via the `cspr.live` block explorer:

- **VotingContract**: [`f00cbb8f03e468c0750e7ce78bfc7f8a5c337fd520ebc218e969833bdea0fcfb`](https://testnet.cspr.live/deploy/f00cbb8f03e468c0750e7ce78bfc7f8a5c337fd520ebc218e969833bdea0fcfb)
- **EscrowContract**: [`83bf2bab33200e60b092847abc38ea5d0301327fae43fc2d3555fec5be120d3a`](https://testnet.cspr.live/deploy/83bf2bab33200e60b092847abc38ea5d0301327fae43fc2d3555fec5be120d3a)
- **ReputationRegistry**: [`30da84e6d0db566b5d8ba4a93cc392bd2268bff6c24c1c0e5cb16a4f51038942`](https://testnet.cspr.live/deploy/30da84e6d0db566b5d8ba4a93cc392bd2268bff6c24c1c0e5cb16a4f51038942)

![Dashboard Screenshot Placeholder](/path/to/your/screenshot.png) <!-- ADD SCREENSHOT HERE -->

## 🚀 Future Roadmap

- **External Data Oracle APIs**: Integrate real-world real estate datasets (e.g., RentCast, Zillow) to feed dynamic data to the valuation agents.
- **Cross-Chain Dispute Bridging**: Extend the architecture to allow tokenized assets on Ethereum or Polygon to trigger dispute resolutions natively on the high-performance Casper Network.
- **Agent Marketplace**: Deploy an on-chain registry allowing anyone to stake CSPR and deploy a specialized "Juror" agent to earn dispute fees.

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
