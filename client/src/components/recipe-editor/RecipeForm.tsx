import { useState, useEffect } from 'react';
import type { Recipe, RecipeIngredient, Ingredient } from '../../types';
import * as recipesApi from '../../api/recipes';
import * as ingredientsApi from '../../api/ingredients';
import RatingStars from '../common/RatingStars';
import IngredientPickerSelect from '../common/IngredientPickerSelect';

interface Props {
  recipe?: Recipe & { ingredients?: RecipeIngredient[] };
  onSave: () => void;
  onClose: () => void;
}

export default function RecipeForm({ recipe, onSave, onClose }: Props) {
  const [name, setName] = useState(recipe?.name ?? '');
  const [description, setDescription] = useState(recipe?.description ?? '');
  const [servingSize, setServingSize] = useState(String(recipe?.serving_size ?? 1));
  const [easeRating, setEaseRating] = useState<number | null>(recipe?.ease_rating ?? null);
  const [deliciousnessRating, setDeliciousnessRating] = useState<number | null>(recipe?.deliciousness_rating ?? null);
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);
  const [allIngredients, setAllIngredients] = useState<Ingredient[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    ingredientsApi.getIngredients().then(setAllIngredients);
    if (recipe?.id) {
      recipesApi.getRecipeIngredients(recipe.id).then(setIngredients);
    }
  }, [recipe?.id]);

  async function handleSave() {
    if (!name.trim()) { setError('Name is required'); return; }
    setSaving(true);
    setError('');
    try {
      if (recipe?.id) {
        await recipesApi.updateRecipe(recipe.id, {
          name: name.trim(),
          description: description || null,
          serving_size: Number(servingSize) || 1,
          ease_rating: easeRating,
          deliciousness_rating: deliciousnessRating,
        });
      } else {
        const created = await recipesApi.createRecipe({
          name: name.trim(),
          description: description || null,
          serving_size: Number(servingSize) || 1,
          ease_rating: easeRating,
          deliciousness_rating: deliciousnessRating,
        });
        // add any pending ingredients to the new recipe
        for (const ing of pendingIngredients) {
          await recipesApi.addRecipeIngredient(created.id, {
            ingredient_id: ing.ingredient_id,
            amount: ing.amount,
            unit: ing.unit,
          });
        }
      }
      onSave();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  // For new recipes, accumulate ingredients before save
  const [pendingIngredients, setPendingIngredients] = useState<{ ingredient_id: number; amount: number; unit: string; ingredient_name: string }[]>([]);
  const [newIngId, setNewIngId] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newUnit, setNewUnit] = useState('');

  async function handleAddIngredient() {
    if (!newIngId || !newAmount || !newUnit.trim()) return;
    if (recipe?.id) {
      await recipesApi.addRecipeIngredient(recipe.id, {
        ingredient_id: Number(newIngId),
        amount: Number(newAmount),
        unit: newUnit.trim(),
      });
      const updated = await recipesApi.getRecipeIngredients(recipe.id);
      setIngredients(updated);
    } else {
      const ing = allIngredients.find(i => i.id === Number(newIngId));
      if (ing) {
        setPendingIngredients(p => [...p, { ingredient_id: ing.id, amount: Number(newAmount), unit: newUnit.trim(), ingredient_name: ing.name }]);
      }
    }
    setNewIngId('');
    setNewAmount('');
    setNewUnit('');
  }

  async function handleRemoveIngredient(riId: number) {
    if (!recipe?.id) return;
    await recipesApi.removeRecipeIngredient(recipe.id, riId);
    setIngredients(i => i.filter(x => x.id !== riId));
  }

  const displayIngredients = recipe?.id
    ? ingredients
    : pendingIngredients.map((p, i) => ({ ...p, id: -i, recipe_id: 0, category: 'other' as const, default_unit: p.unit, is_substituted: 0 as const, original_ingredient_id: null, original_ingredient_name: null }));

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{recipe?.id ? 'Edit Recipe' : 'New Recipe'}</h2>
          <button className="btn-ghost" onClick={onClose}>✕</button>
        </div>

        <div className="field">
          <label>Name</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Recipe name" />
        </div>
        <div className="field">
          <label>Description / notes</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="e.g. See page 42 of The Silver Spoon" />
        </div>
        <div className="field">
          <label>Serving size</label>
          <input type="number" min="0.25" step="0.25" value={servingSize} onChange={e => setServingSize(e.target.value)} style={{ width: 100 }} />
        </div>
        <div className="field" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <RatingStars value={easeRating} onChange={setEaseRating} label="Ease" />
          <RatingStars value={deliciousnessRating} onChange={setDeliciousnessRating} label="Taste" />
        </div>

        <div style={{ marginTop: 16, marginBottom: 8, fontWeight: 600, fontSize: 13 }}>Ingredients</div>
        {displayIngredients.map(ri => (
          <div key={ri.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ flex: 1 }}>{ri.ingredient_name}</span>
            <span style={{ color: 'var(--text-muted)' }}>{ri.amount} {ri.unit}</span>
            {recipe?.id && (
              <button className="btn-ghost" style={{ color: 'var(--danger)' }} onClick={() => handleRemoveIngredient(ri.id)}>✕</button>
            )}
          </div>
        ))}
        <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'flex-end' }}>
          <IngredientPickerSelect
            value={newIngId}
            ingredients={allIngredients}
            onChange={(id, ing) => {
              setNewIngId(id);
              if (ing) setNewUnit(ing.unit);
            }}
            onIngredientCreated={(ing) => {
              setAllIngredients(prev => [...prev, ing]);
              setNewIngId(String(ing.id));
              setNewUnit(ing.unit);
            }}
            label="Ingredient"
            style={{ flex: 2 }}
          />
          <div style={{ flex: 1 }}>
            <label>Amount</label>
            <input type="number" min="0" step="any" value={newAmount} onChange={e => setNewAmount(e.target.value)} />
          </div>
          <div style={{ flex: 1 }}>
            <label>Unit</label>
            <input value={newUnit} onChange={e => setNewUnit(e.target.value)} />
          </div>
          <button className="btn-secondary" onClick={handleAddIngredient} type="button">Add</button>
        </div>

        {error && <p className="error-msg">{error}</p>}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
