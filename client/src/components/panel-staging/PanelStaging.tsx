import { useState, useEffect } from 'react';
import type { Recipe } from '../../types';
import { getRecipes, deleteRecipe } from '../../api/recipes';
import { useStagingStore } from '../../store/stagingStore';
import { useGroceryStore } from '../../store/groceryStore';
import StagedRecipeCard from './StagedRecipeCard';
import RecipeForm from '../recipe-editor/RecipeForm';
import ConfirmDialog from '../common/ConfirmDialog';

export default function PanelStaging() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editRecipe, setEditRecipe] = useState<Recipe | null>(null);
  const [deleteRecipeId, setDeleteRecipeId] = useState<number | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const { staged, fetch: fetchStaged, stage, clearAll } = useStagingStore();
  const fetchGrocery = useGroceryStore(s => s.fetch);

  async function loadRecipes(q?: string) {
    setRecipes(await getRecipes(q));
  }

  useEffect(() => {
    loadRecipes();
    fetchStaged();
  }, []);

  const stagedRecipeIds = new Set(staged.map(s => s.recipe_id));
  const filtered = recipes.filter(r => r.name.toLowerCase().includes(search.toLowerCase()));

  async function handleStage(recipeId: number) {
    await stage(recipeId);
    await fetchGrocery();
  }

  async function handleDeleteRecipe(id: number) {
    await deleteRecipe(id);
    setDeleteRecipeId(null);
    loadRecipes(search || undefined);
    fetchStaged();
    fetchGrocery();
  }

  async function handleClearAll() {
    await clearAll();
    await fetchGrocery();
    setConfirmClear(false);
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, maxWidth: 1100, margin: '0 auto' }}>
      {/* Left: Archive */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700 }}>Recipe Archive</h2>
          <button className="btn-primary" onClick={() => { setEditRecipe(null); setShowForm(true); }}>+ New Recipe</button>
        </div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search recipes…"
          style={{ marginBottom: 12 }}
        />
        {filtered.map(r => (
          <div key={r.id} className="card" style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 500 }}>{r.name}</div>
              {r.description && (
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{r.description}</div>
              )}
            </div>
            <button className="btn-ghost" onClick={() => { setEditRecipe(r); setShowForm(true); }}>Edit</button>
            <button className="btn-danger" onClick={() => setDeleteRecipeId(r.id)}>Delete</button>
            <button
              className={stagedRecipeIds.has(r.id) ? 'btn-secondary' : 'btn-primary'}
              disabled={stagedRecipeIds.has(r.id)}
              onClick={() => handleStage(r.id)}
            >
              {stagedRecipeIds.has(r.id) ? 'Staged' : 'Stage'}
            </button>
          </div>
        ))}
        {filtered.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No recipes yet.</p>}
      </div>

      {/* Right: Staging area */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700 }}>Staging Area</h2>
          {staged.length > 0 && (
            <button className="btn-danger" onClick={() => setConfirmClear(true)}>Clear all</button>
          )}
        </div>
        {staged.map(s => <StagedRecipeCard key={s.id} staged={s} />)}
        {staged.length === 0 && (
          <p style={{ color: 'var(--text-muted)' }}>Stage recipes from the archive to build your grocery list.</p>
        )}
      </div>

      {showForm && (
        <RecipeForm
          recipe={editRecipe ?? undefined}
          onSave={() => { setShowForm(false); loadRecipes(search || undefined); }}
          onClose={() => setShowForm(false)}
        />
      )}
      {deleteRecipeId !== null && (
        <ConfirmDialog
          message="Delete this recipe? This cannot be undone."
          onConfirm={() => handleDeleteRecipe(deleteRecipeId)}
          onCancel={() => setDeleteRecipeId(null)}
        />
      )}
      {confirmClear && (
        <ConfirmDialog
          message="Unstage all recipes and clear the grocery list?"
          onConfirm={handleClearAll}
          onCancel={() => setConfirmClear(false)}
        />
      )}
    </div>
  );
}
