/** Nepal bullion categories (FENEGOSIDA-style). Rates are per tola unless noted. */

export const GOLD_TYPES = [
  {
    id: 'fine',
    label: 'Fine Gold / Hallmark (24K)',
    labelNe: 'फाइन / छापावाल सुन (२४ क्यारेट)',
    purity: '24K',
  },
  {
    id: 'worked',
    label: 'Worked Gold (22K)',
    labelNe: 'वर्क्ड सुन (२२ क्यारेट)',
    purity: '22K',
  },
  {
    id: 'tejabi',
    label: 'Tejabi',
    labelNe: 'तेजाबी सुन',
    purity: '24K',
  },
];

function toNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function per10GramFromTola(perTola, gramsPerTola) {
  return Math.round((perTola * 10) / gramsPerTola);
}

function perGramFromTola(perTola, gramsPerTola) {
  return Math.round(perTola / gramsPerTola);
}

/**
 * Build ticker rows from FENEGOSIDA (or mirror) bullion data.
 * @param {object} bullion
 * @param {number} [gramsPerTola=11.664]
 */
export function buildGoldRatesFromBullion(bullion, gramsPerTola = 11.664) {
  const gpt = toNum(gramsPerTola, 11.664) || 11.664;
  const finePerTola = Math.round(toNum(bullion.finePerTola));
  const finePer10 =
    toNum(bullion.finePer10Gram) || per10GramFromTola(finePerTola, gpt);

  const workedPerTola = Math.round(finePerTola * (22 / 24));
  const workedPer10 = per10GramFromTola(workedPerTola, gpt);

  const tejabiPerTola = Math.round(toNum(bullion.tejabiPerTola));
  const tejabiPer10 =
    toNum(bullion.tejabiPer10Gram) ||
    (tejabiPerTola > 0 ? per10GramFromTola(tejabiPerTola, gpt) : 0);

  const rows = [
    {
      ...GOLD_TYPES[0],
      perTola: finePerTola,
      per10Gram: finePer10,
      perGram: perGramFromTola(finePerTola, gpt),
    },
    {
      ...GOLD_TYPES[1],
      perTola: workedPerTola,
      per10Gram: workedPer10,
      perGram: perGramFromTola(workedPerTola, gpt),
    },
  ];

  if (tejabiPerTola > 0) {
    rows.push({
      ...GOLD_TYPES[2],
      perTola: tejabiPerTola,
      per10Gram: tejabiPer10,
      perGram: perGramFromTola(tejabiPerTola, gpt),
    });
  }

  return rows;
}

/**
 * Admin master rate fallback (single fine gold per gram).
 * @param {Record<string, unknown>} settings
 */
export function buildNepalGoldRates(settings = {}) {
  const gramsPerTola = toNum(settings.gramsPerTola, 11.664) || 11.664;
  const finePerGram = toNum(settings.goldRatePerGram, 16358);
  const finePerTola = Math.round(finePerGram * gramsPerTola);

  return buildGoldRatesFromBullion(
    {
      finePerTola,
      finePer10Gram: per10GramFromTola(finePerTola, gramsPerTola),
      tejabiPerTola: 0,
    },
    gramsPerTola
  );
}
