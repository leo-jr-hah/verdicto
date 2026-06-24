/**
 * Unified Data Sources for Verdict
 * 
 * Wraps all external APIs into a clean interface:
 *   - Real Estate: RentCast API (comps, property data)
 *   - Fine Art: Met Museum API (free, unlimited)
 *   - Gold/Commodities: CoinGecko API (spot prices)
 *   - Macro: FRED API (interest rates, CPI)
 * 
 * Each function returns a normalized AssetData object
 * that agents can consume regardless of asset type.
 */

import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import type { AssetType, AssetListing } from './types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AssetData {
  type: AssetType;
  name: string;
  query: string;
  priceData: any;
  comparables: any[];
  marketContext: any;
  source: string;
  timestamp: number;
}

// ─── Real Estate (RentCast API) ──────────────────────────────────────────────

const RENTCAST_API_KEY = process.env.RENTCAST_API_KEY;
const RENTCAST_BASE = 'https://api.rentcast.io/v1';

export async function getRealEstateData(address: string): Promise<AssetData> {
  const [propertyRes, compsRes] = await Promise.allSettled([
    // Property details
    RENTCAST_API_KEY ? axios.get(
      `${RENTCAST_BASE}/properties?address=${encodeURIComponent(address)}`,
      { headers: { 'X-Api-Key': RENTCAST_API_KEY }, timeout: 10000 }
    ) : Promise.reject(new Error('No API key')),

    // Comparable sales
    RENTCAST_API_KEY ? axios.get(
      `${RENTCAST_BASE}/listings/sale?address=${encodeURIComponent(address)}&status=Active&limit=10`,
      { headers: { 'X-Api-Key': RENTCAST_API_KEY }, timeout: 10000 }
    ) : Promise.reject(new Error('No API key')),
  ]);

  const property = propertyRes.status === 'fulfilled' ? propertyRes.value.data : null;
  const comps = compsRes.status === 'fulfilled' ? compsRes.value.data : [];

  return {
    type: 'real-estate',
    name: property?.address || address,
    query: address,
    priceData: {
      estimatedValue: property?.price || property?.avm || null,
      sqft: property?.squareFootage || null,
      bedrooms: property?.bedrooms || null,
      bathrooms: property?.bathrooms || null,
      yearBuilt: property?.yearBuilt || null,
      propertyType: property?.propertyType || 'Unknown',
    },
    comparables: (Array.isArray(comps) ? comps : []).map((c: any) => ({
      address: c.formattedAddress || c.address,
      price: c.price || 0,
      sqft: c.squareFootage || 0,
      pricePerSqft: c.price && c.squareFootage ? Math.round(c.price / c.squareFootage) : 0,
      daysOnMarket: c.daysOnMarket || 0,
    })),
    marketContext: {
      source: 'RentCast',
      totalComps: Array.isArray(comps) ? comps.length : 0,
    },
    source: 'RentCast API',
    timestamp: Date.now(),
  };
}

// ─── Fine Art (Met Museum API, free, no key needed) ─────────────────────────

const MET_API_BASE = 'https://collectionapi.metmuseum.org/public/collection/v1';

export async function getArtData(query: string): Promise<AssetData> {
  // Search for artworks
  const searchRes = await axios.get(
    `${MET_API_BASE}/search?q=${encodeURIComponent(query)}&hasImages=true`,
    { timeout: 10000 }
  );

  const objectIDs = searchRes.data?.objectIDs?.slice(0, 5) || [];

  if (objectIDs.length === 0) {
    return {
      type: 'art',
      name: query,
      query,
      priceData: { estimatedValue: null, note: 'No matching artworks found' },
      comparables: [],
      marketContext: { source: 'Met Museum', totalResults: 0 },
      source: 'Met Museum API',
      timestamp: Date.now(),
    };
  }

  // Fetch details for top results
  const details = await Promise.allSettled(
    objectIDs.map((id: number) =>
      axios.get(`${MET_API_BASE}/objects/${id}`, { timeout: 8000 })
    )
  );

  const artworks = details
    .filter(d => d.status === 'fulfilled')
    .map((d: any) => d.value.data)
    .filter(a => a && a.primaryImage);

  return {
    type: 'art',
    name: artworks[0]?.title || query,
    query,
    priceData: {
      // Met Museum doesn't provide prices, we use this for comparable analysis
      estimatedValue: null,
      note: 'Art valuation requires auction data. Met Museum provides provenance/comparables',
    },
    comparables: artworks.map((a: any) => ({
      title: a.title,
      artist: a.artistDisplayName || 'Unknown',
      date: a.objectDate || 'Unknown',
      medium: a.medium || 'Unknown',
      dimensions: a.dimensions || 'Unknown',
      department: a.department || 'Unknown',
      metUrl: a.objectURL || null,
      imageUrl: a.primaryImageSmall || null,
    })),
    marketContext: {
      source: 'Met Museum',
      totalResults: searchRes.data?.total || 0,
      queriedResults: artworks.length,
    },
    source: 'Met Museum API',
    timestamp: Date.now(),
  };
}

// ─── Gold/Commodities (CoinGecko API) ───────────────────────────────────────

const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY;
const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';

// Map commodity names to CoinGecko IDs (verified working on free API tier)
const COMMODITY_IDS: Record<string, string> = {
  gold: 'pax-gold',                // PAX Gold — tracks physical gold spot price
  silver: 'kinesis-silver',        // Kinesis Silver (KAG) — tracks physical silver
  platinum: 'gram-platinum',       // Gram Platinum — tracks physical platinum
  palladium: 'palladium-rstock',   // Palladium rStock — tracks physical palladium
};

export async function getGoldData(): Promise<AssetData> {
  const coinId = COMMODITY_IDS['gold'];
  const params: any = {
    ids: coinId,
    vs_currencies: 'usd',
    include_24hr_change: true,
    include_market_cap: true,
  };

  if (COINGECKO_API_KEY) {
    params.x_cg_demo_api_key = COINGECKO_API_KEY;
  }

  const response = await axios.get(`${COINGECKO_BASE}/simple/price`, {
    params,
    timeout: 10000,
  });

  const goldData = response.data?.[coinId] || {};

  return {
    type: 'commodity',
    name: 'Gold (XAU)',
    query: 'gold',
    priceData: {
      pricePerOz: goldData.usd || null,
      change24h: goldData.usd_24h_change || null,
      marketCap: goldData.usd_market_cap || null,
    },
    comparables: [],
    marketContext: {
      source: 'CoinGecko',
      currency: 'USD',
    },
    source: 'CoinGecko API',
    timestamp: Date.now(),
  };
}

/**
 * Get commodity price by ID (gold, silver, platinum, etc.)
 */
export async function getCommodityData(commodityId: string): Promise<AssetData> {
  const coinId = COMMODITY_IDS[commodityId] || commodityId;
  const params: any = {
    ids: coinId,
    vs_currencies: 'usd',
    include_24hr_change: true,
  };

  if (COINGECKO_API_KEY) {
    params.x_cg_demo_api_key = COINGECKO_API_KEY;
  }

  const response = await axios.get(`${COINGECKO_BASE}/simple/price`, {
    params,
    timeout: 10000,
  });

  const data = response.data?.[coinId] || {};

  return {
    type: 'commodity',
    name: commodityId.charAt(0).toUpperCase() + commodityId.slice(1),
    query: commodityId,
    priceData: {
      pricePerOz: data.usd || null,
      change24h: data.usd_24h_change || null,
    },
    comparables: [],
    marketContext: {
      source: 'CoinGecko',
      currency: 'USD',
    },
    source: 'CoinGecko API',
    timestamp: Date.now(),
  };
}

// ─── Macro Context (FRED API) ────────────────────────────────────────────────

const FRED_API_KEY = process.env.FRED_API_KEY;

export async function getMacroContext(): Promise<any> {
  if (!FRED_API_KEY) {
    return {
      mortgageRate: null,
      note: 'FRED API key not configured',
    };
  }

  try {
    const response = await axios.get(
      `https://api.stlouisfed.org/fred/series/observations?series_id=MORTGAGE30US&api_key=${FRED_API_KEY}&sort_order=desc&limit=1&file_type=json`,
      { timeout: 10000 }
    );

    const observations = response.data?.observations;
    const rate = observations?.[0]?.value ? parseFloat(observations[0].value) / 100 : null;

    return {
      mortgageRate: rate,
      date: observations?.[0]?.date || null,
      source: 'FRED',
    };
  } catch (err: any) {
    return {
      mortgageRate: null,
      error: err.message,
    };
  }
}

// ─── Unified Fetcher ─────────────────────────────────────────────────────────

/**
 * Fetch data for any asset type. Returns normalized AssetData.
 */
export async function fetchAssetData(listing: AssetListing): Promise<AssetData> {
  switch (listing.type) {
    case 'real-estate':
      return getRealEstateData(listing.location || listing.name);

    case 'art':
      return getArtData(listing.artist || listing.name);

    case 'commodity': {
      const name = (listing.name || '').toLowerCase();
      if (name.includes('silver')) return getCommodityData('silver');
      if (name.includes('platinum')) return getCommodityData('platinum');
      if (name.includes('palladium')) return getCommodityData('palladium');
      return getCommodityData('gold');
    }

    default:
      throw new Error(`Unsupported asset type: ${listing.type}`);
  }
}
