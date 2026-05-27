import { create } from 'zustand';
import type { Ingredient, IngredientCategory } from '../types';
import * as api from '../api/ingredients';

interface CreatePayload {
  name: string;
  category: IngredientCategory;
  unit: string;
  suggested_purchase_location?: number | null;
}

interface IngredientState {
  ingredients: Ingredient[];
  loading: boolean;
  initialized: boolean;
  fetch: () => Promise<void>;
  create: (data: CreatePayload) => Promise<Ingredient>;
  update: (id: number, data: Partial<Ingredient>) => Promise<Ingredient>;
  remove: (id: number) => Promise<void>;
}

export const useIngredientStore = create<IngredientState>((set, get) => ({
  ingredients: [],
  loading: false,
  initialized: false,

  fetch: async () => {
    if (get().initialized) return;
    set({ loading: true });
    const ingredients = await api.getIngredients();
    set({ ingredients, loading: false, initialized: true });
  },

  create: async (data) => {
    const created = await api.createIngredient(data);
    const { useStoreStore } = await import('./storeStore');
    const store = useStoreStore.getState().stores.find(s => s.id === created.suggested_purchase_location) ?? null;
    const enriched = { ...created, store_name: store?.name ?? null };
    set(s => ({ ingredients: [...s.ingredients, enriched] }));
    return enriched;
  },

  update: async (id, data) => {
    const updated = await api.updateIngredient(id, data);
    const { useStoreStore } = await import('./storeStore');
    const store = useStoreStore.getState().stores.find(s => s.id === updated.suggested_purchase_location) ?? null;
    const enriched = { ...updated, store_name: store?.name ?? null };
    set(s => ({ ingredients: s.ingredients.map(i => i.id === id ? enriched : i) }));
    return enriched;
  },

  remove: async (id) => {
    await api.deleteIngredient(id);
    set(s => ({ ingredients: s.ingredients.filter(i => i.id !== id) }));
  },
}));
