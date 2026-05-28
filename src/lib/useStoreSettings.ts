import { useState, useEffect } from 'react';

export interface StoreSettings {
  taxRate: number;
  baseGoldRatePerGram: number;
  goldRatePerGram: number;
  diamondRatePerCarat: number;
  goldMakingChargeRate: number;
  gramsPerTola: number;
  freeShippingThreshold: number;
  standardShippingRate: number;
  expressShippingRate: number;
  processingDays: number;
  paymentMethods: Record<string, boolean>;
  notifications: Record<string, boolean>;
}

const DEFAULTS: StoreSettings = {
  taxRate: 13,
  baseGoldRatePerGram: 16358,
  goldRatePerGram: 16358,
  diamondRatePerCarat: 28000,
  goldMakingChargeRate: 0.4,
  gramsPerTola: 11.664,
  freeShippingThreshold: 5000,
  standardShippingRate: 150,
  expressShippingRate: 350,
  processingDays: 2,
  paymentMethods: {
    'Cash on Delivery': true,
    'eSewa': true,
    'Khalti': true,
    'Bank Transfer': false,
    'Credit / Debit Card': false,
  },
  notifications: {
    newOrders: true,
    lowStock: true,
    newReviews: false,
    customerSignups: true,
    dailyReport: true,
    marketingEmails: false,
  },
};

let cached: StoreSettings | null = null;
let fetching: Promise<StoreSettings> | null = null;
const SETTINGS_EVENT = 'dwarika:settings-updated';

async function load(): Promise<StoreSettings> {
  if (cached) return cached;
  if (fetching) return fetching;
  fetching = fetch('/api/settings')
    .then((r) => r.json())
    .then((data) => {
      cached = { ...DEFAULTS, ...data };
      return cached!;
    })
    .catch(() => DEFAULTS);
  return fetching;
}

export function invalidateSettingsCache() {
  cached = null;
  fetching = null;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(SETTINGS_EVENT));
  }
}

export function useStoreSettings(): StoreSettings | null {
  const [settings, setSettings] = useState<StoreSettings | null>(cached);
  useEffect(() => {
    const refresh = () => load().then(setSettings);
    refresh();
    window.addEventListener(SETTINGS_EVENT, refresh);
    return () => window.removeEventListener(SETTINGS_EVENT, refresh);
  }, []);
  return settings;
}
