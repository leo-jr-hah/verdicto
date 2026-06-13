#!/bin/bash
# Deploy Odra WASM contracts to Casper Testnet using official CLI and CSPR.cloud
source ../.env

CHAIN_NAME="casper-test"
DEPLOYER_KEY="../keys/deployer.pem"
RPC_URL="https://node.testnet.cspr.cloud/rpc"

function deploy_wasm() {
  local NAME=$1
  local WASM_PATH=$2
  
  echo "Making deploy for $NAME..."
  casper-client make-deploy \
    --chain-name $CHAIN_NAME \
    --secret-key $DEPLOYER_KEY \
    --payment-amount 150000000000 \
    --session-path $WASM_PATH \
    --session-arg "odra_cfg_package_hash_key_name:string='${NAME}_package'" \
    --session-arg "odra_cfg_allow_key_override:bool='true'" \
    --session-arg "odra_cfg_is_upgradable:bool='true'" \
    --force \
    --output "${NAME}_deploy.json"

  echo "Broadcasting $NAME..."
  DEPLOY_JSON=$(cat "${NAME}_deploy.json")
  
  PAYLOAD=$(cat <<EOF
{
  "jsonrpc": "2.0",
  "id": "$(date +%s)",
  "method": "account_put_deploy",
  "params": [
    $DEPLOY_JSON
  ]
}
EOF
  )

  curl -s -X POST $RPC_URL \
    -H "Content-Type: application/json" \
    -H "Authorization: $CSPRCLOUD_API_KEY" \
    -d "$PAYLOAD" | grep -o '"deploy_hash":"[^"]*"' || echo "Failed to get deploy hash"
}

deploy_wasm "VotingContract" "wasm/VotingContract.wasm"
deploy_wasm "EscrowContract" "wasm/EscrowContract.wasm"
deploy_wasm "ReputationRegistry" "wasm/ReputationRegistry.wasm"

echo "Deployments submitted! Check testnet.cspr.live using your deployer public key to see the contract hashes."
