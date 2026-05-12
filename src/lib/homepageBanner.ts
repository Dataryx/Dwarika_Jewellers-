export type HomeBannerConfig = {
  imageUrl: string;
  kicker: string;
  titleLine1: string;
  titleHighlight: string;
  subtitle: string;
};

const STORAGE_KEY = 'dwarika_homepage_banner_v2';

export const BANNER_UPDATED_EVENT = 'dwarika:homepage-banner-updated';

export const DEFAULT_HOME_BANNER: HomeBannerConfig = {
  imageUrl: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1200',
  kicker: 'New Collection 2024',
  titleLine1: 'Timeless',
  titleHighlight: 'Elegance',
  subtitle:
    'Discover handcrafted jewelry that tells your story. Each piece is a masterpiece of artistry and passion.',
};

function mergeWithDefaults(partial: Partial<HomeBannerConfig>): HomeBannerConfig {
  return { ...DEFAULT_HOME_BANNER, ...partial };
}

export function getHomepageBanner(): HomeBannerConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_HOME_BANNER };
    const parsed = JSON.parse(raw) as Partial<HomeBannerConfig>;
    return mergeWithDefaults(parsed);
  } catch {
    return { ...DEFAULT_HOME_BANNER };
  }
}

export async function fetchHomepageBanner(): Promise<HomeBannerConfig> {
  try {
    const res = await fetch('/api/banner');
    if (!res.ok) throw new Error('API error');
    const data = await res.json();
    if (!data) return { ...DEFAULT_HOME_BANNER };
    return mergeWithDefaults(data);
  } catch {
    return getHomepageBanner();
  }
}

export async function saveHomepageBannerToApi(config: HomeBannerConfig): Promise<void> {
  const res = await fetch('/api/banner', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
  if (!res.ok) throw new Error('Failed to save banner to server');

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    /* localStorage may exceed quota — API save succeeded so ignore */
  }
  window.dispatchEvent(new CustomEvent(BANNER_UPDATED_EVENT));
}

export function subscribeHomepageBanner(cb: () => void): () => void {
  const onCustom = () => cb();
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) cb();
  };
  window.addEventListener(BANNER_UPDATED_EVENT, onCustom);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(BANNER_UPDATED_EVENT, onCustom);
    window.removeEventListener('storage', onStorage);
  };
}
