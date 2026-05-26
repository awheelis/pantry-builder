import { create } from 'zustand';
import type { StagedRecipe } from '../types';
import * as api from '../api/recipes';

interface StagingState {
  staged: StagedRecipe[];
  loading: boolean;
  fetch: () => Promise<void>;
  stage: (recipeId: number) => Promise<void>;
  updateScale: (stagedId: number, factor: number) => Promise<void>;
  unstage: (stagedId: number) => Promise<void>;
  clearAll: () => Promise<void>;
}

export const useStagingStore = create<StagingState>((set) => ({
  staged: [],
  loading: false,

  fetch: async () => {
    set({ loading: true });
    const staged = await api.getStaged();
    set({ staged, loading: false });
  },

  stage: async (recipeId) => {
    await api.stageRecipe(recipeId);
    const staged = await api.getStaged();
    set({ staged });
  },

  updateScale: async (stagedId, factor) => {
    await api.updateScaleFactor(stagedId, factor);
    const staged = await api.getStaged();
    set({ staged });
  },

  unstage: async (stagedId) => {
    await api.unstageRecipe(stagedId);
    const staged = await api.getStaged();
    set({ staged });
  },

  clearAll: async () => {
    await api.clearStaged();
    set({ staged: [] });
  },
}));
