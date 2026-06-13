#!/bin/bash
# Deploy Odra WASM contracts to Casper Testnet using official CLI

NODE_ADDRESS="http://159.69.117.159:7777" # Reliable testnet node (you can swap if down)
CHAIN_NAME="casper-test"
DEPLOYER_KEY="../keys/deployer.pem"

echo "Deploying VotingContract..."
casper-client put-deploy \
  --node-address $NODE_ADDRESS \
  --chain-name $CHAIN_NAME \
  --secret-key $DEPLOYER_KEY \
  --payment-amount 50000000000 \
  --session-path wasm/VotingContract.wasm

echo "Deploying EscrowContract..."
casper-client put-deploy \
  --node-address $NODE_ADDRESS \
  --chain-name $CHAIN_NAME \
  --secret-key $DEPLOYER_KEY \
  --payment-amount 50000000000 \
  --session-path wasm/EscrowContract.wasm

echo "Deploying ReputationRegistry..."
casper-client put-deploy \
  --node-address $NODE_ADDRESS \
  --chain-name $CHAIN_NAME \
  --secret-key $DEPLOYER_KEY \
  --payment-amount 50000000000 \
  --session-path wasm/ReputationRegistry.wasm

echo "Deployments submitted! Check testnet.cspr.live using your deployer public key to see the contract hashes."
