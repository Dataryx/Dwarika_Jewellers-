// @ts-expect-error Shared ESM module - no bundled types
export { GOLD_TYPES, buildNepalGoldRates } from '../../shared/goldRates.mjs';

export type NepalGoldRateRow = {
  id: string;
  label: string;
  labelNe: string;
  purity: string;
  perTola: number;
  per10Gram: number;
  perGram: number;
};
