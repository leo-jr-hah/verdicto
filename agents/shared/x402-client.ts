import axios from 'axios';
import { 
  makeCsprTransferDeploy, 
  PrivateKey, 
  KeyAlgorithm,
  Deploy
} from 'casper-js-sdk';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Casper x402 Facilitator API endpoint
const X402_FACILITATOR_URL = 'https://x402-facilitator.cspr.cloud';
const CSPR_CLOUD_KEY = process.env.CSPRCLOUD_API_KEY || '';

// ─── Safety limits ─────────────────────────────────────────────────────────
const MAX_FEE_CSPR = 10; // Reject any payment request above 10 CSPR
const DEPLOY_HASH_RE = /^[0-9a-f]{64}$/i;

/**
 * Validate fee amount to prevent overcharging exploits.
 * Rejects if fee exceeds MAX_FEE_CSPR or is not a valid number.
 */
function validateFee(feeCSPR: string): number {
  const fee = parseFloat(feeCSPR);
  if (isNaN(fee) || fee <= 0) {
    throw new Error(`Invalid fee amount: ${feeCSPR}`);
  }
  if (fee > MAX_FEE_CSPR) {
    throw new Error(`Fee ${feeCSPR} CSPR exceeds maximum allowed (${MAX_FEE_CSPR} CSPR)`);
  }
  return fee;
}

/**
 * Fetches a resource with x402 payment support using the real Casper x402 Facilitator.
 * Implements the full x402 protocol flow as per https://docs.cspr.cloud/x402-facilitator-api/reference
 */
export async function fetchWithX402(url: string, payload: any, agentLabel: string) {
  try {
    const res = await axios.post(url, payload, { timeout: 30_000 });
    return res.data;
  } catch (err: any) {
    if (err.response && err.response.status === 402) {
      console.log(`  [x402] 🛑 402 Payment Required from ${agentLabel}`);
      
      // Parse payment requirements from response
      const requirements = err.response.data?.paymentRequirements || {};
      const feeCSPR = requirements.maxAmountRequired || err.response.headers['x-payment-amount'] || '0.01';
      const destinationAddress = requirements.payTo || err.response.headers['x-payment-address'] || 'unknown';
      const network = requirements.network || err.response.headers['x-payment-network'] || 'casper:casper-test';
      const scheme = requirements.scheme || 'exact';
      
      // Validate fee before proceeding — prevent overcharging
      const validatedFee = validateFee(feeCSPR);
      
      console.log(`  [x402]    Fee: ${validatedFee} CSPR on ${network}`);
      console.log(`  [x402]    Pay to: ${destinationAddress.substring(0, 16)}...`);
      console.log(`  [x402]    Scheme: ${scheme}`);

      // Step 1: Verify payment requirements with facilitator
      console.log(`  [x402] Verifying payment requirements...`);
      const verifyPayload = {
        paymentRequirements: requirements,
        payer: process.env.DEPLOYER_PUBLIC_KEY
      };
      
      const verifyRes = await axios.post(
        `${X402_FACILITATOR_URL}/verify`,
        verifyPayload,
        { headers: { Authorization: CSPR_CLOUD_KEY }, timeout: 10_000 }
      );
      
      if (!verifyRes.data?.valid) {
        throw new Error('Payment requirements verification failed');
      }
      
      // Step 2: Create signed payment payload
      console.log(`  [x402] Creating signed payment payload...`);
      const paymentPayload = await createCasperPaymentPayload(
        destinationAddress,
        String(validatedFee),
        network
      );
      
      // Step 3: Settle payment via facilitator
      console.log(`  [x402] Settling payment via facilitator...`);
      const settlePayload = {
        paymentRequirements: requirements,
        paymentPayload: paymentPayload
      };
      
      const settleRes = await axios.post(
        `${X402_FACILITATOR_URL}/settle`,
        settlePayload,
        { headers: { Authorization: CSPR_CLOUD_KEY }, timeout: 15_000 }
      );
      
      const deployHash = settleRes.data?.deployHash;
      if (!deployHash || typeof deployHash !== 'string' || !DEPLOY_HASH_RE.test(deployHash)) {
        throw new Error('Facilitator returned invalid deploy hash');
      }
      console.log(`  [x402] ✅ Payment settled! deploy_hash: ${deployHash}`);
      
      // Step 4: Retry original request with payment proof
      const paymentProof = {
        scheme: 'casper',
        payload: paymentPayload,
        deployHash: deployHash
      };
      
      const proofHeader = Buffer.from(JSON.stringify(paymentProof)).toString('base64');
      
      const retryRes = await axios.post(url, payload, {
        headers: { 
          'payment-signature': proofHeader,
          'x-payment-proof': proofHeader,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 30_000,
      });
      
      console.log(`  [x402] ✅ Payment accepted, response received`);
      return retryRes.data;
    }
    throw err;
  }
}

/**
 * Creates a signed Casper payment payload for x402.
 * Uses the deployer's private key to sign the transfer.
 */
async function createCasperPaymentPayload(
  payToAddress: string,
  amountCSPR: string,
  network: string
): Promise<any> {
  const deployerKeyPath = process.env.DEPLOYER_PRIVATE_KEY;
  if (!deployerKeyPath) {
    throw new Error('DEPLOYER_PRIVATE_KEY not configured in .env');
  }
  
  // Validate recipient address format (Casper public key hex)
  if (!payToAddress || typeof payToAddress !== 'string' || payToAddress.length < 64) {
    throw new Error(`Invalid recipient address: ${payToAddress}`);
  }
  
  // Convert CSPR to motes (1 CSPR = 10^9 motes)
  const fee = parseFloat(amountCSPR);
  if (isNaN(fee) || fee <= 0) {
    throw new Error(`Invalid payment amount: ${amountCSPR}`);
  }
  const amountMotes = Math.floor(fee * 1e9).toString();
  
  // Parse network to get chain name
  const chainName = network.includes('test') ? 'casper-test' : 'casper';
  
  // Load the private key from PEM file
  const absoluteKeyPath = path.resolve(__dirname, '../../..', deployerKeyPath);
  if (!fs.existsSync(absoluteKeyPath)) {
    throw new Error(`Key file not found: ${absoluteKeyPath}`);
  }
  const pemContent = fs.readFileSync(absoluteKeyPath, 'utf8');
  const privateKey = PrivateKey.fromPem(pemContent, KeyAlgorithm.ED25519);
  const publicKey = privateKey.publicKey;
  
  // Create transfer deploy using v5.x API
  const deploy = makeCsprTransferDeploy({
    senderPublicKeyHex: publicKey.toHex(),
    recipientPublicKeyHex: payToAddress,
    transferAmount: amountMotes,
    chainName: chainName,
    ttl: 1800000, // 30 minutes
    gasPrice: 1
  });
  
  // Sign the deploy
  deploy.sign(privateKey);
  
  // Return the deploy as JSON
  return {
    deploy: Deploy.toJSON(deploy),
    payer: publicKey.toHex(),
    amount: amountCSPR,
    network: network
  };
}
