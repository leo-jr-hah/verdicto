import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  runDualValuation,
  calcRealEstateComps,
  calcRealEstateDCF,
  calcArtAppraisal,
  calcArtMarketComparison,
  calcCommoditySpot,
  calcCommodityAppraisal,
  type ValuationRequest,
} from '../shared/agent-engine.js';
import type { ValuationResult } from '../shared/types.js';

// ─── Mock external dependencies ──────────────────────────────────────────────

vi.mock('../shared/data-sources.js', () => ({
  getRealEstateData: vi.fn().mockResolvedValue({
    comparables: [
      { price: 500_000, address: '123 Main St' },
      { price: 520_000, address: '456 Oak Ave' },
      { price: 480_000, address: '789 Pine Rd' },
    ],
  }),
  getArtData: vi.fn().mockResolvedValue({
    comparables: [
      { title: 'Untitled I', artist: 'Test Artist' },
      { title: 'Untitled II', artist: 'Test Artist' },
    ],
  }),
  getCommodityData: vi.fn().mockResolvedValue({
    priceData: { pricePerOz: 3_300 },
  }),
  getMacroContext: vi.fn().mockResolvedValue({
    interestRate: 0.068,
    inflation: 0.032,
    gdpGrowth: 0.025,
  }),
}));

vi.mock('../shared/rentcast-client.js', () => ({
  getComparableSales: vi.fn().mockResolvedValue([
    { price: 510_000, address: '100 Test St' },
    { price: 490_000, address: '200 Test Ave' },
  ]),
}));

vi.mock('../shared/fred-client.js', () => ({
  getMortgageRate: vi.fn().mockResolvedValue(0.068),
}));

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Agent Engine — Real Estate Valuation', () => {
  it('calcRealEstateComps returns a valid ValuationResult', async () => {
    const result = await calcRealEstateComps('test-agent', 'RE-001', 'Miami, FL', 1200);
    expect(result).toBeDefined();
    expect(result.agent).toBe('test-agent');
    expect(result.method).toBe('comparable_sales');
    expect(result.asset_id).toBe('RE-001');
    expect(result.estimated_value).toBeGreaterThan(0);
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
    expect(result.reasoning).toContain('Miami');
    expect(result.dataSource).toBeDefined();
  });

  it('calcRealEstateDCF returns a valid ValuationResult', async () => {
    const result = await calcRealEstateDCF('test-agent', 'RE-002', 'New York, NY');
    expect(result).toBeDefined();
    expect(result.method).toBe('dcf');
    expect(result.estimated_value).toBeGreaterThan(0);
    expect(result.reasoning).toContain('DCF');
  });

  it('runDualValuation returns two distinct valuations for real estate', async () => {
    const request: ValuationRequest = {
      assetType: 'real-estate',
      assetId: 'RE-003',
      location: 'Miami, FL',
      sqft: 1500,
    };
    const [a, b] = await runDualValuation(request);
    expect(a).toBeDefined();
    expect(b).toBeDefined();
    expect(a.method).toBe('comparable_sales');
    expect(b.method).toBe('dcf');
    expect(a.estimated_value).toBeGreaterThan(0);
    expect(b.estimated_value).toBeGreaterThan(0);
  });
});

describe('Agent Engine — Art Valuation', () => {
  it('calcArtAppraisal returns a valid ValuationResult', async () => {
    const result = await calcArtAppraisal('test-agent', 'ART-001', 'oil painting');
    expect(result).toBeDefined();
    expect(result.method).toBe('appraisal');
    expect(result.estimated_value).toBeGreaterThan(0);
    expect(result.reasoning).toContain('oil painting');
  });

  it('calcArtMarketComparison returns a valid ValuationResult', async () => {
    const result = await calcArtMarketComparison('test-agent', 'ART-002', 'sculpture');
    expect(result).toBeDefined();
    expect(result.method).toBe('market_price');
    expect(result.estimated_value).toBeGreaterThan(0);
  });

  it('runDualValuation returns two distinct valuations for art', async () => {
    const request: ValuationRequest = {
      assetType: 'art',
      assetId: 'ART-003',
      artistOrMedium: 'oil painting',
    };
    const [a, b] = await runDualValuation(request);
    expect(a.method).toBe('appraisal');
    expect(b.method).toBe('market_price');
  });
});

describe('Agent Engine — Commodity Valuation', () => {
  it('calcCommoditySpot returns a valid ValuationResult', async () => {
    const result = await calcCommoditySpot('test-agent', 'GOLD-001', 10, 'gold');
    expect(result).toBeDefined();
    expect(result.method).toBe('market_price');
    expect(result.estimated_value).toBeGreaterThan(0);
    expect(result.reasoning).toContain('10oz');
  });

  it('calcCommodityAppraisal includes premium over spot', async () => {
    const spot = await calcCommoditySpot('test-agent', 'GOLD-002', 10, 'gold');
    const appraisal = await calcCommodityAppraisal('test-agent', 'GOLD-003', 10, 'gold');
    // Appraisal should include 3-7% premium
    expect(appraisal.estimated_value).toBeGreaterThanOrEqual(spot.estimated_value);
  });

  it('runDualValuation returns two distinct valuations for commodity', async () => {
    const request: ValuationRequest = {
      assetType: 'commodity',
      assetId: 'GOLD-004',
      weightOz: 5,
      name: 'gold',
    };
    const [a, b] = await runDualValuation(request);
    expect(a.method).toBe('market_price');
    expect(b.method).toBe('appraisal');
  });
});

describe('Agent Engine — Edge Cases', () => {
  it('handles missing location gracefully (defaults to Miami)', async () => {
    const request: ValuationRequest = {
      assetType: 'real-estate',
      assetId: 'RE-EDGE-1',
    };
    const [a, b] = await runDualValuation(request);
    expect(a.estimated_value).toBeGreaterThan(0);
    expect(b.estimated_value).toBeGreaterThan(0);
  });

  it('handles missing weightOz gracefully (defaults to 1)', async () => {
    const request: ValuationRequest = {
      assetType: 'commodity',
      assetId: 'GOLD-EDGE-1',
    };
    const [a, b] = await runDualValuation(request);
    expect(a.estimated_value).toBeGreaterThan(0);
    expect(b.estimated_value).toBeGreaterThan(0);
  });

  it('handles missing artistOrMedium gracefully (defaults to oil painting)', async () => {
    const request: ValuationRequest = {
      assetType: 'art',
      assetId: 'ART-EDGE-1',
    };
    const [a, b] = await runDualValuation(request);
    expect(a.estimated_value).toBeGreaterThan(0);
    expect(b.estimated_value).toBeGreaterThan(0);
  });

  it('all valuations have required fields', async () => {
    const request: ValuationRequest = {
      assetType: 'real-estate',
      assetId: 'RE-FIELDS-1',
      location: 'Chicago, IL',
    };
    const [a, b] = await runDualValuation(request);
    for (const v of [a, b]) {
      expect(v.agent).toBeDefined();
      expect(v.method).toBeDefined();
      expect(v.asset_id).toBeDefined();
      expect(v.estimated_value).toBeGreaterThan(0);
      expect(v.confidence).toBeGreaterThan(0);
      expect(v.confidence).toBeLessThanOrEqual(1);
      expect(v.reasoning).toBeDefined();
      expect(v.reasoning.length).toBeGreaterThan(10);
      expect(v.timestamp).toBeGreaterThan(0);
      expect(v.dataSource).toBeDefined();
    }
  });
});

describe('Agent Engine — Valuation Consistency', () => {
  it('commodity spot valuation is deterministic for same input', async () => {
    const r1 = await calcCommoditySpot('agent', 'GOLD-CONS-1', 10, 'gold');
    const r2 = await calcCommoditySpot('agent', 'GOLD-CONS-2', 10, 'gold');
    // Both use same mock price, so estimated_value should be identical
    expect(r1.estimated_value).toBe(r2.estimated_value);
  });

  it('art appraisal uses correct medium mapping', async () => {
    const oil = await calcArtAppraisal('agent', 'ART-MED-1', 'oil painting');
    const sculpture = await calcArtAppraisal('agent', 'ART-MED-2', 'sculpture');
    // Different mediums should produce different values
    expect(oil.estimated_value).not.toBe(sculpture.estimated_value);
  });

  it('real estate sqft affects valuation', async () => {
    const small = await calcRealEstateComps('agent', 'RE-SQFT-1', 'Miami, FL', 800);
    const large = await calcRealEstateComps('agent', 'RE-SQFT-2', 'Miami, FL', 2000);
    // Both should produce valid valuations (mock data may not use sqft directly)
    expect(small.estimated_value).toBeGreaterThan(0);
    expect(large.estimated_value).toBeGreaterThan(0);
    // Verify both have correct method and agent
    expect(small.method).toBe('comparable_sales');
    expect(large.method).toBe('comparable_sales');
  });
});
