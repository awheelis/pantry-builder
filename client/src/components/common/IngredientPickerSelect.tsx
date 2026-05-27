import { useEffect, useState } from 'react';
import type { Ingredient, IngredientCategory } from '../../types';
import { useIngredientStore } from '../../store/ingredientStore';

const CATEGORIES: IngredientCategory[] = ['meat', 'produce', 'dairy', 'dry', 'canned', 'frozen', 'other'];
const CREATE_SENTINEL = '__create__';

interface Props {
  value: string;
  onChange: (id: string, ingredient: Ingredient | null) => void;
  onIngredientCreated?: (ingredient: Ingredient) => void;
  ingredients?: Ingredient[];
  label?: string;
  style?: React.CSSProperties;
}

export default function IngredientPickerSelect({ value, onChange, onIngredientCreated, ingredients: propIngredients, label, style }: Props) {
  const { ingredients: storeIngredients, fetch, create } = useIngredientStore();
  const [creating, setCreating] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createUnit, setCreateUnit] = useState('');
  const [createCategory, setCreateCategory] = useState<IngredientCategory>('other');
  const [createError, setCreateError] = useState('');

  const list = propIngredients ?? storeIngredients;

  useEffect(() => {
    if (!propIngredients) fetch();
  }, []);

  async function handleCreate() {
    if (!createName.trim() || !createUnit.trim()) {
      setCreateError('Name and unit are required');
      return;
    }
    setCreateError('');
    const created = await create({
      name: createName.trim(),
      category: createCategory,
      unit: createUnit.trim(),
      suggested_purchase_location: null,
    });
    setCreating(false);
    setCreateName('');
    setCreateUnit('');
    setCreateCategory('other');
    onChange(String(created.id), created);
    onIngredientCreated?.(created);
  }

  function handleSelectChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value;
    if (val === CREATE_SENTINEL) {
      setCreating(true);
      onChange('', null);
    } else {
      const ing = list.find(i => i.id === Number(val)) ?? null;
      onChange(val, ing);
    }
  }

  return (
    <div style={style}>
      {label && <label>{label}</label>}
      <select value={value} onChange={handleSelectChange}>
        <option value="">Select…</option>
        {list.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
        <option value={CREATE_SENTINEL}>＋ Create new ingredient…</option>
      </select>
      {creating && (
        <div style={{ background: 'var(--bg-subtle, #f5f5f5)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 14px', marginTop: 8 }}>
          <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 8, color: 'var(--text-muted)' }}>NEW INGREDIENT</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div className="field">
              <label>Name</label>
              <input autoFocus value={createName} onChange={e => setCreateName(e.target.value)} placeholder="e.g. Olive oil" />
            </div>
            <div className="field">
              <label>Unit</label>
              <input value={createUnit} onChange={e => setCreateUnit(e.target.value)} placeholder="cups, oz, count…" />
            </div>
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label>Category</label>
              <select value={createCategory} onChange={e => setCreateCategory(e.target.value as IngredientCategory)}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          {createError && <p className="error-msg">{createError}</p>}
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button className="btn-primary" onClick={handleCreate} type="button">Create & select</button>
            <button className="btn-secondary" onClick={() => { setCreating(false); setCreateError(''); }} type="button">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
