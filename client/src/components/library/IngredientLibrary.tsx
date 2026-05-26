import { useState, useEffect } from 'react';
import type { Ingredient, IngredientCategory, Store } from '../../types';
import * as api from '../../api/ingredients';
import * as storesApi from '../../api/stores';

const CATEGORIES: IngredientCategory[] = ['meat', 'produce', 'dairy', 'dry', 'canned', 'frozen', 'other'];

function IngredientForm({
  initial,
  stores,
  onSave,
  onCancel,
}: {
  initial?: Ingredient;
  stores: Store[];
  onSave: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [category, setCategory] = useState<IngredientCategory>(initial?.category ?? 'other');
  const [unit, setUnit] = useState(initial?.unit ?? '');
  const [store, setStore] = useState<string>(String(initial?.suggested_purchase_location ?? ''));
  const [error, setError] = useState('');

  async function submit() {
    if (!name.trim() || !unit.trim()) { setError('Name and unit are required'); return; }
    setError('');
    const data = { name: name.trim(), category, unit: unit.trim(), suggested_purchase_location: store ? Number(store) : null };
    if (initial?.id) {
      await api.updateIngredient(initial.id, data);
    } else {
      await api.createIngredient(data);
    }
    onSave();
  }

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div className="field">
          <label>Name</label>
          <input value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div className="field">
          <label>Unit</label>
          <input value={unit} onChange={e => setUnit(e.target.value)} placeholder="cups, oz, count…" />
        </div>
        <div className="field">
          <label>Category</label>
          <select value={category} onChange={e => setCategory(e.target.value as IngredientCategory)}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Store</label>
          <select value={store} onChange={e => setStore(e.target.value)}>
            <option value="">None</option>
            {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>
      {error && <p className="error-msg">{error}</p>}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button className="btn-secondary" onClick={onCancel}>Cancel</button>
        <button className="btn-primary" onClick={submit}>Save</button>
      </div>
    </div>
  );
}

export default function IngredientLibrary() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  async function load() {
    const [ings, ss] = await Promise.all([api.getIngredients(), storesApi.getStores()]);
    setIngredients(ings);
    setStores(ss);
  }

  useEffect(() => { load(); }, []);

  const filtered = ingredients.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));

  async function remove(id: number) {
    await api.deleteIngredient(id);
    load();
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontWeight: 600 }}>Ingredients</div>
        <button className="btn-primary" onClick={() => { setShowForm(true); setEditId(null); }}>+ New Ingredient</button>
      </div>
      {showForm && editId === null && (
        <IngredientForm stores={stores} onSave={() => { setShowForm(false); load(); }} onCancel={() => setShowForm(false)} />
      )}
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search ingredients…" style={{ marginBottom: 12 }} />
      {filtered.map(ing => (
        <div key={ing.id}>
          {editId === ing.id ? (
            <IngredientForm
              initial={ing}
              stores={stores}
              onSave={() => { setEditId(null); load(); }}
              onCancel={() => setEditId(null)}
            />
          ) : (
            <div className="card" style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px' }}>
              <div style={{ flex: 1 }}>
                <span style={{ fontWeight: 500 }}>{ing.name}</span>
                <span style={{ marginLeft: 10 }} className="badge badge-category">{ing.category}</span>
                {ing.store_name && <span style={{ marginLeft: 6 }} className="badge badge-store">{ing.store_name}</span>}
              </div>
              <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{ing.unit}</span>
              <button className="btn-ghost" onClick={() => setEditId(ing.id)}>Edit</button>
              <button className="btn-danger" onClick={() => remove(ing.id)}>Delete</button>
            </div>
          )}
        </div>
      ))}
      {filtered.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No ingredients found.</p>}
    </div>
  );
}
