import { apiUrl } from './apiUrl';

const MASTER_EMAIL = 'admin@dwarika.com';

export function getAdminEmail(): string | null {
  const raw = localStorage.getItem('adminEmail');
  return raw ? raw.trim().toLowerCase() : null;
}

/** Role is stored in MongoDB — use useAdminAuth().isMaster in React. */
export function isMasterAdmin(): boolean {
  return getAdminEmail() === MASTER_EMAIL;
}

export function adminHeaders(extra?: Record<string, string>): Record<string, string> {
  const email = getAdminEmail();
  return {
    ...extra,
    ...(email ? { 'X-Admin-Email': email } : {}),
  };
}

export function adminApiUrl(path: string): string {
  return apiUrl(path);
}

export function adminFetch(input: string, init?: RequestInit) {
  const headers = new Headers(init?.headers);
  const email = getAdminEmail();
  if (email) headers.set('X-Admin-Email', email);
  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  return fetch(adminApiUrl(input), { ...init, headers });
}

export { MASTER_EMAIL };
