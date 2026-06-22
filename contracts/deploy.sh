#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════════
# deploy-contracts.sh — Deploy Verdict smart contracts to Casper testnet
#
# Prerequisites:
#   1. casper-client CLI installed (https://docs.casper.network/developers/cli/)
#   2. A funded testnet account (get CSPR from https://testnet.cspr.live/tools/faucet)
#   3. .env file with DEPLOYER_PRIVATE_KEY pointing to your secret key PEM file
#
# Usage:
#   cd casper-rwa-court
#   ./contracts/deploy.sh [network]
#
#   network: "testnet" (default) or "mainnet"
#
# Output:
#   - Deploys 2 contracts: VotingContract, ReputationRegistry
#   - Prints contract hashes for .env configuration
#   - Saves deployment receipts to contracts/deployment-receipts/
# ═══════════════════════════════════════════════════════════════════════════════

set -euo pipefail

NETWORK="${1:-testnet}"
CHAIN_NAME="casper-test"
NODE_URL="https://node.testnet.cspr.cloud/rpc"
WASM_DIR="$(cd "$(dirname "$0")" && pwd)/wasm"
RECEIPTS_DIR="$(cd "$(dirname "$0")" && pwd)/deployment-receipts"
ENV_FILE="$(cd "$(dirname "$0")/.." && pwd)/.env"
PAYMENT_AMOUNT="50000000000" # 50 CSPR per deploy (generous for testnet)
TTL="30m"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  Verdict — Smart Contract Deployment${NC}"
echo -e "${CYAN}  Network: ${NETWORK}${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# ── Load .env ─────────────────────────────────────────────────────────────────
if [ ! -f "$ENV_FILE" ]; then
  echo -e "${RED}❌ .env file not found at ${ENV_FILE}${NC}"
  echo "   Copy .env.example to .env and configure DEPLOYER_PRIVATE_KEY"
  exit 1
fi

# Source .env (only the vars we need)
DEPLOYER_PRIVATE_KEY=$(grep -E '^DEPLOYER_PRIVATE_KEY=' "$ENV_FILE" | cut -d'=' -f2 | tr -d '"' | tr -d "'")
CSPRCLOUD_API_KEY=$(grep -E '^CSPRCLOUD_API_KEY=' "$ENV_FILE" | cut -d'=' -f2 | tr -d '"' | tr -d "'")

if [ -z "$DEPLOYER_PRIVATE_KEY" ]; then
  echo -e "${RED}❌ DEPLOYER_PRIVATE_KEY not set in .env${NC}"
  echo "   Generate a key: casper-client keygen ./keys/deployer"
  echo "   Then set: DEPLOYER_PRIVATE_KEY=./keys/deployer/secret_key.pem"
  exit 1
fi

# Resolve absolute path to key file
KEY_PATH="$(cd "$(dirname "$0")/.." && pwd)/${DEPLOYER_PRIVATE_KEY}"
if [ ! -f "$KEY_PATH" ]; then
  echo -e "${RED}❌ Key file not found: ${KEY_PATH}${NC}"
  exit 1
fi

# Get deployer public key
DEPLOYER_PK=$(casper-client show-key-file --key-file "$KEY_PATH" 2>/dev/null | grep -oP 'Public Key: \K.*' || echo "")
if [ -z "$DEPLOYER_PK" ]; then
  echo -e "${RED}❌ Could not read public key from ${KEY_PATH}${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Deployer: ${DEPLOYER_PK:0:20}...${NC}"

# Create receipts directory
mkdir -p "$RECEIPTS_DIR"

# ── Contract List ─────────────────────────────────────────────────────────────
CONTRACTS=(
  "VotingContract:voting"
  "ReputationRegistry:reputation"
)

DEPLOYED_HASHES=()

deploy_contract() {
  local name="$1"
  local module_name="$2"
  local wasm_path="${WASM_DIR}/${name}.wasm"

  if [ ! -f "$wasm_path" ]; then
    echo -e "${RED}❌ WASM not found: ${wasm_path}${NC}"
    echo "   Build contracts first: cd contracts && cargo build --release --target wasm32-unknown-unknown"
    exit 1
  fi

  echo ""
  echo -e "${YELLOW}─── Deploying ${name} ─────────────────────────────────────────${NC}"
  echo -e "  WASM: ${wasm_path}"
  echo -e "  Size: $(du -h "$wasm_path" | cut -f1)"

  # Deploy the contract
  local deploy_output
  deploy_output=$(casper-client put-deploy \
    --chain-name "$CHAIN_NAME" \
    --node-address "$NODE_URL" \
    --secret-key "$KEY_PATH" \
    --payment-amount "$PAYMENT_AMOUNT" \
    --ttl "$TTL" \
    --session-path "$wasm_path" \
    2>&1)

  local deploy_hash
  deploy_hash=$(echo "$deploy_output" | grep -oP 'Deploy Hash: \K[0-9a-f]+' || echo "")

  if [ -z "$deploy_hash" ]; then
    echo -e "${RED}❌ Deploy failed for ${name}:${NC}"
    echo "$deploy_output"
    return 1
  fi

  echo -e "  Deploy hash: ${GREEN}${deploy_hash}${NC}"
  echo -e "  View: https://testnet.cspr.live/deploy/${deploy_hash}"

  # Save receipt
  echo "{\"contract\": \"${name}\", \"deploy_hash\": \"${deploy_hash}\", \"network\": \"${NETWORK}\", \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\", \"status\": \"pending\"}" > "${RECEIPTS_DIR}/${name}-${deploy_hash:0:8}.json"

  # Wait for confirmation
  echo -e "  ${CYAN}Waiting for on-chain confirmation...${NC}"
  local attempts=0
  local max_attempts=30
  while [ $attempts -lt $max_attempts ]; do
    sleep 5
    attempts=$((attempts + 1))

    local status_response
    status_response=$(curl -s "https://event-store-api-clarity-testnet.make.services/deploys/${deploy_hash}" 2>/dev/null || echo "{}")

    if echo "$status_response" | grep -q '"execution_results"'; then
      echo -e "  ${GREEN}✅ ${name} confirmed on-chain!${NC}"

      # Try to get contract hash from execution results
      local contract_hash
      contract_hash=$(echo "$status_response" | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    results = data.get('execution_results', [])
    for r in results:
        transforms = r.get('result', {}).get('transforms', [])
        for t in transforms:
            if t.get('transform', {}).get('WriteContract'):
                print(t['transform']['WriteContract'])
                sys.exit(0)
    print('HASH_NOT_FOUND')
except:
    print('PARSE_ERROR')
" 2>/dev/null || echo "PARSE_ERROR")

      if [ "$contract_hash" != "HASH_NOT_FOUND" ] && [ "$contract_hash" != "PARSE_ERROR" ]; then
        echo -e "  ${GREEN}Contract hash: ${contract_hash}${NC}"
        DEPLOYED_HASHES+=("${name}=${contract_hash}")

        # Update receipt
        echo "{\"contract\": \"${name}\", \"deploy_hash\": \"${deploy_hash}\", \"contract_hash\": \"${contract_hash}\", \"network\": \"${NETWORK}\", \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\", \"status\": \"confirmed\"}" > "${RECEIPTS_DIR}/${name}-${deploy_hash:0:8}.json"
      else
        echo -e "  ${YELLOW}⚠️  Contract hash not in execution results. Check cspr.live manually.${NC}"
        DEPLOYED_HASHES+=("${name}=CHECK_CSPR_LIVE:${deploy_hash}")
      fi

      return 0
    fi

    echo -ne "  ⏳ Attempt ${attempts}/${max_attempts}...\r"
  done

  echo -e "  ${YELLOW}⚠️  Timeout waiting for confirmation. Deploy may still succeed.${NC}"
  DEPLOYED_HASHES+=("${name}=PENDING:${deploy_hash}")
  return 0
}

# ── Deploy All Contracts ──────────────────────────────────────────────────────
echo ""
echo -e "${CYAN}Deploying ${#CONTRACTS[@]} contracts...${NC}"

FAILURES=0
for contract_spec in "${CONTRACTS[@]}"; do
  IFS=':' read -r name module_name <<< "$contract_spec"
  if ! deploy_contract "$name" "$module_name"; then
    FAILURES=$((FAILURES + 1))
  fi
done

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  Deployment Summary${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"

if [ ${#DEPLOYED_HASHES[@]} -gt 0 ]; then
  echo ""
  echo -e "${GREEN}Add these to your .env file:${NC}"
  echo ""
  for entry in "${DEPLOYED_HASHES[@]}"; do
    IFS='=' read -r name hash <<< "$entry"
    case "$name" in
      VotingContract)     echo "VOTING_CONTRACT_HASH=${hash}" ;;
      ReputationRegistry) echo "REPUTATION_CONTRACT_HASH=${hash}" ;;
    esac
  done
  echo ""
fi

if [ $FAILURES -gt 0 ]; then
  echo -e "${RED}❌ ${FAILURES} contract(s) failed to deploy${NC}"
  exit 1
else
  echo -e "${GREEN}✅ All contracts deployed successfully!${NC}"
  echo ""
  echo -e "Receipts saved to: ${RECEIPTS_DIR}/"
  echo -e "Check status:      https://testnet.cspr.live/"
fi
