import { getMongoDb } from './_mongo.js';
import { fetchNepalBullionRates } from './_fenegosidaRates.js';
import { buildGoldRatesFromBullion, buildNepalGoldRates } from '../shared/goldRates.mjs';

const SETTINGS_ID = 'store_settings';
const DEFAULT_GRAMS_PER_TOLA = 11.664;
const DEFAULT_DIAMOND_PER_CARAT = 28000;
const CACHE_TTL_MS = 30 * 60 * 1000; // FENEGOSIDA updates once daily

function getCacheState() {
  if (!globalThis.__dwarikaLivePrices) {
    globalThis.__dwarikaLivePrices = { payload: null, at: 0 };
  }
  return globalThis.__dwarikaLivePrices;
}

export function clearLivePricesCache() {
  const state = getCacheState();
  state.payload = null;
  state.at = 0;
}

function toNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function buildPayloadFromBullion(bullion, settings) {
  const gramsPerTola = toNum(settings?.gramsPerTola, DEFAULT_GRAMS_PER_TOLA) || DEFAULT_GRAMS_PER_TOLA;
  const goldTypes = buildGoldRatesFromBullion(bullion, gramsPerTola);
  const fine = goldTypes.find((g) => g.id === 'fine');

  const silverPerTola = Math.round(toNum(bullion.silverPerTola));
  const silverPer10 = Math.round(
    toNum(bullion.silverPer10Gram) || (silverPerTola * 10) / gramsPerTola
  );
  const silverPerGram = silverPerTola > 0 ? Math.round(silverPerTola / gramsPerTola) : 0;

  const diamondPerCarat = toNum(settings?.diamondRatePerCarat, DEFAULT_DIAMOND_PER_CARAT);

  return {
    currency: 'NPR',
    gramsPerTola,
    goldTypes,
    rates: {
      goldPerGram: fine?.perGram ?? 0,
      goldPerTola: fine?.perTola ?? 0,
      silverPerGram,
      silverPerTola,
      silverPer10Gram: silverPer10,
      diamondPerCarat: Math.round(diamondPerCarat),
    },
    sources: {
      gold: bullion.source,
      silver: bullion.source,
      diamond: 'Admin master rate',
    },
    updatedAt: bullion.updatedAt || new Date().toISOString(),
  };
}

function buildPayloadFromSettings(settings) {
  const gramsPerTola = toNum(settings?.gramsPerTola, DEFAULT_GRAMS_PER_TOLA) || DEFAULT_GRAMS_PER_TOLA;
  const goldTypes = buildNepalGoldRates(settings || {});
  const fine = goldTypes.find((g) => g.id === 'fine');
  const silverPerGram = toNum(settings?.silverRatePerGram, 434);
  const silverPerTola = Math.round(silverPerGram * gramsPerTola);

  return {
    currency: 'NPR',
    gramsPerTola,
    goldTypes,
    rates: {
      goldPerGram: fine?.perGram ?? 0,
      goldPerTola: fine?.perTola ?? 0,
      silverPerGram: Math.round(silverPerGram),
      silverPerTola,
      silverPer10Gram: Math.round((silverPerTola * 10) / gramsPerTola),
      diamondPerCarat: Math.round(toNum(settings?.diamondRatePerCarat, DEFAULT_DIAMOND_PER_CARAT)),
    },
    sources: {
      gold: 'Admin settings (FENEGOSIDA unavailable)',
      silver: 'Admin settings',
      diamond: 'Admin master rate',
    },
    updatedAt: settings?.pricingUpdatedAt || new Date().toISOString(),
    stale: true,
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const state = getCacheState();
    const now = Date.now();
    if (state.payload && now - state.at < CACHE_TTL_MS) {
      return res.status(200).json({ ...state.payload, cached: true });
    }

    const db = await getMongoDb();
    const settings = await db.collection('settings').findOne({ _id: SETTINGS_ID });

    const bullion = await fetchNepalBullionRates();
    const payload = bullion
      ? buildPayloadFromBullion(bullion, settings)
      : buildPayloadFromSettings(settings);

    state.payload = payload;
    state.at = now;
    return res.status(200).json({ ...payload, cached: false });
  } catch (err) {
    console.error('Live prices API error:', err);
    const state = getCacheState();
    if (state.payload) {
      return res.status(200).json({ ...state.payload, cached: true, stale: true });
    }
    return res.status(500).json({ error: err.message || 'Failed to fetch live prices' });
  }
}
