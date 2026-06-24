/**
 * Casper network configuration - single source of truth for payment addresses & fees.
 *
 * PLATFORM_WALLET is the Casper testnet public key that receives all
 * assessment & prediction fees.  It must match DEPLOYER_PUBLIC_KEY in the
 * orchestrator's .env so the backend can verify payments on-chain.
 */

/** Casper testnet RPC endpoint (public node, no auth required for putDeploy) */
export const CSPR_TESTNET_RPC = 'https://node.testnet.cspr.cloud/rpc';

/** Platform fee-receiving wallet (must match orchestrator .env DEPLOYER_PUBLIC_KEY) */
export const PLATFORM_WALLET =
  '02039cd256da1f2e13fc24a6f2ad1c15166f45070befa52bc2da46bbe194e7381010';

/** Assessment fee in CSPR */
export const ASSESSMENT_FEE_CSPR = 2.5;

/** Prediction fee in CSPR */
export const PREDICTION_FEE_CSPR = 1;

/** Loan origination fee in CSPR */
export const LOAN_FEE_CSPR = 5;

/** Insurance policy fee in CSPR */
export const INSURANCE_FEE_CSPR = 3;

/** Dispute filing stake in CSPR (returned if challenger wins) */
export const DISPUTE_FEE_CSPR = 5;
