import { create } from 'zustand';
import type { GroceryItem } from '../types';
import * as api from '../api/grocery';

interface GroceryState {
  items: GroceryItem[];
  categoryFilter: string;
  storeFilter: string;
  loading: boolean;
  fetch: () => Promise<void>;
  toggle: (id: number) => Promise<void>;
  setCategoryFilter: (v: string) => void;
  setStoreFilter: (v: string) => void;
}

export const useGroceryStore = create<GroceryState>((set, get) => ({
  items: [],
  categoryFilter: '',
  storeFilter: '',
  loading: false,

  fetch: async () => {
    set({ loading: true });
    const { categoryFilter, storeFilter } = get();
    const items = await api.getGrocery({
      category: categoryFilter || undefined,
      store: storeFilter || undefined,
    });
    set({ items, loading: false });
  },

  toggle: async (id) => {
    const updated = await api.togglePurchase(id);
    set((s) => ({
      items: s.items.map((i) => (i.id === id ? { ...i, is_purchased: updated.is_purchased } : i)),
    }));
  },

  setCategoryFilter: (v) => set({ categoryFilter: v }),
  setStoreFilter: (v) => set({ storeFilter: v }),
}));
