import { create } from 'zustand';
import type { Store } from '../types';
import * as api from '../api/stores';

interface StoreState {
  stores: Store[];
  loading: boolean;
  initialized: boolean;
  fetch: () => Promise<void>;
  create: (name: string) => Promise<Store>;
  update: (id: number, name: string) => Promise<Store>;
  remove: (id: number) => Promise<void>;
}

export const useStoreStore = create<StoreState>((set, get) => ({
  stores: [],
  loading: false,
  initialized: false,

  fetch: async () => {
    if (get().initialized) return;
    set({ loading: true });
    const stores = await api.getStores();
    set({ stores, loading: false, initialized: true });
  },

  create: async (name) => {
    const created = await api.createStore(name);
    set(s => ({ stores: [...s.stores, created] }));
    return created;
  },

  update: async (id, name) => {
    const updated = await api.updateStore(id, name);
    set(s => ({ stores: s.stores.map(st => st.id === id ? updated : st) }));
    // Store rename makes ingredient store_name badges stale — force re-sync
    const { useIngredientStore } = await import('./ingredientStore');
    useIngredientStore.setState({ initialized: false });
    await useIngredientStore.getState().fetch();
    return updated;
  },

  remove: async (id) => {
    await api.deleteStore(id);
    set(s => ({ stores: s.stores.filter(st => st.id !== id) }));
    // Store deletion NULLs out suggested_purchase_location on ingredients in DB
    const { useIngredientStore } = await import('./ingredientStore');
    useIngredientStore.setState({ initialized: false });
    await useIngredientStore.getState().fetch();
  },
}));
