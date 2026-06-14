import axios from 'axios';
import { executeCasperTransfer } from '../orchestrator';

export async function fetchWithX402(url: string, payload: any, agentLabel: string) {
  try {
    const res = await axios.post(url, payload);
    return res.data;
  } catch (err: any) {
    if (err.response && err.response.status === 402) {
      console.log(`  [x402] 🛑 402 Payment Required from ${agentLabel}`);
      const feeCSPR = err.response.headers['x-payment-amount'];
      const destinationAddress = err.response.headers['x-payment-address'];
      console.log(`  [x402]    Fee: ${feeCSPR} CSPR → ${destinationAddress.substring(0, 16)}...`);

      // Mock proof string
      const proof = Buffer.from(JSON.stringify({
        txnHash: "mock_txn_" + Math.random().toString(36).substring(7),
        amount: feeCSPR,
        timestamp: Date.now()
      })).toString('base64');
      
      const retryRes = await axios.post(url, payload, {
        headers: { 'x-payment-proof': proof }
      });
      console.log(`  [x402] ✅ Payment accepted, response received`);
      return retryRes.data;
    }
    throw err;
  }
}
