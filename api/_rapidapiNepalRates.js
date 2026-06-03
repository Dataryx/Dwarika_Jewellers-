const RAPIDAPI_HOST = 'gold-and-silver-price-in-nepal.p.rapidapi.com';
const FETCH_TIMEOUT_MS = 12000;

function toNum(v) {
  const n = Number(String(v ?? '').replace(/,/g, ''));
  return Number.isFinite(n) ? n : 0;
}

function pick(obj, keys) {
  for (const key of keys) {
    const parts = key.split('.');
    let cur = obj;
    for (const p of parts) {
      cur = cur?.[p];
    }
    const n = toNum(cur);
    if (n > 0) return n;
  }
  return 0;
}

function parseRapidApiBody(json) {
  const root = json?.data ?? json?.result ?? json;

  const finePerTola = pick(root, [
    'fine_gold_per_tola',
    'fineGoldPerTola',
    'gold_per_tola',
    'goldPerTola',
    'chapawal_per_tola',
    'chapawalPerTola',
    'gold.tola',
    'gold.per_tola',
    'rates.gold.tola',
  ]);

  const finePer10Gram = pick(root, [
    'fine_gold_per_10_gram',
    'fineGoldPer10Gram',
    'gold_per_10_gram',
    'goldPer10Gram',
    'chapawal_per_10_gram',
    'gold.per_10_gram',
    'rates.gold.per_10_gram',
  ]);

  const tejabiPerTola = pick(root, [
    'tejabi_gold_per_tola',
    'tejabiPerTola',
    'tejabi.per_tola',
    'rates.tejabi.tola',
  ]);

  const tejabiPer10Gram = pick(root, [
    'tejabi_gold_per_10_gram',
    'tejabiPer10Gram',
    'tejabi.per_10_gram',
  ]);

  const silverPerTola = pick(root, [
    'silver_per_tola',
    'silverPerTola',
    'silver.tola',
    'rates.silver.tola',
  ]);

  const silverPer10Gram = pick(root, [
    'silver_per_10_gram',
    'silverPer10Gram',
    'silver.per_10_gram',
    'rates.silver.per_10_gram',
  ]);

  if (!finePerTola && !silverPerTola) return null;

  return {
    finePerTola: finePerTola || 0,
    finePer10Gram,
    tejabiPerTola,
    tejabiPer10Gram,
    silverPerTola,
    silverPer10Gram,
    source: 'RapidAPI — Gold and Silver Price in Nepal',
    updatedAt: root?.updated_at ?? root?.updatedAt ?? new Date().toISOString(),
  };
}

async function rapidGet(path, apiKey) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(`https://${RAPIDAPI_HOST}${path}`, {
      signal: ctrl.signal,
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': RAPIDAPI_HOST,
        Accept: 'application/json',
      },
    });
    const text = await res.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      return { ok: false, status: res.status, json: null };
    }
    return { ok: res.ok, status: res.status, json };
  } finally {
    clearTimeout(timer);
  }
}

/** Optional: RapidAPI Nepal bullion (requires subscription key). */
export async function fetchRapidApiNepalRates() {
  const apiKey = process.env.RAPIDAPI_KEY || process.env.RAPIDAPI_NEPAL_GOLD_KEY;
  if (!apiKey) return null;

  const paths = ['/prices', '/gold-and-silver', '/gold', '/'];
  for (const path of paths) {
    try {
      const { ok, status, json } = await rapidGet(path, apiKey);
      if (!ok) continue;
      const parsed = parseRapidApiBody(json);
      if (parsed?.finePerTola || parsed?.silverPerTola) {
        if (!parsed.finePerTola && parsed.silverPerTola) {
          const goldOnly = await rapidGet('/gold', apiKey);
          if (goldOnly.ok) {
            const g = parseRapidApiBody(goldOnly.json);
            if (g?.finePerTola) parsed.finePerTola = g.finePerTola;
            if (g?.finePer10Gram) parsed.finePer10Gram = g.finePer10Gram;
          }
        }
        if (parsed.finePerTola || parsed.silverPerTola) return parsed;
      }
    } catch (err) {
      console.warn(`RapidAPI ${path} failed:`, err.message);
    }
  }

  return null;
}
