import { Product } from './store';
import { StoreSettings } from './useStoreSettings';

const DEFAULT_GRAMS_PER_TOLA = 11.664;

function toNum(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Excel-inspired selling logic from "all Rate price":
 * Gold:
 *   AC = (goldRatePerTola * 14/24) / gramsPerTola * goldWeight14k
 *   AD = AC * goldMakingChargeRate
 *   AF = AC + AD + labourCharge + goldExtraCharge
 * Silver (same structure, fine silver rate — no 14K purity factor):
 *   SC = silverRatePerGram * silverWeight
 *   SD = SC * goldMakingChargeRate
 *   SF = SC + SD + labourCharge + silverExtraCharge
 * Diamond:
 *   AB = diamondWeightCarat * diamondRatePerCarat + diamondExtraCharge
 */
export function resolveProductPrice(product: Product, settings: StoreSettings | null): number {
  if (!settings) return toNum(product.price, 0);

  const goldWeight14k = toNum(product.gold_weight_14k, 0);
  const silverWeight = toNum(product.silver_weight, 0);
  const diamondWeightCarat = toNum(product.diamond_weight_carat, 0);
  const labourCharge = toNum(product.labour_charge, 0);
  const goldExtraCharge = toNum(product.gold_extra_charge, 0);
  const silverExtraCharge = toNum(product.silver_extra_charge, 0);
  const diamondExtraCharge = toNum(product.diamond_extra_charge, 0);
  const productType = product.product_type ?? 'both';

  // Global scaling fallback when detailed metal weights are not available.
  if (
    goldWeight14k <= 0 &&
    silverWeight <= 0 &&
    diamondWeightCarat <= 0 &&
    labourCharge <= 0 &&
    goldExtraCharge <= 0 &&
    silverExtraCharge <= 0 &&
    diamondExtraCharge <= 0
  ) {
    if (productType === 'silver') {
      return Math.round(toNum(product.price, 0));
    }
    const baseGoldRate = toNum(settings.baseGoldRatePerGram, 16358);
    const liveGoldRate = toNum(settings.goldRatePerGram, baseGoldRate);
    const scale = baseGoldRate > 0 ? liveGoldRate / baseGoldRate : 1;
    return Math.round(toNum(product.price, 0) * scale);
  }

  const gramsPerTola = toNum(settings.gramsPerTola, DEFAULT_GRAMS_PER_TOLA) || DEFAULT_GRAMS_PER_TOLA;
  const makingChargeRate = toNum(settings.goldMakingChargeRate, 0.4);

  const goldRatePerTola = toNum(settings.goldRatePerGram, 0) * gramsPerTola;
  const perGram14kGoldRate = (goldRatePerTola * 14) / 24 / gramsPerTola;
  const goldBase = goldWeight14k * perGram14kGoldRate;
  const goldMaking = goldBase * makingChargeRate;
  const goldSelling = goldBase + goldMaking + labourCharge + goldExtraCharge;

  const silverBase = silverWeight * toNum(settings.silverRatePerGram, 0);
  const silverMaking = silverBase * makingChargeRate;
  const silverSelling = silverBase + silverMaking + labourCharge + silverExtraCharge;

  const diamondSelling =
    diamondWeightCarat * toNum(settings.diamondRatePerCarat, 0) + diamondExtraCharge;

  if (productType === 'gold') return Math.round(goldSelling);
  if (productType === 'silver') return Math.round(silverSelling);
  if (productType === 'diamond') return Math.round(diamondSelling + labourCharge);
  return Math.round(goldSelling + diamondSelling);
}
