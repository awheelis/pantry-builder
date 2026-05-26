import { useState, useEffect } from 'react';
import type { Recipe } from '../../types';
import { getRecipes, deleteRecipe } from '../../api/recipes';
import { useStagingStore } from '../../store/stagingStore';
import { useGroceryStore } from '../../store/groceryStore';
import StagedRecipeCard from './StagedRecipeCard';
import RecipeForm from '../recipe-editor/RecipeForm';
import ConfirmDialog from '../common/ConfirmDialog';
import RatingStars from '../common/RatingStars';

type SortKey = 'name' | 'ease' | 'taste';

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

  const [mobilePanel, setMobilePanel] = useState<'archive' | 'staging'>('archive');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const stagedRecipeIds = new Set(staged.map(s => s.recipe_id));
  const filtered = recipes
    .filter(r => r.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortKey === 'name') return a.name.localeCompare(b.name);
      if (sortKey === 'ease') return (b.ease_rating ?? 0) - (a.ease_rating ?? 0);
      return (b.deliciousness_rating ?? 0) - (a.deliciousness_rating ?? 0);
    });

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
    <div className="plan-grid">
      {/* Mobile toggle */}
      <div className="plan-toggle" style={{ gridColumn: '1 / -1' }}>
        <button className={mobilePanel === 'archive' ? 'active' : ''} onClick={() => setMobilePanel('archive')}>Archive</button>
        <button className={mobilePanel === 'staging' ? 'active' : ''} onClick={() => setMobilePanel('staging')}>
          Staging{staged.length > 0 ? ` (${staged.length})` : ''}
        </button>
      </div>

      {/* Left: Archive */}
      <div className={mobilePanel !== 'archive' ? 'plan-panel--hidden' : ''}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700 }}>Recipe Archive</h2>
          <button className="btn-primary" onClick={() => { setEditRecipe(null); setShowForm(true); }}>+ New Recipe</button>
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search recipes…"
            style={{ flex: '1 1 140px', minWidth: 0, marginBottom: 0 }}
          />
          <select value={sortKey} onChange={e => setSortKey(e.target.value as SortKey)} style={{ flex: '0 0 auto', width: 110 }}>
            <option value="name">A–Z</option>
            <option value="ease">Ease ★</option>
            <option value="taste">Taste ★</option>
          </select>
        </div>
        {filtered.map(r => (
          <div key={r.id} className="card" style={{ marginBottom: 8, padding: '10px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500 }}>{r.name}</div>
                {r.description && (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{r.description}</div>
                )}
                <div style={{ marginTop: 4 }}>
                  <RatingStars value={r.ease_rating ?? null} label="Ease" />
                  <RatingStars value={r.deliciousness_rating ?? null} label="Taste" />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
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
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No recipes yet.</p>}
      </div>

      {/* Right: Staging area */}
      <div className={mobilePanel !== 'staging' ? 'plan-panel--hidden' : ''}>
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
