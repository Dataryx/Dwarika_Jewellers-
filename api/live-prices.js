import { getMongoDb } from './_mongo.js';

const TROY_OUNCE_TO_GRAMS = 31.1034768;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 min
let cache = null;
let cacheAt = 0;

function toNum(v, fallback = null) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

async function fetchUsdNpr() {
  const res = await fetch('https://open.er-api.com/v6/latest/USD');
  if (!res.ok) throw new Error('Failed to fetch USD/NPR');
  const data = await res.json();
  const rate = toNum(data?.rates?.NPR);
  if (!rate) throw new Error('USD/NPR missing');
  return rate;
}

async function fetchGoldSilverUsdPerOz() {
  const res = await fetch('https://mintedmetal.com/api/prices.json');
  if (!res.ok) throw new Error('Failed to fetch metal spot data');
  const data = await res.json();
  const gold = toNum(data?.metals?.gold?.price);
  const silver = toNum(data?.metals?.silver?.price);
  if (!gold || !silver) throw new Error('Gold/Silver missing');
  return {
    goldUsdPerOz: gold,
    silverUsdPerOz: silver,
    updatedAt: data?.updatedAt || new Date().toISOString(),
    source: 'Minted Metal (LBMA)',
  };
}

async function fetchDiamondUsdPerCarat() {
  const payload = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: {
      name: 'get_diamond_price',
      arguments: { carat: 1, color: 'G', clarity: 'VS2', shape: 'round' },
    },
  };
  const res = await fetch('https://mcp.openfacet.net/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'MCP-Protocol-Version': '2025-06-18',
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to fetch diamond data');
  const data = await res.json();
  const text = data?.result?.content?.[0]?.text || '';
  const m = text.match(/Per Carat:\s*\$?\s*([0-9,]+(?:\.[0-9]+)?)/i);
  const perCarat = toNum(m?.[1]?.replace(/,/g, ''));
  if (!perCarat) throw new Error('Diamond per-carat value missing');
  return { diamondUsdPerCarat: perCarat, source: 'OpenFacet' };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const now = Date.now();
    if (cache && now - cacheAt < CACHE_TTL_MS) {
      return res.status(200).json({ ...cache, cached: true });
    }

    const [usdNpr, metals] = await Promise.all([fetchUsdNpr(), fetchGoldSilverUsdPerOz()]);
    const goldNprPerGram = (metals.goldUsdPerOz * usdNpr) / TROY_OUNCE_TO_GRAMS;
    const silverNprPerGram = (metals.silverUsdPerOz * usdNpr) / TROY_OUNCE_TO_GRAMS;

    // Diamond source can fail/rate-limit; fallback to store setting.
    let diamondNprPerCarat = null;
    let diamondSource = 'OpenFacet';
    try {
      const d = await fetchDiamondUsdPerCarat();
      diamondNprPerCarat = d.diamondUsdPerCarat * usdNpr;
    } catch {
      const db = await getMongoDb();
      const settings = await db.collection('settings').findOne({ _id: 'store_settings' });
      diamondNprPerCarat = toNum(settings?.diamondRatePerCarat, 0);
      diamondSource = 'Store Settings Fallback';
    }

    const payload = {
      currency: 'NPR',
      usdNpr,
      rates: {
        goldPerGram: Math.round(goldNprPerGram),
        silverPerGram: Math.round(silverNprPerGram),
        diamondPerCarat: Math.round(diamondNprPerCarat || 0),
      },
      sources: {
        goldSilver: metals.source,
        diamond: diamondSource,
      },
      updatedAt: metals.updatedAt || new Date().toISOString(),
      cached: false,
    };

    cache = payload;
    cacheAt = now;
    return res.status(200).json(payload);
  } catch (err) {
    console.error('Live prices API error:', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch live prices' });
  }
}

