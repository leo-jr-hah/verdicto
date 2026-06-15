import axios from 'axios';

export async function fetchWithX402(url: string, payload: any, agentLabel: string) {
  try {
    const res = await axios.post(url, payload);
    return res.data;
  } catch (err: any) {
    if (err.response && err.response.status === 402) {
      console.log(`  [x402] 🛑 402 Payment Required (V2) from ${agentLabel}`);
      const isV2 = err.response.data?.x402Version === '2';
      const requirements = err.response.data?.paymentRequirements || {};
      
      const feeCSPR = requirements.maxAmountRequired || err.response.headers['x-payment-amount'] || '0.01';
      const destinationAddress = requirements.payTo || err.response.headers['x-payment-address'] || 'unknown';
      const chainId = requirements.chainId || 'casper:testnet';
      
      console.log(`  [x402]    Fee: ${feeCSPR} CSPR on ${chainId} → ${destinationAddress.substring(0, 16)}...`);

      // Mock V2 proof string (SIWx session or standard signature)
      const proof = Buffer.from(JSON.stringify({
        txnHash: "mock_v2_txn_" + Math.random().toString(36).substring(7),
        amount: feeCSPR,
        chainId: chainId,
        sessionToken: isV2 ? "mock_session_" + Date.now() : undefined,
        timestamp: Date.now()
      })).toString('base64');
      
      const retryRes = await axios.post(url, payload, {
        headers: { 'payment-signature': proof, 'x-payment-proof': proof }
      });
      console.log(`  [x402] ✅ Payment accepted, response received`);
      return retryRes.data;
    }
    throw err;
  }
}
