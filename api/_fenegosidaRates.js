import { fetchRapidApiNepalRates } from './_rapidapiNepalRates.js';

const FENEGOSIDA_API_URL = 'https://api.fenegosida.org/api/website/v1/Dashboard/today';
const ASHESH_GOLD_URL = 'https://www.ashesh.com.np/gold/';
const FETCH_TIMEOUT_MS = 12000;

function toNum(v) {
  const n = Number(String(v ?? '').replace(/,/g, ''));
  return Number.isFinite(n) ? n : 0;
}

function emptyBullion() {
  return {
    finePerTola: 0,
    finePer10Gram: 0,
    tejabiPerTola: 0,
    tejabiPer10Gram: 0,
    silverPerTola: 0,
    silverPer10Gram: 0,
    source: '',
    updatedAt: new Date().toISOString(),
  };
}

/** Official FENEGOSIDA JSON API (SPA backend). Field names say "PerGram" but values are per listed unit. */
function parseFenegosidaApi(json) {
  const rows = Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : null;
  if (!rows?.length) return null;

  const out = emptyBullion();
  let updatedAt = null;

  for (const row of rows) {
    const label = String(row?.rateType || row?.RateType || '');
    const rate = toNum(row?.todayBaseRatePerGram ?? row?.todayRate ?? row?.rate);
    if (!rate) continue;

    const date = row?.todayDate || row?.TodayDate;
    if (date && !updatedAt) {
      const d = new Date(date);
      if (!Number.isNaN(d.getTime())) updatedAt = d.toISOString();
    }

    const isTola = /तोला|tola/i.test(label);
    const is10g = /१०\s*ग्राम|10\s*gr?a?m/i.test(label);
    const isGold = /सुन|gold|छापा|hallmark|fine/i.test(label);
    const isSilver = /चाँदी|चांदी|silver/i.test(label);
    const isTejabi = /तेजाबी|tejabi|tajabi/i.test(label);

    if (isGold && isTejabi && isTola) out.tejabiPerTola = rate;
    else if (isGold && isTejabi && is10g) out.tejabiPer10Gram = rate;
    else if (isGold && isTola) out.finePerTola = rate;
    else if (isGold && is10g) out.finePer10Gram = rate;
    else if (isSilver && isTola) out.silverPerTola = rate;
    else if (isSilver && is10g) out.silverPer10Gram = rate;
  }

  if (!out.finePerTola) return null;

  out.source = 'FENEGOSIDA (api.fenegosida.org)';
  out.updatedAt = updatedAt || new Date().toISOString();
  return out;
}

/** ashesh.com.np mirror of FENEGOSIDA board rates. */
function parseAsheshHtml(html) {
  const blocks = [...html.matchAll(/<div class="country">([\s\S]*?)<\/div>\s*(?:<div class="country">|<\/div>\s*<\/div>)/gi)].map(
    (m) => m[1]
  );
  // Broader: split by country cards
  const cards = html.split(/<div class="country">/i).slice(1);
  const out = emptyBullion();

  for (const card of cards.length ? cards : blocks) {
    const name = (card.match(/<div class="name">\s*([^<]+)/i)?.[1] || '').trim().toLowerCase();
    const rate = toNum(card.match(/<div class="rate_buying">\s*Rs\s*([\d,]+)/i)?.[1]);
    const unit = (card.match(/<div class="unit">\s*([^<]+)/i)?.[1] || '').trim().toLowerCase();
    if (!rate || !name) continue;

    const isTola = unit.includes('tola');
    const is10g = unit.includes('10') || unit.includes('gram');

    if (name.includes('hallmark') || name.includes('fine')) {
      if (isTola) out.finePerTola = rate;
      else if (is10g) out.finePer10Gram = rate;
    } else if (name.includes('tajabi') || name.includes('tejabi')) {
      if (isTola) out.tejabiPerTola = rate;
      else if (is10g) out.tejabiPer10Gram = rate;
    } else if (name.includes('silver')) {
      if (isTola) out.silverPerTola = rate;
      else if (is10g) out.silverPer10Gram = rate;
    }
  }

  if (!out.finePerTola) return null;
  out.source = 'ashesh.com.np (FENEGOSIDA mirror)';
  out.updatedAt = new Date().toISOString();
  return out;
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
        Accept: 'application/json, text/html',
        ...options.headers,
      },
    });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchFenegosidaApi() {
  const res = await fetchWithTimeout(FENEGOSIDA_API_URL, {
    headers: {
      Accept: 'application/json',
      Origin: 'https://fenegosida.org',
      Referer: 'https://fenegosida.org/',
    },
  });
  if (!res.ok) throw new Error(`FENEGOSIDA API HTTP ${res.status}`);
  const json = await res.json();
  return parseFenegosidaApi(json);
}

async function fetchAsheshMirror() {
  const res = await fetchWithTimeout(ASHESH_GOLD_URL, {
    headers: { Accept: 'text/html' },
  });
  if (!res.ok) throw new Error(`ashesh.com.np HTTP ${res.status}`);
  const html = await res.text();
  return parseAsheshHtml(html);
}

/** Nepal bullion board rates (per tola / per 10g). */
export async function fetchNepalBullionRates() {
  try {
    const parsed = await fetchFenegosidaApi();
    if (parsed) return parsed;
  } catch (err) {
    console.warn('FENEGOSIDA API failed:', err instanceof Error ? err.message : err);
  }

  try {
    const parsed = await fetchAsheshMirror();
    if (parsed) return parsed;
  } catch (err) {
    console.warn('ashesh.com.np gold mirror failed:', err instanceof Error ? err.message : err);
  }

  if (process.env.RAPIDAPI_KEY || process.env.RAPIDAPI_NEPAL_GOLD_KEY) {
    try {
      const rapid = await fetchRapidApiNepalRates();
      if (rapid?.finePerTola || rapid?.silverPerTola) return rapid;
    } catch (err) {
      console.warn('RapidAPI Nepal rates failed:', err instanceof Error ? err.message : err);
    }
  }

  return null;
}
