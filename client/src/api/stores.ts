import { apiFetch } from './client';
import type { Store } from '../types';

export const getStores = () => apiFetch<Store[]>('/api/stores');
export const createStore = (name: string) =>
  apiFetch<Store>('/api/stores', { method: 'POST', body: JSON.stringify({ name }) });
export const updateStore = (id: number, name: string) =>
  apiFetch<Store>(`/api/stores/${id}`, { method: 'PUT', body: JSON.stringify({ name }) });
export const deleteStore = (id: number) =>
  apiFetch<void>(`/api/stores/${id}`, { method: 'DELETE' });
