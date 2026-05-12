import { useState, useEffect } from 'react';

export interface StoreSettings {
  taxRate: number;
  freeShippingThreshold: number;
  standardShippingRate: number;
  expressShippingRate: number;
  processingDays: number;
  paymentMethods: Record<string, boolean>;
  notifications: Record<string, boolean>;
}

const DEFAULTS: StoreSettings = {
  taxRate: 13,
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
}

export function useStoreSettings(): StoreSettings | null {
  const [settings, setSettings] = useState<StoreSettings | null>(cached);
  useEffect(() => {
    load().then(setSettings);
  }, []);
  return settings;
}
