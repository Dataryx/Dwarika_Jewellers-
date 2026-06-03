const storefrontBase = (import.meta.env.VITE_STOREFRONT_URL || 'http://localhost:5173').replace(/\/$/, '');

export function storefrontUrl(path = '/') {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${storefrontBase}${normalized}`;
}
