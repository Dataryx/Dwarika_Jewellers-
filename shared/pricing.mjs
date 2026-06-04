const DEFAULT_GRAMS_PER_TOLA = 11.664;

function toNum(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/** Server-side product price (mirrors src/lib/pricing.ts). */
export function resolveProductPrice(product, settings) {
  if (!settings) return toNum(product?.price, 0);

  const goldWeight14k = toNum(product?.gold_weight_14k, 0);
  const diamondWeightCarat = toNum(product?.diamond_weight_carat, 0);
  const labourCharge = toNum(product?.labour_charge, 0);
  const goldExtraCharge = toNum(product?.gold_extra_charge, 0);
  const diamondExtraCharge = toNum(product?.diamond_extra_charge, 0);
  const productType = product?.product_type ?? 'both';

  if (
    goldWeight14k <= 0 &&
    diamondWeightCarat <= 0 &&
    labourCharge <= 0 &&
    goldExtraCharge <= 0 &&
    diamondExtraCharge <= 0
  ) {
    const baseGoldRate = toNum(settings.baseGoldRatePerGram, 16358);
    const liveGoldRate = toNum(settings.goldRatePerGram, baseGoldRate);
    const scale = baseGoldRate > 0 ? liveGoldRate / baseGoldRate : 1;
    return Math.round(toNum(product?.price, 0) * scale);
  }

  const gramsPerTola = toNum(settings.gramsPerTola, DEFAULT_GRAMS_PER_TOLA) || DEFAULT_GRAMS_PER_TOLA;
  const goldRatePerTola = toNum(settings.goldRatePerGram, 0) * gramsPerTola;
  const perGram14kGoldRate = (goldRatePerTola * 14) / 24 / gramsPerTola;
  const makingChargeRate = toNum(settings.goldMakingChargeRate, 0.4);

  const goldBase = goldWeight14k * perGram14kGoldRate;
  const goldMaking = goldBase * makingChargeRate;
  const goldSelling = goldBase + goldMaking + labourCharge + goldExtraCharge;

  const diamondSelling =
    diamondWeightCarat * toNum(settings.diamondRatePerCarat, 0) + diamondExtraCharge;
  if (productType === 'gold') return Math.round(goldSelling);
  if (productType === 'diamond') return Math.round(diamondSelling + labourCharge);
  return Math.round(goldSelling + diamondSelling);
}

/** Compute checkout totals server-side from cart items and store settings. */
export function computeCheckoutTotals(items, settings) {
  const subtotal = (items || []).reduce(
    (sum, line) => sum + toNum(line.unitPrice, 0) * toNum(line.quantity, 1),
    0
  );
  const freeThreshold = toNum(settings?.freeShippingThreshold, 5000);
  const shippingRate = toNum(settings?.standardShippingRate, 150);
  const taxRatePct = toNum(settings?.taxRate, 13);
  const shipping = subtotal >= freeThreshold ? 0 : shippingRate;
  const tax = Math.round(subtotal * (taxRatePct / 100));
  const total = subtotal + shipping + tax;
  return { subtotal, shipping_amount: shipping, tax_amount: tax, tax_rate: taxRatePct, total };
}
