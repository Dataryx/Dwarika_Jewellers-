import { apiFetch } from './apiUrl';

const TOKEN_KEY = 'customerAuthToken';

export interface CustomerUser {
  email: string;
  name: string;
  phone?: string;
  address?: string;
  city?: string;
  auth_provider?: string;
  email_verified?: boolean;
  created_at?: string;
}

export class CustomerAuthError extends Error {
  code?: string;
  email?: string;

  constructor(message: string, code?: string, email?: string) {
    super(message);
    this.name = 'CustomerAuthError';
    this.code = code;
    this.email = email;
  }
}

export function getCustomerToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setCustomerToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function customerAuthHeaders(extra?: Record<string, string>): Record<string, string> {
  const token = getCustomerToken();
  return {
    ...extra,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function parseAuthResponse(res: Response) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new CustomerAuthError(
      data.error || 'Request failed',
      data.code,
      data.email
    );
  }
  return data as {
    token?: string;
    user?: CustomerUser;
    message?: string;
    ok?: boolean;
    requiresVerification?: boolean;
  };
}

export async function registerCustomer(input: {
  email: string;
  password: string;
  name: string;
}) {
  const res = await apiFetch('/api/customer-auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'register',
      email: input.email.trim().toLowerCase(),
      password: input.password,
      name: input.name.trim(),
      origin: typeof window !== 'undefined' ? window.location.origin : '',
    }),
  });
  return parseAuthResponse(res);
}

export async function loginCustomer(email: string, password: string) {
  const res = await apiFetch('/api/customer-auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'login',
      email: email.trim().toLowerCase(),
      password,
    }),
  });
  const data = await parseAuthResponse(res);
  if (data.token) setCustomerToken(data.token);
  return data;
}

export async function logoutCustomer() {
  setCustomerToken(null);
}

export async function fetchCurrentCustomer(): Promise<CustomerUser | null> {
  const token = getCustomerToken();
  if (!token) return null;

  const res = await apiFetch('/api/customer-auth', {
    headers: customerAuthHeaders(),
  });

  if (res.status === 401 || res.status === 403) {
    setCustomerToken(null);
    return null;
  }

  const data = await parseAuthResponse(res);
  return data.user || null;
}

export async function updateCustomerProfile(updates: Partial<CustomerUser>) {
  const res = await apiFetch('/api/customer-auth', {
    method: 'PUT',
    headers: customerAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(updates),
  });
  const data = await parseAuthResponse(res);
  return data.user as CustomerUser;
}

export async function requestPasswordReset(email: string) {
  const res = await apiFetch('/api/customer-auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'forgot-password',
      email: email.trim().toLowerCase(),
      origin: typeof window !== 'undefined' ? window.location.origin : '',
    }),
  });
  return parseAuthResponse(res);
}

export async function resetPasswordWithToken(token: string, password: string) {
  const res = await apiFetch('/api/customer-auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'reset-password',
      token,
      password,
    }),
  });
  return parseAuthResponse(res);
}

export async function verifyEmailWithToken(token: string) {
  const res = await apiFetch('/api/customer-auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'verify-email',
      token,
    }),
  });
  const data = await parseAuthResponse(res);
  if (data.token) setCustomerToken(data.token);
  return data;
}

export async function resendVerificationEmail(email: string) {
  const res = await apiFetch('/api/customer-auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'resend-verification',
      email: email.trim().toLowerCase(),
      origin: typeof window !== 'undefined' ? window.location.origin : '',
    }),
  });
  return parseAuthResponse(res);
}
