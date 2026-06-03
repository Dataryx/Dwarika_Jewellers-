const adminBase = (import.meta.env.VITE_ADMIN_URL || (typeof window !== 'undefined' ? window.location.origin : '')).replace(
  /\/$/,
  ''
);

export function adminUrl(path = '/') {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${adminBase}${normalized}`;
}
