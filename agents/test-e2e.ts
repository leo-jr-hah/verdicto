import { runAssessmentPipeline } from './orchestrator/index.js';

async function runE2E() {
  console.log("=========================================");
  console.log("🧪 STARTING E2E INTEGRATION TEST");
  console.log("=========================================");

  try {
    const assessmentId = `E2E-TEST-${Math.floor(Math.random() * 1000)}`;
    console.log(`[E2E] Triggering assessment pipeline for ${assessmentId}...`);
    
    // We await the entire flow. This will:
    // 1. Summon Valuation Agent A (RentCast Integration)
    // 2. Summon Valuation Agent B (FRED Integration)
    // 3. Negotiate x402 V2 payments with multi-chain headers
    // 4. Run multi-round LLM deliberation
    // 5. Simulate Casper blockchain settlement via Odra
    const result = await runAssessmentPipeline(assessmentId, 'PARKING-MIAMI-TEST', 'Miami', 50);
    
    if (!result || !result.verdict) {
      throw new Error("Assessment pipeline completed but no final verdict was returned.");
    }

    console.log("\n=========================================");
    console.log("✅ E2E INTEGRATION TEST PASSED");
    console.log(`✅ Final Verdict: ${result.verdict} (Index: ${result.verdictIndex})`);
    console.log(`✅ Assessed Value: $${result.finalValue.toLocaleString()}`);
    console.log("=========================================\n");
    
    process.exit(0);
  } catch (err: any) {
    console.error("\n❌ E2E INTEGRATION TEST FAILED:", err.message);
    process.exit(1);
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runE2E();
}
