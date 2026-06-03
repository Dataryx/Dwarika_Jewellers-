/** Resolve an API path — in dev uses current origin (5173 storefront / 5174 admin). */
export function apiUrl(path: string) {
  const normalized = path.startsWith('/') ? path : `/${path}`;

  if (import.meta.env.DEV && typeof window !== 'undefined') {
    return `${window.location.origin}${normalized}`;
  }

  const apiBase = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
  if (apiBase) return `${apiBase}${normalized}`;

  if (typeof window !== 'undefined') {
    return `${window.location.origin}${normalized}`;
  }

  return normalized;
}

export function apiFetch(input: string, init?: RequestInit) {
  return fetch(apiUrl(input), init);
}
