import { apiUrl } from './apiUrl';

const MASTER_EMAIL = 'admin@dwarika.com';
const TOKEN_KEY = 'adminAuthToken';

export function getAdminToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAdminToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function getAdminEmail(): string | null {
  const raw = localStorage.getItem('adminEmail');
  return raw ? raw.trim().toLowerCase() : null;
}

/** Role is stored in MongoDB - use useAdminAuth().isMaster in React. */
export function isMasterAdmin(): boolean {
  return getAdminEmail() === MASTER_EMAIL;
}

export function adminHeaders(extra?: Record<string, string>): Record<string, string> {
  const token = getAdminToken();
  return {
    ...extra,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export function adminApiUrl(path: string): string {
  return apiUrl(path);
}

export function adminFetch(input: string, init?: RequestInit) {
  const headers = new Headers(init?.headers);
  const token = getAdminToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  return fetch(adminApiUrl(input), { ...init, headers });
}

export { MASTER_EMAIL };
