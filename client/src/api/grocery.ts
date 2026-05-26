import { apiFetch } from './client';
import type { GroceryItem } from '../types';

export const getGrocery = (params?: { category?: string; store?: string }) => {
  const q = new URLSearchParams(
    Object.fromEntries(Object.entries(params ?? {}).filter(([, v]) => v != null)) as Record<string, string>
  ).toString();
  return apiFetch<GroceryItem[]>(`/api/grocery${q ? `?${q}` : ''}`);
};

export const rebuildGrocery = () =>
  apiFetch<{ ok: boolean }>('/api/grocery/rebuild', { method: 'POST' });

export const togglePurchase = (id: number) =>
  apiFetch<GroceryItem>(`/api/grocery/${id}/purchase`, { method: 'PATCH' });
