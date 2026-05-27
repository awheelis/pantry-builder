import { useEffect, useState } from 'react';
import type { RecipeIngredient, StagedRecipe } from '../../types';
import * as recipesApi from '../../api/recipes';
import { useIngredientStore } from '../../store/ingredientStore';
import { useGroceryStore } from '../../store/groceryStore';

interface Props {
  staged: StagedRecipe;
  onClose: () => void;
}

export default function IngredientSubstitutor({ staged, onClose }: Props) {
  const [ris, setRis] = useState<RecipeIngredient[]>([]);
  const { ingredients: allIngredients, fetch: fetchIngredients } = useIngredientStore();
  const fetchGrocery = useGroceryStore(s => s.fetch);

  useEffect(() => {
    recipesApi.getRecipeIngredients(staged.recipe_id).then(setRis);
    fetchIngredients();
  }, [staged.recipe_id]);

  async function substitute(riId: number, newIngId: number) {
    const updated = await recipesApi.substituteIngredient(staged.recipe_id, riId, newIngId);
    setRis(prev => prev.map(r => r.id === riId ? (updated as RecipeIngredient) : r));
    fetchGrocery();
  }

  async function revert(riId: number) {
    const updated = await recipesApi.revertSubstitution(staged.recipe_id, riId);
    setRis(prev => prev.map(r => r.id === riId ? (updated as RecipeIngredient) : r));
    fetchGrocery();
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{staged.recipe_name} — Ingredients</h2>
          <button className="btn-ghost" onClick={onClose}>✕</button>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>
          Swap any ingredient with one from your library. Original is tracked for reference.
        </p>
        {ris.map(ri => (
          <div key={ri.id} className="card" style={{ marginBottom: 10, padding: '10px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: ri.is_substituted ? 8 : 0 }}>
              <span style={{ flex: 1, fontWeight: 500 }}>{ri.ingredient_name}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{ri.amount} {ri.unit}</span>
              {ri.is_substituted && (
                <span className="badge badge-sub">subbed</span>
              )}
            </div>
            {ri.is_substituted && ri.original_ingredient_name && (
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                Original: <span className="strikethrough">{ri.original_ingredient_name}</span>
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <select
                defaultValue=""
                onChange={e => {
                  if (e.target.value) substitute(ri.id, Number(e.target.value));
                  e.target.value = '';
                }}
                style={{ flex: 1 }}
              >
                <option value="">Swap with…</option>
                {allIngredients
                  .filter(i => i.id !== ri.ingredient_id)
                  .map(i => <option key={i.id} value={i.id}>{i.name}</option>)
                }
              </select>
              {ri.is_substituted && (
                <button className="btn-secondary" style={{ whiteSpace: 'nowrap' }} onClick={() => revert(ri.id)}>
                  Restore original
                </button>
              )}
            </div>
          </div>
        ))}
        <div style={{ textAlign: 'right', marginTop: 12 }}>
          <button className="btn-primary" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}
