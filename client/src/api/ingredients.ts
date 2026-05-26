import { apiFetch } from './client';
import type { Ingredient, IngredientCategory } from '../types';

export const getIngredients = (params?: { category?: string; store?: string }) => {
  const q = new URLSearchParams(params as Record<string, string>).toString();
  return apiFetch<Ingredient[]>(`/api/ingredients${q ? `?${q}` : ''}`);
};

export const createIngredient = (data: {
  name: string;
  category: IngredientCategory;
  unit: string;
  suggested_purchase_location?: number | null;
}) => apiFetch<Ingredient>('/api/ingredients', { method: 'POST', body: JSON.stringify(data) });

export const updateIngredient = (id: number, data: Partial<Ingredient>) =>
  apiFetch<Ingredient>(`/api/ingredients/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const deleteIngredient = (id: number) =>
  apiFetch<void>(`/api/ingredients/${id}`, { method: 'DELETE' });
