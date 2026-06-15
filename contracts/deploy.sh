#!/bin/bash
# Deploy Odra WASM contracts to Casper Testnet using put-transaction (v2 API)
source ../.env

CHAIN_NAME="casper-test"
DEPLOYER_KEY="../keys/deployer.pem"
RPC_URL="https://node.testnet.casper.network/rpc"

function deploy_wasm() {
  local NAME=$1
  local WASM_PATH=$2
  
  echo "Deploying $NAME..."
  casper-client put-transaction session \
    --node-address $RPC_URL \
    --chain-name $CHAIN_NAME \
    --secret-key $DEPLOYER_KEY \
    --payment-amount 500000000000 \
    --wasm-path $WASM_PATH \
    --session-arg "odra_cfg_package_hash_key_name:string='${NAME}_package'" \
    --session-arg "odra_cfg_allow_key_override:bool='true'" \
    --session-arg "odra_cfg_is_upgradable:bool='true'" \
    --session-arg "odra_cfg_is_upgrade:bool='false'" \
    --install-upgrade \
    --standard-payment true \
    --gas-price-tolerance 1 \
    2>&1 | tee "${NAME}_result.json" | grep -o '"transaction_hash": "[^"]*"\|"deploy_hash": "[^"]*"'
}

deploy_wasm "VotingContract" "wasm/VotingContract.wasm"
deploy_wasm "EscrowContract" "wasm/EscrowContract.wasm"
deploy_wasm "ReputationRegistry" "wasm/ReputationRegistry.wasm"

echo ""
echo "Deployments submitted!"
echo "Check testnet.cspr.live using your deployer public key to see the contract hashes."
