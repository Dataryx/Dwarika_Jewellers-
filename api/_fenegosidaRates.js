import { fetchRapidApiNepalRates } from './_rapidapiNepalRates.js';

const FENEGOSIDA_URL = 'https://fenegosida.org/';
const FALLBACK_API_URL = 'https://gold-silver.sabinmagar.com.np/wp-json/v1/metal-prices/';
const FETCH_TIMEOUT_MS = 12000;

function toNum(v) {
  const n = Number(String(v).replace(/,/g, ''));
  return Number.isFinite(n) ? n : 0;
}

function parseFenegosidaHtml(html) {
  const rateBlocks = [...html.matchAll(/id="header-rate">([\s\S]*?)<div class="clear">/gi)].map((m) => m[1]);
  const tolaBlock =
    rateBlocks.find((block) => block.includes('per 1 tola')) ?? rateBlocks.at(-1) ?? html;

  const fine10 = html.match(/FINE GOLD \(9999\)<br><span>per 10 grm[\s\S]*?<b>([\d,]+)<\/b>/i);
  const fineTola = tolaBlock.match(/FINE GOLD \(9999\)<br><span>per 1 tola[\s\S]*?<b>([\d,]+)<\/b>/i);
  const tejabi10 = html.match(/TEJABI GOLD<br><span>per 10 grm[\s\S]*?<b>([\d,]+)<\/b>/i);
  const tejabiTola = tolaBlock.match(/TEJABI GOLD<br><span>per 1 tola[\s\S]*?<b>([\d,]+)<\/b>/i);
  const silver10 = html.match(/<div class="rate-silver post">[\s\S]*?per 10 grm[\s\S]*?<b>([\d,.]+)<\/b>/i);
  const silverTola = tolaBlock.match(/SILVER<br><span>per 1 tola[\s\S]*?<b>([\d,]+)<\/b>/i);

  const finePerTola = toNum(fineTola?.[1]);
  if (!finePerTola) return null;

  return {
    finePerTola,
    finePer10Gram: toNum(fine10?.[1]),
    tejabiPerTola: toNum(tejabiTola?.[1]),
    tejabiPer10Gram: toNum(tejabi10?.[1]),
    silverPerTola: toNum(silverTola?.[1]),
    silverPer10Gram: toNum(silver10?.[1]),
    source: 'FENEGOSIDA (fenegosida.org)',
    updatedAt: new Date().toISOString(),
  };
}

function parseFallbackApi(json) {
  const rows = json?.data?.[0];
  if (!Array.isArray(rows)) return null;

  const byName = (name) => rows.find((r) => r?.metal?.name?.toLowerCase().includes(name));

  const chapawal = byName('chapawal');
  const tejabi = byName('tejabi');
  const silver = byName('silver');

  const finePerTola = toNum(chapawal?.price_per_tola);
  if (!finePerTola) return null;

  return {
    finePerTola,
    finePer10Gram: toNum(chapawal?.price_per_ten_gram),
    tejabiPerTola: toNum(tejabi?.price_per_tola),
    tejabiPer10Gram: toNum(tejabi?.price_per_ten_gram),
    silverPerTola: toNum(silver?.price_per_tola),
    silverPer10Gram: toNum(silver?.price_per_ten_gram),
    source: 'gold-silver.sabinmagar.com.np (FENEGOSIDA mirror)',
    updatedAt: chapawal?.date ? `${chapawal.date}T10:00:00+05:45` : new Date().toISOString(),
  };
}

async function fetchWithTimeout(url, options = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, {
      ...options,
      signal: ctrl.signal,
      headers: {
        'User-Agent': 'Dwarika-Jewellery/1.0 (+https://dwarika.com)',
        Accept: 'text/html,application/json',
        ...options.headers,
      },
    });
  } finally {
    clearTimeout(timer);
  }
}

/** Nepal bullion board rates (per tola / per 10g). */
export async function fetchNepalBullionRates() {
  try {
    const res = await fetchWithTimeout(FENEGOSIDA_URL);
    if (!res.ok) throw new Error(`FENEGOSIDA HTTP ${res.status}`);
    const html = await res.text();
    const parsed = parseFenegosidaHtml(html);
    if (parsed) return parsed;
  } catch (err) {
    console.warn('FENEGOSIDA fetch failed:', err.message);
  }

  if (process.env.RAPIDAPI_KEY || process.env.RAPIDAPI_NEPAL_GOLD_KEY) {
    try {
      const rapid = await fetchRapidApiNepalRates();
      if (rapid?.finePerTola || rapid?.silverPerTola) return rapid;
    } catch (err) {
      console.warn('RapidAPI Nepal rates failed:', err.message);
    }
  }

  try {
    const res = await fetchWithTimeout(FALLBACK_API_URL, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`Fallback API HTTP ${res.status}`);
    const json = await res.json();
    const parsed = parseFallbackApi(json);
    if (parsed) return parsed;
  } catch (err) {
    console.warn('Nepal bullion fallback API failed:', err.message);
  }

  return null;
}
