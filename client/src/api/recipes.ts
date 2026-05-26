import { apiFetch } from './client';
import type { Recipe, RecipeWithIngredients, RecipeIngredient, StagedRecipe, Breakdown } from '../types';

export const getRecipes = (q?: string) =>
  apiFetch<Recipe[]>(`/api/recipes${q ? `?q=${encodeURIComponent(q)}` : ''}`);

export const getRecipe = (id: number) =>
  apiFetch<RecipeWithIngredients>(`/api/recipes/${id}`);

export const createRecipe = (data: Omit<Recipe, 'id'>) =>
  apiFetch<Recipe>('/api/recipes', { method: 'POST', body: JSON.stringify(data) });

export const updateRecipe = (id: number, data: Partial<Omit<Recipe, 'id'>>) =>
  apiFetch<Recipe>(`/api/recipes/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const deleteRecipe = (id: number) =>
  apiFetch<void>(`/api/recipes/${id}`, { method: 'DELETE' });

export const getRecipeIngredients = (recipeId: number) =>
  apiFetch<RecipeIngredient[]>(`/api/recipes/${recipeId}/ingredients`);

export const addRecipeIngredient = (recipeId: number, data: { ingredient_id: number; amount: number; unit: string }) =>
  apiFetch<RecipeIngredient>(`/api/recipes/${recipeId}/ingredients`, { method: 'POST', body: JSON.stringify(data) });

export const updateRecipeIngredient = (recipeId: number, riId: number, data: { amount?: number; unit?: string }) =>
  apiFetch<RecipeIngredient>(`/api/recipes/${recipeId}/ingredients/${riId}`, { method: 'PUT', body: JSON.stringify(data) });

export const removeRecipeIngredient = (recipeId: number, riId: number) =>
  apiFetch<void>(`/api/recipes/${recipeId}/ingredients/${riId}`, { method: 'DELETE' });

export const substituteIngredient = (recipeId: number, riId: number, newIngredientId: number) =>
  apiFetch<RecipeIngredient>(`/api/recipes/${recipeId}/ingredients/${riId}/substitute`, {
    method: 'POST',
    body: JSON.stringify({ new_ingredient_id: newIngredientId }),
  });

export const revertSubstitution = (recipeId: number, riId: number) =>
  apiFetch<RecipeIngredient>(`/api/recipes/${recipeId}/ingredients/${riId}/revert`, { method: 'POST' });

export const getStaged = () => apiFetch<StagedRecipe[]>('/api/staged');

export const stageRecipe = (recipeId: number) =>
  apiFetch<StagedRecipe>('/api/staged', { method: 'POST', body: JSON.stringify({ recipe_id: recipeId }) });

export const updateScaleFactor = (stagedId: number, scaleFactor: number) =>
  apiFetch<StagedRecipe>(`/api/staged/${stagedId}`, { method: 'PUT', body: JSON.stringify({ scale_factor: scaleFactor }) });

export const unstageRecipe = (stagedId: number) =>
  apiFetch<void>(`/api/staged/${stagedId}`, { method: 'DELETE' });

export const clearStaged = () =>
  apiFetch<void>('/api/staged', { method: 'DELETE' });

export const getBreakdown = (stagedId: number) =>
  apiFetch<Breakdown>(`/api/staged/${stagedId}/breakdown`);
