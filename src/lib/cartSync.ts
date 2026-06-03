import { apiFetch } from './apiUrl';
import { cartHeaders } from './session';
import type { CartItem } from './store';

/** Load cart lines from MongoDB for the current browser session. */
export async function fetchCartFromServer(): Promise<CartItem[]> {
  try {
    const res = await apiFetch('/api/cart', { headers: cartHeaders() });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? (data as CartItem[]) : [];
  } catch {
    return [];
  }
}
