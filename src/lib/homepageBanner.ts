import { apiFetch } from './apiUrl';
import { adminFetch } from './adminApi';

export type HomeBannerConfig = {
  imageUrl: string;
  kicker: string;
  titleLine1: string;
  titleHighlight: string;
  subtitle: string;
  updatedAt?: string;
};

export const BANNER_UPDATED_EVENT = 'dwarika:homepage-banner-updated';
const BANNER_CACHE_KEY = 'dwarika:homepage-banner';

export const DEFAULT_HOME_BANNER: HomeBannerConfig = {
  imageUrl: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1200',
  kicker: 'New Collection 2024',
  titleLine1: 'Timeless',
  titleHighlight: 'Elegance',
  subtitle:
    'Discover handcrafted jewelry that tells your story. Each piece is a masterpiece of artistry and passion.',
};

function mergeWithDefaults(partial: Partial<HomeBannerConfig> | null): HomeBannerConfig {
  if (!partial) return { ...DEFAULT_HOME_BANNER };
  const { updatedAt, ...rest } = partial;
  return { ...DEFAULT_HOME_BANNER, ...rest, ...(updatedAt ? { updatedAt } : {}) };
}

function isValidBanner(value: unknown): value is HomeBannerConfig {
  if (!value || typeof value !== 'object') return false;
  const v = value as Partial<HomeBannerConfig>;
  return Boolean(
    typeof v.imageUrl === 'string' &&
      v.imageUrl.trim() &&
      typeof v.kicker === 'string' &&
      typeof v.titleLine1 === 'string' &&
      typeof v.titleHighlight === 'string' &&
      typeof v.subtitle === 'string'
  );
}

/** Last banner shown on this device - avoids flashing defaults while the API loads. */
export function readCachedHomepageBanner(): HomeBannerConfig | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(BANNER_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    return isValidBanner(parsed) ? mergeWithDefaults(parsed) : null;
  } catch {
    return null;
  }
}

export function writeCachedHomepageBanner(config: HomeBannerConfig) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(BANNER_CACHE_KEY, JSON.stringify(config));
  } catch {
    /* quota exceeded for very large data URLs - ignore */
  }
}

/** @deprecated Use fetchHomepageBanner - banner is stored in MongoDB only. */
export function getHomepageBanner(): HomeBannerConfig {
  return readCachedHomepageBanner() ?? { ...DEFAULT_HOME_BANNER };
}

export async function fetchHomepageBanner(): Promise<HomeBannerConfig> {
  try {
    const res = await apiFetch('/api/banner', { cache: 'no-store' });
    if (!res.ok) throw new Error('API error');
    const data = await res.json();
    const merged = mergeWithDefaults(data);
    writeCachedHomepageBanner(merged);
    return merged;
  } catch {
    return readCachedHomepageBanner() ?? { ...DEFAULT_HOME_BANNER };
  }
}

export async function saveHomepageBannerToApi(config: HomeBannerConfig): Promise<void> {
  const res = await adminFetch('/api/banner', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
  const payload = (await res.json().catch(() => ({}))) as Partial<HomeBannerConfig> & {
    error?: string;
  };
  if (!res.ok) {
    throw new Error(payload.error || 'Failed to save banner to server');
  }

  const saved = mergeWithDefaults({ ...config, ...payload });
  writeCachedHomepageBanner(saved);
  window.dispatchEvent(new CustomEvent(BANNER_UPDATED_EVENT));
}

export function subscribeHomepageBanner(cb: () => void): () => void {
  const onCustom = () => cb();
  window.addEventListener(BANNER_UPDATED_EVENT, onCustom);
  return () => window.removeEventListener(BANNER_UPDATED_EVENT, onCustom);
}

/** Stable key for hero image - busts browser cache when banner changes. */
export function bannerImageKey(banner: HomeBannerConfig): string {
  const stamp = banner.updatedAt || '';
  const len = banner.imageUrl?.length || 0;
  return `${stamp}:${len}`;
}
