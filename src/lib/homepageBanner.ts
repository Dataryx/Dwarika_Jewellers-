import { apiFetch } from './apiUrl';

export type HomeBannerConfig = {
  imageUrl: string;
  kicker: string;
  titleLine1: string;
  titleHighlight: string;
  subtitle: string;
};

export const BANNER_UPDATED_EVENT = 'dwarika:homepage-banner-updated';

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
  return { ...DEFAULT_HOME_BANNER, ...partial };
}

/** @deprecated Use fetchHomepageBanner — banner is stored in MongoDB only. */
export function getHomepageBanner(): HomeBannerConfig {
  return { ...DEFAULT_HOME_BANNER };
}

export async function fetchHomepageBanner(): Promise<HomeBannerConfig> {
  try {
    const res = await apiFetch('/api/banner');
    if (!res.ok) throw new Error('API error');
    const data = await res.json();
    return mergeWithDefaults(data);
  } catch {
    return { ...DEFAULT_HOME_BANNER };
  }
}

export async function saveHomepageBannerToApi(config: HomeBannerConfig): Promise<void> {
  const res = await apiFetch('/api/banner', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
  if (!res.ok) throw new Error('Failed to save banner to server');
  window.dispatchEvent(new CustomEvent(BANNER_UPDATED_EVENT));
}

export function subscribeHomepageBanner(cb: () => void): () => void {
  const onCustom = () => cb();
  window.addEventListener(BANNER_UPDATED_EVENT, onCustom);
  return () => window.removeEventListener(BANNER_UPDATED_EVENT, onCustom);
}
